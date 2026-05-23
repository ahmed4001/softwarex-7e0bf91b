import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { title = '', metaDescription = '', focusKeyword = '', body = '', slug = '' } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const plain = String(body).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 4000);
    const kw = String(focusKeyword).trim();

    const system = `You are an SEO copywriter. Generate ONE optimized SEO title and ONE meta description.
RULES (strict):
- Title: 50-60 chars, MUST start with or include the focus keyword, no clickbait, no ALL CAPS, no quotes.
- Meta description: 140-160 chars, MUST include the focus keyword once naturally, end with a benefit or CTA, no quotes.
- Match the content's intent. Keep punctuation minimal.`;

    const user = `Focus keyword: ${kw || '(none — infer from content)'}
Current title: ${title}
Current meta: ${metaDescription}
Slug: ${slug}
Content excerpt:\n${plain}`;

    const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'emit_seo',
            description: 'Return optimized SEO title and meta description.',
            parameters: {
              type: 'object',
              properties: {
                title: { type: 'string', description: '50-60 chars, includes focus keyword.' },
                meta_description: { type: 'string', description: '140-160 chars, includes focus keyword.' },
              },
              required: ['title', 'meta_description'],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: 'function', function: { name: 'emit_seo' } },
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429) return new Response(JSON.stringify({ error: 'Rate limit. Try again shortly.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      if (resp.status === 402) return new Response(JSON.stringify({ error: 'AI credits exhausted. Add credits in Settings > Workspace > Usage.' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      const t = await resp.text();
      console.error('gateway error', resp.status, t);
      return new Response(JSON.stringify({ error: 'AI gateway error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const data = await resp.json();
    const call = data.choices?.[0]?.message?.tool_calls?.[0];
    const args = call ? JSON.parse(call.function.arguments) : {};
    return new Response(JSON.stringify({ title: args.title || '', meta_description: args.meta_description || '' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('seo-suggest', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
