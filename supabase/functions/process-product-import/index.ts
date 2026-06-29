import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ImportRow {
  sku: string;
  name: string;
  price: number;
  stock: number;
  unit: string;
  category?: string;
  description?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { tenant_id, store_id, rows, import_job_id } = body;

    if (!tenant_id || !rows?.length) {
      return new Response(
        JSON.stringify({ error: 'tenant_id y rows son requeridos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let targetStoreId = store_id;
    if (!targetStoreId) {
      const { data: firstStore } = await supabase
        .from('store_locations')
        .select('id')
        .eq('tenant_id', tenant_id)
        .limit(1)
        .single();
      targetStoreId = firstStore?.id;
    }

    if (!targetStoreId) {
      return new Response(
        JSON.stringify({ error: 'No hay sucursal destino para importar productos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const issues: { row: number; field: string; message: string }[] = [];
    const validRows: ImportRow[] = [];

    // Validate each row
    rows.forEach((row: ImportRow, index: number) => {
      const rowNum = index + 2;
      if (!row.sku) issues.push({ row: rowNum, field: 'sku', message: 'SKU requerido' });
      if (!row.name) issues.push({ row: rowNum, field: 'name', message: 'Nombre requerido' });
      if (row.price === undefined || row.price < 0) issues.push({ row: rowNum, field: 'price', message: 'Precio invalido' });
      if (row.stock === undefined || row.stock < 0) issues.push({ row: rowNum, field: 'stock', message: 'Stock invalido' });

      if (row.sku && row.name && row.price >= 0 && row.stock >= 0) {
        validRows.push(row);
      }
    });

    let imported = 0;
    let updated = 0;

    // Upsert each valid row
    for (const row of validRows) {
      // Find or create category
      let categoryId = null;
      if (row.category) {
        const { data: existingCat } = await supabase
          .from('categories')
          .select('id')
          .eq('tenant_id', tenant_id)
          .eq('name', row.category)
          .single();

        if (existingCat) {
          categoryId = existingCat.id;
        } else {
          const { data: newCat } = await supabase
            .from('categories')
            .insert({ tenant_id, name: row.category, icon: 'pricetag-outline', featured: false })
            .select('id')
            .single();
          categoryId = newCat?.id;
        }
      }

      if (!categoryId) {
        const { data: fallbackCat } = await supabase
          .from('categories')
          .select('id')
          .eq('tenant_id', tenant_id)
          .order('sort_order', { ascending: true })
          .limit(1)
          .single();

        categoryId = fallbackCat?.id;
      }

      if (!categoryId) {
        const { data: newCat } = await supabase
          .from('categories')
          .insert({ tenant_id, name: 'General', icon: 'bag-handle-outline', featured: false })
          .select('id')
          .single();
        categoryId = newCat?.id;
      }

      // Check if product exists by SKU
      const { data: existing } = await supabase
        .from('products')
        .select('id')
        .eq('tenant_id', tenant_id)
        .eq('sku', row.sku)
        .single();

      if (existing) {
        await supabase
          .from('products')
          .update({
            name: row.name,
            price: row.price,
            stock: row.stock,
            unit: row.unit || 'unidad',
            description: row.description || '',
            category_id: categoryId,
          })
          .eq('id', existing.id);
        updated++;
      } else {
        await supabase.from('products').insert({
          tenant_id,
          store_id: targetStoreId,
          sku: row.sku,
          name: row.name,
          price: row.price,
          stock: row.stock,
          unit: row.unit || 'unidad',
          description: row.description || '',
          category_id: categoryId,
          status: 'active',
          image_url: '',
          tags: [],
        });
        imported++;
      }
    }

    // Update import job if provided
    if (import_job_id) {
      await supabase
        .from('import_jobs')
        .update({
          status: 'completed',
          valid_rows: validRows.length,
          issue_count: issues.length,
          rows_imported: imported,
          rows_updated: updated,
          issues: issues,
        })
        .eq('id', import_job_id);
    }

    return new Response(
      JSON.stringify({
        imported,
        updated,
        issues,
        totalValid: validRows.length,
        totalInvalid: issues.length,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
