#!/bin/sh
# Vitest só nos specs afetados pelos arquivos staged.
# Sem spec afetada, não roda teste nenhum.
# Mapeamento:
#   app/components/X.vue    -> tests/app/components/X.spec.ts
#   app/composables/useX.js -> tests/app/composables/useX.spec.ts
#   app/utils/X.js          -> tests/app/utils/X.spec.ts
#   tests/... staged        -> roda ele mesmo

staged=$(git diff --cached --name-only --diff-filter=ACM)
[ -z "$staged" ] && exit 0

specs=""
for f in $staged; do
  case "$f" in
    tests/app/*.spec.ts|tests/app/**/*.spec.ts)
      specs="$specs $f"
      ;;
    app/components/*.vue)
      base=$(basename "$f" .vue)
      cand="tests/app/components/${base}.spec.ts"
      [ -f "$cand" ] && specs="$specs $cand"
      ;;
    app/composables/*.js)
      base=$(basename "$f" .js)
      cand="tests/app/composables/${base}.spec.ts"
      [ -f "$cand" ] && specs="$specs $cand"
      ;;
    app/utils/*.js)
      base=$(basename "$f" .js)
      cand="tests/app/utils/${base}.spec.ts"
      [ -f "$cand" ] && specs="$specs $cand"
      ;;
  esac
done

# Dedup preservando ordem
specs=$(echo "$specs" | tr ' ' '\n' | awk 'NF && !seen[$0]++' | tr '\n' ' ')

if [ -z "$specs" ]; then
  echo "pre-commit: nenhum spec afetado, pulando vitest"
  exit 0
fi

echo "pre-commit: vitest em:$specs"
pnpm vitest run $specs
