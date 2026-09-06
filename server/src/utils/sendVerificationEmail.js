const { createTransporter } = require('../config/mail');
const { getWhatsAppLink } = require('./whatsappLinks');

const ARTIMAS_LOGO_URL = 'https://res.cloudinary.com/qllarlul/image/upload/f_auto,q_auto,w_500,c_limit/v1788690181/Logo_with_footer.png';
const AIMSA_LOGO_URL = 'https://res.cloudinary.com/qllarlul/image/upload/e_trim/f_auto,q_auto,w_240,c_limit/v1788372702/xijdufnorzgujqejjosp.png';

/**
 * Send a verification/approval confirmation email to the participant.
 *
 * @param {Object} options
 * @param {string} options.to             Recipient email
 * @param {string} options.participantName Participant/team leader name
 * @param {string} options.eventName      Event name
 * @param {string} [options.eventSlug]    Event slug (for WhatsApp link)
 * @param {string} options.registrationId Human-readable registration ID
 * @param {string} [options.teamName]     Team name (optional)
 * @param {number} options.amount         Payment amount
 * @param {string} [options.submissionToken] CTF token (optional)
 * @param {string} options.remarks        Verification remarks
 * @returns {Promise<boolean>}            True if email sent, false if skipped
 */
const sendVerificationEmail = async ({
  to,
  participantName,
  eventName,
  eventSlug,
  registrationId,
  teamName,
  amount,
  submissionToken,
  remarks,
}) => {
  const transporter = createTransporter();

  if (!transporter) {
    console.warn(`⚠ Email skipped (SMTP not configured) — would send to: ${to}`);
    return { success: false, error: 'SMTP not configured' };
  }

  const teamLine = teamName
    ? `<tr style="border-bottom:1px solid #ede3d3;"><td class="table-cell-pad" style="padding:11px 16px;color:#7a6245;font-size:13.5px;font-weight:600;">Team</td><td class="table-cell-pad" style="padding:11px 16px;color:#1a1208;font-size:14px;font-weight:600;">${teamName}</td></tr>`
    : '';

  const ctfTokenBox = submissionToken
    ? `
      <div style="background:#fbf5ea;border:1.5px dashed #c99a4e;border-radius:8px;padding:18px;margin:22px 0;text-align:center;">
        <span style="color:#8c5d1e;font-size:12px;letter-spacing:2px;font-weight:700;">⚔ CTF SUBMISSION TOKEN</span>
        <p style="font-family:monospace;color:#1a1208;font-size:18px;margin:8px 0 4px;letter-spacing:1px;font-weight:bold;">${submissionToken}</p>
        <span style="color:#7a6245;font-size:11.5px;">Keep this token safe. Your team will use it to upload challenge proof screenshots.</span>
      </div>
    `
    : '';

  const whatsappGroupUrl = eventSlug ? getWhatsAppLink(eventSlug) : null;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ARTIMAS 26 — Registration Approved</title>
  <style>
    @media only screen and (max-width: 480px) {
      .email-wrapper {
        padding: 10px 4px !important;
      }
      .email-card {
        border-radius: 8px !important;
        border-width: 1px !important;
      }
      .header-container {
        padding: 18px 8px 14px 8px !important;
      }
      .header-col-side {
        width: 62px !important;
      }
      .header-badge-year {
        font-size: 8px !important;
        padding: 2px 4px !important;
        letter-spacing: 1px !important;
      }
      .artimas-logo-img {
        width: 135px !important;
        max-width: 135px !important;
      }
      .header-subtitle {
        font-size: 9px !important;
        letter-spacing: 1.5px !important;
        margin-top: 6px !important;
      }
      .aimsa-logo-img {
        width: 52px !important;
        max-width: 52px !important;
      }
      .aimsa-box-pad {
        padding: 4px 6px 3px 6px !important;
      }
      .content-box {
        padding: 22px 14px !important;
      }
      .table-cell-pad {
        padding: 9px 10px !important;
        font-size: 13px !important;
      }
      .mobile-status-title {
        font-size: 18px !important;
      }
      .footer-box {
        padding: 20px 12px 16px 12px !important;
      }
      .footer-links-row a {
        font-size: 10.5px !important;
        padding: 3px 8px !important;
        margin: 2px 3px !important;
      }
    }
  </style>
</head>
<body class="email-wrapper" style="margin:0;padding:24px 12px;background-color:#f4efe6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#2c1e0e;">
  <div class="email-card" style="max-width:600px;margin:0 auto;background-color:#fdfbf7;border:1.5px solid #d4af37;border-radius:10px;box-shadow:0 6px 24px rgba(78,52,21,0.08);overflow:hidden;">
    
    <!-- Header with Deeper Warm Sandstone / Antique Parchment Background -->
    <div class="header-container" style="background:#ecd8bd;background:linear-gradient(180deg, #ecd8be 0%, #dfc5a0 100%);padding:24px 18px 20px 18px;border-bottom:2px solid #c9a45c;">
      <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse;">
        <tr>
          <!-- Left Balance Spacer with Festival Year Badge -->
          <td width="76" align="left" valign="top" class="header-col-side" style="width:76px;">
            <div class="header-badge-year" style="display:inline-block;padding:3px 7px;border:1px solid #b38536;border-radius:4px;color:#5a3912;font-size:9.5px;letter-spacing:1.5px;font-weight:800;text-transform:uppercase;background:rgba(255,255,255,0.35);">
              ✦ 2026
            </div>
          </td>

          <!-- Center: ARTIMAS Logo & Subtitle -->
          <td align="center" valign="middle" style="padding:0 4px;">
            <a href="https://artimas.in/" target="_blank" style="text-decoration:none;display:inline-block;">
              <img
                class="artimas-logo-img"
                src="${ARTIMAS_LOGO_URL}"
                alt="ARTIMAS 26"
                width="176"
                style="width:176px;max-width:176px;height:auto;display:block;margin:0 auto;border:0;"
              />
            </a>
            <p class="header-subtitle" style="margin:8px 0 0;color:#5a3912;font-size:11px;letter-spacing:2.5px;font-weight:800;text-transform:uppercase;">
              THE COSMIC EPOCHS FESTIVAL
            </p>
          </td>

          <!-- Top-Right Corner: AIMSA Logo Badge -->
          <td width="76" align="right" valign="top" class="header-col-side" style="width:76px;text-align:right;">
            <a href="https://www.pccoeaimsa.in/" target="_blank" title="AIMSA - PCCOE" style="text-decoration:none;display:inline-block;">
              <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="display:inline-block;border-collapse:collapse;background:#090d13;border:1.5px solid #b8860b;border-radius:6px;box-shadow:0 2px 8px rgba(0,0,0,0.22);">
                <tr>
                  <td class="aimsa-box-pad" style="padding:4px 8px 3px 8px;">
                    <img
                      class="aimsa-logo-img"
                      src="${AIMSA_LOGO_URL}"
                      alt="AIMSA"
                      width="66"
                      style="width:66px;max-width:66px;height:auto;display:block;border:0;"
                    />
                  </td>
                </tr>
              </table>
            </a>
          </td>
        </tr>
      </table>
    </div>

    <!-- Golden Transition Trim matching the current theme -->
    <div style="height:3px;background:linear-gradient(90deg, #c9a45c 0%, #f3df9b 50%, #c9a45c 100%);"></div>

    <!-- Content -->
    <div class="content-box" style="padding:30px 24px;">
      <!-- Status Icon -->
      <div style="text-align:center;margin:0 auto 18px auto;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto;border-collapse:collapse;">
          <tr>
            <td align="center" valign="middle" width="52" height="52" style="width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,#1b5e20,#2e7d32);box-shadow:0 4px 12px rgba(27,94,32,0.22);text-align:center;vertical-align:middle;padding:0;margin:0;">
              <span style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:26px;line-height:26px;font-weight:bold;color:#ffffff;">
                &#10003;
              </span>
            </td>
          </tr>
        </table>
      </div>

      <h2 class="mobile-status-title" style="text-align:center;color:#2c1e0e;font-size:21px;margin:0 0 6px;letter-spacing:1px;font-weight:800;">PAYMENT APPROVED</h2>
      <p style="text-align:center;color:#7a6245;font-size:13.5px;margin:0 0 22px;">Your registration has been verified and sealed in the archives.</p>

      <p style="color:#3e2d1a;font-size:14.5px;line-height:1.65;margin:0 0 12px;">
        Dear <strong style="color:#1a1208;">${participantName}</strong>,
      </p>
      <p style="color:#3e2d1a;font-size:14.5px;line-height:1.65;margin:0 0 20px;">
        Your payment for <strong style="color:#8a5a1f;">${eventName}</strong> has been verified and approved by the ARTIMAS 26 festival council. Your registration is now officially confirmed.
      </p>

      <!-- Details Table -->
      <table style="width:100%;border-collapse:collapse;margin:20px 0;background:#fbf7ee;border:1px solid #e5d8c3;border-radius:8px;overflow:hidden;">
        <tr style="border-bottom:1px solid #ede3d3;">
          <td class="table-cell-pad" style="padding:11px 16px;color:#7a6245;font-size:13.5px;font-weight:600;">Registration ID</td>
          <td class="table-cell-pad" style="padding:11px 16px;color:#8c5d1e;font-size:16px;font-weight:800;letter-spacing:1.5px;">${registrationId}</td>
        </tr>
        <tr style="border-bottom:1px solid #ede3d3;">
          <td class="table-cell-pad" style="padding:11px 16px;color:#7a6245;font-size:13.5px;font-weight:600;">Event</td>
          <td class="table-cell-pad" style="padding:11px 16px;color:#1a1208;font-size:14px;font-weight:600;">${eventName}</td>
        </tr>
        ${teamLine}
        <tr style="border-bottom:1px solid #ede3d3;">
          <td class="table-cell-pad" style="padding:11px 16px;color:#7a6245;font-size:13.5px;font-weight:600;">Amount Paid</td>
          <td class="table-cell-pad" style="padding:11px 16px;color:#1a1208;font-size:14px;font-weight:600;">₹${amount}</td>
        </tr>
        <tr>
          <td class="table-cell-pad" style="padding:11px 16px;color:#7a6245;font-size:13.5px;font-weight:600;">Payment Status</td>
          <td class="table-cell-pad" style="padding:11px 16px;font-size:14px;">
            <span style="display:inline-block;background:#e8f5e9;color:#1b5e20;border:1px solid #a5d6a7;padding:3px 10px;border-radius:4px;font-weight:700;font-size:12px;">
              ✓ APPROVED
            </span>
          </td>
        </tr>
      </table>

      ${ctfTokenBox}

      ${whatsappGroupUrl ? `
      <!-- Official WhatsApp Group -->
      <div style="background:#f0fdf4;border:1.5px solid #86efac;border-radius:8px;padding:18px 16px;margin:22px 0;text-align:center;">
        <span style="color:#15803d;font-size:11.5px;letter-spacing:1.5px;font-weight:800;text-transform:uppercase;">Official WhatsApp Community</span>
        <p style="color:#273b2a;font-size:13.5px;margin:8px 0 14px;">Join the ${eventName} WhatsApp group for schedules & announcements:</p>
        <a href="${whatsappGroupUrl}" style="display:inline-block;background-color:#22c55e;color:#ffffff;padding:11px 22px;border-radius:6px;font-weight:700;text-decoration:none;font-size:13.5px;box-shadow:0 2px 8px rgba(34,197,94,0.3);">JOIN WHATSAPP GROUP ↗</a>
      </div>
      ` : ''}

      <!-- Next Steps -->
      <div style="background:#fbf7ee;border:1px solid #e5d8c3;border-radius:8px;padding:18px;margin:22px 0;">
        <h3 style="color:#8c5d1e;font-size:13px;margin:0 0 10px;letter-spacing:1px;font-weight:800;text-transform:uppercase;">Next Steps & Instructions</h3>
        <ul style="margin:0;padding:0 0 0 18px;color:#4a3823;font-size:13px;line-height:1.75;">
          <li>Save your <strong style="color:#1a1208;">Pass ID: ${registrationId}</strong> for on-venue check-in.</li>
          <li>Carry a valid college identity card on the event day.</li>
          <li>Report to the venue at least 15 minutes before the trials commence.</li>
          <li>Review the event rulebooks and code of conduct.</li>
        </ul>
      </div>

      <p style="color:#3e2d1a;font-size:13.5px;line-height:1.65;margin:0;">
        We look forward to seeing you at ARTIMAS 26. May the cosmic epochs guide your journey!
      </p>
    </div>

    <!-- Creative Theme-Matching Footer -->
    <div class="footer-box" style="background:linear-gradient(180deg, #fdfbf7 0%, #f6efe2 100%);padding:26px 20px 20px 20px;border-top:1.5px solid #e2cfad;text-align:center;">
      
      <!-- Cosmic Ornamental Divider -->
      <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="margin:0 auto 18px auto;border-collapse:collapse;">
        <tr>
          <td style="border-bottom:1px solid #e2cfad;width:36%;"></td>
          <td align="center" style="width:28%;padding:0 6px;color:#b8860b;font-size:12px;letter-spacing:4px;white-space:nowrap;line-height:1;">
            ✦ ◈ ✦
          </td>
          <td style="border-bottom:1px solid #e2cfad;width:36%;"></td>
        </tr>
      </table>

      <!-- Mini Artimas Emblem Anchor -->
      <div style="margin:0 auto 10px auto;text-align:center;">
        <a href="https://artimas.in" target="_blank" style="text-decoration:none;display:inline-block;">
          <img
            src="${ARTIMAS_LOGO_URL}"
            alt="ARTIMAS"
            width="98"
            style="width:98px;max-width:98px;height:auto;display:inline-block;border:0;opacity:0.92;"
          />
        </a>
      </div>

      <!-- Sacred Sanskrit Motto Pill -->
      <div style="margin:0 auto 12px auto;">
        <span style="display:inline-block;padding:4px 14px;background:rgba(212,175,55,0.12);border:1px solid #d4af37;border-radius:16px;color:#8c5d1e;font-size:12px;font-weight:800;letter-spacing:1.5px;">
          ॥ एम्सा कुटुम्बकम् ॥
        </span>
      </div>

      <!-- Department & College Branding -->
      <p style="margin:0 0 3px;color:#332414;font-size:12px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;">
        Department of Computer Science &amp; Engineering (AI &amp; ML)
      </p>
      <p style="margin:0 0 6px;color:#6b553b;font-size:11.5px;font-weight:500;">
        Pimpri Chinchwad College of Engineering (PCCOE), Pune
      </p>
      <p style="margin:0 0 14px;color:#8c5d1e;font-size:11px;font-weight:600;letter-spacing:0.3px;">
        In Association with AIMSA • All India AI &amp; ML Students Association
      </p>

      <!-- Fluid Wrap-Friendly Quick Links Row -->
      <div class="footer-links-row" style="margin:0 auto 16px auto;text-align:center;">
        <a href="https://artimas.in" target="_blank" style="display:inline-block;margin:3px 4px;padding:4px 10px;background:#fbf7ee;border:1px solid #dfcfb6;border-radius:12px;color:#7a5018;text-decoration:none;font-size:11.5px;font-weight:700;">Official Portal ↗</a>
        <a href="https://www.instagram.com/pccoe_aimsa" target="_blank" style="display:inline-block;margin:3px 4px;padding:4px 10px;background:#fbf7ee;border:1px solid #dfcfb6;border-radius:12px;color:#7a5018;text-decoration:none;font-size:11.5px;font-weight:700;">Instagram ↗</a>
        <a href="https://www.linkedin.com/company/pccoe-s-aimsa/posts/?feedView=all" target="_blank" style="display:inline-block;margin:3px 4px;padding:4px 10px;background:#fbf7ee;border:1px solid #dfcfb6;border-radius:12px;color:#7a5018;text-decoration:none;font-size:11.5px;font-weight:700;">LinkedIn ↗</a>
        <a href="https://www.pccoeaimsa.in/" target="_blank" style="display:inline-block;margin:3px 4px;padding:4px 10px;background:#fbf7ee;border:1px solid #dfcfb6;border-radius:12px;color:#7a5018;text-decoration:none;font-size:11.5px;font-weight:700;">AIMSA ↗</a>
      </div>

      <!-- Support & Automated Dispatch Notice -->
      <p style="margin:0 0 4px;color:#7e6950;font-size:11px;">
        Have questions? Contact the council at <a href="mailto:artimas@pccoepune.org" style="color:#8c5d1e;text-decoration:underline;font-weight:600;">artimas@pccoepune.org</a>
      </p>
      <p style="margin:0 0 8px;color:#9e8a72;font-size:10.5px;font-style:italic;">
        This is an automated dispatch from the Cosmic Archives. Please do not reply directly to this transmission.
      </p>
      <p style="margin:0;color:#9e8a72;font-size:10px;letter-spacing:0.5px;">
        &copy; 2026 ARTIMAS • The Cosmic Epochs Festival • All Rights Reserved
      </p>
    </div>

    <!-- Bottom Golden Accent Trim -->
    <div style="height:4px;background:linear-gradient(90deg, #d4af37 0%, #f5e4af 50%, #d4af37 100%);"></div>
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
    return { success: false, error: error.message };
  }
};

module.exports = sendVerificationEmail;
