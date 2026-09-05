import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { IsNotEmpty, IsString } from 'class-validator';
import { v4 as uuidv4 } from 'uuid';
import { Schema as MongooseSchema } from 'mongoose';

export type GamesDocument = Games & Document;

export enum GameType {
  ACTION = 'Action',
  PUZZLE = 'Puzzle',
  ADVENTURE = 'Adventure',
  STRATEGY = 'Strategy',
  WORDSEARCH = 'WordSearch',
}

@Schema({
  timestamps: true,
  strict: true,
  toJSON: {
    virtuals: true,
    transform: function (_doc, ret) {
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class Games extends Document {
  @Prop({ default: uuidv4, immutable: true, type: String })
  id: string;

  @IsNotEmpty({ message: 'El nombre del juego es requerido' })
  @IsString()
  @Prop({ required: true, trim: true })
  title: string;

  @IsNotEmpty({ message: 'Las instrucciones son requeridas' })
  @IsString()
  @Prop({ required: true, trim: true })
  instructions: string;

  @Prop({ default: false })
  active: boolean;

  @Prop()
  image?: string;

  @Prop()
  url?: string;

  @Prop({ type: [MongooseSchema.Types.Mixed] })
  data?: any[];

  @Prop({ enum: GameType, required: true })
  type: GameType;
}

export const GamesSchema = SchemaFactory.createForClass(Games);
