import type { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

/** Button Component */
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = ({ className, variant = 'primary', size = 'md', ...props }: ButtonProps) => {
  const variants = {
    primary: 'bg-primary text-secondary font-bold hover:brightness-95 active:scale-[0.98]',
    secondary: 'bg-text-1 text-surface hover:bg-opacity-90 active:scale-[0.98]',
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
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  suffix?: ReactNode;
}

export const Input = ({ label, error, suffix, className, id, ...props }: InputProps) => {
  const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
  
  return (
    <div className="space-y-1 w-full">
      {label && (
        <label 
          htmlFor={inputId}
          className="text-xs font-bold text-text-2 uppercase tracking-wider cursor-pointer"
        >
          {label}
        </label>
      )}
      <div className="relative group/input">
        <input 
          id={inputId}
          className={cn(
            'w-full bg-surface border border-border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-text-2 placeholder:opacity-100 text-text-1',
            suffix && 'pr-12',
            error && 'border-danger focus:ring-danger/20 focus:border-danger',
            className
          )}
          {...props}
        />
        {suffix && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center">
            {suffix}
          </div>
        )}
      </div>
      {error && <p className="text-[10px] font-medium text-danger">{error}</p>}
    </div>
  );
};

/** Card Component */
export const Card = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode }) => (
  <div className={cn('rdy-card animate-fade', className)} {...props}>
    {children}
  </div>
);

/** Badge Component */
export const Badge = ({ children, variant = 'neutral', className }: { 
  children: ReactNode, 
  variant?: 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'primary',
  className?: string
}) => {
  const variants = {
    neutral: 'bg-bg text-text-1 border border-border',
    success: 'bg-success/10 text-success border border-success/20',
    warning: 'bg-warning/10 text-warning border border-warning/20',
    danger: 'bg-danger/10 text-danger border border-danger/20',
    info: 'bg-info/10 text-info border border-info/20',
    primary: 'bg-primary text-secondary font-black border border-primary/20',
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
    C: 'bg-cyan text-black',
    M: 'bg-magenta text-black',
    Y: 'bg-yellow text-black',
    K: 'bg-text-1 text-surface',
  };

  return (
    <span className={cn('w-4 h-4 flex items-center justify-center rounded-[3px] text-[10px] font-black', styles[type], className)}>
      {type}
    </span>
  );
};
