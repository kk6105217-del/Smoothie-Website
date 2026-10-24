import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

export const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Are your electronic components and microcontroller boards authentic?',
      a: 'Yes, 100%. We source chips and modules directly from manufacturer-authorized supply chains. Each board is inspected for correct clock crystals, clean solder traces, and voltage regulator accuracy before listing.',
    },
    {
      q: 'Do you offer Cash on Delivery (COD) across India?',
      a: 'Yes, Cash on Delivery is available across most serviceable Indian pin codes for order totals up to ₹25,000. For security and fraud prevention, courier OTP confirmation or phone verification may be required prior to dispatch.',
    },
    {
      q: 'How fast is delivery, and who are your shipping partners?',
      a: 'We partner with Delhivery, BlueDart, and DTDC. Orders placed before 2:00 PM are shipped the same business day from Bengaluru. Metro cities typically receive deliveries in 2 to 3 days, while rest of India is fulfilled within 3 to 5 business days.',
    },
    {
      q: 'Do project kits include code and schematics?',
      a: 'Yes! Every project kit and sensor bundle comes with links to our open-source GitHub repositories containing verified Arduino, ESP-IDF, and Python code samples along with high-resolution wiring schematics.',
    },
    {
      q: 'What is your warranty and replacement policy for defective components?',
      a: 'All our products carry a 6-Month Manufacturing Warranty and an easy 7-Day Replacement Policy. If an item arrives defective or damaged during transit, simply submit a return request from your account within 7 days for an immediate replacement.',
    },
    {
      q: 'Do you provide GST tax invoices for college or company reimbursement?',
      a: 'Yes, every order includes a valid GST tax invoice with detailed tax breakdown (18% GST). If you need your company GSTIN mentioned, please note it during checkout or reach out to support.',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="text-center space-y-2">
        <span className="text-xs font-mono font-bold text-cyan-700 uppercase tracking-widest">
          FREQUENTLY ASKED QUESTIONS
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Hardware & Ordering FAQ
        </h1>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Everything you need to know about payments, components, shipping, and technical support.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100 shadow-xs overflow-hidden">
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div key={idx} className="p-5 transition-colors">
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full flex items-center justify-between text-left gap-4"
              >
                <span className="font-bold text-slate-900 text-sm">{faq.q}</span>
                <span className="text-slate-400 flex-shrink-0">
                  {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </span>
              </button>
              {isOpen && (
                <div className="mt-3 text-xs text-slate-600 leading-relaxed pr-8">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
