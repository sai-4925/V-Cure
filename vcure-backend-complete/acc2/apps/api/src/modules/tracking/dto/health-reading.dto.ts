import { IsEnum, IsNumber, IsOptional, IsString, IsDateString } from 'class-validator';
import { HealthMetricType, GlucoseContext } from '@prisma/client';

export class CreateHealthReadingDto {
  @IsEnum(HealthMetricType)
  metricType!: HealthMetricType;

  @IsNumber()
  value!: number;

  @IsOptional()
  @IsNumber()
  secondaryValue?: number;

  @IsString()
  unit!: string;

  @IsOptional()
  @IsEnum(GlucoseContext)
  context?: GlucoseContext;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsDateString()
  recordedAt?: string;
}

export class QueryHealthReadingsDto {
  @IsOptional()
  @IsEnum(HealthMetricType)
  metricType?: HealthMetricType;

  @IsOptional()
  @IsNumber()
  days?: number;
}
