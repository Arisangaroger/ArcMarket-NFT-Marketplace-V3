import type { Notification, NotificationType } from "@/types";
import { uid } from "./utils";

type Listener = (notifications: Notification[]) => void;

class NotificationStore {
  private notifications: Notification[] = [];
  private listeners: Set<Listener> = new Set();

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.notifications);
    return () => this.listeners.delete(listener);
  }

  private emit() {
    const copy = [...this.notifications];
    this.listeners.forEach((l) => l(copy));
  }

  push(type: NotificationType, title: string, message: string, txHash?: string) {
    const n: Notification = {
      id: uid(),
      type,
      title,
      message,
      timestamp: Date.now(),
      read: false,
      txHash,
    };
    this.notifications = [n, ...this.notifications].slice(0, 50);
    this.emit();
    return n.id;
  }

  markRead(id: string) {
    this.notifications = this.notifications.map((n) => n.id === id ? { ...n, read: true } : n);
    this.emit();
  }

  markAllRead() {
    this.notifications = this.notifications.map((n) => ({ ...n, read: true }));
    this.emit();
  }

  clear() {
    this.notifications = [];
    this.emit();
  }

  get unreadCount(): number {
    return this.notifications.filter((n) => !n.read).length;
  }
}

export const notificationStore = new NotificationStore();
