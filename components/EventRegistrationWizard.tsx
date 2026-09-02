'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EventItem } from '@/lib/events';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface MemberData {
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
  // Step 2: Confirmation Decree
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

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [registrationCode, setRegistrationCode] = useState<string>('');
  const [submissionToken, setSubmissionToken] = useState<string>('');
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
        for (let i = 0; i < currentMembersList.length; i++) {
          if (i !== memberIdx && currentMembersList[i].email?.trim().toLowerCase() === val.toLowerCase()) {
            return 'This email is already used by another team member.';
          }
        }
        return '';

      case 'phone':
        if (!val) return 'Phone number is required.';
        if (!isValidIndianPhone(val)) {
          return 'Please enter a valid 10-digit phone number.';
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
    const m = membersList[memberIdx] || { name: '', email: '', phone: '', college: '', year: 'FE', branch: '' };
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
          { name: '', email: '', phone: '', college: current?.college || '', year: 'FE', branch: '' },
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
          { name: '', email: '', phone: '', college: last?.college || '', year: 'FE', branch: '' },
          { name: '', email: '', phone: '', college: last?.college || '', year: 'FE', branch: '' },
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
        { name: '', email: '', phone: '', college: last?.college || '', year: 'FE', branch: '' },
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

  // ── Step 2: Final Submit ──
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isCtf && ![2, 4].includes(members.length)) {
      setErrorMessage('Capture the Flag requires exactly 2 or 4 team members.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE}/registrations`, {
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

      const data = await response.json();

      if (!response.ok || !data.success) {
        if (data.errors && Array.isArray(data.errors)) {
          throw new Error(data.errors.join(' • '));
        }
        throw new Error(data.message || 'Registration failed. Please verify your details.');
      }

      setRegistrationCode(data.data.registrationId);
      if (data.data.submissionToken) {
        setSubmissionToken(data.data.submissionToken);
      }
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

                <div className="reg-fields-grid">
                  {/* Name */}
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

                  {/* Email */}
                  <div className="reg-field-wrap">
                    <input
                      type="email"
                      value={members[currentMemberIndex]?.email || ''}
                      onChange={(e) => handleFieldChange('email', e.target.value)}
                      onBlur={() => handleFieldBlur('email')}
                      placeholder="EMAIL ID"
                      className={`reg-input full-width ${currentTouched.email && currentErrors.email ? 'reg-input-error' : ''}`}
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

                  {/* Row 3: College, Year, Branch */}
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

            {/* ── Step 2: Confirmation Decree Step ── */}
            {step === 2 && !isSuccess && (
              <form onSubmit={handleFinalSubmit} noValidate className="reg-form-step">
                <div className="reg-header-with-line">
                  <h2 className="reg-step-title">CONFIRM REGISTRATION</h2>
                  <div className="reg-underline" />
                </div>

                <p className="reg-fee-display">
                  Trial: <strong style={{ color: '#c9a45c' }}>{event.name}</strong>
                </p>

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
                    {members.map((m, idx) => (
                      <li key={idx}>
                        {m.name || `Member ${idx + 1}`} &lt;{m.email}&gt; • {m.phone} — {m.college || 'College'} ({m.year})
                      </li>
                    ))}
                  </ul>
                </div>

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

            {/* ── Success Screen ── */}
            {isSuccess && (
              <div className="reg-success-view">
                <div className="reg-success-badge">✓</div>
                <h2 className="reg-success-title">REGISTRATION CONFIRMED!</h2>
                <p className="reg-success-sub">You have successfully registered for {event.name}.</p>

                <div className="reg-ticket-box">
                  <span className="reg-ticket-label">YOUR PASS ID:</span>
                  <span className="reg-ticket-code">{registrationCode}</span>
                </div>

                {isCtf && submissionToken && (
                  <div
                    style={{
                      background: 'rgba(10, 14, 20, 0.8)',
                      border: '1px solid #76552f',
                      borderRadius: '6px',
                      padding: '12px',
                      margin: '16px 0',
                      wordBreak: 'break-all',
                    }}
                  >
                    <span style={{ color: '#c9a45c', fontSize: '12px', letterSpacing: '1px', fontWeight: 600 }}>
                      CTF SUBMISSION TOKEN:
                    </span>
                    <p style={{ color: '#e8d8b0', fontFamily: 'monospace', fontSize: '13px', margin: '4px 0 0' }}>
                      {submissionToken}
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
