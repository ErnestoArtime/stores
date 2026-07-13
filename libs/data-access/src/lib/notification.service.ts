import { Injectable, inject } from '@angular/core';
import { SupabaseClientService } from './supabase.client';

export type NotificationChannel = 'whatsapp' | 'email' | 'push' | 'telegram';

export interface NotificationPayload {
  tenantId: string;
  channel: NotificationChannel;
  eventKey: string;
  recipient: string;
  variables?: Record<string, string>;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly supabase = inject(SupabaseClientService);

  async send(payload: NotificationPayload): Promise<{ queued: boolean; error?: string }> {
    if (!this.supabase.configured) {
      return { queued: false, error: 'Supabase no esta configurado' };
    }

    const session = await this.supabase.client.auth.getSession();
    const token = session.data.session?.access_token;
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const { data, error } = await this.supabase.client.functions.invoke('send-notification', {
      body: {
        tenantId: payload.tenantId,
        channel: payload.channel,
        eventKey: payload.eventKey,
        recipient: payload.recipient,
        variables: payload.variables ?? {}
      },
      headers
    });

    if (error) {
      return { queued: false, error: error.message || 'Error al enviar notificacion' };
    }

    return { queued: data?.queued ?? true };
  }
}
