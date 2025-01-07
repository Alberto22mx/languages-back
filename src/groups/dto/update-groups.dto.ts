import { PartialType } from '@nestjs/mapped-types';
import { CreateGroupsDto } from './create-groups.dto';

export class UpdateGroupsDto extends PartialType(CreateGroupsDto) {}
