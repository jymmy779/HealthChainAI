'use client';

import { InputHTMLAttributes, ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}

export default function Input({
  label,
  error,
  icon: Icon,
  className = '',
  ...props
}: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-semibold text-text-primary">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary">
            <Icon className="w-5 h-5" />
          </div>
        )}
        <input
          className={`
            w-full px-4 py-3 bg-white rounded-xl border-2 border-border
            focus:border-primary focus:ring-2 focus:ring-primary-light
            outline-none transition-all text-base text-text-primary
            placeholder:text-text-secondary/60
            ${Icon ? 'pl-11' : ''}
            ${error ? 'border-danger focus:border-danger focus:ring-danger-light' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="text-sm text-danger mt-1">{error}</p>
      )}
    </div>
  );
}