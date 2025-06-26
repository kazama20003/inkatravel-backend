import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID')!,
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET')!,
      callbackURL:
        'https://api.cabanacondecuscobybus.com/api/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (err: any, user?: any) => void,
  ) {
    const { name, emails } = profile;
    console.log('✅ Google strategy activated:', profile);
    const user = await this.authService.validateOAuthLogin({
      fullName: `${name?.givenName ?? ''} ${name?.familyName ?? ''}`,
      email: emails?.[0]?.value ?? '',
    });

    done(null, user); // Esto llegará como req.user en el controlador
  }
}
