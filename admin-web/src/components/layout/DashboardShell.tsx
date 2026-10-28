"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

type UserRole = "ADMIN" | "DSE" | "RETAILER" | "CUSTOMER";

interface SessionUser {
  id: string;
  role: UserRole;
  name: string;
  phone: string;
  shopName?: string | null;
}

interface NavItem {
  label: string;
  href: string;
  badge: string;
  allowedRoles: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "1. Overview Analytics",
    href: "/overview",
    badge: "/overview",
    allowedRoles: ["ADMIN"],
  },
  {
    label: "2. Product Palette",
    href: "/products",
    badge: "/products",
    allowedRoles: ["ADMIN", "DSE", "RETAILER"],
  },
  {
    label: "3. DSE Management",
    href: "/dse-management",
    badge: "/dse",
    allowedRoles: ["ADMIN"],
  },
  {
    label: "4. Retailers & Khata",
    href: "/retailers",
    badge: "/retailers",
    allowedRoles: ["ADMIN", "DSE"],
  },
  {
    label: "5. Indents & Billing",
    href: "/indents-billing",
    badge: "/billing",
    allowedRoles: ["ADMIN", "DSE", "RETAILER"],
  },
  {
    label: "6. Customer Wallets",
    href: "/customers",
    badge: "/customers",
    allowedRoles: ["ADMIN", "DSE", "CUSTOMER"],
  },
];

