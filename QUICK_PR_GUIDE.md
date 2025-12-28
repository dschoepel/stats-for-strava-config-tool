# Quick Guide: Create Pull Request

## 🎯 You're Ready to Create a PR!

**Current Branch:** `copilot/merge-to-main-via-pr`  
**Target Branch:** `main`  
**Status:** ✅ Pushed and ready

---

## 🚀 Fastest Way: GitHub Web Interface

1. Go to: https://github.com/dschoepel/stats-for-strava-config-tool

2. Look for the yellow banner that says:
   > `copilot/merge-to-main-via-pr had recent pushes`

3. Click the green **"Compare & pull request"** button

4. Fill in:
   - **Title:** Short description of your changes
   - **Description:** Explain what and why

5. Click **"Create pull request"**

6. After review (if needed), click **"Merge pull request"**

7. Done! 🎉

---

## 💻 Alternative: Using GitHub CLI

```bash
# Interactive mode (recommended)
gh pr create

# Or one-line command
gh pr create --base main --title "Your title" --body "Your description"

# View your PR
gh pr view

# Merge when ready
gh pr merge
```

---

## 🔗 Or Use Direct Link

Click this link to go straight to the PR creation page:

**https://github.com/dschoepel/stats-for-strava-config-tool/compare/main...copilot/merge-to-main-via-pr**

---

## 📚 Need More Details?

See the complete guide: [HOW_TO_CREATE_PR.md](./HOW_TO_CREATE_PR.md)

---

## ⚡ After Merging

Update your local repository:

```bash
git checkout main
git pull origin main
git branch -d copilot/merge-to-main-via-pr  # Delete local branch
```

---

**Questions?** Check the full guide or GitHub's documentation!
