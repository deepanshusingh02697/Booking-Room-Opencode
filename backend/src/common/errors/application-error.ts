import { ApolloServerErrorCode } from '@apollo/server/errors';
import { GraphQLError } from 'graphql';
import { ErrorCode } from './error-codes';

export class ApplicationError extends GraphQLError {
  constructor(
    message: string,
    code: ErrorCode,
    extensions?: Record<string, unknown>,
  ) {
    super(message, {
      extensions: {
        code,
        ...extensions,
      },
    });
  }
}

export class ValidationError extends ApplicationError {
  constructor(message: string, fields?: Record<string, string[]>) {
    super(message, 'VALIDATION_ERROR', fields ? { fields } : undefined);
  }
}

export class UnauthenticatedError extends ApplicationError {
  constructor(message = 'You must be signed in to perform this action.') {
    super(message, 'UNAUTHENTICATED');
  }
}

export class ForbiddenError extends ApplicationError {
  constructor(message = 'You are not allowed to perform this action.') {
    super(message, 'FORBIDDEN');
  }
}

export class NotFoundError extends ApplicationError {
  constructor(message = 'The requested resource was not found.') {
    super(message, 'NOT_FOUND');
  }
}

export class ConflictError extends ApplicationError {
  constructor(message: string) {
    super(message, 'CONFLICT');
  }
}

export class InvalidGraphQLRequestError extends ApplicationError {
  constructor(message: string) {
    super(
      message,
      ApolloServerErrorCode.BAD_USER_INPUT as unknown as ErrorCode,
    );
  }
}