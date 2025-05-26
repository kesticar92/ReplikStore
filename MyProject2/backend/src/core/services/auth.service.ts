import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { LoggerService } from './logger.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private logger: LoggerService,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    try {
      // Aquí iría la lógica de validación contra la base de datos
      const user = await this.findUser(username);
      if (!user) {
        throw new UnauthorizedException('Usuario no encontrado');
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Contraseña incorrecta');
      }

      const { password: _, ...result } = user;
      return result;
    } catch (error) {
      this.logger.error('Error en validación de usuario', error.stack, 'AuthService');
      throw error;
    }
  }

  async login(user: any) {
    try {
      const payload = { username: user.username, sub: user.id };
      return {
        access_token: this.jwtService.sign(payload),
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
        },
      };
    } catch (error) {
      this.logger.error('Error en login', error.stack, 'AuthService');
      throw error;
    }
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  private async findUser(username: string): Promise<any> {
    // Aquí iría la lógica para buscar el usuario en la base de datos
    return null;
  }
} 