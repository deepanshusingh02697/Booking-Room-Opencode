import {
  createContext,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import {
  useApolloClient,
  useMutation,
  useQuery,
} from '@apollo/client';
import {
  ADMIN_LOG_IN_MUTATION,
  type AdminLogInData,
  type CredentialsVars,
  LOG_IN_MUTATION,
  type LogInData,
  LOGOUT_MUTATION,
  type LogoutData,
  SIGN_UP_MUTATION,
  type SignUpData,
  type SignUpVars,
} from '../graphql/mutations/auth';
import {
  CURRENT_USER_QUERY,
  type CurrentUserData,
} from '../graphql/queries/auth';
import { UserRole, type Employee } from '../types';

export interface SignUpInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface AuthContextValue {
  user: Employee | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  initialLoading: boolean;
  logIn: (email: string, password: string) => Promise<Employee>;
  adminLogIn: (email: string, password: string) => Promise<Employee>;
  signUp: (input: SignUpInput) => Promise<Employee>;
  logOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const client = useApolloClient();

  const { data, loading, error } = useQuery<CurrentUserData>(
    CURRENT_USER_QUERY,
  );
  const user = !error && data ? data.currentUser : null;

  const [logInMutation] = useMutation<LogInData, CredentialsVars>(
    LOG_IN_MUTATION,
  );
  const [adminLogInMutation] = useMutation<AdminLogInData, CredentialsVars>(
    ADMIN_LOG_IN_MUTATION,
  );
  const [signUpMutation] = useMutation<SignUpData, SignUpVars>(
    SIGN_UP_MUTATION,
  );
  const [logOutMutation] = useMutation<LogoutData>(LOGOUT_MUTATION);

  /**
   * Re-reads the session from the server. `currentUser` is `@Authorized()`, so the
   * anonymous probe that runs on mount *errors* instead of returning null, and an
   * Apollo observable keeps that error for its whole lifetime — a `writeQuery` after
   * a successful login cannot clear it, and `user` above stays null, so the app
   * bounces straight back to /login. Only a successful fetch of the query replaces
   * the stored result, so every sign-in has to end with one.
   *
   * Deliberately `client.refetchQueries` rather than the mutation's `refetchQueries`
   * option: the option resolves through the cache's watches, and `clearStore` empties
   * them, so after a logout it would silently match nothing. This walks the
   * query manager's registered queries instead, which survive a cleared cache.
   */
  const refetchSession = useCallback(async () => {
    await client.refetchQueries({ include: [CURRENT_USER_QUERY] });
  }, [client]);

  const logIn = useCallback(
    async (email: string, password: string): Promise<Employee> => {
      const result = await logInMutation({
        variables: { input: { email, password } },
      });
      const employee = result.data?.logIn;
      if (!employee) {
        throw new Error('Login failed.');
      }
      await refetchSession();
      return employee;
    },
    [logInMutation, refetchSession],
  );

  const adminLogIn = useCallback(
    async (email: string, password: string): Promise<Employee> => {
      const result = await adminLogInMutation({
        variables: { input: { email, password } },
      });
      const employee = result.data?.adminLogin;
      if (!employee) {
        throw new Error('Login failed.');
      }
      await refetchSession();
      return employee;
    },
    [adminLogInMutation, refetchSession],
  );

  const signUp = useCallback(
    async (input: SignUpInput): Promise<Employee> => {
      const result = await signUpMutation({ variables: { input } });
      const employee = result.data?.signUp;
      if (!employee) {
        throw new Error('Sign up failed.');
      }
      await refetchSession();
      return employee;
    },
    [signUpMutation, refetchSession],
  );

  const logOut = useCallback(async (): Promise<void> => {
    try {
      await logOutMutation();
    } finally {
      // `clearStore` empties the cache and the watches, and re-fetches nothing, so
      // the session query is left with no data and no way to ask again. The explicit
      // refetch is what turns that into the real UNAUTHENTICATED answer.
      await client.clearStore();
      await refetchSession();
    }
  }, [client, logOutMutation, refetchSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isAdmin: user?.role === UserRole.ADMIN,
      initialLoading: loading && !data,
      logIn,
      adminLogIn,
      signUp,
      logOut,
    }),
    [user, loading, data, logIn, adminLogIn, signUp, logOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
