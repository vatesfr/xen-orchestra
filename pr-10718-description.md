### Description

Adds a detail page for backup logs in Admin › Backup & Replication › Logs, reachable from the title of the log side panel. It has 3 tabs:

- **General**: general information and schedule of the run, with a link to configure the job in XO 5
- **Run**: tree of the run tasks; selecting a task opens a side panel with its information, warnings, errors and JSON (like "copy log" in XO 5)
- **Backed up VMs**: backed up VMs with the size transferred by this run

### Notes for reviewers

- Horizontal tabs, like the other detail pages: the vertical tabs of the mockup do not exist in the design system
- The Run tab reuses `TasksList`, which gets a `title` prop
- No progress percentage on running tasks: the backend only sends a real one for incremental XAPI backups, per disk and on the transfer tasks, design is being asked
- The log side panel title now links to the detail page instead of XO 5
- New `computeTransferSpeed` util, shared by the log transfer speed and the VM transfer speed
- New i18n keys in web-core: `end-date`, `json`, `merge`, `start-date`, `transfer`, `transfer-size`

### Screenshots

|                         | Light | Dark |
| ----------------------- | ----- | ---- |
| General tab             |       |      |
| Run tab                 |       |      |
| Run tab with side panel |       |      |
| Backed up VMs tab       |       |      |

### Checklist

- Commit
  - Title follows [commit conventions](https://bit.ly/commit-conventions)
  - Reference the relevant issue, forum thread, discussion, ... (`Fixes #007`, `See xoa-support#42`, `See https://...`)
  - If bug fix, add `Introduced by <commit|PR>`
- Changelog
  - If visible by XOA users, add changelog entry to `CHANGELOG.unreleased.md`
  - If visible by XO Lite users, add changelog entry to `@xen-orchestra/lite/CHANGELOG.md`
  - Update "Packages to release" in `CHANGELOG.unreleased.md`
- PR
  - If UI changes, add a `### Screenshots` section above this checklist
  - If not finished or not tested, open as _Draft_

### Review process

- External contributors: simply open the pull request, we'll get back to you as soon as possible.
- Vates developers: follow the internal pull request process.
