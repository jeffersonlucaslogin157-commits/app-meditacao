import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Criar cliente Supabase para uso no servidor
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email não fornecido' },
        { status: 400 }
      );
    }

    // Verificar se o Supabase está configurado
    if (!supabase) {
      // Retornar resposta válida mesmo sem Supabase configurado
      return NextResponse.json({
        success: true,
        hasActiveSubscription: false,
        message: 'Supabase não configurado - modo desenvolvimento',
      });
    }

    // Buscar assinatura ativa do usuário
    const { data: subscriptions, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_email', email)
      .eq('status', 'active')
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Erro ao buscar assinatura:', error);
      // Retornar resposta válida mesmo com erro
      return NextResponse.json({
        success: true,
        hasActiveSubscription: false,
        message: 'Erro ao verificar assinatura - assumindo sem assinatura',
      });
    }

    const hasActiveSubscription = subscriptions && subscriptions.length > 0;

    return NextResponse.json({
      success: true,
      hasActiveSubscription,
      subscription: hasActiveSubscription ? subscriptions[0] : null,
    });

  } catch (error) {
    console.error('Erro ao verificar assinatura:', error);
    // Retornar resposta válida mesmo com erro
    return NextResponse.json({
      success: true,
      hasActiveSubscription: false,
      message: 'Erro interno - assumindo sem assinatura',
    });
  }
}
