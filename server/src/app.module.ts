import { Controller, Get, Module } from '@nestjs/common';

@Controller('health')
class HealthController {
  @Get()
  health() { return { status: 'ok', stage: 'foundation', businessApiEnabled: false }; }
}

// Only liveness is public. Business modules stay unregistered until real session authentication exists.
@Module({ controllers: [HealthController] })
export class AppModule {}
