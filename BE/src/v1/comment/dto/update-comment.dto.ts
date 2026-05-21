import { IsOptional, IsString } from 'class-validator';

export class UpdateCommentDto {
  @IsString()
  @IsOptional()
  content?: string;

  @IsString()
  @IsOptional()
  media_url?: string;

  @IsString()
  @IsOptional()
  sticker_url?: string;
}
