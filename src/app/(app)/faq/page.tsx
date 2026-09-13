"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle, Mail } from "lucide-react";

const faqs = [
  {
    question: "How does Freestocks work?",
    answer:
      "Freestocks partners with advertisers who pay us when you complete offers — downloading apps, playing games, taking surveys, and more. We share that revenue directly with you as USD cash credits. Once you reach $5.00, you can redeem your balance for fractional shares of top companies like Apple, Tesla, and NVIDIA. No deposits or purchases required.",
  },
  {
    question: "How do I earn money?",
    answer:
      "Head to the Earn page to browse available offers. You'll find surveys (usually $0.25–$2.00, taking 5–15 minutes), app downloads (earn for signing up or reaching milestones), and mobile games (play to specific levels for larger payouts). Each offer shows its payout upfront so you know exactly what you'll earn before starting.",
  },
  {
    question: "How long until I see my earnings?",
    answer:
      "Most offers credit within 5–30 minutes of completion. Game offers that require reaching specific levels may take 24–48 hours as advertisers verify progress. Survey payouts are typically instant. If an offer doesn't credit within 48 hours and you've met all requirements, contact our support team with details.",
  },
  {
    question: "What's the minimum to unlock stocks?",
    answer:
      "You need at least $5.00 in your balance to redeem for stocks. This threshold ensures you can receive meaningful fractional shares. There's no maximum — earn as much as you want and redeem when ready. Your tokenized stocks will be delivered to your Solana wallet.",
  },
  {
    question: "Which stocks can I get?",
    answer:
      "We're launching with fractional shares of popular companies including Apple (AAPL), Tesla (TSLA), NVIDIA (NVDA), Amazon (AMZN), Google (GOOGL), Microsoft (MSFT), and more. The selection will expand over time based on demand and availability.",
  },
  {
    question: "Is my account secure?",
    answer:
      "Absolutely. We use industry-standard security: passwords are encrypted with bcrypt, sessions are secured with HTTP-only cookies, and all connections use HTTPS. Your balance is tracked in a secure ledger with full transaction history. We never store sensitive payment information.",
  },
  {
    question: "Why didn't my offer credit?",
    answer:
      "Common reasons: using a VPN or ad-blocker (disable both before starting), not meeting all offer requirements, having completed the offer before, or advertiser rejection. Always read the full offer details, complete on the same device you started, and don't close the app before finishing. Still missing credit? Contact support with the offer name and completion date.",
  },
  {
    question: "Offers show 'VPN detected' — what do I do?",
    answer:
      "Advertisers block VPNs to prevent fraud. Before browsing offers: turn off any VPN, disable ad-blockers, and if on mobile, disconnect from work/school networks that might route through proxies. Try using your regular mobile data or home WiFi. After disabling, refresh the Earn page.",
  },
  {
    question: "How do stock redemptions work?",
    answer:
      "Once you reach the $5.00 minimum balance, you can unlock tokenized fractional shares of top companies. Verify your email, and your tokenized stocks will be sent to your Solana wallet. You'll receive a transaction link to confirm delivery on-chain.",
  },
  {
    question: "Can I cash out instead of getting stocks?",
    answer:
      "Right now, Freestocks focuses exclusively on stock redemptions — it's what makes us unique. We may add cash-out options (like PayPal or gift cards) in the future based on user feedback. Let us know what you'd prefer!",
  },
];

function FAQItem({ question, answer, isLast }: { question: string; answer: string; isLast: boolean }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={!isLast ? "border-b border-border" : ""}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-elevated/30 transition-colors"
      >
        <span className="font-medium text-sm pr-4">{question}</span>
        <ChevronDown
          className={`w-4 h-4 text-muted flex-shrink-0 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      {isOpen && (
        <div className="px-4 pb-3">
          <p className="text-muted text-sm leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}

export default function FAQPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] pb-24 md:pb-6">
      <div className="px-4 md:px-6 py-3 border-b border-border bg-elevated/50">
        <div className="max-w-3xl mx-auto flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-cta/10 flex items-center justify-center">
            <HelpCircle className="w-4 h-4 text-cta" />
          </div>
          <h1 className="text-base font-bold">FAQ</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-6 py-4">
        <div className="card mb-4">
          <div className="px-4 py-2 border-b border-border bg-elevated/30">
            <span className="text-xs font-medium text-muted uppercase tracking-wide">Common Questions</span>
          </div>
          {faqs.map((faq, index) => (
            <FAQItem 
              key={index} 
              question={faq.question} 
              answer={faq.answer}
              isLast={index === faqs.length - 1}
            />
          ))}
        </div>

        <div className="card p-4 border-cta/20 bg-cta/5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-cta/10 border border-cta/20 flex items-center justify-center flex-shrink-0">
              <Mail className="w-4 h-4 text-cta" />
            </div>
            <div>
              <p className="font-semibold text-sm mb-1">Still have questions?</p>
              <p className="text-xs text-muted mb-3">
                Our support team is ready to help.
              </p>
              <a
                href="mailto:support@freestocks.app"
                className="btn-primary text-xs py-2 px-3"
              >
                Contact Support
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
