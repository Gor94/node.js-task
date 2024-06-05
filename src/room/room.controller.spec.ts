import { Test, TestingModule } from '@nestjs/testing';
import { RoomController } from './room.controller';
import { RoomService } from './room.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateRoomDto } from './dto/create-room.dto';
import { ExecutionContext } from '@nestjs/common';
import { Room } from './entities/room.entity';

describe('RoomController', () => {
  let controller: RoomController;
  let roomService: RoomService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoomController],
      providers: [
        {
          provide: RoomService,
          useValue: {
            findRoom: jest.fn(),
            findAllRooms: jest.fn(),
            createRoom: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => true,
      })
      .compile();

    controller = module.get<RoomController>(RoomController);
    roomService = module.get<RoomService>(RoomService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findOne', () => {
    it('should return a room if found', async () => {
      const roomId = '1';
      const room: Room = { id: roomId, name: 'Test Room', users: [], messages: [] };
      jest.spyOn(roomService, 'findRoom').mockResolvedValue(room);

      expect(await controller.findOne(roomId)).toEqual(room);
    });
  });

  describe('findAll', () => {
    it('should return an array of rooms', async () => {
      const rooms: Room[] = [
        { id: '1', name: 'Test Room 1', users: [], messages: [] },
        { id: '2', name: 'Test Room 2', users: [], messages: [] },
      ];
      jest.spyOn(roomService, 'findAllRooms').mockResolvedValue(rooms);

      expect(await controller.findAll()).toEqual(rooms);
    });
  });

  describe('create', () => {
    it('should create and return a room', async () => {
      const createRoomDto: CreateRoomDto = { name: 'New Room' };
      const room: Room = { id: '1', name: 'New Room', users: [], messages: [] };
      jest.spyOn(roomService, 'createRoom').mockResolvedValue(room);

      expect(await controller.create(createRoomDto)).toEqual(room);
    });
  });
});
