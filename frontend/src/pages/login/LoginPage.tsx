import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthBrandPanel } from '../../components/auth/AuthBrandPanel';
import { AuthField } from '../../components/auth/AuthField';
import { AuthTabs, type AuthMode } from '../../components/auth/AuthTabs';
import { RoleSelector, type AuthRole } from '../../components/auth/RoleSelector';
import { useAuth } from '../../hooks/useAuth';
import { getGraphQLErrorMessage } from '../../utils/errors';

const COPY = {
  login: {
    heading: 'Employee Login',
    subheading: 'Sign in to access your employee account.',
    submit: 'SIGN IN',
    switchPrompt: "Don't have an account?",
    switchAction: 'Create account',
  },
  register: {
    heading: 'Employee Register',
    subheading: 'Create your employee account to continue.',
    submit: 'REGISTER',
    switchPrompt: 'Already have an account?',
    switchAction: 'Login',
  },
} as const;

const RESET_UNAVAILABLE =
  'Password reset is not available yet. Please contact your administrator.';

export const LoginPage = () => {
  const { user, logIn, adminLogIn, signUp } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<AuthMode>('login');
  const [role, setRole] = useState<AuthRole>('employee');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (mode === 'register' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'login') {
        if (role === 'admin') {
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

  const copy = COPY[mode];

  return (
    <div className="flex min-h-screen bg-white">
      <AuthBrandPanel />

      <main className="flex w-full items-center justify-center px-6 py-12 lg:w-1/2 lg:py-16">
        <div className={`w-full max-w-[428px] ${mode === 'register' ? 'mt-2' : ''}`}>
          <AuthTabs active={mode} onChange={switchMode}/>

          <div id="auth-panel" role="tabpanel" aria-labelledby={`auth-tab-${mode}`}>
            <h1 className="mt-8 text-[30px] font-bold leading-tight text-ink">
              {copy.heading}
            </h1>
            <p className="mt-3 text-sm text-copy">{copy.subheading}</p>

            <form className="mt-7" onSubmit={handleSubmit}>
              {mode === 'login' ? (
                <>
                  <RoleSelector value={role} onChange={setRole} />

                  <div className="mt-6">
                    <AuthField
                      label="Email"
                      name="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>

                  <div className="mt-4">
                    <AuthField
                      label="Password"
                      name="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                    />
                  </div>

                  <div className="mt-3 text-right">
                    <button
                      type="button"
                      onClick={() => setError(RESET_UNAVAILABLE)}
                      className="text-sm text-brand hover:underline focus:outline-none focus-visible:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <AuthField
                    label="First Name"
                    hideLabel
                    name="firstName"
                    placeholder="First Name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    maxLength={50}
                    autoComplete="given-name"
                    className="mb-4"
                  />
                  <AuthField
                    label="Last Name"
                    hideLabel
                    name="lastName"
                    placeholder="Last Name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    maxLength={50}
                    autoComplete="family-name"
                    className="mb-4"
                  />
                  <AuthField
                    label="Email"
                    hideLabel
                    name="email"
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="mb-4"
                  />
                  <AuthField
                    label="Password"
                    hideLabel
                    name="password"
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className="mb-4"
                  />
                  <AuthField
                    label="Confirm Password"
                    hideLabel
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                </>
              )}

              {error && (
                <div
                  role="alert"
                  className="mt-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded bg-navy text-[13px] font-semibold uppercase tracking-[0.08em] text-white transition-colors hover:bg-[#16204F] focus:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                )}
                {copy.submit}
              </button>
            </form>

            <p className="mt-4 text-center text-base text-label">
              {copy.switchPrompt}{' '}
              <button
                type="button"
                onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
                className="text-brand hover:underline focus:outline-none focus-visible:underline"
              >
                {copy.switchAction}
              </button>
            </p>
          </div>

          <p className="mt-3 text-center text-xs text-muted">
            &copy; 2026 Room Meeting Intelligence
          </p>
        </div>
      </main>
    </div>
  );
};
