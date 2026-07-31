#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# Lona — Route Smoke Test (real headless browser)
# Uses the Playwright-downloaded chrome-headless-shell to load
# every public route and verify:
#   • the app rendered (not the freebuff "Loading app preview" shell)
#   • Persian content is present (لونا)
#   • the RootErrorBoundary message is NOT shown
#   • Suspense is not stuck on "در حال بارگذاری"
# Usage:
#   bash scripts/route-smoke-test.sh [BASE_URL]
#   BASE_URL defaults to the live preview; for local dev:
#   bash scripts/route-smoke-test.sh http://localhost:5173
# ─────────────────────────────────────────────────────────────

set -u

BIN=/home/daytona/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell
BASE="${1:-https://fancy-islands-bet.freebuff.dev}"

if [ ! -x "$BIN" ]; then
  echo "❌ chrome-headless-shell not found at: $BIN"
  echo "   Install it first: bunx playwright@latest install chromium --only-shell"
  exit 1
fi

PASS=0
FAIL=0
WARN=0

check() {
  local name="$1" url="$2"
  local out="/tmp/lona_route_$$.html"
  local size

  timeout 60 "$BIN" --headless --no-sandbox --disable-gpu \
    --virtual-time-budget=15000 --dump-dom "$url" 2>/dev/null > "$out"

  size=$(wc -c < "$out" 2>/dev/null || echo 0)

  # ── verdicts ─────────────────────────────────────────────
  if grep -q "Loading app preview" "$out"; then
    echo "⏳ $name — freebuff loader shell (app not served yet)"
    WARN=$((WARN+1))
  elif grep -q "مشکلی پیش آمده است" "$out"; then
    echo "❌ $name — ROOT ERROR BOUNDARY triggered"
    FAIL=$((FAIL+1))
  elif ! grep -q "لونا" "$out"; then
    echo "❌ $name — no 'لونا' content rendered (${size}B)"
    FAIL=$((FAIL+1))
  elif grep -q "در حال بارگذاری" "$out" && [ "$size" -lt 3000 ]; then
    echo "⚠️  $name — stuck Suspense fallback (${size}B)"
    WARN=$((WARN+1))
  else
    echo "✅ $name — OK (${size}B)"
    PASS=$((PASS+1))
  fi
  rm -f "$out"
}

echo "════════════════════════════════════════════════════"
echo "  Lona Route Smoke Test — $BASE"
echo "════════════════════════════════════════════════════"

check "Homepage            /"             "$BASE/"
check "Shop                /shop"         "$BASE/shop"
check "Collections         /collections"  "$BASE/collections"
check "Search              /search"       "$BASE/search"
check "Cart                /cart"         "$BASE/cart"
check "Wishlist            /wishlist"     "$BASE/wishlist"
check "About               /about"        "$BASE/about"
check "FAQ                 /faq"          "$BASE/faq"
check "Terms               /terms"        "$BASE/terms"
check "Shipping            /shipping"     "$BASE/shipping"
check "Returns             /returns"      "$BASE/returns"

# ── dynamic product + collection (resolve a real slug from /shop DOM)
SHOP_OUT=/tmp/lona_shop_$$.html
timeout 60 "$BIN" --headless --no-sandbox --disable-gpu \
  --virtual-time-budget=15000 --dump-dom "$BASE/shop" 2>/dev/null > "$SHOP_OUT"
PRODUCT_URL=$(grep -oE 'href="/shop/[^"]+"' "$SHOP_OUT" | head -1 | sed 's/href="//;s/"$//')
COLL_URL=$(grep -oE 'href="/collections/[^"]+"' "$SHOP_OUT" | head -1 | sed 's/href="//;s/"$//')
rm -f "$SHOP_OUT"

if [ -n "$PRODUCT_URL" ]; then
  check "Product page        $PRODUCT_URL"  "$BASE$PRODUCT_URL"
else
  echo "⚠️  Product page — could not resolve a product link from /shop"
  WARN=$((WARN+1))
fi

if [ -n "$COLL_URL" ]; then
  check "Collection page     $COLL_URL" "$BASE$COLL_URL"
else
  echo "⚠️  Collection page — could not resolve a collection link"
  WARN=$((WARN+1))
fi

# ── auth-gated routes (expect redirect to /auth, not a crash)
check "Checkout (auth)     /checkout"     "$BASE/checkout"
check "Account (auth)      /account"      "$BASE/account"
check "Admin (role gate)   /admin"        "$BASE/admin"

# ── 404 fallback
check "NotFound (404)      /does-not-exist" "$BASE/does-not-exist"

echo "════════════════════════════════════════════════════"
echo "  RESULT:  ✅ $PASS passed | ❌ $FAIL failed | ⚠️ $WARN warn"
echo "════════════════════════════════════════════════════"

[ "$FAIL" -eq 0 ]
