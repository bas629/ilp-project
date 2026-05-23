import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService implements OnDestroy {
  private client!: Client;
  private stockSubject = new Subject<any>();
  private goldSubject = new Subject<any>();
  private eventSubject = new Subject<any>();
  private connectionStatus = new Subject<boolean>();

  public stocks$ = this.stockSubject.asObservable();
  public gold$ = this.goldSubject.asObservable();
  public event$ = this.eventSubject.asObservable();
  public connected$ = this.connectionStatus.asObservable();

  constructor() {
    this.connect();
  }

  private connect() {
    const socket = new SockJS('http://localhost:8080/ws/market');
    this.client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      debug: (str) => {
        console.log(str);
      }
    });

    this.client.onConnect = (frame) => {
      console.log('Connected to WebSocket server');
      this.connectionStatus.next(true);

      // Subscribe to stocks
      this.client.subscribe('/topic/market/stocks', (message) => {
        try {
          this.stockSubject.next(JSON.parse(message.body));
        } catch (e) {
          console.error('Error parsing stocks tick', e);
        }
      });

      // Subscribe to gold price
      this.client.subscribe('/topic/market/gold', (message) => {
        try {
          this.goldSubject.next(JSON.parse(message.body));
        } catch (e) {
          console.error('Error parsing gold tick', e);
        }
      });

      // Subscribe to news events
      this.client.subscribe('/topic/market/events', (message) => {
        try {
          this.eventSubject.next(JSON.parse(message.body));
        } catch (e) {
          console.error('Error parsing news event', e);
        }
      });
    };

    this.client.onDisconnect = () => {
      console.log('Disconnected from WebSocket');
      this.connectionStatus.next(false);
    };

    this.client.onStompError = (frame) => {
      console.error('STOMP protocol error', frame);
      this.connectionStatus.next(false);
    };

    this.client.activate();
  }

  ngOnDestroy() {
    if (this.client) {
      this.client.deactivate();
    }
  }
}
