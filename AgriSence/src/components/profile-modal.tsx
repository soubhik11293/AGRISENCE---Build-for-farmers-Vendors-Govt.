import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  User,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Upload,
  Sprout as Sparkles,
  Check,
  ShieldCheck,
  Camera,
  RotateCcw,
  Palette,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  Award,
  Sprout,
  KeyRound,
  Trash2,
  AlertTriangle,
  Eye,
  EyeOff,
  Headphones,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '@/src/context/auth-context';
import { useTelemetry } from '@/src/context/telemetry-context';
import { UserAvatar, AVATAR_GRADIENTS, getInitials } from '@/src/components/user-avatar';
import { SupportDeskModal } from '@/src/components/support-desk-modal';
import { ALL_INDIAN_STATES_UTS } from '@/src/lib/data/market';
import type { User as UserType } from '@/src/types';

// Preset avatar options
const PRESET_AVATARS = [
  {
    id: 'kisan-1',
    label: 'Progressive Kisan',
    url: 'https://images.unsplash.com/photo-1595278069441-2cf29f8005a4?auto=format&fit=crop&w=250&q=80',
    description: 'Cotton & Soybean Producer',
  },
  {
    id: 'agronomist-1',
    label: 'Precision Agronomist',
    url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=250&q=80',
    description: 'Soil & Canopy Specialist',
  },
  {
    id: 'drone-1',
    label: 'AgTech Drone Pilot',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
    description: 'Multispectral NDVI Surveyor',
  },
  {
    id: 'kisan-female',
    label: 'Krishi Sakhi Leader',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=250&q=80',
    description: 'Organic Farming Collective',
  },
  {
    id: 'horticulture',
    label: 'Horticulture Master',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80',
    description: 'Pomegranate & Citrus Grower',
  },
  {
    id: 'scientist',
    label: 'AgriSence Fellow',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
    description: 'Crop Protection & Bio-control',
  },
];

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

function calculateAgeAndBadge(dobString?: string): { age: number | null; label: string } {
  if (!dobString) return { age: null, label: 'Age not specified' };
  try {
    const birthDate = new Date(dobString);
    if (isNaN(birthDate.getTime())) return { age: null, label: 'Invalid date' };

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    let label = 'Next-Gen Progressive Farmer';
    if (age >= 50) label = 'Veteran Agronomic Pioneer';
    else if (age >= 35) label = 'Experienced Farm Lead';
    else if (age >= 18) label = 'Next-Gen AgTech Innovator';

    return { age, label };
  } catch {
    return { age: null, label: 'Age calculation error' };
  }
}

