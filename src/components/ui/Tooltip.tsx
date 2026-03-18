import type { ReactNode } from 'react';

interface TooltipProps {
  text: string;
  position?: 'top' | 'bottom';
  children: ReactNode;
}

function Tooltip({ text, position = 'top', children }: TooltipProps) {
  const positionClasses =
    position === 'top'
      ? 'bottom-full left-1/2 -translate-x-1/2 mb-2'
      : 'top-full left-1/2 -translate-x-1/2 mt-2';

  const arrowClasses =
    position === 'top'
      ? 'top-full left-1/2 -translate-x-1/2 border-t-gray-900 border-x-transparent border-b-transparent'
      : 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-900 border-x-transparent border-t-transparent';

  return (
    <div className="relative group inline-flex">
      {children}
      <div
        className={`absolute ${positionClasses} bg-gray-900 text-white text-[11px] px-2 py-1 rounded-[4px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-50`}
      >
        {text}
        <div
          className={`absolute ${arrowClasses} border-4 w-0 h-0`}
        />
      </div>
    </div>
  );
}

export { Tooltip };
export type { TooltipProps };
