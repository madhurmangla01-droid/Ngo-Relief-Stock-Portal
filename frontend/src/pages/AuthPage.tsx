import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  Building2,
  Eye,
  EyeOff,
  FileBadge2,
  HeartHandshake,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  User,
} from 'lucide-react';
import { StatusBanner } from '../components/StatusBanner';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { LOGIN_HERO_IMAGE } from '../types';

const FOCUS_AREAS = [
  'Community Relief & Food',
  'Healthcare & Medicines',
  'Education & Youth Support',
  'Shelter & Winter Aid',
  'Disaster Response & Multi-Sector',
];

export function AuthPage() {
  const { login, registerNgo } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [hasRegisteredNgo, setHasRegisteredNgo] = useState<boolean | null>(null);

  // NGO Details
  const [ngoName, setNgoName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [cityState, setCityState] = useState('');
  const [focusArea, setFocusArea] = useState(FOCUS_AREAS[0]);
  const [officialPhone, setOfficialPhone] = useState('');

  // Coordinator Credentials
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [heroImgError, setHeroImgError] = useState(false);

  useEffect(() => {
    let active = true;
    api
      .getAuthStatus()
      .then((res) => {
        if (!active) return;
        setHasRegisteredNgo(res.hasRegisteredNgo);
        setMode(res.hasRegisteredNgo ? 'login' : 'register');
      })
      .catch(() => {
        if (active) {
          setHasRegisteredNgo(false);
          setMode('register');
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const switchMode = (nextMode: 'login' | 'register') => {
    setMode(nextMode);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedRegNo = registrationNumber.trim();
    const trimmedEmail = email.trim();

    if (trimmedRegNo.length < 4) {
      setError('Please enter a valid NGO Registration Number / Trust ID (at least 4 characters).');
      return;
    }
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Please enter a valid official email address.');
      return;
    }

    if (mode === 'register') {
      if (!ngoName.trim()) {
        setError('Official NGO name is required.');
        return;
      }
      if (!cityState.trim()) {
        setError('Operating city and state/region are required.');
        return;
      }
      if (officialPhone.trim().length < 7) {
        setError('Please enter an official NGO contact phone number.');
        return;
      }
      if (!displayName.trim()) {
        setError('Authorized coordinator full name is required.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match. Please re-enter your password.');
        return;
      }
    } else if (!password) {
      setError('Please enter your password.');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'register') {
        await registerNgo({
          ngoName: ngoName.trim(),
          registrationNumber: trimmedRegNo,
          cityState: cityState.trim(),
          focusArea,
          officialPhone: officialPhone.trim(),
          displayName: displayName.trim(),
          email: trimmedEmail,
          password,
        });
      } else {
        await login(trimmedRegNo, trimmedEmail, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authorization failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 app-canvas">
      {/* Left Editorial Photography Showcase (Desktop) */}
      <div className="relative hidden lg:flex lg:col-span-5 xl:col-span-6 flex-col justify-between overflow-hidden bg-[#0A223D] text-white p-10 xl:p-14">
        {!heroImgError ? (
          <img
            src={LOGIN_HERO_IMAGE}
            alt="Organized community NGO relief supply center with food crates, blankets, books, and first-aid kits"
            referrerPolicy="no-referrer"
            onError={() => setHeroImgError(true)}
            className="absolute inset-0 h-full w-full object-cover scale-[1.01]"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#0A223D] via-[#0F3157] to-[#0B463F]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#07182B]/95 via-[#0B223D]/55 to-[#07182B]/45" />

        {/* Brand Lockup */}
        <div className="relative z-10 flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-slate-950 shadow-lg shadow-slate-950/30">
            <HeartHandshake className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <p className="text-lg font-bold tracking-tight text-white">SevaCare NGO</p>
            <p className="text-xs text-emerald-200/95 font-medium">
              Authorized Donation &amp; Inventory Ledger
            </p>
          </div>
        </div>

        {/* Bottom Editorial Statement */}
        <div className="relative z-10 max-w-xl space-y-6">
          <div className="space-y-3.5">
            <h2 className="text-4xl xl:text-[44px] font-semibold tracking-tight leading-[1.12] text-white">
              Stewardship that every community can trust.
            </h2>
            <p className="text-sm xl:text-base text-sky-100/90 leading-relaxed max-w-lg">
              Register your organization once to track incoming donations, monitor real-time relief
              stock with automatic threshold alerts, and safeguard every community distribution in
              a permanent, non-deletable ledger.
            </p>
          </div>

          <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 p-5 grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs font-semibold text-emerald-300">01. Verified Registry</p>
              <p className="text-xs text-sky-100/80 mt-1 leading-snug">
                Authorized NGO ID required for access
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-300">02. Permanent Ledger</p>
              <p className="text-xs text-sky-100/80 mt-1 leading-snug">
                Immutable receipts &amp; dispatch audit trail
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-300">03. Any Device</p>
              <p className="text-xs text-sky-100/80 mt-1 leading-snug">
                Crafted for phone, tablet &amp; desktop
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Authorization & NGO Onboarding Panel */}
      <div className="lg:col-span-7 xl:col-span-6 flex flex-col justify-center px-4 py-6 sm:px-8 sm:py-10 lg:px-12 xl:px-16">
        <div className="mx-auto w-full max-w-xl">
          {/* Mobile & Tablet Editorial Banner */}
          <div className="lg:hidden relative overflow-hidden rounded-3xl bg-[#0A223D] text-white p-6 mb-5 shadow-lg shadow-slate-900/10">
            {!heroImgError && (
              <img
                src={LOGIN_HERO_IMAGE}
                alt="Community NGO relief warehouse"
                referrerPolicy="no-referrer"
                onError={() => setHeroImgError(true)}
                className="absolute inset-0 h-full w-full object-cover opacity-45"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-[#07182B]/92 via-[#0B2545]/82 to-[#0B463F]/75" />
            <div className="relative z-10 flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-slate-950 shrink-0 shadow-sm">
                <HeartHandshake className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-base font-bold tracking-tight text-white">SevaCare NGO</p>
                <p className="text-xs text-emerald-200">
                  Authorized Donation &amp; Permanent Inventory Ledger
                </p>
              </div>
            </div>
          </div>

          <div className="surface-card rounded-3xl p-6 sm:p-8 lg:p-9">
            {/* Segmented Mode Switcher */}
            <div
              role="tablist"
              aria-label="NGO authorization mode"
              className="grid grid-cols-2 gap-1.5 rounded-2xl bg-slate-100/90 p-1.5 mb-7"
            >
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'login'}
                onClick={() => switchMode('login')}
                className={`min-h-[44px] rounded-xl px-3 py-2 text-sm font-semibold transition-all whitespace-nowrap ${
                  mode === 'login'
                    ? 'bg-white text-[#0B223D] shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Authorized Sign In
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'register'}
                onClick={() => switchMode('register')}
                className={`min-h-[44px] rounded-xl px-3 py-2 text-sm font-semibold transition-all whitespace-nowrap ${
                  mode === 'register'
                    ? 'bg-white text-[#0B223D] shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Register NGO
              </button>
            </div>

            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
                {mode === 'login' ? 'Welcome back' : 'Register your NGO'}
              </h1>
              <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">
                {mode === 'login'
                  ? 'Access is exclusively for verified organizations. Enter your registered NGO ID and coordinator credentials.'
                  : 'Complete your NGO registration details below to authorize your organization and launch your workspace.'}
              </p>
            </div>

            {hasRegisteredNgo === false && mode === 'register' && (
              <div className="mb-5">
                <StatusBanner
                  variant="info"
                  message="No NGO is registered yet. Register your NGO details below to activate authorized access with sample relief stock ready to explore."
                />
              </div>
            )}

            {error && (
              <div className="mb-5">
                <StatusBanner variant="error" message={error} onDismiss={() => setError(null)} />
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              {mode === 'register' && (
                <div className="space-y-4">
                  <p className="text-xs font-semibold text-blue-800">
                    01. Organization Details
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="ngo-name"
                        className="block text-xs font-semibold text-slate-700 mb-1.5"
                      >
                        Official NGO Name <span className="text-red-600">*</span>
                      </label>
                      <div className="relative">
                        <Building2
                          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
                          aria-hidden="true"
                        />
                        <input
                          id="ngo-name"
                          type="text"
                          required
                          value={ngoName}
                          onChange={(e) => setNgoName(e.target.value)}
                          placeholder="e.g., Asha Relief Foundation"
                          className="w-full min-h-[44px] rounded-xl border border-slate-300/90 bg-slate-50/40 pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-3 focus:ring-blue-600/15 transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="ngo-reg-number"
                        className="block text-xs font-semibold text-slate-700 mb-1.5"
                      >
                        NGO Registration Number <span className="text-red-600">*</span>
                      </label>
                      <div className="relative">
                        <FileBadge2
                          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
                          aria-hidden="true"
                        />
                        <input
                          id="ngo-reg-number"
                          type="text"
                          required
                          value={registrationNumber}
                          onChange={(e) => setRegistrationNumber(e.target.value)}
                          placeholder="e.g., NGO-2026-8841"
                          className="w-full min-h-[44px] rounded-xl border border-slate-300/90 bg-slate-50/40 pl-10 pr-3.5 py-2.5 text-sm font-mono uppercase text-slate-900 placeholder:normal-case placeholder:font-sans placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-3 focus:ring-blue-600/15 transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="ngo-city"
                        className="block text-xs font-semibold text-slate-700 mb-1.5"
                      >
                        City &amp; State / Region <span className="text-red-600">*</span>
                      </label>
                      <div className="relative">
                        <MapPin
                          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
                          aria-hidden="true"
                        />
                        <input
                          id="ngo-city"
                          type="text"
                          required
                          value={cityState}
                          onChange={(e) => setCityState(e.target.value)}
                          placeholder="e.g., Bengaluru, Karnataka"
                          className="w-full min-h-[44px] rounded-xl border border-slate-300/90 bg-slate-50/40 pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-3 focus:ring-blue-600/15 transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="ngo-phone"
                        className="block text-xs font-semibold text-slate-700 mb-1.5"
                      >
                        Official Contact Phone <span className="text-red-600">*</span>
                      </label>
                      <div className="relative">
                        <Phone
                          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
                          aria-hidden="true"
                        />
                        <input
                          id="ngo-phone"
                          type="tel"
                          required
                          value={officialPhone}
                          onChange={(e) => setOfficialPhone(e.target.value)}
                          placeholder="+91 98765 43210"
                          className="w-full min-h-[44px] rounded-xl border border-slate-300/90 bg-slate-50/40 pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-3 focus:ring-blue-600/15 transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="ngo-focus"
                      className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                      Primary Relief Focus
                    </label>
                    <select
                      id="ngo-focus"
                      value={focusArea}
                      onChange={(e) => setFocusArea(e.target.value)}
                      className="w-full min-h-[44px] rounded-xl border border-slate-300/90 bg-slate-50/40 px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-3 focus:ring-blue-600/15 transition-colors"
                    >
                      {FOCUS_AREAS.map((area) => (
                        <option key={area} value={area}>
                          {area}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Account Credentials Section */}
              <div
                className={`space-y-4 ${mode === 'register' ? 'pt-5 border-t border-slate-100' : ''}`}
              >
                {mode === 'register' && (
                  <p className="text-xs font-semibold text-emerald-800">
                    02. Authorized Coordinator Login
                  </p>
                )}

                {mode === 'login' && (
                  <div>
                    <label
                      htmlFor="login-ngo-reg"
                      className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                      NGO Registration Number <span className="text-red-600">*</span>
                    </label>
                    <div className="relative">
                      <FileBadge2
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
                        aria-hidden="true"
                      />
                      <input
                        id="login-ngo-reg"
                        type="text"
                        required
                        value={registrationNumber}
                        onChange={(e) => setRegistrationNumber(e.target.value)}
                        placeholder="Enter your registered NGO ID (e.g., NGO-2026-8841)"
                        className="w-full min-h-[44px] rounded-xl border border-slate-300/90 bg-slate-50/40 pl-10 pr-3.5 py-2.5 text-sm font-mono uppercase text-slate-900 placeholder:normal-case placeholder:font-sans placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-3 focus:ring-blue-600/15 transition-colors"
                      />
                    </div>
                  </div>
                )}

                <div
                  className={
                    mode === 'register' ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' : 'space-y-4'
                  }
                >
                  {mode === 'register' && (
                    <div>
                      <label
                        htmlFor="auth-name"
                        className="block text-xs font-semibold text-slate-700 mb-1.5"
                      >
                        Coordinator Full Name <span className="text-red-600">*</span>
                      </label>
                      <div className="relative">
                        <User
                          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
                          aria-hidden="true"
                        />
                        <input
                          id="auth-name"
                          type="text"
                          autoComplete="name"
                          required
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="e.g., Priya Nair"
                          className="w-full min-h-[44px] rounded-xl border border-slate-300/90 bg-slate-50/40 pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-3 focus:ring-blue-600/15 transition-colors"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="auth-email"
                      className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                      Official Email <span className="text-red-600">*</span>
                    </label>
                    <div className="relative">
                      <Mail
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
                        aria-hidden="true"
                      />
                      <input
                        id="auth-email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="coordinator@ngo.org"
                        className="w-full min-h-[44px] rounded-xl border border-slate-300/90 bg-slate-50/40 pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-3 focus:ring-blue-600/15 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div className={mode === 'register' ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' : ''}>
                  <div>
                    <label
                      htmlFor="auth-password"
                      className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                      Password <span className="text-red-600">*</span>
                    </label>
                    <div className="relative">
                      <Lock
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
                        aria-hidden="true"
                      />
                      <input
                        id="auth-password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={
                          mode === 'register' ? 'Minimum 6 characters' : 'Enter your password'
                        }
                        className="w-full min-h-[44px] rounded-xl border border-slate-300/90 bg-slate-50/40 pl-10 pr-11 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-3 focus:ring-blue-600/15 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {mode === 'register' && (
                    <div>
                      <label
                        htmlFor="auth-confirm-password"
                        className="block text-xs font-semibold text-slate-700 mb-1.5"
                      >
                        Confirm Password <span className="text-red-600">*</span>
                      </label>
                      <div className="relative">
                        <ShieldCheck
                          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
                          aria-hidden="true"
                        />
                        <input
                          id="auth-confirm-password"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter password"
                          className="w-full min-h-[44px] rounded-xl border border-slate-300/90 bg-slate-50/40 pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-3 focus:ring-blue-600/15 transition-colors"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0B223D] via-[#15428A] to-[#1D4ED8] px-5 py-3 text-sm font-semibold text-white shadow-md shadow-blue-950/15 hover:brightness-110 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                <span>
                  {submitting
                    ? mode === 'login'
                      ? 'Verifying NGO Access...'
                      : 'Registering NGO...'
                    : mode === 'login'
                      ? 'Sign In as Authorized NGO'
                      : 'Register NGO & Enter Workspace'}
                </span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-100 text-center text-sm text-slate-600">
              {mode === 'login' ? (
                <>
                  First time using the platform?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('register')}
                    className="font-semibold text-blue-700 hover:text-blue-900 underline underline-offset-4"
                  >
                    Register your NGO first
                  </button>
                </>
              ) : (
                <>
                  Your NGO is already registered?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="font-semibold text-blue-700 hover:text-blue-900 underline underline-offset-4"
                  >
                    Sign in with NGO ID
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
