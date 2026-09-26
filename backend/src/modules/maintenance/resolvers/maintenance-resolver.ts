import {
  Arg,
  Authorized,
  Ctx,
  Int,
  Mutation,
  Query,
  Resolver,
} from 'type-graphql';
import { AppContext } from '../../../common/context';
import { UserRole } from '../../auth/entities/employee';
import { CreateMaintenanceInput } from '../dto/create-maintenance-input';
import { MaintenanceType, toMaintenanceType } from '../dto/maintenance-type';
import { MaintenanceService } from '../services/maintenance-service';

@Resolver()
export class MaintenanceResolver {
  private readonly maintenanceService = new MaintenanceService();

  @Query(() => [MaintenanceType])
  @Authorized()
  async roomMaintenance(
    @Arg('roomId', () => Int) roomId: number,
    @Ctx() ctx: AppContext,
  ): Promise<MaintenanceType[]> {
    const windows = await this.maintenanceService.roomMaintenance(
      ctx.user,
      roomId,
    );
    return windows.map(toMaintenanceType);
  }

  @Mutation(() => MaintenanceType)
  @Authorized(UserRole.ADMIN)
  async createMaintenance(
    @Arg('input', () => CreateMaintenanceInput) input: CreateMaintenanceInput,
    @Ctx() ctx: AppContext,
  ): Promise<MaintenanceType> {
    const maintenance = await this.maintenanceService.create(ctx.user, {
      roomId: input.roomId,
      startTime: input.startTime,
      endTime: input.endTime,
      reason: input.reason,
    });
    return toMaintenanceType(maintenance);
  }

  @Mutation(() => Boolean)
  @Authorized(UserRole.ADMIN)
  async deleteMaintenance(
    @Arg('id', () => Int) id: number,
    @Ctx() ctx: AppContext,
  ): Promise<boolean> {
    return this.maintenanceService.delete(ctx.user, id);
  }
}
