import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { BaseService } from 'src/base/base.service';
import { UserStatus } from 'src/constants/user-status';
import { hashToken } from 'src/helper/hash-token';
import { successResponse } from 'src/helper/response.helper';
import { MailService } from 'src/mail/services';
import { RefreshToken } from 'src/v1/entities/refresh_tokens.entity';
import { User } from 'src/v1/entities/user.entity';
import { DataSource, IsNull, QueryRunner, Repository } from 'typeorm';
import { Profile } from '../entities/profile.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { ProfileDataDto } from './dto/profile-data.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { UpdateNewPasswordDto } from './dto/update-new-password.dto';

@Injectable()
export class UserService extends BaseService {
  protected filterableColumns: any;
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
    @InjectRepository(Profile)
    private readonly profileRepo: Repository<Profile>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
    private dataSource: DataSource,
    private readonly mailService: MailService,
  ) {
    super(userRepo);
  }

  async register(createUserDto: CreateUserDto) {
    const { email, password } = createUserDto;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const existing = await queryRunner.manager.findOne(User, {
        where: { email },
      });
      if (existing) {
        throw new BadRequestException('Email already exists');
      }

      // Hash mật khẩu
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = queryRunner.manager.create(User, {
        ...createUserDto,
        password: hashedPassword,
        status: UserStatus.INACTIVE,
      });

      const saved = await queryRunner.manager.save(User, user);

      delete saved.password;

      await this.mailService.queueRegisterMail({
        email: user.email,
      });

      await queryRunner.commitTransaction();

      return successResponse(saved);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async login(
    data: LoginUserDto,
    clientInfo: {
      ip: string;
      userAgent: string;
    },
  ) {
    const { email, password } = data;

    const user = await this.userRepo.findOne({
      where: { email },
      relations: ['user_roles.role.role_permissions.permission'],
      select: ['id', 'email', 'password', 'status'],
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new BadRequestException('User is not active');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new BadRequestException('Invalid credentials');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      /** Revoke all refresh token in userAgent */
      await queryRunner.manager.update(
        RefreshToken,
        {
          user_id: user.id,
          device_info: clientInfo.userAgent,
          revoked_at: IsNull(),
        },
        {
          revoked_at: new Date(),
        },
      );

      /**Create and generate access_token and refresh_token */
      const { access_token, refresh_token } = await this.createAndGenNewToken(
        queryRunner,
        user,
        clientInfo,
      );

      /** Update last_login_at */
      user.last_login_at = new Date();

      await queryRunner.manager.save(user);

      await queryRunner.commitTransaction();

      return { access_token, refresh_token };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async refreshToken(
    data: RefreshTokenDto,
    clientInfo: { ip: string; userAgent: string },
  ) {
    const payload = await this.jwtService.verifyAsync(data.refresh_token);

    if (!payload) {
      throw new BadRequestException('Invalid refresh token');
    }

    const tokenHash = hashToken(data.refresh_token);

    const rt = await this.refreshTokenRepo.findOne({
      where: {
        token_hash: tokenHash,
        revoked_at: IsNull(),
      },
    });

    /**Check expires token */
    if (!rt || rt.expires_at < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    const user = await this.userRepo.findOne({
      where: {
        id: payload.sub,
      },
      relations: ['user_roles.role.role_permissions.permission'],
    });

    /** Check user active */
    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException();
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      /** Revoke refresh token */
      await queryRunner.manager.update(RefreshToken, rt.id, {
        revoked_at: new Date(),
      });

      const { access_token, refresh_token } = await this.createAndGenNewToken(
        queryRunner,
        user,
        clientInfo,
      );

      await queryRunner.commitTransaction();

      return { access_token, refresh_token };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async createAndGenNewToken(
    queryRunner: QueryRunner,
    user: User,
    clientInfo: { ip: string; userAgent: string },
  ) {
    const { access_token, refresh_token } = this.generateToken(user);

    await queryRunner.manager.save(
      queryRunner.manager.create(RefreshToken, {
        user_id: user.id,
        token_hash: hashToken(refresh_token),
        ip_address: clientInfo.ip,
        device_info: clientInfo.userAgent,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      }),
    );

    return { access_token, refresh_token };
  }

  generateToken(user: User) {
    const accessToken = this.jwtService.sign(
      {
        userId: user.id,
        email: user.email,
        user_roles: user.user_roles,
      },
      { expiresIn: '15m' },
    );

    const newRefreshToken = this.jwtService.sign(
      { sub: user.id, email: user.email },
      { expiresIn: '7d' },
    );

    return {
      access_token: accessToken,
      refresh_token: newRefreshToken,
    };
  }

  async search(id: number): Promise<User> {
    const user = await this.userRepo
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.first_name',
        'user.last_name',
        'user.email',
        'user.phone',
        'user.avatar',
        'user.status',
        'user.role',
      ])
      .where('user.id = :id', { id })
      .getOne();

    if (!user) {
      throw new BadRequestException('User not found');
    }

    return user;
  }

  async updateUser(id: number, updateUserDto: CreateUserDto): Promise<User> {
    const user = await this.search(id);

    Object.assign(user, updateUserDto);

    return this.userRepo.save(user);
  }

  async getMe(userId: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: [
        'profile',
        'user_roles',
        'user_roles.role',
        'user_roles.role.role_permissions',
        'user_roles.role.role_permissions.permission',
      ],
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    return successResponse(this.formatDataUser(user));
  }

  formatDataUser(user: User) {
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      status: user.status,
      profile: user.profile,
      user_roles: user.user_roles.map((ur) => ({
        role: {
          id: ur.role.id,
          name: ur.role.name,
          permissions: ur.role.role_permissions.map((rp) => ({
            code: rp.permission.code,
          })),
        },
      })),
    };
  }

  /**Reset password */
  async requestPasswordReset(email: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = await queryRunner.manager.findOne(User, {
        where: { email: email, status: UserStatus.ACTIVE },
        select: ['id', 'email', 'status'],
        relations: ['profile'],
      });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const resetToken = randomBytes(32).toString('hex');
      const resetExpire = new Date(Date.now() + 60 * 60 * 1000);
      user.reset_token = resetToken;
      user.reset_token_expires_at = resetExpire;

      await queryRunner.manager.save(user);

      await this.mailService.enqueueResetPasswordMail({
        email: user.email,
        resetToken,
        name: user.profile.full_name,
        resetExpire: resetExpire,
      });

      await queryRunner.commitTransaction();

      return { message: 'Email reset password send successfully' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updateNewPassword(data: UpdateNewPasswordDto, reset_token: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const user = await queryRunner.manager.findOne(User, {
        where: { reset_token: reset_token },
        select: ['id', 'reset_token_expires_at', 'reset_token', 'password'],
      });

      if (!user) {
        return new NotFoundException('User not found with reset token');
      }

      if (user.reset_token_expires_at < new Date()) {
        throw new UnauthorizedException('Reset password token is expired');
      }

      const newPassword = await bcrypt.hash(data.new_password, 10);
      user.password = newPassword;
      user.reset_token = null;
      user.reset_token_expires_at = null;
      await queryRunner.manager.save(User, user);

      await queryRunner.commitTransaction();

      return successResponse([], 'Update new password successfully');
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   *
   * @param profileData
   * @param req
   * @returns new profile data
   */
  async updateProfile(profileData: ProfileDataDto, req: { user: User }) {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { full_name, avatar_url, bio, timezone, language } = profileData;
      const user = req.user;
      const profile = await this.profileRepo.findOneBy({ user_id: user.id });
      Object.assign(profile, {
        full_name,
        avatar_url,
        bio,
        timezone,
        language,
      });

      await queryRunner.manager.save(Profile, profile);

      await queryRunner.commitTransaction();

      return successResponse(profile, 'Update info user successfully');
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
