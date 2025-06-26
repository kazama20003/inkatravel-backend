import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-facebook';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(
    configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    const clientID = configService.get<string>('FACEBOOK_APP_ID');
    const clientSecret = configService.get<string>('FACEBOOK_APP_SECRET');

    if (!clientID || !clientSecret) {
      throw new InternalServerErrorException(
        'Facebook credentials not configured',
      );
    }

    super({
      clientID,
      clientSecret,
      callbackURL: 'http://localhost:4001/api/auth/facebook/callback',
      profileFields: ['emails', 'name', 'photos'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (error: any, user?: any) => void,
  ): Promise<void> {
    const { name, emails } = profile;

    const fullName = `${name?.givenName ?? ''} ${name?.familyName ?? ''}`;
    const email = emails?.[0]?.value ?? '';

    try {
      const userData = await this.authService.validateOAuthLogin({
        fullName,
        email,
      });
      return done(null, userData);
    } catch (error) {
      return done(error, null);
    }
  }
}
