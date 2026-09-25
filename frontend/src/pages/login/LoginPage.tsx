import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/forms/Input';
import { useAuth } from '../../hooks/useAuth';
import { getGraphQLErrorMessage } from '../../utils/errors';

type Mode = 'login' | 'register';

export const LoginPage = () => {
  const { user, logIn, adminLogIn, signUp } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>('login');
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const switchMode = (nextMode: Mode) => {
    setMode(nextMode);
    setError(null);
    setIsAdminLogin(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === 'login') {
        if (isAdminLogin) {
          await adminLogIn(email, password);
        } else {
          await logIn(email, password);
        }
      } else {
        await signUp({ firstName, lastName, email, password });
      }
      navigate('/', { replace: true });
    } catch (err) {
      setError(getGraphQLErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-bold text-slate-800">
          {mode === 'login' ? 'Sign in' : 'Create an account'}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {mode === 'login'
            ? 'Welcome back to Meeting Room Intelligence.'
            : 'Register as an employee to book meeting rooms.'}
        </p>

        <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First name"
                name="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                maxLength={50}
                autoComplete="given-name"
              />
              <Input
                label="Last name"
                name="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                maxLength={50}
                autoComplete="family-name"
              />
            </div>
          )}

          <Input
            label="Email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />

          <Input
            label="Password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={mode === 'register' ? 8 : undefined}
            autoComplete={
              mode === 'login' ? 'current-password' : 'new-password'
            }
          />

          {mode === 'login' && (
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={isAdminLogin}
                onChange={(e) => setIsAdminLogin(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              Sign in as administrator
            </label>
          )}

          {error && (
            <div
              role="alert"
              className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <Button type="submit" loading={submitting} className="w-full">
            {mode === 'login' ? 'Sign in' : 'Create account'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          {mode === 'login' ? "Don't have an account? " : 'Already registered? '}
          <button
            type="button"
            className="font-medium text-blue-600 hover:underline"
            onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
          >
            {mode === 'login' ? 'Create one' : 'Sign in instead'}
          </button>
        </p>
      </div>
    </div>
  );
};
