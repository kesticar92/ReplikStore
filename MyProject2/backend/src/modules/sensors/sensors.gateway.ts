import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { SensorsService } from './sensors.service';

interface SensorAlert {
  type: string;
  message: string;
  value: number;
  threshold: number;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'sensors',
})
export class SensorsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SensorsGateway.name);
  private connectedClients: Map<string, Socket> = new Map();

  constructor(private readonly sensorsService: SensorsService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Cliente conectado: ${client.id}`);
    this.connectedClients.set(client.id, client);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Cliente desconectado: ${client.id}`);
    this.connectedClients.delete(client.id);
  }

  @SubscribeMessage('subscribeToSensor')
  async handleSubscribeToSensor(
    @ConnectedSocket() client: Socket,
    @MessageBody() sensorId: string,
  ) {
    this.logger.log(`Cliente ${client.id} suscrito al sensor ${sensorId}`);
    client.join(`sensor:${sensorId}`);
    return { status: 'subscribed', sensorId };
  }

  @SubscribeMessage('unsubscribeFromSensor')
  async handleUnsubscribeFromSensor(
    @ConnectedSocket() client: Socket,
    @MessageBody() sensorId: string,
  ) {
    this.logger.log(`Cliente ${client.id} desuscrito del sensor ${sensorId}`);
    client.leave(`sensor:${sensorId}`);
    return { status: 'unsubscribed', sensorId };
  }

  async notifySensorData(sensorId: string, data: any) {
    this.server.to(`sensor:${sensorId}`).emit('sensorData', {
      sensorId,
      data,
      timestamp: new Date(),
    });
  }

  async notifySensorAlert(sensorId: string, alert: SensorAlert) {
    this.server.to(`sensor:${sensorId}`).emit('sensorAlert', {
      sensorId,
      alert,
      timestamp: new Date(),
    });
  }
} 