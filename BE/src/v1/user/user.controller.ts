import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { I18n, I18nLang, I18nService } from 'nestjs-i18n';
import { AuthGuard } from '../guards/auth.guard';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { UserService } from './user.service';

@Controller('')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Get('/hello')
  getHello(@I18nLang() lang: string, @I18n() i18n: I18nService) {
    return i18n.t('common.GREETING', { lang });
  }

  @Post('/auth/register')
  async register(@Body() registerDto: RegisterDto) {
    return this.userService.register(registerDto);
  }

  @Post('/auth/login')
  async login(@Body() loginDto: LoginDto) {
    return this.userService.login(loginDto);
  }

  @UseGuards(AuthGuard)
  @Get('/me')
  async getMe(@Request() req) {
    // req.user is set by AuthGuard
    return this.userService.getMe(req.user.sub);
  }

  @UseGuards(AuthGuard)
  @Post('/profile') // Use POST or PUT based on preference, PUT is better but POST works
  async updateProfile(@Request() req, @Body() updateProfileDto: UpdateProfileDto) {
    return this.userService.updateProfile(req.user.sub, updateProfileDto);
  }

  @UseGuards(AuthGuard)
  @Post('/settings')
  async updateSettings(@Request() req, @Body() updateSettingsDto: UpdateSettingsDto) {
    return this.userService.updateSettings(req.user.sub, updateSettingsDto);
  }

  @UseGuards(AuthGuard)
  @Get('/groups')
  async getListGroup(@Request() req) {
    return this.userService.getListGroup(req.user.sub);
  }

  @UseGuards(AuthGuard)
  @Get('/chat/conversation/:friendId')
  async getOrCreateConversation(@Request() req, @Param('friendId') friendId: string) {
    return this.userService.getOrCreateConversation(req.user.sub, friendId);
  }
}
