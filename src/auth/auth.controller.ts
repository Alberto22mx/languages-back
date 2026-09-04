import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { Public } from '../decorators/public.decorator';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SetPasswordDto } from './dto/set-password.dto';

type AuthenticatedRequest = Request & { user: { mongoId: string } };

@Controller('auth')
export class AuthController {
  private readonly secureCookies: boolean;
  private readonly sameSite: 'none' | 'strict';

  constructor(
    private readonly authService: AuthService,
    configService: ConfigService,
  ) {
    this.secureCookies = configService.get<string>('NODE_ENV') === 'production';
    this.sameSite =
      configService.get<string>('COOKIE_SAME_SITE') === 'none'
        ? 'none'
        : 'strict';
  }

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(
      body.registrationNumber,
      body.password,
    );
    return this.attachRefreshCookie(response, result);
  }

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.refresh(
      request.cookies?.refreshToken ?? '',
    );
    return this.attachRefreshCookie(response, result);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.authService.logout(request.user.mongoId);
    response.clearCookie('refreshToken', this.cookieOptions());
  }

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post('set-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  setPassword(@Body() body: SetPasswordDto) {
    return this.authService.setInitialPassword(
      body.registrationNumber,
      body.token,
      body.password,
    );
  }

  private attachRefreshCookie(
    response: Response,
    result: { refreshToken: string; [key: string]: unknown },
  ) {
    const { refreshToken, ...publicResponse } = result;
    response.cookie('refreshToken', refreshToken, {
      ...this.cookieOptions(),
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return publicResponse;
  }

  private cookieOptions() {
    return {
      httpOnly: true,
      secure: this.secureCookies,
      sameSite: this.sameSite,
      path: '/auth',
    };
  }
}
