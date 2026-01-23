import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const STRAVA_RUNNER_URL = process.env.STRAVA_RUNNER_URL || 'http://strava-runner:8080';

/**
 * GET - Discover available Symfony commands from the target container
 * Proxies to the runner's /discover endpoint
 */
export async function GET() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 40000);

    const response = await fetch(`${STRAVA_RUNNER_URL}/discover`, {
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    if (error.name === 'AbortError') {
      return NextResponse.json({
        success: false,
        error: 'Discovery request timed out'
      }, { status: 504 });
    }

    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 503 });
  }
}
