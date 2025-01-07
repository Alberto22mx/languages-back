import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { IsNotEmpty, IsString } from 'class-validator';
import { v4 as uuidv4 } from 'uuid';

export type GamesDocument = Games & Document;

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
export class Games {
  @Prop({ default: uuidv4, immutable: true })
  id: string;

  @IsNotEmpty({ message: 'El nombre del juego es requerido' })
  @IsString()
  @Prop({ required: true, trim: true })
  title: string;

  @IsNotEmpty({ message: 'La descripción del juego es requerida' })
  @IsString()
  @Prop({ required: true, trim: true })
  description: string;

  @IsNotEmpty({ message: 'Las instrucciones son requeridas' })
  @IsString()
  @Prop({ required: true, trim: true })
  instructions: string;

  @Prop({ default: false })
  active: boolean;

  @Prop()
  image?: string;
}

export const GamesSchema = SchemaFactory.createForClass(Games);
