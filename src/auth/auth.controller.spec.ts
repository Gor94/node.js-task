import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { LoginDto } from '../user/dto/login.dto';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            signUp: jest.fn(),
            signIn: jest.fn(),
            updateAccessToken: jest.fn(),
          },
        },
      ],
    }).compile();

    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  describe('signUp', () => {
    it('should return tokens if signUp is successful', async () => {
      const tokens = { accessToken: 'access', refreshToken: 'refresh' };
      const userDto: CreateUserDto = { username: 'test', password: 'test' };
      const res = {
        cookie: jest.fn(),
      } as any;

      jest.spyOn(authService, 'signUp').mockResolvedValue(tokens);

      expect(await authController.signUp(userDto, res)).toBe(tokens);
      expect(res.cookie).toHaveBeenCalledWith(
        'refreshToken',
        tokens.refreshToken,
        {
          httpOnly: true,
          maxAge: 3 * 24 * 60 * 60 * 1000,
        },
      );
    });

    it('should throw an error if user already exists', async () => {
      const userDto: CreateUserDto = { username: 'test', password: 'test' };
      const res = {
        cookie: jest.fn(),
      } as any;

      jest.spyOn(authService, 'signUp').mockResolvedValue(null);

      await expect(authController.signUp(userDto, res)).rejects.toThrow(
        new HttpException(
          'User under this username already exists',
          HttpStatus.BAD_REQUEST,
        ),
      );
    });
  });

  describe('signIn', () => {
    it('should return tokens if signIn is successful', async () => {
      const tokens = { accessToken: 'access', refreshToken: 'refresh' };
      const userDto: LoginDto = { username: 'test', password: 'test' };
      const res = {
        cookie: jest.fn(),
      } as any;

      jest.spyOn(authService, 'signIn').mockResolvedValue(tokens);

      expect(await authController.singIn(userDto, res)).toBe(tokens);
      expect(res.cookie).toHaveBeenCalledWith(
        'refreshToken',
        tokens.refreshToken,
        {
          httpOnly: true,
          maxAge: 3 * 24 * 60 * 60 * 1000,
        },
      );
    });
  });

  describe('updateTokens', () => {
    it('should return access token if refreshToken is valid', async () => {
      const req = {
        cookies: {
          refreshToken: 'refreshToken',
        },
      } as any;
      const accessToken = 'accessToken';

      jest
        .spyOn(authService, 'updateAccessToken')
        .mockResolvedValue(accessToken);

      expect(await authController.updateTokens(req)).toBe(accessToken);
    });

    it('should throw an error if refreshToken is invalid', async () => {
      const req = {
        cookies: {
          refreshToken: 'invalidToken',
        },
      } as any;

      jest.spyOn(authService, 'updateAccessToken').mockResolvedValue(null);

      await expect(authController.updateTokens(req)).rejects.toThrow(
        new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED),
      );
    });
  });
});
