import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Room } from '../room/entities/room.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  async findOne(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['room'],
    });

    if (!user) {
      throw new NotFoundException(`There is no user under id ${id}`);
    }

    return user;
  }

  async findOneByUsername(username: string) {
    return this.userRepository.findOne({ where: { username } });
  }

  async create(createUserDto: CreateUserDto) {
    const user = await this.userRepository.create({
      ...createUserDto,
    });

    return this.userRepository.save(user);
  }

  async updateUserRoom(id: string, room: Room) {
    const user = await this.userRepository.preload({
      id,
      room,
    });

    if (!user) {
      throw new NotFoundException(`There is no user under id ${id}`);
    }

    return this.userRepository.save(user);
  }
}
