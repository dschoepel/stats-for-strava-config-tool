import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 1800; // 30 minutes - support long-running Symfony commands

// Runner URL - configurable via environment variable
const STRAVA_RUNNER_URL = process.env.STRAVA_RUNNER_URL || 'http://strava-runner:8080';

/**
 * GET - Health check for the Strava Runner sidecar
 */
export async function GET() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${STRAVA_RUNNER_URL}/health`, {
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({
        success: true,
        status: 'online',
        ...data
      });
    }

    return NextResponse.json({
      success: false,
      status: 'offline',
      error: `Runner returned status ${response.status}`
    }, { status: 503 });

  } catch (error) {
    if (error.name === 'AbortError') {
      return NextResponse.json({
        success: false,
        status: 'timeout',
        error: 'Health check timed out'
      }, { status: 503 });
    }

    return NextResponse.json({
      success: false,
      status: 'offline',
      error: error.message
    }, { status: 503 });
  }
}

/**
 * POST - Execute a command via the Strava Runner sidecar
 * Streams SSE response back to the client
 */
export async function POST(request) {
  try {
    const { command, args = [] } = await request.json();

    if (!command) {
      return NextResponse.json({
        success: false,
        error: 'Command is required'
      }, { status: 400 });
    }

    // Validate args is array
    if (!Array.isArray(args)) {
      return NextResponse.json({
        success: false,
        error: 'Arguments must be an array'
      }, { status: 400 });
    }

    // Validate command format - only allow alphanumeric, hyphens, underscores, colons
    if (!/^[a-zA-Z0-9\-_:]+$/.test(command)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid command format. Only alphanumeric characters, hyphens, underscores, and colons are allowed.'
      }, { status: 400 });
    }

    // Forward request to the Strava Runner
    let runnerResponse;
    try {
      runnerResponse = await fetch(`${STRAVA_RUNNER_URL}/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ command, args })
      });
    } catch (fetchError) {
      return NextResponse.json({
        success: false,
        error: `Failed to connect to Strava Runner: ${fetchError.message}. Make sure the runner is enabled in docker-compose.yml.`
      }, { status: 503 });
    }

    // Check for non-streaming error responses
    const contentType = runnerResponse.headers.get('content-type') || '';
    if (!runnerResponse.ok && contentType.includes('application/json')) {
      const errorData = await runnerResponse.json();
      return NextResponse.json({
        success: false,
        error: errorData.error || 'Runner request failed'
      }, { status: runnerResponse.status });
    }

    // Stream the SSE response back to the client
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const reader = runnerResponse.body.getReader();
        const decoder = new TextDecoder();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            controller.enqueue(encoder.encode(chunk));
          }
        } catch (error) {
          console.error('Stream error:', error);
          // Send error event before closing
          const errorEvent = `data: ${JSON.stringify({ type: 'error', data: error.message })}\n\n`;
          controller.enqueue(encoder.encode(errorEvent));
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no'
      }
    });

  } catch (error) {
    console.error('Strava console error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
