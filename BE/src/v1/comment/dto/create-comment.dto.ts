import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { CommentTargetType } from 'src/constants/enums';

export class CreateCommentDto {
  @IsEnum(CommentTargetType)
  @IsNotEmpty()
  target_type: CommentTargetType;

  @IsString()
  @IsNotEmpty()
  target_id: string;

  @IsString()
  @IsOptional()
  parent_id?: string;

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
