# Contributing

XO is an Open Source project released under the [AGPL v3](http://www.gnu.org/licenses/agpl-3.0-standalone.html) license, contributions are therefore very welcome.

## Bug reports

Xen Orchestra has three bugtrackers:

* [one for the server](https://github.com/vatesfr/xo-server/issues);
* [one for the interface](https://github.com/vatesfr/xo-web/issues);
* [and the last one](https://github.com/vatesfr/xo/issues) for common issues or when you don't know to which part it is related to.

Feel free to report issues or features you miss.

## Documentation / Code

Using GitHub fork/pull-request feature, you may send us some fixes or enhancements.

Please, do explain:
* what you are fixing (issue number if available);
* how you did it.

### Pull requests

The best way to propose a change on the documentation or the code is
to create a [GitHub pull request](https://help.github.com/articles/using-pull-requests/).

> Your pull request should always been against the `next-release`
> branch and not against `master` which is the stable branch!


1. Create a branch for your work
2. Create a pull request for this branch against the `next-release` branch
3. Push into the branch until the pull request is ready to merge
4. Avoid unnecessary merges: keep you branch up to date by regularly rebasing `git rebase origin next-release`
5. When ready to merge, clean up the history (reorder commits, squash some of them together, rephrase messages): `git rebase -i`
