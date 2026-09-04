# Contribute

XO is an Open Source project released under the [AGPL v3](http://www.gnu.org/licenses/agpl-3.0-standalone.html) license, contributions are therefore very welcome.

This page is a summary: the source of truth is the [CONTRIBUTING.md](https://github.com/vatesfr/xen-orchestra/blob/master/CONTRIBUTING.md) file at the root of the repository, and the project is governed by its [Code of Conduct](https://github.com/vatesfr/xen-orchestra/blob/master/CODE_OF_CONDUCT.md).

## Questions

If you have a question, do not open a GitHub issue: search the [Xen Orchestra section of our forum](https://xcp-ng.org/forum/category/12/xen-orchestra) first, and open a new topic there if needed, with as much context as you can (versions, platform, what you are trying to do).

## Bug reports

Bugs are tracked as [GitHub issues](https://github.com/vatesfr/xen-orchestra/issues). Before opening one:

- Make sure you are using the latest version.
- Check the [documentation](https://docs.xen-orchestra.com/) and the [forum](https://xcp-ng.org/forum/category/12/xen-orchestra) to rule out a configuration problem.
- Search [existing bug reports](https://github.com/vatesfr/xen-orchestra/issues?q=label%3Abug) to avoid duplicates.
- Collect the relevant information: stack trace, OS and platform, versions, reproduction steps.

In your report, explain the behavior you expected, the actual behavior, and the reproduction steps someone else can follow.

:::warning
Never report security vulnerabilities or bugs containing sensitive information in the public issue tracker. Use the [dedicated security advisories page](https://github.com/vatesfr/xen-orchestra/security/advisories/new) instead.
:::

## Suggesting enhancements

Enhancement suggestions (new features and improvements) are also tracked as [GitHub issues](https://github.com/vatesfr/xen-orchestra/issues). Search existing suggestions first, use a clear title, describe the current behavior and the behavior you expected, and explain why the change would be useful to most Xen Orchestra users. For more general product feedback, see the [About page](intro_project.md#feedback-and-issues).

## Translations

[Help us translate Xen Orchestra in more languages!](http://translate.vates.tech/engage/xen-orchestra/)

## Documentation / Code

:::note
By contributing, you confirm that you authored 100% of the content, that you have the necessary rights to it, and that it may be provided under the project license.
:::

Using the GitHub fork/pull-request feature, you may send us fixes or enhancements. Please explain what you are fixing (issue number if available) and how you did it.

### Pull requests

The best way to propose a change to the documentation or code is
to create a [GitHub pull request](https://help.github.com/articles/using-pull-requests/).

1. Fork the [Xen Orchestra repository](https://github.com/vatesfr/xen-orchestra) using the Fork button
2. Follow [the documentation](./install-from-sources.md) to install and run Xen Orchestra from the sources
3. Create a branch for your work
4. Edit the source files
5. Add a summary of your changes to `CHANGELOG.unreleased.md`, if your changes do not relate to an existing changelog item and update the list of packages that must be released to take your changes into account
6. [Create a pull request](https://github.com/vatesfr/xen-orchestra/compare) for this branch against the `master` branch
7. Push into the branch until the pull request is ready to merge
8. Avoid unnecessary merges: keep your branch up to date by regularly rebasing `git rebase origin/master`
9. When ready to merge, clean up the history (reorder commits, squash some of them together, rephrase messages): `git rebase -i origin/master`

### Issue triage

#### Labels

**Type**

- bug
- cleanup: should be taken care of to avoid technical debt
- enhancement
- meta: points to other issues and is used to manage long term goals (similar but orthogonal to milestones)
- question

:::warning
All issues MUST have one of these labels!
:::

**Difficulty**

:::tip
This helps new people to contribute.
:::

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

:::warning
A new version MUST NOT be released with a `high` or `critical` issue.
:::

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
