# V-Cure — AI-Powered Personalized Nutrition & Preventive Healthcare Platform

[![V-Cure](https://img.shields.io/badge/V--Cure-Preventive%20Healthcare-047857)](https://v-cure-health.vercel.app)
[![Framework](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![Backend](https://img.shields.io/badge/NestJS-10-red)](https://nestjs.com/)
[![Database](https://img.shields.io/badge/PostgreSQL-Supabase-blue)](https://supabase.com/)
[![Mobile](https://img.shields.io/badge/Capacitor-Android-3DDC84)](https://capacitorjs.com/)

V-Cure is a preventive healthcare platform that combines clinical safety guardrails, personalized regional meal planning, OCR medical report extraction, and AI health coaching.

---

## 🏛️ Architecture Overview

The repository is structured as a monorepo containing the full end-to-end platform:

```
v-Cure-Application/
├── vcure-frontend/              # Next.js 15 App Router Frontend & Capacitor Mobile App
│   ├── src/                     # Auth, Dashboard, Meals, AI Coach, Health Vault, Shopping, Education
│   ├── public/assets/           # Official V-Cure brand logo & symbol assets
│   ├── android/                 # Native Android Capacitor Wrapper Project
│   └── capacitor.config.ts      # Mobile Platform Configuration
│
├── vcure-backend-complete/
│   ├── acc2/                    # ACC2 NestJS Production REST API Server
│   │   └── apps/api/            # Auth, Medical Reports, Health Profile, Safety Engine, AI Coach
│   └── acc3/                    # ACC3 Data Foundation & Schema Layer
│       └── prisma/              # Schema, Migrations, Seeders (PostgreSQL)
│
├── .env.example                 # Environment Variable Cheat Sheet (Root)
├── render.yaml                  # Production Backend Deployment Spec (Render)
└── README.md                    # Platform Documentation
```

---

## 🚀 Key Features

1. **AI Health Coach & Clinical Safety Engine:**
   - Real-time guidance with strict clinical safety guardrails (allergen checking, glycemic load monitoring, medication interaction warnings).
2. **Personalized Meal & Alternative Swap Engine:**
   - Culturally personalized meal recommendations with regional ingredient substitutes (Breakfast, Lunch, Snack, Dinner).
3. **Health Vault & OCR Extraction:**
   - PDF/JPG/PNG report upload pipeline storing metadata in PostgreSQL and raw files in Supabase Binary Storage.
4. **Family & Delegate Consent Management:**
   - Real permission-gated delegate access for multi-generational care.
5. **Dynamic Health Score Trajectory:**
   - Real-time biometric score computation based on labs, lifestyle, and dietary logs.
6. **Cross-Platform Android Mobile Application:**
   - Capacitor 6 native Android wrapper with official V-Cure branding, splash screens, and adaptive launcher icons.

---

## 🛠️ Quick Start & Local Setup

### 1. Prerequisites
- **Node.js**: v18.x or v20.x
- **PostgreSQL**: v15+ (or Supabase Connection String)
- **JDK / Android SDK**: Java 17 + Android 34 SDK (for mobile builds)

### 2. Backend Setup
```bash
cd vcure-backend-complete/acc2/apps/api
cp .env.example .env

# Generate Prisma Client & Run Seeds
npx prisma generate --schema=../../../acc3/prisma/schema.prisma
npx ts-node ../../../acc3/prisma/seed/index.ts

# Start Backend API Server (Port 4000)
npm run start:dev
```

### 3. Frontend Setup
```bash
cd vcure-frontend
cp .env.example .env.local

# Run Development Server (Port 3000)
npm run dev
```

---

## 📱 Android APK Compilation

To build the native Android Debug APK:

```bash
cd vcure-frontend

# Typecheck & Web Build Verification
npm run typecheck
npm run build

# Synchronize Web Assets to Android Platform
npx cap sync android

# Compile Native Debug APK via Gradle
cd android
./gradlew assembleDebug
```

The compiled APK will be generated at:
`vcure-frontend/android/app/build/outputs/apk/debug/app-debug.apk`

---

## 💻 Local Development Setup (Default)

The project is configured to run locally out-of-the-box without requiring any remote cloud deployment:

- **Frontend Web App:** `http://localhost:3000`
- **Backend API Server:** `http://localhost:4000/api/v1`

### Running the Backend (Port 4000)
```bash
cd vcure-backend-complete/acc2/apps/api
npm run start:prod
# Or development mode with auto-reload:
# npm run start:dev
```

### Running the Frontend (Port 3000)
```bash
cd vcure-frontend
npm run dev
```

Both services are fully connected via CORS (`origin: http://localhost:3000`) and `.env.local`.

---

## 🔒 Security & Privacy Compliance

- **No Hardcoded Secrets:** All private credentials, database passwords, and API keys are loaded via runtime environment variables.
- **HIPAA / GDPR Ready Data Partitioning:** Sensitive health profiles and medical reports are isolated with field-level encryption policies.
- **No Mock Fallbacks in Production:** Production environments communicate exclusively with live PostgreSQL / Supabase storage endpoints.
