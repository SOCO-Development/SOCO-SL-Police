'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import FormInput from '@/components/forms/FormInput';
import { Lock, Shield, User, CheckCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);

  // Clear expired sessions on mount, but don't auto-redirect
  // Let user explicitly log in or navigate to protected routes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isAuthenticated = localStorage.getItem('isAuthenticated');
      const username = localStorage.getItem('username');
      const authTimestamp = localStorage.getItem('authTimestamp');

      // Check if session is expired (24 hours)
      const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      const isSessionExpired = authTimestamp
        ? (Date.now() - parseInt(authTimestamp)) > SESSION_DURATION
        : true;

      // Clear expired or invalid authentication data
      if (isSessionExpired || !isAuthenticated || !username || username.trim() === '') {
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('username');
        localStorage.removeItem('authTimestamp');
      }
      // Note: We don't auto-redirect here - let the user explicitly log in
      // If they're already authenticated, they can navigate to protected routes directly
    }
  }, []);

  // Default credentials for development/testing
  const DEFAULT_USERNAME = 'admin';
  const DEFAULT_PASSWORD = 'admin123';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Simple authentication check (replace with API call in production)
    if (username === DEFAULT_USERNAME && password === DEFAULT_PASSWORD) {
      // Store authentication with timestamp (in production, use secure tokens)
      if (typeof window !== 'undefined') {
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('username', username);
        localStorage.setItem('authTimestamp', Date.now().toString());
      }
      setLoginSuccess(true);
      setIsLoading(false);
      // Brief success state then smooth redirect to home
      setTimeout(() => {
        router.push('/home');
      }, 700);
    } else {
      setError('Invalid username or password. Please try again.');
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
            <span key={`top-tape-${index}`} className="mx-4 whitespace-nowrap text-lg sm:text-xl font-black tracking-widest text-slate-900">
              DO NOT CROSS
            </span>
          ))}
        </div>

        <div className="absolute left-1/2 top-[53%] flex w-[175%] -translate-x-1/2 rotate-[12deg] bg-yellow-400 py-2 shadow-[0_10px_25px_rgba(0,0,0,0.45)] border-y-2 border-yellow-300/80">
          {Array.from({ length: 9 }).map((_, index) => (
            <span key={`bottom-tape-${index}`} className="mx-4 whitespace-nowrap text-lg sm:text-xl font-black tracking-widest text-slate-900">
              DO NOT CROSS
            </span>
          ))}
        </div>
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Left Section - Branding */}
          <div className="hidden lg:flex flex-col items-center justify-center text-center space-y-8 w-full">
            <div className="relative isolate">
              <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(125,211,252,0.4)_0%,rgba(56,189,248,0.16)_45%,transparent_72%)] blur-xl scale-125"></div>
              <div className="relative w-60 h-60 mx-auto rounded-full border border-cyan-200/45 bg-[#031b3f]/65 backdrop-blur-sm shadow-[0_22px_60px_rgba(2,8,23,0.72)] flex items-center justify-center">
                <div className="absolute inset-3 rounded-full border border-cyan-100/30"></div>
                <Image
                  src="/logoo.png"
                  alt="Sri Lanka Police Logo"
                  width={220}
                  height={220}
                  className="object-contain w-[85%] h-[85%] drop-shadow-[0_16px_30px_rgba(0,0,0,0.7)]"
                  loading="eager"
                  priority
                />
              </div>
            </div>

            <div className="space-y-4 w-full">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-300 to-blue-100 bg-clip-text text-transparent font-noto">
                SOCO - SL Police
              </h1>

              <div className="space-y-2 text-blue-50 w-full">
                <p className="text-xl font-semibold font-sinhala whitespace-nowrap">අපරාධ ස්ථාන පරීක්ෂණ නිලධාරී ව්‍යාපෘතිය</p>
                <p className="text-xl font-semibold font-tamil whitespace-nowrap">இலங்கை போலீசார் புகார் மேலாண்மை அமைப்பு</p>
                <p className="text-xl font-semibold text-blue-100 font-noto whitespace-nowrap">Scene of Crime Officer Project</p>
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
            <div className={`bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-blue-100/80 p-8 lg:p-10 transition-all duration-500 ease-out ${loginSuccess ? 'ring-2 ring-green-400/50 ring-offset-2 ring-offset-white/80' : ''}`}>
              {/* Mobile Logo */}
              <div className="lg:hidden mb-8 text-center">
                <div className="w-24 h-24 mx-auto mb-4 relative">
                  <Image
                    src="/logoo.png"
                    alt="Sri Lanka Police Logo"
                    width={96}
                    height={96}
                    className="object-contain w-full h-full drop-shadow-xl"
                    loading="eager"
                    priority
                  />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 font-noto mb-2">
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
                    <span className="text-sm font-medium font-noto">Authentication successful. Redirecting...</span>
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
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      className="font-noto pl-10"
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-r-lg text-sm font-noto animate-fade-in">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      {error}
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-[#0b2f64] to-[#0a4685] hover:from-[#0e3c7f] hover:to-[#0e57a3] text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed font-noto flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing in...
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5" />
                      Sign In
                    </>
                  )}
                </button>
              </form>
              )}

              {/* Development Credentials - hide when success */}
              {!loginSuccess && (
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl">
                <p className="text-xs text-gray-700 font-noto text-center">
                  <strong className="text-blue-700">Development Mode:</strong>
                </p>
                <div className="mt-2 flex items-center justify-center gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3 text-blue-600" />
                    <code className="bg-white px-2 py-1 rounded text-blue-700 font-mono">admin</code>
                  </div>
                  <div className="flex items-center gap-1">
                    <Lock className="w-3 h-3 text-purple-600" />
                    <code className="bg-white px-2 py-1 rounded text-purple-700 font-mono">admin123</code>
                  </div>
                </div>
              </div>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* Footer - Centered at bottom of page */}
      <div className="absolute bottom-8 left-0 right-0 text-center px-4">
        <p className="text-xs text-blue-100/80 font-noto">
          Powered by <span className="font-bold text-cyan-200">Sri Lanka Telecom</span> | © {new Date().getFullYear()} Sri Lanka Police
        </p>
      </div>
    </div>
  );
}
