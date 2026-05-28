import { Module, forwardRef } from '@nestjs/common'

import { AuthModule } from '../auth/auth.module'
import { SlotsController } from './slots.controller'
import { SlotsService } from './slots.service'
import { SlotsScheduler } from './slots.scheduler'

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [SlotsController],
  providers: [SlotsService, SlotsScheduler],
  exports: [SlotsService],
})
export class SlotsModule {}
