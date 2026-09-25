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

  const setUser = useCallback(
    (employee: Employee) => {
      client.writeQuery<CurrentUserData>({
        query: CURRENT_USER_QUERY,
        data: { currentUser: employee },
      });
    },
    [client],
  );

  const logIn = useCallback(
    async (email: string, password: string): Promise<Employee> => {
      const result = await logInMutation({
        variables: { input: { email, password } },
      });
      const employee = result.data?.logIn;
      if (!employee) {
        throw new Error('Login failed.');
      }
      setUser(employee);
      return employee;
    },
    [logInMutation, setUser],
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
      setUser(employee);
      return employee;
    },
    [adminLogInMutation, setUser],
  );

  const signUp = useCallback(
    async (input: SignUpInput): Promise<Employee> => {
      const result = await signUpMutation({ variables: { input } });
      const employee = result.data?.signUp;
      if (!employee) {
        throw new Error('Sign up failed.');
      }
      setUser(employee);
      return employee;
    },
    [signUpMutation, setUser],
  );

  const logOut = useCallback(async (): Promise<void> => {
    try {
      await logOutMutation();
    } finally {
      client.writeQuery<CurrentUserData>({
        query: CURRENT_USER_QUERY,
        data: { currentUser: null },
      });
      client.clearStore();
    }
  }, [client, logOutMutation]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isAdmin: user?.role === UserRole.ADMIN,
      initialLoading: loading,
      logIn,
      adminLogIn,
      signUp,
      logOut,
    }),
    [user, loading, logIn, adminLogIn, signUp, logOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
