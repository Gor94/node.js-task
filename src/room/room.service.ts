import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserService } from '../user/user.service';
import { Room } from './entities/room.entity';
import { Message } from './entities/message.entity';
import { CreateRoomDto } from './dto/create-room.dto';
import { AddMessageDto } from '../chat/dto/add-message.dto';
import { RemoveMessageDto } from '../chat/dto/remove-message.dto';

@Injectable()
export class RoomService {
  constructor(
    @InjectRepository(Room) private readonly roomRepository: Repository<Room>,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    private readonly userService: UserService,
  ) {}

  async findAllRooms() {
    return this.roomRepository.find({ relations: ['messages'] });
  }

  async findRoom(id: string) {
    const room = await this.roomRepository.findOne({ where: { id } });

    if (!room) {
      throw new NotFoundException(`There is no room under id ${id}`);
    }

    return room;
  }

  async createRoom(createRoomDto: CreateRoomDto) {
    const room = await this.roomRepository.create({
      ...createRoomDto,
    });

    return this.roomRepository.save(room);
  }

  async addMessage(addMessageDto: AddMessageDto) {
    const { roomId, userId, text } = addMessageDto;

    const room = await this.findRoom(roomId);
    const user = await this.userService.findOne(userId);

    const message = await this.messageRepository.create({
      text,
      room,
      user,
    });

    return this.messageRepository.save(message);
  }

  async removeMessage(removeMessageDto: RemoveMessageDto) {
    const { roomId, userId, messageId } = removeMessageDto;

    const room = await this.findRoom(roomId);
    const user = await this.userService.findOne(userId);

    const message = await this.messageRepository.findOne({
      where: { id: messageId, user, room },
    });
    if (!message) {
      throw new ForbiddenException(
        `You have not permission to remove this message`,
      );
    }
    return this.messageRepository.remove(message);
  }

  async findRoomWithRelations(id: string) {
    const room = await this.roomRepository.findOne({
      where: { id },
      relations: ['messages', 'users', 'bannedUsers'],
    });

    if (!room) {
      throw new NotFoundException(`There is no room under id ${id}`);
    }

    return room;
  }
}
