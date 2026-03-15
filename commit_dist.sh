echo "Sending dist to git"

npm run build
git add grocery-frontend/dist/ -f


git add -A

git commit -m "Force adding production dist folder and others"

git push