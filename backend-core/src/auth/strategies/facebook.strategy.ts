import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-facebook';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
    constructor() {
        super({
            clientID: process.env.FACEBOOK_APP_ID || 'PENDING',
            clientSecret: process.env.FACEBOOK_APP_SECRET || 'PENDING',
            callbackURL: 'https://zaplandia.com.br/api/auth/facebook/callback',
            scope: ['email', 'public_profile'],
            profileFields: ['id', 'emails', 'name', 'photos'],
        });
    }

    async validate(accessToken: string, refreshToken: string, profile: any, done: any): Promise<any> {
        const { name, emails, photos } = profile;
        const user = {
            id: profile.id,
            email: emails[0].value,
            firstName: name.givenName,
            lastName: name.familyName,
            picture: photos[0].value,
            accessToken,
        };
        done(null, user);
    }
}
