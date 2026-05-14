import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { UserStatus } from 'src/constants/enums';
import { Profile } from 'src/v1/entities/profile.entity';
import { User } from 'src/v1/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Profile)
    private readonly profileRepo: Repository<Profile>,
    private readonly jwtService: JwtService,
  ) { }

  async validateFacebookUser(facebookUser: any) {
    const { facebook_id, email, firstName, lastName, picture } = facebookUser;

    // 1. Tìm user theo facebook_id
    let user = await this.userRepo.findOne({
      where: { facebook_id },
      relations: ['profile'],
    });

    if (!user && email) {
      // 2. Nếu không thấy theo ID, tìm theo email (để link account)
      user = await this.userRepo.findOne({
        where: { email },
        relations: ['profile'],
      });

      if (user) {
        // Cập nhật facebook_id cho user đã tồn tại
        user.facebook_id = facebook_id;
        await this.userRepo.save(user);
      }
    }

    if (!user) {
      // 3. Nếu vẫn không thấy -> Tạo mới
      user = this.userRepo.create({
        facebook_id,
        email,
        status: UserStatus.ACTIVE,
        password: Math.random().toString(36).slice(-10),
      });
      await this.userRepo.save(user);

      // Tạo Profile cho user mới
      const profile = this.profileRepo.create({
        user_id: user.id,
        full_name: `${firstName} ${lastName}`,
        username: `fb_${facebook_id}`, // Tạo username tạm thời
        avatar_url: picture,
      });
      await this.profileRepo.save(profile);
      user.profile = profile;
    }

    // 4. Trả về Token
    const payload = { sub: user.id, email: user.email };
    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }
}
