import Link from "next/link";
import { TrendingUp, ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-bg">
      <header className="h-14 flex items-center justify-between px-4 md:px-6 border-b border-border bg-elevated/50">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-cta flex items-center justify-center">
            <TrendingUp className="w-3.5 h-3.5 text-cta-ink" />
          </div>
          <span className="font-bold text-sm">Freestocks</span>
        </Link>
        <Link href="/" className="text-xs text-muted hover:text-foreground flex items-center gap-1">
          <ArrowLeft className="w-3 h-3" />
          Back
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-4 md:px-6 py-8">
        <h1 className="text-2xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted mb-8">Last Updated: September 2026</p>

        <div className="space-y-8 text-sm leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold mb-3 text-foreground">1. Introduction</h2>
            <p className="text-muted mb-3">
              This Privacy Policy explains how Freestocks (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) collects, uses, shares, 
              and protects your personal information when you use our website and services (collectively, the &quot;Services&quot;).
            </p>
            <p className="text-muted mb-3">
              <strong className="text-foreground">PLEASE READ THIS PRIVACY POLICY CAREFULLY.</strong> By accessing or using 
              the Services, you acknowledge that you have read, understood, and agree to be bound by this Privacy Policy. 
              If you do not agree to this Privacy Policy, please do not access or use the Services.
            </p>
            <p className="text-muted">
              This Privacy Policy is incorporated into and subject to our <Link href="/terms" className="text-cta hover:underline">Terms of Service</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3 text-foreground">2. Information We Collect</h2>
            <p className="text-muted mb-3">
              We collect information in several ways when you use our Services:
            </p>
            
            <h3 className="text-base font-medium mb-2 text-foreground">2.1 Information You Provide Directly</h3>
            <ul className="list-disc list-inside text-muted space-y-2 ml-2 mb-4">
              <li><strong className="text-foreground">Account Information:</strong> When you create an account, we collect your email address and password (hashed). If you register using a social login provider (Google, Apple, or Facebook), we receive your email address and basic profile information from that provider.</li>
              <li><strong className="text-foreground">Wallet Information:</strong> When you redeem credits for tokenized stocks, we collect your Solana wallet address that you provide to receive your stocks.</li>
              <li><strong className="text-foreground">Communications:</strong> If you contact us through our FAQ page or support channels, we collect the content of your messages.</li>
            </ul>

            <h3 className="text-base font-medium mb-2 text-foreground">2.2 Information Collected Automatically</h3>
            <ul className="list-disc list-inside text-muted space-y-2 ml-2 mb-4">
              <li><strong className="text-foreground">Usage Data:</strong> We automatically collect information about how you interact with the Services, including pages visited, features used, and actions taken.</li>
              <li><strong className="text-foreground">Device Information:</strong> We collect information about your device, including IP address, browser type and version, operating system, device identifiers, and screen resolution.</li>
              <li><strong className="text-foreground">Log Data:</strong> Our servers automatically record information when you access the Services, including your IP address, access times, and referring URLs.</li>
            </ul>

            <h3 className="text-base font-medium mb-2 text-foreground">2.3 Information from Third Parties</h3>
            <ul className="list-disc list-inside text-muted space-y-2 ml-2">
              <li><strong className="text-foreground">Offerwall Providers:</strong> When you complete Offers through BitLabs, Ayet Studios, or other offerwall partners, they send us callback data including transaction IDs, credit amounts, and completion status. This data is used to credit your account.</li>
              <li><strong className="text-foreground">Authentication Providers:</strong> If you sign in using Google, Apple, or Facebook, we receive basic profile information as authorized by you during the authentication process.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3 text-foreground">3. How We Use Your Information</h2>
            <p className="text-muted mb-3">
              We use the information we collect for the following purposes:
            </p>
            <ul className="list-disc list-inside text-muted space-y-2 ml-2">
              <li><strong className="text-foreground">Provide and Maintain the Services:</strong> To create and manage your account, process Offer completions, maintain your credit ledger, and deliver the features you use.</li>
              <li><strong className="text-foreground">Process Redemptions:</strong> When stock redemptions become available, to process your redemption requests using your provided wallet address.</li>
              <li><strong className="text-foreground">Fraud Prevention and Security:</strong> To detect, investigate, and prevent fraudulent activity, abuse, and violations of our Terms of Service. This includes analyzing usage patterns, IP addresses, and device information.</li>
              <li><strong className="text-foreground">Chargebacks:</strong> To process chargebacks when our offerwall partners reverse credits due to fraud or policy violations.</li>
              <li><strong className="text-foreground">Communications:</strong> To respond to your inquiries and support requests, and to send you important service-related notices.</li>
              <li><strong className="text-foreground">Improvements:</strong> To understand how users interact with the Services and to improve our features and user experience.</li>
              <li><strong className="text-foreground">Legal Compliance:</strong> To comply with applicable laws, regulations, and legal processes.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3 text-foreground">4. How We Share Your Information</h2>
            <p className="text-muted mb-3">
              We do not sell your personal information. We may share your information in the following circumstances:
            </p>

            <h3 className="text-base font-medium mb-2 text-foreground">4.1 Offerwall Partners</h3>
            <p className="text-muted mb-3">
              When you access Offers through our Services, our offerwall partners (including BitLabs and Ayet Studios) 
              may collect information directly from you. Your interactions with these partners are subject to their 
              own privacy policies. We share your user ID with these partners to track and credit Offer completions.
            </p>

            <h3 className="text-base font-medium mb-2 text-foreground">4.2 Service Providers</h3>
            <p className="text-muted mb-3">
              We use third-party service providers to help us operate and improve the Services:
            </p>
            <ul className="list-disc list-inside text-muted space-y-2 ml-2 mb-4">
              <li><strong className="text-foreground">Neon:</strong> Database hosting and storage.</li>
              <li><strong className="text-foreground">Vercel:</strong> Application hosting, deployment, and edge computing.</li>
              <li><strong className="text-foreground">Authentication Providers:</strong> Google, Apple, and Facebook process authentication on our behalf when you use social login.</li>
            </ul>
            <p className="text-muted mb-3">
              These service providers have access to your information only to perform specific tasks on our behalf 
              and are obligated to protect your information in accordance with their own privacy policies.
            </p>

            <h3 className="text-base font-medium mb-2 text-foreground">4.3 Legal Requirements</h3>
            <p className="text-muted mb-3">
              We may disclose your information if required to do so by law or in response to valid legal requests, 
              including subpoenas, court orders, or government inquiries. We may also disclose information when we 
              believe disclosure is necessary to protect our rights, your safety, the safety of others, or to 
              investigate fraud.
            </p>

            <h3 className="text-base font-medium mb-2 text-foreground">4.4 Business Transfers</h3>
            <p className="text-muted">
              If Freestocks is involved in a merger, acquisition, or sale of assets, your information may be 
              transferred as part of that transaction. We will notify you of any such change and any choices 
              you may have regarding your information.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3 text-foreground">5. Cookies and Tracking Technologies</h2>
            <p className="text-muted mb-3">
              We use cookies and similar tracking technologies to operate and improve the Services:
            </p>
            <ul className="list-disc list-inside text-muted space-y-2 ml-2 mb-4">
              <li><strong className="text-foreground">Essential Cookies:</strong> Required for the Services to function, including authentication session cookies that keep you logged in.</li>
              <li><strong className="text-foreground">Analytics:</strong> We may use analytics tools to understand how users interact with the Services.</li>
            </ul>
            <p className="text-muted mb-3">
              Our offerwall partners may also use cookies and tracking technologies when you interact with Offers. 
              These are governed by their respective privacy policies.
            </p>
            <p className="text-muted">
              You can control cookies through your browser settings. Note that disabling certain cookies may 
              affect the functionality of the Services.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3 text-foreground">6. Data Security</h2>
            <p className="text-muted mb-3">
              We implement industry-standard security measures to protect your personal information:
            </p>
            <ul className="list-disc list-inside text-muted space-y-2 ml-2 mb-4">
              <li><strong className="text-foreground">Encryption:</strong> All data transmitted between your browser and our servers is encrypted using HTTPS/TLS.</li>
              <li><strong className="text-foreground">Password Security:</strong> Passwords are hashed using secure algorithms and are never stored in plain text.</li>
              <li><strong className="text-foreground">Access Controls:</strong> Access to user data is restricted and protected by authentication and authorization mechanisms.</li>
              <li><strong className="text-foreground">Infrastructure Security:</strong> Our hosting providers (Vercel and Neon) maintain robust security controls and certifications.</li>
            </ul>
            <p className="text-muted">
              While we take reasonable precautions to protect your information, no method of transmission over 
              the Internet or electronic storage is completely secure. We cannot guarantee absolute security of 
              your data.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3 text-foreground">7. Data Retention</h2>
            <p className="text-muted mb-3">
              We retain your personal information for as long as necessary to fulfill the purposes described 
              in this Privacy Policy, unless a longer retention period is required or permitted by law.
            </p>
            <ul className="list-disc list-inside text-muted space-y-2 ml-2">
              <li><strong className="text-foreground">Account Data:</strong> Retained while your account is active and for a reasonable period thereafter.</li>
              <li><strong className="text-foreground">Transaction Records:</strong> Credit and ledger transaction records may be retained for legal, accounting, and audit purposes even after account deletion.</li>
              <li><strong className="text-foreground">Fraud Prevention:</strong> Data related to fraud investigations may be retained indefinitely to prevent future abuse.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3 text-foreground">8. Your Rights and Choices</h2>
            <p className="text-muted mb-3">
              Depending on your location, you may have certain rights regarding your personal information:
            </p>
            <ul className="list-disc list-inside text-muted space-y-2 ml-2 mb-4">
              <li><strong className="text-foreground">Access:</strong> You may request a copy of the personal information we hold about you.</li>
              <li><strong className="text-foreground">Correction:</strong> You may request that we correct inaccurate or incomplete information.</li>
              <li><strong className="text-foreground">Deletion:</strong> You may request that we delete your personal information, subject to certain exceptions (such as legal compliance requirements).</li>
              <li><strong className="text-foreground">Data Portability:</strong> Where applicable, you may request a copy of your data in a structured, machine-readable format.</li>
              <li><strong className="text-foreground">Opt-Out:</strong> You may opt out of certain data collection by adjusting your browser settings or not using specific features.</li>
            </ul>
            <p className="text-muted mb-3">
              To exercise any of these rights, please contact us through 
              our <Link href="/faq" className="text-cta hover:underline">FAQ page</Link>. We will respond to your 
              request within a reasonable timeframe.
            </p>
            <p className="text-muted">
              <strong className="text-foreground">Account Deletion:</strong> You may request deletion of your account at any time. 
              Upon deletion, your profile information will be removed, but certain transaction records may be 
              retained for legal and accounting purposes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3 text-foreground">9. Children&apos;s Privacy</h2>
            <p className="text-muted mb-3">
              <strong className="text-foreground">The Services are not intended for users under the age of eighteen (18).</strong> We 
              do not knowingly collect personal information from anyone under 18 years of age.
            </p>
            <p className="text-muted">
              If we become aware that we have collected personal information from a user under 18, we will take 
              steps to delete that information promptly. If you believe we may have collected information from 
              a person under 18, please contact us through our FAQ page.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3 text-foreground">10. International Data Transfers</h2>
            <p className="text-muted">
              Your information may be transferred to, stored, and processed in countries other than your own. 
              Our service providers, including Vercel and Neon, may process data in various locations around 
              the world. By using the Services, you consent to the transfer of your information to countries 
              that may have different data protection laws than your jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3 text-foreground">11. Third-Party Links and Services</h2>
            <p className="text-muted mb-3">
              The Services may contain links to third-party websites, services, or content that are not owned 
              or controlled by Freestocks. This Privacy Policy applies only to information collected through 
              our Services.
            </p>
            <p className="text-muted">
              When you interact with Offers from BitLabs, Ayet Studios, or other partners, you are subject to 
              their privacy policies and terms. We encourage you to review the privacy policies of any third-party 
              services you access through our platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3 text-foreground">12. Changes to This Privacy Policy</h2>
            <p className="text-muted mb-3">
              We may update this Privacy Policy from time to time to reflect changes in our practices, 
              technology, legal requirements, or other factors. When we make material changes, we will:
            </p>
            <ul className="list-disc list-inside text-muted space-y-2 ml-2 mb-4">
              <li>Update the &quot;Last Updated&quot; date at the top of this page.</li>
              <li>Post the revised Privacy Policy on this page.</li>
              <li>For significant changes, we may provide additional notice through the Services.</li>
            </ul>
            <p className="text-muted">
              Your continued use of the Services after any changes indicates your acceptance of the updated 
              Privacy Policy. We encourage you to review this Privacy Policy periodically.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3 text-foreground">13. Contact</h2>
            <p className="text-muted">
              If you have any questions, concerns, or requests regarding this Privacy Policy or our data 
              practices, please contact us through 
              the <Link href="/faq" className="text-cta hover:underline">Freestocks FAQ page</Link>.
            </p>
          </section>

        </div>

        <div className="mt-10 pt-6 border-t border-border">
          <Link href="/terms" className="text-sm text-cta hover:underline">
            View Terms of Service →
          </Link>
        </div>
      </main>
    </div>
  );
}
