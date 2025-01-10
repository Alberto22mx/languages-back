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
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { ProgressController } from './progress/progress.controller';
import { ProgressModule } from './progress/progress.module';
import { MailModule } from './mail/mail.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRoot('mongodb://localhost:27017/englishforever'),
    LessonsModule,
    GamesModule,
    GroupsModule,
    UsersModule,
    AuthModule,
    ExamModule,
    ProgressModule,
    MailModule,
  ],
  controllers: [AppController, ProgressController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
