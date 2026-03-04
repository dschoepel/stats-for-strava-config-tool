import { NextResponse } from 'next/server';
import packageJson from '../../../../package.json';

const GITHUB_RELEASES_URL =
  'https://api.github.com/repos/dschoepel/stats-for-strava-config-tool/releases/latest';

function compareSemver(a, b) {
  const parse = (v) => v.replace(/^v/, '').split('.').map(Number);
  const [aMaj, aMin, aPat] = parse(a);
  const [bMaj, bMin, bPat] = parse(b);
  if (aMaj !== bMaj) return aMaj - bMaj;
  if (aMin !== bMin) return aMin - bMin;
  return aPat - bPat;
}

export async function GET() {
  const currentVersion = packageJson.version;

  try {
    const res = await fetch(GITHUB_RELEASES_URL, {
      headers: { Accept: 'application/vnd.github+json' },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json({ isUpdateAvailable: false, error: true });
    }

    const data = await res.json();
    const latestVersion = (data.tag_name || '').replace(/^v/, '');
    const releaseUrl = data.html_url || '';
    const publishedAt = data.published_at || null;
    const isUpdateAvailable = compareSemver(latestVersion, currentVersion) > 0;

    return NextResponse.json({
      currentVersion,
      latestVersion,
      releaseUrl,
      publishedAt,
      isUpdateAvailable,
    });
  } catch {
    return NextResponse.json({ isUpdateAvailable: false, error: true });
  }
}
