import { Controller, Get, UseGuards } from '@nestjs/common';
import { Paginate, Paginated, PaginateQuery } from 'nestjs-paginate';
import { User } from '../entities/user.entity';
import { AuthGuard } from '../guards/auth.guard';
import { UserService } from '../user/user.service';

@Controller()
export class AdminController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(AuthGuard)
  @Get('/user')
  public findAll(@Paginate() query: PaginateQuery): Promise<Paginated<User>> {
    return this.userService.findAll(query, true);
  }
}
