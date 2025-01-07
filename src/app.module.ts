import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LessonsModule } from './lessons/lessons.module';
import { GamesModule } from './games/games.module';
import { GroupsModule } from './groups/groups.module';
import { UsersModule } from './users/users.module';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { ExamModule } from './exam/exam.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017/englishforever'),
    LessonsModule,
    GamesModule,
    GroupsModule,
    UsersModule,
    AuthModule,
    ExamModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
