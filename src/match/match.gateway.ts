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
import { MatchService } from './match.service';

/**
 * 경기 실시간 업데이트 WebSocket Gateway
 * 대회ID와 매트ID로 경기 정보를 실시간으로 전송
 */
@WebSocketGateway({
  cors: {
    origin: '*', // 모든 origin 허용 (프로덕션에서는 특정 origin만 허용)
    credentials: true,
  },
  namespace: '/matches',
})
export class MatchGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MatchGateway.name);
  // 클라이언트별 구독 정보 저장 (대회ID, 매트ID)
  private readonly clientRooms = new Map<string, { competitionIdx: number; matIdx: number }>();

  constructor(private readonly matchService: MatchService) {}

  /**
   * 클라이언트 연결 시
   */
  handleConnection(client: Socket) {
    this.logger.log(`클라이언트 연결: ${client.id}`);
  }

  /**
   * 클라이언트 연결 해제 시
   */
  handleDisconnect(client: Socket) {
    this.logger.log(`클라이언트 연결 해제: ${client.id}`);
    this.clientRooms.delete(client.id);
  }

  /**
   * 경기 정보 구독
   * 클라이언트가 대회ID와 매트ID를 보내면 해당 매트의 경기 정보를 반환하고 실시간 업데이트를 받음
   */
  @SubscribeMessage('subscribe')
  async handleSubscribe(
    @MessageBody() data: { competitionIdx: number; matIdx: number },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { competitionIdx, matIdx } = data;

      if (!competitionIdx || !matIdx) {
        client.emit('error', {
          message: '대회ID와 매트ID가 필요합니다.',
        });
        return;
      }

      // 클라이언트 구독 정보 저장
      this.clientRooms.set(client.id, { competitionIdx, matIdx });

      // 해당 매트의 경기 정보 조회
      const matches = await this.matchService.findByCompetitionAndMat(
        competitionIdx,
        matIdx,
      );

      // 클라이언트에게 초기 경기 정보 전송
      client.emit('matches', {
        competitionIdx,
        matIdx,
        matches,
      });

      // 특정 매트의 룸에 조인 (나중에 브로드캐스트용)
      const roomName = `competition:${competitionIdx}:mat:${matIdx}`;
      client.join(roomName);

      this.logger.log(
        `클라이언트 ${client.id}가 대회 ${competitionIdx}, 매트 ${matIdx} 구독 시작`,
      );
    } catch (error: any) {
      this.logger.error(`구독 오류: ${error.message}`, error.stack);
      client.emit('error', {
        message: error.message || '경기 정보 조회 중 오류가 발생했습니다.',
      });
    }
  }

  /**
   * 경기 정보 구독 해제
   */
  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(@ConnectedSocket() client: Socket) {
    const roomInfo = this.clientRooms.get(client.id);
    if (roomInfo) {
      const roomName = `competition:${roomInfo.competitionIdx}:mat:${roomInfo.matIdx}`;
      client.leave(roomName);
      this.clientRooms.delete(client.id);
      this.logger.log(`클라이언트 ${client.id} 구독 해제`);
    }
  }

  /**
   * 특정 매트의 경기 정보를 모든 구독자에게 브로드캐스트
   * @param competitionIdx 대회 ID
   * @param matIdx 매트 ID
   */
  async broadcastMatchesUpdate(competitionIdx: number, matIdx: number) {
    try {
      // 해당 매트의 최신 경기 정보 조회
      const matches = await this.matchService.findByCompetitionAndMat(
        competitionIdx,
        matIdx,
      );

      // 해당 매트를 구독하는 모든 클라이언트에게 브로드캐스트
      const roomName = `competition:${competitionIdx}:mat:${matIdx}`;
      this.server.to(roomName).emit('matches', {
        competitionIdx,
        matIdx,
        matches,
      });

      this.logger.log(
        `대회 ${competitionIdx}, 매트 ${matIdx} 경기 정보 업데이트 브로드캐스트`,
      );
    } catch (error: any) {
      this.logger.error(
        `경기 정보 브로드캐스트 오류: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * 특정 경기 정보 업데이트 브로드캐스트
   * @param matchIdx 경기 ID
   */
  async broadcastMatchUpdate(matchIdx: number) {
    try {
      // 경기 정보 조회
      const match = await this.matchService.findOne(matchIdx);

      if (!match || !match.group) {
        return;
      }

      // 해당 경기가 속한 대회와 매트의 모든 구독자에게 업데이트 전송
      await this.broadcastMatchesUpdate(
        match.group.competition_idx,
        match.group.mat_idx,
      );
    } catch (error: any) {
      this.logger.error(
        `경기 업데이트 브로드캐스트 오류: ${error.message}`,
        error.stack,
      );
    }
  }
}

