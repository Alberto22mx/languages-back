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
import { GamesService } from './games.service';
import { CreateGamesDto } from './dto/create-games.dto';
import { UpdateGameDto } from './dto/update-games.dto';
import { Games } from './schemas/games.schema';
import { Roles } from '../decorators/roles.decorator';
import { UserRole } from '../auth/user-role.enum';

@Controller('games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Get()
  findAll(): Promise<Games[]> {
    return this.gamesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Games> {
    return this.gamesService.findOne(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @UsePipes(new ValidationPipe())
  async create(@Body() createUserDto: CreateGamesDto) {
    return this.gamesService.create(createUserDto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  async updateGame(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateGameDto,
  ): Promise<Games> {
    return this.gamesService.updateGame(id, updateUserDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string): Promise<void> {
    await this.gamesService.deleteUserById(id);
  }
}
