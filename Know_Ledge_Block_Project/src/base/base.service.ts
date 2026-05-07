import { BadRequestException, NotFoundException } from '@nestjs/common';
import { instanceToPlain } from 'class-transformer';
import { paginate, Paginated, PaginateQuery } from 'nestjs-paginate';
import { DeleteResult, Repository } from 'typeorm';
import { FindOneOptions } from 'typeorm/find-options/FindOneOptions';

export abstract class BaseService {
  protected sortableColumns: any = ['id'];
  protected defaultSortBy: any = [['id', 'ASC']];
  protected abstract filterableColumns: any;

  constructor(private readonly repository: Repository<any>) {
    // empty
  }

  public async findAll(
    query: PaginateQuery,
    cache?: boolean,
  ): Promise<Paginated<any>> {
    const queryBuilder = this.prepareQuery(query);

    if (cache) {
      queryBuilder.cache(true);
    }

    return paginate(query, queryBuilder, {
      sortableColumns: this.sortableColumns,
      defaultSortBy: this.defaultSortBy,
      filterableColumns: this.filterableColumns,
    });
  }

  public async findOne(
    conditions: Partial<any>,
    options: FindOneOptions<any> = {},
  ): Promise<any | undefined> {
    const data = await this.repository.findOne({
      where: conditions,
      ...options,
    });
    if (!data) {
      throw new NotFoundException('Data not found');
    }
    return {
      data: data,
    };
  }

  public async create(dto: object): Promise<any> {
    const instance = this.repository.create(dto);
    return await instance.save();
  }

  public deleteByIds(ids: number[]): Promise<DeleteResult> {
    return this.repository.delete(ids);
  }

  public delete(id: number): Promise<DeleteResult> {
    return this.repository.delete(id);
  }

  protected async mapData(instance: any, dto: object) {
    const data = instanceToPlain(dto);

    for (const key in data) {
      instance[key] = data[key];
    }
  }

  private prepareQuery(query) {
    const tableName = this.repository.metadata.tableName;
    
    console.log('query', query);
    
    let queryBuilder = this.repository.createQueryBuilder(tableName);

    // 🧩 Kiểm tra query tồn tại
    if (!query) return queryBuilder;

    if (query.filter && !this.isObjectEmpty(query.filter)) {
      queryBuilder = this.parseFilter(queryBuilder, query.filter);
    }

    if (query.withs && Array.isArray(query.withs)) {
      queryBuilder = this.parseWiths(queryBuilder, query.withs);
    }

    return queryBuilder;
  }

  private parseWiths(queryBuilder, withs) {
    const tableName = this.repository.metadata.tableName;

    for (const w of withs) {
      queryBuilder.leftJoinAndSelect(`${tableName}.${w}`, w);
    }

    return queryBuilder;
  }

  private parseFilter(queryBuilder, filter) {
    const tableName = this.repository.metadata.tableName;

    for (const column of Object.keys(filter)) {
      const input = filter[column];

      if (typeof input !== 'string' || !input.trim()) {
        continue; // bỏ qua filter rỗng hoặc không hợp lệ
      }

      const statements = input.split(':');
      const [operator, value] = statements;

      // nếu không có operator, coi như tìm chính xác bằng giá trị input
      if (statements.length === 1) {
        queryBuilder.andWhere(`${tableName}.${column} = :${column}`, {
          [column]: input,
        });
        continue;
      }

      switch (operator) {
        case '$like':
          queryBuilder.andWhere(`${tableName}.${column} LIKE :${column}`, {
            [column]: `%${value}%`,
          });
          break;

        case '$eq':
          if (value !== undefined && value !== 'NaN') {
            queryBuilder.andWhere(`${tableName}.${column} = :${column}`, {
              [column]: value,
            });
          }
          break;

        case '$gt':
          if (!isNaN(Number(value))) {
            queryBuilder.andWhere(`${tableName}.${column} > :${column}`, {
              [column]: Number(value),
            });
          }
          break;

        case '$lt':
          if (!isNaN(Number(value))) {
            queryBuilder.andWhere(`${tableName}.${column} < :${column}`, {
              [column]: Number(value),
            });
          }
          break;
      }
    }

    return queryBuilder;
  }

  protected async uploadImage(fnUpload: any): Promise<string> {
    try {
      return await fnUpload;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  protected async deleteImage(fnDel: any): Promise<boolean> {
    try {
      return await fnDel;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  private isObjectEmpty(obj: Record<string, any>): boolean {
    return Object.keys(obj).length === 0;
  }
}
