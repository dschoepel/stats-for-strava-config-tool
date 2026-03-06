# Contributing

## Branch naming
| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feature/<short-description>` | `feature/add-gear-devices` |
| Bug fix | `fix/<short-description>` | `fix/login-redirect` |
| Security | `fix/<cve-or-package>` | `fix/dompurify-xss` |
| Maintenance | `chore/<short-description>` | `chore/github-project-setup` |
| Docker/infra | `chore/<short-description>` | `chore/image-optimization` |

## Pull requests
1. Open an issue first for non-trivial changes
2. Branch from `main`, keep PRs focused on one thing
3. Use `Closes #<issue>` in the PR description to auto-close the issue on merge
4. Update `CHANGELOG.md` under the relevant section for the upcoming version
5. Bump versions in `package.json` (root, `runner/`, `helper/`) only when cutting a release

## Releases
Releases are triggered by pushing a version tag:
```bash
git tag v1.x.x
git push origin v1.x.x
```
This kicks off the GitHub Actions workflow that builds and publishes Docker images for all three services (config-tool, runner, helper).

## Development setup
See [README.md](README.md) for installation and local dev instructions.
