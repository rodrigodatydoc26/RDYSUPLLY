import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Utility for tailwind classes merging */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Button Component */
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = ({ className, variant = 'primary', size = 'md', ...props }: ButtonProps) => {
  const variants = {
    primary: 'bg-primary text-secondary font-bold hover:brightness-95 active:scale-[0.98]',
    secondary: 'bg-secondary text-white hover:bg-opacity-90 active:scale-[0.98]',
    outline: 'border border-border bg-transparent hover:bg-bg text-text-1',
    ghost: 'bg-transparent hover:bg-bg text-text-1',
    danger: 'bg-danger text-white hover:bg-opacity-90 active:scale-[0.98]',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    icon: 'p-2',
  };

  return (
    <button 
      className={cn(
        'inline-flex items-center justify-center rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
};

/** Input Component */
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = ({ label, error, className, ...props }: InputProps) => {
  return (
    <div className="space-y-1 w-full">
      {label && <label className="text-xs font-bold text-text-2 uppercase tracking-wider">{label}</label>}
      <input 
        className={cn(
          'w-full bg-white border border-border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-text-2',
          error && 'border-danger focus:ring-danger/20 focus:border-danger',
          className
        )}
        {...props}
      />
      {error && <p className="text-[10px] font-medium text-danger">{error}</p>}
    </div>
  );
};

/** Card Component */
export const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn('bg-surface border border-border rounded-xl shadow-sm overflow-hidden animate-fade', className)}>
    {children}
  </div>
);

/** Badge Component */
export const Badge = ({ children, variant = 'neutral', className }: { 
  children: React.ReactNode, 
  variant?: 'neutral' | 'success' | 'warning' | 'danger' | 'info',
  className?: string
}) => {
  const variants = {
    neutral: 'bg-bg text-text-2 border border-border',
    success: 'bg-success/10 text-success border border-success/20',
    warning: 'bg-warning/10 text-warning border border-warning/20',
    danger: 'bg-danger/10 text-danger border border-danger/20',
    info: 'bg-cyan/10 text-cyan border border-cyan/20',
  };

  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight', variants[variant], className)}>
      {children}
    </span>
  );
};

/** CMYK Badge */
export const CMYKBadge = ({ type, className }: { type: 'C' | 'M' | 'Y' | 'K', className?: string }) => {
  const styles = {
    C: 'bg-cyan text-white',
    M: 'bg-magenta text-white',
    Y: 'bg-primary text-secondary',
    K: 'bg-secondary text-white',
  };

  return (
    <span className={cn('w-5 h-5 flex items-center justify-center rounded-md text-[11px] font-black', styles[type], className)}>
      {type}
    </span>
  );
};
