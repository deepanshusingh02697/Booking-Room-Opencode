import { Authorized, Ctx, FieldResolver, Resolver, Root } from 'type-graphql';
import { AppContext } from '../../../common/context';
import {
  EmployeeType,
  toEmployeeType,
} from '../../auth/dto/employee-type';
import { AuthService } from '../../auth/services/auth-service';
import { RoomType, toRoomType } from '../../rooms/dto/room-type';
import { RoomService } from '../../rooms/services/room-service';
import { BookingType } from '../dto/booking-type';

@Resolver(() => BookingType)
export class BookingRelationsFieldResolver {
  private readonly roomService = new RoomService();
  private readonly authService = new AuthService();

  @FieldResolver(() => RoomType)
  @Authorized()
  async room(
    @Root() booking: BookingType,
    @Ctx() ctx: AppContext,
  ): Promise<RoomType> {
    const room = await this.roomService.getById(ctx.user, booking.roomId);
    return toRoomType(room);
  }

  @FieldResolver(() => EmployeeType)
  @Authorized()
  async organizer(@Root() booking: BookingType): Promise<EmployeeType> {
    const employee = await this.authService.currentUser(booking.organizerId);
    return toEmployeeType(employee);
  }
}
