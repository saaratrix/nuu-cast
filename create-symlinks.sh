#!/usr/bin/env bash

set -u

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
NUUCAST_BASE="$SCRIPT_DIR"

if [ $# -ge 1 ]; then
    NUUFETCH_BASE="$(realpath "$1")"
else
    NUUFETCH_BASE="$(realpath "$SCRIPT_DIR/../nuufetch")"
fi

# Each item is: "target prefix|relative path"
LINKS=(
    "nuuwatch-files|nuuwatch|frontend/modules/local"
    "nuuwatch-files|nuuwatch|src/modules/anime/other"
    "||nuufetch"
)

for link in "${LINKS[@]}"; do
    IFS='|' read -r source_prefix target_prefix relative_path <<< "$link"

    target="$NUUCAST_BASE/$target_prefix/$relative_path"
    target=${target//\/\//\/}
    source="$NUUFETCH_BASE/$source_prefix/$relative_path"
    source=${source//\/\//\/}

    if ln -s "$source" "$target" 2>/dev/null; then
        echo "Linked: $target -> $source"
    else
        echo "Failed: ln -s "$source" "$target""
    fi
done
