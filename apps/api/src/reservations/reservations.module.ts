import { Module } from '@nestjs/common'

import { AuthModule } from '../auth/auth.module'
import { SlotsModule } from '../slots/slots.module'
import { NotificationsModule } from '../notifications/notifications.module'
import { WaitlistModule } from '../waitlist/waitlist.module'
import { PaymentsModule } from '../payments/payments.module'
import { ReservationsController } from './reservations.controller'
import { ReservationsService } from './reservations.service'
import { ReservationsScheduler } from './reservations.scheduler'

@Module({
  imports: [AuthModule, SlotsModule, NotificationsModule, WaitlistModule, PaymentsModule],
  controllers: [ReservationsController],
  providers: [ReservationsService, ReservationsScheduler],
  exports: [ReservationsService],
})
export class ReservationsModule {}
