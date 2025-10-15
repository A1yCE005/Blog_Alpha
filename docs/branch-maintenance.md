# Branch Maintenance Guide

When multiple stale branches accumulate in the remote repository it becomes
difficult to review new pull requests without running into merge conflicts. Use
the following process to safely retire branches that are no longer needed.

## 1. Audit existing branches

```bash
# Fetch the latest remote references
git fetch --all --prune

# Review remote branches and their last commit dates
git branch -r --sort=-committerdate
```

If a branch is clearly obsolete—merged into `main` or superseded by another
change—make a note of its exact name. In GitHub UI these may appear with the
`codex/` prefix as shown in the screenshot.

## 2. Confirm that the branch is safe to delete

Before deleting anything, double-check that the branch has been merged or its
changes are no longer required:

```bash
git log --oneline main..origin/<branch-name>
```

If the command prints nothing, the branch is already fully merged into `main`.
Otherwise, review the remaining commits to ensure they are either obsolete or
accounted for elsewhere.

## 3. Delete the remote branch

```bash
git push origin --delete <branch-name>
```

Repeat this command for each stale branch you want to remove. GitHub will
automatically close any open pull requests that targeted the deleted branch.

## 4. Clean up local references

Once the remote branch is gone you can prune local tracking references so the
branch list stays tidy:

```bash
# Remove local tracking branches that no longer exist on the remote
git remote prune origin

# Optionally delete any local copies as well
git branch -D <branch-name>
```

Following this checklist keeps the repository lean while preventing accidental
deletions of active work.

## 5. Bring conversation branches up to date with `main`

When a long-lived discussion branch drifts dozens of commits behind `main` it
becomes harder to land new work and resolve conflicts. Use the steps below from
your local clone (with remote access) to sync the branch before opening a pull
request:

```bash
# 1. Make sure you have the latest commits from GitHub
git fetch origin

# 2. Switch to the branch that needs updating
git checkout codex/find-purpose-and-details

# 3. Rebase the branch onto the tip of main
git pull --rebase origin main

# 4. Resolve any conflicts, add the fixes, and continue the rebase
git status          # shows files with conflicts
git add <resolved-file>
git rebase --continue

# 5. Push the rebased branch back to GitHub
git push --force-with-lease
```

If you prefer merge commits instead of rebasing, replace step 3 with
`git merge origin/main` and push normally. The key is to fetch the latest `main`
changes, resolve conflicts locally, and publish the updated history so the
pull request diff reflects only the current work.
