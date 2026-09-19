import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { TrackingService } from './tracking.service';
import { LogWaterDto, WaterHistoryQueryDto } from './dto/water.dto';
import { LogSleepDto } from './dto/sleep.dto';
import { LogExerciseDto } from './dto/exercise.dto';
import { CreateHealthReadingDto, QueryHealthReadingsDto } from './dto/health-reading.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types/auth-tokens.type';
import {
  ExerciseEntryResponse,
  SleepEntryResponse,
  WaterDailyTotalResponse,
  WaterEntryResponse,
} from './types/tracking.type';

/**
 * Tracking domain. Water only for now — Bible APIs 44 and 45.
 *
 * Water (44/45), sleep (46) and exercise (47). Meal tracking remains blocked:
 * it needs a `Meal` reference whose `safetyStatus` comes from the ACC3 Safety
 * Engine. See TRACKING-BLOCKED.
 */
@Controller()
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  /** Bible API 44 */
  @Post('water')
  logWater(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: LogWaterDto,
  ): Promise<WaterDailyTotalResponse> {
    return this.trackingService.logWater(user.id, dto);
  }

  /** Bible API 45 */
  @Get('water/history')
  getWaterHistory(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: WaterHistoryQueryDto,
  ): Promise<WaterEntryResponse[]> {
    return this.trackingService.getWaterHistory(user.id, query);
  }

  /** Bible API 46 */
  @Post('sleep')
  logSleep(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: LogSleepDto,
  ): Promise<SleepEntryResponse> {
    return this.trackingService.logSleep(user.id, dto);
  }

  /** Bible API 47 */
  @Post('exercise')
  logExercise(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: LogExerciseDto,
  ): Promise<ExerciseEntryResponse> {
    return this.trackingService.logExercise(user.id, dto);
  }

  /** Health Monitoring Foundation */
  @Post('health-readings')
  logHealthReading(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateHealthReadingDto,
  ) {
    return this.trackingService.logHealthReading(user.id, dto);
  }

  @Get('health-readings')
  getHealthReadings(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: QueryHealthReadingsDto,
  ) {
    return this.trackingService.getHealthReadings(user.id, query);
  }
}
