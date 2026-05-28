import { Module, forwardRef } from '@nestjs/common'

import { AuthModule } from '../auth/auth.module'
import { SpacesController } from './spaces.controller'
import { SpacesService } from './spaces.service'
import { SlotsModule } from '../slots/slots.module'

@Module({
  imports: [AuthModule, forwardRef(() => SlotsModule)],
  controllers: [SpacesController],
  providers: [SpacesService],
  exports: [SpacesService],
})
export class SpacesModule {}
