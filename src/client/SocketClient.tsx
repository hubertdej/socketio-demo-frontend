import { io, Socket } from 'socket.io-client';
import { Client, Message, MessageListener, Storage } from './interfaces';

export class SocketClient implements Client {
  private readonly socket: Socket;

  private readonly messageStorage: Storage;

  private readonly subscriptionCounters = new Map<string, number>();

  constructor(endpoint: string, messageStorage: Storage) {
    this.messageStorage = messageStorage;

    this.socket = io(endpoint, { autoConnect: false });

    this.socket.on('connect', () => {
      console.log('[SocketClient] Connected');
      this.subscriptionCounters.forEach((count, topicId) => {
        if (count > 0) {
          this.socket.emit('subscribe', topicId);
        }
      });
    });
    this.socket.on('disconnect', () => {
      console.log('[SocketClient] Disconnected');
    });
    this.socket.on('message', (data: Message) => {
      console.log(`[SocketClient] Received message for topic ${data.topicId}: ${data.message}`);
      if (!this.subscriptionCounters.get(data.topicId)) {
        this.socket.emit('unsubscribe', data.topicId);
        return;
      }
      const messages = this.getCachedMessages(data.topicId);
      messages.push(data);
      this.setCachedMessages(data.topicId, messages);
    });
  }

  connect() {
    this.socket.connect();
  }

  disconnect() {
    this.socket.disconnect();
  }

  private getCachedMessages(topicId: string): Message[] {
    return JSON.parse(this.messageStorage.getItem(topicId) || '[]');
  }

  private setCachedMessages(topicId: string, messages: Message[]) {
    this.messageStorage.setItem(topicId, JSON.stringify(messages));
  }

  private createFilteredListener(topicId: string, listener: MessageListener) {
    return (message: Message) => {
      if (message.topicId === topicId) {
        listener(message);
      }
    };
  }

  subscribe(topicId: string, listener: MessageListener) {
    const count = this.subscriptionCounters.get(topicId) || 0;
    this.subscriptionCounters.set(topicId, count + 1);

    this.getCachedMessages(topicId).forEach(listener);

    const filteredListener = this.createFilteredListener(topicId, listener);
    this.socket.on('message', filteredListener);

    if (count === 0) {
      this.socket.emit('subscribe', topicId);
    }

    return { unsubscribe: () => this.unsubscribe(topicId, filteredListener) };
  }

  private unsubscribe(topicId: string, listener: MessageListener) {
    const count = this.subscriptionCounters.get(topicId) || 0;
    this.subscriptionCounters.set(topicId, count - 1);
    if (count === 0) {
      throw new Error(`Cannot unsubscribe from topic ${topicId}: no subscriptions`);
    }
    this.socket.off('message', listener);
    if (count === 1) {
      this.socket.emit('unsubscribe', topicId);
    }
  }
}
