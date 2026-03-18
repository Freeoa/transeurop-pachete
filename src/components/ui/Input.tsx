import { type InputHTMLAttributes, type ReactNode, forwardRef, useId } from 'react';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  icon?: ReactNode;
  wrapperClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, wrapperClassName = '', className = '', id: externalId, ...props }, ref) => {
    const autoId = useId();
    const id = externalId || autoId;

    return (
      <div className={['flex flex-col gap-1.5', wrapperClassName].filter(Boolean).join(' ')}>
        {label && (
          <label
            htmlFor={id}
            className="text-[13px] font-medium text-text-secondary leading-none"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary [&_svg]:size-4 pointer-events-none">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={id}
            className={[
              'w-full h-11 sm:h-9 rounded-[6px] border bg-bg-primary text-text-primary text-[13px]',
              'placeholder:text-text-tertiary',
              'transition-colors duration-100',
              'focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30',
              icon ? 'pl-8 pr-3' : 'px-3',
              error
                ? 'border-danger focus:border-danger focus:ring-danger/30'
                : 'border-border hover:border-border-strong',
              props.disabled && 'opacity-50 bg-bg-secondary cursor-not-allowed',
              className,
            ]
              .filter(Boolean)
              .join(' ')}
            {...props}
          />
        </div>
        {error && (
          <p className="text-xs text-danger leading-none">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
export type { InputProps };
