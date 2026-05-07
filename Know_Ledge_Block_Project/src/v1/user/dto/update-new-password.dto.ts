import { IsNotEmpty, MinLength } from 'class-validator';

export class UpdateNewPasswordDto {
  @IsNotEmpty()
  @MinLength(6)
  new_password: string;
}
