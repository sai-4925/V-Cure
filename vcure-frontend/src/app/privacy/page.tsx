import Link from "next/link";
import { ShieldCheck, ArrowLeft, FileText } from "lucide-react";
import { Container } from "@/components/ui/container";
import { VCureWordmarkLogo } from "@/components/ui/vcure-logo";

export const metadata = {
  title: "Privacy Policy | V-Cure Health",
  description: "Privacy Policy and data handling practices for V-Cure Health wellness platform."
};

export default function PrivacyPolicyPage() {
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

          <Link href="/terms" className="text-xs font-bold text-slate-600 hover:text-emerald-700 transition-colors">
            Terms of Service
          </Link>
        </Container>
      </header>

      {/* Main Content Container */}
      <main className="py-8 md:py-12">
        <Container className="max-w-4xl px-4 space-y-8">
          {/* Header Title Section */}
          <div className="border-b border-gray-200 pb-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200 mb-3">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Official Documentation
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              Privacy Policy
            </h1>
            <p className="mt-2 text-xs font-medium text-slate-500">
              Effective Date: September 16, 2026 • Platform Version: 1.0 (Prototype)
            </p>
          </div>

          {/* Healthcare Disclaimer Callout Box */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-5 space-y-2 text-amber-900">
            <h2 className="text-sm font-bold flex items-center gap-2 text-amber-900">
              <FileText className="h-4 w-4 text-amber-700 shrink-0" />
              Healthcare & AI Information Notice
            </h2>
            <p className="text-xs font-medium leading-relaxed">
              V-Cure Health (&quot;V-Cure&quot;) is a digital personal wellness and health management application prototype. 
              V-Cure is <strong>not</strong> a licensed medical provider, hospital, diagnostic laboratory, or clinical authority. 
              All information, meal suggestions, metrics, and AI-generated insights provided through V-Cure are strictly 
              for general educational and self-tracking purposes and must <strong>never</strong> replace professional medical diagnosis, advice, or treatment. 
              Always consult a qualified doctor or healthcare professional for medical concerns.
            </p>
          </div>

          {/* Privacy Content Sections */}
          <div className="prose prose-slate max-w-none space-y-6 text-sm leading-relaxed text-slate-700">
            <section className="space-y-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
              <h2 className="text-base font-bold text-slate-900">1. Information We Collect</h2>
              <p>
                To provide personalized health progress tracking and tailored nutrition insights, V-Cure may collect the following categories of information:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs font-medium text-slate-600">
                <li>
                  <strong>Account & Contact Information:</strong> Email address, name, profile picture, and authentication tokens when you sign up or log in via email or third-party identity providers (such as Google Authentication).
                </li>
                <li>
                  <strong>User-Entered Health Metrics:</strong> Information voluntarily provided during onboarding or profile editing, including diabetes status category, dietary preferences, food allergies, weight, height, daily water intake, and medication logs.
                </li>
                <li>
                  <strong>Uploaded Medical Reports:</strong> Digital document files or photos of laboratory reports (such as Blood Sugar, CBC, Lipid Profile) uploaded to your private Health Vault for automated storage and text processing.
                </li>
              </ul>
            </section>

            <section className="space-y-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
              <h2 className="text-base font-bold text-slate-900">2. How We Use Your Information</h2>
              <p>
                We use the information collected exclusively to operate and enhance your personal V-Cure application experience:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs font-medium text-slate-600">
                <li>Generating personalized daily meal plan recommendations based on your selected health goals and food preferences.</li>
                <li>Calculating non-diagnostic wellness health scores to track your personal lifestyle habits over time.</li>
                <li>Extracting relevant numerical laboratory metrics from uploaded medical reports to organize your digital health vault.</li>
                <li>Authenticating user sessions and maintaining application security.</li>
              </ul>
            </section>

            <section className="space-y-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
              <h2 className="text-base font-bold text-slate-900">3. Artificial Intelligence & Automated Processing</h2>
              <p>
                V-Cure incorporates artificial intelligence models to assist with meal suggestions, recipe information, and wellness Q&amp;A. 
                AI processing occurs solely on data provided by you. Automated insights are non-binding recommendations and may contain errors. 
                You are encouraged to verify any nutritional or lifestyle recommendations with a certified healthcare provider before making dietary modifications.
              </p>
            </section>

            <section className="space-y-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
              <h2 className="text-base font-bold text-slate-900">4. Data Storage, Security, & Infrastructure</h2>
              <p>
                We implement industry-standard technical measures (including HTTPS encryption in transit and secure session token handling) 
                to safeguard your data. As V-Cure is a health technology software prototype, we do not make legal representations of formal HIPAA, GDPR, or regulatory certification. 
                Users transmit information with this understanding and maintain responsibility for safeguard of their own accounts.
              </p>
            </section>

            <section className="space-y-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
              <h2 className="text-base font-bold text-slate-900">5. Third-Party Services</h2>
              <p>
                V-Cure relies on trusted third-party technology providers to support platform functionality:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs font-medium text-slate-600">
                <li><strong>Firebase Authentication (Google LLC):</strong> Facilitates secure user identity verification and Google Sign-In.</li>
                <li><strong>Cloud Infrastructure:</strong> Enterprise cloud infrastructure for secure database management and encrypted report storage.</li>
              </ul>
              <p className="text-xs text-slate-500">
                Third-party providers process data strictly in accordance with their respective privacy policies and infrastructure security standards.
              </p>
            </section>

            <section className="space-y-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
              <h2 className="text-base font-bold text-slate-900">6. Data Retention & Account Deletion</h2>
              <p>
                Your personal health data and uploaded documents remain stored while your account is active. 
                You may request account deletion or the removal of stored medical records at any time by contacting our support address. 
                Upon verified request, personal records associated with your account will be permanently removed from active application storage.
              </p>
            </section>

            <section className="space-y-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
              <h2 className="text-base font-bold text-slate-900">7. Contact Information</h2>
              <p>
                If you have questions, feedback, or data privacy requests regarding this Privacy Policy, please contact our team at:
              </p>
              <div className="p-3 bg-slate-50 rounded-xl font-mono text-xs font-bold text-slate-800 border border-slate-200">
                Email: support@v-cure.app
              </div>
            </section>
          </div>

          {/* Simple Footer */}
          <footer className="pt-8 border-t border-gray-200 text-center text-xs font-medium text-slate-500 space-y-2">
            <div className="flex justify-center items-center gap-4">
              <Link href="/privacy" className="text-emerald-700 font-bold hover:underline">
                Privacy Policy
              </Link>
              <span>•</span>
              <Link href="/terms" className="hover:text-slate-700 hover:underline">
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
