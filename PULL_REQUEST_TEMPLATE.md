### Description

_Short explanation of this PR (feel free to re-use commit message)_

### Checklist

- Commit
  - Title follows [commit conventions](https://bit.ly/commit-conventions)
  - Reference the relevant issue (`Fixes #007`, `See xoa-support#42`, `See https://...`)
  - If bug fix, add `Introduced by`
- Changelog
  - If visible by XOA users, add changelog entry
  - Update "Packages to release" in `CHANGELOG.unreleased.md`
- PR
  - If UI changes, add screenshots
  - If not finished or not tested, open as _Draft_

### Review process

If you are an external contributor, you can skip this part. Simply create the pull request, and we'll get back to you as soon as possible.

> This 2-passes review process aims to:
>
> - develop skills of junior reviewers
> - limit the workload for senior reviewers
> - limit the number of unnecessary changes by the _author_

1. The _author_ creates a PR.
2. Review process:
   1. The _author_ assigns the _junior reviewer_.
   2. The _junior reviewer_ conducts their review:
      - Resolves their comments if they are addressed.
      - Adds comments if necessary or approves the PR.
   3. The _junior reviewer_ assigns the _senior reviewer_.
   4. The _senior reviewer_ conducts their review:
      - If there are no unresolved comments on the PR → merge.
      - Otherwise, we continue with **3.**
3. The _author_ responds to comments and/or makes corrections, and we go back to **2.**

Notes:

1. The _author_ can request a review at any time, even if the PR is still a _Draft_.
2. In theory, there should not be more than one reviewer at a time.
3. The _author_ should not make any changes:
   - When a reviewer is assigned.
   - Between the _junior_ and _senior_ reviews.
