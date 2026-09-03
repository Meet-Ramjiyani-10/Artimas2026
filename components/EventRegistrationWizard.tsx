'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EventItem } from '@/lib/events';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface MemberData {
  name: string;
  email: string;
  phone: string;
  college: string;
  year: string;
  branch: string;
}

type MemberField = keyof MemberData;
type MemberErrors = Partial<Record<MemberField, string>>;
type MemberTouched = Partial<Record<MemberField, boolean>>;

interface RegistrationSuccessData {
  registrationId: string;
  eventName: string;
  passId: string;
  teamName: string;
  paymentRequired: boolean;
  payableAmount: number;
  payment?: {
    required: boolean;
    amount: number;
    status: string;
    transactionId?: string;
    screenshotUrl?: string;
  };
  eligibility: {
    allPccoeEligible: boolean;
    pccoeMemberCount: number;
    totalMemberCount: number;
  };
  status: string;
  submissionToken?: string;
}

interface EventRegistrationWizardProps {
  event: EventItem;
}

// ── Validation Utility Functions ──
const isValidEmailFormat = (email: string): boolean => {
  if (!email) return false;
  const regex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return regex.test(email.trim());
};

const isValidIndianPhone = (phone: string): boolean => {
  if (!phone) return false;
  const clean = String(phone).replace(/[\s\-()]/g, '');
  const regex = /^(?:(?:\+91|91|0))?[6-9]\d{9}$/;
  return regex.test(clean);
};

// ── PCCOE Batch Extraction From Email Only ──
export const extractPccoeBatch = (email: string): string | null => {
  if (!email) return null;
  const trimmed = email.trim().toLowerCase();
  if (!trimmed.endsWith('@pccoepune.org')) return null;
  const localPart = trimmed.split('@')[0];
  const match = localPart.match(/(\d{2})$/);
  return match ? match[1] : null;
};

export const ELIGIBLE_PCCOE_BATCHES = ['23', '24', '25', '26'];

export const isMemberPccoeEligible = (member: MemberData): boolean => {
  if (!member || !member.email) return false;
  const batch = extractPccoeBatch(member.email);
  return !!(batch && ELIGIBLE_PCCOE_BATCHES.includes(batch));
};

