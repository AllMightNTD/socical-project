import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Article } from 'src/v1/entities/article.entity';
import { ArticleAsset } from 'src/v1/entities/article_asset.entity';
import { ArticleTag } from 'src/v1/entities/article_tag.entity';
import { ArticleVersion } from 'src/v1/entities/article_version.entity';
import { AuditLog } from 'src/v1/entities/audit_log.entity';
import { Category } from 'src/v1/entities/categorires.entity';
import { Comment } from 'src/v1/entities/comment.entity';
import { Notification } from 'src/v1/entities/notification.entity';
import { Permission } from 'src/v1/entities/permissions.entity';
import { Profile } from 'src/v1/entities/profile.entity';
import { Reaction } from 'src/v1/entities/reaction.entity';
import { RefreshToken } from 'src/v1/entities/refresh_tokens.entity';
import { RolePermission } from 'src/v1/entities/role_permission.entity';
import { Role } from 'src/v1/entities/roles.entity';
import { SeoMeta } from 'src/v1/entities/seo_meta.entity';
import { Tag } from 'src/v1/entities/tag.entity';
import { User } from 'src/v1/entities/user.entity';
import { UserRole } from 'src/v1/entities/user_role.entity';
import { SeedService } from './seed.service';


@Module({
  imports: [
    TypeOrmModule.forFeature([
      User, Profile, Role, Permission,
      UserRole, RolePermission,
      Category, Tag, Article, ArticleVersion,
      ArticleAsset, ArticleTag, SeoMeta,
      Comment, Reaction, Notification, AuditLog,
      RefreshToken
    ]),
  ],
  providers: [SeedService]
})
export class SeedModule {}
