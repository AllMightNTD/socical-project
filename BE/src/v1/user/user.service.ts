import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { BaseService } from 'src/base/base.service';
import { UserStatus } from 'src/constants/enums';
import { DataSource, Repository } from 'typeorm';
import { GroupMember } from '../entities/group_member.entity';
import { Profile } from '../entities/profile.entity';
import { RefreshToken } from '../entities/refresh_token.entity';
import { User } from '../entities/user.entity';
import { UserPresence } from '../entities/user_presence.entity';
import { UserSettings } from '../entities/user_settings.entity';
import { UserStats } from '../entities/user_stats.entity';
import { Conversation } from '../entities/conversation.entity';
import { ConversationParticipant } from '../entities/conversation_participant.entity';
import { ConversationType } from 'src/constants/enums';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class UserService extends BaseService {
  protected filterableColumns: any;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private readonly dataSource: DataSource,
    private readonly jwtService: JwtService,
    @InjectRepository(GroupMember)
    private readonly groupMemberRepository: Repository<GroupMember>,
    @InjectRepository(Conversation)
    private readonly conversationRepo: Repository<Conversation>,
    @InjectRepository(ConversationParticipant)
    private readonly participantRepo: Repository<ConversationParticipant>,
  ) {
    super(userRepository);
  }

  async register(registerDto: RegisterDto) {
    const { email, password, full_name, username, phone } = registerDto;

    const existingUser = await this.userRepository.findOne({ where: [{ email }, { phone }] });
    if (existingUser) {
      throw new BadRequestException('Email or phone already exists');
    }

    const existingProfile = await this.dataSource.getRepository(Profile).findOne({ where: { username } });
    if (existingProfile) {
      throw new BadRequestException('Username is already taken');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Create User
      const user = queryRunner.manager.create(User, {
        email,
        phone,
        password: hashedPassword,
        status: UserStatus.ACTIVE,
      });
      await queryRunner.manager.save(user);

      // 2. Create Profile
      const profile = queryRunner.manager.create(Profile, {
        user_id: user.id,
        full_name,
        username,
      });
      await queryRunner.manager.save(profile);

      // 3. Create Settings
      const settings = queryRunner.manager.create(UserSettings, {
        user_id: user.id,
      });
      await queryRunner.manager.save(settings);

      // 4. Create Stats
      const stats = queryRunner.manager.create(UserStats, {
        user_id: user.id,
      });
      await queryRunner.manager.save(stats);

      // 5. Create Presence
      const presence = queryRunner.manager.create(UserPresence, {
        user_id: user.id,
        last_seen_at: new Date(),
      });
      await queryRunner.manager.save(presence);

      await queryRunner.commitTransaction();

      // Return user without password
      delete user.password;
      return user;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async login(loginDto: LoginDto) {
    const { emailOrPhone, password } = loginDto;

    const user = await this.userRepository.findOne({
      where: [
        { email: emailOrPhone },
        { phone: emailOrPhone },
      ],
      select: [
        'id',
        'email',
        'phone',
        'password',
        'status',
      ],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException(
        'User account is not active',
      );
    }

    const payload = {
      sub: user.id,
      email: user.email,
    };

    const accessToken = this.jwtService.sign(payload);

    const refreshTokenString = this.jwtService.sign(payload, {
      expiresIn: '7d',
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const refreshTokenHash = await bcrypt.hash(
      refreshTokenString,
      10,
    );

    const refreshToken =
      this.refreshTokenRepository.create({
        user_id: user.id,
        token_hash: refreshTokenHash,
        expires_at: expiresAt,
        device_info: 'Unknown Device',
        ip_address: '127.0.0.1',
      });

    await this.refreshTokenRepository.save(refreshToken);

    delete user.password;

    return {
      user,
      accessToken,
      refreshToken: refreshTokenString,
    };
  }

  async getMe(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['profile', 'settings', 'stats', 'user_roles', 'user_roles.role', 'user_roles.role.role_permissions', 'user_roles.role.role_permissions.permission'],
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    delete user.password;
    return user;
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const profileRepo = this.dataSource.getRepository(Profile);
    const profile = await profileRepo.findOne({ where: { user_id: userId } });
    if (!profile) {
      throw new BadRequestException('Profile not found');
    }

    Object.assign(profile, updateProfileDto);
    return profileRepo.save(profile);
  }

  async updateSettings(userId: string, updateSettingsDto: UpdateSettingsDto) {
    const settingsRepo = this.dataSource.getRepository(UserSettings);
    const settings = await settingsRepo.findOne({ where: { user_id: userId } });
    if (!settings) {
      throw new BadRequestException('Settings not found');
    }

    Object.assign(settings, updateSettingsDto);
    return settingsRepo.save(settings);
  }

  async getListGroup(userId: string) {
    const groups = await this.groupMemberRepository.find({
      where: { user_id: userId },
      relations: ['group', 'group.creator'],
    });

    if (!groups) {
      throw new BadRequestException('Group not found');
    }

    return {
      data: groups
    }
  }

  async getOrCreateConversation(userId: string, friendId: string) {
    // 1. Tìm conversation private đã tồn tại giữa 2 người
    const existingConversation = await this.conversationRepo
      .createQueryBuilder('c')
      .innerJoin('c.participants', 'p1', 'p1.user_id = :userId', { userId })
      .innerJoin('c.participants', 'p2', 'p2.user_id = :friendId', { friendId })
      .where('c.type = :type', { type: ConversationType.PRIVATE })
      .getOne();

    if (existingConversation) {
      return { conversation_id: existingConversation.id };
    }

    // 2. Nếu chưa có, tạo mới
    const newConversation = this.conversationRepo.create({
      type: ConversationType.PRIVATE,
      created_by: userId,
    });
    const savedConversation = await this.conversationRepo.save(newConversation);

    // 3. Thêm 2 participants
    await this.participantRepo.save([
      { conversation_id: savedConversation.id, user_id: userId },
      { conversation_id: savedConversation.id, user_id: friendId },
    ]);

    return { conversation_id: savedConversation.id };
  }
}

