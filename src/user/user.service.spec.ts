import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Room } from '../room/entities/room.entity';
import { NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';

describe('UserService', () => {
  let service: UserService;
  let userRepository: Repository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should return a user if found', async () => {
      const userId = '1';
      const user = { id: userId, username: 'test', room: {} } as User;
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(user);

      expect(await service.findOne(userId)).toEqual(user);
    });

    it('should throw NotFoundException if user not found', async () => {
      const userId = '1';
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne(userId)).rejects.toThrow(
        new NotFoundException(`There is no user under id ${userId}`),
      );
    });
  });

  describe('findOneByUsername', () => {
    it('should return a user if found', async () => {
      const username = 'test';
      const user = { id: '1', username } as User;
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(user);

      expect(await service.findOneByUsername(username)).toEqual(user);
    });

    it('should return null if user not found', async () => {
      const username = 'test';
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      expect(await service.findOneByUsername(username)).toBeNull();
    });
  });

  describe('create', () => {
    it('should create and return a user', async () => {
      const createUserDto = { username: 'test' } as CreateUserDto;
      const user = { id: '1', ...createUserDto } as User;
      jest.spyOn(userRepository, 'create').mockReturnValue(user);
      jest.spyOn(userRepository, 'save').mockResolvedValue(user);

      expect(await service.create(createUserDto)).toEqual(user);
    });
  });

  describe('updateUserRoom', () => {
    it('should update and return the user if found', async () => {
      const userId = '1';
      const room = { id: '1' } as Room;
      const user = { id: userId, room } as User;
      jest.spyOn(userRepository, 'preload').mockResolvedValue(user);
      jest.spyOn(userRepository, 'save').mockResolvedValue(user);

      expect(await service.updateUserRoom(userId, room)).toEqual(user);
    });

    it('should throw NotFoundException if user not found', async () => {
      const userId = '1';
      const room = { id: '1' } as Room;
      jest.spyOn(userRepository, 'preload').mockResolvedValue(null);

      await expect(service.updateUserRoom(userId, room)).rejects.toThrow(
        new NotFoundException(`There is no user under id ${userId}`),
      );
    });
  });
});
