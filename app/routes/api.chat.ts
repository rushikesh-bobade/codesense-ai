import type { Route } from './+types/api.chat';
import Groq from 'groq-sdk';

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body = await request.json();
    const { prContext, reviewSummary, messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return Response.json({ error: 'Messages array required' }, { status: 400 });
    }

    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      return Response.json({ error: 'GROQ_API_KEY not configured' }, { status: 500 });
    }

    const groq = new Groq({ apiKey: groqKey });

    const systemPrompt = `You are CodeSense AI, a helpful, expert AI code reviewer.
You just analyzed a GitHub Pull Request and found various issues.
The user is now asking you questions about the code, your review, or how to fix specific problems.

Here is the context of the PR:
Title: ${prContext?.title}
Author: ${prContext?.author}
Repo: ${prContext?.repo}

Here is your overall summary of the PR:
${reviewSummary}

Answer the user's questions clearly, concisely, and accurately. Provide code examples in your answers if they ask how to fix something.`;

    // Construct the message array for Groq
    const groqMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: groqMessages as any,
      temperature: 0.5,
      max_tokens: 1024,
    });

    const reply = completion.choices[0]?.message?.content || "I'm not sure how to respond to that.";

    return Response.json({ reply }, { status: 200 });
  } catch (error: any) {
    console.error('Chat error:', error);
    return Response.json(
      { error: error?.message || 'Chat failed unexpectedly' },
      { status: 500 },
    );
  }
}
