import type { Route } from './+types/api.post-review';
import { getSession } from '../data/session.server';
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
    const session = await getSession(request);
    const githubToken = session.get('githubToken');

    if (!githubToken) {
      return Response.json(
        { error: 'You must log in with GitHub to post a review.' },
        { status: 401 }
      );
    }

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

    const { owner, repo, pull_number } = parsePRUrl(prUrl);

    // Delete old reviews from this bot first (avoid duplicates)
    await deletePreviousReviews(owner, repo, pull_number, githubToken);

    // Post the new review
    const { reviewUrl, commentCount } = await postReviewToGitHub(
      prUrl,
      reviewResult,
      inlineComments || [],
      githubToken
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
