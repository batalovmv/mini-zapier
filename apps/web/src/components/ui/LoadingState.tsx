import { Spinner } from './Spinner';

interface LoadingStateProps {
  title?: string;
  description?: string;
  compact?: boolean;
}

export function LoadingState({
  title = 'Loading...',
  description = 'Please wait while the latest data is fetched.',
  compact = false,
}: LoadingStateProps) {
  return (
    <div
      className={[
        'flex flex-col items-center justify-center rounded-3xl border border-slate-900/10 bg-white/80 text-center shadow-panel',
        compact ? 'px-5 py-5' : 'min-h-[220px] px-6 py-10',
      ].join(' ')}
    >
      <Spinner size={compact ? 'sm' : 'lg'} />
      <h3 className="mt-4 text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
        {description}
      </p>
    </div>
  );
}
