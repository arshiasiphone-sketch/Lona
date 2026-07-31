#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# Lona — Route Smoke Test (real headless browser)
# Uses the Playwright-downloaded chrome-headless-shell to load
# every public route and verify:
#   • the app rendered (not the freebuff "Loading app preview" shell)
#   • Persian content is present (لونا)
#   • the RootErrorBoundary message is NOT shown
#   • Suspense is not stuck on "در حال بارگذاری"
# Routes run in parallel (up to 4 background jobs) to stay fast.
# Usage:
#   bash scripts/route-smoke-test.sh [BASE_URL]
# ─────────────────────────────────────────────────────────────

set -u

BIN=/home/daytona/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell
BASE="${1:-https://fancy-islands-bet.freebuff.dev}"
WORK=$(mktemp -d)
VERDICTS="$WORK/verdicts.txt"
: > "$VERDICTS"

if [ ! -x "$BIN" ]; then
  echo "❌ chrome-headless-shell not found at: $BIN"
  rm -rf "$WORK"
  exit 1
fi

# ── fast pre-check: is the Vite app actually being served? ──
APP_CHECK=$(curl -s --max-time 10 -o /dev/null -w '%{http_code}' "$BASE/src/main.tsx")
if [ "$APP_CHECK" != "200" ]; then
  echo "⚠️  App modules not served yet: /src/main.tsx → HTTP $APP_CHECK"
  echo "   (Freebuff sandbox still booting — results below may be loader shells)"
fi

echo "════════════════════════════════════════════════════"
echo "  Lona Route Smoke Test — $BASE"
echo "════════════════════════════════════════════════════"

run_route() {
  local path="$1" label="$2" idx="$3" out="$WORK/route_$idx.html"
  local size verdict
  timeout 45 "$BIN" --headless --no-sandbox --disable-gpu \
    --virtual-time-budget=15000 --dump-dom "$BASE$path" 2>/dev/null > "$out"
  size=$(wc -c < "$out" 2>/dev/null || echo 0)

  if grep -q "Loading app preview" "$out"; then
    verdict="⏳ loader-shell"
  elif grep -q "مشکلی پیش آمده است" "$out"; then
    verdict="❌ ERROR-BOUNDARY"
  elif ! grep -q "لونا" "$out"; then
    verdict="❌ no-Persian-content"
  elif grep -q "در حال بارگذاری" "$out" && [ "$size" -lt 3000 ]; then
    verdict="⚠️ stuck-suspense"
  else
    verdict="✅ OK"
  fi
  printf '%-32s %s [%sB]\n' "$label" "$verdict" "$size" | tee -a "$VERDICTS"
}

# ── static routes ───────────────────────────────────────────
ROUTES=(
  "/|Homepage /"
  "/shop|Shop /shop"
  "/collections|Collections /collections"
  "/search|Search /search"
  "/cart|Cart /cart"
  "/wishlist|Wishlist /wishlist"
  "/about|About /about"
  "/faq|FAQ /faq"
  "/terms|Terms /terms"
  "/shipping|Shipping /shipping"
  "/returns|Returns /returns"
  "/checkout|Checkout (auth)"
  "/account|Account (auth)"
  "/admin|Admin (role gate)"
  "/does-not-exist|NotFound 404"
)

idx=0
pids=()
for entry in "${ROUTES[@]}"; do
  idx=$((idx+1))
  path="${entry%%|*}"
  label="${entry#*|}"
  run_route "$path" "$label" "$idx" &
  pids+=("$!")
  # keep at most 4 concurrent
  if [ "${#pids[@]}" -ge 4 ]; then
    wait "${pids[0]}"
    pids=("${pids[@]:1}")
  fi
done
for p in "${pids[@]}"; do wait "$p"; done

# ── dynamic product + collection resolved from /shop DOM ────
timeout 45 "$BIN" --headless --no-sandbox --disable-gpu \
  --virtual-time-budget=15000 --dump-dom "$BASE/shop" 2>/dev/null > "$WORK/shop_dom.html"
if [ -s "$WORK/shop_dom.html" ] && ! grep -q "Loading app preview" "$WORK/shop_dom.html"; then
  PRODUCT_URL=$(grep -oE 'href="/shop/[^"]+"' "$WORK/shop_dom.html" | head -1 | sed 's/href="//;s/"$//')
  COLL_URL=$(grep -oE 'href="/collections/[^"]+"' "$WORK/shop_dom.html" | head -1 | sed 's/href="//;s/"$//')
  if [ -n "$PRODUCT_URL" ]; then
    run_route "$PRODUCT_URL" "Product: $PRODUCT_URL" 99
  else
    echo "⚠️  Product page — no product link in /shop" | tee -a "$VERDICTS"
  fi
  if [ -n "$COLL_URL" ]; then
    run_route "$COLL_URL" "Collection: $COLL_URL" 98
  else
    echo "⚠️  Collection page — no collection link" | tee -a "$VERDICTS"
  fi
else
  echo "⚠️  Product/Collection — /shop not rendered" | tee -a "$VERDICTS"
fi

# ── summary accounting from actual verdict lines ───────────
PASS=$(grep -c '✅' "$VERDICTS" || true)
FAIL=$(grep -c '❌' "$VERDICTS" || true)
WARN=$(grep -cE '⚠️|⏳' "$VERDICTS" || true)

echo "════════════════════════════════════════════════════"
echo "  RESULT:  ✅ $PASS passed | ❌ $FAIL failed | ⚠️ $WARN warn"
echo "════════════════════════════════════════════════════"
rm -rf "$WORK"
[ "$FAIL" -eq 0 ]
