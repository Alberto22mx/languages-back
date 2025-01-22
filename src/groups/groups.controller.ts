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
import { GroupsService } from './groups.service';
import { Groups } from './schemas/groups.schema';
import { CreateGroupsDto } from './dto/create-groups.dto';
import { UpdateGroupsDto } from './dto/update-groups.dto';

@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get()
  findAll(): Promise<Groups[]> {
    return this.groupsService.findAll();
  }

  @Get('group-relation/:userId')
  async getGroup(@Param('userId') userId: string): Promise<Groups[]> {
    return this.groupsService.getGroupWithRelations(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Groups> {
    return this.groupsService.findOne(id);
  }

  @Post()
  @UsePipes(new ValidationPipe())
  async create(@Body() createUserDto: CreateGroupsDto) {
    return this.groupsService.create(createUserDto);
  }

  @Patch(':id')
  async updateGroup(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateGroupsDto,
  ): Promise<Groups> {
    return this.groupsService.updateGroup(id, updateUserDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string): Promise<void> {
    await this.groupsService.deleteUserById(id);
  }
}
