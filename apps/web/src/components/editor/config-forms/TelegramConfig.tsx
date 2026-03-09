interface TelegramConfigProps {
  config: Record<string, unknown>;
  onChange: (nextConfig: Record<string, unknown>) => void;
}

export function TelegramConfig({
  config,
  onChange,
}: TelegramConfigProps) {
  return (
    <div className="space-y-5">
      <label className="block">
        <span className="muted-label">Chat ID</span>
        <input
          className="mt-2 w-full rounded-2xl border border-slate-900/10 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-500"
          onChange={(event) =>
            onChange({
              ...config,
              chatId: event.target.value,
            })
          }
          placeholder="-1001234567890"
          type="text"
          value={typeof config.chatId === 'string' ? config.chatId : ''}
        />
      </label>

      <label className="block">
        <span className="muted-label">Message</span>
        <textarea
          className="mt-2 min-h-40 w-full rounded-2xl border border-slate-900/10 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-500"
          onChange={(event) =>
            onChange({
              ...config,
              message: event.target.value,
            })
          }
          placeholder="Order {{input.id}} is ready."
          value={typeof config.message === 'string' ? config.message : ''}
        />
      </label>
    </div>
  );
}
