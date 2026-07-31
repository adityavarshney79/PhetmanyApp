import React, { useState } from 'react';
import { User, Mail, ShieldCheck, KeyRound, ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import { UserProfile, UserRole, ROLE_DETAILS } from '../types';
import { createUserProfile, getAllUsers } from '../lib/firebase';

interface RegisterFormProps {
  onRegisterSuccess: (user: UserProfile) => void;
  onBackToLogin: () => void;
  logoUrl: string;
}

export default function RegisterForm({
  onRegisterSuccess,
  onBackToLogin,
  logoUrl,
}: RegisterFormProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('Registered Customer');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validations
    if (!fullName.trim()) {
      setError('Please enter your full name');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (!username.trim()) {
      setError('Please choose a username');
      return;
    }

    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      // Check for existing usernames in Firestore / LocalStorage
      const allUsers = await getAllUsers();
      const duplicate = allUsers.some(
        (u) => u.username.toLowerCase() === username.trim().toLowerCase()
      );

      if (duplicate) {
        setError('Username already taken. Please choose another one.');
        setIsLoading(false);
        return;
      }

      // Create new user profile object
      const newProfile: UserProfile = {
        id: 'user_' + Date.now(),
        username: username.trim().toLowerCase(),
        email: email.trim(),
        fullName: fullName.trim(),
        role: selectedRole,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        status: 'Active',
      };

      // Store in Firestore
      await createUserProfile(newProfile);

      // Auto login
      onRegisterSuccess(newProfile);
    } catch (err) {
      console.error(err);
      setError('Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedRoleDetails = ROLE_DETAILS[selectedRole];

  return (
    <div id="register-form-container" className="flex flex-col justify-between p-8 md:p-12 h-full bg-white rounded-3xl md:rounded-l-3xl border border-slate-100 shadow-xl">
      <div className="space-y-6">
        
        {/* Header with Logo */}
        <div className="flex flex-col items-center justify-center text-center space-y-2">
          <div className="flex items-center gap-2">
            <img
              src={logoUrl}
              alt="PHETMANY Logo"
              className="w-12 h-12 object-contain rounded-full shadow-xs p-0.5 border border-slate-100"
              referrerPolicy="no-referrer"
            />
            <span className="font-display font-black text-2xl text-slate-900 tracking-tight">PHETMANY</span>
          </div>
          <h1 className="text-xl font-semibold font-display text-slate-800 tracking-wide">
            Register Account
          </h1>
          <p className="text-xs text-slate-400">
            Create an account to join the PHETMANY Buying Network.
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200/60 text-red-600 rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Register Fields */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Full Name */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Full Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <User className="w-4 h-4 text-slate-400" />
                </span>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-xs text-slate-800 font-medium transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Mail className="w-4 h-4 text-slate-400" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@phetmany.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-xs text-slate-800 font-medium transition-all"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Username */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Choose Username</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Sparkles className="w-4 h-4 text-slate-400" />
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="johndoe"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-xs text-slate-800 font-medium transition-all"
                />
              </div>
            </div>

            {/* Role dropdown */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select Role Type</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <ShieldCheck className="w-4 h-4 text-slate-400" />
                </span>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-xs text-slate-800 font-bold transition-all appearance-none cursor-pointer"
                >
                  <optgroup label="Internal Staff Roles">
                    <option value="AdminMaster">AdminMaster</option>
                    <option value="Super Administrator">Super Administrator</option>
                    <option value="Store Manager">Store Manager</option>
                    <option value="Content Editor">Content Editor</option>
                    <option value="Customer Support">Customer Support</option>
                    <option value="Technical/Dev">Technical/Dev</option>
                  </optgroup>
                  <optgroup label="Customer/External Roles">
                    <option value="Registered Customer">Registered Customer</option>
                    <option value="VIP/Loyalty Member">VIP/Loyalty Member</option>
                    <option value="Wholesale/B2B Partner">Wholesale/B2B Partner</option>
                  </optgroup>
                </select>
              </div>
            </div>
          </div>

          {/* Access Level Badge & Preview */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1 text-left">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Role Access Preview:</span>
              <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200/40">
                Level: {selectedRoleDetails.accessLevel}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              <strong className="text-slate-800">{selectedRole}:</strong> {selectedRoleDetails.responsibilities}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Password */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <KeyRound className="w-4 h-4 text-slate-400" />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 chars"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-xs text-slate-800 font-medium transition-all"
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Confirm Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <KeyRound className="w-4 h-4 text-slate-400" />
                </span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-xs text-slate-800 font-medium transition-all"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold font-display rounded-xl text-xs tracking-widest uppercase transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer mt-4"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Registering...</span>
              </>
            ) : (
              <span>Create Account</span>
            )}
          </button>
        </form>
      </div>

      {/* Back to login switcher */}
      <div className="text-center pt-6 border-t border-slate-100">
        <button
          type="button"
          onClick={onBackToLogin}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Login</span>
        </button>
      </div>
    </div>
  );
}
