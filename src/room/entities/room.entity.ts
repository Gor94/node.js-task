import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

import { User } from '../../user/entities/user.entity';
import { Message } from './message.entity';

@Entity()
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 20 })
  name: string;

  @OneToMany(() => User, (user: User) => user.room)
  users: Array<User>;

  @OneToMany(() => Message, (messages: Message) => messages.room)
  messages: Array<Message>;
}
