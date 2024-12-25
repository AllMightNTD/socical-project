import { Body, Delete, Get, Param, UseGuards } from '@nestjs/common';
import { Paginate, Paginated, PaginateQuery } from 'nestjs-paginate';
import { BaseEntity } from 'typeorm';
import { DeleteByIdsDto } from './base.dto';
import { BaseService } from './base.service';
import { JwtAuthGuard } from 'src/v1/guards/jwt-auth.guard';

// @UseGuards(JwtAuthGuard)
export class BaseController<T extends BaseEntity> {
  constructor(private readonly service: BaseService) {
    // empty
  }

  @Get()
  public findAll(@Paginate() query: PaginateQuery): Promise<Paginated<T>> {
    return this.service.findAll(query);
  }

  @Get(':id')
  public findOne(@Param('id') id: number) {
    return this.service.findOne({ id: id });
  }

  @Delete()
  public deleteByIds(@Body() { ids }: DeleteByIdsDto) {
    return this.service.deleteByIds(ids);
  }

  @Delete(':id')
  public delete(@Param('id') id: number) {
    return this.service.delete(+id);
  }
}
