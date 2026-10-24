import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { ShieldCheck, Truck, RefreshCw, XCircle, FileText } from 'lucide-react';

export const Policies: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'shipping';

  const tabs = [
    { key: 'shipping', label: 'Shipping Policy', icon: Truck },
    { key: 'returns', label: 'Returns & Refunds', icon: RefreshCw },
    { key: 'cancellation', label: 'Cancellation Policy', icon: XCircle },
    { key: 'privacy', label: 'Privacy Policy', icon: ShieldCheck },
    { key: 'terms', label: 'Terms & Conditions', icon: FileText },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Store Policies & Legal Terms
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Clear, transparent policies for orders, deliveries, returns, and data handling in India.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setSearchParams({ tab: t.key })}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex-shrink-0 transition-colors flex items-center gap-2 ${
              currentTab === t.key
                ? 'border-cyan-600 text-cyan-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <t.icon size={15} />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs text-xs text-slate-700 leading-relaxed space-y-6">
        {currentTab === 'shipping' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900">Shipping & Delivery Policy</h2>
            <p>
              At VK Technology, we understand the eagerness to receive project kits. All orders are
              dispatched from our Bengaluru fulfillment hub using surface air express couriers.
            </p>
            <h4 className="font-bold text-slate-900 text-xs">Dispatch Timelines</h4>
            <p>
              Orders confirmed before 2:00 PM IST on working days (Monday through Saturday) are
              dispatched on the same day. Orders placed on Sundays or national holidays are dispatched
              the following business day.
            </p>
            <h4 className="font-bold text-slate-900 text-xs">Shipping Rates & Thresholds</h4>
            <p>
              We offer <strong>Free Express Shipping</strong> on all domestic orders with a verified
              cart total of <strong>₹999</strong> or above. For orders below ₹999, a flat shipping fee
              of <strong>₹70</strong> is applied across India.
            </p>
            <h4 className="font-bold text-slate-900 text-xs">Tracking Notifications</h4>
            <p>
              Upon courier handover, you will receive real-time email, WhatsApp, and SMS alerts
              containing your Air Waybill (AWB) number and direct courier tracking links.
            </p>
          </div>
        )}

        {currentTab === 'returns' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900">Return and Refund Policy</h2>
            <p>
              We take great pride in delivering authentic, bench-tested electronics. If you receive an
              item that is damaged in transit, defective, or incorrect, you are fully covered under our
              <strong> 7-Day Replacement & Return Policy</strong>.
            </p>
            <h4 className="font-bold text-slate-900 text-xs">Eligibility for Return</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Return request must be raised within 7 calendar days of delivery.</li>
              <li>Components must not show signs of user misuse (e.g. over-voltage or burnt ICs).</li>
              <li>Original packaging, anti-static bags, and accessories must be returned.</li>
            </ul>
            <h4 className="font-bold text-slate-900 text-xs">Refund Timelines</h4>
            <p>
              For online payments, refunds are credited back to the original payment source (bank account,
              UPI, or card) within 5 to 7 business days following item receipt and verification. For COD
              orders, refunds are transferred via direct NEFT / UPI to the customer's verified bank details.
            </p>
          </div>
        )}

        {currentTab === 'cancellation' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900">Order Cancellation Policy</h2>
            <p>
              You may cancel any eligible order directly from your <strong>My Account</strong> portal
              at any time before the order has been handed over to the courier (status: SHIPPED).
            </p>
            <p>
              If payment has already been captured, 100% of the transaction amount will be automatically
              refunded without any cancellation fee. Once an order is dispatched and on route, it cannot
              be cancelled directly, but you may request a standard return upon receipt.
            </p>
          </div>
        )}

        {currentTab === 'privacy' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900">Privacy & Data Protection</h2>
            <p>
              VK Technology respects customer privacy. We collect only the essential personal details
              (name, email, phone number, shipping address) required to process transactions and deliver
              hardware safely.
            </p>
            <p>
              We do NOT store credit card numbers, debit card PINs, or CVVs. All electronic payment
              processing occurs securely through Razorpay's PCI-DSS Level 1 certified gateway.
            </p>
            <p>
              We never sell or lease customer contact lists to third-party marketing entities.
            </p>
          </div>
        )}

        {currentTab === 'terms' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900">Terms and Conditions</h2>
            <p>
              By browsing and placing orders on VK Technology, you agree to comply with our terms.
              Our electronics kits are intended for educational, hobbyist, and engineering prototyping purposes.
            </p>
            <h4 className="font-bold text-slate-900 text-xs">Safety & Component Usage</h4>
            <p>
              Users are advised to follow electrical safety best practices when operating soldering irons,
              LiPo batteries, and power supplies. VK Technology is not liable for secondary damages
              resulting from improper circuit connections or user wiring errors.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
