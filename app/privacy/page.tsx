import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | RoughCut BBQ',
  description: 'Privacy policy for RoughCut BBQ mobile and web applications.',
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
      <h1 className="text-3xl md:text-4xl font-extrabold text-brand-secondary mb-6 font-display">
        Privacy Policy
      </h1>
      
      <p className="text-sm text-brand-muted mb-8">Last Updated: July 2026</p>
      
      <div className="space-y-6 text-brand-text leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-brand-secondary mb-2">1. Overview</h2>
          <p>
            RoughCut BBQ (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) manages the RoughCut BBQ web application and mobile companion apps. 
            We respect your privacy and are committed to protecting it. This Privacy Policy details what information 
            we collect, how it is used, and your rights concerning your personal data.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-brand-secondary mb-2">2. Information We Collect</h2>
          <p className="mb-2">We collect only the minimal data required to provide and improve our services:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Account Information:</strong> If you choose to sign up for an account, we collect your email address 
              and a secure hash of your password. Accounts are completely optional—you can use the cook calculator 
              without creating an account.
            </li>
            <li>
              <strong>User-Generated Content (UGC):</strong> If you choose to share your cooks, we store the photos you 
              upload and any comments or captions you provide.
            </li>
            <li>
              <strong>Performance & Usage Data:</strong> We may compile anonymous usage counts (e.g., total calculations run) 
              or collect anonymous analytics via PostHog to understand user activity and fix bugs.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-brand-secondary mb-2">3. Service Processors</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Supabase:</strong> We use Supabase as our backend database processor and photo storage solution.
            </li>
            <li>
              <strong>Vercel:</strong> Our application is hosted on Vercel, which monitors network traffic and keeps 
              the website accessible.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-brand-secondary mb-2">4. Data Safety & Deletion</h2>
          <p className="mb-2">
            All data is encrypted in transit using standard HTTPS protocol. We do not sell or lease your personal 
            information to any third parties or marketers.
          </p>
          <p>
            You have the right to request deletion of your account and all associated user-generated content at any 
            time. You can perform this self-service operation directly on our 
            {" "}<Link href="/account/delete" className="text-brand-secondary hover:underline font-semibold">Account Deletion Page</Link> 
            or reach out to us at 
            {" "}<a href="mailto:support@roughcut.com.au" className="text-brand-secondary hover:underline font-semibold">support@roughcut.com.au</a> 
            for assistance.
          </p>
        </section>

        <section className="pt-4 border-t border-brand-muted/20">
          <p>
            If you have any questions or concern regarding this policy, please contact us at: 
            {" "}<a href="mailto:support@roughcut.com.au" className="text-brand-secondary hover:underline font-semibold">support@roughcut.com.au</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
