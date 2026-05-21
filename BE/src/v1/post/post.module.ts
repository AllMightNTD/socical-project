import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from '../entities/post.entity';
import { PostMedia } from '../entities/post_media.entity';
import { Reaction } from '../entities/reaction.entity';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { PostGateway } from './post.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([Post, PostMedia, Reaction])],
  controllers: [PostController],
  providers: [PostService, PostGateway],
  exports: [PostService, PostGateway],
})
export class PostModule {}
