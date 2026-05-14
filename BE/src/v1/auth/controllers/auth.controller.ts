import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { FacebookAuthGuard } from '../guards/facebook-auth.guard';
import { AuthService } from '../services/auth/auth.service';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Get('facebook')
  @UseGuards(FacebookAuthGuard)
  async facebookLogin() {
    // Luồng này sẽ được Passport xử lý và chuyển hướng sang Facebook
  }

  @Get('facebook/callback')
  @UseGuards(FacebookAuthGuard)
  async facebookLoginCallback(@Req() req) {
    return this.authService.validateFacebookUser(req.user);
  }

  @Get('test')
  public getTest(@Req() request) {
    return 1;
  }
}
