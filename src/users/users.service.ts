import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthService } from 'src/auth/auth.service';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly authService: AuthService,
    private readonly mailService: MailService,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userModel
      .find()
      .select(
        'first_name last_name_father last_name_mother password registration_number phone email birth_date state terms_accepted user_type image creaction_date',
      )
      .exec();
  }

  /*
  async findAll(): Promise<User[]> {
    return this.userModel
      .find()
      .select(
        'first_name last_name_father last_name_mother password registration_number phone email birth_date state terms_accepted user_type image creaction_date'
      )
      .populate({
        path: 'address',
        select: 'street city state zip_code',
        model: 'Address'
      })
      .populate({
        path: 'orders',
        select: 'order_number total amount_paid',
        model: 'Order'
      })
      .exec();
  }*/

  async findOne(id: string): Promise<User> {
    return this.userModel.findById(id).exec();
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Generamos una contraseña aleatoria si no se proporciona una
    const password = createUserDto.password || this.generateSecurePassword();
    const hashedPassword = await this.authService.hashPassword(password);
    // Obtener la última matrícula
    const ultimoEstudiante = await this.userModel
      .findOne()
      .sort({ numeroMatricula: -1 })
      .exec();

    let nuevaMatricula = 'REG000001';

    if (ultimoEstudiante?.registrationNumber) {
      // Incrementar la última matrícula
      const ultimoNumero = parseInt(
        ultimoEstudiante.registrationNumber.replace('REG', ''),
        10,
      );
      nuevaMatricula = `REG${(ultimoNumero + 1).toString().padStart(6, '0')}`;
    }
    const userWithEncript = {
      ...createUserDto,
      password: hashedPassword,
      registrationNumber: nuevaMatricula,
    };
    // to: string, subject: string, text: string
    this.mailService.sendMail('Registro', createUserDto, password);
    const createdUser = new this.userModel(userWithEncript);
    return createdUser.save();
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

  // Función para generar contraseña aleatoria
  generateSecurePassword(length: number = 10): string {
    const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
    const numberChars = '0123456789';
    const specialChars = '!@#$%^&*?';

    // Aseguramos que tenga al menos uno de cada tipo
    let password =
      uppercaseChars[Math.floor(Math.random() * uppercaseChars.length)] +
      lowercaseChars[Math.floor(Math.random() * lowercaseChars.length)] +
      numberChars[Math.floor(Math.random() * numberChars.length)] +
      specialChars[Math.floor(Math.random() * specialChars.length)];

    // Completamos el resto de la longitud con caracteres aleatorios
    const allChars =
      uppercaseChars + lowercaseChars + numberChars + specialChars;
    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Mezclamos los caracteres para que no sigan un patrón
    return password
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');
  }
}
