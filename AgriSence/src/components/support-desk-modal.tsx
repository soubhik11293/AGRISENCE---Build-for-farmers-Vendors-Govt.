import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HelpCircle,
  X,
  Phone,
  Mail,
  Clock,
  Send,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Headphones,
  ExternalLink,
  MapPin,
  History,
  Check,
  RotateCcw,
  Copy,
  Tag,
  Calendar,
} from 'lucide-react';
import emailjs from '@emailjs/browser';
import { EMAILJS_CONFIG } from '@/src/lib/firebase';
import { useAuth } from '@/src/context/auth-context';
import { useLanguage } from '@/src/context/language-context';
import { useTelemetry } from '@/src/context/telemetry-context';

export interface SupportTicketRecord {
  id: string;
  category: string;
  subject: string;
  message: string;
  userName: string;
  userPhone: string;
  userEmail: string;
  farmLocation: string;
  submittedOn: string;
  status: 'Open' | 'Resolved';
  resolvedOn?: string;
}

const SUPPORT_TICKETS_STORAGE_KEY = 'agrisence_support_tickets_history';

interface SupportDeskModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: string;
  initialMessage?: string;
}

export function SupportDeskModal({
  isOpen,
  onClose,
  initialCategory = 'Pest Outbreak Report & Agronomic Advice',
  initialMessage = '',
}: SupportDeskModalProps) {
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const { weatherData } = useTelemetry();

  // Active view tab: 'submit' | 'history'
  const [activeTab, setActiveTab] = useState<'submit' | 'history'>('submit');

  // Helper to get auto-formatted farm location from profile or telemetry
  const getAutoFarmLocation = () => {
    const parts = [];
    if (user?.village) parts.push(user.village);
    if (user?.district) parts.push(user.district);
    if (user?.state) parts.push(user.state);
    if (user?.pincode) parts.push(`PIN ${user.pincode}`);
    if (parts.length > 0) return parts.join(', ');

    if (weatherData?.locationName) return weatherData.locationName;
    return 'Pune, Maharashtra';
  };

  const [fromName, setFromName] = useState(user?.fullName || '');
  const [userPhone, setUserPhone] = useState(user?.phone || '');
  const [userEmail, setUserEmail] = useState(user?.email || '');
  const [farmLocation, setFarmLocation] = useState(getAutoFarmLocation());
  const [category, setCategory] = useState(initialCategory);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState(initialMessage);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [ticketId, setTicketId] = useState<string>('');
  const [submittedOnDate, setSubmittedOnDate] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [copiedTicket, setCopiedTicket] = useState(false);

  // Tickets history state
  const [ticketHistory, setTicketHistory] = useState<SupportTicketRecord[]>(() => {
    if (typeof window !== 'undefined' && user?.id) {
      try {
        const stored = localStorage.getItem(`${SUPPORT_TICKETS_STORAGE_KEY}:${user.id}`);
        if (stored) return JSON.parse(stored);
      } catch {
        // ignore
      }
    }
    return [];
  });

  useEffect(() => {
    if (!user?.id) { setTicketHistory([]); return; }
    try {
      const stored = localStorage.getItem(`${SUPPORT_TICKETS_STORAGE_KEY}:${user.id}`);
      setTicketHistory(stored ? JSON.parse(stored) : []);
    } catch { setTicketHistory([]); }
  }, [user?.id]);

  // Sync user values & farm location if user profile updates
  useEffect(() => {
    if (user) {
      if (!fromName) setFromName(user.fullName || '');
      if (!userPhone) setUserPhone(user.phone || '');
      if (!userEmail) setUserEmail(user.email || '');
    }
    setFarmLocation(getAutoFarmLocation());
  }, [user, weatherData?.locationName]);

  // Save history to localStorage
  const saveTicketToHistory = (newTicket: SupportTicketRecord) => {
    try {
      const updated = [newTicket, ...ticketHistory];
      setTicketHistory(updated);
      if (user?.id) localStorage.setItem(`${SUPPORT_TICKETS_STORAGE_KEY}:${user.id}`, JSON.stringify(updated));
    } catch (err) {
      console.warn('Failed to persist ticket history:', err);
    }
  };

  // Toggle ticket resolution status
  const handleToggleResolved = (id: string) => {
    const updated = ticketHistory.map((t) => {
      if (t.id === id) {
        const newStatus: 'Open' | 'Resolved' = t.status === 'Resolved' ? 'Open' : 'Resolved';
        const formattedNow = new Date().toLocaleString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });
        return {
          ...t,
          status: newStatus,
          resolvedOn: newStatus === 'Resolved' ? formattedNow : undefined,
        };
      }
      return t;
    });
    setTicketHistory(updated);
    if (user?.id) localStorage.setItem(`${SUPPORT_TICKETS_STORAGE_KEY}:${user.id}`, JSON.stringify(updated));
  };

  const handleCopyTicket = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedTicket(true);
    setTimeout(() => setCopiedTicket(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromName.trim() || !message.trim()) {
      setErrorMessage('Please fill in your name and message details.');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    const formattedSubmittedOn = new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const generatedTicket = ticketId || `AGRI-${Math.floor(100000 + Math.random() * 900000)}`;
    const selectedCategory = category || 'Pest Outbreak Report & Agronomic Advice';

    setTicketId(generatedTicket);
    setSubmittedOnDate(formattedSubmittedOn);

    const templateParams = {
      from_name: fromName.trim() || 'Valued Farmer',
      user_phone: userPhone.trim() || 'Not Provided',
      user_email: userEmail.trim() || 'Not Provided',
      reply_to: userEmail.trim() || 'noreply@agrisence.in',
      farm_location: farmLocation.trim() || 'Not Specified',

      // Explicitly assign all variable variations to match EmailJS template parameters:
      issue_category: selectedCategory,
      category: selectedCategory,
      issueCategory: selectedCategory,
      issue_type: selectedCategory,

      ticket_id: generatedTicket,
      passcode: generatedTicket,
      submitted_on: formattedSubmittedOn,
      time: formattedSubmittedOn,
      subject: subject.trim() || `Inquiry: ${selectedCategory}`,
      message: message.trim(),
    };

    // Save ticket locally immediately to history
    const record: SupportTicketRecord = {
      id: generatedTicket,
      category: selectedCategory,
      subject: subject.trim() || `Inquiry: ${selectedCategory}`,
      message: message.trim(),
      userName: fromName.trim() || 'Valued Farmer',
      userPhone: userPhone.trim() || 'Not Provided',
      userEmail: userEmail.trim() || '',
      farmLocation: farmLocation.trim() || 'Auto-detected',
      submittedOn: formattedSubmittedOn,
      status: 'Open',
    };
    saveTicketToHistory(record);

    try {
      await emailjs.send(
        EMAILJS_CONFIG.serviceId,
        EMAILJS_CONFIG.supportTemplateId || 'template_pvxsd4m',
        templateParams,
        EMAILJS_CONFIG.publicKey
      );
      setSubmitStatus('success');
    } catch (err: any) {
      console.warn('EmailJS delivery fallback invoked:', err);
      setSubmitStatus('error');
      setErrorMessage('The support email could not be delivered. Your ticket remains saved locally; please use WhatsApp or the toll-free number below.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSubmitStatus('idle');
    setMessage('');
    setSubject('');
    setTicketId('');
    setSubmittedOnDate('');
    setErrorMessage('');
  };

  if (!isOpen) return null;

  const whatsappMessage = encodeURIComponent(
    `Hello AgriSence Support Desk (Ticket: ${ticketId || 'New Enquiry'}), I am ${fromName || 'a Farmer'}. Location: ${farmLocation}. Need assistance regarding: ${category}. Message: ${message || 'Please connect with an agronomist.'}`
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          transition={{ type: 'spring', duration: 0.4 }}
          className="relative w-full max-w-2xl max-h-[90vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[32px] shadow-2xl overflow-hidden flex flex-col z-10"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200/80 dark:border-white/10 flex items-center justify-between gap-4 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent shrink-0">
            <div className="flex items-center gap-3">
              <div className="size-11 rounded-2xl bg-[var(--brand-color,#0f9a58)] text-white flex items-center justify-center shadow-md">
                <Headphones className="size-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-slate-950 dark:text-white">
                    Omnichannel Kisan Support & Helpdesk
                  </h3>
                  <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[var(--brand-subtle,#f0faf4)] text-[var(--brand-text,#0d7342)] border border-[var(--brand-border)]">
                    Official Assistance
                  </span>
                </div>
                <p className="text-xs text-slate-650 dark:text-slate-300 font-medium">
                  Direct agronomist advisory, scheme registration help, & platform technical support
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="size-9 rounded-full frosted-glass-sub hover:bg-slate-200/80 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Quick Helpline Strip */}
          <div className="px-6 py-3 bg-slate-50 dark:bg-slate-950/40 border-b border-slate-100 dark:border-white/5 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-semibold shrink-0">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Phone className="size-3.5 text-[var(--brand-color,#0f9a58)] shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block leading-tight">Toll-Free Helpline</span>
                <a href="tel:+9118008893247" className="font-bold text-slate-950 dark:text-white hover:underline">
                  +91 1800-889-3247
                </a>
              </div>
            </div>

            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Mail className="size-3.5 text-[var(--brand-color,#0f9a58)] shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block leading-tight">Official Email</span>
                <a href="mailto:support@agrisence.in" className="font-bold text-slate-950 dark:text-white hover:underline">
                  support@agrisence.in
                </a>
              </div>
            </div>

            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Clock className="size-3.5 text-amber-500 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block leading-tight">Support Desk Hours</span>
                <span className="font-bold text-slate-950 dark:text-white">Mon–Fri: 09:00 AM – 06:00 PM</span>
                <span className="text-[9px] text-amber-600 dark:text-amber-400 block font-semibold leading-none mt-0.5">
                  (Closed Saturday & Sunday)
                </span>
              </div>
            </div>
          </div>

          {/* Tab Switcher: Submit Query vs Request History */}
          <div className="px-6 pt-3 pb-2 border-b border-slate-200/70 dark:border-white/10 flex items-center gap-2 bg-slate-100/60 dark:bg-slate-800/40 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('submit')}
              className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'submit'
                  ? 'bg-[var(--brand-color,#0f9a58)] text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <Send className="size-3.5" />
              <span>Submit Support Query</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'history'
                  ? 'bg-[var(--brand-color,#0f9a58)] text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <History className="size-3.5" />
              <span>Request History</span>
              {ticketHistory.length > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  activeTab === 'history' ? 'bg-white text-emerald-800' : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                }`}>
                  {ticketHistory.length}
                </span>
              )}
            </button>
          </div>

          {/* Tab Content Body */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'history' ? (
              /* Request History View */
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-white/10">
                  <div>
                    <h4 className="text-sm font-black text-slate-950 dark:text-white flex items-center gap-1.5">
                      <History className="size-4 text-[var(--brand-color,#0f9a58)]" />
                      <span>Your Submitted Support Tickets</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Track ticket statuses, review submitted queries, and mark issues as resolved when addressed.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    Total Tickets: <strong>{ticketHistory.length}</strong>
                  </span>
                </div>

                {ticketHistory.length === 0 ? (
                  <div className="py-12 text-center space-y-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-white/10 p-6">
                    <Headphones className="size-10 text-slate-400 mx-auto" />
                    <h5 className="text-sm font-black text-slate-800 dark:text-slate-200">No Support Requests Logged Yet</h5>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Whenever you submit an agronomic query or technical question, your ticket history and resolution status will appear here.
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('submit')}
                      className="px-4 py-2 rounded-xl bg-[var(--brand-color,#0f9a58)] hover:bg-[var(--brand-hover,#0d844b)] text-white text-xs font-bold shadow-sm inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Send className="size-3.5" />
                      <span>Submit Your First Query</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {ticketHistory.map((item, idx) => {
                      const isResolved = item.status === 'Resolved';
                      return (
                        <div
                          key={`ticket-${item.id}-${idx}`}
                          className={`p-4 rounded-2xl border transition-all ${
                            isResolved
                              ? 'bg-emerald-500/5 dark:bg-emerald-950/20 border-emerald-500/30'
                              : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-white/10 shadow-xs'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-white/5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-xs font-black px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100">
                                #{item.id}
                              </span>
                              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1 ${
                                isResolved
                                  ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                                  : 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30'
                              }`}>
                                {isResolved ? (
                                  <>
                                    <CheckCircle2 className="size-3" />
                                    <span>Resolved</span>
                                  </>
                                ) : (
                                  <>
                                    <Clock className="size-3" />
                                    <span>Under Review / Open</span>
                                  </>
                                )}
                              </span>
                              <span className="text-[11px] font-bold text-[var(--brand-color,#0f9a58)] bg-emerald-500/10 px-2 py-0.5 rounded-md">
                                {item.category}
                              </span>
                            </div>

                            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                              <strong>Submitted on:</strong> {item.submittedOn}
                            </div>
                          </div>

                          <div className="py-2.5 space-y-1">
                            {item.subject && (
                              <h5 className="text-xs font-black text-slate-900 dark:text-white">
                                {item.subject}
                              </h5>
                            )}
                            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                              {item.message}
                            </p>
                            {item.farmLocation && (
                              <div className="pt-1 flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                                <MapPin className="size-3 text-emerald-600" />
                                <span><strong>Farm Parcel:</strong> {item.farmLocation}</span>
                              </div>
                            )}
                          </div>

                          <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex flex-wrap items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => handleCopyTicket(item.id)}
                              className="text-[11px] text-slate-650 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 cursor-pointer font-semibold"
                            >
                              <Copy className="size-3" />
                              <span>{copiedTicket ? 'Copied ID!' : 'Copy Ticket ID'}</span>
                            </button>

                            <div className="flex items-center gap-2">
                              {/* Option to Mark Issue as Resolved or Reopen */}
                              <button
                                type="button"
                                onClick={() => handleToggleResolved(item.id)}
                                className={`px-3 py-1 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                                  isResolved
                                    ? 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200'
                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                }`}
                              >
                                {isResolved ? (
                                  <>
                                    <RotateCcw className="size-3" />
                                    <span>Reopen Ticket</span>
                                  </>
                                ) : (
                                  <>
                                    <Check className="size-3" />
                                    <span>Mark as Resolved</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : submitStatus === 'success' ? (
              /* Success Screen */
              <div className="p-6 text-center space-y-4 rounded-3xl bg-[var(--brand-subtle,#f0faf4)] border border-[var(--brand-border)]">
                <div className="size-14 rounded-full bg-[var(--brand-color,#0f9a58)] text-white flex items-center justify-center mx-auto shadow-lg">
                  <CheckCircle2 className="size-7" />
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-black uppercase tracking-wider text-[var(--brand-text,#0d7342)]">
                    Ticket Logged Successfully
                  </span>
                  <h4 className="text-xl font-black text-slate-950 dark:text-white">
                    Support Ticket ID: <span className="text-[var(--brand-color,#0f9a58)] font-mono">{ticketId}</span>
                  </h4>
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    <strong>Submitted on:</strong> {submittedOnDate}
                  </p>
                  <p className="text-xs text-slate-700 dark:text-slate-300 max-w-md mx-auto leading-relaxed pt-1">
                    Thank you, <strong>{fromName}</strong>. Our ICAR/KVK agronomists and support engineers have received your inquiry for farm location <strong>{farmLocation}</strong>. We will reach back via phone/email within <strong>2 to 4 business hours</strong>.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <a
                    href={`https://wa.me/919876543210?text=${whatsappMessage}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5"
                  >
                    <MessageSquare className="size-3.5" />
                    <span>Open in WhatsApp</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => setActiveTab('history')}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <History className="size-3.5" />
                    <span>View Request History</span>
                  </button>

                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 rounded-xl frosted-glass-sub hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold"
                  >
                    Submit Another Query
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl bg-[var(--brand-color,#0f9a58)] text-white text-xs font-bold"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              /* Query Submission Form */
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Your Full Name / Kisan Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={fromName}
                      onChange={(e) => setFromName(e.target.value)}
                      placeholder="e.g. Ramesh Patil"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[var(--brand-color,#0f9a58)]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Phone Number (for SMS / Call back)
                    </label>
                    <input
                      type="tel"
                      value={userPhone}
                      onChange={(e) => setUserPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[var(--brand-color,#0f9a58)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      placeholder="farmer@agrisence.in"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[var(--brand-color,#0f9a58)]"
                    />
                  </div>

                  {/* Farm Location Field */}
                  <div>
                    <div className="mb-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <MapPin className="size-3 text-[var(--brand-color,#0f9a58)]" />
                        <span>Farm Location / Parcel *</span>
                      </label>
                    </div>
                    <input
                      type="text"
                      required
                      value={farmLocation}
                      onChange={(e) => setFarmLocation(e.target.value)}
                      placeholder="e.g. Shirur, Pune, Maharashtra"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[var(--brand-color,#0f9a58)] font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Issue Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[var(--brand-color,#0f9a58)]"
                  >
                    <option value="Pest Outbreak Report & Agronomic Advice">Pest Outbreak Report & Agronomic Advice</option>
                    <option value="Agri-Input Procurement & Kisan Shop Guidance">Agri-Input Procurement & Kisan Shop Guidance</option>
                    <option value="Soil Health Card & Fertilizer Balancing">Soil Health Card & Fertilizer Balancing</option>
                    <option value="PM-KISAN / PMFBY Government Scheme Application">PM-KISAN / PMFBY Govt Scheme Support</option>
                    <option value="Mandi Price & APMC Arbitrage Inquiries">Mandi Price & APMC Arbitrage Inquiries</option>
                    <option value="AgriSence Account / Telemetry Technical Support">AgriSence App Technical Support</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Subject / Brief Summary
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Need urgent dosage for FAW larvae on 4 acres maize"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[var(--brand-color,#0f9a58)]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Message Details & Field Observation *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe crop symptoms, parcel location, current fertilizer dosage, or specific inquiry..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[var(--brand-color,#0f9a58)]"
                  />
                </div>

                {errorMessage && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                    <AlertCircle className="size-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
                    <ShieldCheck className="size-4 text-[var(--brand-color,#0f9a58)]" />
                    <span>Free ICAR/KVK Agronomist consultation</span>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <a
                      href={`https://wa.me/919876543210?text=${whatsappMessage}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <MessageSquare className="size-3.5" />
                      <span>WhatsApp Desk</span>
                    </a>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 sm:flex-initial px-5 py-2 rounded-xl bg-[var(--brand-color,#0f9a58)] hover:bg-[var(--brand-hover,#0d844b)] text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 cursor-pointer transition-transform hover:scale-[1.02] disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <span>Transmitting Dispatch...</span>
                      ) : (
                        <>
                          <Send className="size-3.5" />
                          <span>Dispatch Support Ticket</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
