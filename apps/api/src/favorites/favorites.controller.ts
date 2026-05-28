import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator'
import { FavoritesService } from './favorites.service'

@ApiBearerAuth()
@ApiTags('favorites')
@UseGuards(JwtAuthGuard)
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favorites: FavoritesService) {}

  @Get()
  async list(@CurrentUser() user: RequestUser) {
    return this.favorites.list(user.id)
  }

  @Get('ids')
  async ids(@CurrentUser() user: RequestUser) {
    return this.favorites.ids(user.id)
  }

  @Post(':spaceId/toggle')
  async toggle(@CurrentUser() user: RequestUser, @Param('spaceId') spaceId: string) {
    return this.favorites.toggle(user.id, spaceId)
  }
}
