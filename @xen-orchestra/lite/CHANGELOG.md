# ChangeLog

## **0.9.0** (2025-03-31)

- [VM/New]: Add VM creation page and form (PR [#8317](https://github.com/vatesfr/xen-orchestra/pull/8317))
- [VM/Network]: Display vifs list in vm view and vifs information in side panel (PR [#8441](https://github.com/vatesfr/xen-orchestra/pull/8441))

## **0.8.0** (2025-02-27)

- [i18n] Add Swedish, update Czech and Spanish translations (contributions made by [@xiscoj](https://github.com/xiscoj), [@p-bo](https://github.com/p-bo) and [Jonas](https://translate.vates.tech/user/Jonas/)) (PR [#8294](https://github.com/vatesfr/xen-orchestra/pull/8294))
- [i18n] Merge XO Lite translations files into one file in web-core ([PR #8380](https://github.com/vatesfr/xen-orchestra/pull/8380))
- [Pool/Network]: Display networks and host internal networks information in side panel (PR [#8150](https://github.com/vatesfr/xen-orchestra/pull/8150))
- [Host/Network]: Display pifs information in side panel (PR [#8186](https://github.com/vatesfr/xen-orchestra/pull/8186))

## **0.7.1** (2025-02-04)

- [Host/Console] Fix console sometimes not correctly displayed (PR [#8305](https://github.com/vatesfr/xen-orchestra/pull/8305))

## **0.7.0** (2025-01-30)

- Fix persistent scrollbar on the right (PR [#8191](https://github.com/vatesfr/xen-orchestra/pull/8191))
- [Console]: Displays a loader when the console is loading (PR [#8226](https://github.com/vatesfr/xen-orchestra/pull/8226))
- [i18n] Add Spanish translation (contribution made by [@DSJ2](https://github.com/DSJ2)) (PR [#8220](https://github.com/vatesfr/xen-orchestra/pull/8220))
- [Console]: Adding a border when console is focused (PR [#8235](https://github.com/vatesfr/xen-orchestra/pull/8235))
- [Pool/Network]: Display networks and host internal networks lists in pool view (PR [#8147](https://github.com/vatesfr/xen-orchestra/pull/8147))
- [Host/Network]: Display pifs list in host view (PR [#8180](https://github.com/vatesfr/xen-orchestra/pull/8180))
- [Host/Network]: Fix issue with wording in host pif table (PR [8285](https://github.com/vatesfr/xen-orchestra/pull/8285))
- [Pool/Network]: Fix issue with network status (PR [#8284](https://github.com/vatesfr/xen-orchestra/pull/8284))

## **0.6.0** (2024-11-29)

- [Pool/Dashboard] `Patches` and `Status` cards are displayed with a greater minimum width (PR [#8108](https://github.com/vatesfr/xen-orchestra/pull/8108))
- [Header] Update user menu button (PR [#8109](https://github.com/vatesfr/xen-orchestra/pull/8109))
- [VM/Console] Display _Console Clipboard_ and _Console Actions_ (PR [#8125](https://github.com/vatesfr/xen-orchestra/pull/8125))
- [i18n] Add Czech translation (contribution made by [@p-bo](https://github.com/p-bo)) (PR [#8098](https://github.com/vatesfr/xen-orchestra/pull/8098))
- [Host/Console] Display _Console_, _Console Clipboard_ and _Console Actions_ (PR [#8136](https://github.com/vatesfr/xen-orchestra/pull/8136))

## **0.5.0** (2024-10-31)

- Handle IPv6 hosts (PR [#8044](https://github.com/vatesfr/xen-orchestra/pull/8044))
- [XOA deploy] Configure custom NTP servers (PR [#8059](https://github.com/vatesfr/xen-orchestra/pull/8059))

## **0.4.0** (2024-09-30)

- [Settings] Default UI theme is now _auto_ instead of _dark_

## **0.2.7** (2024-07-31)

- [Pool/Dashboard] Add missing translations for hosts and VMs statuses (PR [#7744](https://github.com/vatesfr/xen-orchestra/pull/7744))
- [i18n] Add Persian translation (based on the contribution made by [@Jokar-xen](https://github.com/Jokar-xen)) (PR [#7775](https://github.com/vatesfr/xen-orchestra/pull/7775))
- [Access XOA] Support `xo-server`'s' setting `http.publicUrl` to redirect to a custom URL when "Access XOA" button is clicked in XO Lite [Forum#9392](https://xcp-ng.org/forum/topic/9392) (PR [#7849](https://github.com/vatesfr/xen-orchestra/pull/7849))

## **0.2.3** (2024-05-31)

- [Pool/Dashboard] In the `Storage usage` card, DVDs are no longer taken into account (PR [#7670](https://github.com/vatesfr/xen-orchestra/pull/7670))
- [Header] Add link to XOA when XOA is detected on the pool (PR [#7679](https://github.com/vatesfr/xen-orchestra/pull/7679))
- Add german translation (based on the contribution made by [@borzel](https://github.com/borzel)) (PR [#7686](https://github.com/vatesfr/xen-orchestra/pull/7686))

## **0.2.2** (2024-04-30)

- [Tree view] Update tree view with new components from design system (PR [#7531](https://github.com/vatesfr/xen-orchestra/pull/7531))

## **0.2.1** (2024-04-02)

- Fix duplicate consoles after failed connection (PR [#7505](https://github.com/vatesfr/xen-orchestra/pull/7505))
- [Tabs] Disable navigation to in-progress views (PR [7482](https://github.com/vatesfr/xen-orchestra/pull/7482))

## **0.2.0** (2024-02-29)

- Fix Typescript typings errors when running `yarn type-check` command (PR [#7278](https://github.com/vatesfr/xen-orchestra/pull/7278))
- Introduce PWA Json Manifest (PR [#7291](https://github.com/vatesfr/xen-orchestra/pull/7291))

## **0.1.7** (2023-12-28)

- [VM/Action] Ability to migrate a VM from its view (PR [#7164](https://github.com/vatesfr/xen-orchestra/pull/7164))
- Ability to override host address with `master` URL query param (PR [#7187](https://github.com/vatesfr/xen-orchestra/pull/7187))
- Added tooltip on CPU provisioning warning icon (PR [#7223](https://github.com/vatesfr/xen-orchestra/pull/7223))
- Add indeterminate state on FormToggle component (PR [#7230](https://github.com/vatesfr/xen-orchestra/pull/7230))
- Add new UiStatusPanel component (PR [#7227](https://github.com/vatesfr/xen-orchestra/pull/7227))
- XOA quick deploy (PR [#7245](https://github.com/vatesfr/xen-orchestra/pull/7245))
- Fix infinite loader when no stats on pool dashboard (PR [#7236](https://github.com/vatesfr/xen-orchestra/pull/7236))
- [Tree view] Display VMs count (PR [#7185](https://github.com/vatesfr/xen-orchestra/pull/7185))

## **0.1.6** (2023-11-30)

- Explicit error if users attempt to connect from a slave host (PR [#7110](https://github.com/vatesfr/xen-orchestra/pull/7110))
- More compact UI (PR [#7159](https://github.com/vatesfr/xen-orchestra/pull/7159))
- Fix dashboard host patches list (PR [#7169](https://github.com/vatesfr/xen-orchestra/pull/7169))
- Ability to export selected VMs (PR [#7174](https://github.com/vatesfr/xen-orchestra/pull/7174))
- [VM/Action] Ability to export a VM from its view (PR [#7190](https://github.com/vatesfr/xen-orchestra/pull/7190))

## **0.1.5** (2023-11-07)

- Ability to snapshot/copy a VM from its view (PR [#7087](https://github.com/vatesfr/xen-orchestra/pull/7087))
- [Header] Replace logo with "XO LITE" (PR [#7118](https://github.com/vatesfr/xen-orchestra/pull/7118))
- New VM console toolbar + Ability to send Ctrl+Alt+Del (PR [#7088](https://github.com/vatesfr/xen-orchestra/pull/7088))
- Total overhaul of the modal system (PR [#7134](https://github.com/vatesfr/xen-orchestra/pull/7134))

## **0.1.4** (2023-10-03)

- Ability to migrate selected VMs to another host (PR [#7040](https://github.com/vatesfr/xen-orchestra/pull/7040))
- Ability to snapshot selected VMs (PR [#7021](https://github.com/vatesfr/xen-orchestra/pull/7021))
- Add Patches to Pool Dashboard (PR [#6709](https://github.com/vatesfr/xen-orchestra/pull/6709))
- Add remember me checkbox on the login page (PR [#7030](https://github.com/vatesfr/xen-orchestra/pull/7030))

## **0.1.3** (2023-09-01)

- Add Alarms to Pool Dashboard (PR [#6976](https://github.com/vatesfr/xen-orchestra/pull/6976))

## **0.1.2** (2023-07-28)

- Ability to export selected VMs as CSV file (PR [#6915](https://github.com/vatesfr/xen-orchestra/pull/6915))
- [Pool/VMs] Ability to export selected VMs as JSON file (PR [#6911](https://github.com/vatesfr/xen-orchestra/pull/6911))
- Add Tasks to Pool Dashboard (PR [#6713](https://github.com/vatesfr/xen-orchestra/pull/6713))

## **0.1.1** (2023-07-03)

- Invalidate sessionId token after logout (PR [#6480](https://github.com/vatesfr/xen-orchestra/pull/6480))
- Settings page (PR [#6418](https://github.com/vatesfr/xen-orchestra/pull/6418))
- Uncollapse hosts in the tree by default (PR [#6428](https://github.com/vatesfr/xen-orchestra/pull/6428))
- Display RAM usage in pool dashboard (PR [#6419](https://github.com/vatesfr/xen-orchestra/pull/6419))
- Implement not found page (PR [#6410](https://github.com/vatesfr/xen-orchestra/pull/6410))
- Display CPU usage chart in pool dashboard (PR [#6577](https://github.com/vatesfr/xen-orchestra/pull/6577))
- Display network throughput chart in pool dashboard (PR [#6610](https://github.com/vatesfr/xen-orchestra/pull/6610))
- Display RAM usage chart in pool dashboard (PR [#6604](https://github.com/vatesfr/xen-orchestra/pull/6604))
- Ability to change the state of a VM (PRs [#6571](https://github.com/vatesfr/xen-orchestra/pull/6571) [#6608](https://github.com/vatesfr/xen-orchestra/pull/6608))
- Display CPU provisioning in pool dashboard (PR [#6601](https://github.com/vatesfr/xen-orchestra/pull/6601))
- Add a star icon near the pool master (PR [#6712](https://github.com/vatesfr/xen-orchestra/pull/6712))
- Display an error message if the data cannot be fetched (PR [#6525](https://github.com/vatesfr/xen-orchestra/pull/6525))
- Add "Under Construction" views (PR [#6673](https://github.com/vatesfr/xen-orchestra/pull/6673))
- Ability to change the state of selected VMs from the pool's list of VMs (PR [#6782](https://github.com/vatesfr/xen-orchestra/pull/6782))
- Ability to copy selected VMs from the pool's list of VMs (PR [#6847](https://github.com/vatesfr/xen-orchestra/pull/6847))
- Ability to delete selected VMs from the pool's list of VMs (PR [#6673](https://github.com/vatesfr/xen-orchestra/pull/6860))

## **0.1.0**

- Initial implementation
