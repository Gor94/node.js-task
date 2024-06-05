import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { LoginDto } from '../user/dto/login.dto';

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let authService: AuthService;
  let userService: UserService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: {
            findOneByUsername: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  describe('signUp', () => {
    it('should return null if user already exists', async () => {
      jest.spyOn(userService, 'findOneByUsername').mockResolvedValue({} as any);

      const result = await authService.signUp({ username: 'test', password: 'test' } as CreateUserDto);

      expect(result).toBeNull();
    });

    it('should create a user and return tokens if user does not exist', async () => {
      jest.spyOn(userService, 'findOneByUsername').mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      jest.spyOn(userService, 'create').mockResolvedValue({ id: '1' } as any);
      jest.spyOn(authService, 'generateTokens').mockResolvedValue({
        accessToken: 'accessToken',
        refreshToken: 'refreshToken',
      });

      const result = await authService.signUp({ username: 'test', password: 'test' } as CreateUserDto);

      expect(result).toEqual({
        accessToken: 'accessToken',
        refreshToken: 'refreshToken',
      });
    });
  });

  describe('signIn', () => {
    it('should return tokens for valid user', async () => {
      jest.spyOn(userService, 'findOneByUsername').mockResolvedValue({ id: '1' } as any);
      jest.spyOn(authService, 'generateTokens').mockResolvedValue({
        accessToken: 'accessToken',
        refreshToken: 'refreshToken',
      });

      const result = await authService.signIn({ username: 'test', password: 'test' } as LoginDto);

      expect(result).toEqual({
        accessToken: 'accessToken',
        refreshToken: 'refreshToken',
      });
    });
  });

  describe('validateUser', () => {
    it('should throw NotFoundException if user does not exist', async () => {
      jest.spyOn(userService, 'findOneByUsername').mockResolvedValue(null);

      await expect(authService.validateUser({ username: 'test', password: 'test' } as LoginDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw UnauthorizedException if password is incorrect', async () => {
      jest.spyOn(userService, 'findOneByUsername').mockResolvedValue({ password: 'hashedPassword' } as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.validateUser({ username: 'test', password: 'test' } as LoginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should return user if password is correct', async () => {
      jest.spyOn(userService, 'findOneByUsername').mockResolvedValue({ password: 'hashedPassword' } as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await authService.validateUser({ username: 'test', password: 'test' } as LoginDto);

      expect(result).toEqual({ password: 'hashedPassword' });
    });
  });

  describe('verifyAccessToken', () => {
    it('should return payload if token is valid', () => {
      jest.spyOn(jwtService, 'verify').mockReturnValue({ id: '1' });

      const result = authService.verifyAccessToken('validToken');

      expect(result).toEqual({ id: '1' });
    });

    it('should return null if token is invalid', () => {
      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error();
      });

      const result = authService.verifyAccessToken('invalidToken');

      expect(result).toBeNull();
    });
  });

  describe('verifyRefreshToken', () => {
    it('should return payload if token is valid', () => {
      jest.spyOn(jwtService, 'verify').mockReturnValue({ id: '1' });

      const result = authService.verifyRefreshToken('validToken');

      expect(result).toEqual({ id: '1' });
    });
  });

  describe('updateAccessToken', () => {
    it('should return new access token if refresh token is valid', async () => {
      jest.spyOn(authService, 'verifyRefreshToken').mockReturnValue('1');
      jest.spyOn(authService, 'generateTokens').mockResolvedValue({
        accessToken: 'newAccessToken',
        refreshToken: 'refreshToken',
      });

      const result = await authService.updateAccessToken('validRefreshToken');

      expect(result).toEqual('newAccessToken');
    });

    it('should return null if refresh token is invalid', async () => {
      jest.spyOn(authService, 'verifyRefreshToken').mockImplementation(() => {
        throw new Error();
      });

      const result = await authService.updateAccessToken('invalidRefreshToken');

      expect(result).toBeNull();
    });
  });
});
