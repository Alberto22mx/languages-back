import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { ProgressService } from './progress.service';
import { CreateProgressDto } from './dto/progress.dto';
import { Progress } from './schemas/progress.schema';
import { Roles } from '../decorators/roles.decorator';
import { UserRole } from '../auth/user-role.enum';

type AuthenticatedRequest = Request & {
  user: { userId: string; userType: UserRole };
};

@Controller('progress')
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createProgressDto: CreateProgressDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<Progress> {
    return this.progressService.create({
      ...createProgressDto,
      userId: request.user.userId,
    });
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  findAll(): Promise<Progress[]> {
    return this.progressService.findAll();
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<Progress> {
    const owner =
      request.user.userType === UserRole.ADMIN
        ? undefined
        : request.user.userId;
    return this.progressService.findOne(id, owner);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateProgressDto: CreateProgressDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<Progress> {
    const owner =
      request.user.userType === UserRole.ADMIN
        ? undefined
        : request.user.userId;
    return this.progressService.update(
      id,
      { ...updateProgressDto, userId: owner ?? updateProgressDto.userId },
      owner,
    );
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    return this.progressService.remove(id);
  }
}
