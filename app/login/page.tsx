"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { publicAssetSrc } from "@/lib/publicAsset";
import FormInput from "@/components/forms/FormInput";
import { Button } from "@/components/ui";
import { Lock, Shield, User, CheckCircle, Eye, EyeOff } from "lucide-react";
import { authService, userService } from "@/lib/api";
import { clearAuthSession, isAuthenticated as hasValidSession, saveUserDisplayInfo } from "@/lib/api/authStorage";
import { getErrorMessage, showErrorAlert } from "@/lib/alerts";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Clear expired sessions on mount, but don't auto-redirect
  // Let user explicitly log in or navigate to protected routes
  useEffect(() => {
    if (typeof window !== "undefined" && !hasValidSession()) {
      clearAuthSession();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await authService.login({ username: username.trim(), password });
      try {
        const info = await userService.getCurrentUserInfo();
        saveUserDisplayInfo(info.callingName, info.designationName);
      } catch {}
      setLoginSuccess(true);
      router.replace("/crime-visit-registry");
    } catch (err) {
      const message = getErrorMessage(err, "Invalid username or password. Please try again.");
      showErrorAlert('Login Failed', message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#031633] via-[#072146] to-[#0a2a56] relative overflow-hidden animate-fade-in">
      {/* Subtle navy overlays and crime-scene tapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(255,255,255,0.14),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(56,189,248,0.1),transparent_45%)]"></div>

        <div className="absolute left-1/2 top-[30%] flex w-[175%] -translate-x-1/2 -rotate-[13deg] bg-yellow-400 py-2 shadow-[0_10px_25px_rgba(0,0,0,0.45)] border-y-2 border-yellow-300/80">
          {Array.from({ length: 9 }).map((_, index) => (
            <span
              key={`top-tape-${index}`}
              className="mx-4 whitespace-nowrap text-lg sm:text-xl font-black tracking-widest text-slate-900"
            >
              DO NOT CROSS
            </span>
          ))}
        </div>

        <div className="absolute left-1/2 top-[53%] flex w-[175%] -translate-x-1/2 rotate-[12deg] bg-yellow-400 py-2 shadow-[0_10px_25px_rgba(0,0,0,0.45)] border-y-2 border-yellow-300/80">
          {Array.from({ length: 9 }).map((_, index) => (
            <span
              key={`bottom-tape-${index}`}
              className="mx-4 whitespace-nowrap text-lg sm:text-xl font-black tracking-widest text-slate-900"
            >
              DO NOT CROSS
            </span>
          ))}
        </div>
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Left Section - Branding */}
          <div className="hidden lg:flex flex-col items-center justify-center text-center space-y-8 w-full">
            <div className="relative isolate mx-auto flex w-full justify-center px-2">
              <div
                className="pointer-events-none absolute -inset-8 rounded-[2rem] bg-[radial-gradient(ellipse_80%_70%_at_50%_45%,rgba(56,189,248,0.22),transparent_70%)] blur-3xl"
                aria-hidden
              />

              <div className="relative size-52 shrink-0 overflow-hidden rounded-xl border border-white/50 bg-white/30 p-px shadow-[0_20px_50px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.45)] backdrop-blur-xl backdrop-saturate-150 sm:size-56">
                <div className="relative flex h-full w-full items-center justify-center rounded-[calc(0.75rem-1px)] bg-white/25 p-4 backdrop-blur-md sm:p-5">
                  <div
                    className="pointer-events-none absolute inset-0 opacity-[0.45] bg-[linear-gradient(105deg,transparent_42%,rgba(255,255,255,0.55)_50%,transparent_58%)]"
                    aria-hidden
                  />
                  <span
                    className="pointer-events-none absolute left-3 top-3 h-6 w-6 rounded-tl-md border-l-2 border-t-2 border-slate-400/55"
                    aria-hidden
                  />
                  <span
                    className="pointer-events-none absolute right-3 top-3 h-6 w-6 rounded-tr-md border-r-2 border-t-2 border-slate-400/55"
                    aria-hidden
                  />
                  <span
                    className="pointer-events-none absolute bottom-3 left-3 h-6 w-6 rounded-bl-md border-b-2 border-l-2 border-slate-400/45"
                    aria-hidden
                  />
                  <span
                    className="pointer-events-none absolute bottom-3 right-3 h-6 w-6 rounded-br-md border-b-2 border-r-2 border-slate-400/45"
                    aria-hidden
                  />

                  <div
                    className="pointer-events-none absolute inset-[10%] rounded-lg bg-[radial-gradient(ellipse_at_center,rgba(15,23,42,0.04)_0%,transparent_65%)]"
                    aria-hidden
                  />
                  <img
                    src={publicAssetSrc("/logo.png")}
                    alt="Sri Lanka Police Logo"
                    width={280}
                    height={280}
                    className="relative z-[1] max-h-full max-w-full object-contain object-center drop-shadow-[0_2px_12px_rgba(15,23,42,0.18)]"
                    loading="eager"
                    fetchPriority="high"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 w-full pt-12">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-300 to-blue-100 bg-clip-text text-transparent font-noto">
                SOCO - SL Police
              </h1>

              <div className="space-y-2 text-blue-50 w-full">
                <p className="text-xl font-semibold font-sinhala whitespace-nowrap">
                  අපරාධ ස්ථාන පරීක්ෂණ නිලධාරී ව්‍යාපෘතිය
                </p>
                <p className="text-xl font-semibold font-tamil whitespace-nowrap">
                  இலங்கை போலீசார் புகார் மேலாண்மை அமைப்பு
                </p>
                <p className="text-xl font-semibold text-blue-100 font-noto whitespace-nowrap">
                  Scene of Crime Officer Project
                </p>
              </div>
            </div>

            {/* Security Features */}
            <div className="flex items-center gap-6 pt-8 border-t border-blue-300/30">
              <div className="flex items-center gap-2 text-blue-100">
                <Shield className="w-5 h-5 text-cyan-300" />
                <span className="text-sm font-medium font-noto">Secure</span>
              </div>
              <div className="flex items-center gap-2 text-blue-100">
                <Lock className="w-5 h-5 text-cyan-300" />
                <span className="text-sm font-medium font-noto">Encrypted</span>
              </div>
            </div>
          </div>

          {/* Right Section - Login Form */}
          <div className="w-full max-w-md mx-auto lg:mx-0 lg:ml-auto">
            <div
              className={`bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-blue-100/80 p-8 lg:p-10 transition-all duration-500 ease-out ${loginSuccess ? "ring-2 ring-green-400/50 ring-offset-2 ring-offset-white/80" : ""}`}
            >
              {/* Mobile Logo */}
              <div className="lg:hidden mb-8 text-center">
                <div className="relative mx-auto mb-4 size-[7.25rem] shrink-0 overflow-hidden rounded-xl border border-white/55 bg-white/35 p-px shadow-[0_12px_40px_rgba(15,23,42,0.12)] backdrop-blur-xl backdrop-saturate-150">
                  <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-[calc(0.75rem-1px)] bg-white/25 p-3 backdrop-blur-md">
                    <span
                      className="pointer-events-none absolute left-2 top-2 h-4 w-4 rounded-tl border-l border-t border-slate-400/50"
                      aria-hidden
                    />
                    <span
                      className="pointer-events-none absolute right-2 top-2 h-4 w-4 rounded-tr border-r border-t border-slate-400/50"
                      aria-hidden
                    />
                    <div
                      className="pointer-events-none absolute inset-[12%] rounded-md bg-[radial-gradient(ellipse_at_center,rgba(15,23,42,0.035)_0%,transparent_70%)]"
                      aria-hidden
                    />
                    <img
                      src={publicAssetSrc("/logo.png")}
                      alt="Sri Lanka Police Logo"
                      width={180}
                      height={180}
                      className="relative z-[1] max-h-full max-w-full object-contain object-center drop-shadow-[0_2px_8px_rgba(15,23,42,0.15)]"
                      loading="eager"
                      fetchPriority="high"
                    />
                  </div>
                </div>
                <h1 className="mt-8 text-2xl font-bold text-gray-900 font-noto mb-2">
                  SOCO - SL Police
                </h1>
              </div>

              <div className="mb-8 text-center">
                <h2 className="text-3xl font-bold text-slate-900 mb-2 font-noto">
                  Officer Login
                </h2>
                <p className="text-slate-600 font-noto text-sm">
                  Sign in to access the SOCO internal dashboard
                </p>

                {loginSuccess && (
                  <div className="mt-4 animate-fade-in inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full border border-green-200">
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-sm font-medium font-noto">
                      Authentication successful. Redirecting...
                    </span>
                  </div>
                )}
              </div>

              {/* Login Form - hide when success */}
              {!loginSuccess && (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 font-noto flex items-center gap-2">
                      <User className="w-4 h-4 text-blue-600" />
                      Username
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <FormInput
                        label=""
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter your username"
                        required
                        className="font-noto pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 font-noto flex items-center gap-2">
                      <Lock className="w-4 h-4 text-blue-600" />
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <FormInput
                        label=""
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        required
                        className="font-noto pl-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full !min-h-[48px] bg-gradient-to-r from-[#0b2f64] to-[#0a4685] hover:from-[#0e3c7f] hover:to-[#0e57a3] text-white font-semibold py-3.5 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed font-noto"
                  >
                    {isLoading ? (
                      <>
                        <svg
                          className="animate-spin h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Signing in...
                      </>
                    ) : (
                      <>
                        <Lock className="w-5 h-5" />
                        Sign In
                      </>
                    )}
                  </Button>
                </form>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* Footer - Centered at bottom of page */}
      <div className="absolute bottom-8 left-0 right-0 text-center px-4">
        <p className="text-xs text-blue-100/80 font-noto">
          Powered by{" "}
          <span className="font-bold text-cyan-200">Sri Lanka Telecom</span> | ©{" "}
          {new Date().getFullYear()} Sri Lanka Police
        </p>
      </div>
    </div>
  );
}
