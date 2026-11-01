"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    question: "How are multi-step forecasts generated?",
    answer:
      "Lagged sales features (1, 7, 14, and 28 days prior) and rolling averages are computed strictly from historical dates prior to the forecast origin. For multi-day horizons, each step feeds its predicted value forward into subsequent lag features and estimates 80% and 95% uncertainty ranges from holdout residuals.",
  },
  {
    question: "How does Mercato calculate required stock and safety buffers?",
    answer:
      "Required stock combines expected demand over the supplier lead time with a safety buffer that accounts for both daily demand variation and supplier delivery lead-time variability. Shortfall is computed directly as max(0, required − available).",
  },
  {
    question: "Can I import my own retail transaction CSV files?",
    answer:
      "Yes. The Data workspace maps SKU, date, quantity, and price columns from standard CSV exports, filters cancelled or negative return rows, and aggregates daily unit sales onto a regular calendar.",
  },
  {
    question: "What happens when I add an item to a purchase order?",
    answer:
      "Adding a product creates or updates a draft purchase order in the review drawer. Drafting an order does not alter current on-hand stock; you can preview projected stock on the balance scale, export a formatted purchase order summary, or mark a submitted order as received when inventory arrives.",
  },
];

export function MethodologyAccordion() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const toggle = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <div className="bg-[#0A0F1D] rounded-[20px] border border-[#1558C9]/40 overflow-hidden pedestal-ground-shadow">
      <div className="p-6 sm:p-8 border-b border-white/[0.08]">
        <span className="text-[13px] font-semibold text-[#D4FF24] block">
          Methodology &amp; FAQ
        </span>
        <h3 className="text-[22px] sm:text-[26px] font-semibold text-[#F8FAFC] tracking-tight mt-1">
          How forecasts and inventory thresholds are calculated
        </h3>
      </div>

      <div className="divide-y divide-white/[0.06]">
        {FAQS.map((faq, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div key={faq.question} className="bg-[#0A0F1D]">
              <button
                type="button"
                onClick={() => toggle(idx)}
                aria-expanded={isOpen}
                className="w-full px-6 sm:px-8 py-5 flex items-center justify-between text-left gap-4 hover:bg-[#1558C9]/10 transition-colors cursor-pointer"
              >
                <span className="text-[16px] font-semibold text-[#F8FAFC]">
                  {faq.question}
                </span>
                <span className="w-8 h-8 rounded-full bg-[#030407] border border-[#1558C9]/50 flex items-center justify-center shrink-0 text-[#D4FF24]">
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="w-4 h-4" aria-hidden="true" />
                  )}
                </span>
              </button>

              {isOpen && (
                <div className="px-6 sm:px-8 pb-6 text-[15px] text-[#94A3B8] leading-[1.6] max-w-3xl">
                  <p>{faq.answer}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
