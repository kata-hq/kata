---
name: agile-workflow
description: Use for all work on kata-hq/kata. Use it to create an issue, to record a new idea, to pick up an issue, to name a branch, to validate work, to open a PR, or to review a PR.
---

# Agile workflow

Use `gh-project` to read and set project fields. Use `gh-epics` for epics, sub-issues, and dependencies.

## 1. Create an issue

Before you create an issue, search the open issues for a duplicate.

One issue is one PR. It has 8 points or fewer. If it is larger, split it or propose an epic.

Title: `<CODE>-<NN>/<short-name>`. Example: `EX-01/create-random-page`.

- `<CODE>` is the code of the parent epic (see `gh-epics`).
- `<NN>` is the next number in the epic, with two digits. Find the highest number in the titles of all sub-issues of the epic (open and closed), and add 1. Do not use a number again.
- `<short-name>` is lowercase words with hyphens.
- Every issue has a parent epic. If no epic fits, propose one.

Types:

- Feature: a change that a user can see.
- Task: internal work (refactor, tooling, docs, tests).
- Bug: something that does not work correctly.

Description:

```md
## Context
<Why we need this.>

## What to do
<The change, in short.>

## Acceptance criteria
- [ ] <Result that we can check>

## Scenarios
Scenario: <name>
  Given <start state>
  When <action>
  Then <result>

## Out of scope
- <What this issue does not change>
```

- For a bug, write "Steps to reproduce", "Expected", and "Actual" in place of "What to do".
- Features and Bugs must have scenarios. A Task must have acceptance criteria. Scenarios are optional for a Task.

Scenario rules:

- Use `Given`, `When`, `Then`, `And`, `But`.
- Write one behavior in each scenario. If you need "or", write two scenarios.

After you create the issue:

1. Add it to the correct epic as a sub-issue. If no epic fits, propose one (see `gh-epics`).
2. Add it to the project. Set Priority and Points.
3. If it has a type, Priority, Points, acceptance criteria, and scenarios (when required), set Status to "Todo". If not, set Status to "Backlog".
4. If the issue cannot start before another issue closes, add a `blocked_by` dependency.

## 2. Record a new idea

An idea is an issue that is not ready to start.

1. Search the open issues for a duplicate.
2. Create an issue with a type and a title as in section 1. The body has only a "Context" section.
3. Add it to its epic. If no epic fits, propose one. Do not create the idea until the epic exists.
4. Add it to the project. Set Priority. Do not set Points. Set Status to "Backlog".
5. Do not start work on it.

Before an idea goes to "Todo", write the full description and set Points.

## 3. Pick up an issue

All agents use the same GitHub account. An assignee does not tell you which agent has an issue. Other agents can pick up issues at the same time as you.

1. Find the epic: `gh issue list --repo kata-hq/kata --state open --search 'type:Epic' --json number,title`. The title starts with `[<CODE>-00]`. List its sub-issues. Ignore closed sub-issues.
2. Read Status, Priority, and assignees from the project item list. An issue with no assignee shows `assignees: null`.
3. Select an issue with Status "Todo" and no assignee.
4. Do not select an issue that is blocked. Read its dependencies: `gh api repos/kata-hq/kata/issues/<number>/dependencies/blocked_by --jq '.[] | {number, state}'`. If one of them is open, the issue is blocked.
5. Select the highest Priority first (P0). If two issues have the same Priority, select the lower issue number.
6. Claim the issue. Create its branch on GitHub from the latest `main` (see section 4 for the name). Run two commands:

   ```sh
   gh api repos/kata-hq/kata/git/ref/heads/main --jq .object.sha
   gh api repos/kata-hq/kata/git/refs -X POST -f ref=refs/heads/<branch> -f sha=<sha>
   ```

   - If the second command succeeds, the issue is yours.
   - If it fails with "Reference already exists", another agent has the issue. Do not change the issue. Go back to step 3 and select the next issue.
   - If the existing branch has no commits after `main`, there is no PR for it, and the issue is still "Todo" with no assignee, the claim can be abandoned. Do not take the issue. Tell the user the branch name in your report.
7. Assign the issue to yourself: `gh issue edit <number> --repo kata-hq/kata --add-assignee @me`. Set Status to "In Progress". If the epic is "Todo", set the epic to "In Progress".
8. Run `git fetch origin`. Check out the branch: `git switch <branch>`.

If no issue agrees with steps 3 to 5, stop. Do not change anything. Tell the user why no issue is available.

## 4. Branch and commits

Branch name: `<type>/<issue title>`. Example: issue `EX-01/create-random-page` gives branch `feature/EX-01/create-random-page`.

| Issue type | Branch type |
|---|---|
| Feature | `feature` |
| Bug | `bugfix` |
| Task | `task` |

Commit message: `<type>(<scope>): <description>`. Example: `feat(web): create random page`.

- Write one line only. Do not write a body. Do not add `Co-Authored-By` or other trailers.
- `<type>` is a conventional commit type: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`.
- `<scope>` is the top-level folder of the change. If the change is in many folders or at the repo root, use `kata`.
- `<description>` is lowercase and in the imperative ("add", not "added").

Push with `git push -u origin <branch>`.

## 5. Validate the work

The work is done only when all acceptance criteria and all scenarios pass.

- Validate each item yourself. Run the tests, or use Chrome to test the app.
- Change a scenario into an automated test when the repo has a test setup for it. If there is no test setup, say so in the PR. Do not add a test setup that is out of the scope of the issue.
- If the issue creates the test setup, that test setup is the automated test. Do the scenarios that it cannot run by hand, and write the steps in the PR.
- Do not send repo files to external services (for example, online validators). Use local tools only.
- Chrome cannot open `file://` URLs. Serve local files on `127.0.0.1`. Stop the server when you are done.
- If you find new work, record it as a new idea (section 2). Do not add it to this issue.

## 6. Open the PR

- The PR title uses the commit message format. It becomes the squash commit on `main`.
- The PR body contains:
  - `Closes #<number>`
  - Each acceptance criterion and scenario, with how you validated it (test name, or the Chrome steps).
- Set Status to "In Review".
- Do not merge. The user gives the final approval and does the squash merge.

## 7. Review a PR

An agent can review a PR before the user does.

1. Read the linked issue.
2. Get the PR code: `gh pr checkout <number> --detach`. Another worktree can own the PR branch, so do not check out the branch itself.
3. Validate each acceptance criterion and scenario yourself. Do not trust the PR body. Run the tests, or use Chrome.
4. Read the diff. Look for bugs and for changes that are out of scope.
5. Check the conventions: branch name, commit message, PR title, and `Closes #<number>` (sections 4 and 6).
6. Write the result as a comment review (`gh pr review <number> --comment`). GitHub does not let you approve a PR from the same account that opened it.
   - The first line is "Ready for merge" or "Changes needed".
   - "Ready for merge": all acceptance criteria and scenarios pass. Write small problems as notes.
   - "Changes needed": an acceptance criterion or a scenario fails, there is a bug, or a convention is not followed.
   - Then write one line for each acceptance criterion and scenario, with how you validated it.
   - Then write one "Conventions" line with the result of step 5.
   - Then write the problems and notes, if there are any.
7. Do not push fixes to the PR. Do not change the issue Status when the result is "Ready for merge".
8. If the result is "Changes needed", set the issue Status to "In Progress". The implementer fixes the problems, then sets "In Review" again.
9. Do not delete a branch that you did not create.

## 8. Done

Do not set Status to "Done". The issue closes when the PR merges. The project workflow then sets "Done".
