import { Module } from '@nestjs/common'

import { AuthModule } from '../auth/auth.module'
import { NotificationsModule } from '../notifications/notifications.module'
import { PaymentsModule } from '../payments/payments.module'
import { SlotsModule } from '../slots/slots.module'
import { WaitlistModule } from '../waitlist/waitlist.module'

import { ReservationsController } from './reservations.controller'
import { ReservationsScheduler } from './reservations.scheduler'
import { ReservationsService } from './reservations.service'

@Module({
  imports: [AuthModule, SlotsModule, NotificationsModule, WaitlistModule, PaymentsModule],
  controllers: [ReservationsController],
  providers: [ReservationsService, ReservationsScheduler],
  exports: [ReservationsService],
})
export class ReservationsModule {}
