import type { BlogPost } from '../types/blog';

export const blogPosts: BlogPost[] = [
  {
    slug: 'building-sportlingo',
    title: 'Building Sportlingo: A B2B Coaching Platform',
    excerpt:
      'My journey leading the development of a comprehensive coaching dashboard with React, Supabase, and AI features.',
    date: '2026-01-05',
    tags: ['React', 'Supabase', 'AI', 'TypeScript'],
    readTime: 8,
    content: `
# Building Sportlingo: A B2B Coaching Platform

At Next Play Games, I had the opportunity to lead the development of Sportlingo, a comprehensive B2B coaching platform. This was one of the most challenging and rewarding projects I've worked on.

## The Challenge

We needed to build a platform that would help coaches manage their teams, create training content, and leverage AI to enhance their coaching capabilities. The platform needed to handle:

- **Team Management**: Coaches needed to organize players, track progress, and manage schedules
- **Content Creation**: A system for creating and managing educational content
- **AI Integration**: Intelligent features to help coaches with lesson planning and player analysis
- **Payment Processing**: Subscription management with Stripe

## Tech Stack

After careful consideration, we chose:

- **Frontend**: React with TypeScript and Vite for fast development
- **Backend**: Supabase for authentication, database, and edge functions
- **Payments**: Stripe for subscriptions and webhook handling
- **AI**: OpenAI API for intelligent coaching features

## Key Technical Challenges

### 1. Stripe Integration

Implementing Stripe was more complex than expected. We had to handle:

\`\`\`typescript
// Webhook handling for subscription events
async function handleStripeWebhook(event: Stripe.Event) {
  switch (event.type) {
    case 'customer.subscription.created':
      await activateSubscription(event.data.object);
      break;
    case 'customer.subscription.deleted':
      await deactivateSubscription(event.data.object);
      break;
    // ... more cases
  }
}
\`\`\`

### 2. AI-Powered Features

We built an automated fine-tuning pipeline that retrains our GPT-4o mini models based on conversation data:

- Weekly automatic retraining
- Triggered when 50+ new conversation records are collected
- Supabase Edge Functions for the pipeline automation

### 3. Database Migrations

One of the trickiest parts was managing Supabase migrations between development and production environments. We had to carefully plan our schema changes to avoid data loss.

## Lessons Learned

1. **Start with a solid architecture** - Planning the data model upfront saved us countless hours
2. **Stripe webhooks are critical** - Don't rely on client-side confirmation alone
3. **AI features need guardrails** - Always validate and sanitize AI outputs
4. **Test with real data** - Edge cases only appear with real usage patterns

## Results

The platform is now actively used by coaches, helping them save time and improve their training programs. Leading this project taught me invaluable lessons about building production-grade applications.

---

*This project was built during my internship at Next Play Games Inc.*
    `.trim(),
  },
  {
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
  },
  {
    slug: 'why-i-chose-cs',
    title: 'Why I Chose Computer Science',
    excerpt:
      'The ability to create something from nothing with just a computer - that power of creation is what drew me to CS.',
    date: '2025-12-10',
    tags: ['Personal', 'Career', 'Reflection'],
    readTime: 4,
    content: `
# Why I Chose Computer Science

People often ask why I chose to study computer science. The answer is simple but profound: **the power of creation**.

## The Magic of Building

Think about other forms of creation. To build a car, you need factories, materials, and teams of people. To construct a building, you need architects, engineers, and construction crews. To create a ship, you need shipyards and massive resources.

But with programming? All you need is a computer.

With just my laptop, I can create:
- Applications used by thousands of people
- Tools that solve real problems
- Games that bring joy to players
- Systems that automate tedious tasks

This independence is intoxicating. I don't need permission, capital, or teams to create something meaningful. I just need an idea and the skills to execute it.

## From Consumer to Creator

Growing up, I was always fascinated by technology - playing games, using apps, wondering how they worked. The transition from consumer to creator was transformative.

The first time I built something that worked - a simple program that did exactly what I told it to do - I was hooked. It felt like magic, except I was the magician.

## The Endless Frontier

What keeps me excited about CS is that there's always more to learn. New frameworks, new paradigms, new problems to solve. The field moves so fast that yesterday's impossible becomes tomorrow's tutorial project.

## My Goal

My career goal is simple: **to independently develop a product with a significant user base**.

I want to create something that:
- People actually use and find valuable
- Solves a real problem in their lives
- I built with my own hands (and keyboard)

This isn't about fame or fortune. It's about the satisfaction of creation - of bringing something into the world that didn't exist before.

## The Journey Continues

I'm currently pursuing my Master's at Northeastern University, building projects at internships, and constantly learning. Every line of code I write brings me closer to that goal.

If you're considering CS, ask yourself: do you want to create? If the answer is yes, you've found your field.

---

*This is a personal reflection written during my graduate studies.*
    `.trim(),
  },
];

// Helper functions
export function getAllPosts(): BlogPost[] {
  return blogPosts.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}

export function getLatestPosts(count: number = 3): BlogPost[] {
  return getAllPosts().slice(0, count);
}

export function getPostsByTag(tag: string): BlogPost[] {
  return getAllPosts().filter((post) =>
    post.tags.some((t) => t.toLowerCase() === tag.toLowerCase())
  );
}

export function getAllTags(): string[] {
  const tags = new Set<string>();
  blogPosts.forEach((post) => post.tags.forEach((tag) => tags.add(tag)));
  return Array.from(tags).sort();
}
