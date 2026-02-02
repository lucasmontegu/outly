import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Outly",
  description: "Outly Terms of Service - Rules and guidelines for using our service",
};

export default function TermsOfServicePage() {
  return (
    <main className="container mx-auto max-w-3xl px-4 py-12">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>Terms of Service</h1>
        <p className="text-muted-foreground">Last Updated: February 2, 2026</p>

        <p>
          Welcome to Outly. Please read these Terms of Service (&quot;Terms&quot;) carefully before
          using the Outly mobile application (&quot;Service&quot;) operated by Outly
          (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;).
        </p>
        <p>By accessing or using the Service, you agree to be bound by these Terms.</p>

        <h2>1. Description of Service</h2>
        <p>Outly provides risk intelligence for travel decisions by combining:</p>
        <ul>
          <li>Real-time weather data</li>
          <li>Traffic conditions</li>
          <li>Community-reported events</li>
        </ul>
        <p>
          The Service generates risk scores (0-100) to help you make informed departure decisions.
        </p>

        <h2>2. Eligibility</h2>
        <p>
          You must be at least 13 years old to use the Service. By using the Service, you represent
          that you meet this requirement.
        </p>

        <h2>3. Account Registration</h2>
        <p>To access certain features, you must create an account. You agree to:</p>
        <ul>
          <li>Provide accurate and complete information</li>
          <li>Maintain the security of your account credentials</li>
          <li>Notify us immediately of unauthorized access</li>
          <li>Accept responsibility for all activities under your account</li>
        </ul>

        <h2>4. Acceptable Use</h2>
        <p>You agree NOT to:</p>
        <ul>
          <li>Submit false, misleading, or malicious event reports</li>
          <li>Manipulate community voting systems</li>
          <li>Attempt to gain unauthorized access to the Service</li>
          <li>Use the Service for illegal purposes</li>
          <li>Interfere with other users&apos; enjoyment of the Service</li>
          <li>Reverse engineer or attempt to extract source code</li>
          <li>Use automated systems to access the Service without permission</li>
        </ul>

        <h2>5. Community Contributions</h2>

        <h3>Event Reports</h3>
        <p>When you report events or confirm/deny reports:</p>
        <ul>
          <li>You grant us a license to use this information</li>
          <li>You represent that your contributions are accurate to the best of your knowledge</li>
          <li>False reports may result in account suspension</li>
        </ul>

        <h3>Trust and Gamification</h3>
        <ul>
          <li>Points, levels, and badges are part of our quality assurance system</li>
          <li>We reserve the right to adjust, reset, or remove gamification data</li>
          <li>Trust decay occurs on inactive accounts to maintain data quality</li>
        </ul>

        <h2>6. Subscription Services (Outly Pro)</h2>

        <h3>Pricing</h3>
        <ul>
          <li>Monthly: $4.99 USD</li>
          <li>Annual: $29.99 USD</li>
        </ul>
        <p>Prices may vary by region and are subject to change.</p>

        <h3>Billing</h3>
        <ul>
          <li>Subscriptions are billed through Apple App Store or Google Play</li>
          <li>Automatic renewal unless cancelled 24 hours before period end</li>
          <li>Manage subscriptions through your device&apos;s app store settings</li>
        </ul>

        <h3>Pro Features</h3>
        <p>Pro subscribers receive:</p>
        <ul>
          <li>Smart Departure Advisor</li>
          <li>7-Day Risk Forecasts</li>
          <li>Time-based alerts</li>
          <li>CarPlay integration (when available)</li>
        </ul>

        <h2>7. Disclaimer of Warranties</h2>
        <p>
          <strong>THE SERVICE IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTIES OF ANY KIND.</strong>
        </p>
        <p>We do not guarantee:</p>
        <ul>
          <li>Accuracy of weather, traffic, or community data</li>
          <li>Availability or uninterrupted access</li>
          <li>That risk scores will prevent accidents or delays</li>
          <li>Compatibility with all devices</li>
        </ul>

        <h2>8. Limitation of Liability</h2>
        <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4 my-4">
          <p className="font-semibold text-amber-800 dark:text-amber-200">
            IMPORTANT: OUTLY IS AN INFORMATIONAL TOOL, NOT A SAFETY GUARANTEE.
          </p>
        </div>
        <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW:</p>
        <ul>
          <li>We are not liable for decisions you make based on our risk scores</li>
          <li>
            We are not liable for any direct, indirect, incidental, or consequential damages
          </li>
          <li>
            Our total liability shall not exceed the amount you paid for the Service in the past 12
            months
          </li>
        </ul>
        <p>
          <strong>YOU ACKNOWLEDGE THAT:</strong>
        </p>
        <ul>
          <li>Weather and traffic conditions can change rapidly</li>
          <li>Community reports may be inaccurate or outdated</li>
          <li>Risk scores are estimates, not guarantees</li>
          <li>You remain responsible for your own safety decisions</li>
        </ul>

        <h2>9. Indemnification</h2>
        <p>You agree to indemnify and hold us harmless from claims arising from:</p>
        <ul>
          <li>Your violation of these Terms</li>
          <li>Your use of the Service</li>
          <li>False event reports you submit</li>
          <li>Your violation of any third-party rights</li>
        </ul>

        <h2>10. Third-Party Services</h2>
        <p>The Service integrates with third-party providers:</p>
        <ul>
          <li>
            <strong>Authentication</strong>: Clerk, Apple Sign-In, Google Sign-In
          </li>
          <li>
            <strong>Weather</strong>: OpenWeatherMap, Tomorrow.io
          </li>
          <li>
            <strong>Traffic</strong>: HERE Technologies
          </li>
          <li>
            <strong>Payments</strong>: RevenueCat, Apple, Google
          </li>
        </ul>
        <p>Your use of these services is subject to their respective terms and policies.</p>

        <h2>11. Intellectual Property</h2>
        <p>
          All content, features, and functionality of the Service are owned by Outly and protected
          by copyright, trademark, and other intellectual property laws.
        </p>
        <p>
          You may not copy, modify, distribute, or create derivative works without our express
          written consent.
        </p>

        <h2>12. Termination</h2>

        <h3>By You</h3>
        <p>You may delete your account at any time through the app settings.</p>

        <h3>By Us</h3>
        <p>We may suspend or terminate your account if you:</p>
        <ul>
          <li>Violate these Terms</li>
          <li>Engage in fraudulent activity</li>
          <li>Submit repeated false reports</li>
          <li>Abuse community features</li>
        </ul>

        <h3>Effect of Termination</h3>
        <p>Upon termination:</p>
        <ul>
          <li>Your access to the Service will cease</li>
          <li>Your data will be deleted per our Privacy Policy</li>
          <li>Active subscriptions will not be refunded for the current period</li>
        </ul>

        <h2>13. Modifications to Terms</h2>
        <p>We may modify these Terms at any time. Material changes will be communicated through:</p>
        <ul>
          <li>In-app notifications</li>
          <li>Email to registered users</li>
        </ul>
        <p>Continued use after changes constitutes acceptance of the new Terms.</p>

        <h2>14. Dispute Resolution</h2>

        <h3>Informal Resolution</h3>
        <p>
          Before filing a claim, you agree to contact us at legal@outly.app to attempt resolution.
        </p>

        <h3>Class Action Waiver</h3>
        <p>
          You agree to resolve disputes individually and waive any right to participate in class
          actions.
        </p>

        <h2>15. Severability</h2>
        <p>
          If any provision of these Terms is found unenforceable, the remaining provisions will
          continue in effect.
        </p>

        <h2>16. Entire Agreement</h2>
        <p>
          These Terms, together with our{" "}
          <a href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </a>
          , constitute the entire agreement between you and Outly.
        </p>

        <h2>17. Contact</h2>
        <p>For questions about these Terms:</p>
        <ul>
          <li>
            <strong>Email</strong>: legal@outly.app
          </li>
        </ul>

        <hr />

        <p className="text-sm text-muted-foreground">
          By using Outly, you acknowledge that you have read, understood, and agree to be bound by
          these Terms of Service.
        </p>
      </article>
    </main>
  );
}
