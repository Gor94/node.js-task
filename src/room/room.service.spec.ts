import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoomService } from './room.service';
import { Room } from './entities/room.entity';
import { Message } from './entities/message.entity';
import { UserService } from '../user/user.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { AddMessageDto } from '../chat/dto/add-message.dto';
import { RemoveMessageDto } from '../chat/dto/remove-message.dto';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('RoomService', () => {
  let service: RoomService;
  let roomRepository: Repository<Room>;
  let messageRepository: Repository<Message>;
  let userService: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomService,
        {
          provide: getRepositoryToken(Room),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(Message),
          useClass: Repository,
        },
        {
          provide: UserService,
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RoomService>(RoomService);
    roomRepository = module.get<Repository<Room>>(getRepositoryToken(Room));
    messageRepository = module.get<Repository<Message>>(
      getRepositoryToken(Message),
    );
    userService = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllRooms', () => {
    it('should return an array of rooms', async () => {
      const rooms = [{ id: '1', name: 'Test Room', messages: [] }] as Room[];
      jest.spyOn(roomRepository, 'find').mockResolvedValue(rooms);

      expect(await service.findAllRooms()).toEqual(rooms);
    });
  });

  describe('findRoom', () => {
    it('should return a room if found', async () => {
      const roomId = '1';
      const room = { id: roomId, name: 'Test Room' } as Room;
      jest.spyOn(roomRepository, 'findOne').mockResolvedValue(room);

      expect(await service.findRoom(roomId)).toEqual(room);
    });

    it('should throw NotFoundException if room not found', async () => {
      const roomId = '1';
      jest.spyOn(roomRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findRoom(roomId)).rejects.toThrow(
        new NotFoundException(`There is no room under id ${roomId}`),
      );
    });
  });

  describe('createRoom', () => {
    it('should create and return a room', async () => {
      const createRoomDto: CreateRoomDto = { name: 'New Room' };
      const room = { id: '1', ...createRoomDto } as Room;
      jest.spyOn(roomRepository, 'create').mockReturnValue(room);
      jest.spyOn(roomRepository, 'save').mockResolvedValue(room);

      expect(await service.createRoom(createRoomDto)).toEqual(room);
    });
  });

  describe('addMessage', () => {
    it('should add and return a message', async () => {
      const addMessageDto: AddMessageDto = {
        roomId: '1',
        userId: '1',
        text: 'Hello',
      };
      const room = { id: '1', name: 'Test Room' } as Room;
      const user = { id: '1', username: 'Test User' } as any; // replace 'any' with your User type
      const message = { id: '1', text: 'Hello', room, user } as Message;

      jest.spyOn(service, 'findRoom').mockResolvedValue(room);
      jest.spyOn(userService, 'findOne').mockResolvedValue(user);
      jest.spyOn(messageRepository, 'create').mockReturnValue(message);
      jest.spyOn(messageRepository, 'save').mockResolvedValue(message);

      expect(await service.addMessage(addMessageDto)).toEqual(message);
    });
  });

  describe('removeMessage', () => {
    it('should remove a message if found and return it', async () => {
      const removeMessageDto: RemoveMessageDto = {
        roomId: '1',
        userId: '1',
        messageId: '1',
      };
      const room = { id: '1', name: 'Test Room' } as Room;
      const user = { id: '1', username: 'Test User' } as any; // replace 'any' with your User type
      const message = { id: '1', text: 'Hello', room, user } as Message;

      jest.spyOn(service, 'findRoom').mockResolvedValue(room);
      jest.spyOn(userService, 'findOne').mockResolvedValue(user);
      jest.spyOn(messageRepository, 'findOne').mockResolvedValue(message);
      jest.spyOn(messageRepository, 'remove').mockResolvedValue(message);

      expect(await service.removeMessage(removeMessageDto)).toEqual(message);
    });

    it('should throw ForbiddenException if message not found', async () => {
      const removeMessageDto: RemoveMessageDto = {
        roomId: '1',
        userId: '1',
        messageId: '1',
      };
      const room = { id: '1', name: 'Test Room' } as Room;
      const user = { id: '1', username: 'Test User' } as any; // replace 'any' with your User type

      jest.spyOn(service, 'findRoom').mockResolvedValue(room);
      jest.spyOn(userService, 'findOne').mockResolvedValue(user);
      jest.spyOn(messageRepository, 'findOne').mockResolvedValue(null);

      await expect(service.removeMessage(removeMessageDto)).rejects.toThrow(
        new ForbiddenException(
          `You have not permission to remove this message`,
        ),
      );
    });
  });

  describe('findRoomWithRelations', () => {
    it('should return a room with relations if found', async () => {
      const roomId = '1';
      const room = {
        id: roomId,
        name: 'Test Room',
        messages: [],
        users: [],
        bannedUsers: [],
      } as Room;
      jest.spyOn(roomRepository, 'findOne').mockResolvedValue(room);

      expect(await service.findRoomWithRelations(roomId)).toEqual(room);
    });

    it('should throw NotFoundException if room not found', async () => {
      const roomId = '1';
      jest.spyOn(roomRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findRoomWithRelations(roomId)).rejects.toThrow(
        new NotFoundException(`There is no room under id ${roomId}`),
      );
    });
  });
});
