import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from 'src/decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  register(@Body() body: { registrationNumber: string; password: string }) {
    return this.authService.register(body.registrationNumber, body.password);
  }

  @Public()
  @Post('login')
  login(@Body() body: { registrationNumber: string; password: string }) {
    return this.authService.login(body.registrationNumber, body.password);
  }
}
