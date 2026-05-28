import { Module } from '@nestjs/common'

import { AuthModule } from '../auth/auth.module'
import { NotificationsModule } from '../notifications/notifications.module'
import { PaymentsController } from './payments.controller'
import { PaymentsService } from './payments.service'
import { TossProvider } from './toss.provider'

@Module({
  imports: [AuthModule, NotificationsModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, TossProvider],
  exports: [PaymentsService],
})
export class PaymentsModule {}
