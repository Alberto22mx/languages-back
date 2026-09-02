import {
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class SetPasswordDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  registrationNumber: string;

  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @MinLength(10)
  @MaxLength(128)
  @Matches(/((?=.*\d)|(?=.*\W+))(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'La contraseña debe contener mayúsculas, minúsculas y números o símbolos',
  })
  password: string;
}
