import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import { ScheduleModule } from '@nestjs/schedule'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { LoggerModule } from 'nestjs-pino'

import { AddonsModule } from './addons/addons.module'
import { AdminModule } from './admin/admin.module'
import { AuthModule } from './auth/auth.module'
import { CalendarsModule } from './calendars/calendars.module'
import { ChatModule } from './chat/chat.module'
import { CollectionsModule } from './collections/collections.module'
import { HealthController } from './common/health.controller'
import { CorporateModule } from './corporate/corporate.module'
import { EventsModule } from './events/events.module'
import { FavoritesModule } from './favorites/favorites.module'
import { HostModule } from './host/host.module'
import { NotificationsModule } from './notifications/notifications.module'
import { PaymentsModule } from './payments/payments.module'
import { PrismaModule } from './prisma/prisma.module'
import { ReportsModule } from './reports/reports.module'
import { ReservationsModule } from './reservations/reservations.module'
import { ReviewsModule } from './reviews/reviews.module'
import { SeoModule } from './seo/seo.module'
import { SlotsModule } from './slots/slots.module'
import { SpacesModule } from './spaces/spaces.module'
import { SplitsModule } from './splits/splits.module'
import { UsersModule } from './users/users.module'
import { VenuesModule } from './venues/venues.module'
import { WaitlistModule } from './waitlist/waitlist.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { singleLine: true } }
            : undefined,
        autoLogging: {
          ignore: (req) =>
            req.url?.startsWith('/health') || req.url?.startsWith('/api/docs') || false,
        },
      },
    }),
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
    EventsModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
