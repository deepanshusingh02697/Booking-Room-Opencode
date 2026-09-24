import { GraphQLError } from 'graphql';
import { ApplicationError } from './application-error';

export const isApplicationError = (err: unknown): err is ApplicationError => {
  return err instanceof GraphQLError && err.extensions?.code !== undefined;
};