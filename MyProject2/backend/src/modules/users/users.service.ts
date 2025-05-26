import { Injectable } from '@nestjs/common';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  private readonly users: User[] = [];

  async findOne(username: string): Promise<User | undefined> {
    return this.users.find(user => user.username === username);
  }

  async create(username: string, hashedPassword: string): Promise<User> {
    const user: User = {
      id: this.users.length + 1,
      username,
      password: hashedPassword,
    };
    this.users.push(user);
    return user;
  }
} 