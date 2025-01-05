import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly authService: AuthService,
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
    const hashedPassword = await this.authService.hashPassword(createUserDto.password);
    const userWithEncript = {
      ...createUserDto,
      password: hashedPassword,
    };
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
}
