# How to Create a Pull Request to Merge Your Branch to Main

This guide explains how to create a pull request (PR) to merge your feature branch into `main`.

## Before You Start

Make sure:
- ✅ Your branch is pushed to the remote repository
- ✅ All your changes are committed
- ✅ Your working directory is clean (no uncommitted changes)

You can verify this with:
```bash
git status
git push origin YOUR_BRANCH_NAME
```

## Method 1: Using GitHub Web Interface (Recommended for Beginners)

This is the easiest method and provides a visual interface.

### Steps:

1. **Go to your repository on GitHub:**
   - Open your browser and navigate to: https://github.com/dschoepel/stats-for-strava-config-tool

2. **GitHub should show a prompt:**
   - After pushing your branch, GitHub usually displays a yellow banner at the top of the repository page saying:
     > `YOUR_BRANCH_NAME had recent pushes`
   - Click the green **"Compare & pull request"** button

3. **If you don't see the banner:**
   - Click on the **"Pull requests"** tab
   - Click the green **"New pull request"** button
   - Set the base branch to `main`
   - Set the compare branch to your branch name
   - Click **"Create pull request"**

4. **Fill in the PR details:**
   - **Title:** Write a clear, concise title describing the changes
     - Example: "Initial plan for stats-for-strava config tool"
   - **Description:** Explain what changes you made and why
     - What problem does this solve?
     - What changes were made?
     - Any special notes for reviewers?

5. **Create the pull request:**
   - Review your changes in the "Files changed" tab
   - Click the green **"Create pull request"** button

6. **Wait for review (if applicable):**
   - If you're working alone, you can merge it yourself
   - If working with a team, wait for reviews and approvals

7. **Merge the pull request:**
   - Once approved (or if no review is needed), click **"Merge pull request"**
   - Choose a merge strategy:
     - **Create a merge commit** (default, keeps all history)
     - **Squash and merge** (combines all commits into one)
     - **Rebase and merge** (replays commits on top of main)
   - Click **"Confirm merge"**

8. **Clean up:**
   - After merging, GitHub will offer to delete the branch
   - It's safe to delete your feature branch after merging

## Method 2: Using GitHub CLI (gh)

If you have the GitHub CLI installed, this is the fastest method.

### Steps:

```bash
# Make sure you're on your branch
git checkout YOUR_BRANCH_NAME

# Create the pull request (one-line command)
gh pr create --base main --head YOUR_BRANCH_NAME --title "Your PR Title" --body "Your PR description"

# Or use interactive mode (easier - recommended)
gh pr create --base main

# To view the PR
gh pr view

# To merge the PR (after review/approval)
gh pr merge
```

### Interactive PR Creation:
```bash
gh pr create
```
This will prompt you for:
- Base branch (choose `main`)
- Title
- Body
- Whether to submit now or as a draft

## Method 3: Direct URL

You can also create a PR by visiting a URL in this format:

```
https://github.com/OWNER/REPOSITORY/compare/BASE_BRANCH...YOUR_BRANCH
```

For this repository, replace the placeholders:

```
https://github.com/dschoepel/stats-for-strava-config-tool/compare/main...YOUR_BRANCH_NAME
```

This takes you directly to the "compare and create PR" page.

## Best Practices for Pull Requests

### 1. **Write a Good PR Title**
- Be specific and concise
- Use imperative mood ("Add feature" not "Added feature")
- Examples:
  - ✅ "Add initial project plan and documentation"
  - ✅ "Fix configuration file parsing bug"
  - ❌ "Updates"
  - ❌ "Fixed stuff"

### 2. **Write a Descriptive PR Description**
Include:
- **What:** What changes were made?
- **Why:** Why were these changes necessary?
- **How:** How do the changes work?
- **Testing:** How were the changes tested?
- **Screenshots:** If UI changes, include before/after screenshots

Template:
```markdown
## Description
Brief description of what this PR does.

## Changes
- List of specific changes
- Another change
- Yet another change

## Testing
How to test these changes.

## Related Issues
Closes #123 (if applicable)
```

### 3. **Review Your Own Changes First**
- Before creating the PR, review the "Files changed" tab
- Make sure you're not committing:
  - Temporary files
  - Build artifacts
  - Sensitive data (API keys, passwords)
  - Unrelated changes

### 4. **Keep PRs Small and Focused**
- Each PR should address one specific change or feature
- Smaller PRs are easier to review and merge
- If you have multiple unrelated changes, create separate PRs

### 5. **Respond to Review Comments**
- Address all review comments
- Mark conversations as resolved after fixing
- Explain your reasoning if you disagree with a comment

## Checking PR Status

After creating the PR, you can check its status:

### Using GitHub Web:
- Go to the "Pull requests" tab
- Click on your PR to see status, reviews, and checks

### Using GitHub CLI:
```bash
# List all PRs
gh pr list

# View specific PR details
gh pr view <PR_NUMBER>

# Check status
gh pr status
```

## Troubleshooting

### "No changes between branches"
- Your branch might already be merged or has no differences from main
- Check: `git log main..YOUR_BRANCH_NAME`

### "Merge conflicts"
- Your branch has conflicts with main
- You need to resolve conflicts before merging:
  ```bash
  git checkout YOUR_BRANCH_NAME
  git pull origin main
  # Resolve conflicts in your editor
  git add .
  git commit -m "Resolve merge conflicts"
  git push
  ```

### "Branch protection rules"
- Some repositories require:
  - Reviews before merging
  - Status checks to pass
  - Up-to-date branches
- Contact a repository admin if you can't merge

## After Merging

### Update your local repository:
```bash
# Switch to main
git checkout main

# Pull the latest changes
git pull origin main

# Delete your local branch (optional)
git branch -d YOUR_BRANCH_NAME

# Delete remote branch (if not done through GitHub)
git push origin --delete YOUR_BRANCH_NAME
```

## Additional Resources

- [GitHub Docs: Creating a Pull Request](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request)
- [GitHub Docs: Merging a Pull Request](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/incorporating-changes-from-a-pull-request/merging-a-pull-request)
- [GitHub CLI Docs](https://cli.github.com/manual/gh_pr_create)

## Quick Reference

| Action | GitHub Web | GitHub CLI |
|--------|------------|------------|
| Create PR | Pull requests > New pull request | `gh pr create` |
| View PR | Click on PR in list | `gh pr view [number]` |
| Review changes | Files changed tab | `gh pr diff [number]` |
| Merge PR | Merge pull request button | `gh pr merge [number]` |
| Check status | PR page | `gh pr status` |

---

**Ready to create your PR?** Choose your preferred method above and follow the steps!
