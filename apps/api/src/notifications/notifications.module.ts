import { Module } from '@nestjs/common'

import { AuthModule } from '../auth/auth.module'
import { NotificationsController } from './notifications.controller'
import { NotificationsService } from './notifications.service'
import { NotificationChannels } from './channels.provider'

@Module({
  imports: [AuthModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationChannels],
  exports: [NotificationsService],
})
export class NotificationsModule {}
