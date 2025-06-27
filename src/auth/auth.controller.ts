import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from 'src/users/dto/create-user.dto';

@Controller('auth') // Base: /auth
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // 🔐 OAuth Google login
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth(): void {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  googleAuthRedirect(@Req() req: Request, @Res() res: Response): void {
    const user = req.user as {
      access_token: string;
      user: {
        fullName: string;
        email: string;
        role: string;
      };
    };

    const frontendUrl = 'http://cabanacondecuscobybus.com/login-success';
    const token = user.access_token;

    res.redirect(`${frontendUrl}?token=${token}`);
  }

  // ✅ Login local corregido (no debes repetir 'auth')
  @Post('login') // Final: POST /api/auth/login
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  // 🔐 OAuth Facebook login
  @Get('facebook')
  @UseGuards(AuthGuard('facebook'))
  facebookLogin(): void {}

  @Get('facebook/callback')
  @UseGuards(AuthGuard('facebook'))
  async facebookLoginRedirect(@Req() req: Request, @Res() res: Response) {
    const oauthUser = req.user as {
      email: string;
      fullName: string;
    };

    const result = await this.authService.validateOAuthLogin(oauthUser);
    return res.json(result);
  }

  // 📝 Registro de usuario
  @Post('register') // Final: POST /api/auth/register
  async register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }
}
