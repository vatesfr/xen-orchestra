# ChangeLog

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
