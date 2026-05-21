import { BadRequestException, HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { BaseService } from 'src/base/base.service';
import { UserStatus } from 'src/constants/enums';
import { MailService } from 'src/mail/services/mail.service';
import { DataSource, IsNull, Repository } from 'typeorm';
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
import { RequestPasswordResetDto } from './dto/request-reset-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
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
    private readonly mailService: MailService,
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
    const { emailOrPhone, password, rememberMe = false } = loginDto;

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
      throw new HttpException(
        { errorCode: 'EMAIL_NOT_FOUND', message: 'Email không tồn tại' },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new HttpException(
        { errorCode: 'WRONG_PASSWORD', message: 'Sai mật khẩu' },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
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

    // Determine session length based on rememberMe
    const cookieExpireDays = rememberMe ? 30 : 1;
    const refreshTokenExpiry = rememberMe ? '30d' : '1d';

    const refreshTokenString = this.jwtService.sign(payload, {
      expiresIn: refreshTokenExpiry,
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + cookieExpireDays);

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
      cookieExpireDays,
    };
  }

  async logout(userId: string) {
    // Revoke all active refreshTokens of this user
    await this.refreshTokenRepository.update(
      {
        user_id: userId,
        revoked_at: IsNull(),
      },
      { revoked_at: new Date() },
    );
    return { message: 'Đăng xuất thành công' };
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

    let conversationId: string;

    if (existingConversation) {
      conversationId = existingConversation.id;
    } else {
      // 2. Nếu chưa có, tạo mới
      const newConversation = this.conversationRepo.create({
        type: ConversationType.PRIVATE,
        created_by: userId,
      });
      const savedConversation = await this.conversationRepo.save(newConversation);
      conversationId = savedConversation.id;

      // 3. Thêm 2 participants
      await this.participantRepo.save([
        { conversation_id: savedConversation.id, user_id: userId },
        { conversation_id: savedConversation.id, user_id: friendId },
      ]);
    }

    // Lấy thông tin chi tiết của conversation bao gồm participants
    const conversation = await this.conversationRepo.findOne({
      where: { id: conversationId },
      relations: ['participants'],
    });

    return {
      conversation_id: conversation.id,
      theme_color: conversation.theme_color,
      emoji: conversation.emoji,
      background_image: conversation.background_image,
      participants: conversation.participants.map((p) => ({
        user_id: p.user_id,
        nickname: p.nickname,
      })),
    };
  }

  async forgotPassword(requestPasswordResetDto: RequestPasswordResetDto) {
    const { email } = requestPasswordResetDto;

    // 1. Tìm user theo email kèm theo relations profile nếu có để lấy tên hiển thị
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['profile'],
    });

    // 2. Chống lỗ hổng User Enumeration: Trả về thông báo thành công kể cả khi không tìm thấy user
    const successMessage = {
      message: 'Nếu email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi đến hòm thư của bạn',
    };

    if (!user) {
      return successMessage;
    }

    // 3. Tạo token ngẫu nhiên cực kỳ bảo mật
    const rawToken = crypto.randomBytes(32).toString('hex');

    // 4. Băm token bằng SHA-256 trước khi lưu vào cơ sở dữ liệu
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    // 5. Đặt thời gian hết hạn (15 phút từ bây giờ)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // 6. Lưu hashed token và thời gian hết hạn vào DB
    user.reset_password_token = hashedToken;
    user.reset_password_expires_at = expiresAt;
    await this.userRepository.save(user);

    // 7. Gửi email thông qua MailService (BullMQ queue)
    await this.mailService.enqueueResetPasswordMail({
      email: user.email,
      resetToken: rawToken, // Gửi token dạng raw cho người dùng
      name: user.profile?.full_name || 'User',
      resetExpire: expiresAt,
    });

    return successMessage;
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, password } = resetPasswordDto;

    // 1. Băm token thô nhận được từ Client bằng SHA-256 để khớp với dữ liệu đã băm trong DB
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // 2. Tìm user có token khớp
    const user = await this.userRepository.findOne({
      where: {
        reset_password_token: hashedToken,
      },
    });

    if (!user) {
      throw new BadRequestException('Token không hợp lệ hoặc đã hết hạn');
    }

    // Kiểm tra thời gian hết hạn
    if (!user.reset_password_expires_at || user.reset_password_expires_at.getTime() < Date.now()) {
      throw new BadRequestException('Token không hợp lệ hoặc đã hết hạn');
    }

    // 3. Băm mật khẩu mới bằng bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Cập nhật mật khẩu mới và hủy bỏ token cũ (Single-use token)
    user.password = hashedPassword;
    user.reset_password_token = null;
    user.reset_password_expires_at = null;
    await this.userRepository.save(user);

    return {
      message: 'Mật khẩu của bạn đã được đặt lại thành công',
    };
  }
}

