#!/usr/bin/env bash
set -euo pipefail

printf '%s\n' "${0##*/}" >> "$AGENT_CALLS"
plan=.factory/plan.md

if [[ ! -f "$plan" ]]; then
    mkdir -p .factory
    printf '%s\n' '- [ ] alpha' '- [ ] beta' > "$plan"
    printf '%s\n' '{"complete": false}'
else
    task=$(sed -n 's/^- \[ \] //p' "$plan" | head -n 1)
    if [[ -z "$task" ]]; then
        printf '%s\n' '{"complete": true}'
    else
        printf '%s\n' "Work for $task" > "$task.txt"
        sed -i "0,/^- \[ \] $task$/s//- [x] $task/" "$plan"
        printf '{"complete": false, "task": "%s"}\n' "$task"
    fi
fi
