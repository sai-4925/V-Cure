import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../users/users.repository';
import { HealthProfileRepository } from '../health-profile/health-profile.repository';
import { HealthProfileService } from '../health-profile/health-profile.service';
import { LifestyleAssessmentService } from '../lifestyle-assessment/lifestyle-assessment.service';
import { DashboardSummary } from './types/dashboard.type';

@Injectable()
export class DashboardService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly healthProfileRepository: HealthProfileRepository,
    private readonly healthProfileService: HealthProfileService,
    private readonly lifestyleService: LifestyleAssessmentService,
  ) {}

  /**
   * Aggregates persisted data only.
   *
   * `todayMeals` and `streakDays` depend on meal/recommendation and tracking
   * modules that do not exist in ACC2. They return the empty representation
   * ACC1's non-nullable types permit ([] and 0). NO meal, recommendation,
   * progress, streak or AI logic is implemented or faked here — see
   * DASHBOARD-EMPTY in the report.
   */
  async getSummary(userId: string): Promise<DashboardSummary> {
    const [profile, healthProfile, riskFlags, history] = await Promise.all([
      this.usersRepository.findActiveProfile(userId),
      this.healthProfileRepository.findActive(userId),
      this.lifestyleService.getRiskFlags(userId),
      this.healthProfileRepository.findWeightTrendByUser(userId),
    ]);

    const bmi = healthProfile?.bmi ?? null;

    const profileName = (profile as any)?.fullName || [profile?.firstName, profile?.lastName].filter(Boolean).join(' ').trim();
    const name = profileName && profileName !== '' ? profileName : 'V-Cure Patient';

    return {
      fullName: name,
      bmi,
      // Reuses HealthProfileService — thresholds are not duplicated here.
      bmiCategory: bmi === null ? null : this.healthProfileService.categorizeBmi(bmi),
      activeRiskFlags: riskFlags,
      todayMeals: [], // module does not exist — not fabricated
      weightTrend: history.map((h) => ({
        date: h.recordedAt.toISOString(),
        weightKg: h.weightKg,
      })),
      streakDays: 0, // tracking module does not exist — not fabricated
    };
  }
}
