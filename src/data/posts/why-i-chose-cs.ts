import type { BlogPost } from '../../types/blog';

const post: BlogPost = {
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
};

export default post;
