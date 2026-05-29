import { Module } from '@nestjs/common'

import { AuthModule } from '../auth/auth.module'
import { SlotsModule } from '../slots/slots.module'
import { NotificationsModule } from '../notifications/notifications.module'
import { WaitlistModule } from '../waitlist/waitlist.module'
import { ReservationsController } from './reservations.controller'
import { ReservationsService } from './reservations.service'

@Module({
  imports: [AuthModule, SlotsModule, NotificationsModule, WaitlistModule],
  controllers: [ReservationsController],
  providers: [ReservationsService],
  exports: [ReservationsService],
})
export class ReservationsModule {}
