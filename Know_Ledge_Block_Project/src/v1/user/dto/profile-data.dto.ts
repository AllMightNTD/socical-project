import { IsString, MinLength } from 'class-validator';

export class ProfileDataDto {
  @IsString()
  @MinLength(6)
  full_name: string;

  @IsString()
  avatar_url: string;

  @IsString()
  bio: string;

  @IsString()
  language: string;

  @IsString()
  timezone: string;
}
