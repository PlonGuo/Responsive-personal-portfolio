import type { BlogPost } from '../types/blog';

export const blogPosts: BlogPost[] = [
  {
    slug: 'desktop-app-for-mom',
    title: 'My First Real-World App: Building a Desktop Solution for My Mom\'s Business',
    excerpt:
      'How I built an Electron desktop app to help my mom manage her travel agency business, and what I learned about building for real users.',
    date: '2026-01-30',
    tags: ['Electron', 'Desktop', 'SQLite', 'UX', 'Real-World'],
    readTime: 7,
    content: `
# My First Real-World App: Building a Desktop Solution for My Mom's Business

This is the first time I built an app that truly solves a real-world problem for someone I care about. And honestly, it taught me more about software development than any tutorial ever could.

## The Problem

My mom runs a travel agency proxy service, helping clients book and change flight tickets, reserve hotels, and plan trips. For years, she's been manually recording every transaction in Excel spreadsheets - client names, booking details, payments, commissions, everything.

As the business grew and my mom got older, this manual process became increasingly problematic:

- **Time-consuming**: A single month's reconciliation could take up to 30 minutes when there were many transactions
- **Error-prone**: Manual data entry meant easy mistakes - a mistyped number here, a forgotten entry there
- **Stressful**: Monthly settlement with the agency company required accurate calculations, and errors could mean financial discrepancies

She needed a better solution, and I saw an opportunity to help.

## The Solution: A Custom Desktop App

I decided to build a desktop application that would:

1. **Automate transaction filing** - Organize all transactions for each month with clear, consistent formatting
2. **Instant calculations** - Automatically calculate the exact amount to pay the agent company
3. **Simple data entry** - Make adding new records as straightforward as possible
4. **Reliable updates** - Handle app upgrades seamlessly without technical knowledge

### Tech Stack

I chose:

- **Electron** - Cross-platform desktop framework
- **Vite** - Fast build tool and development experience
- **SQLite** - Local database for transaction storage

Since this was a customized solution specifically for my mom's workflow, I didn't deploy it online. It's a completely local application.

## Key Features

### 1. Transaction Management

The app maintains a SQLite database of all transactions:

\`\`\`typescript
interface Transaction {
  id: string;
  date: string;
  clientName: string;
  serviceType: 'flight' | 'hotel' | 'package';
  totalAmount: number;
  commission: number;
  status: 'pending' | 'completed';
  notes?: string;
}
\`\`\`

### 2. Monthly Reports

With a single click, the app generates formatted monthly reports showing:
- All transactions for the period
- Total revenue
- Total commissions
- Amount due to agency company
- Transaction breakdown by service type

What used to take 30 minutes now takes seconds.

### 3. Auto-Update System

This was crucial. I couldn't have my mom dealing with manual updates or complex installation steps. The app checks for updates on startup and installs them automatically:

\`\`\`typescript
// Using electron-updater
autoUpdater.on('update-downloaded', () => {
  // Show user-friendly notification
  // Install on next app restart
});
\`\`\`

She just clicks the installer once, and everything else is handled automatically.

## The Most Important Lesson: Design for Zero Technical Knowledge

Here's the biggest lesson I learned from this project:

**Never assume users know anything about computers or software.**

My mom isn't a developer. She's a travel agent who uses computers as a tool, not a passion. This forced me to rethink everything:

### Simplified Installation
- Single-click installer (no command line, no configuration)
- No additional software dependencies
- Works immediately after installation

### Intuitive Interface
- Large, clear buttons with icons and text
- Minimal options to avoid confusion
- Confirmation dialogs for important actions
- Helpful error messages (not "Error: undefined")

### Forgiving Design
- Auto-save on every change
- Undo capability for mistakes
- Data validation to prevent bad entries
- Regular automatic backups

### Zero Maintenance
- Automatic updates
- No database migrations to run manually
- Self-healing database integrity checks
- Clear feedback when something needs attention

## Real-World Impact

The app has been running for several months now, and the impact is clear:

- **Time saved**: Monthly reconciliation went from ~30 minutes to under 5 minutes
- **Fewer errors**: Automated calculations eliminated arithmetic mistakes
- **Reduced stress**: My mom has confidence in the numbers
- **Better organization**: All historical data is searchable and accessible

But beyond the metrics, I can see the relief in my mom's face when she uses it. That's worth more than any GitHub stars.

## What I'd Do Differently

Looking back, here are things I would improve:

1. **Better error logging** - I should have added analytics to catch errors remotely
2. **Data export** - Adding Excel export would have been helpful for accountants
3. **Cloud backup** - Optional cloud sync for data safety
4. **Multi-user support** - In case she wants to hire someone to help

## Key Takeaways for Building Real-World Apps

### 1. Understand the Actual Problem
Don't assume you know what users need. I spent hours watching my mom work before writing a single line of code.

### 2. Prioritize Reliability Over Features
A simple app that works perfectly beats a feature-rich app that crashes. Stability is everything when someone relies on your software for their livelihood.

### 3. The Installation Experience Matters
If users can't install your app easily, they won't use it. Period. This includes updates.

### 4. Test with Real Users
My mom found UX issues I never would have imagined. Watch real people use your software.

### 5. Maintenance is Part of the Product
Build in logging, error reporting, and update mechanisms from day one. You can't fix what you can't see.

## Conclusion

This project wasn't about cutting-edge technology or impressive algorithms. It was about solving a real problem for a real person. And that made all the difference.

Building software for my mom taught me that the best code isn't the most clever - it's the code that helps someone do their job better, faster, and with less stress.

If you're a developer, I encourage you to build something for someone you know. Ask your parents, friends, or local businesses what frustrates them. Then build a solution.

You'll learn more from one real user than from a thousand tutorial projects.

---

*This desktop app continues to help my mom manage her travel agency business every day. It's not open source, but the lessons from building it inform every project I work on.*
    `.trim(),
  },
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
