import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Games, GamesDocument } from './schemas/games.schema';
import { CreateGamesDto } from './dto/create-games.dto';
import { UpdateGameDto } from './dto/update-games.dto';

@Injectable()
export class GamesService {
  constructor(
    @InjectModel(Games.name) private gameModel: Model<GamesDocument>,
  ) {}

  async findAll(): Promise<Games[]> {
    return this.gameModel.find().exec();
  }

  async findOne(id: string): Promise<Games> {
    return this.gameModel.findOne({ id }).exec();
  }

  async create(createLessonDto: CreateGamesDto): Promise<Games> {
    const lesson = new this.gameModel(createLessonDto);
    return lesson.save();
  }

  async updateGame(
    id: string,
    updateGameDto: UpdateGameDto,
  ): Promise<GamesDocument> {
    const updatedUser = await this.gameModel
      .findOneAndUpdate({ id }, updateGameDto, { new: true })
      .exec();

    if (!updatedUser) {
      throw new NotFoundException(`User with username "${id}" not found`);
    }

    return updatedUser;
  }

  async deleteUserById(customId: string): Promise<void> {
    const result = await this.gameModel.deleteOne({ id: customId });

    if (result.deletedCount === 0) {
      throw new NotFoundException(`User with id ${customId} not found`);
    }
  }
}
