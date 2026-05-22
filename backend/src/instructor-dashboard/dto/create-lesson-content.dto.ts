import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateLessonContentDto {
  @IsString()
  @IsIn(['text', 'video', 'pdf', 'image', 'embed'])
  contentType: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  orderIndex?: number;
}
