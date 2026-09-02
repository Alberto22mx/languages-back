import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    const user = await this.userModel
      .findOne({ _id: payload.sub, state: 'active' })
      .select('id registrationNumber userType')
      .exec();
    if (!user) {
      throw new UnauthorizedException('Usuario inactivo o inexistente');
    }

    return {
      mongoId: user._id.toString(),
      userId: user.id,
      registrationNumber: user.registrationNumber,
      userType: user.userType,
    };
  }
}
