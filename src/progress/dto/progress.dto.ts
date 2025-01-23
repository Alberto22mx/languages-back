import { ProgressType } from '../schemas/progress.schema';

export class CreateProgressDto {
  userId: string;
  type: ProgressType;
  referenceId: string;
  answers: any[];
}
