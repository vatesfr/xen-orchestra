# ChangeLog

## **5.10.0** (2017-05-31)

### Enhancements

- Improve backup log display [\#2239](https://github.com/vatesfr/xo-web/issues/2239)
- Patch SR detection improvement [\#2215](https://github.com/vatesfr/xo-web/issues/2215)
- Less strict coalesce detection [\#2207](https://github.com/vatesfr/xo-web/issues/2207)
- IP pool UI improvement [\#2203](https://github.com/vatesfr/xo-web/issues/2203)
- Ability to clear "Auto power on" flag for DR-ed VM [\#2097](https://github.com/vatesfr/xo-web/issues/2097)
- [Delta backup restoration] Choose SR for each VDIs [\#2070](https://github.com/vatesfr/xo-web/issues/2070)
- Ability to forget an host (even if no longer present) [\#1934](https://github.com/vatesfr/xo-web/issues/1934)

### Bug fixes

- Cross pool migrate fail [\#2248](https://github.com/vatesfr/xo-web/issues/2248)
- ActionButtons with modals stay in pending state forever [\#2222](https://github.com/vatesfr/xo-web/issues/2222)
- Permission issue for a user on self service VMs [\#2212](https://github.com/vatesfr/xo-web/issues/2212)
- Self-Service resource loophole [\#2198](https://github.com/vatesfr/xo-web/issues/2198)
- Backup log no longer shows the name of destination VM [\#2195](https://github.com/vatesfr/xo-web/issues/2195)
- State not restored when exiting modal dialog [\#2194](https://github.com/vatesfr/xo-web/issues/2194)
- [Xapi#exportDeltaVm] Cannot read property 'managed' of undefined [\#2189](https://github.com/vatesfr/xo-web/issues/2189)
- VNC keyboard layout change [\#404](https://github.com/vatesfr/xo-web/issues/404)

## **5.9.0** (2017-05-31)

### Enhancements

- Allow DR to remove previous backup first [\#2157](https://github.com/vatesfr/xo-web/issues/2157)
- Feature request - add amount of RAM to memory bars [\#2149](https://github.com/vatesfr/xo-web/issues/2149)
- Make the acceptability of invalid certificates configurable [\#2138](https://github.com/vatesfr/xo-web/issues/2138)
- label of VM names in tasks link [\#2135](https://github.com/vatesfr/xo-web/issues/2135)
- Backup report timezone [\#2133](https://github.com/vatesfr/xo-web/issues/2133)
- xo-server-recover-account [\#2129](https://github.com/vatesfr/xo-web/issues/2129)
- Detect disks attached to control domain [\#2126](https://github.com/vatesfr/xo-web/issues/2126)
- Add task description in Tasks view [\#2125](https://github.com/vatesfr/xo-web/issues/2125)
- Host reboot warning after patching for 7.1 [\#2124](https://github.com/vatesfr/xo-web/issues/2124)
- Continuous Replication - possibility run VM without a clone [\#2119](https://github.com/vatesfr/xo-web/issues/2119)
- Unreachable host should be detected [\#2099](https://github.com/vatesfr/xo-web/issues/2099)
- Orange icon when host is is disabled [\#2098](https://github.com/vatesfr/xo-web/issues/2098)
- Enhanced backup report logs [\#2096](https://github.com/vatesfr/xo-web/issues/2096)
- Only show failures when configured to report on failures [\#2095](https://github.com/vatesfr/xo-web/issues/2095)
- "Add all" button in self service [\#2081](https://github.com/vatesfr/xo-web/issues/2081)
- Patch and pack mechanism changed on Ely [\#2058](https://github.com/vatesfr/xo-web/issues/2058)
- Tip or ask people to patch from pool view [\#2057](https://github.com/vatesfr/xo-web/issues/2057)
- File restore - Remind compatible backup [\#1930](https://github.com/vatesfr/xo-web/issues/1930)
- Reporting for halted vm time [\#1613](https://github.com/vatesfr/xo-web/issues/1613)
- Add standalone XS server to a pool and patch it to the pool level [\#878](https://github.com/vatesfr/xo-web/issues/878)
- Add Cores-per-sockets [\#130](https://github.com/vatesfr/xo-web/issues/130)

### Bug fixes

- VM creation is broken for non-admins [\#2168](https://github.com/vatesfr/xo-web/issues/2168)
- Can't create cloud config drive [\#2162](https://github.com/vatesfr/xo-web/issues/2162)
- Select is "moving" [\#2142](https://github.com/vatesfr/xo-web/issues/2142)
- Select issue for affinity host [\#2141](https://github.com/vatesfr/xo-web/issues/2141)
- Dashboard Storage Usage incorrect [\#2123](https://github.com/vatesfr/xo-web/issues/2123)
- Detect unmerged *base copy* and prevent too long chains [\#2047](https://github.com/vatesfr/xo-web/issues/2047)


## **5.8.0** (2017-04-28)

### Enhancements

- Limit About view info for non-admins [\#2109](https://github.com/vatesfr/xo-web/issues/2109)
- Enabling/disabling boot device on HVM VM [\#2105](https://github.com/vatesfr/xo-web/issues/2105)
- Filter: Hide snapshots in SR disk view [\#2102](https://github.com/vatesfr/xo-web/issues/2102)
- Smarter XOSAN install [\#2084](https://github.com/vatesfr/xo-web/issues/2084)
- PL translation [\#2079](https://github.com/vatesfr/xo-web/issues/2079)
- Remove the "share this VM" option if not in self service [\#2061](https://github.com/vatesfr/xo-web/issues/2061)
- "connected" status graphics are not the same on the host storage and networking tabs [\#2060](https://github.com/vatesfr/xo-web/issues/2060)
- Ability to view and edit `vga` and `videoram` fields in VM view [\#158](https://github.com/vatesfr/xo-web/issues/158)
- Performances [\#1](https://github.com/vatesfr/xen-api/issues/1)

### Bug fixes

- Dashboard display issues [\#2108](https://github.com/vatesfr/xo-web/issues/2108)
- Dashboard CPUs Usage [\#2105](https://github.com/vatesfr/xo-web/issues/2105)
- [Dashboard/Overview] Warning [\#2090](https://github.com/vatesfr/xo-web/issues/2090)
- VM creation displays all networks [\#2086](https://github.com/vatesfr/xo-web/issues/2086)
- Cannot change HA mode for a VM [\#2080](https://github.com/vatesfr/xo-web/issues/2080)
- [Smart backup] Tags selection does not work [\#2077](https://github.com/vatesfr/xo-web/issues/2077)
- [Backup jobs] Timeout should be in seconds, not milliseconds [\#2076](https://github.com/vatesfr/xo-web/issues/2076)
- Missing VM templates [\#2075](https://github.com/vatesfr/xo-web/issues/2075)
- [transport-email] From header not set [\#2074](https://github.com/vatesfr/xo-web/issues/2074)
- Missing objects should be displayed in backup edition [\#2052](https://github.com/vatesfr/xo-web/issues/2052)

## **5.7.0** (2017-03-31)

### Enhancements

- Improve ActionButton error reporting [\#2048](https://github.com/vatesfr/xo-web/issues/2048)
- Home view master checkbox UI issue [\#2027](https://github.com/vatesfr/xo-web/issues/2027)
- HU Translation [\#2019](https://github.com/vatesfr/xo-web/issues/2019)
- [Usage report] Add name for all objects [\#2017](https://github.com/vatesfr/xo-web/issues/2017)
- [Home] Improve inter-types linkage [\#2012](https://github.com/vatesfr/xo-web/issues/2012)
- Remove bootable checkboxes in VM creation [\#2007](https://github.com/vatesfr/xo-web/issues/2007)
- Do not display bootable toggles for disks of non-PV VMs [\#1996](https://github.com/vatesfr/xo-web/issues/1996)
- Try to match network VLAN for VM migration modal [\#1990](https://github.com/vatesfr/xo-web/issues/1990)
- [Usage reports] Add VM names in addition to UUIDs [\#1984](https://github.com/vatesfr/xo-web/issues/1984)
- Host affinity in "advanced" VM creation [\#1983](https://github.com/vatesfr/xo-web/issues/1983)
- Add job tag in backup logs [\#1982](https://github.com/vatesfr/xo-web/issues/1982)
- Possibility to add a label/description to servers [\#1965](https://github.com/vatesfr/xo-web/issues/1965)
- Possibility to create shared VM in a resource set [\#1964](https://github.com/vatesfr/xo-web/issues/1964)
- Clearer display of disabled (backup) jobs [\#1958](https://github.com/vatesfr/xo-web/issues/1958)
- Job should have a configurable timeout [\#1956](https://github.com/vatesfr/xo-web/issues/1956)
- Sort failed VMs in backup report [\#1950](https://github.com/vatesfr/xo-web/issues/1950)
- Support for UNIX socket path [\#1944](https://github.com/vatesfr/xo-web/issues/1944)
- Interface - Host Patching - Button Verbiage [\#1911](https://github.com/vatesfr/xo-web/issues/1911)
- Display if a VM is in Self Service (and which group) [\#1905](https://github.com/vatesfr/xo-web/issues/1905)
- Install supplemental pack on a whole pool [\#1896](https://github.com/vatesfr/xo-web/issues/1896)
- Allow VM snapshots with ACLs [\#1865](https://github.com/vatesfr/xo-web/issues/1886)
- Icon to indicate if a snapshot is quiesce [\#1858](https://github.com/vatesfr/xo-web/issues/1858)
- Pool Ips input too permissive [\#1731](https://github.com/vatesfr/xo-web/issues/1731)
- Select is going on top after each choice [\#1359](https://github.com/vatesfr/xo-web/issues/1359)

### Bug fixes

- Missing objects should be displayed in backup edition [\#2052](https://github.com/vatesfr/xo-web/issues/2052)
- Search bar content changes while typing [\#2035](https://github.com/vatesfr/xo-web/issues/2035)
- VM.$guest_metrics.PV_drivers_up_to_date is deprecated in XS 7.1 [\#2024](https://github.com/vatesfr/xo-web/issues/2024)
- Bootable flag selection checkbox for extra disk not fetched [\#1994](https://github.com/vatesfr/xo-web/issues/1994)
- Home view − Changing type must reset paging [\#1993](https://github.com/vatesfr/xo-web/issues/1993)
- XOSAN menu item should only be displayed to admins [\#1968](https://github.com/vatesfr/xo-web/issues/1968)
- Object type change are not correctly handled in UI [\#1967](https://github.com/vatesfr/xo-web/issues/1967)
- VM creation is stuck when using ISO/DVD as install method [\#1966](https://github.com/vatesfr/xo-web/issues/1966)
- Install pack on whole pool fails [\#1957](https://github.com/vatesfr/xo-web/issues/1957)
- Consoles are broken in next-release [\#1954](https://github.com/vatesfr/xo-web/issues/1954)
- [VHD merge] Increase BAT when necessary [\#1939](https://github.com/vatesfr/xo-web/issues/1939)
- Issue on VM restore time [\#1936](https://github.com/vatesfr/xo-web/issues/1936)
- Two remotes should not be able to have the same name [\#1879](https://github.com/vatesfr/xo-web/issues/1879)
- Selfservice limits not honored after VM creation [\#1695](https://github.com/vatesfr/xo-web/issues/1695)

## **5.6.0** (2017-01-27)

Reporting, LVM File level restore.

### Enhancements

- Do not stop patches install if already applied [\#1904](https://github.com/vatesfr/xo-web/issues/1904)
- Improve scheduling UI [\#1893](https://github.com/vatesfr/xo-web/issues/1893)
- Smart backup and tag [\#1885](https://github.com/vatesfr/xo-web/issues/1885)
- Missing embeded API documention [\#1882](https://github.com/vatesfr/xo-web/issues/1882)
- Add local DVD in CD selector [\#1880](https://github.com/vatesfr/xo-web/issues/1880)
- File level restore for LVM [\#1878](https://github.com/vatesfr/xo-web/issues/1878)
- Restore multiple files from file level restore [\#1877](https://github.com/vatesfr/xo-web/issues/1877)
- Add a VM tab for host & pool views [\#1864](https://github.com/vatesfr/xo-web/issues/1864)
- Icon to indicate if a snapshot is quiesce [\#1858](https://github.com/vatesfr/xo-web/issues/1858)
- UI for disconnect hosts comp [\#1833](https://github.com/vatesfr/xo-web/issues/1833)
- Eject all xs-guest.iso in a pool [\#1798](https://github.com/vatesfr/xo-web/issues/1798)
- Display installed supplemental pack on host [\#1506](https://github.com/vatesfr/xo-web/issues/1506)
- Install supplemental pack on host comp [\#1460](https://github.com/vatesfr/xo-web/issues/1460)
- Pool-wide combined stats [\#1324](https://github.com/vatesfr/xo-web/issues/1324)

### Bug fixes

- IP-address not released when VM removed [\#1906](https://github.com/vatesfr/xo-web/issues/1906)
- Interface broken due to new Bootstrap Alpha [\#1871](https://github.com/vatesfr/xo-web/issues/1871)
- Self service recompute all limits broken [\#1866](https://github.com/vatesfr/xo-web/issues/1866)
- Patch not found error for XS 6.5 [\#1863](https://github.com/vatesfr/xo-web/issues/1863)
- Convert To Template issues [\#1855](https://github.com/vatesfr/xo-web/issues/1855)
- Removing PIF seems to fail [\#1853](https://github.com/vatesfr/xo-web/issues/1853)
- Depth should be >= 1 in backup creation [\#1851](https://github.com/vatesfr/xo-web/issues/1851)
- Wrong link in Dashboard > Health [\#1850](https://github.com/vatesfr/xo-web/issues/1850)
- Incorrect file dates shown in new File Restore feature [\#1840](https://github.com/vatesfr/xo-web/issues/1840)
- IP allocation problem [\#1747](https://github.com/vatesfr/xo-web/issues/1747)
- Selfservice limits not honored after VM creation [\#1695](https://github.com/vatesfr/xo-web/issues/1695)

## **5.5.0** (2016-12-20)

File level restore.

### Enhancements

- Better auto select network when migrate VM [\#1788](https://github.com/vatesfr/xo-web/issues/1788)
- Plugin for passive backup job reporting in Nagios [\#1664](https://github.com/vatesfr/xo-web/issues/1664)
- File level restore for delta backup [\#1590](https://github.com/vatesfr/xo-web/issues/1590)
- Better select filters for ACLs [\#1515](https://github.com/vatesfr/xo-web/issues/1515)
- All pools and "negative" filters [\#1503](https://github.com/vatesfr/xo-web/issues/1503)
- VM copy with disk selection [\#826](https://github.com/vatesfr/xo-web/issues/826)
- Disable metadata exports [\#1818](https://github.com/vatesfr/xo-web/issues/1818)

### Bug fixes

- Tool small selector [\#1832](https://github.com/vatesfr/xo-web/issues/1832)
- Replication does not work from a VM created by a CR or delta backup [\#1811](https://github.com/vatesfr/xo-web/issues/1811)
- Can't add a SSH key in VM creation [\#1805](https://github.com/vatesfr/xo-web/issues/1805)
- Issue when no default SR in a pool [\#1804](https://github.com/vatesfr/xo-web/issues/1804)
- XOA doesn't refresh after an update anymore [\#1801](https://github.com/vatesfr/xo-web/issues/1801)
- Shortcuts not inhibited on inputs on Safari [\#1691](https://github.com/vatesfr/xo-web/issues/1691)

## **5.4.0** (2016-11-23)

### Enhancements

- XML display in alerts [\#1776](https://github.com/vatesfr/xo-web/issues/1776)
- Remove some view for non admin users [\#1773](https://github.com/vatesfr/xo-web/issues/1773)
- Complex matcher should support matching boolean values [\#1768](https://github.com/vatesfr/xo-web/issues/1768)
- Home SR view [\#1764](https://github.com/vatesfr/xo-web/issues/1764)
- Filter on tag click [\#1763](https://github.com/vatesfr/xo-web/issues/1763)
- Testable plugins [\#1749](https://github.com/vatesfr/xo-web/issues/1749)
- Backup/Restore Design fix. [\#1734](https://github.com/vatesfr/xo-web/issues/1734)
- Display the owner of a \(backup\) job [\#1733](https://github.com/vatesfr/xo-web/issues/1733)
- Use paginated table for backup jobs [\#1726](https://github.com/vatesfr/xo-web/issues/1726)
- SR view / Disks: should display snapshot VDIs [\#1723](https://github.com/vatesfr/xo-web/issues/1723)
- Restored VM should have an identifiable name [\#1719](https://github.com/vatesfr/xo-web/issues/1719)
- If host reboot action returns NO\_HOSTS\_AVAILABLE, ask to force [\#1717](https://github.com/vatesfr/xo-web/issues/1717)
- Hide xo-server timezone in backups [\#1706](https://github.com/vatesfr/xo-web/issues/1706)
- Enable hyperlink for Hostname for Issues [\#1700](https://github.com/vatesfr/xo-web/issues/1700)
- Pool/network - Modify column [\#1696](https://github.com/vatesfr/xo-web/issues/1696)
- UI - Plugins - Display a message if no plugins [\#1670](https://github.com/vatesfr/xo-web/issues/1670)
- Display warning/error for delta backup on XS older than 6.5 [\#1647](https://github.com/vatesfr/xo-web/issues/1647)
- XO without internet access doesn't work [\#1629](https://github.com/vatesfr/xo-web/issues/1629)
- Improve backup restore view [\#1609](https://github.com/vatesfr/xo-web/issues/1609)
- UI Enhancement - Acronym for dummy [\#1604](https://github.com/vatesfr/xo-web/issues/1604)
- Slack XO plugin for backup report [\#1593](https://github.com/vatesfr/xo-web/issues/1593)
- Expose XAPI exceptions in the UI [\#1481](https://github.com/vatesfr/xo-web/issues/1481)
- Running VMs in the host overview, all VMs in the pool overview [\#1432](https://github.com/vatesfr/xo-web/issues/1432)
- Move location of NFS mount point [\#1405](https://github.com/vatesfr/xo-web/issues/1405)
- Home: Pool list - additionnal informations for pool [\#1226](https://github.com/vatesfr/xo-web/issues/1226)
- Modify VLAN of an existing network [\#1092](https://github.com/vatesfr/xo-web/issues/1092)
- Wrong instructions for CLI upgrade [\#787](https://github.com/vatesfr/xo-web/issues/787)
- Ability to export/import XO config [\#786](https://github.com/vatesfr/xo-web/issues/786)
- Test button for transport-email plugin [\#697](https://github.com/vatesfr/xo-web/issues/697)
- Merge `scheduler` API into `schedule` [\#664](https://github.com/vatesfr/xo-web/issues/664)

### Bug fixes

- Should jobs be accessible to non admins? [\#1759](https://github.com/vatesfr/xo-web/issues/1759)
- Schedules deletion is not working [\#1737](https://github.com/vatesfr/xo-web/issues/1737)
- Editing a job from the jobs overview page does not work  [\#1736](https://github.com/vatesfr/xo-web/issues/1736)
- Editing a schedule from jobs overview does not work  [\#1728](https://github.com/vatesfr/xo-web/issues/1728)
- ACLs not correctly imported [\#1722](https://github.com/vatesfr/xo-web/issues/1722)
- Some Bootstrap style broken [\#1721](https://github.com/vatesfr/xo-web/issues/1721)
- Not properly sign out on auth token expiration [\#1711](https://github.com/vatesfr/xo-web/issues/1711)
- Hosts/<UUID>/network status is incorrect [\#1702](https://github.com/vatesfr/xo-web/issues/1702)
- Patches application fails "Found : Moved Temporarily" [\#1701](https://github.com/vatesfr/xo-web/issues/1701)
- Password generation for user creation is not working [\#1678](https://github.com/vatesfr/xo-web/issues/1678)
- \#/dashboard/health Remove All Orphaned VDIs  [\#1622](https://github.com/vatesfr/xo-web/issues/1622)
- Create a new SR - CIFS/SAMBA Broken [\#1615](https://github.com/vatesfr/xo-web/issues/1615)
- xo-cli --list-objects: truncated output ? 64k buffer limitation ? [\#1356](https://github.com/vatesfr/xo-web/issues/1356)

## **5.3.0** (2016-10-20)

### Enhancements

- Missing favicon [\#1660](https://github.com/vatesfr/xo-web/issues/1660)
- ipPools quota [\#1565](https://github.com/vatesfr/xo-web/issues/1565)
- Dashboard - orphaned VDI [\#1654](https://github.com/vatesfr/xo-web/issues/1654)
- Stats in home/host view when expanded [\#1634](https://github.com/vatesfr/xo-web/issues/1634)
- Bar for used and total RAM on home pool view [\#1625](https://github.com/vatesfr/xo-web/issues/1625)
- Can't translate some text [\#1624](https://github.com/vatesfr/xo-web/issues/1624)
- Dynamic RAM allocation at creation time [\#1603](https://github.com/vatesfr/xo-web/issues/1603)
- Display memory bar in home/host view [\#1616](https://github.com/vatesfr/xo-web/issues/1616)
- Improve keyboard navigation [\#1578](https://github.com/vatesfr/xo-web/issues/1578)
- Strongly suggest to install the guest tools [\#1575](https://github.com/vatesfr/xo-web/issues/1575)
- Missing tooltip [\#1568](https://github.com/vatesfr/xo-web/issues/1568)
- Emphasize already used ips in ipPools [\#1566](https://github.com/vatesfr/xo-web/issues/1566)
- Change "missing feature message" for non-admins [\#1564](https://github.com/vatesfr/xo-web/issues/1564)
- Allow VIF edition [\#1446](https://github.com/vatesfr/xo-web/issues/1446)
- Disable browser autocomplete on credentials on the Update page [\#1304](https://github.com/vatesfr/xo-web/issues/1304)
- keyboard shortcuts [\#1279](https://github.com/vatesfr/xo-web/issues/1279)
- Add network bond creation [\#876](https://github.com/vatesfr/xo-web/issues/876)
- `pool.setDefaultSr\(\)` should not require `pool` param [\#1558](https://github.com/vatesfr/xo-web/issues/1558)
- Select default SR [\#1554](https://github.com/vatesfr/xo-web/issues/1554)
- No error message when I exceed my resource set quota [\#1541](https://github.com/vatesfr/xo-web/issues/1541)
- Hide some buttons for self service VMs [\#1539](https://github.com/vatesfr/xo-web/issues/1539)
- Add Job ID to backup schedules [\#1534](https://github.com/vatesfr/xo-web/issues/1534)
- Correct name for VM selector with templates [\#1530](https://github.com/vatesfr/xo-web/issues/1530)
- Help text when no matches for a filter [\#1517](https://github.com/vatesfr/xo-web/issues/1517)
- Icon or tooltip to allow VDI migration in VM disk view [\#1512](https://github.com/vatesfr/xo-web/issues/1512)
- Create a snapshot before restoring one [\#1445](https://github.com/vatesfr/xo-web/issues/1445)
- Auto power on setting at creation time [\#1444](https://github.com/vatesfr/xo-web/issues/1444)
- local remotes should be avoided if possible [\#1441](https://github.com/vatesfr/xo-web/issues/1441)
- Self service edition unclear [\#1429](https://github.com/vatesfr/xo-web/issues/1429)
- Avoid "\_" char in job tag name [\#1414](https://github.com/vatesfr/xo-web/issues/1414)
- Display message if host reboot needed to apply patches [\#1352](https://github.com/vatesfr/xo-web/issues/1352)
- Color code on host PIF stats can be misleading [\#1265](https://github.com/vatesfr/xo-web/issues/1265)
- Sign in page is not rendered correctly [\#1161](https://github.com/vatesfr/xo-web/issues/1161)
- Template management [\#1091](https://github.com/vatesfr/xo-web/issues/1091)
- On pool view: collapse network list [\#1461](https://github.com/vatesfr/xo-web/issues/1461)
- Alert when trying to reboot/halt the pool master XS [\#1458](https://github.com/vatesfr/xo-web/issues/1458)
- Adding tooltip on Home page [\#1456](https://github.com/vatesfr/xo-web/issues/1456)
- Docker container management functionality missing from v5 [\#1442](https://github.com/vatesfr/xo-web/issues/1442)
- bad error message - delete snapshot [\#1433](https://github.com/vatesfr/xo-web/issues/1433)
- Create tag during VM creation [\#1431](https://github.com/vatesfr/xo-web/issues/1431)

### Bug fixes

- Display issues on plugin array edition [\#1663](https://github.com/vatesfr/xo-web/issues/1663)
- Import of delta backups fails [\#1656](https://github.com/vatesfr/xo-web/issues/1656)
- Host - Missing IP config for PIF [\#1651](https://github.com/vatesfr/xo-web/issues/1651)
- Remote copy is always activating compression [\#1645](https://github.com/vatesfr/xo-web/issues/1645)
- LB plugin UI problems [\#1630](https://github.com/vatesfr/xo-web/issues/1630)
- Keyboard shortcuts should not work when a modal is open [\#1589](https://github.com/vatesfr/xo-web/issues/1589)
- UI small bug in drop-down lists [\#1411](https://github.com/vatesfr/xo-web/issues/1411)
- md5 delta backup error [\#1672](https://github.com/vatesfr/xo-web/issues/1672)
- Can't edit VIF network [\#1640](https://github.com/vatesfr/xo-web/issues/1640)
- Do not expose shortcuts while console is focused [\#1614](https://github.com/vatesfr/xo-web/issues/1614)
- All users can see VM templates [\#1621](https://github.com/vatesfr/xo-web/issues/1621)
- Profile page is broken [\#1612](https://github.com/vatesfr/xo-web/issues/1612)
- SR delete should redirect to home [\#1611](https://github.com/vatesfr/xo-web/issues/1611)
- Delta VHD backup checksum is invalidated by chaining [\#1606](https://github.com/vatesfr/xo-web/issues/1606)
- VM with long description break on 2 lines [\#1580](https://github.com/vatesfr/xo-web/issues/1580)
- Network status on VM edition [\#1573](https://github.com/vatesfr/xo-web/issues/1573)
- VM template deletion fails [\#1571](https://github.com/vatesfr/xo-web/issues/1571)
- Template edition - "no such object" [\#1569](https://github.com/vatesfr/xo-web/issues/1569)
- missing links / element not displayed as links [\#1567](https://github.com/vatesfr/xo-web/issues/1567)
- Backup restore stalled on some SMB shares [\#1412](https://github.com/vatesfr/xo-web/issues/1412)
- Wrong bond display [\#1156](https://github.com/vatesfr/xo-web/issues/1156)
- Multiple reboot selection doesn't work [\#1562](https://github.com/vatesfr/xo-web/issues/1562)
- Server logs should be displayed in reverse chonological order [\#1547](https://github.com/vatesfr/xo-web/issues/1547)
- Cannot create resource sets without limits [\#1537](https://github.com/vatesfr/xo-web/issues/1537)
- UI - Weird display when editing long VM desc [\#1528](https://github.com/vatesfr/xo-web/issues/1528)
- Useless iso selector in host console [\#1527](https://github.com/vatesfr/xo-web/issues/1527)
- Pool and Host dummy welcome message [\#1519](https://github.com/vatesfr/xo-web/issues/1519)
- Bug on Network VM tab [\#1518](https://github.com/vatesfr/xo-web/issues/1518)
- Link to home with filter in query does not work [\#1513](https://github.com/vatesfr/xo-web/issues/1513)
- VHD merge fails with "RangeError: index out of range" on SMB remote [\#1511](https://github.com/vatesfr/xo-web/issues/1511)
- DR: previous VDIs are not removed [\#1510](https://github.com/vatesfr/xo-web/issues/1510)
- DR: previous copies not removed when same number as depth [\#1509](https://github.com/vatesfr/xo-web/issues/1509)
- Empty Saved Search doesn't load when set to default filter [\#1354](https://github.com/vatesfr/xo-web/issues/1354)
- Removing a user/group should delete its ACLs [\#899](https://github.com/vatesfr/xo-web/issues/899)
- OVA Import - XO stuck during import [\#1551](https://github.com/vatesfr/xo-web/issues/1551)
- SMB remote empty domain fails [\#1499](https://github.com/vatesfr/xo-web/issues/1499)
- Can't edit a remote password [\#1498](https://github.com/vatesfr/xo-web/issues/1498)
- Issue in VM create with CoreOS [\#1493](https://github.com/vatesfr/xo-web/issues/1493)
- Overlapping months in backup view [\#1488](https://github.com/vatesfr/xo-web/issues/1488)
- No line break for SSH key in user view [\#1475](https://github.com/vatesfr/xo-web/issues/1475)
- Create VIF UI issues [\#1472](https://github.com/vatesfr/xo-web/issues/1472)

## **5.2.0** (2016-09-09)

### Enhancements

- IP management [\#1350](https://github.com/vatesfr/xo-web/issues/1350), [\#988](https://github.com/vatesfr/xo-web/issues/988), [\#1427](https://github.com/vatesfr/xo-web/issues/1427) and [\#240](https://github.com/vatesfr/xo-web/issues/240)
- Update reverse proxy example [\#1474](https://github.com/vatesfr/xo-web/issues/1474)
- Improve log view [\#1467](https://github.com/vatesfr/xo-web/issues/1467)
- Backup Reports: e-mail subject [\#1463](https://github.com/vatesfr/xo-web/issues/1463)
- Backup Reports: report the error [\#1462](https://github.com/vatesfr/xo-web/issues/1462)
- Vif selector: select management network by default [\#1425](https://github.com/vatesfr/xo-web/issues/1425)
- Display when browser disconnected to server [\#1417](https://github.com/vatesfr/xo-web/issues/1417)
- Tooltip on OS icon in VM view [\#1416](https://github.com/vatesfr/xo-web/issues/1416)
- Display pool master [\#1407](https://github.com/vatesfr/xo-web/issues/1407)
- Missing tooltips in VM creation view [\#1402](https://github.com/vatesfr/xo-web/issues/1402)
- Handle VBD disconnect and connect [\#1397](https://github.com/vatesfr/xo-web/issues/1397)
- Eject host from a pool [\#1395](https://github.com/vatesfr/xo-web/issues/1395)
- Improve pool general view [\#1393](https://github.com/vatesfr/xo-web/issues/1393)
- Improve patching system [\#1392](https://github.com/vatesfr/xo-web/issues/1392)
- Pool name modification [\#1390](https://github.com/vatesfr/xo-web/issues/1390)
- Confirmation dialog before destroying VDIs [\#1388](https://github.com/vatesfr/xo-web/issues/1388)
- Tooltips for meter object [\#1387](https://github.com/vatesfr/xo-web/issues/1387)
- New Host assistant [\#1374](https://github.com/vatesfr/xo-web/issues/1374)
- New VM assistant [\#1373](https://github.com/vatesfr/xo-web/issues/1373)
- New SR assistant [\#1372](https://github.com/vatesfr/xo-web/issues/1372)
- Direct access to VDI listing from dashboard's SR usage breakdown [\#1371](https://github.com/vatesfr/xo-web/issues/1371)
- Can't set a network name at pool level [\#1368](https://github.com/vatesfr/xo-web/issues/1368)
- Change a few mouse over descriptions [\#1363](https://github.com/vatesfr/xo-web/issues/1363)
- Hide network install in VM create if template is HVM [\#1362](https://github.com/vatesfr/xo-web/issues/1362)
- SR space left during VM creation [\#1358](https://github.com/vatesfr/xo-web/issues/1358)
- Add destination SR on migration modal in VM view [\#1357](https://github.com/vatesfr/xo-web/issues/1357)
- Ability to create a new VM from a snapshot [\#1353](https://github.com/vatesfr/xo-web/issues/1353)
- Missing explanation/confirmation on Snapshot Page [\#1349](https://github.com/vatesfr/xo-web/issues/1349)
- Log view: expose API errors in the web UI [\#1344](https://github.com/vatesfr/xo-web/issues/1344)
- Registration on update page [\#1341](https://github.com/vatesfr/xo-web/issues/1341)
- Add export snapshot button [\#1336](https://github.com/vatesfr/xo-web/issues/1336)
- Use saved SSH keys in VM create CloudConfig [\#1319](https://github.com/vatesfr/xo-web/issues/1319)
- Collapse header in console view [\#1268](https://github.com/vatesfr/xo-web/issues/1268)
- Two max concurrent jobs in parallel [\#915](https://github.com/vatesfr/xo-web/issues/915)
- Handle OVA import via the web UI [\#709](https://github.com/vatesfr/xo-web/issues/709)

### Bug fixes

- Bug on VM console when header is hidden [\#1485](https://github.com/vatesfr/xo-web/issues/1485)
- Disks not removed when deleting multiple VMs [\#1484](https://github.com/vatesfr/xo-web/issues/1484)
- Do not display VDI disconnect button when a VM is not running [\#1470](https://github.com/vatesfr/xo-web/issues/1470)
- Do not display VIF disconnect button when a VM is not running [\#1468](https://github.com/vatesfr/xo-web/issues/1468)
- Error on migration if no default SR \(even when not used\) [\#1466](https://github.com/vatesfr/xo-web/issues/1466)
- DR issue while rotating old backup [\#1464](https://github.com/vatesfr/xo-web/issues/1464)
- Giving resource set to end-user ends with error [\#1448](https://github.com/vatesfr/xo-web/issues/1448)
- Error thrown when cancelling out of Delete User confirmation dialog [\#1439](https://github.com/vatesfr/xo-web/issues/1439)
- Wrong month label shown in Backup and Job scheduler [\#1438](https://github.com/vatesfr/xo-web/issues/1438)
- Bug on Self service creation/edition [\#1428](https://github.com/vatesfr/xo-web/issues/1428)
- ISO selection during VM create is not mounted after [\#1415](https://github.com/vatesfr/xo-web/issues/1415)
- Hosts general view: bad link for storage [\#1408](https://github.com/vatesfr/xo-web/issues/1408)
- Backup Schedule - "Month" and "Day of Week" display error [\#1404](https://github.com/vatesfr/xo-web/issues/1404)
- Migrate dialog doesn't present all available VIF's in new UI interface [\#1403](https://github.com/vatesfr/xo-web/issues/1403)
- NFS mount issues [\#1396](https://github.com/vatesfr/xo-web/issues/1396)
- Select component color [\#1391](https://github.com/vatesfr/xo-web/issues/1391)
- SR created with local path shouldn't be shared [\#1389](https://github.com/vatesfr/xo-web/issues/1389)
- Disks (VBD) are attached to VM in RO mode instead of RW even if RO is unchecked [\#1386](https://github.com/vatesfr/xo-web/issues/1386)
- Re-connection issues between server and XS hosts [\#1384](https://github.com/vatesfr/xo-web/issues/1384)
- Meter object style with Chrome 52 [\#1383](https://github.com/vatesfr/xo-web/issues/1383)
- Editing a rolling snapshot job seems to fail [\#1376](https://github.com/vatesfr/xo-web/issues/1376)
- Dashboard SR usage and total inverted [\#1370](https://github.com/vatesfr/xo-web/issues/1370)
- XenServer connection issue with host while using VGPUs [\#1369](https://github.com/vatesfr/xo-web/issues/1369)
- Job created with v4 are not correctly displayed in v5 [\#1366](https://github.com/vatesfr/xo-web/issues/1366)
- CPU accounting in resource set [\#1365](https://github.com/vatesfr/xo-web/issues/1365)
- Tooltip stay displayed when a button change state [\#1360](https://github.com/vatesfr/xo-web/issues/1360)
- Failure on host reboot [\#1351](https://github.com/vatesfr/xo-web/issues/1351)
- Editing Backup Jobs Without Compression, Slider Always Set To On [\#1339](https://github.com/vatesfr/xo-web/issues/1339)
- Month Selection on Backup Screen Wrong [\#1338](https://github.com/vatesfr/xo-web/issues/1338)
- Delta backup fail when removed VDIs [\#1333](https://github.com/vatesfr/xo-web/issues/1333)

## **5.1.0** (2016-07-26)

### Enhancements

- Improve backups timezone UI [\#1314](https://github.com/vatesfr/xo-web/issues/1314)
- HOME view submenus [\#1306](https://github.com/vatesfr/xo-web/issues/1306)
- Ability for a user to save SSH keys [\#1299](https://github.com/vatesfr/xo-web/issues/1299)
- \[ACLs\] Ability to select all hosts/VMs [\#1296](https://github.com/vatesfr/xo-web/issues/1296)
- Improve scheduling UI [\#1295](https://github.com/vatesfr/xo-web/issues/1295)
- Plugins: Predefined configurations [\#1289](https://github.com/vatesfr/xo-web/issues/1289)
- Button to recompute resource sets limits [\#1287](https://github.com/vatesfr/xo-web/issues/1287)
- Credit scheduler CAP and weight configuration [\#1283](https://github.com/vatesfr/xo-web/issues/1283)
- Migration form problem on the /v5/vms/\_\_UUID\_\_ page when doing xenmotion inside a pool [\#1254](https://github.com/vatesfr/xo-web/issues/1254)
- /v5/\#/pools/\_\_UUID\_\_: patch table improvement  [\#1246](https://github.com/vatesfr/xo-web/issues/1246)
- /v5/\#/hosts/\_\_UUID\_\_: patch list improvements ? [\#1245](https://github.com/vatesfr/xo-web/issues/1245)
- F\*cking patches, how do they work? [\#1236](https://github.com/vatesfr/xo-web/issues/1236)
- Change Default Filter [\#1235](https://github.com/vatesfr/xo-web/issues/1235)
- Add a property on jobs to know their state [\#1232](https://github.com/vatesfr/xo-web/issues/1232)
- Spanish translation [\#1231](https://github.com/vatesfr/xo-web/issues/1231)
- Home: "Filter" input and keyboard focus [\#1228](https://github.com/vatesfr/xo-web/issues/1228)
- Display xenserver version [\#1225](https://github.com/vatesfr/xo-web/issues/1225)
- Plugin config: presets & defaults [\#1222](https://github.com/vatesfr/xo-web/issues/1222)
- Allow halted VM migration [\#1216](https://github.com/vatesfr/xo-web/issues/1216)
- Missing confirm dialog on critical button [\#1211](https://github.com/vatesfr/xo-web/issues/1211)
- Backup logs are not sortable [\#1196](https://github.com/vatesfr/xo-web/issues/1196)
- Page title with the name of current object [\#1185](https://github.com/vatesfr/xo-web/issues/1185)
- Existing VIF management [\#1176](https://github.com/vatesfr/xo-web/issues/1176)
- Do not display fast clone option is there isn't template disks [\#1172](https://github.com/vatesfr/xo-web/issues/1172)
- UI issue when adding a user [\#1159](https://github.com/vatesfr/xo-web/issues/1159)
- Combined values on stats [\#1158](https://github.com/vatesfr/xo-web/issues/1158)
- Parallel coordinates graph [\#1157](https://github.com/vatesfr/xo-web/issues/1157)
- VM creation on self-service as user [\#1155](https://github.com/vatesfr/xo-web/issues/1155)
- VM copy bulk action on home view [\#1154](https://github.com/vatesfr/xo-web/issues/1154)
- Better VDI map [\#1151](https://github.com/vatesfr/xo-web/issues/1151)
- Missing tooltips on buttons [\#1150](https://github.com/vatesfr/xo-web/issues/1150)
- Patching from pool view [\#1149](https://github.com/vatesfr/xo-web/issues/1149)
- Missing patches in dashboard [\#1148](https://github.com/vatesfr/xo-web/issues/1148)
- Improve tasks view [\#1147](https://github.com/vatesfr/xo-web/issues/1147)
- Home bulk VM migration [\#1146](https://github.com/vatesfr/xo-web/issues/1146)
- LDAP plugin clear password field [\#1145](https://github.com/vatesfr/xo-web/issues/1145)
- Cron default behavior [\#1144](https://github.com/vatesfr/xo-web/issues/1144)
- Modal for migrate on home [\#1143](https://github.com/vatesfr/xo-web/issues/1143)
- /v5/\#/srs/\_\_UUID\_\_: UI improvements [\#1142](https://github.com/vatesfr/xo-web/issues/1142)
- /v5/\#/pools/: some name should be links [\#1141](https://github.com/vatesfr/xo-web/issues/1141)
- create the page /v5/\#/pools/ [\#1140](https://github.com/vatesfr/xo-web/issues/1140)
- Dashboard: add links to different part of XOA [\#1139](https://github.com/vatesfr/xo-web/issues/1139)
- /v5/\#/dashboard/overview: add link on the "Top 5 SR Usage" graph [\#1135](https://github.com/vatesfr/xo-web/issues/1135)
- /v5/\#/backup/overview: display the error when there is one returned by xenserver on failed job. [\#1134](https://github.com/vatesfr/xo-web/issues/1134)
- /v5/: add an option to set the number of element displayed in tables [\#1133](https://github.com/vatesfr/xo-web/issues/1133)
- Updater refresh page after update [\#1131](https://github.com/vatesfr/xo-web/issues/1131)
- /v5/\#/settings/plugins [\#1130](https://github.com/vatesfr/xo-web/issues/1130)
- /v5/\#/new/sr: layout issue [\#1129](https://github.com/vatesfr/xo-web/issues/1129)
- v5 /v5/\#/vms/new: layout issue [\#1128](https://github.com/vatesfr/xo-web/issues/1128)
- v5 user page missing style [\#1127](https://github.com/vatesfr/xo-web/issues/1127)
- Remote helper/tester [\#1075](https://github.com/vatesfr/xo-web/issues/1075)
- Generate uiSchema from custom schema properties [\#951](https://github.com/vatesfr/xo-web/issues/951)
- Customizing VM names generation during batch creation [\#949](https://github.com/vatesfr/xo-web/issues/949)

### Bug fixes

- Plugins: Don't use `default` attributes in presets list [\#1288](https://github.com/vatesfr/xo-web/issues/1288)
- CPU weight must be an integer [\#1286](https://github.com/vatesfr/xo-web/issues/1286)
- Overview of self service is always empty [\#1282](https://github.com/vatesfr/xo-web/issues/1282)
- SR attach/creation issue [\#1281](https://github.com/vatesfr/xo-web/issues/1281)
- Self service resources not modified after a VM deletion [\#1276](https://github.com/vatesfr/xo-web/issues/1276)
- Scheduled jobs seems use GMT since 5.0 [\#1258](https://github.com/vatesfr/xo-web/issues/1258)
- Can't create a VM with disks on 2 different SRs [\#1257](https://github.com/vatesfr/xo-web/issues/1257)
- Graph display bug [\#1247](https://github.com/vatesfr/xo-web/issues/1247)
- /v5/#/hosts/__UUID__: Patch list not limited to the current pool [\#1244](https://github.com/vatesfr/xo-web/issues/1244)
- Replication issues [\#1233](https://github.com/vatesfr/xo-web/issues/1233)
- VM creation install method disabled fields [\#1198](https://github.com/vatesfr/xo-web/issues/1198)
- Update icon shouldn't be displayed when menu is collapsed [\#1188](https://github.com/vatesfr/xo-web/issues/1188)
- /v5/ : Load average graph axis issue [\#1167](https://github.com/vatesfr/xo-web/issues/1167)
- Some remote can't be opened [\#1164](https://github.com/vatesfr/xo-web/issues/1164)
- Bulk action for hosts in home and pool view [\#1153](https://github.com/vatesfr/xo-web/issues/1153)
- New Vif [\#1138](https://github.com/vatesfr/xo-web/issues/1138)
- Missing SRs [\#1123](https://github.com/vatesfr/xo-web/issues/1123)
- Continuous replication email alert does not obey per job setting [\#1121](https://github.com/vatesfr/xo-web/issues/1121)
- Safari XO5 issue [\#1120](https://github.com/vatesfr/xo-web/issues/1120)
- ACLs shoud be available in Enterprise Edition [\#1118](https://github.com/vatesfr/xo-web/issues/1118)
- SR edit name or description doesn't work [\#1116](https://github.com/vatesfr/xo-web/issues/1116)
- Bad RRD parsing for VIFs [\#969](https://github.com/vatesfr/xo-web/issues/969)

## **5.0.0** (2016-06-24)

### Enhancements

- Handle failed quiesce in snapshots [\#1088](https://github.com/vatesfr/xo-web/issues/1088)
- Sparklines stats [\#1061](https://github.com/vatesfr/xo-web/issues/1061)
- Task view [\#1060](https://github.com/vatesfr/xo-web/issues/1060)
- Improved import system [\#1048](https://github.com/vatesfr/xo-web/issues/1048)
- Backup restore view improvements [\#1021](https://github.com/vatesfr/xo-web/issues/1021)
- Restore VM - Wrong VLAN on the VMs interface [\#1016](https://github.com/vatesfr/xo-web/issues/1016)
- Fast Disk Cloning [\#960](https://github.com/vatesfr/xo-web/issues/960)
- Disaster recovery job should target SRs, not pools [\#955](https://github.com/vatesfr/xo-web/issues/955)
- Improve Header/Content interaction in a page [\#926](https://github.com/vatesfr/xo-web/issues/926)
- New default view [\#912](https://github.com/vatesfr/xo-web/issues/912)
- Xen Patching - Restart Pending [\#883](https://github.com/vatesfr/xo-web/issues/883)
- Hide About page for user that are not admin [\#877](https://github.com/vatesfr/xo-web/issues/877)
- ACL: Ability to view/sort/group by User/Group, Objects or Role [\#875](https://github.com/vatesfr/xo-web/issues/875)
- ACL: Ability to select multiple users & group when creating a rule [\#874](https://github.com/vatesfr/xo-web/issues/874)
- Translation [\#839](https://github.com/vatesfr/xo-web/issues/839)
- XO offer useless network interfaces for XenMontion [\#833](https://github.com/vatesfr/xo-web/issues/833)
- Show HVM, PVM, PVHVM modes in guest details [\#806](https://github.com/vatesfr/xo-web/issues/806)
- Tree view: display cpu available/total for each host [\#696](https://github.com/vatesfr/xo-web/issues/696)
- Greenkeeper integration [\#667](https://github.com/vatesfr/xo-web/issues/667)
- Clarify vCPUs and RAM editor  [\#658](https://github.com/vatesfr/xo-web/issues/658)
- Backup LZ4 compression [\#647](https://github.com/vatesfr/xo-web/issues/647)
- Support enum in plugins configuration [\#638](https://github.com/vatesfr/xo-web/issues/638)
- Add configuration option to disable xoa-updater  [\#535](https://github.com/vatesfr/xo-web/issues/535)
- Use cursors to add more context to actions [\#523](https://github.com/vatesfr/xo-web/issues/523)
- Review UI for flat view [\#354](https://github.com/vatesfr/xo-web/issues/354)
- Review UI for the tree view [\#353](https://github.com/vatesfr/xo-web/issues/353)
- Tag filtering [\#233](https://github.com/vatesfr/xo-web/issues/233)
- GUI review [\#230](https://github.com/vatesfr/xo-web/issues/230)
- Review UI for VM creation [\#214](https://github.com/vatesfr/xo-web/issues/214)
- Ability to collapse pools/hosts in main view [\#173](https://github.com/vatesfr/xo-web/issues/173)
- Issue importing .xva VM via xo-web [\#1022](https://github.com/vatesfr/xo-web/issues/1022)
- Enhancement Proposal - Cancel In Progress Backups [\#1003](https://github.com/vatesfr/xo-web/issues/1003)
- Can't create VM with  CloudConfigDrive [\#917](https://github.com/vatesfr/xo-web/issues/917)
- Auth: LDAP User causes problems [\#893](https://github.com/vatesfr/xo-web/issues/893)
- No tags in Continuous Replication [\#838](https://github.com/vatesfr/xo-web/issues/838)
- Delta backup Depth not working [\#802](https://github.com/vatesfr/xo-web/issues/802)
- Update Section - Running version info missing - gui enhancement [\#795](https://github.com/vatesfr/xo-web/issues/795)
- On reboot, vnc console wrongly scaled [\#722](https://github.com/vatesfr/xo-web/issues/722)
- Make the object name \(title\) "sticky" at the top of the page [\#705](https://github.com/vatesfr/xo-web/issues/705)
- pool view: display Local SR from hosts in the current pool [\#692](https://github.com/vatesfr/xo-web/issues/692)
- tree view: display all IPs [\#689](https://github.com/vatesfr/xo-web/issues/689)
- XO5 parallel distribution [\#462](https://github.com/vatesfr/xo-web/issues/462)
- Load balancing with XO [\#423](https://github.com/vatesfr/xo-web/issues/423)

### Bug fixes

- vCPUs number when no tools installed [\#1089](https://github.com/vatesfr/xo-web/issues/1089)
- Config Drive textbox disappears when content is deleted [\#1012](https://github.com/vatesfr/xo-web/issues/1012)
- storage status not changed in host view page after disconnect/connect  [\#1009](https://github.com/vatesfr/xo-web/issues/1009)
- Cannot Delete Logs From Backup Overview [\#1004](https://github.com/vatesfr/xo-web/issues/1004)
- \[v5.x\] Plugins configuration: optional non-used objects are sent [\#1000](https://github.com/vatesfr/xo-web/issues/1000)
- "@" char in remote password break the remote view [\#997](https://github.com/vatesfr/xo-web/issues/997)
- Handle MEMORY\_CONSTRAINT\_VIOLATION correctly [\#970](https://github.com/vatesfr/xo-web/issues/970)
- VM creation error on XenServer Dundee [\#964](https://github.com/vatesfr/xo-web/issues/964)
- Copy VMs doesn't display all SRs [\#945](https://github.com/vatesfr/xo-web/issues/945)
- Autopower\_on wrong value [\#937](https://github.com/vatesfr/xo-web/issues/937)
- Correctly handle unknown users in group view [\#900](https://github.com/vatesfr/xo-web/issues/900)
- Importing into Dundee [\#887](https://github.com/vatesfr/xo-web/issues/887)
- update status - gui resize issue [\#803](https://github.com/vatesfr/xo-web/issues/803)
- Backup Remote Stores Problem [\#751](https://github.com/vatesfr/xo-web/issues/751)
- VM view is broken when changing a disk SR twice [\#670](https://github.com/vatesfr/xo-web/issues/670)
- console mouse sync  [\#280](https://github.com/vatesfr/xo-web/issues/280)

## **4.16.0** (2016-04-29)

Maintenance release

### Enhancements

- TOO\_MANY\_PENDING\_TASKS [\#861](https://github.com/vatesfr/xo-web/issues/861)

### Bug fixes

- Incorrect VM target name with continuous replication [\#904](https://github.com/vatesfr/xo-web/issues/904)
- Error while deleting users [\#901](https://github.com/vatesfr/xo-web/issues/901)
- Use an available path to the SR to create a config drive [\#882](https://github.com/vatesfr/xo-web/issues/882)
- VM autoboot don't set the right pool parameter [\#879](https://github.com/vatesfr/xo-web/issues/879)
- BUG: ACL with NFS ISO Library not working! [\#870](https://github.com/vatesfr/xo-web/issues/870)
- Broken paths in backups in SMB [\#865](https://github.com/vatesfr/xo-web/issues/865)
- Plugins page loads users/groups multiple times [\#829](https://github.com/vatesfr/xo-web/issues/829)
- "Ghost" VM remains after migration [\#769](https://github.com/vatesfr/xo-web/issues/769)

## **4.15.0** (2016-03-21)

Load balancing, SMB delta support, advanced network operations...

### Enhancements

- Add the job name inside the backup email report [\#819](https://github.com/vatesfr/xo-web/issues/819)
- Delta backup with quiesce [\#812](https://github.com/vatesfr/xo-web/issues/812)
- Hosts: No user feedback when error occurs with SR connect / disconnect [\#810](https://github.com/vatesfr/xo-web/issues/810)
- Expose components versions [\#807](https://github.com/vatesfr/xo-web/issues/807)
- Rework networks/PIFs management [\#805](https://github.com/vatesfr/xo-web/issues/805)
- Displaying all SRs and a list of available hosts for creating VM from a pool [\#790](https://github.com/vatesfr/xo-web/issues/790)
- Add "Source network" on "VM migration" screen [\#785](https://github.com/vatesfr/xo-web/issues/785)
- Migration queue [\#783](https://github.com/vatesfr/xo-web/issues/783)
- Match network names for VM migration [\#782](https://github.com/vatesfr/xo-web/issues/782)
- Disk names [\#780](https://github.com/vatesfr/xo-web/issues/780)
- Self service: should the user be able to set the CPU weight? [\#767](https://github.com/vatesfr/xo-web/issues/767)
- host & pool Citrix license status [\#763](https://github.com/vatesfr/xo-web/issues/763)
- pool view: Provide "updates" section [\#762](https://github.com/vatesfr/xo-web/issues/762)
- XOA ISO image: ambigious root disk label [\#761](https://github.com/vatesfr/xo-web/issues/761)
- Host info: provide system serial number [\#760](https://github.com/vatesfr/xo-web/issues/760)
- CIFS ISO SR Creation [\#731](https://github.com/vatesfr/xo-web/issues/731)
- MAC address not preserved on VM restore [\#707](https://github.com/vatesfr/xo-web/issues/707)
- Failing replication job should send reports [\#659](https://github.com/vatesfr/xo-web/issues/659)
- Display networks in the Pool view [\#226](https://github.com/vatesfr/xo-web/issues/226)

### Bug fixes

- Broken link to backup remote  [\#821](https://github.com/vatesfr/xo-web/issues/821)
- Issue with self-signed cert for email plugin [\#817](https://github.com/vatesfr/xo-web/issues/817)
- Plugins view, reset form and errors [\#815](https://github.com/vatesfr/xo-web/issues/815)
- HVM recovery mode is broken [\#794](https://github.com/vatesfr/xo-web/issues/794)
- Disk bug when creating vm from template [\#778](https://github.com/vatesfr/xo-web/issues/778)
- Can't mount NFS shares in remote stores [\#775](https://github.com/vatesfr/xo-web/issues/775)
- VM disk name and description not passed during creation [\#774](https://github.com/vatesfr/xo-web/issues/774)
- NFS mount problem for Windows share [\#771](https://github.com/vatesfr/xo-web/issues/771)
- lodash.pluck not installed [\#757](https://github.com/vatesfr/xo-web/issues/757)
- this.\_getAuthenticationTokensForUser is not a function [\#755](https://github.com/vatesfr/xo-web/issues/755)
- CentOS 6.x 64bit template creates a VM that won't boot [\#733](https://github.com/vatesfr/xo-web/issues/733)
- Lot of xo:perf leading to XO crash [\#575](https://github.com/vatesfr/xo-web/issues/575)
- New collection checklist [\#262](https://github.com/vatesfr/xo-web/issues/262)

## **4.14.0** (2016-02-23)

Self service, custom CloudInit...

### Enhancements

- VM creation self service with quotas [\#285](https://github.com/vatesfr/xo-web/issues/285)
- Cloud config custom user data [\#706](https://github.com/vatesfr/xo-web/issues/706)
- Patches behind a proxy [\#737](https://github.com/vatesfr/xo-web/issues/737)
- Remote store status indicator [\#728](https://github.com/vatesfr/xo-web/issues/728)
- Patch list order [\#724](https://github.com/vatesfr/xo-web/issues/724)
- Enable reporting on additional backup types [\#717](https://github.com/vatesfr/xo-web/issues/717)
- Tooltip name for cancel [\#703](https://github.com/vatesfr/xo-web/issues/703)
- Portable VHD merging [\#646](https://github.com/vatesfr/xo-web/issues/646)

### Bug fixes

- Avoid merge between two delta vdi backups [\#702](https://github.com/vatesfr/xo-web/issues/702)
- Text in table is not cut anymore [\#713](https://github.com/vatesfr/xo-web/issues/713)
- Disk size edition issue with float numbers [\#719](https://github.com/vatesfr/xo-web/issues/719)
- Create vm, summary is not refreshed [\#721](https://github.com/vatesfr/xo-web/issues/721)
- Boot order problem [\#726](https://github.com/vatesfr/xo-web/issues/726)

## **4.13.0** (2016-02-05)

Backup checksum, SMB remotes...

### Enhancements

- Add SMB mount for remote [\#338](https://github.com/vatesfr/xo-web/issues/338)
- Centralize Perm in a lib [\#345](https://github.com/vatesfr/xo-web/issues/345)
- Expose interpool migration details [\#567](https://github.com/vatesfr/xo-web/issues/567)
- Add checksum for delta backup [\#617](https://github.com/vatesfr/xo-web/issues/617)
- Redirect from HTTP to HTTPS [\#626](https://github.com/vatesfr/xo-web/issues/626)
- Expose vCPU weight [\#633](https://github.com/vatesfr/xo-web/issues/633)
- Avoid metadata in delta backup [\#651](https://github.com/vatesfr/xo-web/issues/651)
- Button to clear logs [\#661](https://github.com/vatesfr/xo-web/issues/661)
- Units for RAM and disks [\#666](https://github.com/vatesfr/xo-web/issues/666)
- Remove multiple VDIs at once [\#676](https://github.com/vatesfr/xo-web/issues/676)
- Find orphaned VDI snapshots [\#679](https://github.com/vatesfr/xo-web/issues/679)
- New health view in Dashboard [\#680](https://github.com/vatesfr/xo-web/issues/680)
- Use physical usage for VDI and SR [\#682](https://github.com/vatesfr/xo-web/issues/682)
- TLS configuration [\#685](https://github.com/vatesfr/xo-web/issues/685)
- Better VM info on tree view [\#688](https://github.com/vatesfr/xo-web/issues/688)
- Absolute values in tooltips for tree view [\#690](https://github.com/vatesfr/xo-web/issues/690)
- Absolute values for host memory [\#691](https://github.com/vatesfr/xo-web/issues/691)

### Bug fixes

- Issues on host console screen [\#672](https://github.com/vatesfr/xo-web/issues/672)
- NFS remote mount fails in particular case [\#665](https://github.com/vatesfr/xo-web/issues/665)
- Unresponsive pages [\#662](https://github.com/vatesfr/xo-web/issues/662)
- Live migration fail in the same pool with local SR fails [\#655](https://github.com/vatesfr/xo-web/issues/655)

## **4.12.0** (2016-01-18)

Continuous Replication, Continuous Delta backup...

### Enhancements

- Continuous VM replication [\#582](https://github.com/vatesfr/xo-web/issues/582)
- Continuous Delta Backup [\#576](https://github.com/vatesfr/xo-web/issues/576)
- Scheduler should not run job again if previous instance is not finished [\#642](https://github.com/vatesfr/xo-web/issues/642)
- Boot VM automatically after creation [\#635](https://github.com/vatesfr/xo-web/issues/635)
- Manage existing VIFs in templates [\#630](https://github.com/vatesfr/xo-web/issues/630)
- Support templates with existing install repository [\#627](https://github.com/vatesfr/xo-web/issues/627)
- Remove running VMs [\#616](https://github.com/vatesfr/xo-web/issues/616)
- Prevent a VM to start before delta import is finished [\#613](https://github.com/vatesfr/xo-web/issues/613)
- Spawn multiple VMs at once [\#606](https://github.com/vatesfr/xo-web/issues/606)
- Fixed `suspendVM` in tree view. [\#619](https://github.com/vatesfr/xo-web/pull/619) ([pdonias](https://github.com/pdonias))

### Bug fixes

- User defined MAC address is not fetch in VM install [\#643](https://github.com/vatesfr/xo-web/issues/643)
- CoreOsCloudConfig is not shown with CoreOS [\#639](https://github.com/vatesfr/xo-web/issues/639)
- Plugin activation/deactivation in web UI seems broken [\#637](https://github.com/vatesfr/xo-web/issues/637)
- Issue when creating CloudConfig drive [\#636](https://github.com/vatesfr/xo-web/issues/636)
- CloudConfig hostname shouldn't have space [\#634](https://github.com/vatesfr/xo-web/issues/634)
- Cloned VIFs are not properly deleted on VM creation [\#632](https://github.com/vatesfr/xo-web/issues/632)
- Default PV args missing during VM creation [\#628](https://github.com/vatesfr/xo-web/issues/628)
- VM creation problems from custom templates [\#625](https://github.com/vatesfr/xo-web/issues/625)
- Emergency shutdown race condition [\#622](https://github.com/vatesfr/xo-web/issues/622)
- `vm.delete\(\)` should not delete VDIs attached to other VMs [\#621](https://github.com/vatesfr/xo-web/issues/621)
- VM creation error from template with a disk [\#581](https://github.com/vatesfr/xo-web/issues/581)
- Only delete VDI exports when VM backup is successful [\#644](https://github.com/vatesfr/xo-web/issues/644)
- Change the name of an imported VM during the import process [\#641](https://github.com/vatesfr/xo-web/issues/641)
- Creating a new VIF in view is partially broken [\#652](https://github.com/vatesfr/xo-web/issues/652)
- Grey out the "create button" during VM creation [\#654](https://github.com/vatesfr/xo-web/issues/654)

## **4.11.0** (2015-12-22)

Delta backup, CloudInit...

### Enhancements

- Visible list of SR inside a VM [\#601](https://github.com/vatesfr/xo-web/issues/601)
- VDI move [\#591](https://github.com/vatesfr/xo-web/issues/591)
- Edit pre-existing disk configuration during VM creation [\#589](https://github.com/vatesfr/xo-web/issues/589)
- Allow disk size edition [\#587](https://github.com/vatesfr/xo-web/issues/587)
- Better VDI resize support [\#585](https://github.com/vatesfr/xo-web/issues/585)
- Remove manual VM export metadata in UI [\#580](https://github.com/vatesfr/xo-web/issues/580)
- Support import VM metadata [\#579](https://github.com/vatesfr/xo-web/issues/579)
- Set a default pool SR [\#572](https://github.com/vatesfr/xo-web/issues/572)
- ISOs should be sorted by name [\#565](https://github.com/vatesfr/xo-web/issues/565)
- Button to boot a VM from a disc once [\#564](https://github.com/vatesfr/xo-web/issues/564)
- Ability to boot a PV VM from a disc [\#563](https://github.com/vatesfr/xo-web/issues/563)
- Add an option to manually run backup jobs [\#562](https://github.com/vatesfr/xo-web/issues/562)
- backups to unmounted storage [\#561](https://github.com/vatesfr/xo-web/issues/561)
- Root integer properties cannot be edited in plugins configuration form [\#550](https://github.com/vatesfr/xo-web/issues/550)
- Generic CloudConfig drive [\#549](https://github.com/vatesfr/xo-web/issues/549)
- Auto-discovery of installed xo-server plugins [\#546](https://github.com/vatesfr/xo-web/issues/546)
- Hide info on flat view [\#545](https://github.com/vatesfr/xo-web/issues/545)
- Config plugin boolean properties must have a default value \(undefined prohibited\) [\#543](https://github.com/vatesfr/xo-web/issues/543)
- Present detailed errors on plugin configuration failures [\#530](https://github.com/vatesfr/xo-web/issues/530)
- Do not reset form on failures in plugins configuration [\#529](https://github.com/vatesfr/xo-web/issues/529)
- XMPP alert plugin [\#518](https://github.com/vatesfr/xo-web/issues/518)
- Hide tag adders depending on ACLs [\#516](https://github.com/vatesfr/xo-web/issues/516)
- Choosing a framework for xo-web 5 [\#514](https://github.com/vatesfr/xo-web/issues/514)
- Prevent adding a host in an existing XAPI connection [\#466](https://github.com/vatesfr/xo-web/issues/466)
- Read only connection to Xen servers/pools [\#439](https://github.com/vatesfr/xo-web/issues/439)
- generic notification system [\#391](https://github.com/vatesfr/xo-web/issues/391)
- Data architecture review [\#384](https://github.com/vatesfr/xo-web/issues/384)
- Make filtering easier to understand/add some "default" filters [\#207](https://github.com/vatesfr/xo-web/issues/207)
- Improve performance [\#148](https://github.com/vatesfr/xo-web/issues/148)

### Bug fixes

- VM metadata export should not require a snapshot [\#615](https://github.com/vatesfr/xo-web/issues/615)
- Missing patch for all hosts is continuously refreshed [\#609](https://github.com/vatesfr/xo-web/issues/609)
- Backup import memory issue [\#608](https://github.com/vatesfr/xo-web/issues/608)
- Host list missing patch is buggy [\#604](https://github.com/vatesfr/xo-web/issues/604)
- Servers infos should not been refreshed while a field is being edited [\#595](https://github.com/vatesfr/xo-web/issues/595)
- Servers list should not been re-order while a field is being edited [\#594](https://github.com/vatesfr/xo-web/issues/594)
- Correctly display size in interface \(binary scale\) [\#592](https://github.com/vatesfr/xo-web/issues/592)
- Display failures on VM boot order modification [\#560](https://github.com/vatesfr/xo-web/issues/560)
- `vm.setBootOrder\(\)` should throw errors on failures \(non-HVM VMs\) [\#559](https://github.com/vatesfr/xo-web/issues/559)
- Hide boot order form for non-HVM VMs [\#558](https://github.com/vatesfr/xo-web/issues/558)
- Allow editing PV args even when empty \(but only for PV VMs\) [\#557](https://github.com/vatesfr/xo-web/issues/557)
- Crashes when using legacy event system [\#556](https://github.com/vatesfr/xo-web/issues/556)
- XenServer patches check error for 6.1 [\#555](https://github.com/vatesfr/xo-web/issues/555)
- activation plugin xo-server-transport-email  [\#553](https://github.com/vatesfr/xo-web/issues/553)
- Server error with JSON on 32 bits Dom0 [\#552](https://github.com/vatesfr/xo-web/issues/552)
- Cloud Config drive shouldn't be created on default SR [\#548](https://github.com/vatesfr/xo-web/issues/548)
- Deep properties cannot be edited in plugins configuration form [\#521](https://github.com/vatesfr/xo-web/issues/521)
- Aborted VM export should cancel the operation [\#490](https://github.com/vatesfr/xo-web/issues/490)
- VM missing with same UUID after an inter-pool migration [\#284](https://github.com/vatesfr/xo-web/issues/284)

## **4.10.0** (2015-11-27)

Job management, email notifications, CoreOS/Docker, Quiesce snapshots...

### Enhancements

- Job management ([xo-web#487](https://github.com/vatesfr/xo-web/issues/487))
- Patch upload on all connected servers ([xo-web#168](https://github.com/vatesfr/xo-web/issues/168))
- Emergency shutdown ([xo-web#185](https://github.com/vatesfr/xo-web/issues/185))
- CoreOS/docker template install ([xo-web#246](https://github.com/vatesfr/xo-web/issues/246))
- Email for backups ([xo-web#308](https://github.com/vatesfr/xo-web/issues/308))
- Console Clipboard ([xo-web#408](https://github.com/vatesfr/xo-web/issues/408))
- Logs from CLI ([xo-web#486](https://github.com/vatesfr/xo-web/issues/486))
- Save disconnected servers ([xo-web#489](https://github.com/vatesfr/xo-web/issues/489))
- Snapshot with quiesce ([xo-web#491](https://github.com/vatesfr/xo-web/issues/491))
- Start VM in reovery mode ([xo-web#495](https://github.com/vatesfr/xo-web/issues/495))
- Username in logs ([xo-web#498](https://github.com/vatesfr/xo-web/issues/498))
- Delete associated tokens with user ([xo-web#500](https://github.com/vatesfr/xo-web/issues/500))
- Validate plugin configuration ([xo-web#503](https://github.com/vatesfr/xo-web/issues/503))
- Avoid non configured plugins to be loaded ([xo-web#504](https://github.com/vatesfr/xo-web/issues/504))
- Verbose API logs if configured ([xo-web#505](https://github.com/vatesfr/xo-web/issues/505))
- Better backup overview ([xo-web#512](https://github.com/vatesfr/xo-web/issues/512))
- VM auto power on ([xo-web#519](https://github.com/vatesfr/xo-web/issues/519))
- Title property supported in config schema ([xo-web#522](https://github.com/vatesfr/xo-web/issues/522))
- Start VM export only when necessary ([xo-web#534](https://github.com/vatesfr/xo-web/issues/534))
- Input type should be number ([xo-web#538](https://github.com/vatesfr/xo-web/issues/538))

### Bug fixes

- Numbers/int support in plugins config ([xo-web#531](https://github.com/vatesfr/xo-web/issues/531))
- Boolean support in plugins config ([xo-web#528](https://github.com/vatesfr/xo-web/issues/528))
- Keyboard unusable outside console ([xo-web#513](https://github.com/vatesfr/xo-web/issues/513))
- UsernameField for SAML ([xo-web#513](https://github.com/vatesfr/xo-web/issues/513))
- Wrong display of "no plugin found" ([xo-web#508](https://github.com/vatesfr/xo-web/issues/508))
- Bower build error ([xo-web#488](https://github.com/vatesfr/xo-web/issues/488))
- VM cloning should require SR permission ([xo-web#472](https://github.com/vatesfr/xo-web/issues/472))
- Xen tools status ([xo-web#471](https://github.com/vatesfr/xo-web/issues/471))
- Can't delete ghost user ([xo-web#464](https://github.com/vatesfr/xo-web/issues/464))
- Stats with old versions of Node ([xo-web#463](https://github.com/vatesfr/xo-web/issues/463))

## **4.9.0** (2015-11-13)

Automated DR, restore backup, VM copy

### Enhancements

- DR: schedule VM export on other host ([xo-web#447](https://github.com/vatesfr/xo-web/issues/447))
- Scheduler logs ([xo-web#390](https://github.com/vatesfr/xo-web/issues/390) and [xo-web#477](https://github.com/vatesfr/xo-web/issues/477))
- Restore backups ([xo-web#450](https://github.com/vatesfr/xo-web/issues/350))
- Disable backup compression ([xo-web#467](https://github.com/vatesfr/xo-web/issues/467))
- Copy VM to another SR (even remote) ([xo-web#475](https://github.com/vatesfr/xo-web/issues/475))
- VM stats without time sync ([xo-web#460](https://github.com/vatesfr/xo-web/issues/460))
- Stats perfs for high CPU numbers ([xo-web#461](https://github.com/vatesfr/xo-web/issues/461))

### Bug fixes

- Rolling backup bug ([xo-web#484](https://github.com/vatesfr/xo-web/issues/484))
- vCPUs/CPUs inversion in dashboard ([xo-web#481](https://github.com/vatesfr/xo-web/issues/481))
- Machine to template ([xo-web#459](https://github.com/vatesfr/xo-web/issues/459))

### Misc

- Console fix in XenServer ([xo-web#406](https://github.com/vatesfr/xo-web/issues/406))

## **4.8.0** (2015-10-29)

Fully automated patch system, ACLs inheritance, stats performance improved.

### Enhancements

- ACLs inheritance ([xo-web#279](https://github.com/vatesfr/xo-web/issues/279))
- Patch automatically all missing updates ([xo-web#281](https://github.com/vatesfr/xo-web/issues/281))
- Intelligent stats polling ([xo-web#432](https://github.com/vatesfr/xo-web/issues/432))
- Cache latest result of stats request ([xo-web#431](https://github.com/vatesfr/xo-web/issues/431))
- Improve stats polling on multiple objects ([xo-web#433](https://github.com/vatesfr/xo-web/issues/433))
- Patch upload task should display the patch name ([xo-web#449](https://github.com/vatesfr/xo-web/issues/449))
- Backup filename for Windows ([xo-web#448](https://github.com/vatesfr/xo-web/issues/448))
- Specific distro icons ([xo-web#446](https://github.com/vatesfr/xo-web/issues/446))
- PXE boot for HVM ([xo-web#436](https://github.com/vatesfr/xo-web/issues/436))
- Favicon display before sign in ([xo-web#428](https://github.com/vatesfr/xo-web/issues/428))
- Registration renewal ([xo-web#424](https://github.com/vatesfr/xo-web/issues/424))
- Reconnect to the host if pool merge fails ([xo-web#403](https://github.com/vatesfr/xo-web/issues/403))
- Avoid brute force login ([xo-web#339](https://github.com/vatesfr/xo-web/issues/339))
- Missing FreeBSD icon ([xo-web#136](https://github.com/vatesfr/xo-web/issues/136))
- Hide halted objects in the Health view ([xo-web#457](https://github.com/vatesfr/xo-web/issues/457))
- Click on "Remember me" label ([xo-web#438](https://github.com/vatesfr/xo-web/issues/438))

### Bug fixes

- Pool patches in multiple pools not displayed ([xo-web#442](https://github.com/vatesfr/xo-web/issues/442))
- VM Import crashes with Chrome ([xo-web#427](https://github.com/vatesfr/xo-web/issues/427))
- Cannot open a direct link ([xo-web#371](https://github.com/vatesfr/xo-web/issues/371))
- Patch display edge case ([xo-web#309](https://github.com/vatesfr/xo-web/issues/309))
- VM snapshot should require user permission on SR ([xo-web#429](https://github.com/vatesfr/xo-web/issues/429))

## **4.7.0** (2015-10-12)

Plugin config management and browser notifications.

### Enhancements

- Plugin management in the web interface ([xo-web#352](https://github.com/vatesfr/xo-web/issues/352))
- Browser notifications ([xo-web#402](https://github.com/vatesfr/xo-web/issues/402))
- Graph selector ([xo-web#400](https://github.com/vatesfr/xo-web/issues/400))
- Circle packing visualization ([xo-web#374](https://github.com/vatesfr/xo-web/issues/374))
- Password generation ([xo-web#397](https://github.com/vatesfr/xo-web/issues/397))
- Password reveal during user creation ([xo-web#396](https://github.com/vatesfr/xo-web/issues/396))
- Add host to a pool ([xo-web#62](https://github.com/vatesfr/xo-web/issues/62))
- Better modal when removing a host from a pool ([xo-web#405](https://github.com/vatesfr/xo-web/issues/405))
- Drop focus on CD/ISO selector ([xo-web#290](https://github.com/vatesfr/xo-web/issues/290))
- Allow non persistent session ([xo-web#243](https://github.com/vatesfr/xo-web/issues/243))

### Bug fixes

- VM export permission corrected ([xo-web#410](https://github.com/vatesfr/xo-web/issues/410))
- Proper host removal in a pool ([xo-web#402](https://github.com/vatesfr/xo-web/issues/402))
- Sub-optimal tooltip placement ([xo-web#421](https://github.com/vatesfr/xo-web/issues/421))
- VM migrate host incorrect target ([xo-web#419](https://github.com/vatesfr/xo-web/issues/419))
- Alone host can't leave its pool ([xo-web#414](https://github.com/vatesfr/xo-web/issues/414))

## **4.6.0** (2015-09-25)

Tags management and new visualization.

### Enhancements

- Multigraph for correlation ([xo-web#358](https://github.com/vatesfr/xo-web/issues/358))
- Tags management ([xo-web#367](https://github.com/vatesfr/xo-web/issues/367))
- Google Provider for authentication ([xo-web#363](https://github.com/vatesfr/xo-web/issues/363))
- Password change for users ([xo-web#362](https://github.com/vatesfr/xo-web/issues/362))
- Better live migration process ([xo-web#237](https://github.com/vatesfr/xo-web/issues/237))
- VDI search filter in SR view ([xo-web#222](https://github.com/vatesfr/xo-web/issues/222))
- PV args during VM creation ([xo-web#112](https://github.com/vatesfr/xo-web/issues/330))
- PV args management ([xo-web#394](https://github.com/vatesfr/xo-web/issues/394))
- Confirmation dialog on important actions ([xo-web#350](https://github.com/vatesfr/xo-web/issues/350))
- New favicon ([xo-web#369](https://github.com/vatesfr/xo-web/issues/369))
- Filename of VM for exports ([xo-web#370](https://github.com/vatesfr/xo-web/issues/370))
- ACLs rights edited on the fly ([xo-web#323](https://github.com/vatesfr/xo-web/issues/323))
- Heatmap values now human readable ([xo-web#342](https://github.com/vatesfr/xo-web/issues/342))

### Bug fixes

- Export backup fails if no tags specified ([xo-web#383](https://github.com/vatesfr/xo-web/issues/383))
- Wrong login give an obscure error message ([xo-web#373](https://github.com/vatesfr/xo-web/issues/373))
- Update view is broken during updates ([xo-web#356](https://github.com/vatesfr/xo-web/issues/356))
- Settings/dashboard menu incorrect display ([xo-web#357](https://github.com/vatesfr/xo-web/issues/357))
- Console View Not refreshing if the VM restart ([xo-web#107](https://github.com/vatesfr/xo-web/issues/107))

## **4.5.1** (2015-09-16)

An issue in `xo-web` with the VM view.

### Bug fix

- Attach disk/new disk/create interface is broken ([xo-web#378](https://github.com/vatesfr/xo-web/issues/378))

## **4.5.0** (2015-09-11)

A new dataviz (parallel coord), a new provider (GitHub) and faster consoles.

### Enhancements

- Parallel coordinates view ([xo-web#333](https://github.com/vatesfr/xo-web/issues/333))
- Faster consoles ([xo-web#337](https://github.com/vatesfr/xo-web/issues/337))
- Disable/hide button ([xo-web#268](https://github.com/vatesfr/xo-web/issues/268))
- More details on missing-guest-tools ([xo-web#304](https://github.com/vatesfr/xo-web/issues/304))
- Scheduler meta data export ([xo-web#315](https://github.com/vatesfr/xo-web/issues/315))
- Better heatmap ([xo-web#330](https://github.com/vatesfr/xo-web/issues/330))
- Faster dashboard ([xo-web#331](https://github.com/vatesfr/xo-web/issues/331))
- Faster sunburst ([xo-web#332](https://github.com/vatesfr/xo-web/issues/332))
- GitHub provider for auth ([xo-web#334](https://github.com/vatesfr/xo-web/issues/334))
- Filter networks for users ([xo-web#347](https://github.com/vatesfr/xo-web/issues/347))
- Add networks in ACLs ([xo-web#348](https://github.com/vatesfr/xo-web/issues/348))
- Better looking login page ([xo-web#341](https://github.com/vatesfr/xo-web/issues/341))
- Real time dataviz (dashboard) ([xo-web#349](https://github.com/vatesfr/xo-web/issues/349))

### Bug fixes

- Typo in dashboard ([xo-web#355](https://github.com/vatesfr/xo-web/issues/355))
- Global RAM usage fix ([xo-web#356](https://github.com/vatesfr/xo-web/issues/356))
- Re-allowing XO behind a reverse proxy ([xo-web#361](https://github.com/vatesfr/xo-web/issues/361))

## **4.4.0** (2015-08-28)

SSO and Dataviz are the main features for this release.

### Enhancements

- Dataviz storage usage ([xo-web#311](https://github.com/vatesfr/xo-web/issues/311))
- Heatmap in health view ([xo-web#329](https://github.com/vatesfr/xo-web/issues/329))
- SSO for SAML and other providers ([xo-web#327](https://github.com/vatesfr/xo-web/issues/327))
- Better UI for ACL objects attribution ([xo-web#320](https://github.com/vatesfr/xo-web/issues/320))
- Refresh the browser after an update ([xo-web#318](https://github.com/vatesfr/xo-web/issues/318))
- Clean CSS and Flexbox usage ([xo-web#239](https://github.com/vatesfr/xo-web/issues/239))

### Bug fixes

- Admin only accessible views ([xo-web#328](https://github.com/vatesfr/xo-web/issues/328))
- Hide "base copy" VDIs ([xo-web#324](https://github.com/vatesfr/xo-web/issues/324))
- ACLs on VIFs for non-admins ([xo-web#322](https://github.com/vatesfr/xo-web/issues/322))
- Updater display problems ([xo-web#313](https://github.com/vatesfr/xo-web/issues/313))

## **4.3.0** (2015-07-22)

Scheduler for rolling backups

### Enhancements

- Rolling backup scheduler ([xo-web#278](https://github.com/vatesfr/xo-web/issues/278))
- Clean snapshots of removed VMs ([xo-web#301](https://github.com/vatesfr/xo-web/issues/301))

### Bug fixes

- VM export ([xo-web#307](https://github.com/vatesfr/xo-web/issues/307))
- Remove VM VDIs ([xo-web#303](https://github.com/vatesfr/xo-web/issues/303))
- Pagination fails ([xo-web#302](https://github.com/vatesfr/xo-web/issues/302))

## **4.2.0** (2015-06-29)

Huge performance boost, scheduler for rolling snapshots and backward compatibility for XS 5.x series

### Enhancements

- Rolling snapshots scheduler ([xo-web#176](https://github.com/vatesfr/xo-web/issues/176))
- Huge perf boost ([xen-api#1](https://github.com/julien-f/js-xen-api/issues/1))
- Backward compatibility ([xo-web#296](https://github.com/vatesfr/xo-web/issues/296))

### Bug fixes

- VDI attached on a VM missing in SR view ([xo-web#294](https://github.com/vatesfr/xo-web/issues/294))
- Better VM creation process ([xo-web#292](https://github.com/vatesfr/xo-web/issues/292))

## **4.1.0** (2015-06-10)

Add the drag'n drop support from VM live migration, better ACLs groups UI.

### Enhancements

- Drag'n drop VM in tree view for live migration ([xo-web#277](https://github.com/vatesfr/xo-web/issues/277))
- Better group view with objects ACLs ([xo-web#276](https://github.com/vatesfr/xo-web/issues/276))
- Hide non-visible objects ([xo-web#272](https://github.com/vatesfr/xo-web/issues/272))

### Bug fixes

- Convert to template displayed when the VM is not halted ([xo-web#286](https://github.com/vatesfr/xo-web/issues/286))
- Lost some data when refresh some views ([xo-web#271](https://github.com/vatesfr/xo-web/issues/271))
- Suspend button don't trigger any permission message ([xo-web#270](https://github.com/vatesfr/xo-web/issues/270))
- Create network interfaces shouldn't call xoApi directly ([xo-web#269](https://github.com/vatesfr/xo-web/issues/269))
- Don't plug automatically a disk or a VIF if the VM is not running ([xo-web#287](https://github.com/vatesfr/xo-web/issues/287))

## **4.0.2** (2015-06-01)

An issue in `xo-server` with the password of default admin account and also a UI fix.

### Bug fixes

- Cannot modify admin account ([xo-web#265](https://github.com/vatesfr/xo-web/issues/265))
- Password field seems to keep empty/reset itself after 1-2 seconds ([xo-web#264](https://github.com/vatesfr/xo-web/issues/264))

## **4.0.1** (2015-05-30)

An issue with the updater in HTTPS was left in the *4.0.0*. This patch release fixed
it.

### Bug fixes

- allow updater to work in HTTPS ([xo-web#266](https://github.com/vatesfr/xo-web/issues/266))

## **4.0.0** (2015-05-29)

[Blog post of this release](https://xen-orchestra.com/blog/xen-orchestra-4-0).

### Enhancements

- advanced ACLs ([xo-web#209](https://github.com/vatesfr/xo-web/issues/209))
- xenserver update management ([xo-web#174](https://github.com/vatesfr/xo-web/issues/174) & [xo-web#259](https://github.com/vatesfr/xo-web/issues/259))
- docker control ([xo-web#211](https://github.com/vatesfr/xo-web/issues/211))
- better responsive design ([xo-web#252](https://github.com/vatesfr/xo-web/issues/252))
- host stats ([xo-web#255](https://github.com/vatesfr/xo-web/issues/255))
- pagination ([xo-web#221](https://github.com/vatesfr/xo-web/issues/221))
- web updater
- better VM creation process([xo-web#256](https://github.com/vatesfr/xo-web/issues/256))
- VM boot order([xo-web#251](https://github.com/vatesfr/xo-web/issues/251))
- new mapped collection([xo-server#47](https://github.com/vatesfr/xo-server/issues/47))
- resource location in ACL view ([xo-web#245](https://github.com/vatesfr/xo-web/issues/245))

### Bug fixes

- wrong calulation of RAM amounts ([xo-web#51](https://github.com/vatesfr/xo-web/issues/51))
- checkbox not aligned ([xo-web#253](https://github.com/vatesfr/xo-web/issues/253))
- VM stats behavior more robust ([xo-web#250](https://github.com/vatesfr/xo-web/issues/250))
- XO not on the root of domain ([xo-web#254](https://github.com/vatesfr/xo-web/issues/254))


## **3.9.1** (2015-04-21)

A few bugs hve made their way into *3.9.0*, this minor release fixes
them.

### Bug fixes

- correctly keep the VM guest metrics up to date ([xo-web#172](https://github.com/vatesfr/xo-web/issues/172))
- fix edition of a VM snapshot ([b04111c](https://github.com/vatesfr/xo-server/commit/b04111c79ba8937778b84cb861bb7c2431162c11))
- do not fetch stats if the VM state is transitioning ([a5c9880](https://github.com/vatesfr/xo-web/commit/a5c98803182792d2fe5ceb840ae1e23a8b767923))
- fix broken Angular due to new version of Babel which breaks ngAnnotate ([0a9c868](https://github.com/vatesfr/xo-web/commit/0a9c868678d239e5b3e54b4d2bc3bd14b5400120))
- feedback when connecting/disconnecting a server ([027d1e8](https://github.com/vatesfr/xo-web/commit/027d1e8cb1f2431e67042e1eec51690b2bc54ad7))
- clearer error message if a server is unreachable ([06ca007](https://github.com/vatesfr/xo-server/commit/06ca0079b321e757aaa4112caa6f92a43193e35d))

## **3.9.0** (2015-04-20)

[Blog post of this release](https://xen-orchestra.com/blog/xen-orchestra-3-9).

### Enhancements

- ability to manually connect/disconnect a server ([xo-web#88](https://github.com/vatesfr/xo-web/issues/88) & [xo-web#234](https://github.com/vatesfr/xo-web/issues/234))
- display the connection status of a server ([xo-web#103](https://github.com/vatesfr/xo-web/issues/103))
- better feedback when connecting to a server ([xo-web#210](https://github.com/vatesfr/xo-web/issues/210))
- ability to add a local LVM SR ([xo-web#219](https://github.com/vatesfr/xo-web/issues/219))
- display virtual GPUs in VM view ([xo-web#223](https://github.com/vatesfr/xo-web/issues/223))
- ability to automatically start a VM with its host ([xo-web#224](https://github.com/vatesfr/xo-web/issues/224))
- ability to create networks ([xo-web#225](https://github.com/vatesfr/xo-web/issues/225))
- live charts for a VM CPU/disk/network & RAM ([xo-web#228](https://github.com/vatesfr/xo-web/issues/228) & [xo-server#51](https://github.com/vatesfr/xo-server/issues/51))
- remove VM import progress notifications (redundant with the tasks list) ([xo-web#235](https://github.com/vatesfr/xo-web/issues/235))
- XO-Server sources are compiled to JS prior distribution: less bugs & faster startups ([xo-server#50](https://github.com/vatesfr/xo-server/issues/50))
- use XAPI `event.from()` instead of `event.next()` which leads to faster connection ([xo-server#52](https://github.com/vatesfr/xo-server/issues/52))

### Bug fixes

- removed servers are properly disconnected ([xo-web#61](https://github.com/vatesfr/xo-web/issues/61))
- fix VM creation with multiple interfaces ([xo-wb#229](https://github.com/vatesfr/xo-wb/issues/229))
- disconnected servers are properly removed from the interface ([xo-web#234](https://github.com/vatesfr/xo-web/issues/234))

## **3.8.0** (2015-03-27)

[Blog post of this release](https://xen-orchestra.com/blog/xen-orchestra-3-8).

### Enhancements

- initial plugin system ([xo-server#37](https://github.com/vatesfr/xo-server/issues/37))
- new authentication system based on providers ([xo-server#39](https://github.com/vatesfr/xo-server/issues/39))
- LDAP authentication plugin for XO-Server ([xo-server#40](https://github.com/vatesfr/xo-server/issues/40))
- disk creation on the VM page ([xo-web#215](https://github.com/vatesfr/xo-web/issues/215))
- network creation on the VM page ([xo-web#216](https://github.com/vatesfr/xo-web/issues/216))
- charts on the host and SR pages ([xo-web#217](https://github.com/vatesfr/xo-web/issues/217))

### Bug fixes

- fix *Invalid parameter(s)* message on the settings page ([xo-server#49](https://github.com/vatesfr/xo-server/issues/49))
- fix mouse clicks in console ([xo-web#205](https://github.com/vatesfr/xo-web/issues/205))
- fix user editing on the settings page ([xo-web#206](https://github.com/vatesfr/xo-web/issues/206))

## **3.7.0** (2015-03-06)

*Highlights in this release are the [initial ACLs implementation](https://xen-orchestra.com/blog/xen-orchestra-3-7-is-out-acls-in-early-access), [live migration for VDIs](https://xen-orchestra.com/blog/moving-vdi-in-live) and the ability to [create a new storage repository](https://xen-orchestra.com/blog/create-a-storage-repository-with-xen-orchestra/).*

### Enhancements

- ability to live migrate a VM between hosts with different CPUs ([xo-web#126](https://github.com/vatesfr/xo-web/issues/126))
- ability to live migrate a VDI ([xo-web#177](https://github.com/vatesfr/xo-web/issues/177))
- display a notification on VM creation ([xo-web#178](https://github.com/vatesfr/xo-web/issues/178))
- ability to create/attach a iSCSI/NFS/ISO SR ([xo-web#179](https://github.com/vatesfr/xo-web/issues/179))
- display SR available space on VM creation ([xo-web#180](https://github.com/vatesfr/xo-web/issues/180))
- ability to enable and disable host on the tree view ([xo-web#181](https://github.com/vatesfr/xo-web/issues/181) & [xo-web#182](https://github.com/vatesfr/xo-web/issues/182))
- ability to suspend/resume a VM ([xo-web#186](https://github.com/vatesfr/xo-web/issues/186))
- display Linux icon for SUSE Linux Enterprise Server distribution ([xo-web#187](https://github.com/vatesfr/xo-web/issues/187))
- correctly handle incorrectly formated token in cookies ([xo-web#192](https://github.com/vatesfr/xo-web/issues/192))
- display host manufacturer in host view ([xo-web#195](https://github.com/vatesfr/xo-web/issues/195))
- only display task concerning authorized objects ([xo-web#197](https://github.com/vatesfr/xo-web/issues/197))
- better welcome message ([xo-web#199](https://github.com/vatesfr/xo-web/issues/199))
- initial ACLs ([xo-web#202](https://github.com/vatesfr/xo-web/issues/202))
- display an action panel to rescan, remove, attach and forget a SR ([xo-web#203](https://github.com/vatesfr/xo-web/issues/203))
- display current active tasks in navbar ([xo-web#204](https://github.com/vatesfr/xo-web/issues/204))

### Bug fixes

- implements a proxy which fixes consoles over HTTPs ([xo#14](https://github.com/vatesfr/xo/issues/14))
- fix tasks listing in host view ([xo-server#43](https://github.com/vatesfr/xo-server/issues/43))
- fix console view on IE ([xo-web#184](https://github.com/vatesfr/xo-web/issues/184))
- fix out of sync objects in XO-Web ([xo-web#142](https://github.com/vatesfr/xo-web/issues/142))
- fix incorrect connection status displayed in login view ([xo-web#193](https://github.com/vatesfr/xo-web/issues/193))
- fix *flickering* tree view ([xo-web#194](https://github.com/vatesfr/xo-web/issues/194))
- single host pools should not have a dropdown menu in tree view ([xo-web#198](https://github.com/vatesfr/xo-web/issues/198))

## **3.6.0** (2014-11-28)

### Enhancements

- upload and apply patches to hosts/pools ([xo-web#150](https://github.com/vatesfr/xo-web/issues/150))
- import VMs ([xo-web#151](https://github.com/vatesfr/xo-web/issues/151))
- export VMs ([xo-web#152](https://github.com/vatesfr/xo-web/issues/152))
- migrate VMs to another pool ([xo-web#153](https://github.com/vatesfr/xo-web/issues/153))
- display pool even for single host ([xo-web#155](https://github.com/vatesfr/xo-web/issues/155))
- start halted hosts with wake-on-LAN ([xo-web#154](https://github.com/vatesfr/xo-web/issues/154))
- list of uploaded/applied patches ([xo-web#156](https://github.com/vatesfr/xo-web/issues/156))
- use Angular 1.3 from npm ([xo-web#157](https://github.com/vatesfr/xo-web/issues/157) & [xo-web#160](https://github.com/vatesfr/xo-web/issues/160))
- more feedbacks on actions ([xo-web#165](https://github.com/vatesfr/xo-web/issues/165))
- only buttons compatible with VM states are displayed ([xo-web#166](https://github.com/vatesfr/xo-web/issues/166))
- export VM snapshot ([xo-web#167](https://github.com/vatesfr/xo-web/issues/167))
- plug/unplug a SR to a host ([xo-web#169](https://github.com/vatesfr/xo-web/issues/169))
- plug a SR to all available hosts ([xo-web#170](https://github.com/vatesfr/xo-web/issues/170))
- disks editing on SR page ([xo-web#171](https://github.com/vatesfr/xo-web/issues/171))
- export of running VMs ([xo-server#36](https://github.com/vatesfr/xo-server/issues/36))

### Bug fixes

- disks editing on VM page should work ([xo-web#86](https://github.com/vatesfr/xo-web/issues/86))
- dropdown menus should close after selecting an item ([xo-web#140](https://github.com/vatesfr/xo-web/issues/140))
- user creation should require a password ([xo-web#143](https://github.com/vatesfr/xo-web/issues/143))
- server connection should require a user and a password ([xo-web#144](https://github.com/vatesfr/xo-web/issues/144))
- snapshot deletion should work ([xo-server#147](https://github.com/vatesfr/xo-server/issues/147))
- VM console should work in Chrome ([xo-web#149](https://github.com/vatesfr/xo-web/issues/149))
- tooltips should work ([xo-web#163](https://github.com/vatesfr/xo-web/issues/163))
- disk plugged status should be automatically refreshed ([xo-web#164](https://github.com/vatesfr/xo-web/issues/164))
- deleting users without tokens should not trigger an error ([xo-server#34](https://github.com/vatesfr/xo-server/issues/34))
- live pool master change should work ([xo-server#20](https://github.com/vatesfr/xo-server/issues/20))

## **3.5.1** (2014-08-19)

### Bug fixes

- pool view works again ([#139](https://github.com/vatesfr/xo-web/issues/139))

## **3.5.0** (2014-08-14)

*[XO-Web](https://www.npmjs.org/package/xo-web) and [XO-Server](https://www.npmjs.org/package/xo-server) are now available as npm packages!*

### Enhancements

- XO-Server published on npm ([#26](https://github.com/vatesfr/xo-server/issues/26))
- XO-Server config is now in `/etc/xo-server/config.yaml` ([#33](https://github.com/vatesfr/xo-server/issues/33))
- paths in XO-Server's config are now relative to the config file ([#19](https://github.com/vatesfr/xo-server/issues/19))
- use the Linux icon for Fedora ([#131](https://github.com/vatesfr/xo-web/issues/131))
- start/stop/reboot buttons on console page ([#121](https://github.com/vatesfr/xo-web/issues/121))
- settings page now only accessible to admin ([#77](https://github.com/vatesfr/xo-web/issues/77))
- redirection to the home page when a VM is deleted from its own page ([#56](https://github.com/vatesfr/xo-web/issues/56))
- XO-Web published on npm ([#123](https://github.com/vatesfr/xo-web/issues/123))
- buid process now use Browserify (([#125](https://github.com/vatesfr/xo-web/issues/125), [#135](https://github.com/vatesfr/xo-web/issues/135)))
- view are now written in Jade instead of HTML ([#124](https://github.com/vatesfr/xo-web/issues/124))
- CSS autoprefixer to improve compatibility ([#132](https://github.com/vatesfr/xo-web/issues/132), [#137](https://github.com/vatesfr/xo-web/issues/137))

### Bug fixes

- force shutdown does not attempt a clean shutdown first anymore ([#29](https://github.com/vatesfr/xo-server/issues/29))
- shutdown hosts are now correctly reported as such ([#31](https://github.com/vatesfr/xo-web/issues/31))
- incorrect VM metrics ([#54](https://github.com/vatesfr/xo-web/issues/54), [#68](https://github.com/vatesfr/xo-web/issues/68), [#108](https://github.com/vatesfr/xo-web/issues/108))
- an user cannot delete itself ([#104](https://github.com/vatesfr/xo-web/issues/104))
- in VM creation, required fields are now marked as such ([#113](https://github.com/vatesfr/xo-web/issues/113), [#114](https://github.com/vatesfr/xo-web/issues/114))

## **3.4.0** (2014-05-22)

*Highlight in this release is the new events system between XO-Web
and XO-Server which results in less bandwidth consumption as well as
better performance and reactivity.*

### Enhancements

- events system between XO-Web and XO-Server ([#52](https://github.com/vatesfr/xo-web/issues/52))
- ability to clone/copy a VM ([#116](https://github.com/vatesfr/xo-web/issues/116))
- mandatory log in page ([#120](https://github.com/vatesfr/xo-web/issues/120))

### Bug fixes

- failure in VM creation ([#111](https://github.com/vatesfr/xo-web/issues/111))

## **3.3.1** (2014-03-28)

### Enhancements

- console view is now prettier ([#92](https://github.com/vatesfr/xo-web/issues/92))

### Bug fixes

- VM creation fails to incorrect dependencies ([xo-server/#24](https://github.com/vatesfr/xo-server/issues/24))
- VDIs list in SR view is blinking ([#109](https://github.com/vatesfr/xo-web/issues/109))

## **3.3.0** (2014-03-07)

### Enhancements

- [Grunt](http://gruntjs.com/) has been replaced by [gulp.js](http://gulpjs.com/) ([#91](https://github.com/vatesfr/xo-web/issues/91))
- a host can be detached from a pool ([#98](https://github.com/vatesfr/xo-web/issues/98))
- snapshots management in VM view ([#99](https://github.com/vatesfr/xo-web/issues/99))
- log deletion in VM view ([#100](https://github.com/vatesfr/xo-web/issues/100))

### Bug fixes

- *Snapshot* not working in VM view ([#95](https://github.com/vatesfr/xo-web/issues/95))
- Host *Reboot*/*Restart toolstack*/*Shutdown* not working in main view ([#97](https://github.com/vatesfr/xo-web/issues/97))
- Bower cannot install `angular` automatically due to a version conflict ([#101](https://github.com/vatesfr/xo-web/issues/101))
- Bower installs an incorrect version of `angular-animate` ([#102](https://github.com/vatesfr/xo-web/issues/102))

## **3.2.0** (2014-02-21)

### Enhancements

- dependencies' versions should be fixed to ease deployment ([#93](https://github.com/vatesfr/xo-web/issues/93))
- badges added to the README to see whether dependencies are up to date ([#90](https://github.com/vatesfr/xo-web/issues/90))
- an error notification has been added when the connection to XO-Server failed ([#89](https://github.com/vatesfr/xo-web/issues/89))
- in host view, there is now a link to the host console ([#87](https://github.com/vatesfr/xo-web/issues/87))
- in VM view, deleting a disk requires a confirmation ([#85](https://github.com/vatesfr/xo-web/issues/85))
- the VM and console icons are now different ([#80](https://github.com/vatesfr/xo-web/issues/80))

### Bug fixes

- consoles now work in Google Chrome \o/ ([#46](https://github.com/vatesfr/xo-web/issues/46))
- in host view, many buttons were not working ([#79](https://github.com/vatesfr/xo-web/issues/79))
- in main view, incorrect icons were fixes ([#81](https://github.com/vatesfr/xo-web/issues/81))
- MAC addresses should not be ignored during VM creation ([#94](https://github.com/vatesfr/xo-web/issues/94))

## **3.1.0** (2014-02-14)

### Enhancements

- in VM view, interfaces' network should be displayed ([#64](https://github.com/vatesfr/xo-web/issues/64))
- middle-click or `Ctrl`+click should open new windows (even on pseudo-links) ([#66](https://github.com/vatesfr/xo-web/issues/66))
- lists should use natural sorting (e.g. *VM 2* before *VM 10*) ([#69](https://github.com/vatesfr/xo-web/issues/69))

### Bug fixes

- consoles are not implemented for hosts ([#57](https://github.com/vatesfr/xo-web/issues/57))
- it makes no sense to remove a stand-alone host from a pool (58)
- in VM view, the migrate button is not working ([#59](https://github.com/vatesfr/xo-web/issues/59))
- pool and host names overflow their box in the main view ([#63](https://github.com/vatesfr/xo-web/issues/63))
- in host view, interfaces incorrectly named *networks* and VLAN not shown ([#70](https://github.com/vatesfr/xo-web/issues/70))
- VM suspended state is not properly handled ([#71](https://github.com/vatesfr/xo-web/issues/71))
- unauthenticated users should not be able to access to consoles ([#73](https://github.com/vatesfr/xo-web/issues/73))
- incorrect scroll (under the navbar) when the view changes ([#74](https://github.com/vatesfr/xo-web/issues/74))
