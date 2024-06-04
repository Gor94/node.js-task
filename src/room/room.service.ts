import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserService } from 'src/user/user.service';
import { Room } from './entities/room.entity';
import { Message } from './entities/message.entity';
import { CreateRoomDto } from 'src/room/dto/create-room.dto';

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

  async findRoomByName(name: string) {
    return this.roomRepository.findOne({ where: { name } });
  }

  async createRoom(createRoomDto: CreateRoomDto) {
    const room = await this.roomRepository.create({
      ...createRoomDto,
    });

    return this.roomRepository.save(room);
  }

  async addMessage(addMessageDto: any) {
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
}
