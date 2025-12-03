import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json({ hasSubscription: false }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });

    // Verificar usuário autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ hasSubscription: false }, { status: 401 });
    }

    // Buscar assinatura ativa do usuário
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1);

    if (subError) {
      console.error('Erro ao buscar assinatura:', subError);
      return NextResponse.json({ hasSubscription: false }, { status: 500 });
    }

    const hasActiveSubscription = subscriptions && subscriptions.length > 0;

    return NextResponse.json({ 
      hasSubscription: hasActiveSubscription,
      subscription: hasActiveSubscription ? subscriptions[0] : null
    });

  } catch (error) {
    console.error('Erro ao verificar assinatura:', error);
    return NextResponse.json({ hasSubscription: false }, { status: 500 });
  }
}
