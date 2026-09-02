import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthService } from 'src/auth/auth.service';
import { MailService } from 'src/mail/mail.service';
import { randomBytes } from 'crypto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly authService: AuthService,
    private readonly mailService: MailService,
  ) {}

  async findAll(
    page: number,
    limit: number,
  ): Promise<{ data: User[]; total: number }> {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.userModel
        .find()
        .select(
          'id firstName lastNameFather lastNameMother registrationNumber phone email birthDate state termsAccepted course userType image',
        )
        .skip(skip)
        .limit(limit)
        .exec(),
      this.userModel.countDocuments().exec(),
    ]);
    return { data, total };
  }

  async findOne(id: string): Promise<User> {
    return this.userModel.findOne({ id }).exec();
  }

  async getActiveUsersByType(userType: string): Promise<User[]> {
    return this.userModel.find({ userType, state: 'active' }).exec();
  }

  async create(createUserDto: CreateUserDto) {
    const setupToken = randomBytes(32).toString('base64url');
    const unusablePassword = randomBytes(48).toString('base64url');
    const hashedPassword =
      await this.authService.hashPassword(unusablePassword);

    let nuevaMatricula = null;

    // Si el usuario tiene un tipo definido, generamos su número de registro
    if (createUserDto.userType) {
      // Obtenemos el último usuario del mismo tipo
      const ultimoUsuario = await this.userModel
        .findOne({ userType: createUserDto.userType })
        .sort({ registrationNumber: -1 })
        .exec();

      // Convertimos el tipo de usuario a prefijo (3 primeras letras en mayúscula)
      const prefijo = createUserDto.userType.slice(0, 3).toUpperCase();
      nuevaMatricula = `${prefijo}000001`;

      if (ultimoUsuario?.registrationNumber) {
        // Extraemos el número del último registro
        const numeroActual = ultimoUsuario.registrationNumber.slice(3); // Tomamos los dígitos después del prefijo
        // Incrementamos el número
        const siguienteNumero = parseInt(numeroActual, 10) + 1;
        // Formateamos el nuevo número con ceros a la izquierda
        nuevaMatricula = `${prefijo}${siguienteNumero.toString().padStart(6, '0')}`;
      }
    }

    const userWithEncript = {
      ...createUserDto,
      password: hashedPassword,
      registrationNumber: nuevaMatricula,
      setupTokenHash: this.authService.hashOpaqueToken(setupToken),
      setupTokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };
    const createdUser = new this.userModel(userWithEncript);
    const savedUser = await createdUser.save();
    await this.mailService.sendAccountSetup(savedUser, setupToken);

    return {
      user: savedUser,
      // En desarrollo sin correo, el administrador necesita entregar este token.
      ...(this.mailService.isEnabled() ? {} : { setupToken }),
    };
  }

  async updateUser(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserDocument> {
    const updatedUser = await this.userModel
      .findOneAndUpdate({ id }, updateUserDto, { new: true })
      .exec();

    if (!updatedUser) {
      throw new NotFoundException(`User with username "${id}" not found`);
    }

    return updatedUser;
  }

  async deleteUserById(customId: string): Promise<void> {
    const result = await this.userModel.deleteOne({ id: customId });

    if (result.deletedCount === 0) {
      throw new NotFoundException(`User with id ${customId} not found`);
    }
  }
}
