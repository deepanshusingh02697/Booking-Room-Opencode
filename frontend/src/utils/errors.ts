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
