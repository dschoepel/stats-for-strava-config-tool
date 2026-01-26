import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Runner URL - configurable via environment variable
const STATS_CMD_RUNNER_URL = process.env.STATS_CMD_RUNNER_URL || 'http://stats-cmd-runner:8080';

/**
 * POST - Stop a running command by session ID
 * Sends stop signal to the Runner which kills the process in the container
 */
export async function POST(request) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'sessionId is required'
      }, { status: 400 });
    }

    // Forward stop request to the Strava Runner
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    let runnerResponse;
    try {
      runnerResponse = await fetch(`${STATS_CMD_RUNNER_URL}/stop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sessionId }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
    } catch (fetchError) {
      clearTimeout(timeoutId);

      if (fetchError.name === 'AbortError') {
        return NextResponse.json({
          success: false,
          error: 'Stop request timed out'
        }, { status: 504 });
      }

      return NextResponse.json({
        success: false,
        error: `Failed to connect to Strava Runner: ${fetchError.message}`
      }, { status: 503 });
    }

    const data = await runnerResponse.json();
    return NextResponse.json(data, { status: runnerResponse.status });

  } catch (error) {
    console.error('Strava console stop error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
