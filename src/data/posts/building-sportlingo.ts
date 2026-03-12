import type { BlogPost } from '../../types/blog';

const post: BlogPost = {
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
};

export default post;
