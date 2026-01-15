## **4.16.0** (2016-04-29)

Maintenance release

### Enhancements

- TOO_MANY_PENDING_TASKS [\#861](https://github.com/vatesfr/xen-orchestra/issues/861)

### Bug fixes

- Incorrect VM target name with continuous replication [\#904](https://github.com/vatesfr/xen-orchestra/issues/904)
- Error while deleting users [\#901](https://github.com/vatesfr/xen-orchestra/issues/901)
- Use an available path to the SR to create a config drive [\#882](https://github.com/vatesfr/xen-orchestra/issues/882)
- VM autoboot don't set the right pool parameter [\#879](https://github.com/vatesfr/xen-orchestra/issues/879)
- BUG: ACL with NFS ISO Library not working! [\#870](https://github.com/vatesfr/xen-orchestra/issues/870)
- Broken paths in backups in SMB [\#865](https://github.com/vatesfr/xen-orchestra/issues/865)
- Plugins page loads users/groups multiple times [\#829](https://github.com/vatesfr/xen-orchestra/issues/829)
- "Ghost" VM remains after migration [\#769](https://github.com/vatesfr/xen-orchestra/issues/769)

## **4.15.0** (2016-03-21)

Load balancing, SMB delta support, advanced network operations...

### Enhancements

- Add the job name inside the backup email report [\#819](https://github.com/vatesfr/xen-orchestra/issues/819)
- Delta backup with quiesce [\#812](https://github.com/vatesfr/xen-orchestra/issues/812)
- Hosts: No user feedback when error occurs with SR connect / disconnect [\#810](https://github.com/vatesfr/xen-orchestra/issues/810)
- Expose components versions [\#807](https://github.com/vatesfr/xen-orchestra/issues/807)
- Rework networks/PIFs management [\#805](https://github.com/vatesfr/xen-orchestra/issues/805)
- Displaying all SRs and a list of available hosts for creating VM from a pool [\#790](https://github.com/vatesfr/xen-orchestra/issues/790)
- Add "Source network" on "VM migration" screen [\#785](https://github.com/vatesfr/xen-orchestra/issues/785)
- Migration queue [\#783](https://github.com/vatesfr/xen-orchestra/issues/783)
- Match network names for VM migration [\#782](https://github.com/vatesfr/xen-orchestra/issues/782)
- Disk names [\#780](https://github.com/vatesfr/xen-orchestra/issues/780)
- Self service: should the user be able to set the CPU weight? [\#767](https://github.com/vatesfr/xen-orchestra/issues/767)
- host & pool Citrix license status [\#763](https://github.com/vatesfr/xen-orchestra/issues/763)
- pool view: Provide "updates" section [\#762](https://github.com/vatesfr/xen-orchestra/issues/762)
- XOA ISO image: ambiguous root disk label [\#761](https://github.com/vatesfr/xen-orchestra/issues/761)
- Host info: provide system serial number [\#760](https://github.com/vatesfr/xen-orchestra/issues/760)
- CIFS ISO SR Creation [\#731](https://github.com/vatesfr/xen-orchestra/issues/731)
- MAC address not preserved on VM restore [\#707](https://github.com/vatesfr/xen-orchestra/issues/707)
- Failing replication job should send reports [\#659](https://github.com/vatesfr/xen-orchestra/issues/659)
- Display networks in the Pool view [\#226](https://github.com/vatesfr/xen-orchestra/issues/226)

### Bug fixes

- Broken link to backup remote [\#821](https://github.com/vatesfr/xen-orchestra/issues/821)
- Issue with self-signed cert for email plugin [\#817](https://github.com/vatesfr/xen-orchestra/issues/817)
- Plugins view, reset form and errors [\#815](https://github.com/vatesfr/xen-orchestra/issues/815)
- HVM recovery mode is broken [\#794](https://github.com/vatesfr/xen-orchestra/issues/794)
- Disk bug when creating vm from template [\#778](https://github.com/vatesfr/xen-orchestra/issues/778)
- Can't mount NFS shares in remote stores [\#775](https://github.com/vatesfr/xen-orchestra/issues/775)
- VM disk name and description not passed during creation [\#774](https://github.com/vatesfr/xen-orchestra/issues/774)
- NFS mount problem for Windows share [\#771](https://github.com/vatesfr/xen-orchestra/issues/771)
- lodash.pluck not installed [\#757](https://github.com/vatesfr/xen-orchestra/issues/757)
- this.\_getAuthenticationTokensForUser is not a function [\#755](https://github.com/vatesfr/xen-orchestra/issues/755)
- CentOS 6.x 64bit template creates a VM that won't boot [\#733](https://github.com/vatesfr/xen-orchestra/issues/733)
- Lot of xo:perf leading to XO crash [\#575](https://github.com/vatesfr/xen-orchestra/issues/575)
- New collection checklist [\#262](https://github.com/vatesfr/xen-orchestra/issues/262)

## **4.14.0** (2016-02-23)

Self service, custom CloudInit...

### Enhancements

- VM creation self service with quotas [\#285](https://github.com/vatesfr/xen-orchestra/issues/285)
- Cloud config custom user data [\#706](https://github.com/vatesfr/xen-orchestra/issues/706)
- Patches behind a proxy [\#737](https://github.com/vatesfr/xen-orchestra/issues/737)
- Remote store status indicator [\#728](https://github.com/vatesfr/xen-orchestra/issues/728)
- Patch list order [\#724](https://github.com/vatesfr/xen-orchestra/issues/724)
- Enable reporting on additional backup types [\#717](https://github.com/vatesfr/xen-orchestra/issues/717)
- Tooltip name for cancel [\#703](https://github.com/vatesfr/xen-orchestra/issues/703)
- Portable VHD merging [\#646](https://github.com/vatesfr/xen-orchestra/issues/646)

### Bug fixes

- Avoid merge between two delta vdi backups [\#702](https://github.com/vatesfr/xen-orchestra/issues/702)
- Text in table is not cut anymore [\#713](https://github.com/vatesfr/xen-orchestra/issues/713)
- Disk size edition issue with float numbers [\#719](https://github.com/vatesfr/xen-orchestra/issues/719)
- Create vm, summary is not refreshed [\#721](https://github.com/vatesfr/xen-orchestra/issues/721)
- Boot order problem [\#726](https://github.com/vatesfr/xen-orchestra/issues/726)

## **4.13.0** (2016-02-05)

Backup checksum, SMB remotes...

### Enhancements

- Add SMB mount for remote [\#338](https://github.com/vatesfr/xen-orchestra/issues/338)
- Centralize Perm in a lib [\#345](https://github.com/vatesfr/xen-orchestra/issues/345)
- Expose interpool migration details [\#567](https://github.com/vatesfr/xen-orchestra/issues/567)
- Add checksum for delta backup [\#617](https://github.com/vatesfr/xen-orchestra/issues/617)
- Redirect from HTTP to HTTPS [\#626](https://github.com/vatesfr/xen-orchestra/issues/626)
- Expose vCPU weight [\#633](https://github.com/vatesfr/xen-orchestra/issues/633)
- Avoid metadata in delta backup [\#651](https://github.com/vatesfr/xen-orchestra/issues/651)
- Button to clear logs [\#661](https://github.com/vatesfr/xen-orchestra/issues/661)
- Units for RAM and disks [\#666](https://github.com/vatesfr/xen-orchestra/issues/666)
- Remove multiple VDIs at once [\#676](https://github.com/vatesfr/xen-orchestra/issues/676)
- Find orphaned VDI snapshots [\#679](https://github.com/vatesfr/xen-orchestra/issues/679)
- New health view in Dashboard [\#680](https://github.com/vatesfr/xen-orchestra/issues/680)
- Use physical usage for VDI and SR [\#682](https://github.com/vatesfr/xen-orchestra/issues/682)
- TLS configuration [\#685](https://github.com/vatesfr/xen-orchestra/issues/685)
- Better VM info on tree view [\#688](https://github.com/vatesfr/xen-orchestra/issues/688)
- Absolute values in tooltips for tree view [\#690](https://github.com/vatesfr/xen-orchestra/issues/690)
- Absolute values for host memory [\#691](https://github.com/vatesfr/xen-orchestra/issues/691)

### Bug fixes

- Issues on host console screen [\#672](https://github.com/vatesfr/xen-orchestra/issues/672)
- NFS remote mount fails in particular case [\#665](https://github.com/vatesfr/xen-orchestra/issues/665)
- Unresponsive pages [\#662](https://github.com/vatesfr/xen-orchestra/issues/662)
- Live migration fail in the same pool with local SR fails [\#655](https://github.com/vatesfr/xen-orchestra/issues/655)

## **4.12.0** (2016-01-18)

Continuous Replication, Continuous Delta backup...

### Enhancements

- Continuous VM replication [\#582](https://github.com/vatesfr/xen-orchestra/issues/582)
- Continuous Delta Backup [\#576](https://github.com/vatesfr/xen-orchestra/issues/576)
- Scheduler should not run job again if previous instance is not finished [\#642](https://github.com/vatesfr/xen-orchestra/issues/642)
- Boot VM automatically after creation [\#635](https://github.com/vatesfr/xen-orchestra/issues/635)
- Manage existing VIFs in templates [\#630](https://github.com/vatesfr/xen-orchestra/issues/630)
- Support templates with existing install repository [\#627](https://github.com/vatesfr/xen-orchestra/issues/627)
- Remove running VMs [\#616](https://github.com/vatesfr/xen-orchestra/issues/616)
- Prevent a VM to start before delta import is finished [\#613](https://github.com/vatesfr/xen-orchestra/issues/613)
- Spawn multiple VMs at once [\#606](https://github.com/vatesfr/xen-orchestra/issues/606)
- Fixed `suspendVM` in tree view. [\#619](https://github.com/vatesfr/xen-orchestra/pull/619) ([pdonias](https://github.com/pdonias))

### Bug fixes

- User defined MAC address is not fetch in VM install [\#643](https://github.com/vatesfr/xen-orchestra/issues/643)
- CoreOsCloudConfig is not shown with CoreOS [\#639](https://github.com/vatesfr/xen-orchestra/issues/639)
- Plugin activation/deactivation in web UI seems broken [\#637](https://github.com/vatesfr/xen-orchestra/issues/637)
- Issue when creating CloudConfig drive [\#636](https://github.com/vatesfr/xen-orchestra/issues/636)
- CloudConfig hostname shouldn't have space [\#634](https://github.com/vatesfr/xen-orchestra/issues/634)
- Cloned VIFs are not properly deleted on VM creation [\#632](https://github.com/vatesfr/xen-orchestra/issues/632)
- Default PV args missing during VM creation [\#628](https://github.com/vatesfr/xen-orchestra/issues/628)
- VM creation problems from custom templates [\#625](https://github.com/vatesfr/xen-orchestra/issues/625)
- Emergency shutdown race condition [\#622](https://github.com/vatesfr/xen-orchestra/issues/622)
- `vm.delete\(\)` should not delete VDIs attached to other VMs [\#621](https://github.com/vatesfr/xen-orchestra/issues/621)
- VM creation error from template with a disk [\#581](https://github.com/vatesfr/xen-orchestra/issues/581)
- Only delete VDI exports when VM backup is successful [\#644](https://github.com/vatesfr/xen-orchestra/issues/644)
- Change the name of an imported VM during the import process [\#641](https://github.com/vatesfr/xen-orchestra/issues/641)
- Creating a new VIF in view is partially broken [\#652](https://github.com/vatesfr/xen-orchestra/issues/652)
- Grey out the "create button" during VM creation [\#654](https://github.com/vatesfr/xen-orchestra/issues/654)

## **4.11.0** (2015-12-22)

Delta backup, CloudInit...

### Enhancements

- Visible list of SR inside a VM [\#601](https://github.com/vatesfr/xen-orchestra/issues/601)
- VDI move [\#591](https://github.com/vatesfr/xen-orchestra/issues/591)
- Edit preexisting disk configuration during VM creation [\#589](https://github.com/vatesfr/xen-orchestra/issues/589)
- Allow disk size edition [\#587](https://github.com/vatesfr/xen-orchestra/issues/587)
- Better VDI resize support [\#585](https://github.com/vatesfr/xen-orchestra/issues/585)
- Remove manual VM export metadata in UI [\#580](https://github.com/vatesfr/xen-orchestra/issues/580)
- Support import VM metadata [\#579](https://github.com/vatesfr/xen-orchestra/issues/579)
- Set a default pool SR [\#572](https://github.com/vatesfr/xen-orchestra/issues/572)
- ISOs should be sorted by name [\#565](https://github.com/vatesfr/xen-orchestra/issues/565)
- Button to boot a VM from a disc once [\#564](https://github.com/vatesfr/xen-orchestra/issues/564)
- Ability to boot a PV VM from a disc [\#563](https://github.com/vatesfr/xen-orchestra/issues/563)
- Add an option to manually run backup jobs [\#562](https://github.com/vatesfr/xen-orchestra/issues/562)
- backups to unmounted storage [\#561](https://github.com/vatesfr/xen-orchestra/issues/561)
- Root integer properties cannot be edited in plugins configuration form [\#550](https://github.com/vatesfr/xen-orchestra/issues/550)
- Generic CloudConfig drive [\#549](https://github.com/vatesfr/xen-orchestra/issues/549)
- Auto-discovery of installed xo-server plugins [\#546](https://github.com/vatesfr/xen-orchestra/issues/546)
- Hide info on flat view [\#545](https://github.com/vatesfr/xen-orchestra/issues/545)
- Config plugin boolean properties must have a default value \(undefined prohibited\) [\#543](https://github.com/vatesfr/xen-orchestra/issues/543)
- Present detailed errors on plugin configuration failures [\#530](https://github.com/vatesfr/xen-orchestra/issues/530)
- Do not reset form on failures in plugins configuration [\#529](https://github.com/vatesfr/xen-orchestra/issues/529)
- XMPP alert plugin [\#518](https://github.com/vatesfr/xen-orchestra/issues/518)
- Hide tag adders depending on ACLs [\#516](https://github.com/vatesfr/xen-orchestra/issues/516)
- Choosing a framework for xo-web 5 [\#514](https://github.com/vatesfr/xen-orchestra/issues/514)
- Prevent adding a host in an existing XAPI connection [\#466](https://github.com/vatesfr/xen-orchestra/issues/466)
- Read only connection to Xen servers/pools [\#439](https://github.com/vatesfr/xen-orchestra/issues/439)
- generic notification system [\#391](https://github.com/vatesfr/xen-orchestra/issues/391)
- Data architecture review [\#384](https://github.com/vatesfr/xen-orchestra/issues/384)
- Make filtering easier to understand/add some "default" filters [\#207](https://github.com/vatesfr/xen-orchestra/issues/207)
- Improve performance [\#148](https://github.com/vatesfr/xen-orchestra/issues/148)

### Bug fixes

- VM metadata export should not require a snapshot [\#615](https://github.com/vatesfr/xen-orchestra/issues/615)
- Missing patch for all hosts is continuously refreshed [\#609](https://github.com/vatesfr/xen-orchestra/issues/609)
- Backup import memory issue [\#608](https://github.com/vatesfr/xen-orchestra/issues/608)
- Host list missing patch is buggy [\#604](https://github.com/vatesfr/xen-orchestra/issues/604)
- Servers infos should not been refreshed while a field is being edited [\#595](https://github.com/vatesfr/xen-orchestra/issues/595)
- Servers list should not been re-order while a field is being edited [\#594](https://github.com/vatesfr/xen-orchestra/issues/594)
- Correctly display size in interface \(binary scale\) [\#592](https://github.com/vatesfr/xen-orchestra/issues/592)
- Display failures on VM boot order modification [\#560](https://github.com/vatesfr/xen-orchestra/issues/560)
- `vm.setBootOrder\(\)` should throw errors on failures \(non-HVM VMs\) [\#559](https://github.com/vatesfr/xen-orchestra/issues/559)
- Hide boot order form for non-HVM VMs [\#558](https://github.com/vatesfr/xen-orchestra/issues/558)
- Allow editing PV args even when empty \(but only for PV VMs\) [\#557](https://github.com/vatesfr/xen-orchestra/issues/557)
- Crashes when using legacy event system [\#556](https://github.com/vatesfr/xen-orchestra/issues/556)
- XenServer patches check error for 6.1 [\#555](https://github.com/vatesfr/xen-orchestra/issues/555)
- activation plugin xo-server-transport-email [\#553](https://github.com/vatesfr/xen-orchestra/issues/553)
- Server error with JSON on 32 bits Dom0 [\#552](https://github.com/vatesfr/xen-orchestra/issues/552)
- Cloud Config drive shouldn't be created on default SR [\#548](https://github.com/vatesfr/xen-orchestra/issues/548)
- Deep properties cannot be edited in plugins configuration form [\#521](https://github.com/vatesfr/xen-orchestra/issues/521)
- Aborted VM export should cancel the operation [\#490](https://github.com/vatesfr/xen-orchestra/issues/490)
- VM missing with same UUID after an inter-pool migration [\#284](https://github.com/vatesfr/xen-orchestra/issues/284)

## **4.10.0** (2015-11-27)

Job management, email notifications, CoreOS/Docker, Quiesce snapshots...

### Enhancements

- Job management ([xo-web#487](https://github.com/vatesfr/xen-orchestra/issues/487))
- Patch upload on all connected servers ([xo-web#168](https://github.com/vatesfr/xen-orchestra/issues/168))
- Emergency shutdown ([xo-web#185](https://github.com/vatesfr/xen-orchestra/issues/185))
- CoreOS/docker template install ([xo-web#246](https://github.com/vatesfr/xen-orchestra/issues/246))
- Email for backups ([xo-web#308](https://github.com/vatesfr/xen-orchestra/issues/308))
- Console Clipboard ([xo-web#408](https://github.com/vatesfr/xen-orchestra/issues/408))
- Logs from CLI ([xo-web#486](https://github.com/vatesfr/xen-orchestra/issues/486))
- Save disconnected servers ([xo-web#489](https://github.com/vatesfr/xen-orchestra/issues/489))
- Snapshot with quiesce ([xo-web#491](https://github.com/vatesfr/xen-orchestra/issues/491))
- Start VM in recovery mode ([xo-web#495](https://github.com/vatesfr/xen-orchestra/issues/495))
- Username in logs ([xo-web#498](https://github.com/vatesfr/xen-orchestra/issues/498))
- Delete associated tokens with user ([xo-web#500](https://github.com/vatesfr/xen-orchestra/issues/500))
- Validate plugin configuration ([xo-web#503](https://github.com/vatesfr/xen-orchestra/issues/503))
- Avoid non configured plugins to be loaded ([xo-web#504](https://github.com/vatesfr/xen-orchestra/issues/504))
- Verbose API logs if configured ([xo-web#505](https://github.com/vatesfr/xen-orchestra/issues/505))
- Better backup overview ([xo-web#512](https://github.com/vatesfr/xen-orchestra/issues/512))
- VM auto power on ([xo-web#519](https://github.com/vatesfr/xen-orchestra/issues/519))
- Title property supported in config schema ([xo-web#522](https://github.com/vatesfr/xen-orchestra/issues/522))
- Start VM export only when necessary ([xo-web#534](https://github.com/vatesfr/xen-orchestra/issues/534))
- Input type should be number ([xo-web#538](https://github.com/vatesfr/xen-orchestra/issues/538))

### Bug fixes

- Numbers/int support in plugins config ([xo-web#531](https://github.com/vatesfr/xen-orchestra/issues/531))
- Boolean support in plugins config ([xo-web#528](https://github.com/vatesfr/xen-orchestra/issues/528))
- Keyboard unusable outside console ([xo-web#513](https://github.com/vatesfr/xen-orchestra/issues/513))
- UsernameField for SAML ([xo-web#513](https://github.com/vatesfr/xen-orchestra/issues/513))
- Wrong display of "no plugin found" ([xo-web#508](https://github.com/vatesfr/xen-orchestra/issues/508))
- Bower build error ([xo-web#488](https://github.com/vatesfr/xen-orchestra/issues/488))
- VM cloning should require SR permission ([xo-web#472](https://github.com/vatesfr/xen-orchestra/issues/472))
- Xen tools status ([xo-web#471](https://github.com/vatesfr/xen-orchestra/issues/471))
- Can't delete ghost user ([xo-web#464](https://github.com/vatesfr/xen-orchestra/issues/464))
- Stats with old versions of Node ([xo-web#463](https://github.com/vatesfr/xen-orchestra/issues/463))

## **4.9.0** (2015-11-13)

Automated DR, restore backup, VM copy

### Enhancements

- DR: schedule VM export on other host ([xo-web#447](https://github.com/vatesfr/xen-orchestra/issues/447))
- Scheduler logs ([xo-web#390](https://github.com/vatesfr/xen-orchestra/issues/390) and [xo-web#477](https://github.com/vatesfr/xen-orchestra/issues/477))
- Restore backups ([xo-web#450](https://github.com/vatesfr/xen-orchestra/issues/350))
- Disable backup compression ([xo-web#467](https://github.com/vatesfr/xen-orchestra/issues/467))
- Copy VM to another SR (even remote) ([xo-web#475](https://github.com/vatesfr/xen-orchestra/issues/475))
- VM stats without time sync ([xo-web#460](https://github.com/vatesfr/xen-orchestra/issues/460))
- Stats perfs for high CPU numbers ([xo-web#461](https://github.com/vatesfr/xen-orchestra/issues/461))

### Bug fixes

- Rolling backup bug ([xo-web#484](https://github.com/vatesfr/xen-orchestra/issues/484))
- vCPUs/CPUs inversion in dashboard ([xo-web#481](https://github.com/vatesfr/xen-orchestra/issues/481))
- Machine to template ([xo-web#459](https://github.com/vatesfr/xen-orchestra/issues/459))

### Misc

- Console fix in XenServer ([xo-web#406](https://github.com/vatesfr/xen-orchestra/issues/406))

## **4.8.0** (2015-10-29)

Fully automated patch system, ACLs inheritance, stats performance improved.

### Enhancements

- ACLs inheritance ([xo-web#279](https://github.com/vatesfr/xen-orchestra/issues/279))
- Patch automatically all missing updates ([xo-web#281](https://github.com/vatesfr/xen-orchestra/issues/281))
- Intelligent stats polling ([xo-web#432](https://github.com/vatesfr/xen-orchestra/issues/432))
- Cache latest result of stats request ([xo-web#431](https://github.com/vatesfr/xen-orchestra/issues/431))
- Improve stats polling on multiple objects ([xo-web#433](https://github.com/vatesfr/xen-orchestra/issues/433))
- Patch upload task should display the patch name ([xo-web#449](https://github.com/vatesfr/xen-orchestra/issues/449))
- Backup filename for Windows ([xo-web#448](https://github.com/vatesfr/xen-orchestra/issues/448))
- Specific distro icons ([xo-web#446](https://github.com/vatesfr/xen-orchestra/issues/446))
- PXE boot for HVM ([xo-web#436](https://github.com/vatesfr/xen-orchestra/issues/436))
- Favicon display before sign in ([xo-web#428](https://github.com/vatesfr/xen-orchestra/issues/428))
- Registration renewal ([xo-web#424](https://github.com/vatesfr/xen-orchestra/issues/424))
- Reconnect to the host if pool merge fails ([xo-web#403](https://github.com/vatesfr/xen-orchestra/issues/403))
- Avoid brute force login ([xo-web#339](https://github.com/vatesfr/xen-orchestra/issues/339))
- Missing FreeBSD icon ([xo-web#136](https://github.com/vatesfr/xen-orchestra/issues/136))
- Hide halted objects in the Health view ([xo-web#457](https://github.com/vatesfr/xen-orchestra/issues/457))
- Click on "Remember me" label ([xo-web#438](https://github.com/vatesfr/xen-orchestra/issues/438))

### Bug fixes

- Pool patches in multiple pools not displayed ([xo-web#442](https://github.com/vatesfr/xen-orchestra/issues/442))
- VM Import crashes with Chrome ([xo-web#427](https://github.com/vatesfr/xen-orchestra/issues/427))
- Cannot open a direct link ([xo-web#371](https://github.com/vatesfr/xen-orchestra/issues/371))
- Patch display edge case ([xo-web#309](https://github.com/vatesfr/xen-orchestra/issues/309))
- VM snapshot should require user permission on SR ([xo-web#429](https://github.com/vatesfr/xen-orchestra/issues/429))

## **4.7.0** (2015-10-12)

Plugin config management and browser notifications.

### Enhancements

- Plugin management in the web interface ([xo-web#352](https://github.com/vatesfr/xen-orchestra/issues/352))
- Browser notifications ([xo-web#402](https://github.com/vatesfr/xen-orchestra/issues/402))
- Graph selector ([xo-web#400](https://github.com/vatesfr/xen-orchestra/issues/400))
- Circle packing visualization ([xo-web#374](https://github.com/vatesfr/xen-orchestra/issues/374))
- Password generation ([xo-web#397](https://github.com/vatesfr/xen-orchestra/issues/397))
- Password reveal during user creation ([xo-web#396](https://github.com/vatesfr/xen-orchestra/issues/396))
- Add host to a pool ([xo-web#62](https://github.com/vatesfr/xen-orchestra/issues/62))
- Better modal when removing a host from a pool ([xo-web#405](https://github.com/vatesfr/xen-orchestra/issues/405))
- Drop focus on CD/ISO selector ([xo-web#290](https://github.com/vatesfr/xen-orchestra/issues/290))
- Allow non persistent session ([xo-web#243](https://github.com/vatesfr/xen-orchestra/issues/243))

### Bug fixes

- VM export permission corrected ([xo-web#410](https://github.com/vatesfr/xen-orchestra/issues/410))
- Proper host removal in a pool ([xo-web#402](https://github.com/vatesfr/xen-orchestra/issues/402))
- Sub-optimal tooltip placement ([xo-web#421](https://github.com/vatesfr/xen-orchestra/issues/421))
- VM migrate host incorrect target ([xo-web#419](https://github.com/vatesfr/xen-orchestra/issues/419))
- Alone host can't leave its pool ([xo-web#414](https://github.com/vatesfr/xen-orchestra/issues/414))

## **4.6.0** (2015-09-25)

Tags management and new visualization.

### Enhancements

- Multigraph for correlation ([xo-web#358](https://github.com/vatesfr/xen-orchestra/issues/358))
- Tags management ([xo-web#367](https://github.com/vatesfr/xen-orchestra/issues/367))
- Google Provider for authentication ([xo-web#363](https://github.com/vatesfr/xen-orchestra/issues/363))
- Password change for users ([xo-web#362](https://github.com/vatesfr/xen-orchestra/issues/362))
- Better live migration process ([xo-web#237](https://github.com/vatesfr/xen-orchestra/issues/237))
- VDI search filter in SR view ([xo-web#222](https://github.com/vatesfr/xen-orchestra/issues/222))
- PV args during VM creation ([xo-web#112](https://github.com/vatesfr/xen-orchestra/issues/330))
- PV args management ([xo-web#394](https://github.com/vatesfr/xen-orchestra/issues/394))
- Confirmation dialog on important actions ([xo-web#350](https://github.com/vatesfr/xen-orchestra/issues/350))
- New favicon ([xo-web#369](https://github.com/vatesfr/xen-orchestra/issues/369))
- Filename of VM for exports ([xo-web#370](https://github.com/vatesfr/xen-orchestra/issues/370))
- ACLs rights edited on the fly ([xo-web#323](https://github.com/vatesfr/xen-orchestra/issues/323))
- Heatmap values now human readable ([xo-web#342](https://github.com/vatesfr/xen-orchestra/issues/342))

### Bug fixes

- Export backup fails if no tags specified ([xo-web#383](https://github.com/vatesfr/xen-orchestra/issues/383))
- Wrong login give an obscure error message ([xo-web#373](https://github.com/vatesfr/xen-orchestra/issues/373))
- Update view is broken during updates ([xo-web#356](https://github.com/vatesfr/xen-orchestra/issues/356))
- Settings/dashboard menu incorrect display ([xo-web#357](https://github.com/vatesfr/xen-orchestra/issues/357))
- Console View Not refreshing if the VM restart ([xo-web#107](https://github.com/vatesfr/xen-orchestra/issues/107))

## **4.5.1** (2015-09-16)

An issue in `xo-web` with the VM view.

### Bug fix

- Attach disk/new disk/create interface is broken ([xo-web#378](https://github.com/vatesfr/xen-orchestra/issues/378))

## **4.5.0** (2015-09-11)

A new dataviz (parallel coord), a new provider (GitHub) and faster consoles.

### Enhancements

- Parallel coordinates view ([xo-web#333](https://github.com/vatesfr/xen-orchestra/issues/333))
- Faster consoles ([xo-web#337](https://github.com/vatesfr/xen-orchestra/issues/337))
- Disable/hide button ([xo-web#268](https://github.com/vatesfr/xen-orchestra/issues/268))
- More details on missing-guest-tools ([xo-web#304](https://github.com/vatesfr/xen-orchestra/issues/304))
- Scheduler meta data export ([xo-web#315](https://github.com/vatesfr/xen-orchestra/issues/315))
- Better heatmap ([xo-web#330](https://github.com/vatesfr/xen-orchestra/issues/330))
- Faster dashboard ([xo-web#331](https://github.com/vatesfr/xen-orchestra/issues/331))
- Faster sunburst ([xo-web#332](https://github.com/vatesfr/xen-orchestra/issues/332))
- GitHub provider for auth ([xo-web#334](https://github.com/vatesfr/xen-orchestra/issues/334))
- Filter networks for users ([xo-web#347](https://github.com/vatesfr/xen-orchestra/issues/347))
- Add networks in ACLs ([xo-web#348](https://github.com/vatesfr/xen-orchestra/issues/348))
- Better looking login page ([xo-web#341](https://github.com/vatesfr/xen-orchestra/issues/341))
- Real time dataviz (dashboard) ([xo-web#349](https://github.com/vatesfr/xen-orchestra/issues/349))

### Bug fixes

- Typo in dashboard ([xo-web#355](https://github.com/vatesfr/xen-orchestra/issues/355))
- Global RAM usage fix ([xo-web#356](https://github.com/vatesfr/xen-orchestra/issues/356))
- Re-allowing XO behind a reverse proxy ([xo-web#361](https://github.com/vatesfr/xen-orchestra/issues/361))

## **4.4.0** (2015-08-28)

SSO and Dataviz are the main features for this release.

### Enhancements

- Dataviz storage usage ([xo-web#311](https://github.com/vatesfr/xen-orchestra/issues/311))
- Heatmap in health view ([xo-web#329](https://github.com/vatesfr/xen-orchestra/issues/329))
- SSO for SAML and other providers ([xo-web#327](https://github.com/vatesfr/xen-orchestra/issues/327))
- Better UI for ACL objects attribution ([xo-web#320](https://github.com/vatesfr/xen-orchestra/issues/320))
- Refresh the browser after an update ([xo-web#318](https://github.com/vatesfr/xen-orchestra/issues/318))
- Clean CSS and Flexbox usage ([xo-web#239](https://github.com/vatesfr/xen-orchestra/issues/239))

### Bug fixes

- Admin only accessible views ([xo-web#328](https://github.com/vatesfr/xen-orchestra/issues/328))
- Hide "base copy" VDIs ([xo-web#324](https://github.com/vatesfr/xen-orchestra/issues/324))
- ACLs on VIFs for non-admins ([xo-web#322](https://github.com/vatesfr/xen-orchestra/issues/322))
- Updater display problems ([xo-web#313](https://github.com/vatesfr/xen-orchestra/issues/313))

## **4.3.0** (2015-07-22)

Scheduler for rolling backups

### Enhancements

- Rolling backup scheduler ([xo-web#278](https://github.com/vatesfr/xen-orchestra/issues/278))
- Clean snapshots of removed VMs ([xo-web#301](https://github.com/vatesfr/xen-orchestra/issues/301))

### Bug fixes

- VM export ([xo-web#307](https://github.com/vatesfr/xen-orchestra/issues/307))
- Remove VM VDIs ([xo-web#303](https://github.com/vatesfr/xen-orchestra/issues/303))
- Pagination fails ([xo-web#302](https://github.com/vatesfr/xen-orchestra/issues/302))

## **4.2.0** (2015-06-29)

Huge performance boost, scheduler for rolling snapshots and backward compatibility for XS 5.x series

### Enhancements

- Rolling snapshots scheduler ([xo-web#176](https://github.com/vatesfr/xen-orchestra/issues/176))
- Huge perf boost ([xen-api#1](https://github.com/julien-f/js-xen-api/issues/1))
- Backward compatibility ([xo-web#296](https://github.com/vatesfr/xen-orchestra/issues/296))

### Bug fixes

- VDI attached on a VM missing in SR view ([xo-web#294](https://github.com/vatesfr/xen-orchestra/issues/294))
- Better VM creation process ([xo-web#292](https://github.com/vatesfr/xen-orchestra/issues/292))

## **4.1.0** (2015-06-10)

Add the drag'n drop support from VM live migration, better ACLs groups UI.

### Enhancements

- Drag'n drop VM in tree view for live migration ([xo-web#277](https://github.com/vatesfr/xen-orchestra/issues/277))
- Better group view with objects ACLs ([xo-web#276](https://github.com/vatesfr/xen-orchestra/issues/276))
- Hide non-visible objects ([xo-web#272](https://github.com/vatesfr/xen-orchestra/issues/272))

### Bug fixes

- Convert to template displayed when the VM is not halted ([xo-web#286](https://github.com/vatesfr/xen-orchestra/issues/286))
- Lost some data when refresh some views ([xo-web#271](https://github.com/vatesfr/xen-orchestra/issues/271))
- Suspend button don't trigger any permission message ([xo-web#270](https://github.com/vatesfr/xen-orchestra/issues/270))
- Create network interfaces shouldn't call xoApi directly ([xo-web#269](https://github.com/vatesfr/xen-orchestra/issues/269))
- Don't plug automatically a disk or a VIF if the VM is not running ([xo-web#287](https://github.com/vatesfr/xen-orchestra/issues/287))

## **4.0.2** (2015-06-01)

An issue in `xo-server` with the password of default admin account and also a UI fix.

### Bug fixes

- Cannot modify admin account ([xo-web#265](https://github.com/vatesfr/xen-orchestra/issues/265))
- Password field seems to keep empty/reset itself after 1-2 seconds ([xo-web#264](https://github.com/vatesfr/xen-orchestra/issues/264))

## **4.0.1** (2015-05-30)

An issue with the updater in HTTPS was left in the _4.0.0_. This patch release fixed
it.

### Bug fixes

- allow updater to work in HTTPS ([xo-web#266](https://github.com/vatesfr/xen-orchestra/issues/266))

## **4.0.0** (2015-05-29)

[Blog post of this release](https://xen-orchestra.com/blog/xen-orchestra-4-0).

### Enhancements

- advanced ACLs ([xo-web#209](https://github.com/vatesfr/xen-orchestra/issues/209))
- xenserver update management ([xo-web#174](https://github.com/vatesfr/xen-orchestra/issues/174) & [xo-web#259](https://github.com/vatesfr/xen-orchestra/issues/259))
- docker control ([xo-web#211](https://github.com/vatesfr/xen-orchestra/issues/211))
- better responsive design ([xo-web#252](https://github.com/vatesfr/xen-orchestra/issues/252))
- host stats ([xo-web#255](https://github.com/vatesfr/xen-orchestra/issues/255))
- pagination ([xo-web#221](https://github.com/vatesfr/xen-orchestra/issues/221))
- web updater
- better VM creation process([xo-web#256](https://github.com/vatesfr/xen-orchestra/issues/256))
- VM boot order([xo-web#251](https://github.com/vatesfr/xen-orchestra/issues/251))
- new mapped collection([xo-server#47](https://github.com/vatesfr/xo-server/issues/47))
- resource location in ACL view ([xo-web#245](https://github.com/vatesfr/xen-orchestra/issues/245))

### Bug fixes

- wrong calculation of RAM amounts ([xo-web#51](https://github.com/vatesfr/xen-orchestra/issues/51))
- checkbox not aligned ([xo-web#253](https://github.com/vatesfr/xen-orchestra/issues/253))
- VM stats behavior more robust ([xo-web#250](https://github.com/vatesfr/xen-orchestra/issues/250))
- XO not on the root of domain ([xo-web#254](https://github.com/vatesfr/xen-orchestra/issues/254))
