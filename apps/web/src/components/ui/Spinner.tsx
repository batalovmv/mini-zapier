interface SpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClassNames = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-10 w-10 border-[3px]',
} as const;

export function Spinner({
  className = '',
  size = 'md',
}: SpinnerProps) {
  return (
    <span
      aria-hidden="true"
      className={[
        'inline-block animate-spin rounded-full border-current border-r-transparent text-amber-600',
        sizeClassNames[size],
        className,
      ].join(' ')}
    />
  );
}
