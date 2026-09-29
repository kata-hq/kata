---
name: gh-project
description: Use to add an issue to the kata-dev GitHub project, or to read or set its Status, Priority, or Points.
---

# GitHub project (kata-dev)

Org `kata-hq`. Repo `kata-hq/kata`. Project `kata-dev`, number `1`. The owner is the org: use `--owner kata-hq`.

## Fields

- Status: Backlog, Todo, In Progress, In Review, Done.
- Priority:
  - P0: something is broken now and it blocks work.
  - P1: we need it in this cycle.
  - P2: normal work.
  - P3: nice to have.
- Points: a number. Use 1, 2, 3, 5, or 8.
- Sub-issues progress: read only.
- Sprint: do not use it now.

## Read the fields

Status, Priority, and Points are on the project item, not on the issue. Read them from the item list. The keys are lowercase: `status`, `priority`, `points`.

```sh
gh project item-list 1 --owner kata-hq --limit 1000 --format json \
  --jq '.items[] | select(.content.number==<number>) | {status, priority, points, assignees}'
```

## Set a field

- `gh project item-edit` needs the project node ID, the field ID, and the option ID. Do not guess them. Get them from `gh project view 1 --owner kata-hq --format json` (`.id`) and `gh project field-list 1 --owner kata-hq --format json`.
- `gh project item-add` is safe to run again. It returns the existing item. Use it to get the item ID.

```sh
# Status or Priority
gh project item-edit --project-id <project-id> --id <item-id> \
  --field-id <field-id> --single-select-option-id <option-id>
# Points
gh project item-edit --project-id <project-id> --id <item-id> \
  --field-id <points-field-id> --number <points>
```

## Rules

- Do not set Status to "Done". The project workflow does this when the issue closes.
