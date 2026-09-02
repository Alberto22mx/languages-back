import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/users/schemas/user.schema';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private readonly saltRounds: number;

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
    configService: ConfigService,
  ) {
    this.saltRounds = Number(
      configService.get<string>('BCRYPT_SALT_ROUNDS', '10'),
    );
  }

  async register(email: string, password: string) {
    const hashedPassword = await bcrypt.hash(password, this.saltRounds);
    const newUser = new this.userModel({ email, password: hashedPassword });
    return newUser.save();
  }

  async login(registrationNumber: string, password: string) {
    const user = await this.userModel.findOne({ registrationNumber });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const payload = {
      registrationNumber: user.registrationNumber,
      sub: user._id,
    };
    return {
      accessToken: this.jwtService.sign(payload),
      idUser: user.id,
      userType: user.userType,
      userName:
        user.firstName + ' ' + user.lastNameFather + ' ' + user.lastNameMother,
      registrationNumber: user.registrationNumber,
    };
  }

  // Método para encriptar una contraseña
  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(this.saltRounds);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
  }

  // Método para comparar una contraseña con su hash
  async comparePasswords(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }
}
