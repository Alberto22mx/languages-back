import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Groups, GroupsDocument } from './schemas/groups.schema';
import { UpdateGroupsDto } from './dto/update-groups.dto';
import { CreateGroupsDto } from './dto/create-groups.dto';

@Injectable()
export class GroupsService {
  constructor(
    @InjectModel(Groups.name) private groupModel: Model<GroupsDocument>,
  ) {}

  async findAll(): Promise<Groups[]> {
    return this.groupModel.find().exec();
  }

  async getGroupWithRelations(userId: string): Promise<Groups[]> {
    return this.groupModel
      .find({ users: userId }) // Busca por userId
      .populate({
        path: 'lessons',
        select: 'id title instructions', // Incluye únicamente los campos seleccionados
        localField: 'lessons',
        foreignField: 'id',
      })
      .populate({
        path: 'exams',
        select: 'id title instructions', // Incluye únicamente los campos seleccionados
        localField: 'exams',
        foreignField: 'id',
      })
      .populate({
        path: 'games',
        select: 'id', // Incluye únicamente los campos seleccionados
        localField: 'games',
        foreignField: 'id',
      })
      .select('-users') // Excluye explícitamente la propiedad users
      .exec();
  }

  async findOne(id: string): Promise<Groups> {
    return this.groupModel.findOne({ id }).exec();
  }

  async create(createGroupsDto: CreateGroupsDto): Promise<Groups> {
    const group = new this.groupModel(createGroupsDto);
    return group.save();
  }

  async updateGroup(
    id: string,
    updateGroupsDto: UpdateGroupsDto,
  ): Promise<GroupsDocument> {
    const updatedUser = await this.groupModel
      .findOneAndUpdate({ id }, updateGroupsDto, { new: true })
      .exec();

    if (!updatedUser) {
      throw new NotFoundException(`User with username "${id}" not found`);
    }

    return updatedUser;
  }

  async deleteUserById(customId: string): Promise<void> {
    const result = await this.groupModel.deleteOne({ id: customId });

    if (result.deletedCount === 0) {
      throw new NotFoundException(`User with id ${customId} not found`);
    }
  }
}
