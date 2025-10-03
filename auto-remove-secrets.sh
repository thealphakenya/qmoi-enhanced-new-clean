#!/bin/bash
# Auto-remove secrets from all commits in git history
# Usage: bash auto-remove-secrets.sh

set -e
SECRET_PATTERN='ghp_[A-Za-z0-9]{36}'
REPLACEMENT='[REMOVED_GITHUB_TOKEN]'

if ! command -v git-filter-repo &> /dev/null; then
  echo "git-filter-repo is required. Install with: pip install git-filter-repo"
  exit 1
fi

echo "Scanning and removing secrets from all git history..."
git filter-repo --replace-text <(echo "$SECRET_PATTERN==$REPLACEMENT") --force

echo "Secrets removed from all commits. You can now force-push:"
echo "  git push --force"
