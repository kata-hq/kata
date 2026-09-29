---
name: gh-epics
description: Use when work is too large for one issue, to propose or create an epic, to find an epic, or to add, list, or remove the sub-issues of an epic in kata-hq/kata.
---

# Epics

## What an epic is

An epic is one result that a user can see. It is too large for one PR.
Example: "Users can log in". Not an example: "Refactor the auth module".

An epic is an issue with type `Epic`. Its tasks are sub-issues.

## When to create an epic

- Create an epic when the work is more than 8 points or needs more than one PR.
- You must get approval from the user before you create an epic. Give the title, the description, and the planned sub-issues to the user. Wait for "yes".
- If you cannot ask the user, stop. Put the proposal in your report. Do not create the epic. Do not create its sub-issues without a parent.

## Epic title and code

- Title: `[<CODE>-00] <Epic name>`. Example: `[EX-00] Random pages`.
- `<CODE>` is 2 to 4 capital letters. It must be unique. Before you select a code, list all epics (open and closed).
- The sub-issues of the epic use the same code: `<CODE>-01`, `<CODE>-02`. See `agile-workflow` for issue titles.

## Epic description

```md
## Goal
<Why we do this. What changes for the user.>

## Scope
- In: <what is included>
- Out: <what is not included>

## Done when
- <Result that we can check>
```

Do not list the tasks in the description. The sub-issues are the task list.

## Epic fields and Status

- Set Priority. Do not set Points on an epic.
- When you create the epic, set Status to "Todo".
- When the first sub-issue goes to "In Progress", set the epic to "In Progress".
- When all sub-issues are closed, close the epic.

## API rules

Use the REST API (`gh api`). All paths start with `repos/kata-hq/kata/issues/`.

- Find open epics: search open issues for `type:Epic`.
- Set a type: send `-f type=<type>` when you create (POST) or edit (PATCH) the issue.
- Sub-issues: `<epic-number>/sub_issues`. To add one, POST `-F sub_issue_id=<issue-id>`. To remove one, DELETE `<epic-number>/sub_issue` with the same field.
- Dependencies: `<number>/dependencies/blocked_by`. To read them, GET the path. To add one, POST `-F issue_id=<blocking-issue-id>`. An issue is blocked if one of its `blocked_by` issues is open.
- Sub-issue lists have pages. Use `--paginate`.
- The issue ID is the REST `.id` (a number). It is not the issue number and not the GraphQL `node_id`. Use `-F` to send it as a number.
- An issue can have only one parent. To move it, remove it from the old epic first.
