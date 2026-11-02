import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Bell,
  LifeBuoy,
  LogOut,
  CheckCircle2,
  ShieldCheck,
  Smartphone,
  Mail,
  KeyRound,
  ArrowRight,
  RefreshCw,
  Clock,
} from 'lucide-react';
import {
  UserAccount,
  AppNotification,
  SupportTicket,
} from '../utils/commerce';
import { useAuth } from './AuthProvider';

interface AccountSupportModalProps {
  isOpen: boolean;
  initialTab?: 'account' | 'notifications' | 'support';
  onClose: () => void;
  currentUser?: UserAccount | null;
  notifications: AppNotification[];
  supportTickets: SupportTicket[];
  onUserAuthenticated?: (user: UserAccount) => void;
  onSignOut?: () => void;
  onTicketCreated: (tickets: SupportTicket[]) => void;
  onNotificationsUpdated?: (notifs: AppNotification[]) => void;
}

export const AccountSupportModal: React.FC<AccountSupportModalProps> = ({
  isOpen,
  initialTab = 'account',
  onClose,
  currentUser: propUser,
  notifications,
  supportTickets,
  onUserAuthenticated,
  onSignOut,
  onTicketCreated,
  onNotificationsUpdated,
}) => {
  const {
    currentUser: contextUser,
    otpStep,
    setOtpStep,
    isSimulatingOtp,
    dispatchedOtp,
    requestOtp,
    verifyOtp,
    loginWithPassword,
    signOut,
  } = useAuth();

  const activeUser = contextUser || propUser || null;

  const [activeTab, setActiveTab] = useState<'account' | 'notifications' | 'support'>(
    initialTab
  );

  // OTP & Auth State
  const [loginMethod, setLoginMethod] = useState<'UNIFIED_OTP' | 'MOBILE_OTP' | 'EMAIL_OTP' | 'PASSWORD'>(
    'UNIFIED_OTP'
  );
  const [identifierInput, setIdentifierInput] = useState('9820145892');
  const [mobileInput, setMobileInput] = useState('9820145892');
  const [emailInput, setEmailInput] = useState('adityaair1.2029@gmail.com');
  const [fullNameInput, setFullNameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('atelier2026');

  // OTP Verification Step State
  const [otpCodeInput, setOtpCodeInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  // Support Ticket Form
  const [ticketCategory, setTicketCategory] =
    useState<SupportTicket['category']>('Size & Fit Exchange');
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketSubmitting, setTicketSubmitting] = useState(false);
  const [ticketSuccess, setTicketSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setAuthError(null);
      setAuthSuccess(null);
      setTicketSuccess(null);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    const rawIdentifier =
      loginMethod === 'EMAIL_OTP'
        ? emailInput.trim()
        : loginMethod === 'MOBILE_OTP'
          ? mobileInput.trim()
          : identifierInput.trim();

    const explicitChannel =
      loginMethod === 'EMAIL_OTP'
        ? 'EMAIL'
        : loginMethod === 'MOBILE_OTP'
          ? 'MOBILE'
          : undefined;

    const result = await requestOtp({
      identifier: rawIdentifier,
      channel: explicitChannel,
      name: fullNameInput.trim() || undefined,
      delayMs: 650,
    });

    if (!result.success) {
      setAuthError(result.error || 'Could not send OTP. Please check your details.');
    } else {
      setOtpCodeInput(result.generatedCode || '');
      setAuthSuccess(
        `6-digit OTP generated after simulated gateway delay (650ms) and dispatched to ${result.maskedDestination}.`
      );
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const result = await verifyOtp({
      otpCode: otpCodeInput.trim(),
      name: fullNameInput.trim() || undefined,
      delayMs: 500,
    });

    if (!result.success || !result.user) {
      setAuthError(result.error || 'Invalid OTP code.');
    } else {
      if (onUserAuthenticated) {
        onUserAuthenticated(result.user);
      }
      if (result.notifications && onNotificationsUpdated) {
        onNotificationsUpdated(result.notifications);
      }
      setOtpCodeInput('');
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    const result = await loginWithPassword(emailInput.trim(), passwordInput);
    if (!result.success || !result.user) {
      setAuthError(result.error || 'Authentication failed.');
    } else if (onUserAuthenticated) {
      onUserAuthenticated(result.user);
    }
  };

  const handleSignOutClick = () => {
    signOut();
    if (onSignOut) onSignOut();
  };

  const handleCreateSupportTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketMessage.trim()) return;
    setTicketSubmitting(true);
    setTicketSuccess(null);
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: activeUser?.fullName || 'one8 Club Athlete',
          customerEmail: activeUser?.email || emailInput || 'athlete@one8club.in',
          category: ticketCategory,
          priority: 'Normal',
          subject: ticketSubject,
          message: ticketMessage,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        onTicketCreated(data.supportTickets);
        setTicketSubject('');
        setTicketMessage('');
        setTicketSuccess(
          `Ticket ${data.ticket.id} logged with automated one8 AI Triage response.`
        );
      }
    } finally {
      setTicketSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 md:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="one8 Club Account, Mobile & Email OTP Login, and Support Center"
    >
      <div className="relative w-full max-w-3xl bg-[#F6F6F4] border border-zinc-300 rounded-xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-[#0A0A0B] text-white border-b border-zinc-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-[#D4AF37]">
              one8 Club Identity · AuthProvider OTP Gateway
            </div>
            <h2 className="font-display text-2xl uppercase font-bold text-white">
              Account, OTP Verification & Athlete Support
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close account and support modal"
            className="w-9 h-9 rounded-lg border border-zinc-700 flex items-center justify-center text-zinc-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 pt-3.5 bg-white border-b border-zinc-200 flex items-center gap-6">
          <button
            type="button"
            onClick={() => setActiveTab('account')}
            className={`pb-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'account'
                ? 'border-[#E11D48] text-zinc-950'
                : 'border-transparent text-zinc-500 hover:text-zinc-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>
              {activeUser
                ? `one8 Profile (${activeUser.fullName.split(' ')[0]})`
                : 'Mobile / Email OTP Login'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('notifications')}
            className={`pb-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'notifications'
                ? 'border-[#E11D48] text-zinc-950'
                : 'border-transparent text-zinc-500 hover:text-zinc-900'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Notifications ({notifications.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('support')}
            className={`pb-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'support'
                ? 'border-[#E11D48] text-zinc-950'
                : 'border-transparent text-zinc-500 hover:text-zinc-900'
            }`}
          >
            <LifeBuoy className="w-3.5 h-3.5" />
            <span>Support Center ({supportTickets.length})</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* TAB 1: ACCOUNT & MOBILE / EMAIL OTP AUTHENTICATION */}
          {activeTab === 'account' && (
            <>
              {activeUser ? (
                <div className="space-y-5">
                  <div className="bg-white p-5 rounded-xl border border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-emerald-700 font-semibold">
                        <ShieldCheck className="w-4 h-4" />
                        <span>
                          OTP Verified Session · Role: {activeUser.role} · Tier:{' '}
                          {activeUser.loyaltyTier || 'one8 Pro Athlete'} (
                          {activeUser.loyaltyPoints ?? 500} Pts)
                        </span>
                      </div>
                      <h3 className="font-display text-2xl uppercase font-bold text-zinc-950">
                        {activeUser.fullName}
                      </h3>
                      <p className="text-xs text-zinc-600 font-mono">
                        {activeUser.email} · +91 {activeUser.phone}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleSignOutClick}
                      className="px-4 py-2 rounded-lg border border-zinc-300 text-xs font-semibold text-zinc-800 hover:bg-zinc-100 flex items-center gap-1.5 self-start"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-zinc-200 space-y-3">
                    <div className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
                      Saved Express Delivery Addresses (
                      {activeUser.savedAddresses?.length || 1})
                    </div>
                    {(activeUser.savedAddresses && activeUser.savedAddresses.length > 0
                      ? activeUser.savedAddresses
                      : [
                          {
                            id: 'addr-default',
                            label: 'Mumbai Bandra Residence',
                            fullName: activeUser.fullName,
                            streetAddress: '402, Pali Hill Residences, Bandra West',
                            city: 'Mumbai',
                            state: 'Maharashtra',
                            pinCode: '400050',
                          },
                        ]
                    ).map((addr, idx) => (
                      <div
                        key={addr.id || idx}
                        className="p-3.5 rounded-lg bg-[#F6F6F4] border border-zinc-200 text-xs space-y-1"
                      >
                        <div className="font-semibold text-zinc-900">
                          {addr.label || 'Primary Delivery Address'} — {addr.fullName}
                        </div>
                        <div className="text-zinc-600">
                          {addr.streetAddress}, {addr.city}, {addr.state} — {addr.pinCode}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-white p-6 rounded-xl border border-zinc-200 space-y-5">
                  {/* Channel Selector Tabs: Unified Mobile/Email OTP vs Mobile OTP vs Email OTP vs Password */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 pb-4">
                    <div className="flex flex-wrap items-center gap-1.5 bg-zinc-100 p-1 rounded-lg">
                      <button
                        type="button"
                        onClick={() => {
                          setLoginMethod('UNIFIED_OTP');
                          setOtpStep('REQUEST');
                          setAuthError(null);
                        }}
                        className={`px-3 py-2 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                          loginMethod === 'UNIFIED_OTP'
                            ? 'bg-[#0A0A0B] text-white shadow-xs'
                            : 'text-zinc-600 hover:text-zinc-950'
                        }`}
                      >
                        <Smartphone className="w-3.5 h-3.5 text-[#E11D48]" />
                        <span>Mobile / Email OTP</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setLoginMethod('MOBILE_OTP');
                          setOtpStep('REQUEST');
                          setAuthError(null);
                        }}
                        className={`px-3 py-2 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                          loginMethod === 'MOBILE_OTP'
                            ? 'bg-[#0A0A0B] text-white shadow-xs'
                            : 'text-zinc-600 hover:text-zinc-950'
                        }`}
                      >
                        <Smartphone className="w-3.5 h-3.5 text-[#E11D48]" />
                        <span>Mobile Number OTP</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setLoginMethod('EMAIL_OTP');
                          setOtpStep('REQUEST');
                          setAuthError(null);
                        }}
                        className={`px-3 py-2 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                          loginMethod === 'EMAIL_OTP'
                            ? 'bg-[#0A0A0B] text-white shadow-xs'
                            : 'text-zinc-600 hover:text-zinc-950'
                        }`}
                      >
                        <Mail className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>Email OTP</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setLoginMethod('PASSWORD');
                          setOtpStep('REQUEST');
                          setAuthError(null);
                        }}
                        className={`px-3 py-2 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                          loginMethod === 'PASSWORD'
                            ? 'bg-[#0A0A0B] text-white shadow-xs'
                            : 'text-zinc-600 hover:text-zinc-950'
                        }`}
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>Password</span>
                      </button>
                    </div>

                    {/* Quick Demo Presets */}
                    <div className="flex items-center gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setIdentifierInput('9820145892');
                          setMobileInput('9820145892');
                          setEmailInput('adityaair1.2029@gmail.com');
                          setOtpStep('REQUEST');
                        }}
                        className="px-2.5 py-1 rounded border border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100"
                      >
                        Fill Athlete Demo
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIdentifierInput('admin@verveatelier.in');
                          setMobileInput('9820011122');
                          setEmailInput('admin@verveatelier.in');
                          setOtpStep('REQUEST');
                        }}
                        className="px-2.5 py-1 rounded border border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100"
                      >
                        Fill Admin Demo
                      </button>
                    </div>
                  </div>

                  {/* MOBILE / EMAIL OTP FLOW */}
                  {loginMethod !== 'PASSWORD' && (
                    <>
                      {otpStep === 'REQUEST' ? (
                        <form onSubmit={handleSendOtp} className="space-y-4">
                          {loginMethod === 'UNIFIED_OTP' && (
                            <div>
                              <label
                                htmlFor="otp-unified-input"
                                className="block text-xs font-semibold text-zinc-800 mb-1.5"
                              >
                                Mobile Number or Email Address (Auto-detects +91 SMS or Email OTP)
                              </label>
                              <input
                                id="otp-unified-input"
                                type="text"
                                required
                                value={identifierInput}
                                onChange={(e) => setIdentifierInput(e.target.value)}
                                placeholder="Enter 10-digit mobile (9820145892) or email (aditya@one8.com)"
                                className="w-full px-3.5 py-2.5 text-sm font-mono rounded-lg border border-zinc-300 bg-[#F6F6F4] focus:outline-none focus:border-zinc-950"
                              />
                              <p className="text-[11px] text-zinc-500 mt-1 flex items-center gap-1.5">
                                <Clock className="w-3 h-3 text-[#E11D48]" />
                                <span>
                                  Detected channel:{' '}
                                  <strong className="text-zinc-800 font-mono">
                                    {identifierInput.includes('@')
                                      ? 'EMAIL OTP GATEWAY'
                                      : '+91 SMS MOBILE OTP GATEWAY'}
                                  </strong>{' '}
                                  · Simulated dispatch delay: 650ms
                                </span>
                              </p>
                            </div>
                          )}

                          {loginMethod === 'MOBILE_OTP' && (
                            <div>
                              <label
                                htmlFor="otp-mobile-input"
                                className="block text-xs font-semibold text-zinc-800 mb-1.5"
                              >
                                Mobile Number (10-Digit Indian Mobile for SMS / WhatsApp OTP)
                              </label>
                              <div className="flex items-center">
                                <span className="px-3.5 py-2.5 text-sm font-mono font-semibold bg-zinc-100 border border-r-0 border-zinc-300 rounded-l-lg text-zinc-700">
                                  +91
                                </span>
                                <input
                                  id="otp-mobile-input"
                                  type="tel"
                                  required
                                  maxLength={10}
                                  value={mobileInput}
                                  onChange={(e) =>
                                    setMobileInput(e.target.value.replace(/\D/g, '').slice(0, 10))
                                  }
                                  placeholder="9820145892"
                                  className="w-full px-3.5 py-2.5 text-sm font-mono rounded-r-lg border border-zinc-300 bg-[#F6F6F4] focus:outline-none focus:border-zinc-950"
                                />
                              </div>
                            </div>
                          )}

                          {loginMethod === 'EMAIL_OTP' && (
                            <div>
                              <label
                                htmlFor="otp-email-input"
                                className="block text-xs font-semibold text-zinc-800 mb-1.5"
                              >
                                Email Address (For Instant 6-Digit Email Verification Code)
                              </label>
                              <input
                                id="otp-email-input"
                                type="email"
                                required
                                value={emailInput}
                                onChange={(e) => setEmailInput(e.target.value)}
                                placeholder="adityaair1.2029@gmail.com"
                                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-zinc-300 bg-[#F6F6F4] focus:outline-none focus:border-zinc-950"
                              />
                            </div>
                          )}

                          <div>
                            <label
                              htmlFor="otp-name-input"
                              className="block text-xs font-medium text-zinc-600 mb-1"
                            >
                              Your Name (Optional — used if creating a new one8 Club profile)
                            </label>
                            <input
                              id="otp-name-input"
                              type="text"
                              value={fullNameInput}
                              onChange={(e) => setFullNameInput(e.target.value)}
                              placeholder="Aditya Sharma"
                              className="w-full px-3.5 py-2 text-xs rounded-lg border border-zinc-300 bg-[#F6F6F4]"
                            />
                          </div>

                          {authError && (
                            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                              {authError}
                            </div>
                          )}

                          <button
                            type="submit"
                            disabled={isSimulatingOtp}
                            className="w-full py-3 px-4 rounded-lg bg-[#E11D48] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#BE123C] transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                          >
                            <span>
                              {isSimulatingOtp
                                ? 'Simulating OTP Gateway Dispatch (650ms)...'
                                : loginMethod === 'EMAIL_OTP'
                                  ? 'Send 6-Digit Email OTP'
                                  : 'Send 6-Digit OTP Verification Code'}
                            </span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </form>
                      ) : (
                        <form onSubmit={handleVerifyOtp} className="space-y-4">
                          {/* Live Simulated SMS / Email OTP Dispatch Banner */}
                          {dispatchedOtp && (
                            <div className="p-4 rounded-xl bg-[#0A0A0B] text-white border border-zinc-800 space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-mono uppercase text-[#D4AF37] font-semibold">
                                  one8 OTP Gateway ·{' '}
                                  {dispatchedOtp.channel === 'MOBILE'
                                    ? 'SMS Dispatched'
                                    : 'Email Dispatched'}
                                </span>
                                <span className="text-zinc-400 font-mono">
                                  Latency: {dispatchedOtp.simulatedDelayMs}ms · Valid 05:00
                                </span>
                              </div>
                              <p className="text-xs text-zinc-300">
                                Verification code sent to{' '}
                                <strong className="text-white font-mono">
                                  {dispatchedOtp.maskedDestination}
                                </strong>
                                . Your generated 6-digit OTP is:
                              </p>
                              <div className="flex items-center justify-between bg-zinc-900 px-4 py-2.5 rounded-lg border border-zinc-700">
                                <span className="font-mono text-xl font-bold tracking-[0.25em] text-[#E11D48]">
                                  {dispatchedOtp.generatedCode}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setOtpCodeInput(dispatchedOtp.generatedCode)
                                  }
                                  className="px-2.5 py-1 rounded bg-zinc-800 text-zinc-200 text-[11px] font-medium hover:bg-zinc-700"
                                >
                                  Auto-Fill Code
                                </button>
                              </div>
                            </div>
                          )}

                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <label
                                htmlFor="verify-otp-input"
                                className="block text-xs font-semibold text-zinc-800"
                              >
                                Enter 6-Digit OTP Verification Code
                              </label>
                              <button
                                type="button"
                                onClick={() => {
                                  setOtpStep('REQUEST');
                                  setAuthError(null);
                                }}
                                className="text-xs text-[#E11D48] underline"
                              >
                                Change Mobile / Email
                              </button>
                            </div>
                            <input
                              id="verify-otp-input"
                              type="text"
                              inputMode="numeric"
                              maxLength={6}
                              required
                              value={otpCodeInput}
                              onChange={(e) =>
                                setOtpCodeInput(e.target.value.replace(/\D/g, '').slice(0, 6))
                              }
                              placeholder="6-digit OTP"
                              className="w-full px-4 py-3 text-lg font-mono font-bold tracking-[0.3em] text-center rounded-lg border border-zinc-300 bg-[#F6F6F4] focus:outline-none focus:border-zinc-950"
                            />
                          </div>

                          {authError && (
                            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                              {authError}
                            </div>
                          )}

                          {authSuccess && !authError && (
                            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 shrink-0" />
                              <span>{authSuccess}</span>
                            </div>
                          )}

                          <div className="flex flex-col sm:flex-row gap-2.5">
                            <button
                              type="submit"
                              disabled={isSimulatingOtp}
                              className="flex-1 py-3 px-4 rounded-lg bg-[#0A0A0B] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#E11D48] transition-colors disabled:opacity-60"
                            >
                              {isSimulatingOtp
                                ? 'Verifying OTP (500ms)...'
                                : 'Verify 6-Digit OTP & Login'}
                            </button>
                            <button
                              type="button"
                              disabled={isSimulatingOtp}
                              onClick={() => handleSendOtp()}
                              className="py-3 px-4 rounded-lg border border-zinc-300 text-zinc-700 text-xs font-semibold hover:bg-zinc-100 flex items-center justify-center gap-1.5"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span>Resend OTP</span>
                            </button>
                          </div>
                        </form>
                      )}
                    </>
                  )}

                  {/* TRADITIONAL PASSWORD LOGIN TAB */}
                  {loginMethod === 'PASSWORD' && (
                    <form onSubmit={handlePasswordLogin} className="space-y-4">
                      <div>
                        <label
                          htmlFor="auth-email"
                          className="block text-xs font-semibold text-zinc-800 mb-1"
                        >
                          Email Address
                        </label>
                        <input
                          id="auth-email"
                          type="email"
                          required
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 bg-[#F6F6F4]"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="auth-password"
                          className="block text-xs font-semibold text-zinc-800 mb-1"
                        >
                          Password
                        </label>
                        <input
                          id="auth-password"
                          type="password"
                          required
                          value={passwordInput}
                          onChange={(e) => setPasswordInput(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 bg-[#F6F6F4]"
                        />
                      </div>

                      {authError && (
                        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                          {authError}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isSimulatingOtp}
                        className="w-full py-2.5 px-4 rounded-lg bg-[#0A0A0B] text-white text-xs font-semibold hover:bg-zinc-800 transition-colors"
                      >
                        {isSimulatingOtp ? 'Signing In...' : 'Sign In with Password'}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </>
          )}

          {/* TAB 2: REAL-TIME NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="space-y-3">
              {notifications.length === 0 ? (
                <p className="text-xs text-zinc-500">No active notifications.</p>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className="bg-white p-4 rounded-xl border border-zinc-200 flex items-start justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <span className="font-mono font-semibold text-[#E11D48]">
                          {notif.type}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {new Date(notif.createdAt).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-zinc-900">{notif.title}</h4>
                      <p className="text-xs text-zinc-600">{notif.message}</p>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-1" />
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: CUSTOMER SUPPORT & AI TRIAGE */}
          {activeTab === 'support' && (
            <div className="space-y-6">
              <form
                onSubmit={handleCreateSupportTicket}
                className="bg-white p-5 rounded-xl border border-zinc-200 space-y-4"
              >
                <div className="text-xs font-bold uppercase tracking-wider text-zinc-900">
                  Open New Athlete Support Request (Instant AI Triage)
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="ticket-cat"
                      className="block text-xs font-medium text-zinc-700 mb-1"
                    >
                      Inquiry Category
                    </label>
                    <select
                      id="ticket-cat"
                      value={ticketCategory}
                      onChange={(e) =>
                        setTicketCategory(e.target.value as SupportTicket['category'])
                      }
                      className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 bg-[#F6F6F4]"
                    >
                      <option value="Size & Fit Exchange">Size & Fit Exchange</option>
                      <option value="Order & Delivery">Order & Delivery</option>
                      <option value="Payment & Invoice">Payment & Invoice</option>
                      <option value="Return & Refund">Return & Refund</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="ticket-subj"
                      className="block text-xs font-medium text-zinc-700 mb-1"
                    >
                      Subject / Order ID
                    </label>
                    <input
                      id="ticket-subj"
                      type="text"
                      required
                      value={ticketSubject}
                      onChange={(e) => setTicketSubject(e.target.value)}
                      placeholder="e.g., Size UK 9 exchange for Velocity Runner"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 bg-[#F6F6F4]"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="ticket-msg"
                    className="block text-xs font-medium text-zinc-700 mb-1"
                  >
                    Message Details
                  </label>
                  <textarea
                    id="ticket-msg"
                    rows={2}
                    required
                    value={ticketMessage}
                    onChange={(e) => setTicketMessage(e.target.value)}
                    placeholder="Describe your sizing, delivery, or warranty question..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 bg-[#F6F6F4]"
                  />
                </div>

                {ticketSuccess && (
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
                    {ticketSuccess}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={ticketSubmitting}
                  className="px-4 py-2 rounded-lg bg-[#0A0A0B] text-white text-xs font-semibold hover:bg-[#E11D48] transition-colors"
                >
                  {ticketSubmitting ? 'Submitting...' : 'Submit Ticket & Run AI Triage'}
                </button>
              </form>

              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                  Active & Historical Tickets ({supportTickets.length})
                </div>
                {supportTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="bg-white p-4 rounded-xl border border-zinc-200 space-y-2.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-[#E11D48]">
                        {ticket.id} · {ticket.category}
                      </span>
                      <span className="font-medium text-zinc-700">
                        Status: {ticket.status}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-zinc-900">{ticket.subject}</div>
                    <div className="space-y-2 pt-1">
                      {ticket.messages.map((m) => (
                        <div
                          key={m.id}
                          className="p-2.5 rounded bg-[#F6F6F4] text-xs text-zinc-700"
                        >
                          <strong className="text-zinc-900">{m.sender}:</strong> {m.text}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
