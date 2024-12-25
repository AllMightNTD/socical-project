import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseService } from 'src/base/base.service';
import { User } from 'src/v1/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService extends BaseService {
  protected filterableColumns: any;
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {
    super(usersRepository);
  }
}
