import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinTable,
  OneToMany,
} from 'typeorm';

import { Room } from '../../room/entities/room.entity';
import { Message } from '../../room/entities/message.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  username: string;

  @Column()
  password: string;

  @JoinTable()
  @ManyToOne(() => Room, (room: Room) => room.users)
  room: Room;

  @OneToMany(() => Message, (messages: Message) => messages.user)
  messages: Array<Message>;
}
