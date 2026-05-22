import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateExerciseDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  instructions?: string;

  @IsString()
  @IsIn(['java', 'python', 'c', 'javascript', 'typescript'])
  language: string;

  @IsOptional()
  @IsString()
  starterCode?: string;

  @IsOptional()
  @IsString()
  solutionCode?: string;

  @IsOptional()
  @IsString()
  expectedOutput?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  orderIndex?: number;
}
