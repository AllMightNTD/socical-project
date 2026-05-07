import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { I18n, I18nLang, I18nService } from 'nestjs-i18n';
import { BaseController } from 'src/base/base.controller';
import { Permissions } from 'src/decorator/permissions.decorator';
import { ClientInfo } from 'src/helper/client-info';
import { User } from 'src/v1/entities/user.entity';
import { AuthGuard } from 'src/v1/guards/auth.guard';
import { PermissionGuard } from 'src/v1/guards/permission.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { ProfileDataDto } from './dto/profile-data.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RequestPasswordResetDto } from './dto/request-reset-password.dto';
import { UpdateNewPasswordDto } from './dto/update-new-password.dto';
import { UserService } from './user.service';

@Controller()
export class UserController extends BaseController<User> {
  constructor(private readonly userService: UserService) {
    super(userService);
  }

  @Get('/hello')
  getHello(@I18nLang() lang: string, @I18n() i18n: I18nService) {
    return i18n.t('common.GREETING', { lang });
  }

  @UseGuards(AuthGuard, PermissionGuard)
  @Permissions('article.publish')
  @Get('/get-me')
  getProfile(@Request() req: any) {
    return this.userService.getMe(req.user.userId);
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  public findOne(@Param('id') id: number) {
    return this.userService.search(id);
  }

  @Post('/register')
  async register(@Body() createUserDto: CreateUserDto) {
    return this.userService.register(createUserDto);
  }

  @Post('/login')
  async login(@Body() loginDto: LoginUserDto, @ClientInfo() clientInfo: any) {
    return this.userService.login(loginDto, clientInfo);
  }

  @Post('/refresh')
  async refresh(
    @Body() refreshDto: RefreshTokenDto,
    @ClientInfo() clientInfo: any,
  ) {
    return this.userService.refreshToken(refreshDto, clientInfo);
  }

  @UseGuards(AuthGuard, PermissionGuard)
  @Permissions('article.publish')
  @Put('/update-profile')
  async updateProfile(
    @Body() profileData: ProfileDataDto,
    @Request() req: any,
  ) {
    return this.userService.updateProfile(profileData, req);
  }

  @Put(':id')
  async updateUser(
    @Param('id') id: number,
    @Body() updateUserDto: CreateUserDto,
  ) {
    return this.userService.updateUser(id, updateUserDto);
  }

  @Post('/reset-password')
  async resetPassword(@Body() resetPasswordDto: RequestPasswordResetDto) {
    return this.userService.requestPasswordReset(resetPasswordDto.email);
  }

  @Post('/update-new-password')
  async updateNewPassword(
    @Body() updatePassword: UpdateNewPasswordDto,
    @Query('reset_token') reset_token: string,
  ) {
    return this.userService.updateNewPassword(updatePassword, reset_token);
  }
}
