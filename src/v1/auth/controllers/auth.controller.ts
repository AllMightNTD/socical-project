import { Controller, Get, Req } from '@nestjs/common';

@Controller()
export class AuthController {
  @Get()
  // @UseGuards(LocalAuthGuard)
  public getTest(@Req() request) {
    return 1;
  }
}
