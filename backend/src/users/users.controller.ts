import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Patch, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private users: UsersService) {}

  @Get('me')
  getProfile(@Request() req: { user: { id: string } }) {
    return this.users.getProfile(req.user.id);
  }

  @Patch('me/profile')
  updateProfile(
    @Request() req: { user: { id: string } },
    @Body() dto: UpdateProfileDto,
  ) {
    return this.users.updateProfile(req.user.id, dto);
  }

  @Patch('me/instructor-profile')
  updateInstructorProfile(
    @Request() req: { user: { id: string } },
    @Body() dto: { displayName?: string; bio?: string; specialties?: string; languages?: string; hourlyRate?: number; isAvailable?: boolean },
  ) {
    return this.users.updateInstructorProfile(req.user.id, dto);
  }

  @Delete('me')
  @HttpCode(HttpStatus.OK)
  deleteAccount(@Request() req: { user: { id: string } }) {
    return this.users.deleteAccount(req.user.id);
  }
}
