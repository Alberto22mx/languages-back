import { Module } from '@nestjs/common';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Games } from './games.entity';
import { GamesSchema } from './schemas/games.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Games.name, schema: GamesSchema }]),
  ],
  controllers: [GamesController],
  providers: [GamesService],
})
export class GamesModule {}
