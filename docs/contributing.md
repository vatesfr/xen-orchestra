# Contributing

XO is an Open Source project released under the [AGPL v3](http://www.gnu.org/licenses/agpl-3.0-standalone.html) license, contributions are therefore very welcome.

## Bug reports

You can [open bug reports here](https://github.com/vatesfr/xen-orchestra/issues) (issues, enhancements, ideas etc.).

## Documentation / Code

Using GitHub fork/pull-request feature, you may send us some fixes or enhancements.

Please, do explain:
* what you are fixing (issue number if available);
* how you did it.

### Pull requests

The best way to propose a change on the documentation or the code is
to create a [GitHub pull request](https://help.github.com/articles/using-pull-requests/).

> Your pull request should always been against the `master`
> branch and not against `stable` which is the stable branch!


1. Create a branch for your work
2. Create a pull request for this branch against the `master` branch
3. Push into the branch until the pull request is ready to merge
4. Avoid unnecessary merges: keep you branch up to date by regularly rebasing `git rebase origin/master`
5. When ready to merge, clean up the history (reorder commits, squash some of them together, rephrase messages): `git rebase -i origin/master`

### Issue triage

#### Labels

**Type**

- bug
- cleanup: should be taken care of to avoid technical debt
- enhancement
- meta: points to other issues and is used to manage long term goals (similar but orthogonal to milestones)
- question

> All issues MUST have one of this label!

**Difficulty**

> This helps new people to contribute.

1. easy
2. medium

**Component**

- backup
- GUI
- upstream: not a XO issue → link to the upstream issue and monitor progress

**Severity**

1. low: will be fixed when possible
2. medium
3. high: should be fixed for the next release
4. critical: should be fixed ASAP and a patch release is done once fixed

> A new version MUST NOT be released with a `high` or `critical`
> issue.

**Status**

For all issues:

- duplicate: issue is a duplicate → SHOULD be closed
- in progress: issue has been assigned and some work is going on

For bugs:

- confirmed: bug is confirmed → SHOULD be assigned to someone
- invalid: bug cannot be confirmed → SHOULD be closed

For enhancements:

- draft: proposal is not finished and work should not be started yet
- wontfix: not a real enhancement → SHOULD be closed
