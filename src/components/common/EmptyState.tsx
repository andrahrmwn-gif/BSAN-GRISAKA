import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  actionText,
  onAction,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center bg-slate-50/70 border border-dashed border-slate-200 rounded-2xl ${className}`}>
      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
        <Icon className="w-6 h-6 text-slate-400" />
      </div>
      <h4 className="text-sm font-bold text-slate-700">{title}</h4>
      <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4 leading-relaxed">
        {description}
      </p>
      {actionText && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all cursor-pointer"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
