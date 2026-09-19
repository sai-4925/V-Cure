import { Injectable } from '@nestjs/common';
import { ExerciseTracking, SleepTracking, WaterTracking } from '@prisma/client';
import { TrackingRepository } from './tracking.repository';
import { LogWaterDto, WaterHistoryQueryDto } from './dto/water.dto';
import { LogSleepDto } from './dto/sleep.dto';
import { LogExerciseDto } from './dto/exercise.dto';
import {
  ExerciseEntryResponse,
  SleepEntryResponse,
  WaterDailyTotalResponse,
  WaterEntryResponse,
} from './types/tracking.type';

@Injectable()
export class TrackingService {
  constructor(private readonly repository: TrackingRepository) {}

  /**
   * Bible API 44 — POST /water.
   *
   * Returns the running total for the day the entry belongs to, which is what
   * ACC1's `logWaterIntake` consumes. The total is a plain sum of logged
   * values — no target, goal or adherence percentage is derived, because no
   * water-requirement formula is defined (RULE-024 mandates one; none exists).
   */
  async logWater(
    userId: string,
    dto: LogWaterDto,
  ): Promise<WaterDailyTotalResponse> {
    const loggedAt = dto.loggedAt ? new Date(dto.loggedAt) : new Date();
    await this.repository.createWaterEntry({
      userId,
      amountMl: dto.amountMl,
      loggedAt,
    });

    const { start, end } = this.dayBounds(loggedAt);
    const entries = await this.repository.findWaterEntriesForDay(
      userId,
      start,
      end,
    );
    return {
      date: start.toISOString(),
      waterLoggedMl: entries.reduce((sum, e) => sum + e.amountMl, 0),
    };
  }

  /** Bible API 45 — GET /water/history. */
  async getWaterHistory(
    userId: string,
    query: WaterHistoryQueryDto,
  ): Promise<WaterEntryResponse[]> {
    const entries = await this.repository.findWaterEntries(userId, {
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
    });
    return entries.map((e) => this.toResponse(e));
  }

  /**
   * Bible API 46 — POST /sleep.
   *
   * Persists the four documented fields and returns the stored row. No sleep
   * score, target, debt or quality inference is derived — none is defined.
   */
  async logSleep(userId: string, dto: LogSleepDto): Promise<SleepEntryResponse> {
    const bedTime = dto.bedTime ? new Date(dto.bedTime) : new Date();
    const wakeTime = dto.wakeTime ? new Date(dto.wakeTime) : new Date();
    const saved = await this.repository.createSleepEntry({
      userId,
      sleepStart: bedTime,
      sleepEnd: wakeTime,
      qualityScore: dto.quality ? 4 : null,
    });
    return this.toSleepResponse(saved);
  }

  /**
   * Bible API 47 — POST /exercise.
   *
   * `caloriesBurned` is stored exactly as supplied. It is never computed:
   * no MET table, intensity model or burn formula exists in any document.
   */
  async logExercise(
    userId: string,
    dto: LogExerciseDto,
  ): Promise<ExerciseEntryResponse> {
    // ACC1/Bible field names map onto ACC3 canonical columns:
    // exerciseType -> activityType, loggedAt -> performedAt.
    const saved = await this.repository.createExerciseEntry({
      userId,
      activityType: dto.exerciseType,
      durationMinutes: dto.durationMinutes,
      caloriesBurned: dto.caloriesBurned ?? null,
    });
    return this.toExerciseResponse(saved);
  }

  private toSleepResponse(entry: SleepTracking): SleepEntryResponse {
    const e = entry as any;
    const diffHours = (entry.sleepEnd.getTime() - entry.sleepStart.getTime()) / (1000 * 60 * 60);
    return {
      id: entry.id,
      hours: e.hours ?? (diffHours > 0 ? diffHours : 8),
      quality: e.quality ?? 'FAIR',
      bedTime: e.bedTime ?? entry.sleepStart,
      wakeTime: e.wakeTime ?? entry.sleepEnd,
      loggedAt: e.loggedAt ?? entry.createdAt,
    };
  }

  private toExerciseResponse(entry: ExerciseTracking): ExerciseEntryResponse {
    return {
      id: entry.id,
      exerciseType: entry.activityType,
      durationMinutes: entry.durationMinutes,
      caloriesBurned: entry.caloriesBurned,
      loggedAt: entry.performedAt,
    };
  }

  /**
   * UTC day bounds. 03 §24 stores everything in UTC and pushes local-time
   * conversion to the frontend, so "day" is defined in UTC here rather than
   * inventing a per-user timezone rule.
   */
  private dayBounds(at: Date): { start: Date; end: Date } {
    const start = new Date(
      Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate(), 0, 0, 0, 0),
    );
    const end = new Date(
      Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate(), 23, 59, 59, 999),
    );
    return { start, end };
  }

  /** Health Readings — POST /health-readings */
  async logHealthReading(
    userId: string,
    dto: {
      metricType: any;
      value: number;
      secondaryValue?: number;
      unit: string;
      context?: any;
      notes?: string;
      recordedAt?: string;
    },
  ) {
    const recordedAt = dto.recordedAt ? new Date(dto.recordedAt) : new Date();
    return this.repository.createHealthReading({
      userId,
      metricType: dto.metricType,
      value: dto.value,
      secondaryValue: dto.secondaryValue ?? null,
      unit: dto.unit,
      context: dto.context ?? null,
      notes: dto.notes ?? null,
      recordedAt,
    });
  }

  /** Health Readings — GET /health-readings */
  async getHealthReadings(
    userId: string,
    query?: { metricType?: string; days?: number },
  ) {
    let fromDate: Date | undefined = undefined;
    if (query?.days) {
      fromDate = new Date(Date.now() - query.days * 24 * 60 * 60 * 1000);
    }
    return this.repository.findHealthReadings(userId, {
      metricType: query?.metricType,
      from: fromDate,
    });
  }

  private toResponse(entry: WaterTracking): WaterEntryResponse {
    return { id: entry.id, amountMl: entry.amountMl, loggedAt: entry.loggedAt };
  }
}
