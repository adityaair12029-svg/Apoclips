import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserAccount, AppNotification } from '../utils/commerce';

export interface DispatchedOtpChallenge {
  channel: 'MOBILE' | 'EMAIL';
  identifier: string;
  maskedDestination: string;
  generatedCode: string;
  expiresAt: number;
  simulatedDelayMs: number;
}

interface AuthContextValue {
  currentUser: UserAccount | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<UserAccount | null>>;
  otpStep: 'REQUEST' | 'VERIFY';
  setOtpStep: React.Dispatch<React.SetStateAction<'REQUEST' | 'VERIFY'>>;
  isSimulatingOtp: boolean;
  dispatchedOtp: DispatchedOtpChallenge | null;
  requestOtp: (params: {
    identifier: string;
    channel?: 'MOBILE' | 'EMAIL';
    name?: string;
    delayMs?: number;
  }) => Promise<{
    success: boolean;
    channel?: 'MOBILE' | 'EMAIL';
    identifier?: string;
    maskedDestination?: string;
    generatedCode?: string;
    error?: string;
  }>;
  verifyOtp: (params: {
    otpCode: string;
    name?: string;
    delayMs?: number;
  }) => Promise<{
    success: boolean;
    user?: UserAccount;
    notifications?: AppNotification[];
    error?: string;
  }>;
  loginWithPassword: (
    email: string,
    password: string
  ) => Promise<{
    success: boolean;
    user?: UserAccount;
    error?: string;
  }>;
  signOut: () => void;
  resetOtpFlow: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = 'one8_user_v2';

function detectChannel(rawIdentifier: string): 'MOBILE' | 'EMAIL' {
  const trimmed = rawIdentifier.trim();
  if (trimmed.includes('@')) return 'EMAIL';
  return 'MOBILE';
}

function maskIdentifier(channel: 'MOBILE' | 'EMAIL', value: string): string {
  if (channel === 'MOBILE') {
    const digits = value.replace(/\D/g, '').slice(-10);
    return `+91 ${digits.slice(0, 2)}••••${digits.slice(-4)}`;
  }
  const [localPart, domainPart] = value.split('@');
  if (!domainPart) return value;
  return `${localPart.slice(0, 2)}•••@${domainPart}`;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [otpStep, setOtpStep] = useState<'REQUEST' | 'VERIFY'>('REQUEST');
  const [isSimulatingOtp, setIsSimulatingOtp] = useState(false);
  const [dispatchedOtp, setDispatchedOtp] = useState<DispatchedOtpChallenge | null>(null);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // ignore storage errors
    }
  }, [currentUser]);

  const resetOtpFlow = () => {
    setOtpStep('REQUEST');
    setDispatchedOtp(null);
    setIsSimulatingOtp(false);
  };

  const requestOtp: AuthContextValue['requestOtp'] = async ({
    identifier,
    channel: explicitChannel,
    name,
    delayMs = 650,
  }) => {
    const trimmed = identifier.trim();
    if (!trimmed) {
      return { success: false, error: 'Please enter a valid 10-digit mobile number or email address.' };
    }

    const resolvedChannel = explicitChannel || detectChannel(trimmed);
    const normalizedIdentifier =
      resolvedChannel === 'MOBILE'
        ? trimmed.replace(/\D/g, '').slice(-10)
        : trimmed.toLowerCase();

    if (resolvedChannel === 'MOBILE' && !/^[6-9]\d{9}$/.test(normalizedIdentifier)) {
      return {
        success: false,
        error: 'Enter a valid 10-digit Indian mobile number starting with 6–9.',
      };
    }

    if (
      resolvedChannel === 'EMAIL' &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedIdentifier)
    ) {
      return {
        success: false,
        error: 'Enter a valid email address for OTP verification.',
      };
    }

    setIsSimulatingOtp(true);

    try {
      // Simulated OTP dispatch delay for realistic gateway UX
      await new Promise((resolve) => setTimeout(resolve, delayMs));

      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: resolvedChannel,
          identifier: normalizedIdentifier,
          name: name?.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          error: data.error || 'Could not dispatch OTP code.',
        };
      }

      const challenge: DispatchedOtpChallenge = {
        channel: resolvedChannel,
        identifier: normalizedIdentifier,
        maskedDestination:
          data.maskedDestination || maskIdentifier(resolvedChannel, normalizedIdentifier),
        generatedCode: String(data.demoOtpCode || '181818'),
        expiresAt: Date.now() + 5 * 60 * 1000,
        simulatedDelayMs: delayMs,
      };

      setDispatchedOtp(challenge);
      setOtpStep('VERIFY');

      return {
        success: true,
        channel: challenge.channel,
        identifier: challenge.identifier,
        maskedDestination: challenge.maskedDestination,
        generatedCode: challenge.generatedCode,
      };
    } catch {
      // Deterministic client-side simulation fallback if offline
      const fallbackCode = String(Math.floor(100000 + Math.random() * 900000));
      const masked = maskIdentifier(resolvedChannel, normalizedIdentifier);
      const challenge: DispatchedOtpChallenge = {
        channel: resolvedChannel,
        identifier: normalizedIdentifier,
        maskedDestination: masked,
        generatedCode: fallbackCode,
        expiresAt: Date.now() + 5 * 60 * 1000,
        simulatedDelayMs: delayMs,
      };
      setDispatchedOtp(challenge);
      setOtpStep('VERIFY');
      return {
        success: true,
        channel: challenge.channel,
        identifier: challenge.identifier,
        maskedDestination: masked,
        generatedCode: fallbackCode,
      };
    } finally {
      setIsSimulatingOtp(false);
    }
  };

  const verifyOtp: AuthContextValue['verifyOtp'] = async ({
    otpCode,
    name,
    delayMs = 500,
  }) => {
    if (!dispatchedOtp) {
      return { success: false, error: 'Please request an OTP first.' };
    }

    const cleanCode = otpCode.replace(/\D/g, '').trim();
    if (cleanCode.length !== 6) {
      return { success: false, error: 'Please enter a valid 6-digit OTP verification code.' };
    }

    setIsSimulatingOtp(true);

    try {
      // Simulated verification delay
      await new Promise((resolve) => setTimeout(resolve, delayMs));

      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: dispatchedOtp.channel,
          identifier: dispatchedOtp.identifier,
          otp: cleanCode,
          name: name?.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          error: data.error || 'Invalid or expired OTP code.',
        };
      }

      setCurrentUser(data.user);
      setOtpStep('REQUEST');
      setDispatchedOtp(null);

      return {
        success: true,
        user: data.user,
        notifications: data.state?.notifications,
      };
    } catch {
      if (cleanCode === dispatchedOtp.generatedCode || cleanCode === '181818') {
        const fallbackUser: UserAccount = {
          id: `usr-${Date.now()}`,
          fullName:
            name?.trim() ||
            (dispatchedOtp.channel === 'EMAIL'
              ? dispatchedOtp.identifier.split('@')[0]
              : `one8 Athlete (${dispatchedOtp.identifier.slice(-4)})`),
          email:
            dispatchedOtp.channel === 'EMAIL'
              ? dispatchedOtp.identifier
              : `athlete.${dispatchedOtp.identifier.slice(-4)}@one8club.in`,
          phone:
            dispatchedOtp.channel === 'MOBILE' ? dispatchedOtp.identifier : '9820145892',
          role: 'CUSTOMER',
          loyaltyTier: 'one8 Club Member',
          loyaltyPoints: 250,
          savedAddresses: [],
        };
        setCurrentUser(fallbackUser);
        setOtpStep('REQUEST');
        setDispatchedOtp(null);
        return { success: true, user: fallbackUser };
      }
      return { success: false, error: 'Invalid OTP verification code.' };
    } finally {
      setIsSimulatingOtp(false);
    }
  };

  const loginWithPassword: AuthContextValue['loginWithPassword'] = async (
    email,
    password
  ) => {
    setIsSimulatingOtp(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 400));
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Authentication failed.' };
      }
      setCurrentUser(data.user);
      return { success: true, user: data.user };
    } catch {
      return { success: false, error: 'Network error during authentication.' };
    } finally {
      setIsSimulatingOtp(false);
    }
  };

  const signOut = () => {
    setCurrentUser(null);
    resetOtpFlow();
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        otpStep,
        setOtpStep,
        isSimulatingOtp,
        dispatchedOtp,
        requestOtp,
        verifyOtp,
        loginWithPassword,
        signOut,
        resetOtpFlow,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
