import {
  Controller,
  Get,
  Param,
  Post,
  UsePipes,
  ValidationPipe,
  Body,
  Patch,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Lessons } from './lessons.entity';
import { LessonsService } from './lessons.service';
import { CreateLessonDto } from './dto/create-lessons.dto';
import { UpdateLessonDto } from './dto/update-lessons.dto';

@Controller('lessons')
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Get()
  findAll(): Promise<Lessons[]> {
    return this.lessonsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Lessons> {
    return this.lessonsService.findOne(id);
  }

  @Post()
  @UsePipes(new ValidationPipe())
  async create(@Body() createUserDto: CreateLessonDto) {
    return this.lessonsService.create(createUserDto);
  }

  @Patch(':id')
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateLessonDto,
  ): Promise<Lessons> {
    return this.lessonsService.updateUser(id, updateUserDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string): Promise<void> {
    await this.lessonsService.deleteUserById(id);
  }
}
