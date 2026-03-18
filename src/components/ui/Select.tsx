import { type SelectHTMLAttributes, forwardRef, useId } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  wrapperClassName?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      options,
      placeholder,
      wrapperClassName = '',
      className = '',
      id: externalId,
      ...props
    },
    ref
  ) => {
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
          <select
            ref={ref}
            id={id}
            className={[
              'w-full h-11 sm:h-9 rounded-[6px] border bg-bg-primary text-text-primary text-[13px]',
              'appearance-none pl-3 pr-8 cursor-pointer',
              'transition-colors duration-100',
              'focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30',
              error
                ? 'border-danger focus:border-danger focus:ring-danger/30'
                : 'border-border hover:border-border-strong',
              props.disabled && 'opacity-50 bg-bg-secondary cursor-not-allowed',
              className,
            ]
              .filter(Boolean)
              .join(' ')}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-4 text-text-tertiary pointer-events-none" />
        </div>
        {error && (
          <p className="text-xs text-danger leading-none">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export { Select };
export type { SelectProps };
