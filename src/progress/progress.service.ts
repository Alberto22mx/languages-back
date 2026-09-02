import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Progress, ProgressDocument } from './schemas/progress.schema';
import { CreateProgressDto } from './dto/progress.dto';

@Injectable()
export class ProgressService {
  constructor(
    @InjectModel(Progress.name) private progressModel: Model<ProgressDocument>,
  ) {}

  // Crear un nuevo progreso
  async create(createProgressDto: CreateProgressDto): Promise<Progress> {
    const createdProgress = new this.progressModel(createProgressDto);
    return createdProgress.save();
  }

  // Obtener todos los progresos
  async findAll(): Promise<Progress[]> {
    return this.progressModel.find().exec();
  }

  // Obtener un progreso por ID
  async findOne(id: string, ownerId?: string): Promise<Progress> {
    const progress = await this.progressModel
      .findOne({ _id: id, ...(ownerId ? { userId: ownerId } : {}) })
      .exec();
    if (!progress) {
      throw new NotFoundException(`Progress with ID "${id}" not found`);
    }
    return progress;
  }

  // Actualizar un progreso
  async update(
    id: string,
    updateProgressDto: CreateProgressDto,
    ownerId?: string,
  ): Promise<Progress> {
    const updatedProgress = await this.progressModel
      .findOneAndUpdate(
        { _id: id, ...(ownerId ? { userId: ownerId } : {}) },
        updateProgressDto,
        { new: true, runValidators: true },
      )
      .exec();
    if (!updatedProgress) {
      throw new NotFoundException(`Progress with ID "${id}" not found`);
    }
    return updatedProgress;
  }

  // Eliminar un progreso
  async remove(id: string): Promise<void> {
    const result = await this.progressModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Progress with ID "${id}" not found`);
    }
  }
}
