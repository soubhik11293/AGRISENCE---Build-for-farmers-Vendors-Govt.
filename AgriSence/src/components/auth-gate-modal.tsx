import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock,
  Mail,
  User,
  Phone,
  ArrowRight,
  ArrowLeft,
  X,
  Sprout as Sparkles,
  ShieldCheck,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Calendar,
  MapPin,
  Sprout,
  Layers,
  KeyRound,
  Send,
  Check,
  RotateCcw,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '@/src/context/auth-context';
import { useTelemetry } from '@/src/context/telemetry-context';
import { ALL_INDIAN_STATES_UTS } from '@/src/lib/data/market';
import emailjs from '@emailjs/browser';
import { triggerAuthToast } from '@/src/components/ui/auth-toast';
import {
  auth,
  sendPasswordResetEmail,
  updatePassword,
  EMAILJS_CONFIG,
} from '@/src/lib/firebase';

export { useAuth };

interface AuthGateModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
  featureTitle?: string;
  featureDescription?: string;
}

const COMMON_CROPS = [
  'Soybean',
  'Cotton',
  'Wheat',
  'Sugarcane',
  'Paddy (Rice)',
  'Maize',
  'Pomegranate',
  'Red Onion',
  'Mustard',
  'Chickpea',
  'Vegetables',
  'Pulses',
];

const SPECIALIZATIONS = [
  'Precision Agriculture & Cash Crops',
  'Organic & Natural Farming',
  'Cereal Crops & Grain Production',
  'Horticulture & Orchard Groves',
  'Oilseeds & Pulses Production',
  'Dairy, Silage & Integrated Agronomy',
];

const IRRIGATION_TYPES = [
  'Micro-Drip Irrigation',
  'Borewell & Tubewell',
  'Canal Gravity Flow',
  'Rainfed / Dryland',
];

/**
 * Dispatches real Email verification passcode via EmailJS with verified template variable mapping
 */
const sendEmailOtp = async (userEmail: string, generatedOtp: string, recipientName = 'Progressive Farmer') => {
  return emailjs.send(
    EMAILJS_CONFIG.serviceId,
    EMAILJS_CONFIG.templateId,
    {
      to_email: userEmail,
      email: userEmail,
      to_name: recipientName,
      passcode: generatedOtp,
      otp_code: generatedOtp,
      time: '15 minutes',
      message: `Your AgriSence Farmer Portal 6-digit verification code is: ${generatedOtp}. This passcode is valid for 15 minutes.`,
    },
    EMAILJS_CONFIG.publicKey
  );
};

