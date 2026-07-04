import { Router } from "express";

const router = Router();

const BRAND = {
  bg: "#FDFBF7",
  primary: "#5F7A68",
  accent: "#C9AE7B",
  text: "#2C2C2C",
  muted: "#6B6B6B",
  border: "#E8E0D4",
};

function page(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} — TinyLove</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: ${BRAND.bg};
      color: ${BRAND.text};
      line-height: 1.7;
      padding: 0 16px 64px;
    }
    header {
      max-width: 720px;
      margin: 0 auto;
      padding: 40px 0 32px;
      border-bottom: 1px solid ${BRAND.border};
      margin-bottom: 40px;
    }
    .logo {
      font-size: 22px;
      font-weight: 700;
      color: ${BRAND.primary};
      letter-spacing: -0.3px;
      text-decoration: none;
    }
    .logo span { color: ${BRAND.accent}; }
    nav { margin-top: 12px; display: flex; gap: 20px; flex-wrap: wrap; }
    nav a {
      font-size: 13px;
      color: ${BRAND.muted};
      text-decoration: none;
      border-bottom: 1px solid transparent;
      transition: color .15s, border-color .15s;
    }
    nav a:hover { color: ${BRAND.primary}; border-color: ${BRAND.primary}; }
    main { max-width: 720px; margin: 0 auto; }
    h1 {
      font-size: 28px;
      font-weight: 700;
      color: ${BRAND.primary};
      margin-bottom: 8px;
      letter-spacing: -0.4px;
    }
    .updated {
      font-size: 13px;
      color: ${BRAND.muted};
      margin-bottom: 36px;
    }
    h2 {
      font-size: 17px;
      font-weight: 600;
      color: ${BRAND.primary};
      margin: 32px 0 10px;
    }
    p { margin-bottom: 14px; font-size: 15px; color: ${BRAND.text}; }
    ul { margin: 0 0 14px 20px; }
    ul li { font-size: 15px; margin-bottom: 6px; color: ${BRAND.text}; }
    a { color: ${BRAND.primary}; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .card {
      background: #fff;
      border: 1px solid ${BRAND.border};
      border-radius: 12px;
      padding: 24px 28px;
      margin-bottom: 20px;
    }
    .email-link {
      display: inline-block;
      margin-top: 4px;
      background: ${BRAND.primary};
      color: #fff !important;
      padding: 10px 22px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      text-decoration: none !important;
    }
    footer {
      max-width: 720px;
      margin: 48px auto 0;
      padding-top: 24px;
      border-top: 1px solid ${BRAND.border};
      font-size: 13px;
      color: ${BRAND.muted};
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }
  </style>
</head>
<body>
  <header>
    <a class="logo" href="/api/legal/support">Tiny<span>Love</span></a>
    <nav>
      <a href="/api/legal/terms">Terms of Service</a>
      <a href="/api/legal/privacy">Privacy Policy</a>
      <a href="/api/legal/support">Support</a>
    </nav>
  </header>
  <main>
    ${body}
  </main>
  <footer>
    <span>© ${new Date().getFullYear()} TinyLove. All rights reserved.</span>
    <a href="/api/legal/terms">Terms</a>
    <a href="/api/legal/privacy">Privacy</a>
    <a href="/api/legal/support">Support</a>
  </footer>
</body>
</html>`;
}

// ── Terms of Service ───────────────────────────────────────────────────────────
router.get("/legal/terms", (_req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(page("Terms of Service", `
    <h1>Terms of Service</h1>
    <p class="updated">Last updated: June 24, 2025</p>

    <h2>1. Acceptance of Terms</h2>
    <p>By downloading, installing, or using TinyLove ("the App"), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the App.</p>

    <h2>2. Description of Service</h2>
    <p>TinyLove is a private family memory-sharing application that allows parents and family members to create, store, and share memories of their children. The App provides features including photo and video uploads, voice recordings, family invitations, and memory feeds.</p>

    <h2>3. Account Registration</h2>
    <p>You must create an account to use TinyLove. You agree to:</p>
    <ul>
      <li>Provide accurate and complete registration information</li>
      <li>Maintain the security of your password and account credentials</li>
      <li>Promptly notify us of any unauthorized use of your account</li>
      <li>Take responsibility for all activity that occurs under your account</li>
    </ul>

    <h2>4. Acceptable Use</h2>
    <p>You agree to use TinyLove only for lawful purposes. You must not:</p>
    <ul>
      <li>Upload content that violates any applicable law or regulation</li>
      <li>Share content that is harmful, abusive, or violates the privacy of others</li>
      <li>Use the App to harass, threaten, or harm any person</li>
      <li>Attempt to gain unauthorized access to any part of the App or its servers</li>
      <li>Upload content that infringes any third-party intellectual property rights</li>
    </ul>

    <h2>5. Content Ownership</h2>
    <p>You retain full ownership of all photos, videos, voice recordings, and other content you upload to TinyLove ("Your Content"). By uploading content, you grant TinyLove a limited, non-exclusive license to store, display, and transmit Your Content solely for the purpose of providing the service to you and the family members you invite.</p>

    <h2>6. Privacy</h2>
    <p>Your privacy is important to us. Our collection and use of personal information is governed by our <a href="/api/legal/privacy">Privacy Policy</a>, which is incorporated into these Terms by reference.</p>

    <h2>7. Family Sharing</h2>
    <p>When you invite family members to view your child's memories, those members gain access to the content you share. You are responsible for only inviting individuals who have your consent to view that content. You can revoke family member access at any time through the App.</p>

    <h2>8. Intellectual Property</h2>
    <p>The TinyLove name, logo, and all App content created by us (excluding Your Content) are protected by copyright, trademark, and other intellectual property laws. You may not reproduce, modify, or distribute our intellectual property without our written permission.</p>

    <h2>9. Disclaimers</h2>
    <p>TinyLove is provided "as is" without warranties of any kind, either express or implied. We do not warrant that the App will be uninterrupted, error-free, or free of viruses or other harmful components.</p>

    <h2>10. Limitation of Liability</h2>
    <p>To the maximum extent permitted by law, TinyLove shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of or inability to use the App.</p>

    <h2>11. Termination</h2>
    <p>We reserve the right to suspend or terminate your account at any time for violation of these Terms. You may delete your account at any time through the App settings. Upon termination, your data will be deleted in accordance with our Privacy Policy.</p>

    <h2>12. Changes to Terms</h2>
    <p>We may update these Terms from time to time. We will notify you of material changes through the App or by email. Continued use of the App after changes constitutes acceptance of the new Terms.</p>

    <h2>13. Contact</h2>
    <p>If you have questions about these Terms, please contact us at <a href="/api/legal/support">our support page</a> or email <a href="mailto:support@tinylove.app">support@tinylove.app</a>.</p>
  `));
});

// ── Privacy Policy ─────────────────────────────────────────────────────────────
router.get("/legal/privacy", (_req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(page("Privacy Policy", `
    <h1>Privacy Policy</h1>
    <p class="updated">Last updated: June 24, 2025</p>

    <p>TinyLove ("we", "us", or "our") is committed to protecting the privacy of your family's memories. This Privacy Policy explains what information we collect, how we use it, and the choices you have.</p>

    <h2>1. Information We Collect</h2>
    <p><strong>Account Information:</strong> When you register, we collect your name, email address, and a hashed version of your password. If you sign in with Apple or Google, we receive a unique identifier and, if you permit, your name and email from that provider.</p>
    <p><strong>Content You Upload:</strong> Photos, videos, voice recordings, captions, and other memory content you create within the App are stored securely in our cloud infrastructure.</p>
    <p><strong>Device Information:</strong> We collect your device's push notification token to deliver notifications about new memories and family activity. We also collect basic device identifiers for crash reporting and app performance.</p>
    <p><strong>Usage Data:</strong> We collect information about how you use the App (e.g., features accessed, screens viewed) to improve the service. This data is anonymized where possible.</p>

    <h2>2. How We Use Your Information</h2>
    <ul>
      <li>To provide, operate, and maintain the TinyLove service</li>
      <li>To send push notifications about new memories and family activity (you can opt out in device settings)</li>
      <li>To authenticate your identity and keep your account secure</li>
      <li>To generate AI-powered memory features (Dream Tales, highlights) using your content</li>
      <li>To improve the App through anonymized analytics</li>
      <li>To respond to your support requests</li>
    </ul>

    <h2>3. How We Share Your Information</h2>
    <p>We do not sell your personal information to third parties. We share information only in the following limited circumstances:</p>
    <ul>
      <li><strong>Family members you invite:</strong> Content you share is accessible to family members you have explicitly invited through the App.</li>
      <li><strong>Service providers:</strong> We use trusted third-party services for cloud storage (Google Cloud), push notifications (Firebase), and AI features (Google AI). These providers process data only as instructed by us.</li>
      <li><strong>Legal requirements:</strong> We may disclose information if required by law or to protect the rights, property, or safety of TinyLove, our users, or others.</li>
    </ul>

    <h2>4. Data Storage and Security</h2>
    <p>Your content is stored on Google Cloud Storage with encryption at rest and in transit. We implement industry-standard security measures including JWT authentication, bcrypt password hashing, and HTTPS-only access. No system is 100% secure, and we cannot guarantee absolute security.</p>

    <h2>5. Data Retention</h2>
    <p>We retain your account and content for as long as your account is active. When you delete your account, we delete your personal information and content within 30 days, except where retention is required by law.</p>

    <h2>6. Children's Privacy</h2>
    <p>TinyLove is designed for parents and family members aged 13 and older to document children's memories. We do not knowingly collect personal information directly from children under 13. The content about children (photos, videos, etc.) is uploaded by and controlled by the parent or guardian who owns the account.</p>

    <h2>7. Your Rights</h2>
    <p>Depending on your location, you may have the right to:</p>
    <ul>
      <li>Access the personal information we hold about you</li>
      <li>Correct inaccurate personal information</li>
      <li>Request deletion of your personal information</li>
      <li>Export your data in a portable format</li>
      <li>Opt out of non-essential data processing</li>
    </ul>
    <p>To exercise any of these rights, please contact us at <a href="mailto:support@tinylove.app">support@tinylove.app</a>.</p>

    <h2>8. Push Notifications</h2>
    <p>We use Firebase Cloud Messaging (FCM) and Apple Push Notification Service (APNs) to send push notifications. You can disable notifications at any time in your device's Settings app without affecting your ability to use TinyLove.</p>

    <h2>9. Third-Party Services</h2>
    <p>TinyLove integrates with the following third-party services, each governed by their own privacy policies:</p>
    <ul>
      <li>Google Cloud Storage — media file storage</li>
      <li>Firebase (Google) — push notifications and analytics</li>
      <li>Google Sign-In / Apple Sign-In — optional social authentication</li>
    </ul>

    <h2>10. International Transfers</h2>
    <p>Your data may be stored and processed in countries outside your own. We ensure appropriate safeguards are in place for any international data transfers.</p>

    <h2>11. Changes to This Policy</h2>
    <p>We may update this Privacy Policy periodically. We will notify you of significant changes through the App or by email. Your continued use of the App after changes take effect constitutes acceptance of the updated policy.</p>

    <h2>12. Contact Us</h2>
    <p>If you have questions or concerns about this Privacy Policy, please contact us:</p>
    <p>Email: <a href="mailto:support@tinylove.app">support@tinylove.app</a><br/>
    Support: <a href="/api/legal/support">tinylove.app/support</a></p>
  `));
});

// ── Support ────────────────────────────────────────────────────────────────────
router.get("/legal/support", (_req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(page("Support", `
    <h1>Support</h1>
    <p class="updated">We&rsquo;re here to help — typically respond within 24 hours.</p>

    <div class="card">
      <h2 style="margin-top:0">Contact Us</h2>
      <p>Have a question, found a bug, or need help with your account? Send us an email and our team will get back to you as soon as possible.</p>
      <a class="email-link" href="mailto:support@tinylove.app">support@tinylove.app</a>
    </div>

    <h2>Frequently Asked Questions</h2>

    <div class="card">
      <h2 style="margin-top:0">How do I invite family members?</h2>
      <p>Open your child's profile, tap the <strong>Family</strong> tab, then tap <strong>Invite</strong>. Share the generated link or code with your family member. They'll need to download TinyLove and create an account to accept the invitation.</p>
    </div>

    <div class="card">
      <h2 style="margin-top:0">How do I delete a memory?</h2>
      <p>Open the memory you want to delete, tap the three-dot menu (⋯) in the top right corner, and select <strong>Delete Memory</strong>. Deleted memories cannot be recovered.</p>
    </div>

    <div class="card">
      <h2 style="margin-top:0">How do I delete my account?</h2>
      <p>Go to <strong>Profile → Settings → Delete Account</strong>. This will permanently remove your account and all associated content within 30 days. This action cannot be undone.</p>
    </div>

    <div class="card">
      <h2 style="margin-top:0">Why am I not receiving push notifications?</h2>
      <p>Check the following:</p>
      <ul>
        <li>Open your device <strong>Settings → TinyLove → Notifications</strong> and ensure notifications are enabled</li>
        <li>Make sure you have a stable internet connection</li>
        <li>Try logging out and back in to refresh your notification token</li>
      </ul>
    </div>

    <div class="card">
      <h2 style="margin-top:0">My video or voice memory won&rsquo;t play</h2>
      <p>This is usually caused by a slow connection. Try the following:</p>
      <ul>
        <li>Check your internet connection and try again</li>
        <li>Pull down on the home screen to refresh the memory feed</li>
        <li>Close and reopen the App</li>
      </ul>
      <p>If the problem persists, please email us at <a href="mailto:support@tinylove.app">support@tinylove.app</a> with details about your device and iOS/Android version.</p>
    </div>

    <div class="card">
      <h2 style="margin-top:0">How is my family&rsquo;s data kept private?</h2>
      <p>TinyLove is a fully private platform. Your memories are only visible to you and the family members you explicitly invite. We never share your content with advertisers or third parties. See our <a href="/api/legal/privacy">Privacy Policy</a> for full details.</p>
    </div>

    <div class="card">
      <h2 style="margin-top:0">I forgot my password</h2>
      <p>On the login screen, tap <strong>Forgot Password</strong> and enter your email address. We'll send you a link to reset your password. Check your spam folder if you don't see the email within a few minutes.</p>
    </div>
  `));
});

export default router;
