import { type ReactNode, type ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  loading?: boolean;
  children?: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-white hover:bg-accent-hover shadow-[0_1px_2px_rgba(0,0,0,0.05)] active:shadow-none',
  secondary:
    'bg-bg-primary text-text-secondary border border-border hover:bg-bg-secondary hover:border-border-strong hover:text-text-primary active:bg-bg-tertiary',
  danger:
    'bg-danger text-white hover:bg-red-700 shadow-[0_1px_2px_rgba(0,0,0,0.05)] active:shadow-none',
  ghost:
    'bg-transparent text-text-secondary hover:bg-bg-tertiary hover:text-text-primary active:bg-bg-secondary',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-7 px-2.5 text-xs gap-1.5',
  md: 'h-9 px-3.5 text-[13px] gap-2',
  lg: 'h-10 px-5 text-[13px] gap-2',
};

const iconSizeStyles: Record<ButtonSize, string> = {
  sm: '[&_svg]:size-3.5',
  md: '[&_svg]:size-4',
  lg: '[&_svg]:size-[18px]',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      icon,
      loading = false,
      disabled = false,
      children,
      className = '',
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={[
          'inline-flex items-center justify-center font-medium rounded-[6px] select-none cursor-pointer',
          'transition-colors duration-100 ease-out',
          'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent',
          variantStyles[variant],
          sizeStyles[size],
          iconSizeStyles[size],
          isDisabled && 'opacity-50 pointer-events-none',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      >
        {loading ? (
          <Loader2 className="animate-spin shrink-0" />
        ) : icon ? (
          <span className="shrink-0">{icon}</span>
        ) : null}
        {children && <span>{children}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
export type { ButtonProps, ButtonVariant, ButtonSize };
