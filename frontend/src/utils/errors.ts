import { ApolloError } from '@apollo/client';

export const getGraphQLErrorMessage = (error: unknown): string => {
  if (error instanceof ApolloError) {
    const graphQLError = error.graphQLErrors[0];
    if (graphQLError) {
      return graphQLError.message;
    }
    if (error.networkError) {
      return 'Cannot reach the server. Check your connection and try again.';
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Something went wrong. Please try again.';
};

/**
 * The backend's `extensions.code` (FORBIDDEN, NOT_FOUND, VALIDATION_ERROR, …),
 * so a screen can react to *why* a request failed instead of pattern-matching
 * the message.
 */
export const getGraphQLErrorCode = (error: unknown): string | undefined => {
  if (error instanceof ApolloError) {
    const code: unknown = error.graphQLErrors[0]?.extensions?.code;
    return typeof code === 'string' ? code : undefined;
  }
  return undefined;
};
