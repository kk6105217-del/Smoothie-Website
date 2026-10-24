import React from 'react';

interface BadgeProps {
  children?: React.ReactNode;
  status?: string;
  variant?: 'cyan' | 'green' | 'amber' | 'red' | 'navy' | 'slate';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, status, variant, className = '' }) => {
  let resolvedVariant = variant || 'slate';
  let label = children;

  if (status) {
    label = status.replace(/_/g, ' ');
    const s = status.toUpperCase();
    if (s === 'PAID' || s === 'DELIVERED' || s === 'CONFIRMED') {
      resolvedVariant = 'green';
    } else if (s === 'PENDING' || s === 'PROCESSING' || s === 'PACKED' || s === 'REFUND_PENDING') {
      resolvedVariant = 'amber';
    } else if (s === 'CANCELLED' || s === 'FAILED' || s === 'RETURNED') {
      resolvedVariant = 'red';
    } else if (s === 'SHIPPED' || s === 'OUT_FOR_DELIVERY') {
      resolvedVariant = 'cyan';
    }
  }

  const variantStyles = {
    cyan: 'bg-cyan-50 text-cyan-800 border-cyan-200',
    green: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    amber: 'bg-amber-50 text-amber-800 border-amber-200',
    red: 'bg-rose-50 text-rose-800 border-rose-200',
    navy: 'bg-slate-900 text-cyan-300 border-slate-800',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${variantStyles[resolvedVariant]} ${className}`}
    >
      {label}
    </span>
  );
};
