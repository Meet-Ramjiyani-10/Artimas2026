'use client';

import React, { useState, useId } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EventItem } from '@/lib/events';
import { MEDIA } from '@/lib/media';

interface MemberData {
  name: string;
  email: string;
  phone: string;
  college: string;
  year: string;
  branch: string;
  prn: string;
}

interface EventRegistrationWizardProps {
  event: EventItem;
}

export default function EventRegistrationWizard({ event }: EventRegistrationWizardProps) {
  const router = useRouter();
  const fileInputId = useId();

  // Multi-step state
  // Step 0: Team Name
  // Step 1..maxMembers: Member Details
  // Step Last: Payment Details
  const minMembers = event.teamConfig?.minMembers ?? 1;
  const maxMembers = event.teamConfig?.maxMembers ?? 1;
  const isSolo = maxMembers === 1;

  const [step, setStep] = useState<number>(0);
  const [teamName, setTeamName] = useState<string>('');
  const [members, setMembers] = useState<MemberData[]>([
    { name: '', email: '', phone: '', college: '', year: 'FE', branch: '', prn: '' },
  ]);
  const [currentMemberIndex, setCurrentMemberIndex] = useState<number>(0);

  // Payment State
  const [showQR, setShowQR] = useState<boolean>(false);
  const [paymentScreenshotName, setPaymentScreenshotName] = useState<string>('');
  const [transactionId, setTransactionId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [registrationCode, setRegistrationCode] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Handle Team Name Next
  const handleTeamNameNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim() && !isSolo) {
      setErrorMessage('Please enter your team name.');
      return;
    }
    setErrorMessage('');
    setStep(1);
    setCurrentMemberIndex(0);
  };

  // Handle Current Member Next
  const handleMemberNext = (e: React.FormEvent) => {
    e.preventDefault();
    const current = members[currentMemberIndex];
    if (!current?.name.trim() || !current?.email.trim() || !current?.phone.trim()) {
      setErrorMessage('Please fill in required fields (Name, Email, Phone).');
      return;
    }

    setErrorMessage('');

    // Check if we need more compulsory members
    const nextIdx = currentMemberIndex + 1;
    if (nextIdx < minMembers) {
      // Need next compulsory member
      if (members.length <= nextIdx) {
        setMembers((prev) => [
          ...prev,
          { name: '', email: '', phone: '', college: current.college || '', year: 'FE', branch: '', prn: '' },
        ]);
      }
      setCurrentMemberIndex(nextIdx);
    } else {
      // Reached minimum requirement, proceed to either next member or payment
      // If user has already added more members, go through them
      if (nextIdx < members.length) {
        setCurrentMemberIndex(nextIdx);
      } else {
        // Go to payment step
        setStep(2);
      }
    }
  };

  // Add optional member
  const handleAddOptionalMember = () => {
    if (members.length < maxMembers) {
      const last = members[members.length - 1];
      setMembers((prev) => [
        ...prev,
        { name: '', email: '', phone: '', college: last?.college || '', year: 'FE', branch: '', prn: '' },
      ]);
      setCurrentMemberIndex(members.length);
      setStep(1);
    }
  };

  // Handle Previous Navigation
  const handlePrev = () => {
    setErrorMessage('');
    if (step === 2) {
      // Go back to last member
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

  // Update member field
  const updateMemberField = (field: keyof MemberData, value: string) => {
    setMembers((prev) => {
      const updated = [...prev];
      if (updated[currentMemberIndex]) {
        updated[currentMemberIndex] = { ...updated[currentMemberIndex], [field]: value };
      }
      return updated;
    });
  };

  // Handle File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPaymentScreenshotName(file.name);
    }
  };

  // Handle Final Submit
  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionId.trim()) {
      setErrorMessage('Please enter the Transaction ID / UTR number.');
      return;
    }
    setErrorMessage('');
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      const randomCode = `ART26-${event.slug.substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
      setRegistrationCode(randomCode);
      setIsSuccess(true);
    }, 1200);
  };

  // Helper for Member Titles
  const getMemberTitle = (index: number) => {
    if (isSolo) return 'PARTICIPANT DETAILS';
    if (index === 0) return 'TEAM LEADER';
    if (index === 1) return 'SECOND MEMBER';
    if (index === 2) return 'THIRD MEMBER';
    if (index === 3) return 'FOURTH MEMBER';
    return `MEMBER ${index + 1}`;
  };

  return (
    <div className="reg-stage-wrapper">
      {/* ── Outer Navigation Back ── */}
      <div className="reg-top-bar">
        <Link href="/events" className="reg-back-btn">
          ← BACK TO EVENTS
        </Link>
        <span className="reg-tag">{event.yuga} • {event.category}</span>
      </div>

      {/* ── Main Parchment Stage (Exact match to decree panel) ── */}
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
              <form onSubmit={handleTeamNameNext} className="reg-form-step">
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
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder={isSolo ? "ENTER PARTICIPANT NAME" : "ENTER TEAM NAME"}
                    className="reg-input"
                    required
                    autoFocus
                  />
                </div>

              {errorMessage && <p className="reg-error-msg">{errorMessage}</p>}

              <button type="submit" className="reg-action-btn next-btn">
                NEXT
              </button>
            </form>
          )}

          {/* ── Step 1: Member Details Step ── */}
          {step === 1 && !isSuccess && (
            <form onSubmit={handleMemberNext} className="reg-form-step">
              <div className="reg-header-with-line">
                <h2 className="reg-step-title">{getMemberTitle(currentMemberIndex)}</h2>
                <div className="reg-underline" />
              </div>

              <div className="reg-fields-grid">
                <input
                  type="text"
                  value={members[currentMemberIndex]?.name || ''}
                  onChange={(e) => updateMemberField('name', e.target.value)}
                  placeholder="FULL NAME"
                  className="reg-input full-width"
                  required
                  autoFocus
                />

                <input
                  type="email"
                  value={members[currentMemberIndex]?.email || ''}
                  onChange={(e) => updateMemberField('email', e.target.value)}
                  placeholder="EMAIL ID"
                  className="reg-input full-width"
                  required
                />

                <input
                  type="tel"
                  value={members[currentMemberIndex]?.phone || ''}
                  onChange={(e) => updateMemberField('phone', e.target.value)}
                  placeholder="PHONE NUMBER"
                  className="reg-input full-width"
                  required
                />

                <div className="reg-row-3">
                  <input
                    type="text"
                    value={members[currentMemberIndex]?.college || ''}
                    onChange={(e) => updateMemberField('college', e.target.value)}
                    placeholder="COLLEGE"
                    className="reg-input col-field"
                    required
                  />

                  <select
                    value={members[currentMemberIndex]?.year || 'FE'}
                    onChange={(e) => updateMemberField('year', e.target.value)}
                    className="reg-select col-field"
                  >
                    <option value="FE">FE (1st Yr)</option>
                    <option value="SE">SE (2nd Yr)</option>
                    <option value="TE">TE (3rd Yr)</option>
                    <option value="BE">BE (4th Yr)</option>
                  </select>

                  <input
                    type="text"
                    value={members[currentMemberIndex]?.branch || ''}
                    onChange={(e) => updateMemberField('branch', e.target.value)}
                    placeholder="BRANCH"
                    className="reg-input col-field"
                    required
                  />
                </div>

                <input
                  type="text"
                  value={members[currentMemberIndex]?.prn || ''}
                  onChange={(e) => updateMemberField('prn', e.target.value)}
                  placeholder="PRN / ROLL NO"
                  className="reg-input full-width"
                />
              </div>

              {errorMessage && <p className="reg-error-msg">{errorMessage}</p>}

              <div className="reg-btn-row">
                <button type="button" onClick={handlePrev} className="reg-secondary-btn">
                  PREV
                </button>

                {/* If optional member can be added */}
                {members.length < maxMembers && currentMemberIndex === members.length - 1 && currentMemberIndex + 1 >= minMembers && (
                  <button type="button" onClick={handleAddOptionalMember} className="reg-optional-btn">
                    + ADD MEMBER
                  </button>
                )}

                <button type="submit" className="reg-action-btn next-btn">
                  NEXT
                </button>
              </div>
            </form>
          )}

          {/* ── Step 2: Payment Details Step ── */}
          {step === 2 && !isSuccess && (
            <form onSubmit={handleFinalSubmit} className="reg-form-step">
              <div className="reg-header-with-line">
                <h2 className="reg-step-title">PAYMENT DETAILS</h2>
                <div className="reg-underline" />
              </div>

              <p className="reg-fee-display">
                Registration Fee: <span className="reg-fee-amount">₹{event.fee}</span>
              </p>

              <div className="reg-payment-buttons">
                <button
                  type="button"
                  onClick={() => setShowQR((prev) => !prev)}
                  className="reg-qr-btn"
                >
                  {showQR ? 'HIDE QR CODE' : 'SHOW QR CODE'}
                </button>

                <label htmlFor={fileInputId} className="reg-upload-btn">
                  <input
                    id={fileInputId}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="reg-hidden-file"
                  />
                  {paymentScreenshotName ? `FILE: ${paymentScreenshotName.substring(0, 18)}...` : 'UPLOAD PAYMENT SCREENSHOT'}
                </label>
              </div>

              {/* Collapsible / Modal QR Code View */}
              {showQR && (
                <div className="reg-qr-container">
                  <div className="reg-qr-box">
                    <svg viewBox="0 0 120 120" className="reg-qr-svg" fill="#240d02">
                      <rect x="10" y="10" width="30" height="30" fill="none" stroke="#240d02" strokeWidth="4" />
                      <rect x="18" y="18" width="14" height="14" fill="#240d02" />
                      <rect x="80" y="10" width="30" height="30" fill="none" stroke="#240d02" strokeWidth="4" />
                      <rect x="88" y="18" width="14" height="14" fill="#240d02" />
                      <rect x="10" y="80" width="30" height="30" fill="none" stroke="#240d02" strokeWidth="4" />
                      <rect x="18" y="88" width="14" height="14" fill="#240d02" />
                      {/* Decorative Matrix blocks */}
                      <rect x="50" y="20" width="8" height="8" />
                      <rect x="62" y="32" width="8" height="8" />
                      <rect x="50" y="50" width="20" height="20" />
                      <rect x="80" y="50" width="8" height="12" />
                      <rect x="25" y="55" width="12" height="8" />
                      <rect x="50" y="80" width="10" height="10" />
                      <rect x="70" y="85" width="14" height="8" />
                      <rect x="90" y="80" width="15" height="15" />
                    </svg>
                    <p className="reg-upi-text">UPI ID: <strong>artimas26@okhdfcbank</strong></p>
                  </div>
                </div>
              )}

              <input
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="ENTER TRANSACTION ID / UTR"
                className="reg-input full-width"
                required
              />

              {errorMessage && <p className="reg-error-msg">{errorMessage}</p>}

              <div className="reg-btn-row">
                <button type="button" onClick={handlePrev} className="reg-secondary-btn">
                  PREV
                </button>

                <button type="submit" disabled={isSubmitting} className="reg-action-btn submit-btn">
                  {isSubmitting ? 'VERIFYING...' : 'CONFIRM & SUBMIT'}
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

              <p className="reg-success-note">
                A confirmation has been recorded. Please save your Pass ID for on-desk verification.
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
