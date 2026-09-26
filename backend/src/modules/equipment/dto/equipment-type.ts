import { Field, ObjectType } from 'type-graphql';
import { Equipment } from '../entities/equipment';

@ObjectType()
export class EquipmentType {
  @Field()
  id: number;

  @Field()
  name: string;

  @Field()
  createdAt: Date;
}

export const toEquipmentType = (equipment: Equipment): EquipmentType => ({
  id: equipment.id,
  name: equipment.name,
  createdAt: equipment.createdAt,
});
