import type { BlogPost } from '../../types/blog';

const post: BlogPost = {
  slug: 'desktop-app-for-mom',
  title:
    "My First Real-World App: Building a Desktop Solution for My Mom's Business",
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
};

export default post;
