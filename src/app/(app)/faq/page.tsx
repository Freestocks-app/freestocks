"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle, Mail } from "lucide-react";

const faqs = [
  {
    question: "How does Freestocks work?",
    answer:
      "Earn cash by completing offers — surveys, games, app downloads. Once you hit $5, cashout for tokenized stock sent to your Solana wallet. No deposits needed.",
  },
  {
    question: "How do I earn?",
    answer:
      "Head to Earn and browse offers. Surveys pay $0.25–$2, games can pay $2–$10 for reaching milestones, app signups vary. Each shows payout upfront.",
  },
  {
    question: "When do earnings credit?",
    answer:
      "Most offers credit in 5–30 minutes. Games requiring milestones may take 24–48 hours for verification. Survey payouts are usually instant.",
  },
  {
    question: "What's the minimum to cashout?",
    answer:
      "$5.00 minimum. This ensures you receive meaningful fractional shares. Your tokenized stock is sent to your Solana wallet.",
  },
  {
    question: "Which stocks can I get?",
    answer:
      "Tesla, NVIDIA, Apple, Amazon, Google, Microsoft, Meta, SpaceX, and more. All tokenized on Solana via xStocks.",
  },
  {
    question: "Why didn't my offer credit?",
    answer:
      "Common issues: VPN/ad-blocker active, requirements not met, already completed before. Disable VPN, read full requirements, complete on same device.",
  },
  {
    question: "How do cashouts work?",
    answer:
      "Pick a stock, verify email via OTP, confirm your Solana wallet. We send tokenized shares to your wallet with a transaction link to verify on-chain.",
  },
  {
    question: "Is this secure?",
    answer:
      "Yes. Passwords encrypted, sessions secured with HTTP-only cookies, all connections use HTTPS. Your balance is tracked in a secure ledger.",
  },
];

function FAQItem({ question, answer, isLast }: { question: string; answer: string; isLast: boolean }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={!isLast ? "border-b border-border" : ""}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-elevated/30 transition-colors min-h-[48px]"
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
    <div className="min-h-[calc(100vh-4rem)] pb-20 md:pb-6">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-cta/10 flex items-center justify-center mx-auto mb-3">
            <HelpCircle className="w-6 h-6 text-cta" />
          </div>
          <h1 className="text-xl font-bold">FAQ</h1>
        </div>

        <div className="card mb-6">
          {faqs.map((faq, index) => (
            <FAQItem 
              key={index} 
              question={faq.question} 
              answer={faq.answer}
              isLast={index === faqs.length - 1}
            />
          ))}
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cta/10 border border-cta/20 flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 text-cta" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">Still have questions?</p>
              <p className="text-xs text-muted">support@freestocks.app</p>
            </div>
            <a
              href="mailto:support@freestocks.app"
              className="btn-primary text-xs py-2 px-3"
            >
              Contact
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
