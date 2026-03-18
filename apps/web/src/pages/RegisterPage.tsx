import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useLocale } from '../locale/LocaleProvider';
import { getMe, register } from '../lib/api/auth';
import { getApiErrorMessage } from '../lib/api/client';

export function RegisterPage() {
  const navigate = useNavigate();
  const { messages } = useLocale();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [checking, setChecking] = useState(true);
  const [registerError, setRegisterError] = useState<string | null>(null);

  useEffect(() => {
    getMe()
      .then(() => navigate('/', { replace: true }))
      .catch(() => setChecking(false));
  }, [navigate]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setRegisterError(null);
    try {
      await register(email, password);
      navigate('/', { replace: true });
    } catch (err) {
      const message = getApiErrorMessage(err, messages.errors);
      setRegisterError(message);
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fcfaf6]">
      <div className="w-full max-w-sm rounded-2xl border border-slate-900/10 bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-600 text-lg font-black uppercase tracking-[0.28em] text-white shadow-lg shadow-amber-900/20">
            MZ
          </div>
          <h1 className="text-xl font-bold text-slate-900">{messages.registerPage.brandTitle}</h1>
          <p className="mt-1 text-sm text-slate-500">{messages.registerPage.subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
              {messages.registerPage.email}
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setRegisterError(null);
              }}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
              {messages.registerPage.password}
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setRegisterError(null);
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-10 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-500">{messages.registerPage.passwordHint}</p>
          </div>

          {registerError ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {registerError}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-amber-900/20 transition-colors hover:bg-amber-700 disabled:opacity-50"
          >
            {loading ? messages.registerPage.creatingAccount : messages.registerPage.createAccount}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          {messages.registerPage.loginPrompt}{' '}
          <Link to="/login" className="font-semibold text-amber-700 hover:text-amber-800">
            {messages.registerPage.loginAction}
          </Link>
        </p>
      </div>
    </div>
  );
}
