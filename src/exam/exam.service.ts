import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Exams, ExamsDocument } from './schemas/exams.schema';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';

@Injectable()
export class ExamService {
  constructor(
    @InjectModel(Exams.name) private examModel: Model<ExamsDocument>,
  ) {}

  async findAll(): Promise<Exams[]> {
    return this.examModel.find().exec();
  }

  async findOne(id: string): Promise<Exams> {
    return this.examModel.findById(id).exec();
  }

  async create(createExamDto: CreateExamDto): Promise<Exams> {
    const exam = new this.examModel(createExamDto);
    return exam.save();
  }

  async updateExam(
    id: string,
    updateExamDto: UpdateExamDto,
  ): Promise<ExamsDocument> {
    const updatedExam = await this.examModel
      .findOneAndUpdate({ id }, updateExamDto, { new: true })
      .exec();

    if (!updatedExam) {
      throw new NotFoundException(`User with username "${id}" not found`);
    }

    return updatedExam;
  }

  async deleteUserById(customId: string): Promise<void> {
    const result = await this.examModel.deleteOne({ id: customId });

    if (result.deletedCount === 0) {
      throw new NotFoundException(`User with id ${customId} not found`);
    }
  }
}
