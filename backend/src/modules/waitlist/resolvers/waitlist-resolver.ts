import { Arg, Authorized, Ctx, Int, Mutation, Query, Resolver } from 'type-graphql';
import { AppContext } from '../../../common/context';
import { JoinWaitlistInput } from '../dto/join-waitlist-input';
import {
  WaitlistEntryType,
  toWaitlistEntryType,
} from '../dto/waitlist-entry-type';
import { WaitlistService } from '../services/waitlist-service';

@Resolver()
export class WaitlistResolver {
  private readonly waitlistService = new WaitlistService();

  @Query(() => [WaitlistEntryType])
  @Authorized()
  async myWaitlist(@Ctx() ctx: AppContext): Promise<WaitlistEntryType[]> {
    const entries = await this.waitlistService.myWaitlist(ctx.user);
    return entries.map(toWaitlistEntryType);
  }

  @Mutation(() => WaitlistEntryType)
  @Authorized()
  async joinWaitlist(
    @Arg('input') input: JoinWaitlistInput,
    @Ctx() ctx: AppContext,
  ): Promise<WaitlistEntryType> {
    const entry = await this.waitlistService.join(ctx.user, {
      roomId: input.roomId,
      startTime: input.startTime,
      endTime: input.endTime,
    });
    return toWaitlistEntryType(entry);
  }

  @Mutation(() => Boolean)
  @Authorized()
  async leaveWaitlist(
    @Arg('entryId', () => Int) entryId: number,
    @Ctx() ctx: AppContext,
  ): Promise<boolean> {
    return this.waitlistService.leave(ctx.user, entryId);
  }
}
