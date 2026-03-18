import { useEffect, useState } from 'react';

interface SuccessAnimationProps {
  visible: boolean;
  onComplete?: () => void;
}

export function SuccessAnimation({ visible, onComplete }: SuccessAnimationProps) {
  const [phase, setPhase] = useState<'active' | 'fading' | 'hidden'>('hidden');

  useEffect(() => {
    if (!visible) {
      setPhase('hidden');
      return;
    }

    setPhase('active');

    const fadeTimer = setTimeout(() => {
      setPhase('fading');
    }, 1500);

    const completeTimer = setTimeout(() => {
      setPhase('hidden');
      onComplete?.();
    }, 1800);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [visible, onComplete]);

  if (phase === 'hidden') return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/30 backdrop-blur-[2px]"
      style={phase === 'fading' ? { animation: 'success-fade-out 300ms ease-out forwards' } : undefined}
    >
      <div style={{ animation: 'success-scale-in 400ms ease-out' }}>
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
          <circle
            cx="32"
            cy="32"
            r="26"
            stroke="var(--color-accent, #2563eb)"
            strokeWidth="3"
            fill="none"
            strokeDasharray="166"
            strokeDashoffset="166"
            strokeLinecap="round"
            style={{ animation: 'draw-circle 600ms ease-out forwards' }}
          />
          <path
            d="M20 33 L28 41 L44 25"
            stroke="white"
            strokeWidth="3"
            fill="none"
            strokeDasharray="48"
            strokeDashoffset="48"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ animation: 'draw-check 400ms ease-out 400ms forwards' }}
          />
        </svg>
      </div>
    </div>
  );
}
