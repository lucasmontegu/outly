import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Outia",
  description: "Outia Privacy Policy - How we collect, use, and protect your data",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="container mx-auto max-w-3xl px-4 py-12">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>Privacy Policy</h1>
        <p className="text-muted-foreground">Last Updated: February 2, 2026</p>

        <p>
          Outia (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) operates the Outia mobile
          application (the &quot;Service&quot;). This page informs you of our policies regarding
          the collection, use, and disclosure of personal data when you use our Service.
        </p>

        <h2>Information We Collect</h2>

        <h3>Location Data</h3>
        <p>We collect and process location data to provide our core service:</p>
        <ul>
          <li>
            <strong>Precise Location</strong>: Used to calculate real-time risk scores based on
            weather and traffic conditions in your area
          </li>
          <li>
            <strong>Background Location</strong>: With your permission, used to send proactive
            departure alerts and notifications about changing conditions on your saved routes
          </li>
          <li>
            <strong>Saved Locations</strong>: Home, work, and other locations you choose to save are
            stored to provide personalized risk assessments
          </li>
        </ul>

        <h3>Account Information</h3>
        <p>When you create an account, we collect:</p>
        <ul>
          <li>
            <strong>Email address</strong>: For account identification and communications
          </li>
          <li>
            <strong>Name</strong>: For personalization within the app
          </li>
          <li>
            <strong>Authentication tokens</strong>: Securely managed through Clerk authentication
            service
          </li>
        </ul>
        <p>
          If you sign in using Apple or Google, we receive only the information you authorize those
          services to share.
        </p>

        <h3>Usage Data</h3>
        <p>We collect information about how you interact with the Service:</p>
        <ul>
          <li>
            <strong>Event reports and confirmations</strong>: Community contributions to event
            accuracy
          </li>
          <li>
            <strong>Gamification data</strong>: Points, levels, badges, and trust scores
          </li>
          <li>
            <strong>Route preferences</strong>: Saved routes and departure time preferences
          </li>
          <li>
            <strong>App interactions</strong>: Feature usage to improve the Service
          </li>
        </ul>

        <h3>Device Information</h3>
        <ul>
          <li>
            <strong>Device identifiers</strong>: For push notification delivery
          </li>
          <li>
            <strong>Operating system and version</strong>: For compatibility and troubleshooting
          </li>
          <li>
            <strong>Time zone</strong>: For accurate time-based features
          </li>
        </ul>

        <h2>How We Use Your Information</h2>
        <p>We use collected data to:</p>
        <ol>
          <li>
            <strong>Provide the Service</strong>: Calculate risk scores, deliver weather and traffic
            information
          </li>
          <li>
            <strong>Send Notifications</strong>: Alert you about changing conditions and optimal
            departure times
          </li>
          <li>
            <strong>Enable Community Features</strong>: Process event reports and confirmations
          </li>
          <li>
            <strong>Improve the Service</strong>: Analyze usage patterns and fix issues
          </li>
          <li>
            <strong>Manage Your Account</strong>: Authenticate and secure your account
          </li>
        </ol>

        <h2>Data Sharing</h2>
        <p>We share data with the following third parties:</p>

        <h3>Service Providers</h3>
        <ul>
          <li>
            <strong>Clerk</strong>: Authentication services
          </li>
          <li>
            <strong>Convex</strong>: Secure data storage and real-time sync
          </li>
          <li>
            <strong>OpenWeatherMap & Tomorrow.io</strong>: Weather data (receives location
            coordinates)
          </li>
          <li>
            <strong>HERE Technologies</strong>: Traffic data (receives location coordinates)
          </li>
          <li>
            <strong>RevenueCat</strong>: Subscription management (for Pro features)
          </li>
        </ul>

        <h3>We Do NOT</h3>
        <ul>
          <li>Sell your personal data</li>
          <li>Share data with advertisers</li>
          <li>Use your data for purposes unrelated to the Service</li>
        </ul>

        <h2>Data Retention</h2>
        <ul>
          <li>
            <strong>Account data</strong>: Retained while your account is active
          </li>
          <li>
            <strong>Location history</strong>: Not stored; processed in real-time only
          </li>
          <li>
            <strong>Saved locations</strong>: Retained until you delete them or your account
          </li>
          <li>
            <strong>Community contributions</strong>: Retained to maintain data accuracy
          </li>
        </ul>

        <h2>Your Rights</h2>
        <p>You have the right to:</p>
        <ul>
          <li>
            <strong>Access</strong>: Request a copy of your data
          </li>
          <li>
            <strong>Correction</strong>: Update inaccurate information
          </li>
          <li>
            <strong>Deletion</strong>: Delete your account and associated data
          </li>
          <li>
            <strong>Portability</strong>: Export your data in a readable format
          </li>
          <li>
            <strong>Withdraw Consent</strong>: Disable location permissions at any time
          </li>
        </ul>
        <p>To exercise these rights, contact us at privacy@outia.app.</p>

        <h2>Data Security</h2>
        <p>We implement industry-standard security measures:</p>
        <ul>
          <li>Encrypted data transmission (TLS/SSL)</li>
          <li>Secure cloud infrastructure (Convex)</li>
          <li>Authentication through trusted providers (Clerk)</li>
          <li>No storage of sensitive credentials on device</li>
        </ul>

        <h2>Children&apos;s Privacy</h2>
        <p>
          Our Service is not directed to children under 13. We do not knowingly collect data from
          children. If you believe we have collected such data, contact us immediately.
        </p>

        <h2>Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy periodically. We will notify you of material changes
          through the app or via email.
        </p>

        <h2>Contact Us</h2>
        <p>For questions about this Privacy Policy:</p>
        <ul>
          <li>
            <strong>Email</strong>: privacy@outia.app
          </li>
        </ul>

        <h2>California Privacy Rights (CCPA)</h2>
        <p>
          California residents have additional rights under CCPA, including the right to know what
          data we collect and request deletion.
        </p>

        <h2>European Privacy Rights (GDPR)</h2>
        <p>
          EU residents have rights under GDPR including access, rectification, erasure, and data
          portability. Our legal basis for processing is:
        </p>
        <ul>
          <li>
            <strong>Consent</strong>: For location data and notifications
          </li>
          <li>
            <strong>Contract</strong>: To provide the Service you requested
          </li>
          <li>
            <strong>Legitimate Interest</strong>: For security and improvement purposes
          </li>
        </ul>
      </article>
    </main>
  );
}
