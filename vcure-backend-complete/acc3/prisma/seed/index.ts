import { PrismaClient } from '@prisma/client';
import { seedRolesAndPermissions } from './roles-permissions.seed';
import { seedGeography } from './geography.seed';
import { seedLanguages, seedReligions, seedSubscriptionPlans } from './localization.seed';
import {
  seedFoodCategories,
  seedDiseasesAndCategories,
  seedAllergyTypes,
  seedContentCategories,
  seedNutrientCatalogs,
} from './catalogs.seed';
import { seedPromptTemplates, seedModelConfigurations } from './ai-foundation.seed';
import { seedFoodMedicineInteractions } from './food-medicine-interactions.seed';
import { seedDemoData } from './demo.seed';

const prisma = new PrismaClient();

/**
 * Sec. 65 SEED STRATEGY — "Seed scripts must be repeatable."
 * Every seed function below uses upsert on a unique natural key, so running
 * `npm run seed` multiple times is always safe (idempotent).
 *
 * Order matters only where a later seed references an id from an earlier one
 * (e.g. Disease -> DiseaseCategory). Independent seeds run in parallel.
 */
async function main() {
  console.log('V-Cure database seeding started...\n');

  // Independent master data — run sequentially to respect connection limits on pooled database
  await seedRolesAndPermissions(prisma);
  await seedGeography(prisma);
  await seedLanguages(prisma);
  await seedReligions(prisma);
  await seedSubscriptionPlans(prisma);
  await seedFoodCategories(prisma);
  await seedAllergyTypes(prisma);
  await seedContentCategories(prisma);
  await seedNutrientCatalogs(prisma);

  // Depends on nothing above, but kept sequential for clear log ordering
  await seedDiseasesAndCategories(prisma);

  // AI Foundation — prompt templates & model configuration
  await seedPromptTemplates(prisma);
  await seedModelConfigurations(prisma);

  // Depends on Food catalog rows existing (created by content ops, not this seed) — skips gracefully otherwise.
  await seedFoodMedicineInteractions(prisma);

  // Demo User, Health Profile, Allergies, Medical Conditions, Foods, and Meals
  await seedDemoData(prisma);

  console.log('\nV-Cure database seeding completed successfully.');
}

main()
  .catch((err) => {
    console.error('Seeding failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
