INSERT INTO public.buyer_guides (title, slug, description, category_id, steps, result_product_ids, is_published)
VALUES (
  'Best Free Online Collaboration Tools',
  'best-free-online-collaboration-tools',
  'Compare the top free online collaboration tools for remote teams. Ranked by user reviews, features, and ease of use to help you pick the right platform without paying.',
  'd63908cc-d331-4138-8fdd-f75a437e7d20',
  '[
    {"id":"team","question":"How large is your team?","options":[{"label":"1-10","value":"small"},{"label":"11-50","value":"medium"},{"label":"50+","value":"large"}]},
    {"id":"need","question":"What do you need most?","options":[{"label":"Chat & messaging","value":"chat"},{"label":"Docs & files","value":"docs"},{"label":"Project management","value":"pm"}]},
    {"id":"budget","question":"Will you stay on the free plan long-term?","options":[{"label":"Yes, free only","value":"free"},{"label":"Open to upgrading","value":"paid"}]}
  ]'::jsonb,
  '["8437bda3-2831-456f-815d-16961a50c8e0","e22819c4-0512-40f9-9ead-a0fb46c1bab0","21eb346b-5835-4048-a837-7f705dfc181c","e44dc8bc-f4a6-4c73-9a05-bc2f56d716b7","0a5c3a64-f163-46a3-9390-a04af072e60b"]'::jsonb,
  true
)
ON CONFLICT (slug) DO UPDATE SET is_published=true, description=EXCLUDED.description, steps=EXCLUDED.steps, result_product_ids=EXCLUDED.result_product_ids;