const ROLE_DEFAULT_ROUTE: Record<UserRole, string> = {
  ADMIN: "/overview",
  DSE: "/indents-billing",
  RETAILER: "/indents-billing",
  CUSTOMER: "/customers",
};

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [accessDeniedMessage, setAccessDeniedMessage] = useState<string | null>(
    null,
  );
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Change Password Modal State
  const [pwdModalOpen, setPwdModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [pwdSuccess, setPwdSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedTheme = window.localStorage.getItem("amul_theme") as
      | "light"
      | "dark"
      | null;
    const initialTheme = savedTheme === "dark" ? "dark" : "light";
    setTheme(initialTheme);
    document.documentElement.classList.toggle("dark", initialTheme === "dark");
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("amul_theme", nextTheme);
      document.documentElement.classList.toggle("dark", nextTheme === "dark");
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function verifySessionAndRole() {
      if (typeof window === "undefined") return;
      const token = window.localStorage.getItem("amul_access_token");
      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        const res = await apiRequest<{ success: boolean; user: SessionUser }>(
          "/auth/me",
        );
        if (!isMounted) return;
        const verifiedUser = res.user;
        window.localStorage.setItem("amul_user", JSON.stringify(verifiedUser));
        setUser(verifiedUser);

        const matchedRoute = NAV_ITEMS.find((item) =>
          pathname.startsWith(item.href),
        );
        if (
          matchedRoute &&
          !matchedRoute.allowedRoles.includes(verifiedUser.role)
        ) {
          setAccessDeniedMessage(
            `Role '${verifiedUser.role}' is not authorized to access ${matchedRoute.href}.`,
          );
        } else {
          setAccessDeniedMessage(null);
        }
        setCheckingAuth(false);
      } catch {
        if (!isMounted) return;
        window.localStorage.removeItem("amul_access_token");
        window.localStorage.removeItem("amul_user");
        router.replace("/login");
      }
    }

    verifySessionAndRole();
    return () => {
      isMounted = false;
    };
  }, [pathname, router]);

  const handleLogout = async () => {
    try {
      await apiRequest("/auth/logout", { method: "POST" });
    } catch {
      // Ignore logout network error
    } finally {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("amul_access_token");
        window.localStorage.removeItem("amul_refresh_token");
        window.localStorage.removeItem("amul_user");
      }
      router.replace("/login");
    }
  };

  const openChangePasswordModal = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPwdError(null);
    setPwdSuccess(null);
    setPwdModalOpen(true);
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      setPwdError("Current password is required.");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setPwdError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdError("New password and confirm password do not match.");
      return;
    }

    setPwdSaving(true);
    setPwdError(null);
    setPwdSuccess(null);

    try {
      const res = await apiRequest<{ message: string }>(
        "/auth/change-password",
        {
          method: "POST",
          body: JSON.stringify({ currentPassword, newPassword }),
        },
      );
      setPwdSuccess(res.message || "Password updated!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        setPwdModalOpen(false);
      }, 1200);
    } catch (err: unknown) {
      setPwdError(
        err instanceof Error ? err.message : "Failed to update password.",
      );
    } finally {
      setPwdSaving(false);
    }
  };

  if (checkingAuth || !user) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 text-xs font-semibold">
        Verifying authentication &amp; role permissions...
      </div>
    );
  }

  const visibleNavItems = NAV_ITEMS.filter((item) =>
    item.allowedRoles.includes(user.role),
  );

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-150">
      {/* Fixed Top Brand Bar */}
      <header className="h-16 shrink-0 z-30 bg-indigo-950 text-white border-b border-indigo-900 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-full flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-indigo-600 flex items-center justify-center font-extrabold text-lg shadow-inner shrink-0">
              AP
            </div>
            <div className="truncate">
              <div className="flex items-center gap-2">
                <span className="font-bold text-base sm:text-lg tracking-tight truncate">
                  Amul Party Distribution Platform
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  {user.role}
                </span>
              </div>
              <p className="text-xs text-indigo-200/80 truncate">
                B2B Supply Chain, Split-Payment Billing, Khata Ledger &amp; B2C
                Prepaid Milk Subscription
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={openChangePasswordModal}
              className="px-3 py-1.5 rounded-xl bg-indigo-900/90 hover:bg-indigo-800 border border-indigo-700 text-indigo-100 text-xs font-semibold transition-colors"
              title="Change Account Password"
            >
              🔑 Change Password
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              className="px-3 py-1.5 rounded-xl bg-indigo-900/90 hover:bg-indigo-800 border border-indigo-700 text-indigo-100 text-xs font-semibold transition-colors flex items-center gap-1.5"
              title="Toggle Dark / Light Theme"
            >
              <span>{theme === "dark" ? "☀️ Light" : "🌙 Dark"}</span>
            </button>

            <span className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-900/80 border border-indigo-700 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              {user.name} ({user.phone}) • {user.role}
            </span>

            <button
              type="button"
              onClick={handleLogout}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors shadow-xs"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Split Layout: Independent Scrollable Sidebar & Main Area */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row max-w-[1600px] w-full mx-auto overflow-hidden">
        <aside className="w-full lg:w-64 shrink-0 lg:h-full overflow-y-auto custom-scroll bg-white dark:bg-slate-900 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 p-4 flex flex-col justify-between gap-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 mb-2">
              Authorized Navigation ({user.role})
            </div>
            <nav className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-x-visible pb-1 lg:pb-0 custom-scroll">
              {visibleNavItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                      isActive
                        ? "bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/80 dark:text-indigo-300 dark:border-indigo-800 shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span>{item.label}</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        isActive
                          ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      }`}
                    >
                      {item.badge}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="hidden lg:block p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/70 text-xs space-y-2 shrink-0">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                RBAC Session Guard
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                ENFORCED
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Signed in as <strong>{user.name}</strong> (
              <code className="font-mono text-indigo-600 dark:text-indigo-400">
                {user.role}
              </code>
              ).
            </p>
          </div>
        </aside>

        <main className="flex-1 h-full min-h-0 overflow-y-auto custom-scroll p-4 sm:p-6 lg:p-8">
          {accessDeniedMessage ? (
            <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 space-y-3 max-w-xl">
              <div className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                403 Forbidden — Role Permission Denied
              </div>
              <h2 className="text-lg font-bold">{accessDeniedMessage}</h2>
              <p className="text-xs text-rose-700 dark:text-rose-300">
                Your account role (<strong>{user.role}</strong>) does not have
                permission to view this module.
              </p>
              <button
                type="button"
                onClick={() => router.push(ROLE_DEFAULT_ROUTE[user.role])}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
              >
                Go to {ROLE_DEFAULT_ROUTE[user.role]}
              </button>
            </div>
          ) : (
            children
          )}
        </main>
      </div>

      {/* Change Password Modal */}
      {pwdModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                  Account Security
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  🔑 Change Account Password
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPwdModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            {pwdError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {pwdError}
              </div>
            )}

            {pwdSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                {pwdSuccess}
              </div>
            )}

            <form
              onSubmit={handleChangePasswordSubmit}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-semibold mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => {
                    setPwdError(null);
                    setCurrentPassword(e.target.value);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                  placeholder="Enter current password"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">
                  New Password (min 6 chars)
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => {
                    setPwdError(null);
                    setNewPassword(e.target.value);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                  placeholder="Enter new password"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => {
                    setPwdError(null);
                    setConfirmPassword(e.target.value);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                  placeholder="Re-enter new password"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPwdModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pwdSaving}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold disabled:opacity-60"
                >
                  {pwdSaving ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
