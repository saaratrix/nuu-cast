#!/usr/bin/env bash

set -u

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
NUUCAST_BASE="$SCRIPT_DIR"

if [ $# -ge 1 ]; then
    NUUFETCH_BASE="$(realpath "$1")"
else
    NUUFETCH_BASE="$(realpath "$SCRIPT_DIR/../nuufetch")"
fi

NUUFETCH_BASE="$(realpath "$1")"
NUUCAST_BASE="$(realpath "$(dirname "$0")")"

# Each item is: "target prefix|relative path"
LINKS=(
    "nuuwatch-files|frontend/modules/local"
    "nuuwatch-files|src/components"
    "|nuufetch"
)

for link in "${LINKS[@]}"; do
    IFS='|' read -r source_prefix relative_path <<< "$link"

    target="$(realpath -m "$NUUCAST_BASE/$source_prefix/$relative_path")"
    source="$(realpath -m "$NUUFETCH_BASE/$relative_path")"

    if ln -s "$source" "$target" 2>/dev/null; then
        echo "Linked: $target -> $source"
    else
        echo "Skipping: $target"
    fi
done