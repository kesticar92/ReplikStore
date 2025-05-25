import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { LoggerService } from './logger.service';
import { CacheService } from './cache.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly logger: LoggerService,
    private readonly cache: CacheService,
  ) {}

  async validateToken(token: string): Promise<any> {
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('jwt.secret'),
      });

      // Verificar si el token está en la lista negra
      const isBlacklisted = await this.cache.exists(`blacklist:${token}`);
      if (isBlacklisted) {
        throw new UnauthorizedException('Token inválido');
      }

      return payload;
    } catch (error) {
      this.logger.error('Error validating token:', error);
      throw new UnauthorizedException('Token inválido');
    }
  }

  async generateToken(payload: any): Promise<string> {
    try {
      return await this.jwtService.signAsync(payload, {
        secret: this.configService.get('jwt.secret'),
        expiresIn: this.configService.get('jwt.expiresIn'),
      });
    } catch (error) {
      this.logger.error('Error generating token:', error);
      throw new UnauthorizedException('Error al generar token');
    }
  }

  async invalidateToken(token: string): Promise<void> {
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('jwt.secret'),
      });

      const ttl = payload.exp - Math.floor(Date.now() / 1000);
      if (ttl > 0) {
        await this.cache.set(`blacklist:${token}`, true, ttl);
      }
    } catch (error) {
      this.logger.error('Error invalidating token:', error);
    }
  }

  async validateUser(username: string, password: string): Promise<any> {
    // Implementar lógica de validación de usuario
    // Este es un placeholder que debe ser implementado según los requisitos
    throw new Error('Método no implementado');
  }
} 