import { Controller, Get, Header } from '@nestjs/common'

import { PrismaService } from '../prisma/prisma.service'
import { Public } from '../common/decorators/public.decorator'

@Controller('seo')
export class SeoController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get('sitemap.xml')
  @Header('Content-Type', 'application/xml')
  async sitemap(): Promise<string> {
    const base = process.env.APP_URL ?? 'https://offhours.kr'
    const spaces = await this.prisma.space.findMany({
      where: { status: 'ACTIVE' },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
      take: 5000,
    })
    const urls = [
      `<url><loc>${base}/</loc><changefreq>daily</changefreq></url>`,
      `<url><loc>${base}/spaces</loc><changefreq>daily</changefreq></url>`,
      ...spaces.map(
        (s) =>
          `<url><loc>${base}/spaces/${s.slug}</loc><lastmod>${s.updatedAt.toISOString()}</lastmod></url>`
      ),
    ].join('\n  ')
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  ${urls}\n</urlset>`
  }

  @Public()
  @Get('robots.txt')
  @Header('Content-Type', 'text/plain')
  async robots(): Promise<string> {
    const base = process.env.APP_URL ?? 'https://offhours.kr'
    return `User-agent: *\nAllow: /\nDisallow: /admin\nSitemap: ${base}/sitemap.xml\n`
  }
}
