import React, { useState, useEffect } from 'react';
import { User, Eye, EyeOff, RotateCw, KeyRound, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react';
import { UserProfile, UserRole } from '../types';
import { getAllUsers } from '../lib/firebase';

interface LoginFormProps {
  onLoginSuccess: (user: UserProfile) => void;
  onNavigateToRegister: () => void;
  onLoginAsGuest: () => void;
  logoUrl: string;
}

export default function LoginForm({
  onLoginSuccess,
  onNavigateToRegister,
  onLoginAsGuest,
  logoUrl,
}: LoginFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [typedCaptcha, setTypedCaptcha] = useState('');
  const [captchaCode, setCaptchaCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [demoUsers, setDemoUsers] = useState<UserProfile[]>([]);
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);

  // Load demo users for quick-inject
  useEffect(() => {
    async function loadUsers() {
      try {
        const users = await getAllUsers();
        setDemoUsers(users);
      } catch (e) {
        console.error(e);
      }
    }
    loadUsers();
    regenerateCaptcha();
  }, []);

  // Generate a random 4-digit Captcha code
  const regenerateCaptcha = () => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setCaptchaCode(code);
    setTypedCaptcha('');
  };

  const handleDemoLogin = (user: UserProfile) => {
    setUsername(user.username);
    setPassword('demo123'); // auto-fill demo password
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim()) {
      setError('Please enter your username');
      return;
    }

    if (!password) {
      setError('Please enter your password');
      return;
    }

    if (typedCaptcha !== captchaCode) {
      setError('Invalid Captcha code. Please try again.');
      regenerateCaptcha();
      return;
    }

    setIsLoading(true);

    // Simulate login verification against database profiles
    setTimeout(async () => {
      try {
        const allUsers = await getAllUsers();
        const found = allUsers.find(
          (u) => u.username.toLowerCase() === username.trim().toLowerCase()
        );

        if (found) {
          // Update last login in background (mock or real)
          onLoginSuccess({
            ...found,
            lastLogin: new Date().toISOString(),
          });
        } else {
          // If not found in seed, create a custom profile with Registered Customer role
          const newProfile: UserProfile = {
            id: 'custom_' + Date.now(),
            username: username.trim(),
            email: `${username.trim()}@phetmany.co`,
            fullName: username.trim().split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
            role: 'Registered Customer',
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            status: 'Active',
          };
          onLoginSuccess(newProfile);
        }
      } catch (err) {
        setError('Database connection error. Logged in with offline profile.');
      } finally {
        setIsLoading(false);
      }
    }, 1000);
  };

  return (
    <div id="login-form-container" className="flex flex-col justify-between p-8 md:p-12 h-full bg-white rounded-3xl md:rounded-l-3xl border border-slate-100 shadow-xl">
      
      {/* Top Section */}
      <div className="space-y-6">
        
        {/* Brand Logo and Header */}
        <div id="login-logo-header" className="flex flex-col items-center justify-center text-center space-y-3">
          <div className="flex items-center gap-2">
            <img
              src={logoUrl}
              alt="PHETMANY Logo"
              className="w-14 h-14 object-contain rounded-full shadow-xs p-0.5 border border-slate-100"
              referrerPolicy="no-referrer"
            />
            <span className="font-display font-black text-3xl text-slate-900 tracking-tight">PHETMANY</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold font-display text-slate-800 tracking-wide mt-2">
            Welcome to PHETMANY
          </h1>
        </div>

        {/* Error Alert Panel */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200/60 text-red-600 rounded-xl text-xs font-semibold flex items-center gap-2 animate-pulse-subtle">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Form Controls */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Username Input */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Username</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                <User className="w-4 h-4 text-slate-400" />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-sm text-slate-800 font-medium transition-all"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                <KeyRound className="w-4 h-4 text-slate-400" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-sm text-slate-800 font-medium transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-slate-800"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Captcha Input */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Captcha Verification</label>
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-7">
                <input
                  type="text"
                  value={typedCaptcha}
                  onChange={(e) => setTypedCaptcha(e.target.value)}
                  placeholder="Captcha Code"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-sm text-slate-800 font-bold tracking-widest text-center transition-all"
                  maxLength={4}
                />
              </div>

              {/* Graphical Captcha Component */}
              <div className="col-span-5 flex items-center justify-between gap-1.5 px-3 bg-slate-100 rounded-xl border border-slate-200/80 shadow-inner select-none h-[46px]">
                <span className="text-lg font-display font-bold italic tracking-wider text-slate-800 bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent line-through decoration-slate-400 decoration-2 px-1">
                  {captchaCode}
                </span>
                <button
                  type="button"
                  onClick={regenerateCaptcha}
                  className="p-1 hover:bg-slate-200 rounded-lg text-slate-500 transition-all cursor-pointer"
                  title="Refresh Captcha"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Remember Me and Forgot Password */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-slate-600">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={() => setRememberMe(!rememberMe)}
                className="w-4 h-4 rounded border-slate-300 text-slate-800 focus:ring-slate-500"
              />
              Remember Me
            </label>
            <button
              type="button"
              onClick={() => alert("Please contact Super Administrator to reset password or log in with demo accounts below.")}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 hover:underline transition-colors"
            >
              Forgot Password?
            </button>
          </div>

          {/* Solid Slate Login Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold font-display rounded-xl text-xs tracking-widest uppercase transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-75 cursor-pointer mt-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Logging In...</span>
              </>
            ) : (
              <>
                <span>Login</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Navigation Switchers */}
        <div id="login-switchers" className="flex flex-col gap-2 pt-2 text-center text-xs">
          <div className="text-slate-500 font-medium">
            Don't have login details?{' '}
            <button
              type="button"
              onClick={onNavigateToRegister}
              className="font-bold text-slate-800 hover:text-slate-900 hover:underline inline-flex items-center gap-0.5 transition-colors"
            >
              Register <span className="text-xs">▸</span>
            </button>
          </div>

          <div>
            <button
              type="button"
              onClick={onLoginAsGuest}
              className="font-bold text-slate-600 hover:text-slate-900 hover:underline inline-flex items-center gap-0.5 transition-colors"
            >
              Login As Guest <span className="text-xs">▸</span>
            </button>
          </div>
        </div>
      </div>

      {/* Demo Accounts Panel */}
      <div id="demo-injector-panel" className="mt-6 border-t border-dashed border-slate-100 pt-4">
        <button
          type="button"
          onClick={() => setShowDemoAccounts(!showDemoAccounts)}
          className="w-full py-2 bg-slate-50 hover:bg-slate-100/80 rounded-xl text-[11px] font-bold text-slate-600 flex items-center justify-center gap-1.5 transition-colors border border-slate-200/40"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
          {showDemoAccounts ? 'Hide Quick Login Accounts' : 'Show Demo / Role Accounts'}
        </button>

        {showDemoAccounts && (
          <div className="mt-2.5 max-h-36 overflow-y-auto border border-slate-100 rounded-xl p-2 bg-slate-50 space-y-1.5">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Select an account to auto-fill details:
            </p>
            {demoUsers.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => handleDemoLogin(user)}
                className="w-full text-left p-1.5 hover:bg-white rounded border border-transparent hover:border-slate-100 text-[10px] flex items-center justify-between transition-all"
              >
                <div>
                  <span className="font-semibold text-slate-700">{user.fullName}</span>
                  <span className="text-slate-400 block text-[9px]">@{user.username}</span>
                </div>
                <span className="px-1.5 py-0.5 rounded-sm bg-slate-100 text-slate-700 font-bold text-[8px] uppercase border border-slate-200/40">
                  {user.role}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* App Store Download badges */}
      <div id="download-badges" className="mt-6 text-center space-y-2 pt-4 border-t border-slate-100">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Phetmany Diamond Buying App:
        </span>
        <div className="flex items-center justify-center gap-2">
          {/* iOS Badges */}
          <a
            href="#app-store"
            onClick={(e) => { e.preventDefault(); alert('Redirecting to iOS Store...'); }}
            className="flex items-center gap-1 bg-black text-white px-2.5 py-1 rounded-md text-[9px] font-bold hover:bg-slate-900 transition-colors shadow-xs"
          >
            <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.21.67-2.93 1.49-.62.69-1.16 1.84-1.01 2.96 1.12.09 2.27-.57 2.95-1.39z" />
            </svg>
            <div className="text-left leading-none">
              <span className="text-[7px] font-medium block">Download on the</span>
              App Store
            </div>
          </a>

          {/* Android Badge */}
          <a
            href="#google-play"
            onClick={(e) => { e.preventDefault(); alert('Redirecting to Google Play...'); }}
            className="flex items-center gap-1 bg-black text-white px-2.5 py-1 rounded-md text-[9px] font-bold hover:bg-slate-900 transition-colors shadow-xs"
          >
            <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
              <path d="M3 22.5c-.3 0-.6-.1-.8-.4-.3-.3-.4-.7-.2-1.1l9.3-16.1 5.4 9.4L3 22.5zm11.2-16.7L18.7 13l3.6-2.1c.4-.2.6-.6.6-1s-.2-.8-.6-1L3.9 2.2c-.3-.2-.7-.2-1 0L3 2.7l11.2 13.1zM2.4 1.7C2 1.7 1.7 2 1.7 2.4v19.2c0 .4.3.7.7.7.1 0 .2 0 .3-.1L14 11.8 2.4 1.7z" />
            </svg>
            <div className="text-left leading-none">
              <span className="text-[7px] font-medium block">GET IT ON</span>
              Google Play
            </div>
          </a>

          {/* Huawei Badge */}
          <a
            href="#huawei-gallery"
            onClick={(e) => { e.preventDefault(); alert('Redirecting to AppGallery...'); }}
            className="flex items-center gap-1 bg-red-600 text-white px-2.5 py-1 rounded-md text-[9px] font-bold hover:bg-red-700 transition-colors shadow-xs"
          >
            <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z" />
            </svg>
            <div className="text-left leading-none">
              <span className="text-[7px] font-medium block">EXPLORE IT ON</span>
              AppGallery
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
