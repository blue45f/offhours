import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { APP_GUARD } from '@nestjs/core'
import { ScheduleModule } from '@nestjs/schedule'

import { PrismaModule } from './prisma/prisma.module'
import { AuthModule } from './auth/auth.module'
import { UsersModule } from './users/users.module'
import { HostModule } from './host/host.module'
import { VenuesModule } from './venues/venues.module'
import { SpacesModule } from './spaces/spaces.module'
import { SlotsModule } from './slots/slots.module'
import { AddonsModule } from './addons/addons.module'
import { ReservationsModule } from './reservations/reservations.module'
import { PaymentsModule } from './payments/payments.module'
import { ReviewsModule } from './reviews/reviews.module'
import { ChatModule } from './chat/chat.module'
import { NotificationsModule } from './notifications/notifications.module'
import { FavoritesModule } from './favorites/favorites.module'
import { CollectionsModule } from './collections/collections.module'
import { SplitsModule } from './splits/splits.module'
import { CalendarsModule } from './calendars/calendars.module'
import { CorporateModule } from './corporate/corporate.module'
import { WaitlistModule } from './waitlist/waitlist.module'
import { ReportsModule } from './reports/reports.module'
import { AdminModule } from './admin/admin.module'
import { SeoModule } from './seo/seo.module'
import { UploadsModule } from './uploads/uploads.module'
import { HealthController } from './common/health.controller'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 120 }]),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    HostModule,
    VenuesModule,
    SpacesModule,
    SlotsModule,
    AddonsModule,
    ReservationsModule,
    PaymentsModule,
    ReviewsModule,
    ChatModule,
    NotificationsModule,
    FavoritesModule,
    CollectionsModule,
    SplitsModule,
    CalendarsModule,
    CorporateModule,
    WaitlistModule,
    ReportsModule,
    AdminModule,
    SeoModule,
    UploadsModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
