import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment } from '../entities/comment.entity';
import { Post } from '../entities/post.entity';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';
import { CommentGateway } from './comment.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([Comment, Post])],
  controllers: [CommentController],
  providers: [CommentService, CommentGateway],
  exports: [CommentService, CommentGateway],
})
export class CommentModule {}
