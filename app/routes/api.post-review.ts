import type { Route } from './+types/api.post-review';
import {
  postReviewToGitHub,
  parsePRUrl,
  deletePreviousReviews,
} from '../data/github-review';

/* ─── Manual "Post Review to GitHub" API ─── */

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      prUrl?: string;
      reviewResult?: any;
      inlineComments?: any[];
    };

    const { prUrl, reviewResult, inlineComments } = body;

    if (!prUrl) {
      return Response.json({ error: 'prUrl is required' }, { status: 400 });
    }

    if (!reviewResult) {
      return Response.json({ error: 'reviewResult is required' }, { status: 400 });
    }

    if (!process.env.GITHUB_TOKEN || process.env.GITHUB_TOKEN === 'your_github_pat_here') {
      return Response.json(
        {
          error:
            'GITHUB_TOKEN is not configured. Add a valid GitHub Personal Access Token to your .env file with pull_requests:write permission.',
        },
        { status: 500 },
      );
    }

    const { owner, repo, pull_number } = parsePRUrl(prUrl);

    // Delete old reviews from this bot first (avoid duplicates)
    await deletePreviousReviews(owner, repo, pull_number);

    // Post the new review
    const { reviewUrl, commentCount } = await postReviewToGitHub(
      prUrl,
      reviewResult,
      inlineComments || [],
    );

    return Response.json({
      success: true,
      reviewUrl,
      commentCount,
      message: `Review posted with ${commentCount} inline comments`,
    });
  } catch (error: any) {
    console.error('Post review error:', error);
    return Response.json(
      { error: error?.message || 'Failed to post review to GitHub' },
      { status: 500 },
    );
  }
}
