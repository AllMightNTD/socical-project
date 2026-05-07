import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Article } from 'src/v1/entities/article.entity';
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
import {
  DataSource,
  DeepPartial,
  EntityManager,
  FindOptionsWhere
} from 'typeorm';

@Injectable()
export class SeedService {
  constructor(
    private readonly dataSource: DataSource,
  ) {}

  private async findOrCreate<T>(
    manager: EntityManager,
    entity: { new (): T }, // Entity class
    where: FindOptionsWhere<T>,
    data: DeepPartial<T>,
  ): Promise<T> {
    const repo = manager.getRepository(entity); // lấy repository từ manager

    const existing = await repo.findOne({ where });
    if (existing) return existing;

    return repo.save(repo.create(data));
  }

  async run() {
    console.log('🌱 Seeding database...');

    await this.dataSource.transaction(async (manager) => {
      // ⚠️ dùng manager thay vì repo inject
      const user = await this.seedUser(manager);
      await this.seedRoles(manager, user);

      const { article, version } = await this.seedArticle(manager, user);

      await Promise.all([
        manager.getRepository(Comment).save({
          article_id: article.id,
          user_id: user.id,
          content: 'Great article!',
        }),

        manager.getRepository(Reaction).save({
          user_id: user.id,
          target_type: 'article',
          target_id: article.id,
          type: 'like',
        }),

        manager.getRepository(Notification).save({
          user_id: user.id,
          type: 'article_published',
          payload: { article_id: article.id },
        }),

        manager.getRepository(AuditLog).save({
          user_id: user.id,
          action: 'CREATE',
          entity: 'Article',
          entity_id: article.id,
          new_value: { title: version.title },
        }),
      ]);
    });

    console.log('✅ Seeding completed');
  }

  async seedUser(manager: EntityManager) {
    const password = await bcrypt.hash('Admin@123', 10);

    const user = await this.findOrCreate(
      manager,
      User,
      { email: 'admin@example.com' },
      {
        email: 'admin@example.com',
        password,
        status: 'active',
        email_verified_at: new Date(),
      },
    );

    await this.findOrCreate(
      manager,
      Profile,
      { user_id: user.id },
      {
        user_id: user.id,
        full_name: 'System Admin',
        language: 'vi',
        timezone: 'Asia/Ho_Chi_Minh',
      },
    );

    await this.findOrCreate(
       manager,
       RefreshToken,
      { user_id: user.id },
      {
        user_id: user.id,
        token_hash: 'hashed_refresh_token_example',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        device_info: 'Chrome / Linux',
        ip_address: '127.0.0.1',
      },
    );

    return user;
  }

  async seedRoles(manager: EntityManager, user: User) {
    const adminRole = await this.findOrCreate(
      manager,
      Role,
      { name: 'admin' },
      {
        name: 'admin',
        description: 'System administrator',
      },
    );

    const permissions = await manager.getRepository(Permission).save(
      [
        { code: 'article.create', description: 'Create article' },
        { code: 'article.publish', description: 'Publish article' },
        { code: 'comment.moderate', description: 'Moderate comments' },
      ].map((p) => manager.getRepository(Permission).create(p)),
    );

    await this.findOrCreate(
      manager,
      UserRole,
      { user_id: user.id, role_id: adminRole.id },
      { user_id: user.id, role_id: adminRole.id },
    );

    await Promise.all(
      permissions.map((perm) =>
        this.findOrCreate(
          manager,
          RolePermission,
          {
            role_id: adminRole.id,
            permission_id: perm.id,
          },
          {
            role_id: adminRole.id,
            permission_id: perm.id,
          },
        ),
      ),
    );

    return adminRole;
  }

  async seedArticle(manager: EntityManager,user: User) {
    const seo = await this.findOrCreate(
      manager,
      SeoMeta,
      { meta_title: 'NestJS Knowledge Platform' },
      {
        meta_title: 'NestJS Knowledge Platform',
        meta_description: 'Advanced NestJS CMS',
      },
    );

    const category = await this.findOrCreate(
      manager,
      Category,
      { slug: 'backend' },
      {
        name: 'Backend',
        slug: 'backend',
        description: 'Backend articles',
        seo_meta_id: seo.id,
      },
    );

    const tag = await this.findOrCreate(
      manager,
      Tag,
      { slug: 'nestjs' },
      {
        name: 'NestJS',
        slug: 'nestjs',
      },
    );

    const article = await this.findOrCreate(
      manager,
      Article,
      { slug: 'nestjs-enterprise-architecture' },
      {
        slug: 'nestjs-enterprise-architecture',
        author_id: user.id,
        category_id: category.id,
        status: 'published',
        published_at: new Date(),
        seo_meta_id: seo.id,
      },
    );

    const version = await manager.getRepository(ArticleVersion).save({
      article_id: article.id,
      title: 'NestJS Enterprise Architecture',
      content: 'Full content here...',
      excerpt: 'NestJS enterprise guide',
      status: 'approved',
      created_by: user.id,
    });

    await manager.getRepository(Article).update(article.id, {
      current_version_id: version.id,
    });

    await this.findOrCreate(
      manager,
      ArticleTag,
      { article_id: article.id, tag_id: tag.id },
      { article_id: article.id, tag_id: tag.id },
    );

    return { article, version };
  }
}
