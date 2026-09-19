"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, LogOut, Globe } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { authService } from "@/services/auth-service";
import { Sidebar } from "@/components/layout/sidebar";
import { NotificationBellPanel } from "@/components/notifications/notification-bell-panel";
import { ROUTES } from "@/constants/routes";
import { useTranslation } from "@/hooks/use-translation";
import type { Language } from "@/constants/translations";

import { getGreetingName } from "@/lib/cn";

export function TopBar() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const router = useRouter();
  const pathname = usePathname();
  const { t, language, setLanguage } = useTranslation();

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      // proceed with local logout even if the request fails
    }
    clearSession();
    router.replace(ROUTES.LOGIN);
  };

  return (
    <header className="hidden lg:flex sticky top-0 z-40 h-16 items-center justify-between border-b border-border bg-surface px-4 lg:px-8">
      <button
        type="button"
        className="inline-flex h-10 w-10 items-center justify-center rounded-md lg:hidden"
        aria-label={isMobileNavOpen ? "Close menu" : "Open menu"}
        aria-expanded={isMobileNavOpen}
        onClick={() => setIsMobileNavOpen((prev) => !prev)}
      >
        {isMobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      <span className="text-sm font-medium text-text-secondary">
        {user ? `${t.welcomeBack}, ${getGreetingName(user.fullName)}` : ""}
      </span>

      <div className="flex items-center gap-3">
        {/* Language selector dropdown */}
        <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-full text-xs font-semibold border border-emerald-200">
          <Globe className="h-3.5 w-3.5" />
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            className="bg-transparent text-xs font-bold text-emerald-900 focus:outline-none cursor-pointer"
          >
            <option value="en">English</option>
            <option value="te">తెలుగు (Telugu)</option>
            <option value="ta">தமிழ் (Tamil)</option>
            <option value="hi">हिन्दी (Hindi)</option>
            <option value="kn">ಕನ್ನಡ (Kannada)</option>
            <option value="ml">മലയാളം (Malayalam)</option>
            <option value="mr">मराठी (Marathi)</option>
            <option value="bn">বাংলা (Bengali)</option>
          </select>
        </div>

        <NotificationBellPanel />
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-2 px-2 text-sm font-medium text-text-secondary hover:text-text-primary"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          {t.logoutButton}
        </button>
      </div>

      {isMobileNavOpen ? (
        <div className="absolute left-0 top-16 w-full border-b border-border bg-surface lg:hidden">
          <Sidebar key={pathname} className="block w-full border-r-0" />
        </div>
      ) : null}
    </header>
  );
}

