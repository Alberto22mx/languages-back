import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { IsNotEmpty, IsString } from 'class-validator';
import { v4 as uuidv4 } from 'uuid';

export type GroupsDocument = Groups & Document;

@Schema({
  timestamps: true,
  strict: true,
  toJSON: {
    virtuals: true,
    transform: function (doc, ret) {
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class Groups {
  @Prop({ default: uuidv4, immutable: true })
  id: string;

  @IsNotEmpty({ message: 'El nombre del grupo es requerido' })
  @IsString()
  @Prop({ required: true, trim: true })
  name: string;

  @IsNotEmpty({ message: 'La descripción del grupo es requerida' })
  @IsString()
  @Prop({ required: true, trim: true })
  description: string;

  @Prop()
  image?: string;
}

export const GroupsSchema = SchemaFactory.createForClass(Groups);
