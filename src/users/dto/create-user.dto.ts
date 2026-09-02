import {
  IsBoolean,
  IsDate,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UserType } from '../schemas/user.schema';

export class CreateUserDto {
  @IsOptional()
  @IsString()
  id: string;
  @IsString()
  @MaxLength(80)
  firstName: string;
  @IsString()
  @MaxLength(80)
  lastNameFather: string;
  @IsString()
  @MaxLength(80)
  lastNameMother: string;
  @IsOptional()
  @IsString()
  password: string;
  @IsOptional()
  @IsString()
  registrationNumber: string;
  @Matches(/^\+?[1-9]\d{1,14}$/)
  phone: string;
  @IsEmail()
  email: string;
  @Type(() => Date)
  @IsDate()
  birthDate: Date;
  @IsEnum(['active', 'inactive'])
  state: string;
  @IsBoolean()
  termsAccepted: boolean;
  @IsEnum(UserType)
  userType: string;
  @IsOptional()
  @IsString()
  image: string;
}
