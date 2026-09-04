import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';
import { Lessons, LessonsDocument } from './schemas/lessons.schema';
import { InjectModel } from '@nestjs/mongoose';
import { UpdateLessonDto } from './dto/update-lessons.dto';
import { CreateLessonDto } from './dto/create-lessons.dto';
import { Groups, GroupsDocument } from '../groups/schemas/groups.schema';

@Injectable()
export class LessonsService {
  constructor(
    @InjectModel(Lessons.name) private lessonModel: Model<LessonsDocument>,
    @InjectModel(Groups.name) private groupModel: Model<GroupsDocument>,
  ) {}

  async findAll(): Promise<Lessons[]> {
    return this.lessonModel.find().exec();
  }

  async findOne(id: string): Promise<Lessons> {
    return this.lessonModel.findOne({ id }).exec();
  }

  async findMany(ids: string[]): Promise<Lessons[]> {
    if (ids.length === 0) {
      return [];
    }

    return this.lessonModel
      .find({ id: { $in: ids } })
      .select('id title instructions content')
      .exec();
  }

  async findForTeacher(teacherId: string): Promise<Lessons[]> {
    const groups = await this.groupModel.find({ users: teacherId }).select('lessons').exec();
    const lessonIds = [...new Set(groups.flatMap((group) => group.lessons))];

    return this.findMany(lessonIds);
  }

  async create(createLessonDto: CreateLessonDto): Promise<Lessons> {
    const lesson = new this.lessonModel({
      content: '',
      active: false,
      ...createLessonDto,
    });
    return lesson.save();
  }

  async updateUser(
    id: string,
    updateLessonDto: UpdateLessonDto,
    teacherId?: string,
  ): Promise<LessonsDocument> {
    if (teacherId) {
      const isAssignedLesson = await this.groupModel.exists({
        users: teacherId,
        lessons: id,
      });

      if (!isAssignedLesson) {
        throw new ForbiddenException('No puedes editar una lección que no pertenece a tus grupos');
      }
    }

    const updatedUser = await this.lessonModel
      .findOneAndUpdate({ id }, updateLessonDto, {
        new: true,
        runValidators: true,
      })
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
