import Link from "next/link";
import { ArrowLeft, AlertTriangle, Scale } from "lucide-react";
import { Container } from "@/components/ui/container";
import { VCureWordmarkLogo } from "@/components/ui/vcure-logo";

export const metadata = {
  title: "Terms of Service | V-Cure Health",
  description: "Terms of Service and conditions of use for the V-Cure Health wellness platform."
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gray-50 text-slate-900 font-sans">
      {/* Navigation Header */}
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur-md">
        <Container className="max-w-4xl px-4 py-3.5 flex items-center justify-between">
          <Link href="/auth/login" className="flex items-center gap-2 text-xs font-bold text-emerald-700 hover:underline">
            <ArrowLeft className="h-4 w-4" />
            Back to Sign In
          </Link>

          <VCureWordmarkLogo variant="dark" className="h-7 w-auto" />

          <Link href="/privacy" className="text-xs font-bold text-slate-600 hover:text-emerald-700 transition-colors">
            Privacy Policy
          </Link>
        </Container>
      </header>

      {/* Main Content Container */}
      <main className="py-8 md:py-12">
        <Container className="max-w-4xl px-4 space-y-8">
          {/* Header Title Section */}
          <div className="border-b border-gray-200 pb-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200 mb-3">
              <Scale className="h-4 w-4 text-emerald-600" />
              Official Terms
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              Terms of Service
            </h1>
            <p className="mt-2 text-xs font-medium text-slate-500">
              Effective Date: September 16, 2026 • Platform Version: 1.0 (Prototype)
            </p>
          </div>

          {/* Emergency & Medical Disclaimer Callout Box */}
          <div className="rounded-2xl border border-red-200 bg-red-50/80 p-5 space-y-2 text-red-900">
            <h2 className="text-sm font-bold flex items-center gap-2 text-red-900">
              <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
              IMPORTANT MEDICAL & EMERGENCY DISCLAIMER
            </h2>
            <p className="text-xs font-medium leading-relaxed">
              V-CURE IS <strong>NOT</strong> DESIGNED FOR MEDICAL EMERGENCIES OR DIAGNOSTIC USE. 
              IF YOU ARE EXPERIENCING A MEDICAL EMERGENCY, SEVERE CHEST PAIN, ACUTE SHORTNESS OF BREATH, OR OTHER CRITICAL SYMPTOMS, 
              IMMEDIATELY CALL YOUR LOCAL EMERGENCY SERVICES (SUCH AS 112 OR 911) OR VISIT THE NEAREST HOSPITAL EMERGENCY ROOM. 
              DO NOT RELY ON V-CURE FOR EMERGENCY MEDICAL GUIDANCE.
            </p>
          </div>

          {/* Terms Content Sections */}
          <div className="prose prose-slate max-w-none space-y-6 text-sm leading-relaxed text-slate-700">
            <section className="space-y-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
              <h2 className="text-base font-bold text-slate-900">1. Acceptance of Terms</h2>
              <p>
                By accessing or using the V-Cure Health platform, application, or services (&quot;V-Cure&quot;), you agree to be bound by these Terms of Service. 
                If you do not agree to these terms, you may not access or use the application.
              </p>
            </section>

            <section className="space-y-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
              <h2 className="text-base font-bold text-slate-900">2. Description of Platform</h2>
              <p>
                V-Cure is a digital health, nutrition, and wellness management application prototype designed to assist users in tracking self-reported lifestyle habits, 
                organizing personal health records, viewing generalized meal planning ideas, and engaging with educational health content.
              </p>
            </section>

            <section className="space-y-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
              <h2 className="text-base font-bold text-slate-900">3. No Doctor-Patient Relationship</h2>
              <p>
                The use of V-Cure does <strong>not</strong> establish a doctor-patient, clinical, or formal healthcare provider relationship between you and V-Cure Health or its creators. 
                V-Cure does not render medical advice, clinical diagnoses, or treatment regimens. All content, recommendations, and AI responses are for informational and self-tracking purposes only.
              </p>
            </section>

            <section className="space-y-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
              <h2 className="text-base font-bold text-slate-900">4. AI Features & Medical Document Parsing Limitations</h2>
              <p>
                Features incorporating Artificial Intelligence (such as AI Coach and automated meal planning) and Optical Character Recognition (OCR document parsing for medical reports) 
                are provided as automated conveniences. You acknowledge that:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs font-medium text-slate-600">
                <li>OCR processing may misread, misinterpret, or misrepresent text or numerical values from uploaded laboratory reports.</li>
                <li>AI recommendations are generated algorithmically and may not account for your full personal clinical history.</li>
                <li>You remain solely responsible for verifying extracted laboratory metrics against your original diagnostic reports.</li>
              </ul>
            </section>

            <section className="space-y-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
              <h2 className="text-base font-bold text-slate-900">5. User Conduct & Account Security</h2>
              <p>
                As a user of V-Cure, you agree to:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs font-medium text-slate-600">
                <li>Provide truthful and accurate information during registration and onboarding.</li>
                <li>Maintain the security and confidentiality of your account credentials.</li>
                <li>Use the platform exclusively for lawful personal wellness tracking.</li>
                <li>Not attempt to reverse engineer, disrupt, or exploit the platform software or underlying services.</li>
              </ul>
            </section>

            <section className="space-y-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
              <h2 className="text-base font-bold text-slate-900">6. Intellectual Property</h2>
              <p>
                All brand elements, source code, visual designs, logos, trademarks, and documentation associated with V-Cure are the exclusive property of V-Cure Health. 
                You are granted a limited, revocable, non-exclusive license to access the platform for personal, non-commercial use.
              </p>
            </section>

            <section className="space-y-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
              <h2 className="text-base font-bold text-slate-900">7. Third-Party Services & Links</h2>
              <p>
                V-Cure incorporates third-party infrastructure and identity services (such as Google Authentication via Firebase). 
                We are not responsible for the availability, security practices, or content of third-party platforms.
              </p>
            </section>

            <section className="space-y-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
              <h2 className="text-base font-bold text-slate-900">8. Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by applicable law, V-Cure Health, its developers, and affiliates shall not be liable for any direct, indirect, 
                incidental, consequential, or special damages arising out of your use of, or inability to use, the platform or any information provided therein. 
                Your sole remedy for dissatisfaction with the application is to discontinue using the platform.
              </p>
            </section>

            <section className="space-y-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
              <h2 className="text-base font-bold text-slate-900">9. Modifications & Termination</h2>
              <p>
                We reserve the right to modify these Terms of Service or suspend platform availability at any time for maintenance or application updates. 
                Continued use of the platform following modifications constitutes acceptance of the updated terms.
              </p>
            </section>

            <section className="space-y-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
              <h2 className="text-base font-bold text-slate-900">10. Contact Us</h2>
              <p>
                If you have any questions or concerns regarding these Terms of Service, please reach out to us at:
              </p>
              <div className="p-3 bg-slate-50 rounded-xl font-mono text-xs font-bold text-slate-800 border border-slate-200">
                Email: support@v-cure.app
              </div>
            </section>
          </div>

          {/* Simple Footer */}
          <footer className="pt-8 border-t border-gray-200 text-center text-xs font-medium text-slate-500 space-y-2">
            <div className="flex justify-center items-center gap-4">
              <Link href="/privacy" className="hover:text-slate-700 hover:underline">
                Privacy Policy
              </Link>
              <span>•</span>
              <Link href="/terms" className="text-emerald-700 font-bold hover:underline">
                Terms of Service
              </Link>
              <span>•</span>
              <Link href="/auth/login" className="hover:text-slate-700 hover:underline">
                Sign In
              </Link>
            </div>
            <p>© 2026 V-Cure Health. All rights reserved.</p>
          </footer>
        </Container>
      </main>
    </div>
  );
}
