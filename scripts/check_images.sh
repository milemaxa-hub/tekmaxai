#!/bin/bash
# Tekmax skripta za proveru slika u člancima
# Koristi: bash scripts/check_images.sh
# Izlaz: ❌ FAIL linije za svaku 404 sliku

set -e

cd "$(dirname "$0")/.."

TOTAL=$(grep -hoE 'photo-[a-z0-9-]+' src/content/vesti/*.mdx src/content/vesti/*.md 2>/dev/null | sort -u | wc -l)
echo "Proveravam $TOTAL unique slika..."

FAIL=0
while IFS= read -r id; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 8 "https://images.unsplash.com/${id}?w=400&q=60")
  if [ "$CODE" != "200" ]; then
    FILE=$(grep -l "$id" src/content/vesti/*.mdx src/content/vesti/*.md 2>/dev/null | head -1 | xargs basename 2>/dev/null)
    echo "❌ $CODE  https://images.unsplash.com/$id"
    echo "    u $FILE"
    FAIL=$((FAIL+1))
  fi
done < <(grep -hoE 'photo-[a-z0-9-]+' src/content/vesti/*.mdx src/content/vesti/*.md 2>/dev/null | sort -u)

echo ""
if [ $FAIL -eq 0 ]; then
  echo "✓ $TOTAL / $TOTAL slika 200 OK"
else
  echo "❌ $FAIL od $TOTAL slika NE RADI"
  exit 1
fi
