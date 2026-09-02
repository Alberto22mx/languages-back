import { createHash, timingSafeEqual } from 'crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private readonly saltRounds: number;
  private readonly refreshSecret: string;
  private readonly refreshExpiresIn: JwtSignOptions['expiresIn'];

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
    configService: ConfigService,
  ) {
    this.saltRounds = Number(
      configService.get<string>('BCRYPT_SALT_ROUNDS', '12'),
    );
    this.refreshSecret = configService.getOrThrow<string>('JWT_REFRESH_SECRET');
    this.refreshExpiresIn = configService.get<string>(
      'JWT_REFRESH_EXPIRES_IN',
      '7d',
    ) as JwtSignOptions['expiresIn'];
  }

  async login(registrationNumber: string, password: string) {
    const user = await this.userModel
      .findOne({ registrationNumber, state: 'active' })
      .select('+password')
      .exec();
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    return this.issueTokens(user);
  }

  async refresh(refreshToken: string) {
    let payload: { sub: string; tokenType?: string };
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Refresh token inválido');
    }
    if (payload.tokenType !== 'refresh') {
      throw new UnauthorizedException('Refresh token inválido');
    }

    const user = await this.userModel
      .findOne({ _id: payload.sub, state: 'active' })
      .select('+refreshTokenHash')
      .exec();
    if (
      !user?.refreshTokenHash ||
      !this.matchesHash(refreshToken, user.refreshTokenHash)
    ) {
      throw new UnauthorizedException('Refresh token inválido');
    }
    return this.issueTokens(user);
  }

  async logout(mongoId: string): Promise<void> {
    await this.userModel.updateOne(
      { _id: mongoId },
      { $unset: { refreshTokenHash: 1 } },
    );
  }

  async setInitialPassword(
    registrationNumber: string,
    token: string,
    password: string,
  ): Promise<void> {
    const user = await this.userModel
      .findOne({ registrationNumber, setupTokenExpiresAt: { $gt: new Date() } })
      .select('+setupTokenHash +setupTokenExpiresAt')
      .exec();
    if (
      !user?.setupTokenHash ||
      !this.matchesHash(token, user.setupTokenHash)
    ) {
      throw new UnauthorizedException(
        'Token de activación inválido o expirado',
      );
    }

    user.password = await this.hashPassword(password);
    user.setupTokenHash = undefined;
    user.setupTokenExpiresAt = undefined;
    await user.save();
  }

  hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  hashOpaqueToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private matchesHash(token: string, expectedHash: string): boolean {
    const actual = Buffer.from(this.hashOpaqueToken(token), 'hex');
    const expected = Buffer.from(expectedHash, 'hex');
    return (
      actual.length === expected.length && timingSafeEqual(actual, expected)
    );
  }

  private async issueTokens(user: UserDocument) {
    const accessPayload = {
      sub: user._id.toString(),
      userId: user.id,
      registrationNumber: user.registrationNumber,
      userType: user.userType,
    };
    const accessToken = await this.jwtService.signAsync(accessPayload);
    const refreshToken = await this.jwtService.signAsync(
      { sub: user._id.toString(), tokenType: 'refresh' },
      { secret: this.refreshSecret, expiresIn: this.refreshExpiresIn },
    );
    user.refreshTokenHash = this.hashOpaqueToken(refreshToken);
    await user.save();

    return {
      accessToken,
      refreshToken,
      idUser: user.id,
      userType: user.userType,
      userName: [user.firstName, user.lastNameFather, user.lastNameMother]
        .filter(Boolean)
        .join(' '),
      registrationNumber: user.registrationNumber,
    };
  }
}