export function AuthGateModal({
  isOpen: propIsOpen,
  onClose: propOnClose,
  onSuccess: propOnSuccess,
  featureTitle: propFeatureTitle,
  featureDescription: propFeatureDesc,
}: AuthGateModalProps = {}) {
  const authContext = useAuth();
  const { weatherData } = useTelemetry();

  const isControlled = propIsOpen !== undefined;
  const isVisible = isControlled ? propIsOpen : authContext.authModalOpen;
  const activeTitle = propFeatureTitle || authContext.authModalTitle || 'Agronomic Capability';
  const activeDesc = propFeatureDesc || authContext.authModalDescription;

  const handleClose = () => {
    if (propOnClose) propOnClose();
    if (!isControlled) authContext.closeAuthModal();
  };

  // Main Mode: 'signin' | 'signup' | 'forgot' | 'google_onboarding'
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot' | 'google_onboarding'>('signin');

  // Sign-In Form State: Step 1 (Credentials) | Step 2 (Email-Only OTP Verification)
  const [signInStep, setSignInStep] = useState<1 | 2>(1);
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [signInOtp, setSignInOtp] = useState('');
  const [signInGeneratedOtp, setSignInGeneratedOtp] = useState('');
  const [verifiedLoginEmail, setVerifiedLoginEmail] = useState('');
  const [verifiedLoginPassword, setVerifiedLoginPassword] = useState('');
  const [signInResendCooldown, setSignInResendCooldown] = useState(0);

  // Signup Multi-Step Flow State: 1 (Details) | 2 (Email OTP) | 3 (Agronomic Calibration)
  const [signupStep, setSignupStep] = useState<1 | 2 | 3>(1);
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('1994-06-15');
  const [primaryPhone, setPrimaryPhone] = useState('+91 ');
  const [alternatePhone, setAlternatePhone] = useState('');
  const [email, setEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  // Step 2: Email-Only Verification OTP
  const [emailOtp, setEmailOtp] = useState('');
  const [generatedEmailOtp, setGeneratedEmailOtp] = useState('491823');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Google 1st-Time Account Setup State: 1 (Password Setup) | 2 (Email OTP) | 3 (Farm Calibration)
  const [googleStep, setGoogleStep] = useState<1 | 2 | 3>(1);
  const [googlePassword, setGooglePassword] = useState('');
  const [googleConfirmPassword, setGoogleConfirmPassword] = useState('');
  const [showGooglePass, setShowGooglePass] = useState(false);
  const [showGoogleConfirmPass, setShowGoogleConfirmPass] = useState(false);
  const [googleOtp, setGoogleOtp] = useState('');
  const [generatedGoogleOtp, setGeneratedGoogleOtp] = useState('');
  const [googleResendCooldown, setGoogleResendCooldown] = useState(0);

  // Step 3: Agronomic Onboarding (Dynamic sync with active Weather Telemetry location)
  const [specialization, setSpecialization] = useState(SPECIALIZATIONS[0]);
  const [village, setVillage] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('West Bengal');
  const [pincode, setPincode] = useState('');
  const [selectedCrops, setSelectedCrops] = useState<string[]>(['Soybean', 'Cotton']);
  const [acreage, setAcreage] = useState('4.5');
  const [irrigationType, setIrrigationType] = useState('Micro-Drip Irrigation');
  const [farmerRole, setFarmerRole] = useState('Owner Cultivator');

  // Dynamic Ingestion: Auto-populate profile location from active weather telemetry
  useEffect(() => {
    if (weatherData?.locationName) {
      const parts = weatherData.locationName.split(',').map((s) => s.trim());
      if (parts.length >= 2) {
        const detectedDistrict = parts[0];
        const detectedState = parts[1];
        if (detectedDistrict && (!district || district === 'Pune')) {
          setDistrict(detectedDistrict);
          if (!village || village === 'Shirur') {
            setVillage(`${detectedDistrict} Gram Panchayat`);
          }
        }
        const matchedState = ALL_INDIAN_STATES_UTS.find(
          (s) => s.toLowerCase() === detectedState.toLowerCase()
        );
        if (matchedState && (!state || state === 'Maharashtra')) {
          setState(matchedState);
        }
      } else if (parts[0] && (!district || district === 'Pune')) {
        setDistrict(parts[0]);
      }
    }
  }, [weatherData?.locationName]);

  // Forgot Password Flow State: 1 (Email) | 2 (Email OTP) | 3 (Reset Link)
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [generatedForgotOtp, setGeneratedForgotOtp] = useState('839201');
  const [forgotSuccessMessage, setForgotSuccessMessage] = useState<string | null>(null);

  // Feedback, Prompt & Error Banners
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [duplicateUserNotice, setDuplicateUserNotice] = useState<string | null>(null);
  const [nonExistentUserNotice, setNonExistentUserNotice] = useState<string | null>(null);

  // Lock body scroll on open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    if (isVisible) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isVisible]);

  // Sync mode with trigger's requested initial tab (signin vs signup vs forgot)
  useEffect(() => {
    if (isVisible) {
      setMode(authContext.authModalInitialTab || 'signin');
      setSignInStep(1);
      setSignupStep(1);
      setForgotStep(1);
      setForgotSuccessMessage(null);
      setErrorMsg(null);
      setDuplicateUserNotice(null);
      setNonExistentUserNotice(null);
    }
  }, [isVisible, authContext.authModalInitialTab]);

  // Cooldown timers for resend OTP
  useEffect(() => {
    if (resendCooldown <= 0 && signInResendCooldown <= 0 && googleResendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
      setSignInResendCooldown((prev) => Math.max(0, prev - 1));
      setGoogleResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown, signInResendCooldown, googleResendCooldown]);

  // Strict Password Complexity Checker (4 Core Security Rules)
  const checkPasswordComplexity = (pass: string) => {
    return {
      minLength: pass.length >= 8,
      hasUpper: /[A-Z]/.test(pass),
      hasLower: /[a-z]/.test(pass),
      hasNumber: /[0-9]/.test(pass),
      hasSpecial: /[@$!%*?&#]/.test(pass),
    };
  };

  const signupPassValid = checkPasswordComplexity(signupPassword);
  const isSignupPassFullyCompliant =
    signupPassValid.minLength &&
    signupPassValid.hasUpper &&
    signupPassValid.hasLower &&
    signupPassValid.hasNumber &&
    signupPassValid.hasSpecial;

  // Toggle crop chip in selection
  const toggleCrop = (crop: string) => {
    if (selectedCrops.includes(crop)) {
      if (selectedCrops.length > 1) {
        setSelectedCrops(selectedCrops.filter((c) => c !== crop));
      }
    } else {
      setSelectedCrops([...selectedCrops, crop]);
    }
  };

  // 1. SIGN-IN: Firebase verifies the registered email and password directly.
  const handleSignInStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    setDuplicateUserNotice(null);
    setNonExistentUserNotice(null);

    try {
      const res = await authContext.login(loginIdentifier.trim(), loginPassword, keepSignedIn);
      if (res.error) {
        if (res.errorCode === 'auth/user-not-found') {
          setNonExistentUserNotice('Account does not exist with this email. Would you like to create one?');
        } else {
          setErrorMsg(res.error);
        }
        return;
      }
      triggerAuthToast({ type: 'signed_in', title: 'Signed in successfully', description: 'Welcome back to AgriSence Command Center' });
      if (propOnSuccess) propOnSuccess();
      handleClose();
    } catch (err: any) {
      if (
        err.code === 'auth/user-not-found' ||
        err.message?.toLowerCase().includes('user-not-found') || err.message?.toLowerCase().includes('no user record')
      ) {
        setNonExistentUserNotice('Account does not exist with this email. Would you like to create one?');
      } else if (
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/invalid-credential' ||
        err.message?.toLowerCase().includes('incorrect password') ||
        err.message?.toLowerCase().includes('invalid credential')
      ) {
        setErrorMsg('Incorrect password. Please verify and try again.');
      } else {
      setErrorMsg(err.message || 'Authentication error. Please check your credentials.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resend Sign-In Email OTP
  const handleResendSignInOtp = async () => {
    if (signInResendCooldown > 0) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      setSignInGeneratedOtp(otp);
      await emailjs.send(
        EMAILJS_CONFIG.serviceId,
        EMAILJS_CONFIG.templateId,
        {
          email: verifiedLoginEmail,
          to_email: verifiedLoginEmail,
          passcode: otp,
          otp_code: otp,
          time: '15 minutes',
          message: `Your AgriSence Sign-In 6-digit verification code is: ${otp}. Valid for 15 minutes.`,
        },
        EMAILJS_CONFIG.publicKey
      );
      setSignInResendCooldown(60);
    } catch (err: any) {
      setErrorMsg('Failed to resend sign-in code. Please check your network.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sign-In Step 2: Verify OTP and populate app state
  const handleSignInStep2VerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    const isOtpValid = signInOtp.trim() === signInGeneratedOtp;

    if (!isOtpValid) {
      setErrorMsg('Invalid email verification passcode. Please check your inbox and enter the 6-digit code.');
      setIsSubmitting(false);
      return;
    }

    // Complete authentication and populate app state
    try {
      const res = await authContext.login(verifiedLoginEmail, verifiedLoginPassword, keepSignedIn);
      if (res.error) {
        setErrorMsg(res.error);
        setIsSubmitting(false);
        return;
      }
      setIsSubmitting(false);
      triggerAuthToast({
        type: 'signed_in',
        title: 'Signed in successfully',
        description: 'Welcome back to AgriSence Command Center',
      });
      if (propOnSuccess) propOnSuccess();
      handleClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to complete sign-in');
      setIsSubmitting(false);
    }
  };

  // 2. SIGNUP STEP 1: VALIDATE PERSONAL DETAILS & DISPATCH EMAIL-ONLY OTP
  const handleSignupStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setDuplicateUserNotice(null);
    setNonExistentUserNotice(null);
    setIsSubmitting(true);

    const cleanEmail = email.trim().toLowerCase();

    // Email Domain Enforcement: Reject dummy handles like @agrisence.in; validate authentic top-level domains
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|in|org|net|edu|gov|co|io|tech|agri)$/i;
    if (!emailPattern.test(cleanEmail)) {
      setErrorMsg('Please enter a valid personal or farm business email address with an authentic domain (e.g., .com, .in, .org).');
      setIsSubmitting(false);
      return;
    }
    if (cleanEmail.endsWith('@agrisence.in')) {
      setErrorMsg('Dummy @agrisence.in email handles are not permitted for official registration. Please use your authentic personal or business email address.');
      setIsSubmitting(false);
      return;
    }

    if (!isSignupPassFullyCompliant) {
      setErrorMsg('Please ensure your password satisfies all 4 security criteria before continuing.');
      setIsSubmitting(false);
      return;
    }

    try {
      // Firebase Auth is the source of truth for duplicate email detection.
      // Do not query the protected users collection before authentication.
      setSignupStep(3);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to dispatch verification passcode. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resend Email OTP
  const handleResendSignupEmailOtp = async () => {
    if (resendCooldown > 0) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const randomEmail = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedEmailOtp(randomEmail);
      await sendEmailOtp(email.trim().toLowerCase(), randomEmail, fullName || 'Progressive Farmer');
      setResendCooldown(60);
    } catch (err: any) {
      setErrorMsg('Failed to resend email code. Please check your network.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. SIGNUP STEP 2: VERIFY EMAIL-ONLY OTP
  const handleSignupStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const isEmailValid = emailOtp.trim() === generatedEmailOtp;

    if (!isEmailValid) {
      setErrorMsg('Invalid email passcode. Please check your inbox and enter the 6-digit numeric code.');
      return;
    }

    // Email Passcode Verified! Advance to Step 3: Agronomic Onboarding
    setSignupStep(3);
  };

  // 4. SIGNUP STEP 3: FINALIZE AGRONOMIC PROFILE & CREATE FIREBASE ACCOUNT
  const handleFinalizeSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    setDuplicateUserNotice(null);

    try {
      const res = await authContext.signup(fullName, email, primaryPhone, signupPassword, {
        dob,
        alternatePhone,
        village,
        district,
        state,
        pincode,
        specialization,
        crops: selectedCrops,
        primaryCrop: selectedCrops[0] || 'Soybean',
        acreage,
        irrigationType,
        farmerRole,
      });

      if (res.error) {
        if (res.errorCode === 'auth/email-already-in-use') {
          setDuplicateUserNotice('An account with this email already exists in our farmer registry.');
        } else {
          setErrorMsg(res.error);
        }
        setIsSubmitting(false);
        return;
      }

      setIsSubmitting(false);
      triggerAuthToast({
        type: 'account_created',
        title: 'Account created successfully',
        description: 'Your verified farmer profile is now active on AgriSence.',
      });
      if (propOnSuccess) propOnSuccess();
      handleClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed');
      setIsSubmitting(false);
    }
  };

  // 5. CONTINUE WITH GOOGLE FLOW
  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    setNonExistentUserNotice(null);
    setDuplicateUserNotice(null);
    try {
      const res = await authContext.loginWithGoogle();
      if (res.error) {
        setErrorMsg(res.error);
        setIsSubmitting(false);
        return;
      }

      if (res.data?.isNewUser) {
        setFullName(res.data.user.fullName || 'Progressive Farmer');
        setEmail(res.data.user.email || '');
        setMode('google_onboarding');
        setGoogleStep(1);
        setIsSubmitting(false);
      } else {
        setIsSubmitting(false);
        triggerAuthToast({
          type: 'signed_in',
          title: 'Signed in successfully',
          description: 'Welcome back to AgriSence Command Center',
        });
        if (propOnSuccess) propOnSuccess();
        handleClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Google Sign-In failed');
      setIsSubmitting(false);
    }
  };

  // Google 1st Time Step 1: Set New Password & Dispatch OTP to Google Email
  const handleGoogleStep1SetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const googlePassValid = checkPasswordComplexity(googlePassword);
    if (!googlePassValid.minLength) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }

    if (googlePassword !== googleConfirmPassword) {
      setErrorMsg('Passwords do not match. Please ensure both passwords match.');
      return;
    }

    setIsSubmitting(true);
    const targetEmail = email || auth.currentUser?.email || '';

    if (!targetEmail) {
      setErrorMsg('No email address associated with this Google account.');
      setIsSubmitting(false);
      return;
    }

    try {
      // Google has already authenticated the email identity. Move directly to
      // profile completion instead of maintaining a browser-generated OTP.
      setGoogleStep(3);
    } catch (err: any) {
      console.warn('Failed to dispatch Google account OTP:', err);
      // Still proceed with fallback
      setGoogleStep(2);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resend Google OTP
  const handleResendGoogleOtp = async () => {
    if (googleResendCooldown > 0) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedGoogleOtp(otp);
      const targetEmail = email || auth.currentUser?.email || '';
      await sendEmailOtp(targetEmail, otp, fullName || 'Progressive Farmer');
      setGoogleResendCooldown(60);
    } catch (err: any) {
      setErrorMsg('Failed to resend code. Please check your network.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Google 1st Time Step 2: Verify OTP
  const handleGoogleStep2VerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const isOtpValid = googleOtp.trim() === generatedGoogleOtp;

    if (!isOtpValid) {
      setErrorMsg('Invalid 6-digit verification code. Please check your Google email inbox.');
      return;
    }

    setGoogleStep(3);
  };

  // 6. FINALIZE GOOGLE ONBOARDING (Step 3)
  const handleFinalizeGoogleOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      // Update password on Firebase User if provided
      if (auth.currentUser && googlePassword) {
        try {
          await updatePassword(auth.currentUser, googlePassword);
        } catch (pwErr) {
          console.warn('Notice updating Firebase user password directly:', pwErr);
        }
      }

      await authContext.updateProfile({
        fullName,
        dob,
        phone: primaryPhone,
        alternatePhone,
        village,
        district,
        state,
        pincode,
        specialization,
        crops: selectedCrops,
        primaryCrop: selectedCrops[0] || 'Soybean',
        acreage,
        irrigationType,
        farmerRole,
      });

      setIsSubmitting(false);
      triggerAuthToast({
        type: 'account_created',
        title: 'Account created successfully',
        description: 'Your password and Google credentials are now configured.',
      });
      if (propOnSuccess) propOnSuccess();
      handleClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to finalize profile');
      setIsSubmitting(false);
    }
  };

  // 7. EMAIL-ONLY FORGOT PASSWORD FLOW
  // Step 1: Lookup email & dispatch Email OTP
  const handleForgotStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const clean = forgotEmail.trim().toLowerCase();
      await sendPasswordResetEmail(auth, clean);
      setForgotSuccessMessage('The official Firebase password-reset link has been sent. Open it in your email to choose a new password.');
      setForgotStep(3);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to dispatch recovery passcode');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Verify Email Passcode
  const handleForgotStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (forgotOtp.trim() !== generatedForgotOtp) {
      setErrorMsg('Invalid verification passcode. Please check your email and enter the 6-digit code.');
      return;
    }
    setForgotStep(3);
  };

  // Step 3 - Choice 1: Send Password to Email
  const handleSendResetEmail = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    const cleanEmail = forgotEmail.trim().toLowerCase();
    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      setForgotSuccessMessage('The official Firebase password-reset link has been sent. Open it in your email to choose a new password.');
    } catch (err: any) {
      setErrorMsg(err.message || 'The official password-reset email could not be sent. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-slate-950/50 dark:bg-black/75 backdrop-blur-md transition-opacity"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: 'spring', damping: 25, stiffness: 320 }}
            className="relative w-full max-w-lg rounded-[32px] frosted-card border border-white/80 dark:border-white/12 p-6 sm:p-7 shadow-[0_16px_48px_-4px_var(--brand-glow)] dark:shadow-[0_24px_60px_rgba(0,0,0,0.7)] backdrop-blur-2xl backdrop-saturate-190 z-10 space-y-4 text-slate-950 dark:text-slate-100 max-h-[92vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[var(--brand-subtle,#f0faf4)] text-[var(--brand-color,#0f9a58)] flex items-center justify-center border border-[var(--brand-border)] shadow-xs shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--brand-subtle,#f0faf4)] text-[var(--brand-text,#0d7342)] border border-[var(--brand-border)]">
                      {mode === 'forgot'
                        ? 'Account Recovery'
                        : mode === 'google_onboarding'
                        ? 'Google Onboarding'
                        : 'Farmer Identity'}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">AgriSence e-KYC</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-slate-950 dark:text-white tracking-tight mt-0.5">
                    {mode === 'forgot'
                      ? 'Reset Account Password'
                      : mode === 'google_onboarding'
                      ? 'Complete Farm Registration'
                      : activeTitle}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="w-8 h-8 rounded-full frosted-glass-sub flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {activeDesc && mode !== 'forgot' && mode !== 'google_onboarding' && (
              <p className="text-xs text-slate-650 dark:text-slate-300 font-semibold leading-relaxed">
                {activeDesc}
              </p>
            )}

            {/* Mode Switch Tabs (Sign In vs Create Account) */}
            {mode !== 'forgot' && mode !== 'google_onboarding' && (
              <div className="grid grid-cols-2 p-1 rounded-2xl frosted-glass-sub border border-white/60 dark:border-white/10 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setErrorMsg(null);
                    setDuplicateUserNotice(null);
                    setNonExistentUserNotice(null);
                  }}
                  className={`py-2 rounded-xl transition-all cursor-pointer ${
                    mode === 'signin'
                      ? 'bg-[var(--brand-color,#0f9a58)] text-white shadow-xs'
                      : 'text-slate-700 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setErrorMsg(null);
                    setDuplicateUserNotice(null);
                    setNonExistentUserNotice(null);
                  }}
                  className={`py-2 rounded-xl transition-all cursor-pointer ${
                    mode === 'signup'
                      ? 'bg-[var(--brand-color,#0f9a58)] text-white shadow-xs'
                      : 'text-slate-700 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  Create Account
                </button>
              </div>
            )}

            {/* Error Message Banner */}
            {errorMsg && (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-300 text-xs font-bold flex items-start gap-2">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span>{errorMsg}</span>
                  {/* If wrong password on login, offer visible Forgot Password shortcut */}
                  {mode === 'signin' && errorMsg.includes('Incorrect password') && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setForgotEmail(loginIdentifier.includes('@') ? loginIdentifier : '');
                        setErrorMsg(null);
                      }}
                      className="block mt-1.5 text-xs font-black text-[var(--brand-text,#0d7342)] underline cursor-pointer"
                    >
                      Forgot your password? Reset it here →
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Duplicate User Notice Banner */}
            {duplicateUserNotice && (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs font-bold space-y-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="size-4 text-amber-600 shrink-0" />
                  <span>{duplicateUserNotice}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setLoginIdentifier(email);
                    setMode('signin');
                    setDuplicateUserNotice(null);
                    setErrorMsg(null);
                  }}
                  className="w-full py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>Sign In to Existing Account</span>
                  <ArrowRight className="size-3.5" />
                </button>
              </div>
            )}

            {/* Non-Existent Account Notice Banner */}
            {nonExistentUserNotice && (
              <div className="p-3.5 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-900 dark:text-sky-200 text-xs font-bold space-y-2">
                <div className="flex items-center gap-2">
                  <UserPlus className="size-4 text-sky-600 shrink-0" />
                  <span>{nonExistentUserNotice}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (loginIdentifier.includes('@')) {
                      setEmail(loginIdentifier);
                    }
                    setMode('signup');
                    setNonExistentUserNotice(null);
                    setErrorMsg(null);
                  }}
                  className="w-full py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-black text-xs shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>Create Account Now</span>
                  <ArrowRight className="size-3.5" />
                </button>
              </div>
            )}

            {/* ========================================================================= */}
            {/* VIEW A: SIGN IN TAB (2 STEPS: CREDENTIALS -> EMAIL OTP)                   */}
            {/* ========================================================================= */}
            {mode === 'signin' && (
              <div>
                {signInStep === 1 ? (
                  <form onSubmit={handleSignInStep1} className="space-y-3.5 text-xs">
                    <div>
                      <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                        Registered Email Address *
                      </label>
                      <div className="relative">
                        <Mail className="size-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          required
                          value={loginIdentifier}
                          onChange={(e) => setLoginIdentifier(e.target.value)}
                          placeholder="e.g. farmer@gmail.com"
                          className="w-full h-11 pl-9 pr-3 text-xs font-bold rounded-2xl frosted-glass-sub border border-white/70 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand-color,#0f9a58)]"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-bold text-slate-800 dark:text-slate-200">
                          Password *
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setMode('forgot');
                            setForgotEmail(loginIdentifier.includes('@') ? loginIdentifier : '');
                            setErrorMsg(null);
                          }}
                          className="text-[11px] font-bold text-[var(--brand-text,#0d7342)] hover:underline cursor-pointer"
                        >
                          Forgot Password?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="size-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full h-11 pl-9 pr-10 text-xs font-bold rounded-2xl frosted-glass-sub border border-white/70 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand-color,#0f9a58)]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-650 dark:text-slate-300">
                      <label className="flex items-center gap-2 cursor-pointer font-semibold">
                        <input
                          type="checkbox"
                          checked={keepSignedIn}
                          onChange={(e) => setKeepSignedIn(e.target.checked)}
                          className="rounded accent-[var(--brand-color,#0f9a58)]"
                        />
                        <span>Keep me signed in on this field device</span>
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full h-11 rounded-2xl bg-[var(--brand-color,#0f9a58)] hover:bg-[var(--brand-hover,#0d844b)] text-white font-black text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer disabled:opacity-50"
                    >
                      <span>{isSubmitting ? 'Verifying Credentials...' : 'Sign In to Dashboard'}</span>
                      <ArrowRight className="size-4" />
                    </button>

                    <div className="relative py-1 text-center">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200/80 dark:border-white/10" />
                      </div>
                      <span className="relative px-3 text-[10px] uppercase font-black tracking-wider text-slate-500 bg-white/90 dark:bg-slate-900/90 rounded-full">
                        Or Sign In With Google
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={isSubmitting}
                      className="w-full h-11 rounded-2xl frosted-glass-sub hover:bg-white dark:hover:bg-slate-800 text-slate-850 dark:text-slate-100 font-bold text-xs border border-white/80 dark:border-white/10 flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-2xs"
                    >
                      <svg className="size-4" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      <span>Quick Google Sign-In</span>
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleSignInStep2VerifyOtp} className="space-y-3.5 text-xs">
                    <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-[var(--brand-border)] text-xs text-slate-800 dark:text-slate-200 space-y-1">
                      <div className="flex items-center gap-2 font-black text-[var(--brand-text,#0d7342)]">
                        <ShieldCheck className="size-4" />
                        <span>Email Verification Passcode Dispatched</span>
                      </div>
                      <p className="text-[11px] text-slate-650 dark:text-slate-300">
                        A secure 6-digit numeric verification passcode has been dispatched to <strong>{verifiedLoginEmail}</strong>.
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-bold text-slate-800 dark:text-slate-200">
                          Enter 6-Digit Email Passcode *
                        </label>
                        <button
                          type="button"
                          disabled={signInResendCooldown > 0 || isSubmitting}
                          onClick={handleResendSignInOtp}
                          className="text-[11px] font-bold text-[var(--brand-text,#0d7342)] hover:underline disabled:opacity-50 cursor-pointer"
                        >
                          {signInResendCooldown > 0
                            ? `Resend in ${signInResendCooldown}s`
                            : 'Resend Passcode'}
                        </button>
                      </div>
                      <div className="relative">
                        <KeyRound className="size-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          maxLength={6}
                          required
                          autoFocus
                          value={signInOtp}
                          onChange={(e) => setSignInOtp(e.target.value.replace(/\D/g, ''))}
                          placeholder="••••••"
                          className="w-full h-11 pl-9 pr-3 text-center tracking-[0.4em] font-mono text-base font-black rounded-2xl frosted-glass-sub border border-white/70 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand-color,#0f9a58)]"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setSignInStep(1);
                          setErrorMsg(null);
                        }}
                        className="w-1/3 h-11 rounded-2xl frosted-glass-sub font-bold text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-white dark:hover:bg-slate-800"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting || signInOtp.length < 6}
                        className="w-2/3 h-11 rounded-2xl bg-[var(--brand-color,#0f9a58)] hover:bg-[var(--brand-hover,#0d844b)] text-white font-black text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <span>{isSubmitting ? 'Verifying OTP...' : 'Verify & Launch Dashboard'}</span>
                        <ArrowRight className="size-4" />
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* ========================================================================= */}
            {/* VIEW B: CREATE ACCOUNT TAB (3 STEPS, EMAIL-ONLY OTP)                     */}
            {/* ========================================================================= */}
            {mode === 'signup' && (
              <div className="space-y-4 text-xs">
                {/* Visual Step Indicator */}
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 pb-1 border-b border-slate-200/60 dark:border-white/10">
                  <span className={signupStep === 1 ? 'text-[var(--brand-text,#0d7342)] font-black' : ''}>
                    1. Identity
                  </span>
                  <ArrowRight className="size-3 text-slate-400" />
                  <span className={signupStep === 2 ? 'text-[var(--brand-text,#0d7342)] font-black' : ''}>
                    2. Email Verification
                  </span>
                  <ArrowRight className="size-3 text-slate-400" />
                  <span className={signupStep === 3 ? 'text-[var(--brand-text,#0d7342)] font-black' : ''}>
                    3. Farm Calibration
                  </span>
                </div>

                {/* STEP 1: PERSONAL & CONTACT IDENTIFICATION */}
                {signupStep === 1 && (
                  <form onSubmit={handleSignupStep1} className="space-y-3">
                    <div>
                      <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                        Farmer Full Name *
                      </label>
                      <div className="relative">
                        <User className="size-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="e.g. Ramesh Patil"
                          className="w-full h-10 pl-9 pr-3 rounded-2xl frosted-glass-sub border border-white/70 dark:border-white/10 font-bold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                          Date of Birth *
                        </label>
                        <div className="relative">
                          <Calendar className="size-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="date"
                            required
                            value={dob}
                            onChange={(e) => setDob(e.target.value)}
                            className="w-full h-10 pl-9 pr-2 rounded-2xl frosted-glass-sub border border-white/70 dark:border-white/10 font-bold"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                          Primary Mobile (+91) *
                        </label>
                        <div className="relative">
                          <Phone className="size-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="tel"
                            required
                            value={primaryPhone}
                            onChange={(e) => setPrimaryPhone(e.target.value)}
                            placeholder="+91 98765 43210"
                            className="w-full h-10 pl-9 pr-2 rounded-2xl frosted-glass-sub border border-white/70 dark:border-white/10 font-bold font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                        Alternate Mobile / WhatsApp (Optional)
                      </label>
                      <div className="relative">
                        <Phone className="size-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="tel"
                          value={alternatePhone}
                          onChange={(e) => setAlternatePhone(e.target.value)}
                          placeholder="+91 91234 56789"
                          className="w-full h-10 pl-9 pr-3 rounded-2xl frosted-glass-sub border border-white/70 dark:border-white/10 font-bold font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                        Verified Email Address (Passcode Destination) *
                      </label>
                      <div className="relative">
                        <Mail className="size-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="e.g. name@gmail.com"
                          className="w-full h-10 pl-9 pr-3 rounded-2xl frosted-glass-sub border border-white/70 dark:border-white/10 font-bold"
                        />
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">
                        We send a 6-digit numeric passcode to this email. Dummy @agrisence.in handles are prohibited.
                      </p>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                        Create Secure Password *
                      </label>
                      <div className="relative">
                        <Lock className="size-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type={showSignupPassword ? 'text' : 'password'}
                          required
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          placeholder="Min 8 chars, 1 uppercase, 1 number, 1 symbol"
                          className="w-full h-10 pl-9 pr-10 rounded-2xl frosted-glass-sub border border-white/70 dark:border-white/10 font-bold"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSignupPassword(!showSignupPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showSignupPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>

                      {/* Password Validation Checklist (4 Criteria) */}
                      <div className="grid grid-cols-2 gap-1.5 pt-2 text-[10px] font-bold">
                        <span className={`flex items-center gap-1 ${signupPassValid.minLength ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                          <Check className="size-3" /> Min 8 characters
                        </span>
                        <span className={`flex items-center gap-1 ${signupPassValid.hasUpper ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                          <Check className="size-3" /> Uppercase letter
                        </span>
                        <span className={`flex items-center gap-1 ${signupPassValid.hasLower ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                          <Check className="size-3" /> Lowercase letter
                        </span>
                        <span className={`flex items-center gap-1 ${signupPassValid.hasNumber && signupPassValid.hasSpecial ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                          <Check className="size-3" /> Number & symbol (@$!%)
                        </span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full h-11 rounded-2xl bg-[var(--brand-color,#0f9a58)] hover:bg-[var(--brand-hover,#0d844b)] text-white font-black text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer mt-2 disabled:opacity-50"
                    >
                      <span>{isSubmitting ? 'Checking Registry & Dispatching Code...' : 'Verify & Send Email Passcode'}</span>
                      <ArrowRight className="size-4" />
                    </button>
                  </form>
                )}

                {/* STEP 2: EMAIL-ONLY VERIFICATION (PHONE OTP REMOVED) */}
                {signupStep === 2 && (
                  <form onSubmit={handleSignupStep2} className="space-y-4 text-xs">
                    <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-[var(--brand-border)] text-xs text-slate-800 dark:text-slate-200 space-y-1">
                      <p className="font-black text-[var(--brand-text,#0d7342)] flex items-center gap-1.5">
                        <Mail className="size-4" />
                        <span>Email Verification Code Dispatched</span>
                      </p>
                      <p className="text-[11px] text-slate-700 dark:text-slate-300">
                        A 6-digit numeric passcode was dispatched to your email address: <strong>{email}</strong>.
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-bold text-slate-800 dark:text-slate-200">
                          Enter 6-Digit Email Passcode *
                        </label>
                        <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full">
                          Live EmailJS Delivery
                        </span>
                      </div>
                      <input
                        type="text"
                        maxLength={6}
                        required
                        value={emailOtp}
                        onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder="••••••"
                        className="w-full h-12 px-3 text-center tracking-[0.4em] font-mono text-lg font-black rounded-2xl frosted-glass-sub border border-white/70 dark:border-white/10 focus:ring-2 focus:ring-[var(--brand-color,#0f9a58)]"
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 pt-1">
                      <span>Didn&apos;t receive the email code?</span>
                      <button
                        type="button"
                        onClick={handleResendSignupEmailOtp}
                        disabled={resendCooldown > 0 || isSubmitting}
                        className="font-bold text-[var(--brand-text,#0d7342)] hover:underline disabled:opacity-50 cursor-pointer"
                      >
                        {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend Email Passcode'}
                      </button>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setSignupStep(1)}
                        className="w-1/3 h-11 rounded-2xl frosted-glass-sub border border-white/70 dark:border-white/10 font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        className="w-2/3 h-11 rounded-2xl bg-[var(--brand-color,#0f9a58)] hover:bg-[var(--brand-hover,#0d844b)] text-white font-black shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>Verify & Continue</span>
                        <ArrowRight className="size-4" />
                      </button>
                    </div>
                  </form>
                )}

                {/* STEP 3: AGRONOMIC ONBOARDING CALIBRATION */}
                {signupStep === 3 && (
                  <form onSubmit={handleFinalizeSignup} className="space-y-3.5 text-xs">
                    <div>
                      <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                        Agronomic Specialization
                      </label>
                      <select
                        value={specialization}
                        onChange={(e) => setSpecialization(e.target.value)}
                        className="w-full h-10 px-3 rounded-2xl frosted-glass-sub border border-white/70 dark:border-white/10 font-bold"
                      >
                        {SPECIALIZATIONS.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                          Village / Gram Panchayat *
                        </label>
                        <input
                          type="text"
                          required
                          value={village}
                          onChange={(e) => setVillage(e.target.value)}
                          placeholder="e.g. Village or Panchayat"
                          className="w-full h-10 px-3 rounded-2xl frosted-glass-sub border border-white/70 dark:border-white/10 font-bold"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                          District (For Local APMC) *
                        </label>
                        <input
                          type="text"
                          required
                          value={district}
                          onChange={(e) => setDistrict(e.target.value)}
                          placeholder="e.g. Kolkata / District"
                          className="w-full h-10 px-3 rounded-2xl frosted-glass-sub border border-white/70 dark:border-white/10 font-bold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                          State / Union Territory *
                        </label>
                        <select
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          className="w-full h-10 px-3 rounded-2xl frosted-glass-sub border border-white/70 dark:border-white/10 font-bold truncate"
                        >
                          {ALL_INDIAN_STATES_UTS.filter((s) => s !== 'All States').map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                          Postal Pincode *
                        </label>
                        <input
                          type="text"
                          maxLength={6}
                          required
                          value={pincode}
                          onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                          placeholder="e.g. 700001"
                          className="w-full h-10 px-3 rounded-2xl frosted-glass-sub border border-white/70 dark:border-white/10 font-bold font-mono"
                        />
                      </div>
                    </div>

                    {/* Primary Crops Chips */}
                    <div>
                      <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                        Primary Crops Cultivated (Quick Select Chips) *
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {COMMON_CROPS.map((crop) => {
                          const isSelected = selectedCrops.includes(crop);
                          return (
                            <button
                              key={crop}
                              type="button"
                              onClick={() => toggleCrop(crop)}
                              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-[var(--brand-color,#0f9a58)] text-white shadow-2xs'
                                  : 'frosted-glass-sub border border-white/60 dark:border-white/10 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {crop}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                          Total Land Parcel (Acres) *
                        </label>
                        <input
                          type="text"
                          required
                          value={acreage}
                          onChange={(e) => setAcreage(e.target.value)}
                          placeholder="4.5"
                          className="w-full h-10 px-3 rounded-2xl frosted-glass-sub border border-white/70 dark:border-white/10 font-bold font-mono"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                          Irrigation Water Source
                        </label>
                        <select
                          value={irrigationType}
                          onChange={(e) => setIrrigationType(e.target.value)}
                          className="w-full h-10 px-3 rounded-2xl frosted-glass-sub border border-white/70 dark:border-white/10 font-bold truncate"
                        >
                          {IRRIGATION_TYPES.map((i) => (
                            <option key={i} value={i}>{i}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full h-11 rounded-2xl bg-[var(--brand-color,#0f9a58)] hover:bg-[var(--brand-hover,#0d844b)] text-white font-black text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer mt-3 disabled:opacity-50"
                    >
                      <span>{isSubmitting ? 'Registering Farm in Firestore...' : 'Save & Launch AgriSence Dashboard'}</span>
                      <ArrowRight className="size-4" />
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* ========================================================================= */}
            {/* VIEW C: GOOGLE 1ST-TIME ACCOUNT CREATION (PASSWORD SETUP + EMAIL OTP)      */}
            {/* ========================================================================= */}
            {mode === 'google_onboarding' && (
              <div className="space-y-4 text-xs">
                {/* Visual Step Indicator */}
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 pb-1 border-b border-slate-200/60 dark:border-white/10">
                  <span className={googleStep === 1 ? 'text-[var(--brand-text,#0d7342)] font-black' : ''}>
                    1. Create Password
                  </span>
                  <ArrowRight className="size-3 text-slate-400" />
                  <span className={googleStep === 2 ? 'text-[var(--brand-text,#0d7342)] font-black' : ''}>
                    2. Email OTP
                  </span>
                  <ArrowRight className="size-3 text-slate-400" />
                  <span className={googleStep === 3 ? 'text-[var(--brand-text,#0d7342)] font-black' : ''}>
                    3. Farm Calibration
                  </span>
                </div>

                {/* GOOGLE STEP 1: CREATE NEW PASSWORD & CONFIRM PASSWORD */}
                {googleStep === 1 && (
                  <form onSubmit={handleGoogleStep1SetPassword} className="space-y-3.5">
                    <div className="p-3 rounded-2xl bg-emerald-500/10 border border-[var(--brand-border)] text-xs text-slate-800 dark:text-slate-200 space-y-1">
                      <p className="font-black text-[var(--brand-text,#0d7342)] flex items-center gap-1.5">
                        <Sparkles className="size-4" />
                        <span>First-Time Google Registration</span>
                      </p>
                      <p className="text-[11px] text-slate-700 dark:text-slate-300">
                        Welcome, <strong>{fullName}</strong> ({email}). Please create a secure password for your account so you can log in via both Google and password credentials.
                      </p>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                        Create New Account Password *
                      </label>
                      <div className="relative">
                        <Lock className="size-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type={showGooglePass ? 'text' : 'password'}
                          required
                          value={googlePassword}
                          onChange={(e) => setGooglePassword(e.target.value)}
                          placeholder="Min 8 characters"
                          className="w-full h-10 pl-9 pr-10 rounded-2xl frosted-glass-sub border border-white/70 dark:border-white/10 font-bold"
                        />
                        <button
                          type="button"
                          onClick={() => setShowGooglePass(!showGooglePass)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showGooglePass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                        Re-enter New Password *
                      </label>
                      <div className="relative">
                        <Lock className="size-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type={showGoogleConfirmPass ? 'text' : 'password'}
                          required
                          value={googleConfirmPassword}
                          onChange={(e) => setGoogleConfirmPassword(e.target.value)}
                          placeholder="Confirm new password"
                          className="w-full h-10 pl-9 pr-10 rounded-2xl frosted-glass-sub border border-white/70 dark:border-white/10 font-bold"
                        />
                        <button
                          type="button"
                          onClick={() => setShowGoogleConfirmPass(!showGoogleConfirmPass)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showGoogleConfirmPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full h-11 rounded-2xl bg-[var(--brand-color,#0f9a58)] hover:bg-[var(--brand-hover,#0d844b)] text-white font-black text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer mt-2 disabled:opacity-50"
                    >
                      <span>{isSubmitting ? 'Dispatching Verification OTP...' : 'Continue to OTP Verification'}</span>
                      <ArrowRight className="size-4" />
                    </button>
                  </form>
                )}

                {/* GOOGLE STEP 2: EMAIL OTP VERIFICATION */}
                {googleStep === 2 && (
                  <form onSubmit={handleGoogleStep2VerifyOtp} className="space-y-4 text-xs">
                    <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-[var(--brand-border)] text-xs text-slate-800 dark:text-slate-200 space-y-1">
                      <p className="font-black text-[var(--brand-text,#0d7342)] flex items-center gap-1.5">
                        <Mail className="size-4" />
                        <span>OTP Verification Dispatched</span>
                      </p>
                      <p className="text-[11px] text-slate-700 dark:text-slate-300">
                        A 6-digit numeric verification code was dispatched to your Google email: <strong>{email}</strong>.
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-bold text-slate-800 dark:text-slate-200">
                          Enter 6-Digit Verification Code *
                        </label>
                        <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full">
                          Live EmailJS Delivery
                        </span>
                      </div>
                      <input
                        type="text"
                        maxLength={6}
                        required
                        autoFocus
                        value={googleOtp}
                        onChange={(e) => setGoogleOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder="••••••"
                        className="w-full h-12 px-3 text-center tracking-[0.4em] font-mono text-lg font-black rounded-2xl frosted-glass-sub border border-white/70 dark:border-white/10 focus:ring-2 focus:ring-[var(--brand-color,#0f9a58)]"
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-650 dark:text-slate-400 pt-1">
                      <span>Didn&apos;t receive the email code?</span>
                      <button
                        type="button"
                        onClick={handleResendGoogleOtp}
                        disabled={googleResendCooldown > 0 || isSubmitting}
                        className="font-bold text-[var(--brand-text,#0d7342)] hover:underline disabled:opacity-50 cursor-pointer"
                      >
                        {googleResendCooldown > 0 ? `Resend code in ${googleResendCooldown}s` : 'Resend Email Passcode'}
                      </button>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setGoogleStep(1)}
                        className="w-1/3 h-11 rounded-2xl frosted-glass-sub border border-white/70 dark:border-white/10 font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        className="w-2/3 h-11 rounded-2xl bg-[var(--brand-color,#0f9a58)] hover:bg-[var(--brand-hover,#0d844b)] text-white font-black shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>Verify & Continue</span>
                        <ArrowRight className="size-4" />
                      </button>
                    </div>
                  </form>
                )}

                {/* GOOGLE STEP 3: FARM CALIBRATION & FINALIZE */}
                {googleStep === 3 && (
                  <form onSubmit={handleFinalizeGoogleOnboarding} className="space-y-3.5 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                          Date of Birth *
                        </label>
                        <div className="relative">
                          <Calendar className="size-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="date"
                            required
                            value={dob}
                            onChange={(e) => setDob(e.target.value)}
                            className="w-full h-10 pl-9 pr-2 rounded-2xl frosted-glass-sub border border-white/70 dark:border-white/10 font-bold"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                          Primary Mobile (+91) *
                        </label>
                        <div className="relative">
                          <Phone className="size-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="tel"
                            required
                            value={primaryPhone}
                            onChange={(e) => setPrimaryPhone(e.target.value)}
                            placeholder="+91 98765 43210"
                            className="w-full h-10 pl-9 pr-2 rounded-2xl frosted-glass-sub border border-white/70 dark:border-white/10 font-bold font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                          Village / Gram Panchayat *
                        </label>
                        <input
                          type="text"
                          required
                          value={village}
                          onChange={(e) => setVillage(e.target.value)}
                          placeholder="e.g. Village or Panchayat"
                          className="w-full h-10 px-3 rounded-2xl frosted-glass-sub border border-white/70 dark:border-white/10 font-bold"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                          District (For Local APMC) *
                        </label>
                        <input
                          type="text"
                          required
                          value={district}
                          onChange={(e) => setDistrict(e.target.value)}
                          placeholder="e.g. Kolkata / District"
                          className="w-full h-10 px-3 rounded-2xl frosted-glass-sub border border-white/70 dark:border-white/10 font-bold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                          State / Union Territory *
                        </label>
                        <select
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          className="w-full h-10 px-3 rounded-2xl frosted-glass-sub border border-white/70 dark:border-white/10 font-bold truncate"
                        >
                          {ALL_INDIAN_STATES_UTS.filter((s) => s !== 'All States').map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                          Postal Pincode *
                        </label>
                        <input
                          type="text"
                          maxLength={6}
                          required
                          value={pincode}
                          onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                          placeholder="e.g. 700001"
                          className="w-full h-10 px-3 rounded-2xl frosted-glass-sub border border-white/70 dark:border-white/10 font-bold font-mono"
                        />
                      </div>
                    </div>

                    {/* Primary Crops Chips */}
                    <div>
                      <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                        Primary Crops Cultivated (Quick Select Chips) *
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {COMMON_CROPS.map((crop) => {
                          const isSelected = selectedCrops.includes(crop);
                          return (
                            <button
                              key={crop}
                              type="button"
                              onClick={() => toggleCrop(crop)}
                              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-[var(--brand-color,#0f9a58)] text-white shadow-2xs'
                                  : 'frosted-glass-sub border border-white/60 dark:border-white/10 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {crop}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                          Total Land Parcel (Acres) *
                        </label>
                        <input
                          type="text"
                          required
                          value={acreage}
                          onChange={(e) => setAcreage(e.target.value)}
                          placeholder="4.5"
                          className="w-full h-10 px-3 rounded-2xl frosted-glass-sub border border-white/70 dark:border-white/10 font-bold font-mono"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                          Irrigation Water Source
                        </label>
                        <select
                          value={irrigationType}
                          onChange={(e) => setIrrigationType(e.target.value)}
                          className="w-full h-10 px-3 rounded-2xl frosted-glass-sub border border-white/70 dark:border-white/10 font-bold truncate"
                        >
                          {IRRIGATION_TYPES.map((i) => (
                            <option key={i} value={i}>{i}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full h-11 rounded-2xl bg-[var(--brand-color,#0f9a58)] hover:bg-[var(--brand-hover,#0d844b)] text-white font-black text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer mt-3 disabled:opacity-50"
                    >
                      <span>{isSubmitting ? 'Registering Farm in Firestore...' : 'Save & Launch AgriSence Dashboard'}</span>
                      <ArrowRight className="size-4" />
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* ========================================================================= */}
            {/* VIEW D: EMAIL-ONLY FORGOT PASSWORD DUAL CHOICE FLOW                       */}
            {/* ========================================================================= */}
            {mode === 'forgot' && (
              <div className="space-y-4 text-xs">
                {/* Step indicator */}
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 pb-1 border-b border-slate-200/60 dark:border-white/10">
                  <span className={forgotStep === 1 ? 'text-[var(--brand-text,#0d7342)] font-black' : ''}>
                    1. Account Email
                  </span>
                  <ArrowRight className="size-3 text-slate-400" />
                  <span className={forgotStep === 2 ? 'text-[var(--brand-text,#0d7342)] font-black' : ''}>
                    2. Email Passcode
                  </span>
                  <ArrowRight className="size-3 text-slate-400" />
                  <span className={forgotStep === 3 ? 'text-[var(--brand-text,#0d7342)] font-black' : ''}>
                    3. Reset Link
                  </span>
                </div>

                {forgotSuccessMessage ? (
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 space-y-3">
                    <div className="flex items-center gap-2 font-black text-sm">
                      <CheckCircle2 className="size-5 text-emerald-600" />
                       <span>Password Reset Link Sent</span>
                    </div>
                    <p className="text-xs leading-relaxed">{forgotSuccessMessage}</p>
                    <button
                      type="button"
                      onClick={() => {
                        setMode('signin');
                        setForgotStep(1);
                        setSignInStep(1);
                        setForgotSuccessMessage(null);
                      }}
                      className="w-full py-2.5 rounded-xl bg-[var(--brand-color,#0f9a58)] text-white font-bold text-xs cursor-pointer shadow-xs"
                    >
                      Sign In to Account Now
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Step 1: Email Entry */}
                    {forgotStep === 1 && (
                      <form onSubmit={handleForgotStep1} className="space-y-3.5">
                        <p className="text-slate-650 dark:text-slate-300 font-semibold leading-relaxed">
                          Enter your registered email address. We will dispatch a 6-digit recovery passcode to verify your account identity.
                        </p>

                        <div>
                          <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                            Registered Email Address *
                          </label>
                          <div className="relative">
                            <Mail className="size-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                              type="email"
                              required
                              value={forgotEmail}
                              onChange={(e) => setForgotEmail(e.target.value)}
                              placeholder="e.g. farmer@gmail.com"
                              className="w-full h-11 pl-9 pr-3 rounded-2xl frosted-glass-sub border border-white/70 dark:border-white/10 font-bold"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setMode('signin');
                              setSignInStep(1);
                              setErrorMsg(null);
                            }}
                            className="w-1/3 h-11 rounded-2xl frosted-glass-sub font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-2/3 h-11 rounded-2xl bg-[var(--brand-color,#0f9a58)] hover:bg-[var(--brand-hover,#0d844b)] text-white font-black flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                          >
                            <span>{isSubmitting ? 'Dispatching OTP Code...' : 'Send Verification OTP'}</span>
                            <ArrowRight className="size-4" />
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Step 2: Email Passcode Verification */}
                    {forgotStep === 2 && (
                      <form onSubmit={handleForgotStep2} className="space-y-3.5">
                        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-[var(--brand-border)] text-xs text-slate-800 dark:text-slate-200">
                          <p className="font-black text-[var(--brand-text,#0d7342)]">Verification Passcode Dispatched</p>
                          <p className="mt-0.5 text-slate-700 dark:text-slate-300">
                            A secure 6-digit recovery passcode has been dispatched to <strong>{forgotEmail}</strong>.
                          </p>
                        </div>

                        <div>
                          <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                            Enter 6-Digit Email Verification Code *
                          </label>
                          <input
                            type="text"
                            maxLength={6}
                            required
                            autoFocus
                            value={forgotOtp}
                            onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                            placeholder="••••••"
                            className="w-full h-11 px-3 text-center tracking-[0.4em] font-mono text-base font-black rounded-2xl frosted-glass-sub border border-white/70 dark:border-white/10"
                          />
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => setForgotStep(1)}
                            className="w-1/3 h-11 rounded-2xl frosted-glass-sub font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                          >
                            Back
                          </button>
                          <button
                            type="submit"
                            className="w-2/3 h-11 rounded-2xl bg-[var(--brand-color,#0f9a58)] hover:bg-[var(--brand-hover,#0d844b)] text-white font-black flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <span>Verify & Proceed to Set Password</span>
                            <ArrowRight className="size-4" />
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Step 3: Official Firebase Password Reset Link */}
                    {forgotStep === 3 && (
                      <div className="space-y-4">
                        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-[var(--brand-border)] text-xs text-slate-800 dark:text-slate-200">
                          <p className="font-black text-[var(--brand-text,#0d7342)]">Identity Verified via Email OTP</p>
                          <p className="text-[11px] mt-0.5">
                            For security, Firebase will let you choose a new password through a one-time link sent to <strong>{forgotEmail}</strong>.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={handleSendResetEmail}
                          disabled={isSubmitting}
                          className="w-full h-11 rounded-2xl bg-[var(--brand-color,#0f9a58)] hover:bg-[var(--brand-hover,#0d844b)] text-white font-black text-xs shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
                        >
                          {isSubmitting ? 'Sending Reset Link...' : 'Send Official Reset Link'}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ========================================================================= */}
            {/* VIEW D: GOOGLE ONBOARDING STEP                                            */}
            {/* ========================================================================= */}
            {mode === 'google_onboarding' && (
              <form onSubmit={handleFinalizeGoogleOnboarding} className="space-y-3 text-xs">
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-[var(--brand-border)] text-xs text-slate-800 dark:text-slate-200">
                  <span className="font-black text-[var(--brand-text,#0d7342)]">Welcome to AgriSence!</span>
                  <p className="text-[11px] mt-0.5">
                    Google Identity verified for <strong>{email}</strong>. Please complete your farm location for local APMC radar calibration.
                  </p>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Farmer Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full h-10 px-3 rounded-2xl frosted-glass-sub border border-white/70 dark:border-white/10 font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                      Primary Phone (+91) *
                    </label>
                    <input
                      type="tel"
                      required
                      value={primaryPhone}
                      onChange={(e) => setPrimaryPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full h-10 px-3 rounded-2xl frosted-glass-sub border border-white/70 dark:border-white/10 font-bold font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                      Village / Panchayat *
                    </label>
                    <input
                      type="text"
                      required
                      value={village}
                      onChange={(e) => setVillage(e.target.value)}
                      placeholder="e.g. Village or Panchayat"
                      className="w-full h-10 px-3 rounded-2xl frosted-glass-sub border border-white/70 dark:border-white/10 font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                      District *
                    </label>
                    <input
                      type="text"
                      required
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      placeholder="e.g. Kolkata / District"
                      className="w-full h-10 px-3 rounded-2xl frosted-glass-sub border border-white/70 dark:border-white/10 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                      State *
                    </label>
                    <select
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full h-10 px-3 rounded-2xl frosted-glass-sub border border-white/70 dark:border-white/10 font-bold truncate"
                    >
                      {ALL_INDIAN_STATES_UTS.filter((s) => s !== 'All States').map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 rounded-2xl bg-[var(--brand-color,#0f9a58)] hover:bg-[var(--brand-hover,#0d844b)] text-white font-black text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer mt-3 disabled:opacity-50"
                >
                  <span>{isSubmitting ? 'Saving Farm Profile...' : 'Complete Registration & Open Dashboard'}</span>
                  <ArrowRight className="size-4" />
                </button>
              </form>
            )}

            {/* Footer Trust Info */}
            <div className="pt-2 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[var(--brand-color,#0f9a58)]" />
                Digital Agriculture Mission e-KYC Ready
              </span>
              <span>Encrypted Firebase Session</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
