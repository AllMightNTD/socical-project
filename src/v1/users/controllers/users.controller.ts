import { Controller, Get, Param } from '@nestjs/common';
import { Paginate, Paginated, PaginateQuery } from 'nestjs-paginate';
import { BaseController } from 'src/base/base.controller';
import { User } from 'src/v1/entities/user.entity';
import { UsersService } from '../services/users.service';

@Controller()
export class UsersController extends BaseController<User> {
  constructor(private readonly userService: UsersService) {
    super(userService);
  }

  @Get()
  public findAll(@Paginate() query: PaginateQuery): Promise<Paginated<User>> {
    return this.userService.findAll(query, true);
  }

  @Get(':id')
  public findOne(@Param('id') id: number) {
    return this.userService.findOne(
      { id: id },
      {
        where: {
          id: id,
        },
      },
    );
  }
}
