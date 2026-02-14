#!/bin/bash
# PropControl Git Push Helper
# Usage: ./push.sh YOUR_GITHUB_TOKEN

if [ -z "$1" ]; then
  echo "❌ Error: GitHub token required"
  echo "Usage: ./push.sh YOUR_GITHUB_TOKEN"
  echo ""
  echo "Get a token from: https://github.com/settings/tokens"
  echo "Required scopes: repo"
  exit 1
fi

TOKEN="$1"
REPO="https://github.com/WaltLuv/Prop-Control-Residential-Real-Estate-Platform.git"

cd /root/clawd/propcontrol

echo "📦 Pushing 2 commits to PropControl repo..."
git push https://WaltLuv:${TOKEN}@github.com/WaltLuv/Prop-Control-Residential-Real-Estate-Platform.git main

if [ $? -eq 0 ]; then
  echo "✅ Push successful!"
  echo ""
  echo "Next steps:"
  echo "1. Check Netlify for auto-deploy"
  echo "2. Or run: netlify login && netlify deploy --prod"
else
  echo "❌ Push failed. Check token permissions."
fi
