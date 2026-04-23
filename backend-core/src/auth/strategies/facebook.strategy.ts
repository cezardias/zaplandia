import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-facebook';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
    constructor() {
        super({
            clientID: process.env.FACEBOOK_APP_ID || '760305269821467',
            clientSecret: process.env.FACEBOOK_APP_SECRET || '6685a0cba55f2f49349222565cf37042',
            callbackURL: 'https://zaplandia.com.br/api/auth/facebook/callback',
            scope: [
                'email', 
                'public_profile', 
                'whatsapp_business_management', 
                'whatsapp_business_messaging'
            ],
            profileFields: ['id', 'emails', 'name', 'photos'],
            graphAPIVersion: 'v18.0',
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
