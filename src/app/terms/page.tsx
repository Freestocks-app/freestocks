import Link from "next/link";
import { TrendingUp, ArrowLeft } from "lucide-react";

export default function TermsPage() {
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
        <h1 className="text-2xl font-bold mb-2">Terms of Service</h1>
        <p className="text-sm text-muted mb-8">Last Updated: September 2026</p>

        <div className="space-y-8 text-sm leading-relaxed">
          
          <section>
            <h2 className="text-lg font-semibold mb-3 text-foreground">1. Acceptance of Terms</h2>
            <p className="text-muted mb-3">
              These Terms of Service (&quot;Terms&quot;) are entered into by and between you and Freestocks (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;). 
              These Terms govern your access to and use of the Freestocks website and services, including any content, features, 
              and functionality offered through our platform (collectively, the &quot;Services&quot;).
            </p>
            <p className="text-muted mb-3">
              <strong className="text-foreground">PLEASE READ THESE TERMS CAREFULLY BEFORE USING THE SERVICES.</strong> By creating an account, 
              accessing, or using the Services, you accept and agree to be bound by these Terms and our Privacy Policy. 
              If you do not agree to these Terms or the Privacy Policy, you must not access or use the Services.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3 text-foreground">2. Eligibility</h2>
            <p className="text-muted mb-3">
              The Services are offered and available to users who are at least eighteen (18) years of age or older. 
              By using the Services, you represent and warrant that you are at least 18 years old and have the legal 
              capacity to enter into a binding agreement.
            </p>
            <p className="text-muted mb-3">
              <strong className="text-foreground">IF YOU DO NOT MEET THESE REQUIREMENTS, YOU MUST NOT ACCESS OR USE THE SERVICES.</strong>
            </p>
            <p className="text-muted">
              Participation on Freestocks is limited to only one (1) account per person.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3 text-foreground">3. Changes to Terms</h2>
            <p className="text-muted">
              We may revise and update these Terms from time to time at our sole discretion. All changes are effective 
              immediately when posted and apply to all access to and use of the Services thereafter. Your continued use 
              of the Services following the posting of revised Terms means that you accept and agree to the changes. 
              You are expected to check this page periodically so you are aware of any changes, as they are binding on you.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3 text-foreground">4. Your Account</h2>
            <p className="text-muted mb-3">
              To access certain features of the Services, you must create an account. You may register using your email 
              address and password, or through supported third-party authentication providers (Google, Apple, or Facebook).
            </p>
            <ul className="list-disc list-inside text-muted space-y-2 ml-2">
              <li>You must provide accurate, current, and complete information during registration.</li>
              <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
              <li>You agree to notify us immediately of any unauthorized access to or use of your account.</li>
              <li>Your account is personal to you — you may not share access with any other person.</li>
              <li>We reserve the right to disable any account at any time for any reason, including violation of these Terms.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3 text-foreground">5. Credits and Rewards Program</h2>
            <p className="text-muted mb-3">
              Freestocks offers a rewards program where you may earn credits (displayed as USD dollar amounts) by 
              completing offers, surveys, games, and other activities through our offerwall partners, including 
              BitLabs, Ayet Studios, and other partners we may add from time to time (collectively, &quot;Offers&quot;).
            </p>
            <ul className="list-disc list-inside text-muted space-y-2 ml-2 mb-3">
              <li>Credits are deposited into your Freestocks account ledger upon successful completion and verification of Offers.</li>
              <li>Credits are tracked in US dollars (displayed as $X.XX) and stored as integer cents internally.</li>
              <li>Offer completion and credit amounts are determined by our third-party offerwall partners, not by Freestocks.</li>
              <li>We are not responsible for Offers that are not properly tracked, recorded, or validated by our partners.</li>
              <li>We reserve the right to change available Offers, credit amounts, and program terms at any time.</li>
            </ul>
            <p className="text-muted">
              <strong className="text-foreground">Credits have no cash value until redeemed</strong> through an available 
              redemption method. Unredeemed credits remain the property of Freestocks and may be forfeited upon account 
              termination for violation of these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3 text-foreground">6. Redeeming Credits — Stock Unlock</h2>
            <p className="text-muted mb-3">
              You may redeem accumulated credits (stored as integer cents, displayed in USD) for tokenized 
              fractional shares of stocks. Redemptions are processed as follows:
            </p>
            <ul className="list-disc list-inside text-muted space-y-2 ml-2 mb-3">
              <li><strong className="text-foreground">Minimum threshold:</strong> You must have at least $5.00 in your balance to initiate a redemption.</li>
              <li><strong className="text-foreground">Wallet requirement:</strong> You must provide a valid Solana wallet address to receive your tokenized stocks.</li>
              <li><strong className="text-foreground">Delivery:</strong> Tokenized stocks are sent to your Solana wallet. Transaction details and confirmation links are provided upon completion.</li>
              <li><strong className="text-foreground">Processing time:</strong> Redemptions are processed by our team and are not instant on-chain transfers. Processing times may vary.</li>
            </ul>
            <p className="text-muted mb-3">
              Credits are deducted from your balance upon successful submission of a redemption request. 
              Once submitted, redemption requests cannot be cancelled.
            </p>
            <p className="text-muted">
              We reserve the right to modify redemption requirements, minimum thresholds, available stocks, 
              and supported networks at any time. Any changes will be reflected on our platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3 text-foreground">7. Chargebacks and Reversals</h2>
            <p className="text-muted mb-3">
              If an offerwall partner reverses a credit (due to fraud, refund, policy violation, or other reasons), 
              we will debit the corresponding amount from your account balance. This is referred to as a &quot;chargeback.&quot;
            </p>
            <ul className="list-disc list-inside text-muted space-y-2 ml-2">
              <li>Chargebacks may occur at any time after credits are awarded.</li>
              <li>Your balance cannot go below zero as a result of a chargeback.</li>
              <li>We are not liable for chargebacks initiated by our offerwall partners.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3 text-foreground">8. Restrictions and Prohibited Uses</h2>
            <p className="text-muted mb-3">
              You agree to use the Services only for lawful purposes and in accordance with these Terms. You agree NOT to:
            </p>
            <ul className="list-disc list-inside text-muted space-y-2 ml-2 mb-3">
              <li>Create or maintain more than one account.</li>
              <li>Use a VPN, proxy, or similar service while completing Offers or using the Services.</li>
              <li>Use emulator software or virtual machines to access the Services.</li>
              <li>Use fake phone numbers, Google Voice, VOIP, or similar services for verification.</li>
              <li>Use bots, scripts, macros, or automation tools to interact with the Services or Offers.</li>
              <li>Submit false information, impersonate others, or engage in fraudulent activity.</li>
              <li>Manipulate or attempt to manipulate Offer completion, survey responses, or credit tracking.</li>
              <li>Interfere with, disrupt, or attempt to gain unauthorized access to the Services.</li>
              <li>Violate any applicable laws, regulations, or third-party rights.</li>
            </ul>
            <p className="text-muted">
              Violation of these restrictions may result in immediate account termination and forfeiture of all 
              credits, without notice or compensation.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3 text-foreground">9. Account Reviews</h2>
            <p className="text-muted mb-3">
              To maintain platform integrity and prevent fraud, we may conduct routine or targeted reviews of accounts. 
              In connection with any review, you agree to:
            </p>
            <ul className="list-disc list-inside text-muted space-y-2 ml-2">
              <li>Provide any additional information or documentation we reasonably request.</li>
              <li>Cooperate fully and in good faith with any review process.</li>
              <li>Understand that failure to cooperate may result in withholding, suspension, or forfeiture of credits and/or account termination.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3 text-foreground">10. Termination</h2>
            <p className="text-muted mb-3">
              We may suspend, restrict, or terminate your account and access to the Services at any time, for any reason, 
              including but not limited to:
            </p>
            <ul className="list-disc list-inside text-muted space-y-2 ml-2 mb-3">
              <li>Violation of these Terms or our policies.</li>
              <li>Fraudulent, abusive, or suspicious activity.</li>
              <li>Extended inactivity (accounts inactive for one year or more may be closed).</li>
              <li>At our sole discretion, with or without cause.</li>
            </ul>
            <p className="text-muted">
              Upon termination, any unredeemed credits in your account may be forfeited. You may close your own account 
              at any time by contacting us through the FAQ page.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3 text-foreground">11. Intellectual Property</h2>
            <p className="text-muted">
              The Services and all content, features, and functionality (including text, graphics, logos, and software) 
              are owned by Freestocks or our licensors and are protected by intellectual property laws. You may not 
              reproduce, distribute, modify, or create derivative works from any part of the Services without our 
              prior written permission.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3 text-foreground">12. Third-Party Services</h2>
            <p className="text-muted">
              The Services integrate with third-party offerwall providers (BitLabs, Ayet Studios, and others) and 
              authentication providers (Google, Apple, Facebook). Your use of Offers is subject to the terms and 
              policies of those third parties. We are not responsible for the content, accuracy, or practices of 
              any third-party services. Links to third-party websites are provided for convenience only.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3 text-foreground">13. Disclaimer of Warranties</h2>
            <p className="text-muted mb-3">
              <strong className="text-foreground">THE SERVICES ARE PROVIDED ON AN &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; BASIS, WITHOUT 
              WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.</strong> We do not warrant that:
            </p>
            <ul className="list-disc list-inside text-muted space-y-2 ml-2">
              <li>The Services will be uninterrupted, error-free, or secure.</li>
              <li>Any specific Offers will be available or credit at particular amounts.</li>
              <li>Stock redemptions will launch by any particular date or at all.</li>
              <li>Credits will have any particular monetary value upon redemption.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3 text-foreground">14. Limitation of Liability</h2>
            <p className="text-muted">
              <strong className="text-foreground">TO THE FULLEST EXTENT PERMITTED BY LAW, FREESTOCKS SHALL NOT BE LIABLE FOR ANY 
              INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES</strong>, including but not limited to 
              loss of profits, data, or goodwill, arising out of or in connection with your use of the Services, 
              whether based on warranty, contract, tort, or any other legal theory, even if we have been advised 
              of the possibility of such damages.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3 text-foreground">15. Indemnification</h2>
            <p className="text-muted">
              You agree to defend, indemnify, and hold harmless Freestocks and our affiliates, licensors, and 
              service providers from and against any claims, liabilities, damages, judgments, losses, costs, 
              or expenses (including reasonable attorneys&apos; fees) arising out of or relating to your violation 
              of these Terms or your use of the Services.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3 text-foreground">16. Governing Law</h2>
            <p className="text-muted">
              These Terms shall be governed by and construed in accordance with applicable law, without regard 
              to conflict of law principles. Any legal action or proceeding arising out of these Terms shall 
              be brought exclusively in the courts of competent jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3 text-foreground">17. Severability</h2>
            <p className="text-muted">
              If any provision of these Terms is held to be invalid, illegal, or unenforceable, such provision 
              shall be modified to the minimum extent necessary to make it valid and enforceable, or if modification 
              is not possible, shall be severed from these Terms. The remaining provisions shall continue in full 
              force and effect.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3 text-foreground">18. Entire Agreement</h2>
            <p className="text-muted">
              These Terms, together with our Privacy Policy, constitute the entire agreement between you and 
              Freestocks regarding your use of the Services and supersede all prior agreements and understandings.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3 text-foreground">19. Contact</h2>
            <p className="text-muted">
              If you have any questions, concerns, or feedback about these Terms, please contact us through 
              the <Link href="/faq" className="text-cta hover:underline">Freestocks FAQ page</Link>.
            </p>
          </section>

        </div>

        <div className="mt-10 pt-6 border-t border-border">
          <Link href="/privacy" className="text-sm text-cta hover:underline">
            View Privacy Policy →
          </Link>
        </div>
      </main>
    </div>
  );
}