export default function EventRegistrationWizard({ event }: EventRegistrationWizardProps) {
  const router = useRouter();

  const isCtf = event.slug === 'capture-the-flag';
  const minMembers = isCtf ? 2 : (event.teamConfig?.minMembers ?? 1);
  const maxMembers = isCtf ? 4 : (event.teamConfig?.maxMembers ?? 1);
  const isSolo = maxMembers === 1;

  // Live registration status check
  const [isRegistrationClosed, setIsRegistrationClosed] = useState<boolean>(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState<boolean>(true);

  useEffect(() => {
    fetch(`${API_BASE}/events/${event.slug}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.data) {
          if (json.data.registrationOpen === false || json.data.active === false) {
            setIsRegistrationClosed(true);
          }
        }
      })
      .catch(() => {})
      .finally(() => setIsCheckingStatus(false));
  }, [event.slug]);

  // Multi-step state:
  // Step 0: Team Name / Participant Name
  // Step 1: Member Details
  // Step 2: Confirmation Decree & Payment
  const [step, setStep] = useState<number>(0);
  const [teamName, setTeamName] = useState<string>('');
  const [teamNameTouched, setTeamNameTouched] = useState<boolean>(false);
  const [teamNameError, setTeamNameError] = useState<string>('');

  const [members, setMembers] = useState<MemberData[]>([
    { name: '', email: '', phone: '', college: '', year: 'FE', branch: '' },
  ]);
  const [currentMemberIndex, setCurrentMemberIndex] = useState<number>(0);

  // Field validation and touched states per member
  const [fieldErrors, setFieldErrors] = useState<Record<number, MemberErrors>>({});
  const [fieldTouched, setFieldTouched] = useState<Record<number, MemberTouched>>({});

  // Payment UI state (for Step 2)
  const [transactionId, setTransactionId] = useState<string>('');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string>('');
  const [paymentErrors, setPaymentErrors] = useState<{ transactionId?: string; screenshot?: string }>({});

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [registrationResult, setRegistrationResult] = useState<RegistrationSuccessData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // ── Single Field Validator ──
  const validateSingleField = (
    field: MemberField,
    value: string,
    memberIdx: number,
    currentMembersList: MemberData[] = members
  ): string => {
    const val = (value || '').trim();

    switch (field) {
      case 'name':
        if (!val) return 'Full name is required.';
        if (val.length < 2) return 'Full name must be at least 2 characters.';
        return '';

      case 'email':
        if (!val) return 'Email ID is required.';
        if (!isValidEmailFormat(val)) return 'Please enter a valid email address.';
        // Duplicate check within team (case-insensitive)
        for (let i = 0; i < currentMembersList.length; i++) {
          if (i !== memberIdx && currentMembersList[i].email?.trim().toLowerCase() === val.toLowerCase()) {
            return 'This email is already used by another team member.';
          }
        }
        return '';

      case 'phone':
        if (!val) return 'Phone number is required.';
        if (!isValidIndianPhone(val)) {
          return 'Please enter a valid 10-digit Indian mobile number.';
        }
        const cleanPhone = val.replace(/[\s\-()]/g, '').slice(-10);
        for (let i = 0; i < currentMembersList.length; i++) {
          if (i !== memberIdx) {
            const otherClean = (currentMembersList[i].phone || '').replace(/[\s\-()]/g, '').slice(-10);
            if (otherClean && otherClean === cleanPhone) {
              return 'This phone number is already used by another team member.';
            }
          }
        }
        return '';

      case 'college':
        if (!val) return 'College name is required.';
        return '';

      case 'year':
        if (!val) return 'Please select your academic year.';
        return '';

      case 'branch':
        if (!val) return 'Branch / Department is required.';
        return '';

      default:
        return '';
    }
  };

  // ── Validate entire member form ──
  const validateMember = (memberIdx: number, membersList: MemberData[] = members): MemberErrors => {
    const m = membersList[memberIdx] || {
      name: '',
      email: '',
      phone: '',
      college: '',
      year: 'FE',
      branch: '',
    };
    const errors: MemberErrors = {};

    const nameErr = validateSingleField('name', m.name, memberIdx, membersList);
    if (nameErr) errors.name = nameErr;

    const emailErr = validateSingleField('email', m.email, memberIdx, membersList);
    if (emailErr) errors.email = emailErr;

    const phoneErr = validateSingleField('phone', m.phone, memberIdx, membersList);
    if (phoneErr) errors.phone = phoneErr;

    const collegeErr = validateSingleField('college', m.college, memberIdx, membersList);
    if (collegeErr) errors.college = collegeErr;

    const yearErr = validateSingleField('year', m.year, memberIdx, membersList);
    if (yearErr) errors.year = yearErr;

    const branchErr = validateSingleField('branch', m.branch, memberIdx, membersList);
    if (branchErr) errors.branch = branchErr;

    return errors;
  };

  // ── Step 0: Team Name Validation & Next ──
  const validateTeamName = (val: string): string => {
    const trimmed = (val || '').trim();
    if (!trimmed) {
      return isSolo ? 'Participant name is required.' : 'Team name is required.';
    }
    if (trimmed.length < 2) {
      return isSolo ? 'Name must be at least 2 characters.' : 'Team name must be at least 2 characters.';
    }
    return '';
  };

  const handleTeamNameChange = (val: string) => {
    setTeamName(val);
    if (teamNameTouched) {
      setTeamNameError(validateTeamName(val));
    }
  };

  const handleTeamNameBlur = () => {
    setTeamNameTouched(true);
    setTeamNameError(validateTeamName(teamName));
  };

  const handleTeamNameNext = (e: React.FormEvent) => {
    e.preventDefault();
    setTeamNameTouched(true);
    const err = validateTeamName(teamName);
    setTeamNameError(err);

    if (err) return;

    setErrorMessage('');
    setStep(1);
    setCurrentMemberIndex(0);
  };

  // ── Step 1: Member Field Changes & Blurs ──
  // Preserve exact casing entered by user for all fields, especially email
  const handleFieldChange = (field: MemberField, value: string) => {
    setMembers((prev) => {
      const updated = [...prev];
      if (updated[currentMemberIndex]) {
        updated[currentMemberIndex] = { ...updated[currentMemberIndex], [field]: value };
      }

      if (fieldTouched[currentMemberIndex]?.[field]) {
        const error = validateSingleField(field, value, currentMemberIndex, updated);
        setFieldErrors((prevErr) => ({
          ...prevErr,
          [currentMemberIndex]: {
            ...prevErr[currentMemberIndex],
            [field]: error,
          },
        }));
      }

      return updated;
    });
  };

  const handleFieldBlur = (field: MemberField) => {
    setFieldTouched((prev) => ({
      ...prev,
      [currentMemberIndex]: {
        ...prev[currentMemberIndex],
        [field]: true,
      },
    }));

    const currentValue = members[currentMemberIndex]?.[field] || '';
    const error = validateSingleField(field, currentValue, currentMemberIndex, members);

    setFieldErrors((prev) => ({
      ...prev,
      [currentMemberIndex]: {
        ...prev[currentMemberIndex],
        [field]: error,
      },
    }));
  };

  // ── Step 1: Member Next Button ──
  const handleMemberNext = (e: React.FormEvent) => {
    e.preventDefault();

    setFieldTouched((prev) => ({
      ...prev,
      [currentMemberIndex]: {
        name: true,
        email: true,
        phone: true,
        college: true,
        year: true,
        branch: true,
      },
    }));

    const errors = validateMember(currentMemberIndex, members);
    setFieldErrors((prev) => ({
      ...prev,
      [currentMemberIndex]: errors,
    }));

    if (Object.values(errors).some(Boolean)) {
      setErrorMessage('Please correct the highlighted fields before proceeding.');
      return;
    }

    setErrorMessage('');

    const nextIdx = currentMemberIndex + 1;
    if (nextIdx < minMembers) {
      if (members.length <= nextIdx) {
        const current = members[currentMemberIndex];
        setMembers((prev) => [
          ...prev,
          {
            name: '',
            email: '',
            phone: '',
            college: current?.college || '',
            year: 'FE',
            branch: '',
          },
        ]);
      }
      setCurrentMemberIndex(nextIdx);
    } else {
      if (nextIdx < members.length) {
        setCurrentMemberIndex(nextIdx);
      } else {
        if (isCtf && ![2, 4].includes(members.length)) {
          setErrorMessage('Capture the Flag requires exactly 2 or 4 team members.');
          return;
        }
        setStep(2);
      }
    }
  };

  // ── Add optional member ──
  const handleAddOptionalMember = () => {
    const errors = validateMember(currentMemberIndex, members);
    if (Object.values(errors).some(Boolean)) {
      setFieldTouched((prev) => ({
        ...prev,
        [currentMemberIndex]: {
          name: true,
          email: true,
          phone: true,
          college: true,
          year: true,
          branch: true,
        },
      }));
      setFieldErrors((prev) => ({
        ...prev,
        [currentMemberIndex]: errors,
      }));
      setErrorMessage('Please complete the current member details first.');
      return;
    }

    setErrorMessage('');

    if (isCtf) {
      if (members.length === 2) {
        const last = members[members.length - 1];
        setMembers((prev) => [
          ...prev,
          {
            name: '',
            email: '',
            phone: '',
            college: last?.college || '',
            year: 'FE',
            branch: '',
          },
          {
            name: '',
            email: '',
            phone: '',
            college: last?.college || '',
            year: 'FE',
            branch: '',
          },
        ]);
        setCurrentMemberIndex(2);
        setStep(1);
      }
      return;
    }

    if (members.length < maxMembers) {
      const last = members[members.length - 1];
      setMembers((prev) => [
        ...prev,
        {
          name: '',
          email: '',
          phone: '',
          college: last?.college || '',
          year: 'FE',
          branch: '',
        },
      ]);
      setCurrentMemberIndex(members.length);
      setStep(1);
    }
  };

  // ── Handle Previous Navigation ──
  const handlePrev = () => {
    setErrorMessage('');
    if (step === 2) {
      setStep(1);
      setCurrentMemberIndex(members.length - 1);
    } else if (step === 1) {
      if (currentMemberIndex > 0) {
        setCurrentMemberIndex(currentMemberIndex - 1);
      } else {
        setStep(0);
      }
    }
  };

  // ── Screenshot File Selection ──
  const handleScreenshotFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setPaymentErrors((prev) => ({
        ...prev,
        screenshot: 'Allowed formats: JPG, JPEG, PNG, or WebP.',
      }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setPaymentErrors((prev) => ({
        ...prev,
        screenshot: 'Screenshot size must not exceed 5MB.',
      }));
      return;
    }

    setScreenshotFile(file);
    setPaymentErrors((prev) => ({ ...prev, screenshot: '' }));

    const reader = new FileReader();
    reader.onload = () => {
      setScreenshotPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // ── Step 2: Final Submit ──
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isCtf && ![2, 4].includes(members.length)) {
      setErrorMessage('Capture the Flag requires exactly 2 or 4 team members.');
      return;
    }

    // Eligibility check
    const pccoeCount = members.filter(isMemberPccoeEligible).length;
    const isAllPccoe = pccoeCount === members.length;
    const paymentRequired = !isAllPccoe && event.fee > 0;

    // Validate payment fields if payment is required
    if (paymentRequired) {
      const pErrors: { transactionId?: string; screenshot?: string } = {};
      if (!transactionId.trim()) {
        pErrors.transactionId = 'Transaction ID is required for payment verification.';
      }
      if (!screenshotFile) {
        pErrors.screenshot = 'Payment screenshot is required.';
      }

      if (Object.keys(pErrors).length > 0) {
        setPaymentErrors(pErrors);
        setErrorMessage('Please provide both the Transaction ID and Payment Screenshot.');
        return;
      }
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      let response: Response;

      if (paymentRequired && screenshotFile) {
        // Submit using FormData to stream screenshot to Cloudinary
        const formData = new FormData();
        formData.append('eventSlug', event.slug);
        formData.append('teamName', teamName.trim() || members[0]?.name || '');
        formData.append('members', JSON.stringify(members));
        formData.append('transactionId', transactionId.trim());
        formData.append('paymentScreenshot', screenshotFile);

        response = await fetch(`${API_BASE}/registrations`, {
          method: 'POST',
          body: formData,
        });
      } else {
        // Submit JSON for ₹0 PCCOE registrations
        response = await fetch(`${API_BASE}/registrations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            eventSlug: event.slug,
            teamName: teamName.trim() || members[0]?.name || '',
            members,
          }),
        });
      }

      const data = await response.json();

      if (!response.ok || !data.success) {
        if (data.errors && Array.isArray(data.errors)) {
          throw new Error(data.errors.join(' • '));
        }
        throw new Error(data.message || 'Registration failed. Please verify your details.');
      }

      setRegistrationResult(data.data);
      setIsSuccess(true);
    } catch (error: any) {
      setErrorMessage(error.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMemberTitle = (index: number) => {
    if (isSolo) return 'PARTICIPANT DETAILS';
    if (index === 0) return 'TEAM LEADER';
    if (index === 1) return isCtf ? 'SECOND AGENT' : 'SECOND MEMBER';
    if (index === 2) return isCtf ? 'THIRD AGENT' : 'THIRD MEMBER';
    if (index === 3) return isCtf ? 'FOURTH AGENT' : 'FOURTH MEMBER';
    return `MEMBER ${index + 1}`;
  };

  const currentErrors = fieldErrors[currentMemberIndex] || {};
  const currentTouched = fieldTouched[currentMemberIndex] || {};

  // Eligibility calculation for step 2 preview
  const pccoeMemberCount = members.filter(isMemberPccoeEligible).length;
  const allPccoeEligible = pccoeMemberCount === members.length;
  const paymentRequired = !allPccoeEligible && event.fee > 0;

  // Derive schedule and location metadata cleanly
  const scheduleDate = event.dateLocation?.split('·')[0]?.trim() || '18-20 October 2026';
  const scheduleVenue = event.dateLocation?.split('·')[1]?.trim() || 'PCCOE Campus / Online Arena';
  const eventTime = '10:00 AM – 05:00 PM IST';

  // If registration is closed for this event, render decree closed state
  if (!isCheckingStatus && isRegistrationClosed) {
    return (
      <div className="reg-stage-wrapper">
        <div className="reg-top-bar">
          <Link href="/events" className="reg-back-btn">
            ← BACK TO EVENTS
          </Link>
          <span className="reg-tag">{event.yuga} • {event.category}</span>
        </div>

        <div className="reg-card-stage">
          <div className="decree-card-panel decree-reg-panel" style={{ maxWidth: '640px', margin: '40px auto' }}>
            <div className="decree-corner top-left" aria-hidden="true" />
            <div className="decree-corner top-right" aria-hidden="true" />
            <div className="decree-corner bottom-left" aria-hidden="true" />
            <div className="decree-corner bottom-right" aria-hidden="true" />

            <div className="decree-inner-frame reg-inner-frame" style={{ textAlign: 'center', padding: '48px 28px' }}>
              <h1 className="decree-title reg-title">{event.name}</h1>
              <p className="decree-trial-subtitle reg-subtitle">
                {event.category.toUpperCase()} | EPOCH TRIAL
              </p>

              <div className="decree-ornament-divider" aria-hidden="true" style={{ margin: '18px auto' }}>
                <span className="decree-divider-line" />
                <span className="decree-divider-gem">◆</span>
                <span className="decree-divider-line" />
              </div>

              <div
                style={{
                  background: 'rgba(25, 12, 12, 0.75)',
                  border: '1px solid #76552f',
                  borderRadius: '6px',
                  padding: '24px 20px',
                  margin: '28px 0',
                }}
              >
                <div style={{ color: '#ff6b6b', fontSize: '24px', marginBottom: '8px' }}>●</div>
                <h3 style={{ color: '#e8d8b0', fontSize: '20px', letterSpacing: '2px', margin: '0 0 10px' }}>
                  REGISTRATION CLOSED
                </h3>
                <p style={{ color: '#c5b18a', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
                  Registration for <strong style={{ color: '#c9a45c' }}>{event.name}</strong> is currently closed by the festival organizers.
                </p>
              </div>

              <Link href="/events" className="reg-action-btn next-btn" style={{ maxWidth: '260px', margin: '0 auto', display: 'inline-flex' }}>
                RETURN TO EVENTS
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reg-stage-wrapper">
      {/* ── Outer Navigation Back ── */}
      <div className="reg-top-bar">
        <Link href="/events" className="reg-back-btn">
          ← BACK TO EVENTS
        </Link>
        <span className="reg-tag">{event.yuga} • {event.category}</span>
      </div>

      {/* ── Main Parchment Stage (Decree panel) ── */}
      <div className="reg-card-stage">
        <div className="decree-card-panel decree-reg-panel">
          {/* Ornamental Decree Corner Brackets */}
          <div className="decree-corner top-left" aria-hidden="true" />
          <div className="decree-corner top-right" aria-hidden="true" />
          <div className="decree-corner bottom-left" aria-hidden="true" />
          <div className="decree-corner bottom-right" aria-hidden="true" />

          <div className="decree-inner-frame reg-inner-frame">
            {/* ── Step 0: Team Name Step ── */}
            {step === 0 && !isSuccess && (
              <form onSubmit={handleTeamNameNext} noValidate className="reg-form-step">
                {event.overheadTitle && (
                  <span className="decree-overhead-title reg-overhead-title">{event.overheadTitle}</span>
                )}
                <h1 className="decree-title reg-title">{event.name}</h1>
                <p className="decree-trial-subtitle reg-subtitle">
                  {event.ruleSubtitle || `${event.category.toUpperCase()} | REGISTRATION`}
                </p>

                <div className="decree-ornament-divider" aria-hidden="true">
                  <span className="decree-divider-line" />
                  <span className="decree-divider-gem">◆</span>
                  <span className="decree-divider-line" />
                </div>

                <div className="reg-input-group">
                  <div className="reg-field-wrap">
                    <input
                      type="text"
                      value={teamName}
                      onChange={(e) => handleTeamNameChange(e.target.value)}
                      onBlur={handleTeamNameBlur}
                      placeholder={isSolo ? 'ENTER PARTICIPANT NAME' : 'ENTER TEAM NAME'}
                      className={`reg-input ${teamNameTouched && teamNameError ? 'reg-input-error' : ''}`}
                      autoFocus
                    />
                    {teamNameTouched && teamNameError && (
                      <span className="reg-field-error">⚠ {teamNameError}</span>
                    )}
                  </div>
                </div>

                {isCtf && (
                  <p className="reg-fee-display" style={{ fontSize: '13px', color: '#c9a45c', marginTop: '12px' }}>
                    ⚔ CTF Trial Protocol: Teams must consist of <strong>exactly 2 or 4 members</strong>.
                  </p>
                )}

                {errorMessage && <p className="reg-error-msg">{errorMessage}</p>}

                <button type="submit" className="reg-action-btn next-btn">
                  NEXT
                </button>
              </form>
            )}

            {/* ── Step 1: Member Details Step ── */}
            {step === 1 && !isSuccess && (
              <form onSubmit={handleMemberNext} noValidate className="reg-form-step">
                <div className="reg-header-with-line">
                  <h2 className="reg-step-title">{getMemberTitle(currentMemberIndex)}</h2>
                  <div className="reg-underline" />
                </div>

                {/* Prominent PCCOE Instruction Banner */}
                <div
                  style={{
                    background: 'rgba(201, 164, 92, 0.12)',
                    border: '1px solid rgba(201, 164, 92, 0.45)',
                    borderRadius: '6px',
                    padding: '10px 14px',
                    marginBottom: '14px',
                    fontSize: '13px',
                    color: '#f0dfba',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    lineHeight: '1.4',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: '16px', color: '#c9a45c' }}>ℹ</span>
                  <span>
                    <strong>PCCOE students:</strong> Please use your official PCCOE college email with batch identifier (e.g. <code>name24@pccoepune.org</code>).
                  </span>
                </div>

                <div className="reg-fields-grid">
                  {/* Full Name */}
                  <div className="reg-field-wrap">
                    <input
                      type="text"
                      value={members[currentMemberIndex]?.name || ''}
                      onChange={(e) => handleFieldChange('name', e.target.value)}
                      onBlur={() => handleFieldBlur('name')}
                      placeholder="FULL NAME"
                      className={`reg-input full-width ${currentTouched.name && currentErrors.name ? 'reg-input-error' : ''}`}
                      autoFocus
                    />
                    {currentTouched.name && currentErrors.name && (
                      <span className="reg-field-error">⚠ {currentErrors.name}</span>
                    )}
                  </div>

                  {/* Email ID (Preserves user typed casing) */}
                  <div className="reg-field-wrap">
                    <input
                      type="email"
                      value={members[currentMemberIndex]?.email || ''}
                      onChange={(e) => handleFieldChange('email', e.target.value)}
                      onBlur={() => handleFieldBlur('email')}
                      placeholder="EMAIL ID (e.g. name24@pccoepune.org)"
                      className={`reg-input reg-input-email full-width ${currentTouched.email && currentErrors.email ? 'reg-input-error' : ''}`}
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck="false"
                    />
                    {currentTouched.email && currentErrors.email && (
                      <span className="reg-field-error">⚠ {currentErrors.email}</span>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="reg-field-wrap">
                    <input
                      type="tel"
                      value={members[currentMemberIndex]?.phone || ''}
                      onChange={(e) => handleFieldChange('phone', e.target.value)}
                      onBlur={() => handleFieldBlur('phone')}
                      placeholder="PHONE NUMBER (10 DIGITS)"
                      className={`reg-input full-width ${currentTouched.phone && currentErrors.phone ? 'reg-input-error' : ''}`}
                    />
                    {currentTouched.phone && currentErrors.phone && (
                      <span className="reg-field-error">⚠ {currentErrors.phone}</span>
                    )}
                  </div>

                  {/* Row 3: College, Academic Year, Branch (No separate admission batch field) */}
                  <div className="reg-row-3">
                    <div className="reg-field-wrap">
                      <input
                        type="text"
                        value={members[currentMemberIndex]?.college || ''}
                        onChange={(e) => handleFieldChange('college', e.target.value)}
                        onBlur={() => handleFieldBlur('college')}
                        placeholder="COLLEGE"
                        className={`reg-input col-field ${currentTouched.college && currentErrors.college ? 'reg-input-error' : ''}`}
                      />
                      {currentTouched.college && currentErrors.college && (
                        <span className="reg-field-error">⚠ {currentErrors.college}</span>
                      )}
                    </div>

                    <div className="reg-field-wrap">
                      <select
                        value={members[currentMemberIndex]?.year || 'FE'}
                        onChange={(e) => handleFieldChange('year', e.target.value)}
                        onBlur={() => handleFieldBlur('year')}
                        className={`reg-select col-field ${currentTouched.year && currentErrors.year ? 'reg-input-error' : ''}`}
                      >
                        <option value="FE">FE (1st Yr)</option>
                        <option value="SE">SE (2nd Yr)</option>
                        <option value="TE">TE (3rd Yr)</option>
                        <option value="BE">BE (4th Yr)</option>
                      </select>
                      {currentTouched.year && currentErrors.year && (
                        <span className="reg-field-error">⚠ {currentErrors.year}</span>
                      )}
                    </div>

                    <div className="reg-field-wrap">
                      <input
                        type="text"
                        value={members[currentMemberIndex]?.branch || ''}
                        onChange={(e) => handleFieldChange('branch', e.target.value)}
                        onBlur={() => handleFieldBlur('branch')}
                        placeholder="BRANCH"
                        className={`reg-input col-field ${currentTouched.branch && currentErrors.branch ? 'reg-input-error' : ''}`}
                      />
                      {currentTouched.branch && currentErrors.branch && (
                        <span className="reg-field-error">⚠ {currentErrors.branch}</span>
                      )}
                    </div>
                  </div>
                </div>

                {errorMessage && <p className="reg-error-msg">{errorMessage}</p>}

                <div className="reg-btn-row">
                  <button type="button" onClick={handlePrev} className="reg-secondary-btn">
                    PREV
                  </button>

                  {/* Add member button */}
                  {isCtf ? (
                    members.length === 2 && currentMemberIndex === 1 && (
                      <button type="button" onClick={handleAddOptionalMember} className="reg-optional-btn">
                        + ADD 2 AGENTS (MAX 4)
                      </button>
                    )
                  ) : (
                    members.length < maxMembers &&
                    currentMemberIndex === members.length - 1 &&
                    currentMemberIndex + 1 >= minMembers && (
                      <button type="button" onClick={handleAddOptionalMember} className="reg-optional-btn">
                        + ADD MEMBER
                      </button>
                    )
                  )}

                  <button type="submit" className="reg-action-btn next-btn">
                    NEXT
                  </button>
                </div>
              </form>
            )}

            {/* ── Step 2: Confirmation Decree & Payment Step ── */}
            {step === 2 && !isSuccess && (
              <form onSubmit={handleFinalSubmit} noValidate className="reg-form-step">
                <div className="reg-header-with-line">
                  <h2 className="reg-step-title">CONFIRM REGISTRATION</h2>
                  <div className="reg-underline" />
                </div>

                <p className="reg-fee-display">
                  Trial: <strong style={{ color: '#c9a45c' }}>{event.name}</strong>
                </p>

                {/* Team & Member Details */}
                <div
                  style={{
                    background: 'rgba(15, 20, 25, 0.6)',
                    border: '1px solid rgba(118, 85, 47, 0.4)',
                    borderRadius: '8px',
                    padding: '16px',
                    margin: '16px 0',
                    textAlign: 'left',
                  }}
                >
                  <p style={{ margin: '0 0 8px', color: '#e8d8b0', fontSize: '14px', letterSpacing: '1px' }}>
                    <strong>Team / Entry:</strong> {teamName.trim() || members[0]?.name}
                  </p>
                  <p style={{ margin: '0 0 12px', color: '#9a8866', fontSize: '13px' }}>
                    Total Members: {members.length} {isCtf ? '(2 or 4 Protocol Verified)' : ''}
                  </p>
                  <ul style={{ margin: 0, paddingLeft: '18px', color: '#c5b18a', fontSize: '13px', lineHeight: '1.6' }}>
                    {members.map((m, idx) => {
                      const isPccoe = isMemberPccoeEligible(m);
                      const batch = extractPccoeBatch(m.email);
                      return (
                        <li key={idx}>
                          <strong style={{ color: '#e8d8b0' }}>{m.name || `Member ${idx + 1}`}</strong> &lt;{m.email}&gt; • {m.phone} — {m.college || 'College'} ({m.year}, {m.branch || 'Dept'})
                          {isPccoe && (
                            <span style={{ marginLeft: '6px', color: '#4ade80', fontSize: '11px', fontWeight: 600 }}>
                              [PCCOE Batch 20{batch}]
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {/* ── Case 1: PCCOE 100% Free Registrations ── */}
                {allPccoeEligible && (
                  <div
                    style={{
                      background: 'rgba(34, 197, 94, 0.09)',
                      border: '1px solid rgba(34, 197, 94, 0.45)',
                      borderRadius: '8px',
                      padding: '18px',
                      margin: '18px 0',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#4ade80', letterSpacing: '1px' }}>
                        NO PAYMENT REQUIRED
                      </span>
                      <span style={{ fontSize: '18px', fontWeight: 700, color: '#4ade80' }}>
                        ₹0
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '13px', color: '#e8d8b0', lineHeight: '1.5' }}>
                      All team members are verified PCCOE students (Batches 23-26). No payment is required for your entry.
                    </p>
                  </div>
                )}

                {/* ── Case 2: Payment Required (Mixed or External Teams) ── */}
                {paymentRequired && (
                  <div className="reg-payment-section">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#facc15', letterSpacing: '1.5px' }}>
                        PAYMENT REQUIRED
                      </span>
                      <span style={{ fontSize: '18px', fontWeight: 700, color: '#e8d8b0' }}>
                        Registration Fee: ₹{event.fee}
                      </span>
                    </div>

                    <p style={{ margin: '0 0 14px', fontSize: '13px', color: '#9a8866', lineHeight: '1.5' }}>
                      At least one team member is outside the PCCOE eligibility criteria. Standard event registration fee applies to the entire team.
                    </p>

                    {/* QR Code */}
                    <div className="reg-qr-wrapper">
                      <img
                        src={event.paymentQrUrl || '/images/payment-qr.svg'}
                        alt="Payment QR Code"
                        className="reg-qr-img"
                      />
                      <p className="reg-qr-instruction">Scan the QR code to make the payment.</p>
                      <span className="reg-upi-id">UPI ID: {event.upiId || 'artimas2026@upi'}</span>
                    </div>

                    {/* Transaction ID Input */}
                    <div className="reg-field-wrap" style={{ marginTop: '16px' }}>
                      <label style={{ fontSize: '11px', color: '#9a8866', letterSpacing: '1px', marginBottom: '4px' }}>
                        TRANSACTION ID / UTR NUMBER *
                      </label>
                      <input
                        type="text"
                        value={transactionId}
                        onChange={(e) => {
                          setTransactionId(e.target.value);
                          if (paymentErrors.transactionId) {
                            setPaymentErrors((prev) => ({ ...prev, transactionId: '' }));
                          }
                        }}
                        placeholder="ENTER 12-DIGIT TRANSACTION ID"
                        className={`reg-input reg-input-nocase full-width ${paymentErrors.transactionId ? 'reg-input-error' : ''}`}
                      />
                      {paymentErrors.transactionId && (
                        <span className="reg-field-error">⚠ {paymentErrors.transactionId}</span>
                      )}
                    </div>

                    {/* Payment Screenshot Upload */}
                    <div className="reg-field-wrap" style={{ marginTop: '16px' }}>
                      <label style={{ fontSize: '11px', color: '#9a8866', letterSpacing: '1px', marginBottom: '4px' }}>
                        PAYMENT SCREENSHOT *
                      </label>
                      <div className="reg-upload-dropzone">
                        <input
                          type="file"
                          id="payment-screenshot-input"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          onChange={handleScreenshotFileChange}
                          style={{ display: 'none' }}
                        />
                        <label htmlFor="payment-screenshot-input" className="reg-upload-trigger">
                          {screenshotPreview ? (
                            <div className="reg-screenshot-preview">
                              <img src={screenshotPreview} alt="Screenshot Preview" />
                              <span>Click to change screenshot</span>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', color: '#c5b18a', padding: '10px' }}>
                              <span style={{ fontSize: '24px' }}>📁</span>
                              <span style={{ fontSize: '13.5px', fontWeight: 600 }}>Click to upload payment screenshot</span>
                              <span style={{ fontSize: '11px', color: '#9a8866' }}>Supported formats: JPG, JPEG, PNG, WebP (max 5MB)</span>
                            </div>
                          )}
                        </label>
                      </div>
                      {paymentErrors.screenshot && (
                        <span className="reg-field-error">⚠ {paymentErrors.screenshot}</span>
                      )}
                    </div>
                  </div>
                )}

                <p style={{ color: '#9a8866', fontSize: '12px', textAlign: 'center', margin: '8px 0 20px' }}>
                  Click below to seal your entry. Your registration will be confirmed immediately.
                </p>

                {errorMessage && <p className="reg-error-msg">{errorMessage}</p>}

                <div className="reg-btn-row">
                  <button type="button" onClick={handlePrev} className="reg-secondary-btn">
                    PREV
                  </button>

                  <button type="submit" disabled={isSubmitting} className="reg-action-btn submit-btn">
                    {isSubmitting ? 'SEALING REGISTRATION...' : 'CONFIRM REGISTRATION'}
                  </button>
                </div>
              </form>
            )}

            {/* ── Step 3: Redesigned Simple & Easy-to-Understand Confirmation Page ── */}
            {isSuccess && (
              <div className="reg-success-view">
                <div className="reg-success-badge">✓</div>
                <h2 className="reg-success-title">REGISTRATION CONFIRMED</h2>
                <p className="reg-success-sub">Your entry into the trial has been sealed in the archives.</p>

                {/* Main Clean Confirmation Card */}
                <div className="reg-confirm-card">
                  <div className="reg-confirm-grid">
                    <div className="reg-confirm-item">
                      <span className="reg-confirm-label">Event</span>
                      <span className="reg-confirm-val" style={{ color: '#c9a45c', fontSize: '17px' }}>
                        {event.name}
                      </span>
                    </div>

                    <div className="reg-confirm-item">
                      <span className="reg-confirm-label">Pass ID</span>
                      <span className="reg-confirm-val" style={{ color: '#c9a45c', fontFamily: 'monospace', letterSpacing: '2px', fontSize: '17px' }}>
                        {registrationResult?.passId || registrationResult?.registrationId}
                      </span>
                    </div>

                    <div className="reg-confirm-item">
                      <span className="reg-confirm-label">{isSolo ? 'Participant' : 'Team'}</span>
                      <span className="reg-confirm-val">
                        {registrationResult?.teamName || teamName || members[0]?.name}
                      </span>
                    </div>

                    <div className="reg-confirm-item">
                      <span className="reg-confirm-label">Registration</span>
                      <span className="reg-confirm-val" style={{ color: '#4ade80' }}>
                        ✓ Confirmed
                      </span>
                    </div>

                    <div className="reg-confirm-item" style={{ gridColumn: '1 / -1' }}>
                      <span className="reg-confirm-label">Payment</span>
                      <span
                        className="reg-confirm-val"
                        style={{
                          color: registrationResult?.payment?.required || registrationResult?.paymentRequired ? '#facc15' : '#4ade80',
                          fontSize: '15px',
                        }}
                      >
                        {registrationResult?.payment?.required || registrationResult?.paymentRequired
                          ? `₹${registrationResult?.payment?.amount || registrationResult?.payableAmount || event.fee} — Verification Pending`
                          : 'No payment required'}
                      </span>
                    </div>
                  </div>

                  {/* EVENT INFORMATION */}
                  <div className="reg-confirm-section">
                    <h3 className="reg-confirm-section-title">EVENT INFORMATION</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '13.5px' }}>
                      <div>
                        <span style={{ color: '#9a8866' }}>Date:</span>{' '}
                        <strong style={{ color: '#e8d8b0' }}>{scheduleDate}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#9a8866' }}>Time:</span>{' '}
                        <strong style={{ color: '#e8d8b0' }}>{eventTime}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#9a8866' }}>Venue:</span>{' '}
                        <strong style={{ color: '#e8d8b0' }}>{scheduleVenue}</strong>
                      </div>
                    </div>
                  </div>

                  {/* EVENT TIMELINE */}
                  <div className="reg-confirm-section">
                    <h3 className="reg-confirm-section-title">EVENT TIMELINE</h3>
                    <p style={{ margin: 0, fontSize: '13.5px', color: '#e8d8b0', lineHeight: '1.6' }}>
                      {event.ruleSubtitle || event.trialSubtitle || 'Round 1: Preliminary Trials • Round 2: Grand Epoch Finals'}
                    </p>
                  </div>

                  {/* IMPORTANT */}
                  <div className="reg-confirm-section">
                    <h3 className="reg-confirm-section-title">IMPORTANT</h3>
                    <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: '#c5b18a', lineHeight: '1.7' }}>
                      <li>Present your <strong style={{ color: '#e8d8b0' }}>Pass ID: {registrationResult?.passId || registrationResult?.registrationId}</strong> at the venue registration desk.</li>
                      <li>All participants must carry their original college identity cards.</li>
                      <li>Please report to the venue at least 15 minutes prior to event commencement.</li>
                      <li>
                        {registrationResult?.payment?.required || registrationResult?.paymentRequired
                          ? 'Your payment screenshot is under verification. Keep your transaction reference handy at the verification desk.'
                          : 'All team members have been verified under the PCCOE eligibility criteria.'}
                      </li>
                    </ul>
                  </div>
                </div>

                {isCtf && registrationResult?.submissionToken && (
                  <div
                    style={{
                      background: 'rgba(10, 14, 20, 0.8)',
                      border: '1px solid #76552f',
                      borderRadius: '6px',
                      padding: '14px',
                      margin: '16px 0',
                      wordBreak: 'break-all',
                    }}
                  >
                    <span style={{ color: '#c9a45c', fontSize: '12px', letterSpacing: '1px', fontWeight: 600 }}>
                      CTF SUBMISSION TOKEN:
                    </span>
                    <p style={{ color: '#e8d8b0', fontFamily: 'monospace', fontSize: '14px', margin: '4px 0 0' }}>
                      {registrationResult.submissionToken}
                    </p>
                    <span style={{ color: '#888', fontSize: '11px' }}>
                      (Save this token to submit challenge screenshots during the event)
                    </span>
                  </div>
                )}

                <p className="reg-success-note">
                  A confirmation email has been dispatched. Please save your Pass ID for on-desk verification.
                </p>

                <div className="reg-btn-row">
                  <Link href="/events" className="reg-action-btn next-btn">
                    RETURN TO EVENTS
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
