import { Controller, Get, Param, Query, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CoursesService } from './courses.service.js';

// Optional JWT guard — doesn't reject unauthenticated, just populates req.user if token present
class OptionalJwtGuard extends (require('@nestjs/passport').AuthGuard('jwt')) {
  handleRequest(_err: unknown, user: unknown) {
    return user ?? null;
  }
}

@Controller('courses')
export class CoursesController {
  constructor(private courses: CoursesService) {}

  @Get()
  @UseGuards(OptionalJwtGuard)
  list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('category') categorySlug?: string,
    @Query('level') level?: string,
    @Query('language') language?: string,
    @Query('isPremium') isPremium?: string,
    @Request() req?: { user?: { id: string } },
  ) {
    return this.courses.list(
      {
        page: page ? parseInt(page, 10) : undefined,
        limit: limit ? parseInt(limit, 10) : undefined,
        search,
        categorySlug,
        level,
        language,
        isPremium: isPremium !== undefined ? isPremium === 'true' : undefined,
      },
      req?.user?.id,
    );
  }

  @Get('categories')
  listCategories() {
    return this.courses.listCategories();
  }

  @Get(':slug')
  @UseGuards(OptionalJwtGuard)
  findBySlug(@Param('slug') slug: string, @Request() req?: { user?: { id: string } }) {
    return this.courses.findBySlug(slug, req?.user?.id);
  }

  @Get(':slug/lessons/:lessonId')
  getLessonContent(@Param('lessonId') lessonId: string) {
    return this.courses.getLessonWithContent(lessonId);
  }
}