export function ProfileModal() {
  const {
    user,
    isProfileModalOpen,
    closeProfileModal,
    updateProfile,
    changePasswordInApp,
    deleteUserAccount,
    openAuthModal,
  } = useAuth();
  const { weatherData } = useTelemetry();

  const [activeTab, setActiveTab] = useState<'image' | 'personal' | 'contact' | 'location' | 'agronomic' | 'others'>('image');

  // Form State
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [phone, setPhone] = useState('');
  const [alternatePhone, setAlternatePhone] = useState('');
  const [email, setEmail] = useState('');
  const [village, setVillage] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [occupation, setOccupation] = useState('');
  const [specialization, setSpecialization] = useState(SPECIALIZATIONS[0]);
  const [selectedCrops, setSelectedCrops] = useState<string[]>(['Soybean', 'Cotton']);
  const [acreage, setAcreage] = useState('4.5');
  const [irrigationType, setIrrigationType] = useState('Micro-Drip Irrigation');

  // Display Image Settings
  const [avatarMode, setAvatarMode] = useState<'name' | 'upload' | 'preset'>('name');
  const [avatarColor, setAvatarColor] = useState('emerald');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Status feedback
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // "Others" Tab: In-App Password Reset State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [passChangeSuccess, setPassChangeSuccess] = useState(false);
  const [passChangeError, setPassChangeError] = useState<string | null>(null);
  const [isChangingPass, setIsChangingPass] = useState(false);

  // "Others" Tab: Account Deletion State
  const [deleteConfirmPassword, setDeleteConfirmPassword] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // "Others" Tab: Support & Helpdesk Modal Trigger
  const [supportDeskOpen, setSupportDeskOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync state whenever modal opens or user updates
  useEffect(() => {
    if (user && isProfileModalOpen) {
      setFullName(user.fullName || '');
      setDob(user.dob || '1992-05-18');
      setPhone(user.phone || '+91 98765 43210');
      setAlternatePhone(user.alternatePhone || '');
      setEmail(user.email || '');

      // Dynamically auto-hydrate district and state from active weather telemetry if not explicitly configured
      let initDistrict = user.district || '';
      let initState = user.state || '';
      let initVillage = user.village || '';
      let initPincode = user.pincode || '';

      if (!initDistrict || initDistrict === 'Pune') {
        if (weatherData?.locationName) {
          const parts = weatherData.locationName.split(',').map((s) => s.trim());
          if (parts[0]) initDistrict = parts[0];
          if (parts.length >= 2) {
            const matched = ALL_INDIAN_STATES_UTS.find(
              (s) => s.toLowerCase() === parts[1].toLowerCase()
            );
            if (matched) initState = matched;
          }
        }
      }
      if (!initDistrict) initDistrict = 'Kolkata';
      if (!initState) initState = 'West Bengal';
      if (!initVillage || initVillage === 'Shirur') initVillage = `${initDistrict} Gram Panchayat`;
      if (initPincode === '412210') initPincode = '';

      setVillage(initVillage);
      setDistrict(initDistrict);
      setState(initState);
      setPincode(initPincode);
      setOccupation(user.occupation || 'Precision Agriculture & Cash Crops');
      setSpecialization(user.specialization || SPECIALIZATIONS[0]);
      setSelectedCrops(user.crops && user.crops.length > 0 ? user.crops : ['Soybean', 'Cotton']);
      setAcreage(String(user.acreage || '4.5'));
      setIrrigationType(user.irrigationType || 'Micro-Drip Irrigation');

      setAvatarColor(user.avatarColor || 'emerald');
      setAvatarUrl(user.avatarUrl || '');

      if (user.avatarUrl && user.avatarUrl.length > 0) {
        if (PRESET_AVATARS.some((p) => p.url === user.avatarUrl)) {
          setAvatarMode('preset');
        } else {
          setAvatarMode('upload');
        }
      } else {
        setAvatarMode('name');
      }

      setSavedSuccess(false);
      setSaveError(null);
      setUploadError(null);
      setPassChangeSuccess(false);
      setPassChangeError(null);
      setDeleteError(null);
      setShowDeleteConfirm(false);
    }
  }, [user, isProfileModalOpen, weatherData]);

  const toggleCrop = (crop: string) => {
    if (selectedCrops.includes(crop)) {
      if (selectedCrops.length > 1) {
        setSelectedCrops(selectedCrops.filter((c) => c !== crop));
      }
    } else {
      setSelectedCrops([...selectedCrops, crop]);
    }
  };

  // Handle local image file upload & compression
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG, JPG, WebP)');
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      setUploadError('Image size exceeds 4MB. Please choose a smaller photo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        const img = new Image();
        img.src = result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 320;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
            setAvatarUrl(optimizedDataUrl);
            setAvatarMode('upload');
          } else {
            setAvatarUrl(result);
            setAvatarMode('upload');
          }
        };
      }
    };
    reader.onerror = () => {
      setUploadError('Failed to read image file. Please try another image.');
    };
    reader.readAsDataURL(file);
  };

  // Save General Profile Changes
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setSaveError(null);
    setSavedSuccess(false);

    try {
      const finalAvatarUrl = avatarMode === 'name' ? '' : avatarUrl;
      const finalAvatarType =
        avatarMode === 'name' ? 'initials' : avatarMode === 'preset' ? 'preset' : 'upload';

      const updatePayload: Partial<UserType> = {
        fullName: fullName.trim() || 'Progressive Farmer',
        dob,
        phone: phone.trim(),
        alternatePhone: alternatePhone.trim(),
        email: email.trim(),
        village: village.trim(),
        district: district.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        occupation: occupation.trim(),
        specialization,
        crops: selectedCrops,
        primaryCrop: selectedCrops[0] || 'Soybean',
        acreage,
        irrigationType,
        avatarUrl: finalAvatarUrl,
        avatarType: finalAvatarType,
        avatarColor,
      };

      const res = await updateProfile(updatePayload);
      if (res.error) {
        setSaveError(res.error);
      } else {
        setSavedSuccess(true);
        setTimeout(() => {
          setSavedSuccess(false);
          closeProfileModal();
        }, 1200);
      }
    } catch (err: any) {
      setSaveError(err.message || 'An unexpected error occurred while saving profile.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle In-App Password Change (Others Tab)
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsChangingPass(true);
    setPassChangeError(null);
    setPassChangeSuccess(false);

    if (newPassword.length < 8) {
      setPassChangeError('New password must be at least 8 characters.');
      setIsChangingPass(false);
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPassChangeError('New passwords do not match.');
      setIsChangingPass(false);
      return;
    }

    try {
      const res = await changePasswordInApp(oldPassword, newPassword);
      if (res.error) {
        setPassChangeError(res.error);
      } else {
        setPassChangeSuccess(true);
        setOldPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      }
    } catch (err: any) {
      setPassChangeError(err.message || 'Failed to update password');
    } finally {
      setIsChangingPass(false);
    }
  };

  // Handle Account Deletion (Others Tab)
  const handleDeleteAccount = async () => {
    if (!deleteConfirmPassword) {
      setDeleteError('Please enter your current password to authorize account deletion.');
      return;
    }
    setIsDeletingAccount(true);
    setDeleteError(null);
    try {
      const res = await deleteUserAccount(deleteConfirmPassword);
      if (res.error) {
        setDeleteError(res.error);
      } else {
        closeProfileModal();
        window.location.href = '/';
      }
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete account');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  if (!isProfileModalOpen || !user) return null;

  const previewUser: Partial<UserType> = {
    fullName: fullName || user.fullName || 'Progressive Farmer',
    avatarUrl: avatarMode === 'name' ? '' : avatarUrl,
    avatarColor,
    avatarType: avatarMode === 'name' ? 'initials' : avatarMode === 'preset' ? 'preset' : 'upload',
    dob,
    district,
    state,
  };

  const { age, label: ageLabel } = calculateAgeAndBadge(dob);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeProfileModal}
          className="fixed inset-0 bg-slate-950/60 dark:bg-black/75 backdrop-blur-md cursor-pointer"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-3xl rounded-[32px] frosted-card border border-white/80 dark:border-white/15 shadow-2xl backdrop-blur-2xl backdrop-saturate-200 overflow-hidden text-slate-900 dark:text-slate-100 z-10 my-auto flex flex-col max-h-[92vh]"
        >
          {/* Top Header Bar */}
          <div className="p-5 sm:p-6 pb-4 border-b border-white/60 dark:border-white/10 flex items-start justify-between gap-4 shrink-0 bg-white/40 dark:bg-slate-900/40">
            <div className="flex items-center gap-3.5">
              <UserAvatar user={previewUser} size="lg" showBadge />
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-[var(--brand-text,#0d7342)] border border-[var(--brand-border)] text-[10px] font-black uppercase tracking-wider">
                  <ShieldCheck className="size-3 text-[var(--brand-color,#0f9a58)]" />
                  <span>Kisan ID: AGS-MH-{user.id.slice(-6).toUpperCase()}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white mt-0.5 tracking-tight flex items-center gap-2">
                  <span>{previewUser.fullName}</span>
                </h2>
                <p className="text-xs text-slate-650 dark:text-slate-300 font-medium">
                  {user.email || 'farmer@domain.com'} • {user.village || 'Shirur'}, {user.district || 'Pune'}, {user.state || 'Maharashtra'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={closeProfileModal}
              className="p-2 rounded-2xl frosted-glass-sub hover:bg-slate-200/80 dark:hover:bg-slate-800 text-slate-500 transition-colors cursor-pointer border border-white/60 dark:border-white/10"
              aria-label="Close profile editor"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="px-5 sm:px-6 pt-3 border-b border-white/40 dark:border-white/10 bg-slate-50/50 dark:bg-slate-900/20 shrink-0 flex items-center gap-1 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab('image')}
              className={`pb-2.5 px-3 text-xs font-black transition-all border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'image'
                  ? 'border-[var(--brand-color,#0f9a58)] text-[var(--brand-text,#0d7342)]'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Camera className="size-3.5" />
              <span>Display & Avatar</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('personal')}
              className={`pb-2.5 px-3 text-xs font-black transition-all border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'personal'
                  ? 'border-[var(--brand-color,#0f9a58)] text-[var(--brand-text,#0d7342)]'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <User className="size-3.5" />
              <span>Identity & DOB</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('contact')}
              className={`pb-2.5 px-3 text-xs font-black transition-all border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'contact'
                  ? 'border-[var(--brand-color,#0f9a58)] text-[var(--brand-text,#0d7342)]'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Phone className="size-3.5" />
              <span>Contact Coordinates</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('location')}
              className={`pb-2.5 px-3 text-xs font-black transition-all border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'location'
                  ? 'border-[var(--brand-color,#0f9a58)] text-[var(--brand-text,#0d7342)]'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <MapPin className="size-3.5" />
              <span>Farm Location</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('agronomic')}
              className={`pb-2.5 px-3 text-xs font-black transition-all border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'agronomic'
                  ? 'border-[var(--brand-color,#0f9a58)] text-[var(--brand-text,#0d7342)]'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Sprout className="size-3.5" />
              <span>Crops & Acreage</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('others')}
              className={`pb-2.5 px-3 text-xs font-black transition-all border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'others'
                  ? 'border-[var(--brand-color,#0f9a58)] text-[var(--brand-text,#0d7342)]'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <KeyRound className="size-3.5" />
              <span>Others & Security</span>
            </button>
          </div>

          {/* Form Content Body (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            {/* TAB 1: DISPLAY IMAGE SETTINGS */}
            {activeTab === 'image' && (
              <div className="space-y-6">
                <div className="p-4 rounded-2xl bg-emerald-500/10 dark:bg-emerald-950/30 border border-[var(--brand-border)] flex items-start gap-3">
                  <Sparkles className="size-4 text-[var(--brand-color,#0f9a58)] shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-black text-slate-950 dark:text-white">
                      Custom Display Image & Dynamic Name Monogram
                    </p>
                    <p className="text-slate-650 dark:text-slate-300 font-medium mt-0.5">
                      Select a stylized monogram of your name with gradient themes, upload a personal field photo, or pick an agronomic portrait. Writes directly to Firestore.
                    </p>
                  </div>
                </div>

                {/* Mode Selector */}
                <div className="grid grid-cols-3 gap-2 p-1 rounded-2xl bg-slate-200/60 dark:bg-slate-800/60 border border-white/40 dark:border-white/10 text-xs font-black">
                  <button
                    type="button"
                    onClick={() => setAvatarMode('name')}
                    className={`py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      avatarMode === 'name'
                        ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <Palette className="size-3.5 text-[var(--brand-color,#0f9a58)]" />
                    <span>Name Monogram</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAvatarMode('upload')}
                    className={`py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      avatarMode === 'upload'
                        ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <Upload className="size-3.5 text-sky-600" />
                    <span>Upload Photo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAvatarMode('preset')}
                    className={`py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      avatarMode === 'preset'
                        ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <ImageIcon className="size-3.5 text-amber-600" />
                    <span>Agri Presets</span>
                  </button>
                </div>

                {/* Mode A: Name Monogram */}
                {avatarMode === 'name' && (
                  <div className="space-y-4 p-5 rounded-2xl frosted-glass-sub border border-white/80 dark:border-white/10">
                    <div className="flex flex-col sm:flex-row items-center gap-5 justify-between">
                      <div className="flex items-center gap-4">
                        <UserAvatar user={previewUser} size="xl" showBadge />
                        <div>
                          <h4 className="text-sm font-black text-slate-950 dark:text-white">
                            Initials: &ldquo;{getInitials(fullName)}&rdquo;
                          </h4>
                          <p className="text-xs text-slate-650 dark:text-slate-300 font-medium">
                            Dynamically generated from your full name &ldquo;{fullName || 'Progressive Farmer'}&rdquo;.
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">Current Theme</span>
                        <span className="text-xs font-black text-[var(--brand-text,#0d7342)]">
                          {AVATAR_GRADIENTS[avatarColor]?.label || 'Emerald Crop'}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <label className="text-xs font-black text-slate-900 dark:text-slate-100 block mb-2">
                        Select Monogram Color Gradient Palette:
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {Object.entries(AVATAR_GRADIENTS).map(([key, config]) => {
                          const isSelected = avatarColor === key;
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => setAvatarColor(key)}
                              className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                                isSelected
                                  ? 'border-[var(--brand-color,#0f9a58)] bg-white dark:bg-slate-900 shadow-xs ring-2 ring-[var(--brand-color,#0f9a58)]/30'
                                  : 'border-slate-200 dark:border-white/10 hover:border-slate-300'
                              }`}
                            >
                              <div
                                className={`size-6 rounded-full shrink-0 ${config.class} flex items-center justify-center text-[10px] font-black`}
                              >
                                {isSelected ? <Check className="size-3" /> : getInitials(fullName)}
                              </div>
                              <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {config.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Mode B: Upload Photo */}
                {avatarMode === 'upload' && (
                  <div className="space-y-4 p-5 rounded-2xl frosted-glass-sub border border-white/80 dark:border-white/10">
                    <div className="flex flex-col sm:flex-row items-center gap-5">
                      <UserAvatar user={previewUser} size="xl" showBadge />
                      <div className="flex-1 space-y-2 text-center sm:text-left">
                        <h4 className="text-sm font-black text-slate-950 dark:text-white">
                          Upload Custom Display Image
                        </h4>
                        <p className="text-xs text-slate-650 dark:text-slate-300 font-medium">
                          Upload a portrait or field photo. Formats: JPG, PNG, WebP up to 4MB.
                        </p>

                        <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start pt-1">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-3.5 py-1.5 rounded-xl bg-[var(--brand-color,#0f9a58)] hover:bg-[var(--brand-hover,#0d844b)] text-white text-xs font-black shadow-xs flex items-center gap-1.5 cursor-pointer"
                          >
                            <Upload className="size-3.5" />
                            <span>Browse Device Image</span>
                          </button>

                          {avatarUrl && (
                            <button
                              type="button"
                              onClick={() => {
                                setAvatarUrl('');
                                setAvatarMode('name');
                              }}
                              className="px-3 py-1.5 rounded-xl frosted-glass-sub text-rose-600 hover:bg-rose-500/10 text-xs font-bold transition-colors cursor-pointer border border-rose-200 dark:border-rose-900/30 flex items-center gap-1"
                            >
                              <RotateCcw className="size-3" />
                              <span>Remove & Use Monogram</span>
                            </button>
                          )}
                        </div>

                        {uploadError && (
                          <p className="text-xs text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
                            <AlertCircle className="size-3.5" />
                            <span>{uploadError}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Mode C: Preset Avatars */}
                {avatarMode === 'preset' && (
                  <div className="space-y-3">
                    <label className="text-xs font-black text-slate-900 dark:text-slate-100 block">
                      Choose an Agronomic Representative Avatar:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {PRESET_AVATARS.map((preset) => {
                        const isSelected = avatarUrl === preset.url;
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => {
                              setAvatarUrl(preset.url);
                              setAvatarMode('preset');
                            }}
                            className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                              isSelected
                                ? 'border-[var(--brand-color,#0f9a58)] bg-emerald-500/10 dark:bg-emerald-950/40 shadow-xs ring-2 ring-[var(--brand-color,#0f9a58)]/30'
                                : 'frosted-glass-sub border-slate-200 dark:border-white/10 hover:border-slate-300'
                            }`}
                          >
                            <img
                              src={preset.url}
                              alt={preset.label}
                              className="size-11 rounded-full object-cover shrink-0 ring-1 ring-white/60"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-black text-slate-950 dark:text-white truncate">
                                {preset.label}
                              </p>
                              <p className="text-[10px] text-slate-650 dark:text-slate-400 truncate">
                                {preset.description}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: PERSONAL IDENTITY & DOB */}
            {activeTab === 'personal' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <User className="size-3.5 text-[var(--brand-color,#0f9a58)]" />
                      <span>Farmer Full Name (Primary Identification) *</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Ramesh Baburao Patil"
                      className="w-full h-11 px-3.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-color,#0f9a58)]"
                    />
                    <p className="text-[11px] text-slate-500 font-medium">
                      Appears on official PMFBY loss claims, KCC bank dossiers, and satellite telemetry reports.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Calendar className="size-3.5 text-amber-600" />
                      <span>Date of Birth (DOB) *</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-color,#0f9a58)]"
                    />
                    {dob && (
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--brand-text,#0d7342)] pt-0.5">
                        <Clock className="size-3" />
                        <span>{age ? `${age} Years Old` : ''} • {ageLabel}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Award className="size-3.5 text-teal-600" />
                      <span>Farming Role / Status</span>
                    </label>
                    <input
                      type="text"
                      value={occupation}
                      onChange={(e) => setOccupation(e.target.value)}
                      placeholder="e.g. Owner Cultivator & Cash Crops"
                      className="w-full h-11 px-3.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-color,#0f9a58)]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: CONTACT COORDINATES */}
            {activeTab === 'contact' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Phone className="size-3.5 text-[var(--brand-color,#0f9a58)]" />
                      <span>Primary Mobile / WhatsApp Number *</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full h-11 px-3.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-color,#0f9a58)] font-mono"
                    />
                    <p className="text-[11px] text-slate-500 font-medium">
                      Receives instant WhatsApp spray window alerts and APMC price updates.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Phone className="size-3.5 text-slate-400" />
                      <span>Alternate / Emergency Contact</span>
                    </label>
                    <input
                      type="tel"
                      value={alternatePhone}
                      onChange={(e) => setAlternatePhone(e.target.value)}
                      placeholder="+91 98234 56789 (Optional)"
                      className="w-full h-11 px-3.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-color,#0f9a58)] font-mono"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Mail className="size-3.5 text-sky-600" />
                      <span>Registered Email Address *</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="farmer@domain.com"
                      className="w-full h-11 px-3.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-color,#0f9a58)]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: FARM LOCATION & DEMOGRAPHICS */}
            {activeTab === 'location' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <MapPin className="size-3.5 text-[var(--brand-color,#0f9a58)]" />
                      <span>Village / Gram Panchayat *</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={village}
                      onChange={(e) => setVillage(e.target.value)}
                      placeholder="e.g. Village or Gram Panchayat"
                      className="w-full h-11 px-3.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-color,#0f9a58)]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Layers className="size-3.5 text-teal-600" />
                      <span>District (For Local APMC Linking) *</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      placeholder="e.g. Kolkata / District Name"
                      className="w-full h-11 px-3.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-color,#0f9a58)]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <MapPin className="size-3.5 text-amber-600" />
                      <span>State / Union Territory *</span>
                    </label>
                    <select
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-color,#0f9a58)] cursor-pointer truncate"
                    >
                      {ALL_INDIAN_STATES_UTS.filter((s) => s !== 'All States').map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <MapPin className="size-3.5 text-slate-500" />
                      <span>Postal Pincode *</span>
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g. 700001"
                      className="w-full h-11 px-3.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-color,#0f9a58)] font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: CROPS & AGRONOMIC ONBOARDING */}
            {activeTab === 'agronomic' && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Sprout className="size-3.5 text-[var(--brand-color,#0f9a58)]" />
                    <span>Agronomic Specialization</span>
                  </label>
                  <select
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-color,#0f9a58)]"
                  >
                    {SPECIALIZATIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-800 dark:text-slate-200 block">
                    Cultivated Crops (Quick Select Chips)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {COMMON_CROPS.map((crop) => {
                      const isSelected = selectedCrops.includes(crop);
                      return (
                        <button
                          key={crop}
                          type="button"
                          onClick={() => toggleCrop(crop)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[var(--brand-color,#0f9a58)] text-white shadow-xs'
                              : 'frosted-glass-sub border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {crop}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-800 dark:text-slate-200 block">
                      Total Farm Area (Acres)
                    </label>
                    <input
                      type="text"
                      value={acreage}
                      onChange={(e) => setAcreage(e.target.value)}
                      placeholder="4.5"
                      className="w-full h-11 px-3.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 text-xs font-bold font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-800 dark:text-slate-200 block">
                      Irrigation Water Source
                    </label>
                    <select
                      value={irrigationType}
                      onChange={(e) => setIrrigationType(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 text-xs font-bold truncate"
                    >
                      {IRRIGATION_TYPES.map((i) => (
                        <option key={i} value={i}>{i}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: DEDICATED "OTHERS" TAB (IN-APP PASSWORD RESET, HELPDESK & ACCOUNT DELETION) */}
            {activeTab === 'others' && (
              <div className="space-y-6">
                {/* Capability 1: Kisan Omnichannel Helpdesk & Agronomist Assistance */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-emerald-500/10 to-transparent border-2 border-amber-500/30 dark:border-amber-500/20 space-y-4 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-500/20">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-md font-black">
                        <Headphones className="size-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-slate-950 dark:text-white">
                            Kisan Omnichannel Help Desk
                          </h4>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                            Mon–Fri: 09 AM – 06 PM
                          </span>
                        </div>
                        <p className="text-xs text-slate-650 dark:text-slate-300">
                          Direct agronomic advisory, pest triage, scheme subsidy registration, & ticket dispatch. (Closed Sat & Sun)
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSupportDeskOpen(true)}
                      className="px-4 py-2 rounded-xl bg-[var(--brand-color,#0f9a58)] hover:bg-[var(--brand-hover,#0d844b)] text-white text-xs font-black shadow-md flex items-center justify-center gap-1.5 cursor-pointer transition-all hover:scale-105 active:scale-95 shrink-0"
                    >
                      <Headphones className="size-4" />
                      <span>Open Helpdesk & Tickets</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                    <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-slate-200/80 dark:border-white/10 space-y-1">
                      <span className="text-[10px] text-slate-400 block font-bold">Toll-Free Helpline</span>
                      <a href="tel:+9118008893247" className="font-bold text-slate-900 dark:text-white block hover:underline">
                        +91 1800-889-3247
                      </a>
                      <span className="text-[9px] text-amber-600 dark:text-amber-400 block font-semibold">
                        09 AM – 06 PM (Mon–Fri)
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-slate-200/80 dark:border-white/10 space-y-1">
                      <span className="text-[10px] text-slate-400 block font-bold">Official Email</span>
                      <a href="mailto:support@agrisence.in" className="font-bold text-slate-900 dark:text-white block hover:underline truncate">
                        support@agrisence.in
                      </a>
                    </div>

                    <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-slate-200/80 dark:border-white/10 space-y-1">
                      <span className="text-[10px] text-slate-400 block font-bold">Farm Location</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 block truncate">
                        {village || district || 'Location Verified'} ({state || 'India'})
                      </span>
                      <span className="text-[9px] text-slate-400 block font-semibold">
                        PIN: {pincode || 'Not provided'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Capability 2: In-App Password Reset */}
                <div className="p-5 rounded-2xl frosted-glass-sub border border-white/80 dark:border-white/10 space-y-4">
                  <div className="flex items-center gap-2.5">
                    <div className="size-9 rounded-xl bg-emerald-500/15 text-[var(--brand-color,#0f9a58)] flex items-center justify-center">
                      <KeyRound className="size-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-950 dark:text-white">
                        In-App Security & Password Reset
                      </h4>
                      <p className="text-xs text-slate-650 dark:text-slate-400">
                        Authenticate with your existing password to set a new secure password.
                      </p>
                    </div>
                  </div>

                  {passChangeSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                      <CheckCircle2 className="size-4" />
                      <span>Password successfully updated! Security notification email dispatched.</span>
                    </div>
                  )}

                  {passChangeError && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="size-4" />
                        <span>{passChangeError}</span>
                      </div>
                      {passChangeError.includes('Incorrect') && (
                        <button
                          type="button"
                          onClick={() => {
                            closeProfileModal();
                            openAuthModal('Password Reset Flow');
                          }}
                          className="underline text-[11px] font-black cursor-pointer shrink-0"
                        >
                          Forgot Password?
                        </button>
                      )}
                    </div>
                  )}

                  <form onSubmit={handlePasswordChange} className="space-y-3 text-xs">
                    <div>
                      <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                        Current Old Password *
                      </label>
                      <div className="relative">
                        <input
                          type={showOldPass ? 'text' : 'password'}
                          required
                          value={oldPassword}
                          onChange={(e) => setOldPassword(e.target.value)}
                          placeholder="Enter your current password"
                          className="w-full h-10 px-3 pr-10 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 font-semibold"
                        />
                        <button
                          type="button"
                          onClick={() => setShowOldPass(!showOldPass)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                        >
                          {showOldPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                          New Password (Min 8 chars) *
                        </label>
                        <div className="relative">
                          <input
                            type={showNewPass ? 'text' : 'password'}
                            required
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="New secure password"
                            className="w-full h-10 px-3 pr-10 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 font-semibold"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPass(!showNewPass)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                          >
                            {showNewPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                          Re-enter New Password *
                        </label>
                        <input
                          type="password"
                          required
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          placeholder="Confirm new password"
                          className="w-full h-10 px-3 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 font-semibold"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isChangingPass}
                      className="px-4 py-2 rounded-xl bg-[var(--brand-color,#0f9a58)] hover:bg-[var(--brand-hover,#0d844b)] text-white font-bold text-xs shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      {isChangingPass ? 'Verifying & Updating...' : 'Update Password In-App'}
                    </button>
                  </form>
                </div>

                {/* Capability 2: Account Deletion */}
                <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="size-9 rounded-xl bg-rose-500/20 text-rose-600 flex items-center justify-center">
                      <Trash2 className="size-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-rose-900 dark:text-rose-200">
                        Permanent Farmer Account Deletion
                      </h4>
                      <p className="text-xs text-rose-700 dark:text-rose-300">
                        Warning: Deleting your account permanently deletes all registered farm parcels, NDVI logs, and historical PMFBY dossiers from Firestore.
                      </p>
                    </div>
                  </div>

                  {deleteError && (
                    <div className="p-3 rounded-xl bg-rose-500/20 text-rose-900 dark:text-rose-100 text-xs font-bold">
                      {deleteError}
                    </div>
                  )}

                  {!showDeleteConfirm ? (
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                    >
                      I Understand, Proceed with Account Deletion
                    </button>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-rose-300 dark:border-rose-900/40 space-y-3">
                      <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 text-xs font-bold">
                        <AlertTriangle className="size-4 shrink-0" />
                        <span>Confirm identity: Please enter your password to authorize permanent deletion.</span>
                      </div>
                      <input
                        type="password"
                        value={deleteConfirmPassword}
                        onChange={(e) => setDeleteConfirmPassword(e.target.value)}
                        placeholder="Enter your password to confirm"
                        className="w-full h-10 px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-white/10 text-xs font-semibold"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setShowDeleteConfirm(false)}
                          className="px-3 py-1.5 rounded-xl frosted-glass-sub text-xs font-bold"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleDeleteAccount}
                          disabled={isDeletingAccount}
                          className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-xs cursor-pointer disabled:opacity-50"
                        >
                          {isDeletingAccount ? 'Permanently Deleting...' : 'Confirm Permanent Deletion'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Error or Success Banner */}
            {saveError && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0" />
                <span>{saveError}</span>
              </div>
            )}

            {savedSuccess && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="size-4 shrink-0" />
                <span>Farmer profile and agronomic credentials successfully synchronized with Firestore!</span>
              </div>
            )}
          </div>

          {/* Footer Bar */}
          <div className="p-4 sm:p-5 border-t border-white/60 dark:border-white/10 bg-white/50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 text-center sm:text-left">
              <ShieldCheck className="size-3.5 text-[var(--brand-color,#0f9a58)] shrink-0" />
              <span>Real-Time Reactive Firestore Synchronization Active</span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={closeProfileModal}
                className="flex-1 sm:flex-none px-4 py-2 rounded-2xl frosted-glass-sub hover:bg-slate-200/80 dark:hover:bg-slate-800 text-slate-750 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer border border-white/60 dark:border-white/10"
              >
                Close
              </button>

              {activeTab !== 'others' && (
                <button
                  type="button"
                  onClick={() => handleSave()}
                  disabled={isSaving}
                  className="flex-1 sm:flex-none px-5 py-2.5 rounded-2xl bg-[var(--brand-color,#0f9a58)] hover:bg-[var(--brand-hover,#0d844b)] text-white text-xs font-black shadow-md shadow-emerald-600/20 transition-all hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <span className="size-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving to Firestore...</span>
                    </>
                  ) : (
                    <>
                      <Check className="size-4 stroke-[2.5]" />
                      <span>Save Profile Changes</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Support Desk Modal instance triggered from Profile */}
      <SupportDeskModal
        isOpen={supportDeskOpen}
        onClose={() => setSupportDeskOpen(false)}
      />
    </AnimatePresence>
  );
}
