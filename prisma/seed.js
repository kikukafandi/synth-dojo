// Synth-Dojo Database Seeder
// Seeds initial data: admin user, sample modules, questions, achievements

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {

  console.log('🗑️ Resetting database (truncate all tables)...');

  await prisma.$executeRawUnsafe(`
    DO $$ DECLARE
        r RECORD;
    BEGIN
        FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = current_schema()) LOOP
            EXECUTE 'TRUNCATE TABLE "' || r.tablename || '" RESTART IDENTITY CASCADE;';
        END LOOP;
    END $$;
  `);

  console.log('🧼 All tables cleared (IDs reset).');

  console.log('🌱 Starting database seed...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@synthdojo.com' },
    update: {},
    create: {
      email: 'admin@synthdojo.com',
      name: 'Admin User',
      hashedPassword,
      role: 'admin',
      points: 1000,
      level: 10,
      hp: 5,
      profile: {
        create: {
          bio: 'System Administrator',
        }
      }
    },
  });
  console.log('✅ Admin user created:', adminUser.email);

  // Create sample user
  const userPassword = await bcrypt.hash('user123', 10);
  const sampleUser = await prisma.user.upsert({
    where: { email: 'user@synthdojo.com' },
    update: {},
    create: {
      email: 'user@synthdojo.com',
      name: 'Sample User',
      hashedPassword: userPassword,
      role: 'user',
      points: 100,
      level: 2,
      hp: 5,
      profile: {
        create: {
          bio: 'Learning to code!',
        }
      }
    },
  });
  console.log('✅ Sample user created:', sampleUser.email);

  // Create learning modules
  const jsBasicsModule = await prisma.module.create({
    data: {
      title: 'JavaScript Basics',
      description: 'Learn the fundamentals of JavaScript programming',
      order: 1,
      difficulty: 1,
      isPublished: true,
      lessons: {
        create: [
          {
            title: 'Variables and Data Types',
            content: '# Variables in JavaScript\n\nJavaScript has three ways to declare variables:\n- `let` - block-scoped, can be reassigned\n- `const` - block-scoped, cannot be reassigned\n- `var` - function-scoped (legacy)\n\nExample:\n```javascript\nlet name = "John";\nconst age = 25;\n```',
            codeExample: 'let message = "Hello World";\nconsole.log(message);',
            order: 1,
            isPublished: true,
          },
          {
            title: 'Functions',
            content: '# Functions in JavaScript\n\nFunctions are reusable blocks of code.\n\nExample:\n```javascript\nfunction greet(name) {\n  return `Hello, ${name}!`;\n}\n```',
            codeExample: 'function add(a, b) {\n  return a + b;\n}\nconsole.log(add(2, 3));',
            order: 2,
            isPublished: true,
          }
        ]
      }
    }
  });
  console.log('✅ JavaScript Basics module created');

  const algoModule = await prisma.module.create({
    data: {
      title: 'Algorithms & Problem Solving',
      description: 'Master common algorithms and data structures',
      order: 2,
      difficulty: 2,
      isPublished: true,
      lessons: {
        create: [
          {
            title: 'Arrays and Loops',
            content: '# Working with Arrays\n\nArrays store multiple values in a single variable.\n\nCommon operations:\n- Access: `arr[0]`\n- Add: `arr.push(item)`\n- Remove: `arr.pop()`\n- Loop: `for`, `forEach`, `map`',
            codeExample: 'const numbers = [1, 2, 3, 4, 5];\nfor (let num of numbers) {\n  console.log(num);\n}',
            order: 1,
            isPublished: true,
          }
        ]
      }
    }
  });
  console.log('✅ Algorithms module created');

  const htmlModule = await prisma.module.create({
    data: {
      title: "HTML Fundamentals",
      description: "Learn the basic structure, tags, semantics, and core building blocks of the web.",
      order: 3,
      difficulty: 1,
      isPublished: true,
      lessons: {
        create: [
          {
            title: "Introduction to HTML",
            content: `
# Introduction to HTML

HTML (HyperText Markup Language) is the standard markup language used to build web pages.  
HTML consists of **elements** represented by tags.

## Basic Structure
\`\`\`html
<!DOCTYPE html>
<html>
  <head>
    <title>My First Page</title>
  </head>
  <body>
    <h1>Hello World!</h1>
  </body>
</html>
\`\`\`
          `,
            codeExample: `<h1>Hello World</h1>`,
            order: 1,
            isPublished: true,
          },
          {
            title: "Common HTML Tags",
            content: `
# Common HTML Tags

You will use these tags every day:

- Headings: \`<h1> - <h6>\`
- Paragraph: \`<p>\`
- Links: \`<a>\`
- Images: \`<img>\`
- Lists: \`<ul>\`, \`<ol>\`, \`<li>\`

## Example
\`\`\`html
<h1>Title</h1>
<p>This is a paragraph.</p>
<a href="https://example.com">Visit</a>
\`\`\`
          `,
            codeExample: `<a href="#">Click me</a>`,
            order: 2,
            isPublished: true,
          },
          {
            title: "Forms and Inputs",
            content: `
# Forms and Inputs

Forms allow users to input data.

## Example
\`\`\`html
<form>
  <label>Name:</label>
  <input type="text" />
  <button type="submit">Submit</button>
</form>
\`\`\`
          `,
            codeExample: `<input type="text" placeholder="Your name" />`,
            order: 3,
            isPublished: true,
          },
          {
            title: "Semantic HTML",
            content: `
# Semantic HTML

Semantic elements describe meaning:

- \`<header>\`
- \`<nav>\`
- \`<section>\`
- \`<article>\`
- \`<footer>\`

## Example
\`\`\`html
<article>
  <h2>Blog Title</h2>
  <p>Post content...</p>
</article>
\`\`\`
          `,
            codeExample: `<section><h2>Section Title</h2></section>`,
            order: 4,
            isPublished: true,
          },
          {
            title: "Multimedia Elements",
            content: `
# Multimedia in HTML

Images, audio, and video can be embedded.

## Example
\`\`\`html
<img src="image.jpg" alt="Picture" />
<video controls src="video.mp4"></video>
\`\`\`
          `,
            codeExample: `<img src="/demo.png" alt="Demo" />`,
            order: 5,
            isPublished: true,
          }
        ]
      }
    }
  });

  console.log("✅ HTML Fundamentals module created");

  const cssModule = await prisma.module.create({
    data: {
      title: "CSS Fundamentals",
      description: "Master styling, layout, box model, flexbox, and responsive design.",
      order: 4,
      difficulty: 2,
      isPublished: true,
      lessons: {
        create: [
          {
            title: "Intro to CSS",
            content: `
# What is CSS?

CSS is used to style HTML elements.

## Example
\`\`\`css
body {
  background: #f5f5f5;
}
\`\`\`
          `,
            codeExample: `body { color: black; }`,
            order: 1,
            isPublished: true,
          },
          {
            title: "Selectors & Properties",
            content: `
# CSS Selectors

Common selectors:
- Element: \`div\`
- Class: \`.container\`
- ID: \`#title\`

## Example
\`\`\`css
.container {
  padding: 20px;
}
\`\`\`
          `,
            codeExample: `.box { border: 1px solid black; }`,
            order: 2,
            isPublished: true,
          },
          {
            title: "Box Model",
            content: `
# CSS Box Model

Every element has:
- margin
- border
- padding
- content

## Example  
\`\`\`css
.box {
  padding: 10px;
  margin: 20px;
}
\`\`\`
          `,
            codeExample: `.card { padding: 20px; }`,
            order: 3,
            isPublished: true,
          },
          {
            title: "Flexbox",
            content: `
# Flexbox Layout

A powerful layout system.

## Example
\`\`\`css
.container {
  display: flex;
  justify-content: center;
  align-items: center;
}
\`\`\`
          `,
            codeExample: `display: flex;`,
            order: 4,
            isPublished: true,
          },
          {
            title: "Responsive Design",
            content: `
# Responsive Design

Use media queries to adapt layout.

## Example
\`\`\`css
@media (max-width: 600px) {
  .container {
    flex-direction: column;
  }
}
\`\`\`
          `,
            codeExample: `@media (max-width: 600px) { body { font-size: 14px } }`,
            order: 5,
            isPublished: true,
          }
        ]
      }
    }
  });

  console.log("✅ CSS Fundamentals module created");

  // Create sample questions
  const lessons = await prisma.lesson.findMany();

  const questions = [
    {
      lessonId: lessons[0]?.id,
      title: 'Sum Two Numbers',
      prompt: 'Write a function that takes two numbers and returns their sum.',
      starterCode: 'function sum(a, b) {\n  // Your code here\n}',
      testCases: JSON.stringify([
        { input: [2, 3], expected: 5 },
        { input: [10, 20], expected: 30 },
        { input: [-5, 5], expected: 0 }
      ]),
      difficulty: 1,
      points: 10,
      timeLimit: 300,
      isPublished: true,
    },
    {
      lessonId: lessons[0]?.id,
      title: 'Reverse String',
      prompt: 'Write a function that reverses a given string.',
      starterCode: 'function reverseString(str) {\n  // Your code here\n}',
      testCases: JSON.stringify([
        { input: ['hello'], expected: 'olleh' },
        { input: ['world'], expected: 'dlrow' },
        { input: [''], expected: '' }
      ]),
      difficulty: 1,
      points: 15,
      timeLimit: 300,
      isPublished: true,
    },
    {
      lessonId: lessons[2]?.id,
      title: 'Find Maximum',
      prompt: 'Write a function that finds the maximum number in an array.',
      starterCode: 'function findMax(arr) {\n  // Your code here\n}',
      testCases: JSON.stringify([
        { input: [[1, 5, 3, 9, 2]], expected: 9 },
        { input: [[-1, -5, -3]], expected: -1 },
        { input: [[42]], expected: 42 }
      ]),
      difficulty: 2,
      points: 20,
      timeLimit: 300,
      isPublished: true,
    },
    {
      lessonId: lessons[2]?.id,
      title: 'FizzBuzz',
      prompt: 'Write a function that returns an array of numbers from 1 to n, but for multiples of 3 return "Fizz", for multiples of 5 return "Buzz", and for multiples of both return "FizzBuzz".',
      starterCode: 'function fizzBuzz(n) {\n  // Your code here\n}',
      testCases: JSON.stringify([
        { input: [15], expected: [1, 2, 'Fizz', 4, 'Buzz', 'Fizz', 7, 8, 'Fizz', 'Buzz', 11, 'Fizz', 13, 14, 'FizzBuzz'] },
        { input: [5], expected: [1, 2, 'Fizz', 4, 'Buzz'] }
      ]),
      difficulty: 2,
      points: 25,
      timeLimit: 300,
      isPublished: true,
    }
  ];

  for (const q of questions) {
    await prisma.question.create({
      data: {
        ...q,
        hints: {
          create: [
            {
              content: 'Think about the problem step by step.',
              order: 1,
              pointCost: 5,
            },
            {
              content: 'Consider using built-in JavaScript methods.',
              order: 2,
              pointCost: 10,
            }
          ]
        }
      }
    });
  }
  console.log('✅ Sample questions created');

  // Create achievements
  const achievements = [
    {
      name: 'First Steps',
      description: 'Complete your first lesson',
      icon: '🎯',
      points: 10,
      criteria: 'complete_lesson_1',
    },
    {
      name: 'Code Warrior',
      description: 'Win your first AI battle',
      icon: '⚔️',
      points: 50,
      criteria: 'win_ai_battle_1',
    },
    {
      name: 'PvP Champion',
      description: 'Win 10 PvP matches',
      icon: '🏆',
      points: 200,
      criteria: 'win_pvp_10',
    },
    {
      name: 'Quick Learner',
      description: 'Complete a lesson in under 5 minutes',
      icon: '⚡',
      points: 25,
      criteria: 'quick_lesson',
    },
    {
      name: 'Streak Master',
      description: 'Maintain a 7-day streak',
      icon: '🔥',
      points: 100,
      criteria: 'streak_7',
    }
  ];

  for (const achievement of achievements) {
    await prisma.achievement.create({ data: achievement });
  }
  console.log('✅ Achievements created');

  // Initialize leaderboard entries
  await prisma.leaderboardEntry.create({
    data: {
      userId: adminUser.id,
      rank: 1,
      points: adminUser.points,
      level: adminUser.level,
      wins: 10,
      losses: 2,
    }
  });

  await prisma.leaderboardEntry.create({
    data: {
      userId: sampleUser.id,
      rank: 2,
      points: sampleUser.points,
      level: sampleUser.level,
      wins: 2,
      losses: 1,
    }
  });
  console.log('✅ Leaderboard initialized');

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
