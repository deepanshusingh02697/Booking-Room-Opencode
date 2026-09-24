import { Field, ObjectType, Query, Resolver } from 'type-graphql';

@ObjectType()
export class Health {
  @Field(() => String)
  status: string;

  constructor(status: string) {
    this.status = status;
  }
}

@Resolver()
export class HealthResolver {
  @Query(() => Health)
  health(): Health {
    return new Health('ok');
  }
}