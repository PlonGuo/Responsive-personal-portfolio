import type { BlogPost } from '../../types/blog';

const post: BlogPost = {
  slug: 'stripe-integration-lessons',
  title: 'Lessons from Stripe Integration',
  excerpt:
    'What I learned implementing payment subscriptions, webhooks, and PCI compliance in a real-world application.',
  date: '2025-12-20',
  tags: ['Stripe', 'Payments', 'Backend', 'Security'],
  readTime: 6,
  content: `
# Lessons from Stripe Integration

Payment integration is one of those things that seems straightforward until you actually do it. Here's what I learned implementing Stripe in a production application.

## The Basics Are Deceptively Simple

Stripe's documentation is excellent, and getting a basic checkout working is easy:

\`\`\`typescript
const session = await stripe.checkout.sessions.create({
  payment_method_types: ['card'],
  line_items: [{ price: priceId, quantity: 1 }],
  mode: 'subscription',
  success_url: \`\${baseUrl}/success\`,
  cancel_url: \`\${baseUrl}/cancel\`,
});
\`\`\`

But production payment systems need much more.

## Webhook Reliability is Critical

The most important lesson: **never trust client-side confirmation alone**. Users can close their browser, lose connection, or manipulate requests. Webhooks are your source of truth.

Key webhook events to handle:

- \`checkout.session.completed\` - Payment successful
- \`customer.subscription.updated\` - Plan changes
- \`customer.subscription.deleted\` - Cancellations
- \`invoice.payment_failed\` - Failed renewals

## Idempotency Matters

Webhooks can be sent multiple times. Always use idempotent handlers:

\`\`\`typescript
async function handleWebhook(event: Stripe.Event) {
  // Check if we've already processed this event
  const processed = await db.events.findUnique({
    where: { stripeEventId: event.id }
  });

  if (processed) return; // Already handled

  // Process the event...

  // Mark as processed
  await db.events.create({
    data: { stripeEventId: event.id }
  });
}
\`\`\`

## Testing is Tricky

Stripe provides test mode, but testing webhooks locally requires:

1. Stripe CLI for forwarding webhooks
2. Test clocks for subscription scenarios
3. Different test card numbers for various scenarios

## PCI Compliance

By using Stripe Elements or Checkout, you avoid handling raw card data. This keeps you in the simplest PCI compliance tier (SAQ A). Never build your own card form unless you absolutely have to.

## Customer Portal Saves Time

Stripe's customer portal lets users manage their own subscriptions:

\`\`\`typescript
const portalSession = await stripe.billingPortal.sessions.create({
  customer: customerId,
  return_url: \`\${baseUrl}/account\`,
});
\`\`\`

This handles plan upgrades, downgrades, payment method updates, and cancellations - all without you building UI.

## Final Thoughts

Payment integration requires more attention to edge cases than most features. Invest time in proper error handling, logging, and monitoring. Your users' money is at stake.

---

*These lessons came from building the payment system for Sportlingo at Next Play Games.*
  `.trim(),
};

export default post;
