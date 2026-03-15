echo "Sending dist to git"

BASE_DIR="$(cd "$(dirname "$0")" && pwd)"

cd "$BASE_DIR/grocery-frontend" || { echo "Error: grocery-frontend folder not found!"; exit 1; }
npm run build

git add grocery-frontend/dist/ -f
git add -A

git commit -m "Force adding production dist folder and others"

git push