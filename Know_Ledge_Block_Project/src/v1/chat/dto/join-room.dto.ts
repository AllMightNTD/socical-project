import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class JoinConversationDto {
  @IsUUID()
  @IsNotEmpty()
  conversation_id: string;
}

export class JoinPostViewDto {
  @IsUUID()
  @IsNotEmpty()
  post_id: string;
}

export class ReadMessageDto {
  @IsUUID()
  @IsNotEmpty()
  conversation_id: string;

  @IsUUID()
  @IsNotEmpty()
  message_id: string;
}

export class ReactionDto {
  @IsUUID()
  @IsNotEmpty()
  conversation_id: string;

  @IsUUID()
  @IsNotEmpty()
  message_id: string;

  @IsString()
  @IsNotEmpty()
  emoji: string;
}

export class EditMessageDto {
  @IsUUID()
  @IsNotEmpty()
  conversation_id: string;

  @IsUUID()
  @IsNotEmpty()
  message_id: string;

  @IsString()
  @IsNotEmpty()
  content: string;
}
