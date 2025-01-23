import { Injectable, NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';
import { Lessons, LessonsDocument } from './schemas/lessons.schema';
import { InjectModel } from '@nestjs/mongoose';
import { UpdateLessonDto } from './dto/update-lessons.dto';
import { CreateLessonDto } from './dto/create-lessons.dto';

@Injectable()
export class LessonsService {
  constructor(
    @InjectModel(Lessons.name) private lessonModel: Model<LessonsDocument>,
  ) {}

  async findAll(): Promise<Lessons[]> {
    return this.lessonModel.find().exec();
  }

  async findOne(id: string): Promise<Lessons> {
    return this.lessonModel.findOne({ id }).exec();
  }

  async findMany(ids: string[]): Promise<Lessons[]> {
    return this.lessonModel
      .find({ id: { $in: ids } })
      .select('id title instructions content')
      .exec();
  }

  async create(createLessonDto: CreateLessonDto): Promise<Lessons> {
    const lesson = new this.lessonModel(createLessonDto);
    return lesson.save();
  }

  async updateUser(
    id: string,
    updateLessonDto: UpdateLessonDto,
  ): Promise<LessonsDocument> {
    const updatedUser = await this.lessonModel
      .findOneAndUpdate({ id }, updateLessonDto, { new: true })
      .exec();

    if (!updatedUser) {
      throw new NotFoundException(`User with username "${id}" not found`);
    }

    return updatedUser;
  }

  async deleteUserById(customId: string): Promise<void> {
    const result = await this.lessonModel.deleteOne({ id: customId });

    if (result.deletedCount === 0) {
      throw new NotFoundException(`User with id ${customId} not found`);
    }
  }
}
