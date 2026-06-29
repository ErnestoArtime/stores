import { Injectable, inject, signal, computed } from '@angular/core';
import { Session, User } from '@supabase/supabase-js';
import { StaffProfile } from '@stores/domain';
import { RUNTIME_CONFIG } from './app-config';
import { SupabaseClientService } from './supabase.client';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly supabase = inject(SupabaseClientService);
  private readonly config = inject(RUNTIME_CONFIG);

  private readonly _user = signal<User | null>(null);
  private readonly _session = signal<Session | null>(null);
  private readonly _profile = signal<StaffProfile | null>(null);
  private readonly _loading = signal(true);

  readonly user = this._user.asReadonly();
  readonly session = this._session.asReadonly();
  readonly profile = this._profile.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly isAuthenticated = computed(() => !!this._user());
  readonly isStaff = computed(() => !!this._profile() && this._profile()!.active);
  private initPromise: Promise<void>;

  constructor() {
    this.initPromise = this.init();
  }

  private async init(): Promise<void> {
    if (!this.supabase.configured) {
      this._loading.set(false);
      return;
    }

    const { data: { session } } = await this.supabase.client.auth.getSession();
    this._session.set(session);
    this._user.set(session?.user ?? null);

    if (session?.user) {
      await this.loadProfile(session.user.id);
    }

    this.supabase.client.auth.onAuthStateChange((_event, session) => {
      this._session.set(session);
      this._user.set(session?.user ?? null);

      if (session?.user) {
        this.loadProfile(session.user.id);
      } else {
        this._profile.set(null);
      }
    });

    this._loading.set(false);
  }

  async signInWithEmail(email: string, password: string): Promise<{ error?: string }> {
    if (!this.supabase.configured) {
      return { error: 'Supabase no configurado' };
    }

    const { error } = await this.supabase.client.auth.signInWithPassword({ email, password });
    if (error) {
      return { error: error.message };
    }
    return {};
  }

  async signInWithOtp(email: string): Promise<{ error?: string }> {
    if (!this.supabase.configured) {
      return { error: 'Supabase no configurado' };
    }

    const { error } = await this.supabase.client.auth.signInWithOtp({ email });
    if (error) {
      return { error: error.message };
    }
    return {};
  }

  async waitUntilReady(): Promise<void> {
    await this.initPromise;
  }

  async signOut(): Promise<void> {
    if (!this.supabase.configured) {
      return;
    }
    await this.supabase.client.auth.signOut();
    this._profile.set(null);
  }

  private async loadProfile(userId: string): Promise<void> {
    if (!this.supabase.configured) {
      return;
    }

    const { data, error } = await this.supabase.client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!error && data) {
      this._profile.set({
        id: data.id,
        tenantId: data.tenant_id,
        fullName: data.full_name,
        email: data.email,
        role: data.role,
        active: data.active
      });
    }
  }

  hasRole(...roles: StaffProfile['role'][]): boolean {
    const profile = this._profile();
    if (!profile || !profile.active) {
      return false;
    }
    return roles.includes(profile.role);
  }
}
