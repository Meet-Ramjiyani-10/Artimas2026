const { createTransporter } = require('../config/mail');

/**
 * Send a verification/approval confirmation email to the participant.
 *
 * @param {Object} options
 * @param {string} options.to             Recipient email
 * @param {string} options.participantName Participant/team leader name
 * @param {string} options.eventName      Event name
 * @param {string} options.registrationId Human-readable registration ID
 * @param {string} options.teamName       Team name (optional)
 * @param {number} options.amount         Payment amount
 * @param {string} options.remarks        Verification remarks
 * @returns {Promise<boolean>}            True if email sent, false if skipped
 */
const sendVerificationEmail = async ({
  to,
  participantName,
  eventName,
  registrationId,
  teamName,
  amount,
  remarks,
}) => {
  const transporter = createTransporter();

  if (!transporter) {
    console.warn(`⚠ Email skipped (SMTP not configured) — would send to: ${to}`);
    return { success: false, error: 'SMTP not configured' };
  }

  const teamLine = teamName ? `<tr><td style="padding:8px 16px;color:#9a8866;font-size:14px;">Team</td><td style="padding:8px 16px;color:#e8d8b0;font-size:14px;font-weight:600;">${teamName}</td></tr>` : '';

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ARTIMAS 26 — Registration Approved</title>
</head>
<body style="margin:0;padding:0;background-color:#080a0c;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background-color:#0d1117;border:1px solid #76552f;">
    
    <!-- Header -->
    <div style="text-align:center;padding:32px 20px;background:linear-gradient(180deg,#1a1208 0%,#0d1117 100%);border-bottom:2px solid #76552f;">
      <h1 style="margin:0;font-size:28px;color:#c9a45c;letter-spacing:4px;font-weight:700;">ARTIMAS 26</h1>
      <p style="margin:8px 0 0;color:#9a8866;font-size:13px;letter-spacing:2px;">THE COSMIC EPOCHS FESTIVAL</p>
    </div>

    <!-- Content -->
    <div style="padding:32px 24px;">
      <!-- Status Icon -->
      <div style="text-align:center;margin:0 auto 24px auto;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto;border-collapse:collapse;">
          <tr>
            <td align="center" valign="middle" width="58" height="58" style="width:58px;height:58px;border-radius:50%;background-color:#2e6b2c;background:linear-gradient(135deg,#3a6b35,#2d5a28);color:#ffffff;text-align:center;vertical-align:middle;padding:0;margin:0;">
              <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto;border-collapse:collapse;">
                <tr>
                  <td align="center" valign="middle" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:28px;line-height:28px;font-weight:bold;color:#ffffff;text-align:center;vertical-align:middle;padding:0;margin:0;">
                    &#10003;
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>

      <h2 style="text-align:center;color:#e8d8b0;font-size:22px;margin:0 0 8px;letter-spacing:1px;">PAYMENT APPROVED</h2>
      <p style="text-align:center;color:#9a8866;font-size:14px;margin:0 0 28px;">Your registration has been verified successfully.</p>

      <p style="color:#c5b18a;font-size:15px;line-height:1.6;">
        Dear <strong style="color:#e8d8b0;">${participantName}</strong>,
      </p>
      <p style="color:#c5b18a;font-size:15px;line-height:1.6;">
        Your payment for <strong style="color:#c9a45c;">${eventName}</strong> has been verified and approved by the ARTIMAS 26 tech team. Your registration is now confirmed.
      </p>

      <!-- Details Table -->
      <table style="width:100%;border-collapse:collapse;margin:24px 0;background:#0a0e14;border:1px solid #2a2218;border-radius:8px;overflow:hidden;">
        <tr style="border-bottom:1px solid #1a1610;">
          <td style="padding:12px 16px;color:#9a8866;font-size:14px;">Registration ID</td>
          <td style="padding:12px 16px;color:#c9a45c;font-size:16px;font-weight:700;letter-spacing:2px;">${registrationId}</td>
        </tr>
        <tr style="border-bottom:1px solid #1a1610;">
          <td style="padding:8px 16px;color:#9a8866;font-size:14px;">Event</td>
          <td style="padding:8px 16px;color:#e8d8b0;font-size:14px;font-weight:600;">${eventName}</td>
        </tr>
        ${teamLine}
        <tr style="border-bottom:1px solid #1a1610;">
          <td style="padding:8px 16px;color:#9a8866;font-size:14px;">Amount Paid</td>
          <td style="padding:8px 16px;color:#e8d8b0;font-size:14px;font-weight:600;">₹${amount}</td>
        </tr>
        <tr style="border-bottom:1px solid #1a1610;">
          <td style="padding:8px 16px;color:#9a8866;font-size:14px;">Payment Status</td>
          <td style="padding:8px 16px;color:#3a6b35;font-size:14px;font-weight:700;">✓ APPROVED</td>
        </tr>
        ${remarks ? `<tr><td style="padding:8px 16px;color:#9a8866;font-size:14px;">Remarks</td><td style="padding:8px 16px;color:#c5b18a;font-size:14px;">${remarks}</td></tr>` : ''}
      </table>

      <!-- Next Steps -->
      <div style="background:#0f1419;border:1px solid #2a2218;border-radius:8px;padding:20px;margin:24px 0;">
        <h3 style="color:#c9a45c;font-size:14px;margin:0 0 12px;letter-spacing:1px;">NEXT STEPS</h3>
        <ul style="margin:0;padding:0 0 0 18px;color:#c5b18a;font-size:14px;line-height:1.8;">
          <li>Save your <strong style="color:#e8d8b0;">Pass ID: ${registrationId}</strong> for on-desk verification.</li>
          <li>Carry a valid college ID card on the event day.</li>
          <li>Arrive at the venue 15 minutes before the event starts.</li>
          <li>Check the event rulebook for detailed guidelines.</li>
        </ul>
      </div>

      <p style="color:#c5b18a;font-size:14px;line-height:1.6;">
        We look forward to seeing you at ARTIMAS 26. May the cosmic epochs guide your journey!
      </p>
      <p style="color:#9a8866;font-size:13px;margin-top:24px;">
        ॥ एम्सा कुटुम्बकम् ॥
      </p>
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding:20px;border-top:1px solid #1a1610;background:#080a0c;">
      <p style="margin:0;color:#6a5a3e;font-size:12px;">
        ARTIMAS 26 — Department of CSE (AI & ML), PCCOE Pune
      </p>
      <p style="margin:4px 0 0;color:#4a3e2e;font-size:11px;">
        This is an automated confirmation. Do not reply to this email.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();

  try {
    const info = await transporter.sendMail({
      from: process.env.MAIL_FROM || 'ARTIMAS 26 <noreply@artimas.in>',
      to,
      subject: `✓ Registration Approved — ${eventName} | ARTIMAS 26 [${registrationId}]`,
      html: htmlContent,
    });

    console.log(`✦ Approval email sent to: ${to} (${registrationId})`);
    return { success: true, messageId: info?.messageId };
  } catch (error) {
    console.error(`✖ Failed to send email to ${to}:`, error.message);
    // Don't throw — email failure shouldn't block the approval
    return { success: false, error: error.message };
  }
};

module.exports = sendVerificationEmail;
