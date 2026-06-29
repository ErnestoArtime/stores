import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? '';
    const { data: authData, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authData.user) {
      return new Response(
        JSON.stringify({ error: 'Sesion requerida' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const {
      tenant_id,
      store_id,
      customer_name,
      customer_phone,
      delivery_address,
      delivery_zone,
      delivery_window,
      payment_method,
      subtotal,
      delivery_fee,
      discount,
      total,
      lines,
      coupon_code,
    } = body;

    if (!tenant_id || !store_id || !customer_name || !customer_phone || !delivery_address || !lines?.length) {
      return new Response(
        JSON.stringify({ error: 'Campos requeridos faltantes' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate stock for each line item
    for (const line of lines) {
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id, stock, status')
        .eq('id', line.productId)
        .eq('tenant_id', tenant_id)
        .single();

      if (productError || !product) {
        return new Response(
          JSON.stringify({ error: `Producto ${line.productId} no encontrado` }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (product.status !== 'active') {
        return new Response(
          JSON.stringify({ error: `Producto ${line.name} no esta activo` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (product.stock < line.quantity) {
        return new Response(
          JSON.stringify({ error: `Stock insuficiente para ${line.name}. Disponible: ${product.stock}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Validate coupon if provided
    let discountAmount = discount || 0;
    if (coupon_code) {
      const { data: promo } = await supabase
        .from('promotions')
        .select('*')
        .eq('tenant_id', tenant_id)
        .eq('code', coupon_code)
        .eq('active', true)
        .single();

      if (promo) {
        const now = new Date().toISOString();
        if ((!promo.starts_at || promo.starts_at <= now) && (!promo.ends_at || promo.ends_at >= now)) {
          if (promo.type === 'percent') {
            discountAmount = Math.round(subtotal * promo.value / 100);
          } else if (promo.type === 'fixed') {
            discountAmount = promo.value;
          } else if (promo.type === 'free_delivery') {
            discountAmount = delivery_fee;
          }
        }
      }
    }

    const calculatedTotal = Math.max(subtotal + delivery_fee - discountAmount, 0);

    // Generate order code
    const code = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

    // Insert order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        tenant_id,
        store_id,
        customer_id: authData.user.id,
        code,
        customer_name,
        customer_phone,
        delivery_address,
        delivery_zone: delivery_zone || null,
        delivery_window: delivery_window || null,
        payment_method,
        subtotal,
        delivery_fee,
        discount: discountAmount,
        status: 'placed',
      })
      .select('id, code')
      .single();

    if (orderError) {
      return new Response(
        JSON.stringify({ error: 'Error al crear el pedido', details: orderError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert order items
    const orderItems = lines.map((line: any) => ({
      tenant_id,
      order_id: order.id,
      product_id: line.productId,
      name: line.name,
      quantity: line.quantity,
      unit_price: line.unitPrice,
    }));

    await supabase.from('order_items').insert(orderItems);

    // Reduce stock for each product
    for (const line of lines) {
      const { data: product } = await supabase
        .from('products')
        .select('stock')
        .eq('id', line.productId)
        .single();

      if (product) {
        await supabase
          .from('products')
          .update({ stock: Math.max(product.stock - line.quantity, 0) })
          .eq('id', line.productId);
      }
    }

    return new Response(
      JSON.stringify({ id: order.id, code: order.code, total: calculatedTotal }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
