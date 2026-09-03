const { createTransporter } = require('../config/mail');

/**
 * Send an official ARTIMAS 26 registration confirmation email.
 *
 * @param {Object} options
 * @param {string} options.to               Recipient email (team leader or individual participant)
 * @param {string} options.participantName  Participant or team leader name
 * @param {string} options.eventName        Event name
 * @param {string} options.registrationId   Human-readable registration ID (ART26-XXXXXX)
 * @param {string} [options.teamName]       Team name (for team events)
 * @param {number} [options.memberCount]    Number of team members
 * @param {string} [options.submissionToken] CTF submission token (for CTF teams)
 * @param {number} [options.payableAmount]   Calculated registration fee
 * @param {boolean} [options.paymentRequired] Whether payment is required
 * @returns {Promise<boolean>}              True if email sent, false if skipped/failed
 */
const sendConfirmationEmail = async ({
  to,
  participantName,
  eventName,
  registrationId,
  teamName,
  memberCount,
  submissionToken,
  payableAmount = 0,
  paymentRequired = false,
}) => {
  const transporter = createTransporter();

  if (!transporter) {
    console.warn(`⚠ Confirmation email skipped (SMTP not configured) — would send to: ${to}`);
    return false;
  }

  const teamLine = teamName
    ? `<tr><td style="padding:10px 16px;color:#9a8866;font-size:14px;border-bottom:1px solid #1a1610;">Team Name</td><td style="padding:10px 16px;color:#e8d8b0;font-size:14px;font-weight:600;border-bottom:1px solid #1a1610;">${teamName}</td></tr>`
    : '';

  const memberLine = memberCount && memberCount > 1
    ? `<tr><td style="padding:10px 16px;color:#9a8866;font-size:14px;border-bottom:1px solid #1a1610;">Team Size</td><td style="padding:10px 16px;color:#e8d8b0;font-size:14px;font-weight:600;border-bottom:1px solid #1a1610;">${memberCount} Members</td></tr>`
    : '';

  const ctfTokenBox = submissionToken
    ? `
      <div style="background:#0a0e14;border:1px solid #c9a45c;border-radius:8px;padding:16px;margin:20px 0;text-align:center;">
        <span style="color:#c9a45c;font-size:12px;letter-spacing:2px;font-weight:700;">⚔ CTF SUBMISSION TOKEN</span>
        <p style="font-family:monospace;color:#e8d8b0;font-size:16px;margin:8px 0 4px;letter-spacing:1px;font-weight:bold;">${submissionToken}</p>
        <span style="color:#888;font-size:11px;">Keep this token safe. Your team will use it to upload challenge proof screenshots.</span>
      </div>
    `
    : '';

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ARTIMAS 26 — Registration Confirmed</title>
</head>
<body style="margin:0;padding:0;background-color:#080a0c;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <div style="max-width:600px;margin:20px auto;background-color:#0d1117;border:1px solid #76552f;border-radius:8px;overflow:hidden;">
    
    <!-- Header -->
    <div style="text-align:center;padding:36px 20px;background:linear-gradient(180deg,#1a1208 0%,#0d1117 100%);border-bottom:2px solid #76552f;">
      <h1 style="margin:0;font-size:30px;color:#c9a45c;letter-spacing:4px;font-weight:700;">ARTIMAS 26</h1>
      <p style="margin:8px 0 0;color:#9a8866;font-size:13px;letter-spacing:2px;">THE COSMIC EPOCHS FESTIVAL</p>
    </div>

    <!-- Body -->
    <div style="padding:32px 24px;">
      <div style="text-align:center;margin-bottom:24px;">
        <div style="display:inline-block;width:56px;height:56px;line-height:56px;border-radius:50%;background:linear-gradient(135deg,#3a6b35,#2d5a28);color:#fff;font-size:28px;font-weight:bold;">✓</div>
      </div>

      <h2 style="text-align:center;color:#e8d8b0;font-size:22px;margin:0 0 8px;letter-spacing:1px;">REGISTRATION CONFIRMED</h2>
      <p style="text-align:center;color:#9a8866;font-size:14px;margin:0 0 24px;">Your entry into the trials has been sealed.</p>

      <p style="color:#c5b18a;font-size:15px;line-height:1.6;">
        Dear <strong style="color:#e8d8b0;">${participantName}</strong>,
      </p>
      <p style="color:#c5b18a;font-size:15px;line-height:1.6;">
        Your registration for <strong style="color:#c9a45c;">${eventName}</strong> has been successfully recorded and confirmed in the cosmic archives.
      </p>

      <!-- Details Table -->
      <table style="width:100%;border-collapse:collapse;margin:24px 0;background:#0a0e14;border:1px solid #2a2218;border-radius:8px;overflow:hidden;">
        <tr style="border-bottom:1px solid #1a1610;">
          <td style="padding:12px 16px;color:#9a8866;font-size:14px;">Pass ID</td>
          <td style="padding:12px 16px;color:#c9a45c;font-size:18px;font-weight:700;letter-spacing:2px;">${registrationId}</td>
        </tr>
        <tr style="border-bottom:1px solid #1a1610;">
          <td style="padding:10px 16px;color:#9a8866;font-size:14px;">Event</td>
          <td style="padding:10px 16px;color:#e8d8b0;font-size:14px;font-weight:600;">${eventName}</td>
        </tr>
        ${teamLine}
        ${memberLine}
        <tr style="border-bottom:1px solid #1a1610;">
          <td style="padding:10px 16px;color:#9a8866;font-size:14px;">Registration Fee</td>
          <td style="padding:10px 16px;color:#e8d8b0;font-size:14px;font-weight:600;">
            ${paymentRequired ? `₹${payableAmount} (Payment required)` : '₹0 (No payment required — PCCOE Eligible)'}
          </td>
        </tr>
        <tr>
          <td style="padding:10px 16px;color:#9a8866;font-size:14px;">Status</td>
          <td style="padding:10px 16px;color:#3a6b35;font-size:14px;font-weight:700;">✓ CONFIRMED</td>
        </tr>
      </table>

      ${ctfTokenBox}

      <!-- Next Steps -->
      <div style="background:#0f1419;border:1px solid #2a2218;border-radius:8px;padding:20px;margin:24px 0;">
        <h3 style="color:#c9a45c;font-size:13px;margin:0 0 12px;letter-spacing:1px;text-transform:uppercase;">Instructions for Event Day</h3>
        <ul style="margin:0;padding:0 0 0 18px;color:#c5b18a;font-size:14px;line-height:1.8;">
          <li>Present your <strong style="color:#e8d8b0;">Pass ID: ${registrationId}</strong> at the registration desk for on-venue verification.</li>
          <li>All participants must carry a valid college identity card.</li>
          <li>Report to the event venue at least 15 minutes prior to commencement.</li>
          <li>Adhere strictly to event rulebooks and codes of conduct.</li>
        </ul>
      </div>

      <p style="color:#c5b18a;font-size:14px;line-height:1.6;">
        We look forward to your participation. May the cosmic epochs inspire your highest potential!
      </p>
      <p style="color:#9a8866;font-size:13px;margin-top:20px;">
        ॥ एम्सा कुटुम्बकम् ॥
      </p>
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding:20px;border-top:1px solid #1a1610;background:#080a0c;">
      <p style="margin:0;color:#6a5a3e;font-size:12px;">
        ARTIMAS 26 — Department of CSE (AI & ML), PCCOE Pune
      </p>
      <p style="margin:4px 0 0;color:#4a3e2e;font-size:11px;">
        This is an automated confirmation message. Do not reply to this email.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();

  try {
    await transporter.sendMail({
      from: process.env.MAIL_FROM || 'ARTIMAS 26 <noreply@artimas.in>',
      to,
      subject: `✓ Registration Confirmed — ${eventName} | ARTIMAS 26 [${registrationId}]`,
      html: htmlContent,
    });

    console.log(`✦ Confirmation email sent to: ${to} (${registrationId})`);
    return true;
  } catch (error) {
    console.error(`✖ Failed to send confirmation email to ${to}:`, error.message);
    return false;
  }
};

module.exports = sendConfirmationEmail;
