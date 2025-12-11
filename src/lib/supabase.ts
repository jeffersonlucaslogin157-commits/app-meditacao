import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Verifica se as credenciais estão configuradas
const isSupabaseConfigured = supabaseUrl && supabaseAnonKey && 
  supabaseUrl !== '' && supabaseAnonKey !== '';

// Cria o cliente apenas se estiver configurado
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      global: {
        headers: {
          'x-client-info': 'serenidade-app',
        },
      },
    })
  : null;

// Helper para verificar se o Supabase está configurado
export const isSupabaseReady = () => isSupabaseConfigured;

// Helper seguro para operações de autenticação
export const safeAuth = {
  async getSession() {
    if (!supabase) return { data: { session: null }, error: null };
    try {
      return await supabase.auth.getSession();
    } catch (error) {
      // Silenciosamente retorna null sem logar erro
      return { data: { session: null }, error: null };
    }
  },
  
  async signOut() {
    if (!supabase) return { error: null };
    try {
      return await supabase.auth.signOut();
    } catch (error) {
      // Limpa a sessão localmente mesmo se o servidor falhar
      if (typeof window !== 'undefined') {
        localStorage.removeItem('supabase.auth.token');
      }
      return { error: null };
    }
  },
  
  async signInWithPassword(credentials: { email: string; password: string }) {
    if (!supabase) {
      return { 
        data: { user: null, session: null }, 
        error: new Error('Supabase não configurado') 
      };
    }
    try {
      return await supabase.auth.signInWithPassword(credentials);
    } catch (error: any) {
      return { 
        data: { user: null, session: null }, 
        error: error 
      };
    }
  },
  
  async signUp(credentials: { email: string; password: string }) {
    if (!supabase) {
      return { 
        data: { user: null, session: null }, 
        error: new Error('Supabase não configurado') 
      };
    }
    try {
      return await supabase.auth.signUp(credentials);
    } catch (error: any) {
      return { 
        data: { user: null, session: null }, 
        error: error 
      };
    }
  },
  
  onAuthStateChange(callback: (event: string, session: any) => void) {
    if (!supabase) {
      return { data: { subscription: { unsubscribe: () => {} } } };
    }
    try {
      return supabase.auth.onAuthStateChange(callback);
    } catch (error) {
      // Silenciosamente retorna subscription vazia
      return { data: { subscription: { unsubscribe: () => {} } } };
    }
  },
};
