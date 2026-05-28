import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common'
import type { Request } from 'express'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import {
  AddToCollectionSchema,
  CreateCollectionSchema,
  UpdateCollectionSchema,
  type AddToCollectionInput,
  type CreateCollectionInput,
  type UpdateCollectionInput,
} from '@offhours/shared'

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator'
import { Public } from '../common/decorators/public.decorator'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe'
import { CollectionsService } from './collections.service'

@ApiBearerAuth()
@ApiTags('collections')
@UseGuards(JwtAuthGuard)
@Controller('collections')
export class CollectionsController {
  constructor(private readonly collections: CollectionsService) {}

  @Get()
  async listMine(@CurrentUser() user: RequestUser) {
    return this.collections.list(user.id)
  }

  @Post()
  async create(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(CreateCollectionSchema)) body: CreateCollectionInput
  ) {
    return this.collections.create(user.id, body)
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateCollectionSchema)) body: UpdateCollectionInput
  ) {
    return this.collections.update(user.id, id, body)
  }

  @Delete(':id')
  async remove(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.collections.remove(user.id, id)
  }

  // public: 비공개 컬렉션은 ownerId === viewer 일 때만 200, 아니면 404
  @Public()
  @Get('slug/:slug')
  async getBySlug(@Param('slug') slug: string, @Req() req: Request & { user?: RequestUser }) {
    return this.collections.getBySlug(slug, req.user?.id)
  }

  @Post(':id/items')
  async addItem(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(AddToCollectionSchema)) body: AddToCollectionInput
  ) {
    return this.collections.addToCollection(user.id, id, body.spaceId, body.note)
  }

  @Delete(':id/items/:spaceId')
  async removeItem(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Param('spaceId') spaceId: string
  ) {
    return this.collections.removeFromCollection(user.id, id, spaceId)
  }
}
