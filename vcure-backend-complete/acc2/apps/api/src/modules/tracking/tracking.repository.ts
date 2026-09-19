import { Injectable } from '@nestjs/common';
import {
  ExerciseTracking,
  Prisma,
  SleepTracking,
  WaterTracking,
} from '@prisma/client';
import { BaseRepository } from '../../database/base.repository';
import { PrismaTx } from '../../database/prisma-tx.type';

@Injectable()
export class TrackingRepository extends BaseRepository {
  createWaterEntry(
    data: Prisma.WaterTrackingUncheckedCreateInput,
    tx?: PrismaTx,
  ): Promise<WaterTracking> {
    return this.db(tx).waterTracking.create({ data });
  }

  findWaterEntries(
    userId: string,
    range: { from?: Date; to?: Date },
    tx?: PrismaTx,
  ): Promise<WaterTracking[]> {
    return this.db(tx).waterTracking.findMany({
      where: {
        userId,
        ...(range.from || range.to
          ? {
              loggedAt: {
                ...(range.from ? { gte: range.from } : {}),
                ...(range.to ? { lte: range.to } : {}),
              },
            }
          : {}),
      },
      orderBy: { loggedAt: 'desc' },
    });
  }

  findWaterEntriesForDay(
    userId: string,
    dayStart: Date,
    dayEnd: Date,
    tx?: PrismaTx,
  ): Promise<WaterTracking[]> {
    return this.db(tx).waterTracking.findMany({
      where: { userId, loggedAt: { gte: dayStart, lte: dayEnd } },
    });
  }

  // --- Sleep (Bible API 46) ---
  createSleepEntry(
    data: Prisma.SleepTrackingUncheckedCreateInput,
    tx?: PrismaTx,
  ): Promise<SleepTracking> {
    return this.db(tx).sleepTracking.create({ data });
  }

  // --- Exercise (Bible API 47) ---
  createExerciseEntry(
    data: Prisma.ExerciseTrackingUncheckedCreateInput,
    tx?: PrismaTx,
  ): Promise<ExerciseTracking> {
    return this.db(tx).exerciseTracking.create({ data });
  }

  // --- Health Readings ---
  createHealthReading(
    data: Prisma.HealthReadingUncheckedCreateInput,
    tx?: PrismaTx,
  ) {
    return this.db(tx).healthReading.create({ data });
  }

  findHealthReadings(
    userId: string,
    options?: { metricType?: string; from?: Date },
    tx?: PrismaTx,
  ) {
    return this.db(tx).healthReading.findMany({
      where: {
        userId,
        ...(options?.metricType ? { metricType: options.metricType as any } : {}),
        ...(options?.from ? { recordedAt: { gte: options.from } } : {}),
      },
      orderBy: { recordedAt: 'desc' },
    });
  }
}
