import { buildSchema } from 'type-graphql';
import { HealthResolver } from './common/health-resolver';

export const createSchema = () =>
  buildSchema({
    resolvers: [HealthResolver],
  });