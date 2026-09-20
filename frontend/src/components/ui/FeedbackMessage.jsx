import React from 'react';
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from 'lucide-react';

const toneStyles = {
  danger: {
    container: 'border-red-200 bg-red-50 text-red-800',
    icon: AlertCircle,
  },
  warning: {
    container: 'border-amber-200 bg-amber-50 text-amber-800',
    icon: TriangleAlert,
  },
  success: {
    container: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    icon: CheckCircle2,
  },
  info: {
    container: 'border-blue-200 bg-blue-50 text-blue-800',
    icon: Info,
  },
};

export default function FeedbackMessage({ tone = 'info', title, children, live = 'polite' }) {
  const style = toneStyles[tone] || toneStyles.info;
  const Icon = style.icon;
  const isUrgent = tone === 'danger';

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${style.container}`}
      role={isUrgent ? 'alert' : 'status'}
      aria-live={live}
    >
      <Icon size={18} className="mt-0.5 flex-shrink-0" aria-hidden="true" />
      <div className="min-w-0 leading-6">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={title ? 'mt-1' : undefined}>{children}</div>}
      </div>
    </div>
  );
}
