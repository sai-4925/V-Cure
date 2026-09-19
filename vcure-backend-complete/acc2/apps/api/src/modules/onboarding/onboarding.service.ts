import {
  Injectable,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import { UsersRepository } from '../users/users.repository';
import { HealthProfileRepository } from '../health-profile/health-profile.repository';
import { LifestyleAssessmentRepository } from '../lifestyle-assessment/lifestyle-assessment.repository';
import { MedicalHistoryRepository } from '../medical-history/medical-history.repository';
import { AuthRepository } from '../auth/auth.repository';
import { HealthProfileService } from '../health-profile/health-profile.service';
import { LifestyleAssessmentService } from '../lifestyle-assessment/lifestyle-assessment.service';
import { OnboardingCompleteDto } from './dto/onboarding-complete.dto';
import { OnboardingCompleteResponse } from './types/onboarding.type';

@Injectable()
export class OnboardingService {
  private readonly logger = new Logger(OnboardingService.name);

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly healthProfileRepository: HealthProfileRepository,
    private readonly lifestyleRepository: LifestyleAssessmentRepository,
    private readonly medicalHistoryRepository: MedicalHistoryRepository,
    private readonly authRepository: AuthRepository,
    private readonly healthProfileService: HealthProfileService,
    private readonly lifestyleService: LifestyleAssessmentService,
  ) {}

  /**
   * Completes onboarding in a single transaction (03 §54: registration and
   * health-profile creation must be transactional — if one write fails,
   * everything rolls back).
   *
   * Clinical logic is NOT reimplemented here: BMI comes from
   * HealthProfileService and risk flags from LifestyleAssessmentService, so
   * there is exactly one source for each.
   */
  async complete(
    userId: string,
    dto: OnboardingCompleteDto,
  ): Promise<OnboardingCompleteResponse> {
    let existingProfile = await this.usersRepository.findActiveProfile(userId);

    const bmi = this.healthProfileService.computeBmi(
      dto.healthProfile?.heightCm || 170,
      dto.healthProfile?.weightKg || 70,
    );

    await this.usersRepository.runInTransaction(async (tx) => {
      if (!existingProfile) {
        existingProfile = await tx.userProfile.create({
          data: {
            userId,
            firstName: 'V-Cure',
            lastName: 'Patient',
            dateOfBirth: dto.personalInfo?.dateOfBirth ? new Date(dto.personalInfo.dateOfBirth) : null,
            gender: (dto.personalInfo?.gender as any) || 'OTHER',
          }
        });
      } else if (dto.personalInfo) {
        await this.usersRepository.updateProfile(
          existingProfile.id,
          {
            dateOfBirth: dto.personalInfo.dateOfBirth ? new Date(dto.personalInfo.dateOfBirth) : undefined,
            gender: (dto.personalInfo.gender as any) || undefined,
          },
          tx,
        );
      }

      const healthData = {
        age: dto.personalInfo?.dateOfBirth
          ? this.healthProfileService.deriveAgeFrom(new Date(dto.personalInfo.dateOfBirth))
          : 30,
        gender: (dto.personalInfo?.gender as any) || 'OTHER',
        heightCm: dto.healthProfile?.heightCm || 170,
        weightKg: dto.healthProfile?.weightKg || 70,
        bloodGroup: dto.healthProfile?.bloodGroup,
        bmi,
        activityLevel: (dto.lifestyle?.activityLevel as any) || 'MODERATELY_ACTIVE',
        primaryGoal: this.healthProfileService.toCanonicalGoalPublic(
          dto.goals?.primaryGoal || 'GENERAL_WELLNESS',
        ),
      };
      await this.healthProfileRepository.upsertByUserId(
        userId,
        { userId, ...healthData },
        healthData,
        tx,
      );

      const lifestyleData = {
        activityLevel: (dto.lifestyle?.activityLevel as any) || 'MODERATELY_ACTIVE',
        sleepHoursAvg: dto.lifestyle?.sleepHours || 7,
        smokingStatus: dto.lifestyle?.smokingStatus,
        alcoholStatus: dto.lifestyle?.alcoholConsumption,
      };
      await this.lifestyleRepository.upsertByUserId(
        userId,
        { userId, ...lifestyleData },
        lifestyleData,
        tx,
      );

      if (dto.medicalProfile?.conditions) {
        for (const name of dto.medicalProfile.conditions) {
          const disease = await this.medicalHistoryRepository.findDiseaseByName(name, tx);
          if (disease) {
            await this.medicalHistoryRepository.createCondition(
              { userId, diseaseId: disease.id, severity: 'MODERATE' },
              tx,
            );
          }
        }
      }

      if (dto.medicalProfile?.allergies) {
        for (const allergen of dto.medicalProfile.allergies) {
          const allergyType = await this.medicalHistoryRepository.findAllergyTypeByName(allergen, tx);
          if (allergyType) {
            await this.medicalHistoryRepository.createAllergy(
              { userId, allergyTypeId: allergyType.id, severity: 'MODERATE' },
              tx,
            );
          }
        }
      }

      if (dto.medicalProfile?.medications) {
        for (const medName of dto.medicalProfile.medications) {
          if (medName && medName.trim()) {
            await this.medicalHistoryRepository.createMedicine(
              {
                userId,
                name: medName.trim(),
                dosage: 'As prescribed',
                frequency: 'Daily',
                isActive: true,
              },
              tx,
            );
          }
        }
      }

      await this.authRepository.markOnboardingCompleted(userId, tx);
    });

    const riskFlags = await this.lifestyleService.getRiskFlags(userId);

    return { onboardingCompleted: true, bmi, riskFlags };
  }
}
