
INSERT INTO public.pages (slug, title, body, seo_title, seo_description, is_active, show_in_footer, template)
VALUES (
  'refund-policy',
  'Refund Policy',
  $$
<h2>Overview</h2>
<p>This Refund Policy explains when and how refunds are issued for paid services purchased on our platform, including vendor subscriptions, sponsored placements, featured listings, and other paid features. By purchasing any paid service, you agree to the terms below.</p>

<h2>1. Eligibility for Refunds</h2>
<p>You may be eligible for a refund if:</p>
<ul>
  <li>You request a refund within <strong>14 days</strong> of the original purchase date.</li>
  <li>The paid service was not delivered, or was materially different from what was described.</li>
  <li>A technical issue on our side prevented you from accessing the paid service and we were unable to resolve it within a reasonable time.</li>
  <li>You were charged in error or charged twice for the same service.</li>
</ul>

<h2>2. Non-Refundable Items</h2>
<p>The following are <strong>not eligible</strong> for refunds:</p>
<ul>
  <li>Sponsored placements, ads, or featured slots that have already started running or have accumulated impressions or clicks.</li>
  <li>Subscription periods that have already been partially or fully used.</li>
  <li>One-time services that have already been delivered (e.g. completed product listings, custom content, manual reviews).</li>
  <li>Fees related to third-party services (payment processing, email delivery, AI usage, etc.) that we have already paid on your behalf.</li>
  <li>Purchases older than 14 days from the date of the original transaction.</li>
</ul>

<h2>3. Subscription Cancellations</h2>
<p>You can cancel a recurring subscription at any time from your dashboard. Cancellation stops future renewals but does <strong>not</strong> automatically refund the current billing period. You will retain access to paid features until the end of the period you have already paid for.</p>

<h2>4. How to Request a Refund</h2>
<p>To request a refund, contact our support team with the following information:</p>
<ul>
  <li>The email address associated with your account.</li>
  <li>The transaction ID or invoice number.</li>
  <li>The date of purchase.</li>
  <li>A short description of why you are requesting a refund.</li>
</ul>
<p>Send your request to <strong>support@yourdomain.com</strong>. We aim to respond within 3 business days.</p>

<h2>5. Refund Processing Time</h2>
<p>Approved refunds are issued to the original payment method used for the purchase. Processing times depend on your payment provider and bank, and typically take <strong>5 to 10 business days</strong> to appear on your statement.</p>

<h2>6. Chargebacks</h2>
<p>If you initiate a chargeback or payment dispute without first contacting us, we may suspend or terminate your account while the dispute is investigated. We strongly encourage you to reach out to support first so we can resolve issues quickly and fairly.</p>

<h2>7. Promotional or Discounted Purchases</h2>
<p>Purchases made using promotional codes, discounts, credits, or free trials may be refunded only for the amount actually charged. Free credits, bonuses, and promotional balances are not refundable in cash.</p>

<h2>8. Changes to This Policy</h2>
<p>We may update this Refund Policy from time to time. Material changes will be communicated on this page with an updated revision date. Continued use of paid services after such changes constitutes acceptance of the updated policy.</p>

<h2>9. Contact</h2>
<p>For any questions about this Refund Policy or to submit a refund request, please contact us at <strong>support@yourdomain.com</strong>.</p>
  $$,
  'Refund Policy',
  'Learn when refunds are issued for subscriptions, sponsored placements, and other paid services, and how to request one.',
  true,
  true,
  'default'
)
ON CONFLICT (slug) DO UPDATE
SET title = EXCLUDED.title,
    body = EXCLUDED.body,
    seo_title = EXCLUDED.seo_title,
    seo_description = EXCLUDED.seo_description,
    is_active = true,
    show_in_footer = true,
    updated_at = now();
