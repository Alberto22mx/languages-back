import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Progress,
  ProgressDocument,
  ProgressType,
} from './schemas/progress.schema';
import { CreateProgressDto } from './dto/progress.dto';

@Injectable()
export class ProgressService {
  constructor(
    @InjectModel(Progress.name) private progressModel: Model<ProgressDocument>,
  ) {}

  async create(createProgressDto: CreateProgressDto): Promise<Progress> {
    const createdProgress = new this.progressModel(createProgressDto);
    return createdProgress.save();
  }

  async findByUserAndType(userId: string, type: ProgressType) {
    return this.progressModel.find({ userId, type }).exec();
  }

  async findByUserAndReference(userId: string, referenceId: string) {
    return this.progressModel.findOne({ userId, referenceId }).exec();
  }

  async updateProgress(
    userId: string,
    referenceId: string,
    updateData: Partial<Progress>,
  ) {
    return this.progressModel
      .findOneAndUpdate(
        { userId, referenceId },
        { $set: updateData },
        { new: true },
      )
      .exec();
  }

  async getProgressStats(userId: string) {
    return this.progressModel.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$type',
          completedCount: {
            $sum: { $cond: ['$completed', 1, 0] },
          },
          averageScore: { $avg: '$score' },
          totalItems: { $sum: 1 },
        },
      },
    ]);
  }
}
