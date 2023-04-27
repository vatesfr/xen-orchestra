// See http://momentjs.com/docs/#/use-it/browserify/
import 'moment/locale/hu'

import reactIntlData from 'react-intl/locale-data/hu'
import { addLocaleData } from 'react-intl'
addLocaleData(reactIntlData)

// ===================================================================

export default {
  // Original text: "Connecting"
  statusConnecting: 'Kapcsolódás',

  // Original text: "Disconnected"
  statusDisconnected: 'Lekapcsolódva',

  // Original text: "Loading…"
  statusLoading: 'Töltés…',

  // Original text: "Page not found"
  errorPageNotFound: 'Oldal nem található',

  // Original text: "no such item"
  errorNoSuchItem: 'nincs ilyen eszköz',

  // Original text: "Long click to edit"
  editableLongClickPlaceholder: 'Kiszolgálószan kattints a szerkesztéshez',

  // Original text: "Click to edit"
  editableClickPlaceholder: 'Kattints a szerkesztéshez',

  // Original text: "Browse files"
  browseFiles: 'Fájlok böngészése',

  // Original text: "OK"
  alertOk: 'OK',

  // Original text: "OK"
  confirmOk: 'OK',

  // Original text: "Cancel"
  confirmCancel: 'Mégsem',

  // Original text: "On error"
  onError: 'Hiba',

  // Original text: "Successful"
  successful: 'Sikeres',

  // Original text: "Copy to clipboard"
  copyToClipboard: 'Másolás a vágólapra',

  // Original text: "Master"
  pillMaster: 'Master',

  // Original text: "Home"
  homePage: 'Kezdőlap',

  // Original text: "VMs"
  homeVmPage: 'VPS',

  // Original text: "Hosts"
  homeHostPage: 'Kiszolgáló',

  // Original text: "Pools"
  homePoolPage: 'Pool',

  // Original text: "Templates"
  homeTemplatePage: 'Sablon',

  // Original text: "Storages"
  homeSrPage: 'Adattároló',

  // Original text: "Dashboard"
  dashboardPage: 'Dashboard',

  // Original text: "Overview"
  overviewDashboardPage: 'Áttekintés',

  // Original text: "Visualizations"
  overviewVisualizationDashboardPage: 'Vizualizáció',

  // Original text: "Statistics"
  overviewStatsDashboardPage: 'Statisztikák',

  // Original text: "Health"
  overviewHealthDashboardPage: 'Állapot',

  // Original text: "Self service"
  selfServicePage: 'Pirvát Datacenter',

  // Original text: "Backup"
  backupPage: 'Mentés',

  // Original text: "Jobs"
  jobsPage: 'Jobok',

  // Original text: "Updates"
  updatePage: 'Frissítések',

  // Original text: "Settings"
  settingsPage: 'Beállítások',

  // Original text: "Servers"
  settingsServersPage: 'Szerverek',

  // Original text: "Users"
  settingsUsersPage: 'Felhasználók',

  // Original text: "Groups"
  settingsGroupsPage: 'Csoportok',

  // Original text: "ACLs"
  settingsAclsPage: 'Jogok',

  // Original text: "Plugins"
  settingsPluginsPage: 'Bővítményok',

  // Original text: "Logs"
  settingsLogsPage: 'Logok',

  // Original text: "IPs"
  settingsIpsPage: 'IP Címek',

  // Original text: "Config"
  settingsConfigPage: 'Beállítás',

  // Original text: "About"
  aboutPage: 'Információ',

  // Original text: "About XO {xoaPlan}"
  aboutXoaPlan: 'Liszensz: {xoaPlan}',

  // Original text: "New"
  newMenu: 'Új',

  // Original text: "Tasks"
  taskMenu: 'Feladatok',

  // Original text: "Tasks"
  taskPage: 'Feladatok',

  // Original text: "VM"
  newVmPage: 'VPS',

  // Original text: "Storage"
  newSrPage: 'Adattároló',

  // Original text: "Server"
  newServerPage: 'Szerver',

  // Original text: "Import"
  newImport: 'Importálás',

  // Original text: 'XOSAN'
  xosan: undefined,

  // Original text: "Overview"
  backupOverviewPage: 'Áttekintés',

  // Original text: "New"
  backupNewPage: 'Új',

  // Original text: "Remotes"
  backupRemotesPage: 'Távoli Mentés',

  // Original text: "Restore"
  backupRestorePage: 'Visszaállítás',

  // Original text: "File restore"
  backupFileRestorePage: 'Fájl alapú visszaállítás',

  // Original text: "Schedule"
  schedule: 'Időzítés',

  // Original text: "New VM backup"
  newVmBackup: 'Új VPS Mentés',

  // Original text: "Edit VM backup"
  editVmBackup: 'VPS Mentés Szerkesztése',

  // Original text: "Backup"
  backup: 'Adatmentés',

  // Original text: "Rolling Snapshot"
  rollingSnapshot: 'Felülíródó Pillanatkép Mentés',

  // Original text: "Delta Backup"
  deltaBackup: 'Delta Mentés',

  // Original text: "Disaster Recovery"
  disasterRecovery: 'Disaster Recovery',

  // Original text: "Continuous Replication"
  continuousReplication: 'Folyamatos Replikáció',

  // Original text: "Overview"
  jobsOverviewPage: 'Áttekintés',

  // Original text: "New"
  jobsNewPage: 'Új',

  // Original text: "Scheduling"
  jobsSchedulingPage: 'Időzítés',

  // Original text: "Custom Job"
  customJob: 'Egyedi Job',

  // Original text: "User"
  userPage: 'Felhasználó',

  // Original text: "No support"
  noSupport: 'Nincs szupport',

  // Original text: "Free upgrade!"
  freeUpgrade: 'Ingyenes bővítés!',

  // Original text: "Sign out"
  signOut: 'Kijelentkezés',

  // Original text: "Edit my settings {username}"
  editUserProfile: 'Felhasználóm szerkesztése {felhasználónév}',

  // Original text: "Fetching data…"
  homeFetchingData: 'Adatok betöltése…',

  // Original text: "Welcome on Xen Orchestra!"
  homeWelcome: 'Üdvözöljük a Felhőben!',

  // Original text: "Add your XCP-ng hosts or pools"
  homeWelcomeText: 'Hozzáadása your XCP-ng kiszolgálók or pools',

  // Original text: "Some XCP-ng hosts have been registered but are not connected"
  homeConnectServerText: 'Some XCP-ng hosts have been registered but are not connected',

  // Original text: "Want some help?"
  homeHelp: 'Segítségre van szüksége?',

  // Original text: "Add server"
  homeAddServer: 'Hozzáadása server',

  // Original text: "Connect servers"
  homeConnectServer: 'Csatlakozás servers',

  // Original text: "Online Doc"
  homeOnlineDoc: 'Online Doc',

  // Original text: "Pro Support"
  homeProSupport: 'Pro Support',

  // Original text: "There are no VMs!"
  homeNoVms: 'Nincsenek VPS-ek!',

  // Original text: "Or…"
  homeNoVmsOr: 'Vagy…',

  // Original text: "Import VM"
  homeImportVm: 'VPS Importálása',

  // Original text: "Import an existing VM in xva format"
  homeImportVmMessage: 'Meglévő VPS importálása xva formátumban',

  // Original text: "Restore a backup"
  homeRestoreBackup: 'Adatmentés visszaállítása',

  // Original text: "Restore a backup from a remote store"
  homeRestoreBackupMessage: 'Adatmentés visszaállítása távoli helyről',

  // Original text: "This will create a new VM"
  homeNewVmMessage: 'Új VPS készítése',

  // Original text: "Filters"
  homeFilters: 'Szűrők',

  // Original text: "No results! Click here to reset your filters"
  homeNoMatches: 'Nincs eredmény! Szűrők visszaállításához kattintson ide',

  // Original text: "Pool"
  homeTypePool: 'Pool',

  // Original text: "Host"
  homeTypeHost: 'Kiszolgáló',

  // Original text: "VM"
  homeTypeVm: 'VPS',

  // Original text: "SR"
  homeTypeSr: 'Adattároló',

  // Original text: "Template"
  homeTypeVmTemplate: 'Sablon',

  // Original text: "Sort"
  homeSort: 'Rendezés',

  // Original text: "Pools"
  homeAllPools: 'Poolok',

  // Original text: "Hosts"
  homeAllHosts: 'Kiszolgálók',

  // Original text: "Tags"
  homeAllTags: 'Címke',

  // Original text: "New VM"
  homeNewVm: 'Új VPS',

  // Original text: 'None'
  homeFilterNone: undefined,

  // Original text: "Running hosts"
  homeFilterRunningHosts: 'Futó kiszolgálók',

  // Original text: "Disabled hosts"
  homeFilterDisabledHosts: 'Leállított kiszolgálók',

  // Original text: "Running VMs"
  homeFilterRunningVms: 'Futó VPS szerverek',

  // Original text: "Non running VMs"
  homeFilterNonRunningVms: 'Nem futó VPS szerverek',

  // Original text: "Pending VMs"
  homeFilterPendingVms: 'Függőben lévő VPS szerverek',

  // Original text: "HVM guests"
  homeFilterHvmGuests: 'HVM guests',

  // Original text: "Tags"
  homeFilterTags: 'Címkék',

  // Original text: "Sort by"
  homeSortBy: 'Rendezés',

  // Original text: "Name"
  homeSortByName: 'Név',

  // Original text: "Power state"
  homeSortByPowerstate: 'Állapot',

  // Original text: "RAM"
  homeSortByRAM: 'RAM',

  // Original text: "vCPUs"
  homeSortByvCPUs: 'vCPUs',

  // Original text: "CPUs"
  homeSortByCpus: 'CPUs',

  // Original text: "Shared/Not shared"
  homeSortByShared: 'Osztott/Nem osztott',

  // Original text: "Size"
  homeSortBySize: 'Méret',

  // Original text: "Usage"
  homeSortByUsage: 'Használat',

  // Original text: "Type"
  homeSortByType: 'Típus',

  // Original text: "{displayed, number}x {icon} (on {total, number})"
  homeDisplayedItems: '{displayed, number}x {icon} (on {total, number})',

  // Original text: "{selected, number}x {icon} selected (on {total, number})"
  homeSelectedItems: '{selected, number}x {icon} kiválasztott (on {total, number})',

  // Original text: "More"
  homeMore: 'Több',

  // Original text: "Migrate to…"
  homeMigrateTo: 'Migálás ide…',

  // Original text: "Missing patches"
  homeMissingPatches: 'Missing patches',

  // Original text: "Master:"
  homePoolMaster: 'Master:',

  // Original text: "Resource set: {resourceSet}"
  homeResourceSet: 'Resource set: {resourceSet}',

  // Original text: "High Availability"
  highAvailability: 'High Availability',

  // Original text: "Shared {type}"
  srSharedType: 'Osztott {type}',

  // Original text: "Not shared {type}"
  srNotSharedType: 'Nem osztott {type}',

  // Original text: "Add"
  add: 'Hozzáadás',

  // Original text: "Select all"
  selectAll: 'Mindet kijelöl',

  // Original text: "Remove"
  remove: 'Eltávolítás',

  // Original text: "Preview"
  preview: 'Előnézet',

  // Original text: "Item"
  item: 'Eszköz',

  // Original text: "No selected value"
  noSelectedValue: 'Nincs kiválasztott érték',

  // Original text: "Choose user(s) and/or group(s)"
  selectSubjects: 'Válasszon felhasználó(ka)t és/vagy csoporto(ka)t',

  // Original text: "Select Object(s)…"
  selectObjects: 'Objektum(ok) választása…',

  // Original text: "Choose a role"
  selectRole: 'Szerep választása',

  // Original text: "Select Host(s)…"
  selectHosts: 'Kiszolgáló(k) választása)…',

  // Original text: "Select object(s)…"
  selectHostsVms: 'Objektum(ok) választása…',

  // Original text: "Select Network(s)…"
  selectNetworks: 'Hálózat(ok) választása…',

  // Original text: "Select PIF(s)…"
  selectPifs: 'PIF választása…',

  // Original text: "Select Pool(s)…"
  selectPools: 'Pool(ok) választása…',

  // Original text: "Select Remote(s)…"
  selectRemotes: 'Válasszon Remote(s)…',

  // Original text: "Select resource set(s)…"
  selectResourceSets: 'Erőforrás készlet választása…',

  // Original text: "Select template(s)…"
  selectResourceSetsVmTemplate: 'Sablon(ok) választása…',

  // Original text: "Select SR(s)…"
  selectResourceSetsSr: 'Adattároló választása…',

  // Original text: "Select network(s)…"
  selectResourceSetsNetwork: 'Hálózat(ok) választása…',

  // Original text: "Select disk(s)…"
  selectResourceSetsVdi: 'Diszk(ek) választása…',

  // Original text: "Select SSH key(s)…"
  selectSshKey: 'SSH kulcs(ok) választása…',

  // Original text: "Select SR(s)…"
  selectSrs: 'Adattároló választása…',

  // Original text: "Select VM(s)…"
  selectVms: 'VPS(ek) választása…',

  // Original text: "Select VM template(s)…"
  selectVmTemplates: 'VPS sablon(ok)választása…',

  // Original text: "Select tag(s)…"
  selectTags: 'Címkék választása…',

  // Original text: "Select disk(s)…"
  selectVdis: 'Diszk(ek) választása…',

  // Original text: "Select timezone…"
  selectTimezone: 'Időzóna választása…',

  // Original text: "Select IP(s)…"
  selectIp: 'IP(k) választása…',

  // Original text: "Select IP pool(s)…"
  selectIpPool: 'IP tartomány(ok) választása…',

  // Original text: "Fill required informations."
  fillRequiredInformations: 'Szükséges információk kitöltése.',

  // Original text: "Fill informations (optional)"
  fillOptionalInformations: 'Információk kitöltése (nem kötelező)',

  // Original text: "Reset"
  selectTableReset: 'Visszaállítás',

  // Original text: "Month"
  schedulingMonth: 'Hónap',

  // Original text: "Every N month"
  schedulingEveryNMonth: 'Minden adott hónapban',

  // Original text: "Each selected month"
  schedulingEachSelectedMonth: 'Minden kiválasztott hónapban',

  // Original text: "Day"
  schedulingDay: 'Nap',

  // Original text: "Every N day"
  schedulingEveryNDay: 'Megadott naponként',

  // Original text: "Each selected day"
  schedulingEachSelectedDay: 'Minden kiválasztott napon',

  // Original text: "Switch to week days"
  schedulingSetWeekDayMode: 'Váltás a hét napjaira',

  // Original text: "Switch to month days"
  schedulingSetMonthDayMode: 'Váltás a hónap napjaira',

  // Original text: "Hour"
  schedulingHour: 'Óra',

  // Original text: "Each selected hour"
  schedulingEachSelectedHour: 'Minden kiválasztott órában',

  // Original text: "Every N hour"
  schedulingEveryNHour: 'Minden X órában',

  // Original text: "Minute"
  schedulingMinute: 'Perc',

  // Original text: "Each selected minute"
  schedulingEachSelectedMinute: 'Minden kiválasztott percben',

  // Original text: "Every N minute"
  schedulingEveryNMinute: 'Minden X-edik percben',

  // Original text: "Every month"
  selectTableAllMonth: 'Minden hónapban',

  // Original text: "Every day"
  selectTableAllDay: 'Minden napon',

  // Original text: "Every hour"
  selectTableAllHour: 'Minden órában',

  // Original text: "Every minute"
  selectTableAllMinute: 'Minden percben',

  // Original text: "Reset"
  schedulingReset: 'Visszaállítás',

  // Original text: "Unknown"
  unknownSchedule: 'Ismeretlen',

  // Original text: "Web browser timezone"
  timezonePickerUseLocalTime: 'Böngésző időzóna',

  // Original text: "Server timezone ({value})"
  serverTimezoneOption: 'Szerver időzóna ({Value})',

  // Original text: "Cron Pattern:"
  cronPattern: 'Cron példa:',

  // Original text: "Cannot edit backup"
  backupEditNotFoundTitle: 'Az adatmentés nem szerkeszthető',

  // Original text: "Missing required info for edition"
  backupEditNotFoundMessage: 'Hiányzó szükséges információ',

  // Original text: "Job"
  job: 'Feladat',

  // Original text: 'Job {job}'
  jobModalTitle: undefined,

  // Original text: "ID"
  jobId: 'Feladat Azonosító',

  // Original text: 'Type'
  jobType: undefined,

  // Original text: "Name"
  jobName: 'Név',

  // Original text: "Name of your job (forbidden: \"_\")"
  jobNamePlaceholder: 'Feladat neve (forbidden: "_")',

  // Original text: "Start"
  jobStart: 'Elindítás',

  // Original text: "End"
  jobEnd: 'Befejezés',

  // Original text: "Duration"
  jobDuration: 'Időtartam',

  // Original text: "Status"
  jobStatus: 'Státusz',

  // Original text: "Action"
  jobAction: 'Akció',

  // Original text: "Tag"
  jobTag: 'Címke',

  // Original text: "Scheduling"
  jobScheduling: 'Időzítés',

  // Original text: "State"
  jobState: 'Állapot',

  // Original text: 'Enabled'
  jobStateEnabled: undefined,

  // Original text: 'Disabled'
  jobStateDisabled: undefined,

  // Original text: "Timezone"
  jobTimezone: 'Időzóna',

  // Original text: "Server"
  jobServerTimezone: 'Szerver',

  // Original text: "Run job"
  runJob: 'Feladat futtatása',

  // Original text: "One shot running started. See overview for logs."
  runJobVerbose: 'Sikeresen elindítva. A logokat kérjük mindneképp nézze meg az eredményekhez.',

  // Original text: "Started"
  jobStarted: 'Elindítva',

  // Original text: "Finished"
  jobFinished: 'Befejezve',

  // Original text: "Save"
  saveBackupJob: 'Mentés',

  // Original text: "Remove backup job"
  deleteBackupSchedule: 'Mentési feladat eltávolítása',

  // Original text: "Are you sure you want to delete this backup job?"
  deleteBackupScheduleQuestion: 'Biztos benne, hogy törli ezt a mentési feladatot?',

  // Original text: "Enable immediately after creation"
  scheduleEnableAfterCreation: 'Létrehozás utáni bekapcsolás engedélyezése',

  // Original text: "You are editing Schedule {name} ({id}). Saving will override previous schedule state."
  scheduleEditMessage: 'A következő Időzítést szerkeszti: {név} ({id}). A mentés felülírja az előző állapotot.',

  // Original text: "You are editing job {name} ({id}). Saving will override previous job state."
  jobEditMessage: 'A következő Feladatot szerkeszti:  {név} ({id}). A mentés felülírja az előző állapotot.',

  // Original text: "No scheduled jobs."
  noScheduledJobs: 'Nincsenek időzített feladatok.',

  // Original text: "No jobs found."
  noJobs: 'Nincsenek feladatok.',

  // Original text: "No schedules found"
  noSchedules: 'Nincsenek időzítések',

  // Original text: "Select a xo-server API command"
  jobActionPlaceHolder: 'API parancs kiválasztása',

  // Original text: "Schedules"
  jobSchedules: 'Időzítések',

  // Original text: "Name of your schedule"
  jobScheduleNamePlaceHolder: 'Időzítés neve',

  // Original text: "Select a Job"
  jobScheduleJobPlaceHolder: 'Feladat kiválasztása',

  // Original text: "Job owner"
  jobOwnerPlaceholder: 'Feladat tulajdonosa',

  // Original text: "This job's creator no longer exists"
  jobUserNotFound: 'A feladat létrehozója már nem érhető el a rendszerben',

  // Original text: "This backup's creator no longer exists"
  backupUserNotFound: 'A mentési feladat létrehozója már nem érhető el a rendszerben',

  // Original text: "Backup owner"
  backupOwner: 'Mentés tulajdonosa',

  // Original text: "Select your backup type:"
  newBackupSelection: 'Válassza ki a mentési típust:',

  // Original text: "Select backup mode:"
  smartBackupModeSelection: 'Válassza ki a mentési módot:',

  // Original text: "Normal backup"
  normalBackup: 'Normál mentés',

  // Original text: "Smart backup"
  smartBackup: 'Okos mentés',

  // Original text: "Local remote selected"
  localRemoteWarningTitle: 'Lokális távoli kiválasztva',

  // Original text: "Warning: local remotes will use limited XOA disk space. Only for advanced users."
  localRemoteWarningMessage:
    'Figyelmeztetés: lokális távoli mentés korlátozott rendszer helyet használ. Kizárólag haladó felhasználóknak ajánlott, ha biztos benne, hogy ez a szervere elérhetőségét nem befolyásolja!.',

  // Original text: "Warning: this feature works only with XenServer 6.5 or newer."
  backupVersionWarning: 'Figyelmeztetés: 6.5 vagy újabb Xen támogatás szükséges!',

  // Original text: "VMs"
  editBackupVmsTitle: 'VPS-ek',

  // Original text: "VMs statuses"
  editBackupSmartStatusTitle: 'VPS sátuszok',

  // Original text: "Resident on"
  editBackupSmartResidentOn: 'Helye',

  // Original text: "Pools"
  editBackupSmartPools: 'Poolok',

  // Original text: "Tags"
  editBackupSmartTags: 'Cimkék',

  // Original text: "VMs Tags"
  editBackupSmartTagsTitle: 'VPS Cimkék',

  // Original text: "Reverse"
  editBackupNot: 'Reverse',

  // Original text: "Tag"
  editBackupTagTitle: 'Cimke',

  // Original text: "Report"
  editBackupReportTitle: 'Riport',

  // Original text: "Enable immediately after creation"
  editBackupScheduleEnabled: 'Azonnal a létrehozás után',

  // Original text: "Depth"
  editBackupDepthTitle: 'Mélység',

  // Original text: "Remote"
  editBackupRemoteTitle: 'Távoli',

  // Original text: "Remote stores for backup"
  remoteList: 'Távoli Mentési Helyek',

  // Original text: "New File System Remote"
  newRemote: 'Új Távoli Fájl Rendszer',

  // Original text: "Local"
  remoteTypeLocal: 'Helyi',

  // Original text: "NFS"
  remoteTypeNfs: 'NFS',

  // Original text: "SMB"
  remoteTypeSmb: 'SMB',

  // Original text: "Type"
  remoteType: 'Típus',

  // Original text: "Test your remote"
  remoteTestTip: 'Tesztelés',

  // Original text: "Test Remote"
  testRemote: 'Távoli Tesztelése',

  // Original text: "Test failed for {name}"
  remoteTestFailure: 'Sikertelen tesztelés!!! {név}',

  // Original text: "Test passed for {name}"
  remoteTestSuccess: 'Sikeres! {név}',

  // Original text: "Error"
  remoteTestError: 'Hiba',

  // Original text: "Test Step"
  remoteTestStep: 'Teszt Lépés',

  // Original text: "Test file"
  remoteTestFile: 'Teszt Fájl',

  // Original text: 'Test name'
  remoteTestName: undefined,

  // Original text: 'Remote name already exists!'
  remoteTestNameFailure: undefined,

  // Original text: "The remote appears to work correctly"
  remoteTestSuccessMessage: 'A távoli úgy tűnik megfelelően működik',

  // Original text: 'Connection failed'
  remoteConnectionFailed: undefined,

  // Original text: "Name"
  remoteName: 'Név',

  // Original text: "Path"
  remotePath: 'Útvonal',

  // Original text: "State"
  remoteState: 'Tátusz',

  // Original text: "Device"
  remoteDevice: 'Eszköz',

  // Original text: "Share"
  remoteShare: 'Megosztás',

  // Original text: 'Action'
  remoteAction: undefined,

  // Original text: "Auth"
  remoteAuth: 'Bejelentkezés',

  // Original text: "Mounted"
  remoteMounted: 'Felcsatolva',

  // Original text: "Unmounted"
  remoteUnmounted: 'Lecsatolva',

  // Original text: "Connect"
  remoteConnectTip: 'Csatlakozás',

  // Original text: "Disconnect"
  remoteDisconnectTip: 'Lecsatlakozás',

  // Original text: 'Connected'
  remoteConnected: undefined,

  // Original text: 'Disconnected'
  remoteDisconnected: undefined,

  // Original text: "Delete"
  remoteDeleteTip: 'Törlés',

  // Original text: "remote name *"
  remoteNamePlaceHolder: 'távoli név *',

  // Original text: "Name *"
  remoteMyNamePlaceHolder: 'Név',

  // Original text: "/path/to/backup"
  remoteLocalPlaceHolderPath: '/path/to/backup',

  // Original text: "host *"
  remoteNfsPlaceHolderHost: 'kiszolgáló',

  // Original text: "path/to/backup"
  remoteNfsPlaceHolderPath: 'path/to/backup',

  // Original text: "subfolder [path\\to\\backup]"
  remoteSmbPlaceHolderRemotePath: 'almappa [path\\to\\backup]',

  // Original text: "Username"
  remoteSmbPlaceHolderUsername: 'Felhasználónév',

  // Original text: "Password"
  remoteSmbPlaceHolderPassword: 'Jelszó',

  // Original text: "Domain"
  remoteSmbPlaceHolderDomain: 'Domain',

  // Original text: "<address>\\<share> *"
  remoteSmbPlaceHolderAddressShare: '<address>\\<share>',

  // Original text: "password(fill to edit)"
  remotePlaceHolderPassword: 'jelszó(kattintson a módosításhoz)',

  // Original text: "Create a new SR"
  newSrTitle: 'Új Adattároló készítése',

  // Original text: "General"
  newSrGeneral: 'Általános',

  // Original text: "Select Storage Type:"
  newSrTypeSelection: 'Adattároló Típus Kiválasztása:',

  // Original text: "Settings"
  newSrSettings: 'Beállítások',

  // Original text: "Storage Usage"
  newSrUsage: 'Adattároló Használat',

  // Original text: "Summary"
  newSrSummary: 'Összesítés',

  // Original text: "Host"
  newSrHost: 'Kiszolgáló',

  // Original text: "Type"
  newSrType: 'Típus',

  // Original text: "Name"
  newSrName: 'Név',

  // Original text: "Description"
  newSrDescription: 'Leírás',

  // Original text: "Server"
  newSrServer: 'Szerver',

  // Original text: "Path"
  newSrPath: 'Útvonal',

  // Original text: "IQN"
  newSrIqn: 'IQN',

  // Original text: "LUN"
  newSrLun: 'LUN',

  // Original text: "with auth."
  newSrAuth: 'with auth.',

  // Original text: "User Name"
  newSrUsername: 'Felhasználónév',

  // Original text: "Password"
  newSrPassword: 'Jelszó',

  // Original text: "Device"
  newSrDevice: 'Eszköz',

  // Original text: "in use"
  newSrInUse: 'használatban',

  // Original text: "Size"
  newSrSize: 'Méret',

  // Original text: "Create"
  newSrCreate: 'Létrehozás',

  // Original text: "Storage name"
  newSrNamePlaceHolder: 'Adattároló név',

  // Original text: "Storage description"
  newSrDescPlaceHolder: 'Adattároló leírása',

  // Original text: "Address"
  newSrAddressPlaceHolder: 'Cím',

  // Original text: "[port]"
  newSrPortPlaceHolder: '[port]',

  // Original text: "Username"
  newSrUsernamePlaceHolder: 'Felhasználónév',

  // Original text: "Password"
  newSrPasswordPlaceHolder: 'Jelszó',

  // Original text: "Device, e.g /dev/sda…"
  newSrLvmDevicePlaceHolder: 'Eszköz, pl.: /dev/sda…',

  // Original text: "/path/to/directory"
  newSrLocalPathPlaceHolder: '/path/to/directory',

  // Original text: "Users/Groups"
  subjectName: 'Felhasználók/Csoportok',

  // Original text: "Object"
  objectName: 'Objektum',

  // Original text: "No acls found"
  aclNoneFound: 'Jogosultság nem található',

  // Original text: "Role"
  roleName: 'Szerepkör',

  // Original text: "Create"
  aclCreate: 'Létrehozás',

  // Original text: "New Group Name"
  newGroupName: 'Új Csoport Név',

  // Original text: "Create Group"
  createGroup: 'Csoport Létrehozás',

  // Original text: "Create"
  createGroupButton: 'Létrehozás',

  // Original text: "Delete Group"
  deleteGroup: 'Csoport Törlés',

  // Original text: "Are you sure you want to delete this group?"
  deleteGroupConfirm: 'Biztos benne, hogy törli a csoportot?',

  // Original text: "Remove user from Group"
  removeUserFromGroup: 'Felhasználó törlése a csoportból',

  // Original text: "Are you sure you want to delete this user?"
  deleteUserConfirm: 'Biztos benne, hogy törli a felhasználót?',

  // Original text: "Delete User"
  deleteUser: 'Felhasználó Törlése',

  // Original text: "no user"
  noUser: 'no felhasználó',

  // Original text: "unknown user"
  unknownUser: 'ismeretlen felhasználó',

  // Original text: "No group found"
  noGroupFound: 'Csoport nem található',

  // Original text: "Name"
  groupNameColumn: 'Név',

  // Original text: "Users"
  groupUsersColumn: 'Felhasználók',

  // Original text: "Add User"
  addUserToGroupColumn: 'Felhasználó Hozzáadása',

  // Original text: "Email"
  userNameColumn: 'E-mail',

  // Original text: "Permissions"
  userPermissionColumn: 'Jogosultságok',

  // Original text: "Password"
  userPasswordColumn: 'Jelszó',

  // Original text: "Email"
  userName: 'E-mail',

  // Original text: "Password"
  userPassword: 'Jelszó',

  // Original text: "Create"
  createUserButton: 'Létrehozás',

  // Original text: "No user found"
  noUserFound: 'Felhasználó nem található',

  // Original text: "User"
  userLabel: 'Felhasználó',

  // Original text: "Admin"
  adminLabel: 'Admin',

  // Original text: "No user in group"
  noUserInGroup: 'Nincs felhasználó a csoportban',

  // Original text: "{users} user{users, plural, one {} other {s}}"
  countUsers: '{user} felhasználó{users, plural, one {} other {s}}',

  // Original text: "Select Permission"
  selectPermission: 'Válasszon Jogosultságot',

  // Original text: "No plugins found"
  noPlugins: 'Bővítményok nem találhatóak',

  // Original text: "Auto-load at server start"
  autoloadPlugin: 'Automatikus betöltés szerver indításakor',

  // Original text: "Save configuration"
  savePluginConfiguration: 'Beállítás Mentése',

  // Original text: "Delete configuration"
  deletePluginConfiguration: 'Beállítás Törlése',

  // Original text: "Plugin error"
  pluginError: 'Bővítmény hiba',

  // Original text: "Unknown error"
  unknownPluginError: 'Ismeretlen hiba',

  // Original text: "Purge plugin configuration"
  purgePluginConfiguration: 'Bővítmény beállítás törlése',

  // Original text: "Are you sure you want to purge this configuration ?"
  purgePluginConfigurationQuestion: 'Biztos benne hogy törli ezt a beállítást?',

  // Original text: "Edit"
  editPluginConfiguration: 'Szerkesztés',

  // Original text: "Cancel"
  cancelPluginEdition: 'Mégsem',

  // Original text: "Plugin configuration"
  pluginConfigurationSuccess: 'Bővítmény beállítás',

  // Original text: "Plugin configuration successfully saved!"
  pluginConfigurationChanges: 'Bővítmény beállítás sikeresen mentve!',

  // Original text: "Predefined configuration"
  pluginConfigurationPresetTitle: 'Előre definiált konfiguráció',

  // Original text: "Choose a predefined configuration."
  pluginConfigurationChoosePreset: 'Előre definiált konfiguráció választása.',

  // Original text: "Apply"
  applyPluginPreset: 'Mehet',

  // Original text: "Save filter error"
  saveNewUserFilterErrorTitle: 'Szűrő mentés hiba',

  // Original text: "Bad parameter: name must be given."
  saveNewUserFilterErrorBody: 'Rossz paraméter: név megadása kötelező.',

  // Original text: "Name:"
  filterName: 'Név:',

  // Original text: "Value:"
  filterValue: 'Érték:',

  // Original text: "Save new filter"
  saveNewFilterTitle: 'Új szűrő mentése',

  // Original text: "Set custom filters"
  setUserFiltersTitle: 'Egyedi szűrők beállítása',

  // Original text: "Are you sure you want to set custom filters?"
  setUserFiltersBody: 'Biztos benne, hogy beállítja az egyedi szűrőket?',

  // Original text: "Remove custom filter"
  removeUserFilterTitle: 'Egyedi szűrő eltávolítása',

  // Original text: "Are you sure you want to remove custom filter?"
  removeUserFilterBody: 'Biztos benne, hogy eltávolítja az egyedi szűrőt?',

  // Original text: "Default filter"
  defaultFilter: 'Alapértelmezett szűrő',

  // Original text: "Default filters"
  defaultFilters: 'Alapértelmezett szűrők',

  // Original text: "Custom filters"
  customFilters: 'Egyedi szűrők',

  // Original text: "Customize filters"
  customizeFilters: 'Szűrők testre szabása',

  // Original text: "Save custom filters"
  saveCustomFilters: 'Egyedi szűrők mentése',

  // Original text: "Start"
  startVmLabel: 'Elindít',

  // Original text: "Recovery start"
  recoveryModeLabel: 'Helyreállítás Elindítása',

  // Original text: "Suspend"
  suspendVmLabel: 'Felfüggesztés',

  // Original text: "Stop"
  stopVmLabel: 'Leállítás',

  // Original text: "Force shutdown"
  forceShutdownVmLabel: 'Leállítás Kényszerítése',

  // Original text: "Reboot"
  rebootVmLabel: 'Újraindítás',

  // Original text: "Force reboot"
  forceRebootVmLabel: 'Újraindítás Kényszerítése',

  // Original text: "Delete"
  deleteVmLabel: 'Törlés',

  // Original text: "Migrate"
  migrateVmLabel: 'Migrálás',

  // Original text: "Snapshot"
  snapshotVmLabel: 'Pillanatkép',

  // Original text: "Export"
  exportVmLabel: 'Exportálás',

  // Original text: "Resume"
  resumeVmLabel: 'Folytatás',

  // Original text: "Copy"
  copyVmLabel: 'Másolás',

  // Original text: "Clone"
  cloneVmLabel: 'Klónozás',

  // Original text: "Fast clone"
  fastCloneVmLabel: 'Gyors Klónozás',

  // Original text: "Convert to template"
  convertVmToTemplateLabel: 'Sablonná konvertálás',

  // Original text: "Console"
  vmConsoleLabel: 'Konzol',

  // Original text: "Rescan all disks"
  srRescan: 'Összes diszk újraszkennelése',

  // Original text: "Connect to all hosts"
  srReconnectAll: 'Csatlakoztatás az összes kiszolgálóhoz',

  // Original text: "Disconnect from all hosts"
  srDisconnectAll: 'Lecsatlakoztatás az összes kiszolgálóról',

  // Original text: "Forget this SR"
  srForget: 'Adattároló Elfelejtése',

  // Original text: "Forget SRs"
  srsForget: 'Adattároló Elfelejtése',

  // Original text: "Remove this SR"
  srRemoveButton: 'Adattároló Eltávolítás',

  // Original text: "No VDIs in this storage"
  srNoVdis: 'No VDIs in this storage',

  // Original text: "Pool RAM usage:"
  poolTitleRamUsage: 'Pool RAM használat:',

  // Original text: "{used} used on {total}"
  poolRamUsage: '{used} used on {total}',

  // Original text: "Master:"
  poolMaster: 'Master:',

  // Original text: "Display all hosts of this pool"
  displayAllHosts: 'Display all kiszolgálók of this pool',

  // Original text: "Display all storages of this pool"
  displayAllStorages: 'Display all storages of this pool',

  // Original text: "Display all VMs of this pool"
  displayAllVMs: 'Display all VMs of this pool',

  // Original text: "Hosts"
  hostsTabName: 'Kiszolgálók',

  // Original text: 'Vms'
  vmsTabName: undefined,

  // Original text: 'Srs'
  srsTabName: undefined,

  // Original text: "High Availability"
  poolHaStatus: 'High Availability',

  // Original text: "Enabled"
  poolHaEnabled: 'Bekapcsolva',

  // Original text: "Disabled"
  poolHaDisabled: 'Kikapcsolva',

  // Original text: "Name"
  hostNameLabel: 'Név',

  // Original text: "Description"
  hostDescription: 'Leírás',

  // Original text: "Memory"
  hostMemory: 'Memória',

  // Original text: "No hosts"
  noHost: 'Nincsenek kiszolgálók',

  // Original text: "{used}% used ({free} free)"
  memoryLeftTooltip: '{used}% used ({free} free)',

  // Original text: "PIF"
  pif: 'PIF',

  // Original text: "Name"
  poolNetworkNameLabel: 'Név',

  // Original text: "Description"
  poolNetworkDescription: 'Leírás',

  // Original text: "PIFs"
  poolNetworkPif: 'PIFs',

  // Original text: "No networks"
  poolNoNetwork: 'Nincsenek hálózatok',

  // Original text: "MTU"
  poolNetworkMTU: 'MTU',

  // Original text: "Connected"
  poolNetworkPifAttached: 'Kapcsolódva',

  // Original text: "Disconnected"
  poolNetworkPifDetached: 'Lekapcsolódva',

  // Original text: "Show PIFs"
  showPifs: 'Show PIFs',

  // Original text: "Hide PIFs"
  hidePifs: 'Hide PIFs',

  // Original text: "Show details"
  showDetails: 'Részletek mutatása',

  // Original text: "Hide details"
  hideDetails: 'Részletek elrejtése',

  // Original text: "No stats"
  poolNoStats: 'Nincsenek statisztikák',

  // Original text: "All hosts"
  poolAllHosts: 'Minden kiszolgáló',

  // Original text: "Add SR"
  addSrLabel: 'Adattároló Hozzáadása',

  // Original text: "Add VM"
  addVmLabel: 'VPS Hozzáadása',

  // Original text: "Add Host"
  addHostLabel: 'Kiszolgáló Hozzáadása',

  // Original text: "Disconnect"
  disconnectServer: 'Lecsatol',

  // Original text: "Start"
  startHostLabel: 'Elindítás',

  // Original text: "Stop"
  stopHostLabel: 'Leállítás',

  // Original text: "Enable"
  enableHostLabel: 'Bekapcsol',

  // Original text: "Disable"
  disableHostLabel: 'Kikapcsol',

  // Original text: "Restart toolstack"
  restartHostAgent: 'Toolstack újraindítása',

  // Original text: "Force reboot"
  forceRebootHostLabel: 'Újraindítás Kényszerítése',

  // Original text: "Reboot"
  rebootHostLabel: 'Újraindítás',

  // Original text: "Error while restarting host"
  noHostsAvailableErrorTitle: 'Hiba a kiszolgáló újraindítása közben',

  // Original text: "Some VMs cannot be migrated before restarting this host. Please try force reboot."
  noHostsAvailableErrorMessage: 'Some VMs cannot be migrated before restarting this Host. Please try force Restart.',

  // Original text: "Error while restarting hosts"
  failHostBulkRestartTitle: 'Hiba lépett fel a kiszolgálók újraindítása közben',

  // Original text: "{failedHosts}/{totalHosts} host{failedHosts, plural, one {} other {s}} could not be restarted."
  failHostBulkRestartMessage: '{failedhosts}/{totalHosts} Kiszolgáló újraindítása nem sikerült.',

  // Original text: "Reboot to apply updates"
  rebootUpdateHostLabel: 'A változtatások életbe lépéséhez újraindítás szükséges',

  // Original text: "Emergency mode"
  emergencyModeLabel: 'Vészhelyzet üzem',

  // Original text: "Storage"
  storageTabName: 'Adattároló',

  // Original text: "Patches"
  patchesTabName: 'Javítások',

  // Original text: "Load average"
  statLoad: 'Átlagos load',

  // Original text: "RAM Usage: {memoryUsed}"
  memoryHostState: 'Memória használat: {MemoryUsed}',

  // Original text: "Hardware"
  hardwareHostSettingsLabel: 'Hardver',

  // Original text: "Address"
  hostAddress: 'Cím',

  // Original text: "Status"
  hostStatus: 'Állapot',

  // Original text: "Build number"
  hostBuildNumber: 'Build number',

  // Original text: "iSCSI name"
  hostIscsiName: 'iSCSI név',

  // Original text: "Version"
  hostXenServerVersion: 'Verzió',

  // Original text: "Enabled"
  hostStatusEnabled: 'Bekapcsolva',

  // Original text: "Disabled"
  hostStatusDisabled: 'Kikapcsolva',

  // Original text: "Power on mode"
  hostPowerOnMode: 'Power on mode',

  // Original text: "Host uptime"
  hostStartedSince: 'Kiszolgáló uptime',

  // Original text: "Toolstack uptime"
  hostStackStartedSince: 'Toolstack uptime',

  // Original text: "CPU model"
  hostCpusModel: 'CPU model',

  // Original text: "Core (socket)"
  hostCpusNumber: 'Core (socket)',

  // Original text: "Manufacturer info"
  hostManufacturerinfo: 'Gyártó infó',

  // Original text: "BIOS info"
  hostBiosinfo: 'BIOS infó',

  // Original text: "Licence"
  licenseHostSettingsLabel: 'Liszensz',

  // Original text: "Type"
  hostLicenseType: 'Típus',

  // Original text: "Socket"
  hostLicenseSocket: 'Foglalat',

  // Original text: "Expiry"
  hostLicenseExpiry: 'Lejárat',

  // Original text: "Installed supplemental packs"
  supplementalPacks: 'Installed supplemental packs',

  // Original text: "Install new supplemental pack"
  supplementalPackNew: 'Install new supplemental pack',

  // Original text: "Install supplemental pack on every host"
  supplementalPackPoolNew: 'Install supplemental pack on every host',

  // Original text: "{name} (by {author})"
  supplementalPackTitle: '{név} (by {author})',

  // Original text: "Installation started"
  supplementalPackInstallStartedTitle: 'Installation Started',

  // Original text: "Installing new supplemental pack…"
  supplementalPackInstallStartedMessage: 'Installing new supplemental pack…',

  // Original text: "Installation error"
  supplementalPackInstallErrorTitle: 'Installation error',

  // Original text: "The installation of the supplemental pack failed."
  supplementalPackInstallErrorMessage: 'The installation of the supplemental pack failed.',

  // Original text: "Installation success"
  supplementalPackInstallSuccessTitle: 'Installation success',

  // Original text: "Supplemental pack successfully installed."
  supplementalPackInstallSuccessMessage: 'Supplemental pack successfully installed.',

  // Original text: "Add a network"
  networkCreateButton: 'Add a Hálózat',

  // Original text: "Add a bonded network"
  networkCreateBondedButton: 'Add a bonded Hálózat',

  // Original text: "Device"
  pifDeviceLabel: 'Eszköz',

  // Original text: "Network"
  pifNetworkLabel: 'Hálózat',

  // Original text: "VLAN"
  pifVlanLabel: 'VLAN',

  // Original text: "Address"
  pifAddressLabel: 'Cím',

  // Original text: "Mode"
  pifModeLabel: 'Mode',

  // Original text: "MAC"
  pifMacLabel: 'MAC',

  // Original text: "MTU"
  pifMtuLabel: 'MTU',

  // Original text: "Status"
  pifStatusLabel: 'Állapot',

  // Original text: "Connected"
  pifStatusConnected: 'Kapcsolódva',

  // Original text: "Disconnected"
  pifStatusDisconnected: 'Lekapcsolódva',

  // Original text: "No physical interface detected"
  pifNoInterface: 'No physical interface detected',

  // Original text: "This interface is currently in use"
  pifInUse: 'This interface is currently in use',

  // Original text: "Default locking mode"
  defaultLockingMode: 'Alapértelmezett locking üzem',

  // Original text: "Configure IP address"
  pifConfigureIp: 'Configure IP cím',

  // Original text: "Invalid parameters"
  configIpErrorTitle: 'Invalid parameters',

  // Original text: "IP address and netmask required"
  configIpErrorMessage: 'IP cím and netmask required',

  // Original text: "Static IP address"
  staticIp: 'Static IP cím',

  // Original text: "Netmask"
  netmask: 'Netmask',

  // Original text: "DNS"
  dns: 'DNS',

  // Original text: "Gateway"
  gateway: 'Gateway',

  // Original text: "Add a storage"
  addSrDeviceButton: 'Add a storage',

  // Original text: "Name"
  srNameLabel: 'Név',

  // Original text: "Type"
  srType: 'Típus',

  // Original text: 'Action'
  pbdAction: undefined,

  // Original text: "Status"
  pbdStatus: 'Állapot',

  // Original text: "Connected"
  pbdStatusConnected: 'Kapcsolódva',

  // Original text: "Disconnected"
  pbdStatusDisconnected: 'Lekapcsolódva',

  // Original text: "Connect"
  pbdConnect: 'Csatlakozás',

  // Original text: "Disconnect"
  pbdDisconnect: 'Lecsatlakozás',

  // Original text: "Forget"
  pbdForget: 'Elfelejt',

  // Original text: "Shared"
  srShared: 'Megosztva',

  // Original text: "Not shared"
  srNotShared: 'Nincs megosztva',

  // Original text: "No storage detected"
  pbdNoSr: 'No storage detected',

  // Original text: "Name"
  patchNameLabel: 'Név',

  // Original text: "Install all patches"
  patchUpdateButton: 'Install all patches',

  // Original text: "Description"
  patchDescription: 'Leírás',

  // Original text: "Applied date"
  patchApplied: 'Applied Dátum',

  // Original text: "Size"
  patchSize: 'Méret',

  // Original text: "Status"
  patchStatus: 'Állapot',

  // Original text: "Applied"
  patchStatusApplied: 'Applied',

  // Original text: "Missing patches"
  patchStatusNotApplied: 'Missing patches',

  // Original text: "No patch detected"
  patchNothing: 'No patch detected',

  // Original text: "Release date"
  patchReleaseDate: 'Release Dátum',

  // Original text: "Guidance"
  patchGuidance: 'Guidance',

  // Original text: "Action"
  patchAction: 'Művelet',

  // Original text: "Applied patches"
  hostAppliedPatches: 'Applied patches',

  // Original text: "Missing patches"
  hostMissingPatches: 'Missing patches',

  // Original text: "Host up-to-date!"
  hostUpToDate: 'Host up-to-Dátum!',

  // Original text: "Refresh patches"
  refreshPatches: 'Refresh patches',

  // Original text: "Install pool patches"
  installPoolPatches: 'Install pool patches',

  // Original text: "Default SR"
  defaultSr: 'Alapértelmezett Adattároló',

  // Original text: "Set as default SR"
  setAsDefaultSr: 'Beállítás Alapértelmezett Adattárolóként',

  // Original text: "General"
  generalTabName: 'Általános',

  // Original text: "Stats"
  statsTabName: 'Statisztikák',

  // Original text: "Console"
  consoleTabName: 'Konzol',

  // Original text: "Container"
  containersTabName: 'Container',

  // Original text: "Snapshots"
  snapshotsTabName: 'Pillanatképek',

  // Original text: "Logs"
  logsTabName: 'Logok',

  // Original text: "Advanced"
  advancedTabName: 'Haladó',

  // Original text: "Network"
  networkTabName: 'Hálózat',

  // Original text: "Disk{disks, plural, one {} other {s}}"
  disksTabName: 'Lemez{disks, plural, one {} other {s}}',

  // Original text: "halted"
  powerStateHalted: 'leállítva',

  // Original text: "running"
  powerStateRunning: 'fut',

  // Original text: "suspended"
  powerStateSuspended: 'Felfüggesztett',

  // Original text: "No Xen tools detected"
  vmStatus: 'No Xen tools detected',

  // Original text: "No IPv4 record"
  vmName: 'No IPv4 record',

  // Original text: "No IP record"
  vmDescription: 'No IP record',

  // Original text: "Started {ago}"
  vmSettings: 'Elindítva {ago}',

  // Original text: "Current status:"
  vmCurrentStatus: 'Jelenlegi állapot:',

  // Original text: "Not running"
  vmNotRunning: 'Nem fut',

  // Original text: "No Xen tools detected"
  noToolsDetected: 'No Xen tools detected',

  // Original text: "No IPv4 record"
  noIpv4Record: 'No IPv4 record',

  // Original text: "No IP record"
  noIpRecord: 'No IP record',

  // Original text: "Started {ago}"
  started: 'Elindítva {ago}',

  // Original text: "Paravirtualization (PV)"
  paraVirtualizedMode: 'Paravirtualization (PV)',

  // Original text: "Hardware virtualization (HVM)"
  hardwareVirtualizedMode: 'Hardware virtualization (HVM)',

  // Original text: "CPU usage"
  statsCpu: 'CPU használat',

  // Original text: "Memory usage"
  statsMemory: 'Memória használat',

  // Original text: "Network throughput"
  statsNetwork: 'Átmenő forgalom',

  // Original text: "Stacked values"
  useStackedValuesOnStats: 'Halmozott Értékek',

  // Original text: "Disk throughput"
  statDisk: 'Átmenő Diszk Érték',

  // Original text: "Last 10 minutes"
  statLastTenMinutes: 'Utóbbi 10 perc',

  // Original text: "Last 2 hours"
  statLastTwoHours: 'Utóbbi 2 óra',

  // Original text: "Last week"
  statLastWeek: 'Utóbbi 1 hét',

  // Original text: "Last year"
  statLastYear: 'Utóbbi 1 év',

  // Original text: "Copy"
  copyToClipboardLabel: 'Másolás',

  // Original text: "Ctrl+Alt+Del"
  ctrlAltDelButtonLabel: 'Ctrl+Alt+Del',

  // Original text: "Tip:"
  tipLabel: 'Tip:',

  // Original text: "Due to a XenServer issue, non-US keyboard layouts aren't well supported. Switch your own layout to US to workaround it."
  tipConsoleLabel:
    'Rendszerkompatibilitás miatt egyedül amerikai (US) billentyűzetkiosztás működik a legstabilabban, ennek használata javasolt.',

  // Original text: "Hide infos"
  hideHeaderTooltip: 'Információk elrejtése',

  // Original text: "Show infos"
  showHeaderTooltip: 'Információk mutatása',

  // Original text: "Name"
  containerName: 'Név',

  // Original text: "Command"
  containerCommand: 'Parancs',

  // Original text: "Creation date"
  containerCreated: 'Létrehozás dátuma',

  // Original text: "Status"
  containerStatus: 'Állapot',

  // Original text: "Action"
  containerAction: 'Akció',

  // Original text: "No existing containers"
  noContainers: 'Jelenleg nincsenek Konténerek',

  // Original text: "Stop this container"
  containerStop: 'Konténer Leállítása',

  // Original text: "Start this container"
  containerStart: 'Konténer Elindítása',

  // Original text: "Pause this container"
  containerPause: 'Konténer Szüneteltetése',

  // Original text: "Resume this container"
  containerResume: 'Konténer Folytatása',

  // Original text: "Restart this container"
  containerRestart: 'Konténer Újraindítása',

  // Original text: "Action"
  vdiAction: 'Művelet',

  // Original text: "Attach disk"
  vdiAttachDevice: 'Diszk Hozzácsatolás',

  // Original text: "New disk"
  vbdCreateDeviceButton: 'Új diszk',

  // Original text: "Boot order"
  vdiBootOrder: 'Boot sorrend',

  // Original text: "Name"
  vdiNameLabel: 'Név',

  // Original text: "Description"
  vdiNameDescription: 'Leírás',

  // Original text: "Tags"
  vdiTags: 'Cimkék',

  // Original text: "Size"
  vdiSize: 'Méret',

  // Original text: "SR"
  vdiSr: 'Adattároló',

  // Original text: "VM"
  vdiVm: 'VPS',

  // Original text: "Migrate VDI"
  vdiMigrate: 'Migrate VDI',

  // Original text: "Destination SR:"
  vdiMigrateSelectSr: 'Cél Adattároló:',

  // Original text: "No SR"
  vdiMigrateNoSr: 'Nincs Adattároló',

  // Original text: "A target SR is required to migrate a VDI"
  vdiMigrateNoSrMessage: 'Cél Adattároló szükséges a VDI migáláshoz',

  // Original text: "Forget"
  vdiForget: 'Elfelejt',

  // Original text: "Remove VDI"
  vdiRemove: 'VDI Eltávolítás',

  // Original text: "Boot flag"
  vbdBootableStatus: 'Boot flag',

  // Original text: "Status"
  vbdStatus: 'Állapot',

  // Original text: "Connected"
  vbdStatusConnected: 'Kapcsolódva',

  // Original text: "Disconnected"
  vbdStatusDisconnected: 'Lekapcsolódva',

  // Original text: "No disks"
  vbdNoVbd: 'Nincsenek Diszkek',

  // Original text: "Connect VBD"
  vbdConnect: 'VBD Csatlakozás',

  // Original text: "Disconnect VBD"
  vbdDisconnect: 'VBD Lecsatlakozás',

  // Original text: "Bootable"
  vbdBootable: 'Bootolható',

  // Original text: "Readonly"
  vbdReadonly: 'Csak olvasható',

  // Original text: 'Action'
  vbdAction: undefined,

  // Original text: "Create"
  vbdCreate: 'Létrehozás',

  // Original text: "Disk name"
  vbdNamePlaceHolder: 'Diszk név',

  // Original text: "Size"
  vbdSizePlaceHolder: 'Méret',

  // Original text: "Save"
  saveBootOption: 'Mentés',

  // Original text: "Reset"
  resetBootOption: 'Visszaállítás',

  // Original text: "New device"
  vifCreateDeviceButton: 'Új eszköz',

  // Original text: "No interface"
  vifNoInterface: 'Nincs interface',

  // Original text: "Device"
  vifDeviceLabel: 'Eszköz',

  // Original text: "MAC address"
  vifMacLabel: 'MAC cím',

  // Original text: "MTU"
  vifMtuLabel: 'MTU',

  // Original text: "Network"
  vifNetworkLabel: 'Hálózat',

  // Original text: "Status"
  vifStatusLabel: 'Állapot',

  // Original text: "Connected"
  vifStatusConnected: 'Kapcsolódva',

  // Original text: "Disconnected"
  vifStatusDisconnected: 'Lekapcsolódva',

  // Original text: "Connect"
  vifConnect: 'Csatlakozás',

  // Original text: "Disconnect"
  vifDisconnect: 'Lecsatlakozás',

  // Original text: "Remove"
  vifRemove: 'Eltávolítás',

  // Original text: "IP addresses"
  vifIpAddresses: 'IP címek',

  // Original text: "Auto-generated if empty"
  vifMacAutoGenerate: 'Auto-generálás ha üres',

  // Original text: "Allowed IPs"
  vifAllowedIps: 'Engedélyezett IP címek',

  // Original text: "No IPs"
  vifNoIps: 'Nincsenek IP címek',

  // Original text: "Network locked"
  vifLockedNetwork: 'Hálózat zárolva',

  // Original text: "Network locked and no IPs are allowed for this interface"
  vifLockedNetworkNoIps: 'Hálózat zárolva és nincsenek engedélyezve IP címek ehhez az interfészhez',

  // Original text: "Network not locked"
  vifUnLockedNetwork: 'Hálózat nincs zárolva',

  // Original text: "Unknown network"
  vifUnknownNetwork: 'Ismeretlen Hálózat',

  // Original text: 'Action'
  vifAction: undefined,

  // Original text: "Create"
  vifCreate: 'Létrehozás',

  // Original text: "No snapshots"
  noSnapshots: 'Nincsenek Pillanatképek',

  // Original text: "New snapshot"
  snapshotCreateButton: 'Új Pillanatkép',

  // Original text: "Just click on the snapshot button to create one!"
  tipCreateSnapshotLabel: 'Csak kattintson a Pillanatkép gombra új pillanatkép készítéséhez!',

  // Original text: "Revert VM to this snapshot"
  revertSnapshot: 'VPS visszaállítása erre a pillanatképre',

  // Original text: "Remove this snapshot"
  deleteSnapshot: 'Pillanatkép eltávolítása',

  // Original text: "Create a VM from this snapshot"
  copySnapshot: 'VPS létrehozása ebből a pillanatképből',

  // Original text: "Export this snapshot"
  exportSnapshot: 'Pillanatkép exportálása',

  // Original text: "Creation date"
  snapshotDate: 'Létrehozás dátuma',

  // Original text: "Name"
  snapshotName: 'Név',

  // Original text: "Action"
  snapshotAction: 'Művelet',

  // Original text: "Quiesced snapshot"
  snapshotQuiesce: 'Nyugalomban lévő Pillanatkép',

  // Original text: "Remove all logs"
  logRemoveAll: 'Logok Eltávolítása',

  // Original text: "No logs so far"
  noLogs: 'Nincsenek logok ez idáig',

  // Original text: "Creation date"
  logDate: 'Létrehozás dátuma',

  // Original text: "Name"
  logName: 'Név',

  // Original text: "Content"
  logContent: 'Tartalom',

  // Original text: "Action"
  logAction: 'Művelet',

  // Original text: "Remove"
  vmRemoveButton: 'Eltávolítás',

  // Original text: "Convert"
  vmConvertButton: 'Konvertálás',

  // Original text: "Xen settings"
  xenSettingsLabel: 'Xen beállítások',

  // Original text: "Guest OS"
  guestOsLabel: 'Vendég OS',

  // Original text: "Misc"
  miscLabel: 'Egyéb',

  // Original text: "UUID"
  uuid: 'UUID',

  // Original text: "Virtualization mode"
  virtualizationMode: 'Virtualizációs üzem',

  // Original text: "CPU weight"
  cpuWeightLabel: 'CPU súly',

  // Original text: "Default ({value, number})"
  defaultCpuWeight: 'Alapértelmezett ({Value, number})',

  // Original text: "CPU cap"
  cpuCapLabel: 'CPU cap',

  // Original text: "Default ({value, number})"
  defaultCpuCap: 'Alapértelmezett ({Value, number})',

  // Original text: "PV args"
  pvArgsLabel: 'PV args',

  // Original text: "Xen tools status"
  xenToolsStatus: 'Xen tools Állapot',

  // Original text: "{status}"
  xenToolsStatusValue: '{Állapot}',

  // Original text: "OS name"
  osName: 'OS név',

  // Original text: "OS kernel"
  osKernel: 'OS kernel',

  // Original text: "Auto power on"
  autoPowerOn: 'Auto bekapcsolás',

  // Original text: "HA"
  ha: 'HA',

  // Original text: "Original template"
  originalTemplate: 'Eredeti sablon',

  // Original text: "Unknown"
  unknownOsName: 'Ismeretlen',

  // Original text: "Unknown"
  unknownOsKernel: 'Ismeretlen',

  // Original text: "Unknown"
  unknownOriginalTemplate: 'Ismeretlen',

  // Original text: "VM limits"
  vmLimitsLabel: 'VPS limitek',

  // Original text: "CPU limits"
  vmCpuLimitsLabel: 'CPU limitek',

  // Original text: "Memory limits (min/max)"
  vmMemoryLimitsLabel: 'Memória limitek (min/max)',

  // Original text: "vCPUs max:"
  vmMaxVcpus: 'vCPUs max:',

  // Original text: "Memory max:"
  vmMaxRam: 'Memória max:',

  // Original text: "Long click to add a name"
  vmHomeNamePlaceholder: 'Kattintson hosszan név hozzáadásához',

  // Original text: "Long click to add a description"
  vmHomeDescriptionPlaceholder: 'Kattintson hosszan leírás hozzáadásához',

  // Original text: "Click to add a name"
  vmViewNamePlaceholder: 'Kattintson név hozzáadásához',

  // Original text: "Click to add a description"
  vmViewDescriptionPlaceholder: 'Kattintson leírás hozzáadásához',

  // Original text: "Click to add a name"
  templateHomeNamePlaceholder: 'Kattintson név hozzáadásához',

  // Original text: "Click to add a description"
  templateHomeDescriptionPlaceholder: 'Kattintson leírás hozzáadásához',

  // Original text: "Delete template"
  templateDelete: 'Sablon törlése',

  // Original text: "Delete VM template{templates, plural, one {} other {s}}"
  templateDeleteModalTitle: 'VPS sablon{Templates, plural, one {} other {ok}} törlése',

  // Original text: "Are you sure you want to delete {templates, plural, one {this} other {these}} template{templates, plural, one {} other {s}}?"
  templateDeleteModalBody:
    'Biztos benne, hogy törölni kívánja a kiválasztott {templates, plural, one {this} other {these}} sablon{Templates, plural, one {} other {oka}}t?',

  // Original text: "Pool{pools, plural, one {} other {s}}"
  poolPanel: 'Pool{pools, plural, one {} other {ok}}',

  // Original text: "Host{hosts, plural, one {} other {s}}"
  hostPanel: 'Kiszolgáló{kiszolgálók, plural, one {} other {k}}',

  // Original text: "VM{vms, plural, one {} other {s}}"
  vmPanel: 'VPS{vms, plural, one {} other {ek}}',

  // Original text: "RAM Usage:"
  memoryStatePanel: 'Memória használat:',

  // Original text: "CPUs Usage"
  cpuStatePanel: 'CPUs használat',

  // Original text: "VMs Power state"
  vmStatePanel: 'VPS áram állapot',

  // Original text: "Pending tasks"
  taskStatePanel: 'Függőben lévő feladatok',

  // Original text: "Users"
  usersStatePanel: 'Felhasználók',

  // Original text: "Storage state"
  srStatePanel: 'Adattároló állapot',

  // Original text: "{usage} (of {total})"
  ofUsage: '{usage} (of {total})',

  // Original text: "No storage"
  noSrs: 'Nincs adattároló',

  // Original text: "Name"
  srName: 'Név',

  // Original text: "Pool"
  srPool: 'Pool',

  // Original text: "Host"
  srHost: 'Kiszolgáló',

  // Original text: "Type"
  srFormat: 'Típus',

  // Original text: "Size"
  srSize: 'Méret',

  // Original text: "Usage"
  srUsage: 'használat',

  // Original text: "used"
  srUsed: 'használva',

  // Original text: "free"
  srFree: 'szabad',

  // Original text: "Storage Usage"
  srUsageStatePanel: 'Adattároló használat',

  // Original text: "Top 5 SR Usage (in %)"
  srTopUsageStatePanel: 'Top 5 Adattároló használat (in %)',

  // Original text: "{running} running ({halted} halted)"
  vmsStates: '{running} fut ({halted} halted)',

  // Original text: "Clear selection"
  dashboardStatsButtonRemoveAll: 'Kiválasztás törlése',

  // Original text: "Add all hosts"
  dashboardStatsButtonAddAllHost: 'Összes kiszolgáló hozzáadása',

  // Original text: "Add all VMs"
  dashboardStatsButtonAddAllVM: 'Összes VPS hozzáadása',

  // Original text: "{value} {date, date, medium}"
  weekHeatmapData: '{Value} {date, Dátum, medium}',

  // Original text: "No data."
  weekHeatmapNoData: 'Nincs adata.',

  // Original text: "Weekly Heatmap"
  weeklyHeatmap: 'Heti Hőtérkép',

  // Original text: "Weekly Charts"
  weeklyCharts: 'Heti Diagram',

  // Original text: "Synchronize scale:"
  weeklyChartsScaleInfo: 'Skála szinkronizálása:',

  // Original text: "Stats error"
  statsDashboardGenericErrorTitle: 'Statisztikák hiba',

  // Original text: "There is no stats available for:"
  statsDashboardGenericErrorMessage: 'Jelenleg nincs elérhető statisztika a következőhöz:',

  // Original text: "No selected metric"
  noSelectedMetric: 'Nincs kiválasztott mérőszám',

  // Original text: "Select"
  statsDashboardSelectObjects: 'Válasszon',

  // Original text: "Loading…"
  metricsLoading: 'Töltés…',

  // Original text: "Coming soon!"
  comingSoon: 'Hamarosan!',

  // Original text: "Orphaned snapshot VDIs"
  orphanedVdis: 'Árván maradt Pillanatképek VDI-k',

  // Original text: "Orphaned VMs snapshot"
  orphanedVms: 'Árván maradt VPS Pillanatkép',

  // Original text: "No orphans"
  noOrphanedObject: 'Nincsenek árván hagyott pillanatképek',

  // Original text: "Remove all orphaned snapshot VDIs"
  removeAllOrphanedObject: 'Árván maradt VPS Pillanatkép VDI-k eltávolítása',

  // Original text: "Name"
  vmNameLabel: 'Név',

  // Original text: "Description"
  vmNameDescription: 'Leírás',

  // Original text: "Resident on"
  vmContainer: 'Itt fut:',

  // Original text: "Alarms"
  alarmMessage: 'Riasztások',

  // Original text: "No alarms"
  noAlarms: 'Nincsenek riasztások',

  // Original text: "Date"
  alarmDate: 'Dátum',

  // Original text: "Content"
  alarmContent: 'Tartalom',

  // Original text: "Issue on"
  alarmObject: 'Probléma itt',

  // Original text: "Pool"
  alarmPool: 'Pool',

  // Original text: "Remove all alarms"
  alarmRemoveAll: 'Riasztások eltávolítása',

  // Original text: "{used}% used ({free} left)"
  spaceLeftTooltip: '{used}% felhasználva ({free} maradt)',

  // Original text: "Create a new VM on {select}"
  newVmCreateNewVmOn: 'VPS létrehozása a következőn: {select}',

  // Original text: "Create a new VM on {select1} or {select2}"
  newVmCreateNewVmOn2: 'VPS létrehozása a következőn: {select1} vagy {select2}',

  // Original text: "You have no permission to create a VM"
  newVmCreateNewVmNoPermission: 'Sajnáljuk, nincs jogosultsága új VPS készítéséhez',

  // Original text: "Infos"
  newVmInfoPanel: 'Információk',

  // Original text: "Name"
  newVmNameLabel: 'Név',

  // Original text: "Template"
  newVmTemplateLabel: 'Sablon',

  // Original text: "Description"
  newVmDescriptionLabel: 'Leírás',

  // Original text: "Performances"
  newVmPerfPanel: 'Teljesítmények',

  // Original text: "vCPUs"
  newVmVcpusLabel: 'vCPUs',

  // Original text: "RAM"
  newVmRamLabel: 'RAM',

  // Original text: "Static memory max"
  newVmStaticMaxLabel: 'Max Statikus Memória',

  // Original text: "Dynamic memory min"
  newVmDynamicMinLabel: 'Min Dinamikus Memória',

  // Original text: "Dynamic memory max"
  newVmDynamicMaxLabel: 'Max Dinamikus Memória',

  // Original text: "Install settings"
  newVmInstallSettingsPanel: 'Telepítési beállítások',

  // Original text: "ISO/DVD"
  newVmIsoDvdLabel: 'ISO/DVD',

  // Original text: "Network"
  newVmNetworkLabel: 'Hálózat',

  // Original text: "e.g: http://httpredir.debian.org/debian"
  newVmInstallNetworkPlaceHolder: 'pl.: http://httpredir.debian.org/debian',

  // Original text: "PV Args"
  newVmPvArgsLabel: 'PV Args',

  // Original text: "PXE"
  newVmPxeLabel: 'PXE',

  // Original text: "Interfaces"
  newVmInterfacesPanel: 'Interfészek',

  // Original text: "MAC"
  newVmMacLabel: 'MAC',

  // Original text: "Add interface"
  newVmAddInterface: 'Interfész Hozzáadása',

  // Original text: "Disks"
  newVmDisksPanel: 'Diszkek',

  // Original text: "SR"
  newVmSrLabel: 'Adattároló',

  // Original text: "Size"
  newVmSizeLabel: 'Méret',

  // Original text: "Add disk"
  newVmAddDisk: 'Diszk Hozzáadása',

  // Original text: "Summary"
  newVmSummaryPanel: 'Összesítés',

  // Original text: "Create"
  newVmCreate: 'Létrehozás',

  // Original text: "Reset"
  newVmReset: 'Visszaállít',

  // Original text: "Select template"
  newVmSelectTemplate: 'Válasszon sablont',

  // Original text: "SSH key"
  newVmSshKey: 'SSH kulcs',

  // Original text: "Config drive"
  newVmConfigDrive: 'Meghajtó beállítása',

  // Original text: "Custom config"
  newVmCustomConfig: 'egyedi beállítás',

  // Original text: "Boot VM after creation"
  newVmBootAfterCreate: 'VPS bootolása létrehozás után',

  // Original text: "Auto-generated if empty"
  newVmMacPlaceholder: 'Auto-generálás ha üres',

  // Original text: "CPU weight"
  newVmCpuWeightLabel: 'CPU súly',

  // Original text: "Default: {value, number}"
  newVmDefaultCpuWeight: 'Alapértelmezett: {Value, number}',

  // Original text: "CPU cap"
  newVmCpuCapLabel: 'CPU cap',

  // Original text: "Default: {value, number}"
  newVmDefaultCpuCap: 'Alapértelmezett: {Value, number}',

  // Original text: "Cloud config"
  newVmCloudConfig: 'Cloud beállítás',

  // Original text: "Create VMs"
  newVmCreateVms: 'VPSek Létrehozása',

  // Original text: "Are you sure you want to create {nbVms} VMs?"
  newVmCreateVmsConfirm: 'Biztos benne, hogy létrehoz {nbVms} VPS-t?',

  // Original text: "Multiple VMs:"
  newVmMultipleVms: 'Több VPS:',

  // Original text: "Select a resource set:"
  newVmSelectResourceSet: 'Válasszon egy erőforrás készletet:',

  // Original text: "Name pattern:"
  newVmMultipleVmsPattern: 'Minta Név:',

  // Original text: "e.g.: \\{name\\}_%"
  newVmMultipleVmsPatternPlaceholder: 'e.g.: \\{név\\}_%',

  // Original text: "First index:"
  newVmFirstIndex: 'Első index:',

  // Original text: "Recalculate VMs number"
  newVmNumberRecalculate: 'VPS számok újraszámolása',

  // Original text: "Refresh VMs name"
  newVmNameRefresh: 'VPS nevek frissítése',

  // Original text: "Advanced"
  newVmAdvancedPanel: 'Haladó',

  // Original text: "Show advanced settings"
  newVmShowAdvanced: 'Mutassa a Haladó beállításokat',

  // Original text: "Hide advanced settings"
  newVmHideAdvanced: 'Haladó beállítások elrejtése',

  // Original text: 'Share this VM'
  newVmShare: undefined,

  // Original text: "Resource sets"
  resourceSets: 'Erőforrás készletek',

  // Original text: "No resource sets."
  noResourceSets: 'Nincsenek erőforrás készletek.',

  // Original text: "Loading resource sets"
  loadingResourceSets: 'Erőforrás készletek betöltése',

  // Original text: "Resource set name"
  resourceSetName: 'Erőforrás készlet neve',

  // Original text: "Recompute all limits"
  recomputeResourceSets: 'Összes limit újraszámolása',

  // Original text: "Save"
  saveResourceSet: 'Mentés',

  // Original text: "Reset"
  resetResourceSet: 'Visszaállítás',

  // Original text: "Edit"
  editResourceSet: 'Szerkesztés',

  // Original text: "Delete"
  deleteResourceSet: 'Törlés',

  // Original text: "Delete resource set"
  deleteResourceSetWarning: 'Erőforrás készlet törlése',

  // Original text: "Are you sure you want to delete this resource set?"
  deleteResourceSetQuestion: 'Biztos benne, hogy törli az Erőforrás készletet?',

  // Original text: "Missing objects:"
  resourceSetMissingObjects: 'Hiányzó objektum:',

  // Original text: "vCPUs"
  resourceSetVcpus: 'vCPUs',

  // Original text: "Memory"
  resourceSetMemory: 'Memória',

  // Original text: "Storage"
  resourceSetStorage: 'Adattároló',

  // Original text: "Unknown"
  unknownResourceSetValue: 'Ismeretlen',

  // Original text: "Available hosts"
  availableHosts: 'Elérhető kiszolgálók',

  // Original text: "Excluded hosts"
  excludedHosts: 'Kizárt kiszolgálók',

  // Original text: "No hosts available."
  noHostsAvailable: 'Nincs elérhető kiszolgáló.',

  // Original text: "VMs created from this resource set shall run on the following hosts."
  availableHostsDescription: 'Ezzel az erőforrás készlettel létrehozott VPS-ek a következő kiszolgálókon tudnak futni.',

  // Original text: "Maximum CPUs"
  maxCpus: 'Maximum CPU',

  // Original text: "Maximum RAM (GiB)"
  maxRam: 'Maximum RAM (GiB)',

  // Original text: "Maximum disk space"
  maxDiskSpace: 'Maximum tárhely méret',

  // Original text: "IP pool"
  ipPool: 'IP pool',

  // Original text: "Quantity"
  quantity: 'Mennyiség',

  // Original text: "No limits."
  noResourceSetLimits: 'Nincs limit.',

  // Original text: "Total:"
  totalResource: 'Összesen:',

  // Original text: "Remaining:"
  remainingResource: 'Marad:',

  // Original text: "Used:"
  usedResource: 'Felhasznált:',

  // Original text: "New"
  resourceSetNew: 'Új',

  // Original text: "Try dropping some VMs files here, or click to select VMs to upload. Accept only .xva/.ova files."
  importVmsList:
    'Húzza ide a VPS fájlokat, vagy kattintson a VPS választásra a feltöltésre. Csak .xva/.ova fájlok támogatottak.',

  // Original text: "No selected VMs."
  noSelectedVms: 'Nincs kiválasztott VPS.',

  // Original text: "To Pool:"
  vmImportToPool: 'Pool-ra:',

  // Original text: "To SR:"
  vmImportToSr: 'Adattárolóra:',

  // Original text: "VM{nVms, plural, one {} other {s}} to import"
  vmsToImport: 'Importálandó VPS-el',

  // Original text: "Reset"
  importVmsCleanList: 'Visszaállít',

  // Original text: "VM import success"
  vmImportSuccess: 'VPS importálása sikeres',

  // Original text: "VM import failed"
  vmImportFailed: 'VPS importálása nem sikerült',

  // Original text: "Import starting…"
  startVmImport: 'Importálás indul…',

  // Original text: "Export starting…"
  startVmExport: 'Exportálás indul…',

  // Original text: "Number of CPUs"
  nCpus: undefined,

  // Original text: "Memory"
  vmMemory: 'Memória',

  // Original text: "Disk {position} ({capacity})"
  diskInfo: 'Diszk {position} ({capacity})',

  // Original text: "Disk description"
  diskDescription: 'Diszk leírása',

  // Original text: "No disks."
  noDisks: 'Nincsenek Diszkek.',

  // Original text: "No networks."
  noNetworks: 'Nincsenek Hálózatok.',

  // Original text: "Network {name}"
  networkInfo: 'Hálózat {name}',

  // Original text: "No description available"
  noVmImportErrorDescription: 'Nincs elérhető leírás',

  // Original text: "Error:"
  vmImportError: 'Hiba:',

  // Original text: "{type} file:"
  vmImportFileType: '{type} fájl:',

  // Original text: "Please to check and/or modify the VM configuration."
  vmImportConfigAlert: 'Kérjük ellenőrizze és vagy módosítsa a VPS beállítást.',

  // Original text: "No pending tasks"
  noTasks: 'Nincsenek függő feladatok',

  // Original text: "Currently, there are not any pending XenServer tasks"
  xsTasks: 'Jelenleg nincsenek függő XenServer feladatok',

  // Original text: "Schedules"
  backupSchedules: 'Időzítések',

  // Original text: "Get remote"
  getRemote: 'Távoli Mentés Beállítása',

  // Original text: "List Remote"
  listRemote: 'Távoli Mentés Listázása',

  // Original text: "simple"
  simpleBackup: 'simple',

  // Original text: "delta"
  delta: 'delta',

  // Original text: "Restore Backups"
  restoreBackups: 'Adatmentések Visszaállítása',

  // Original text: "Click on a VM to display restore options"
  restoreBackupsInfo: 'Kattintson egy VPS-re a visszaállítási lehetőségek megtekintéséhez',

  // Original text: "Enabled"
  remoteEnabled: 'Bekapcsolva',

  // Original text: "Error"
  remoteError: 'Hiba',

  // Original text: "No backup available"
  noBackup: 'Nincs elérhető adatmentés',

  // Original text: "VM Name"
  backupVmNameColumn: 'VPS Név',

  // Original text: "Tags"
  backupTags: 'Cimkék',

  // Original text: "Last Backup"
  lastBackupColumn: 'Legutolsó Mentés',

  // Original text: "Available Backups"
  availableBackupsColumn: 'Elérhető Mentések',

  // Original text: "Missing parameters"
  backupRestoreErrorTitle: 'Hiányzó paraméterek',

  // Original text: "Choose a SR and a backup"
  backupRestoreErrorMessage: 'Válasszon egy Adattárolót és egy Mentést',

  // Original text: "Display backups"
  displayBackup: 'Mentések megjelenítése',

  // Original text: "Import VM"
  importBackupTitle: 'VPS Importálás',

  // Original text: "Starting your backup import"
  importBackupMessage: 'Mentés importálásának indítása',

  // Original text: "VMs to backup"
  vmsToBackup: 'Mentendő VPS-ek',

  // Original text: "List remote backups"
  listRemoteBackups: 'Távoli adatmentések listázása',

  // Original text: "Restore backup files"
  restoreFiles: 'Adatmentési fájlok visszaállítása',

  // Original text: "Invalid options"
  restoreFilesError: 'Érévnytelen beállítás',

  // Original text: "Restore file from {name}"
  restoreFilesFromBackup: 'Fájl visszaállítás innen: {name}',

  // Original text: "Select a backup…"
  restoreFilesSelectBackup: 'Válasszon adatmentést…',

  // Original text: "Select a disk…"
  restoreFilesSelectDisk: 'Válasszon diszket…',

  // Original text: "Select a partition…"
  restoreFilesSelectPartition: 'Válasszon egy partíciót…',

  // Original text: "Folder path"
  restoreFilesSelectFolderPath: 'Mappa útvonal',

  // Original text: "Select a file…"
  restoreFilesSelectFiles: 'Válasszon egy fájlt…',

  // Original text: "Content not found"
  restoreFileContentNotFound: 'Tartalom nem található',

  // Original text: "No files selected"
  restoreFilesNoFilesSelected: 'Nincsenek kiválasztott fájlok',

  // Original text: "Selected files ({files}):"
  restoreFilesSelectedFiles: 'kiválasztott fájlok ({files}):',

  // Original text: "Error while scanning disk"
  restoreFilesDiskError: 'Hiba a diszk szkennelése közben',

  // Original text: "Select all this folder's files"
  restoreFilesSelectAllFiles: 'A mappa összes fájljainak kiválasztása',

  // Original text: "Unselect all files"
  restoreFilesUnselectAll: 'Fájlok kijelölésének törlése',

  // Original text: "Emergency shutdown Host{nHosts, plural, one {} other {s}}"
  emergencyShutdownHostsModalTitle: 'Vészhelyzet Kiszolgáló Lekapcsolás',

  // Original text: "Are you sure you want to shutdown {nHosts} Host{nHosts, plural, one {} other {s}}?"
  emergencyShutdownHostsModalMessage: 'Biztos benne, hogy lekapcsolja ezeket a kiszolgálókat?',

  // Original text: "Shutdown host"
  stopHostModalTitle: 'Kiszolgáló Leállítása',

  // Original text: "This will shutdown your host. Do you want to continue? If it's the pool master, your connection to the pool will be lost"
  stopHostModalMessage:
    'Ezzel le fogja kapcsolni a Kiszolgálót. Biztos benne? Amennyiben ez a pool master a kapcsolatot el fogja veszíteni!',

  // Original text: "Add host"
  addHostModalTitle: 'Kiszolgáló Hozzáadása',

  // Original text: "Are you sure you want to add {host} to {pool}?"
  addHostModalMessage: 'Biztos benne, hogy hozzádja a(z) {Host} kiszolgálót a következő poolhoz: {pool}?',

  // Original text: "Restart host"
  restartHostModalTitle: 'Kiszolgáló Újraindítása',

  // Original text: "This will restart your host. Do you want to continue?"
  restartHostModalMessage: 'Ez újra fogja indítani a Kiszolgálót. Biztosan folytatja?',

  // Original text: "Restart Host{nHosts, plural, one {} other {s}} agent{nHosts, plural, one {} other {s}}"
  restartHostsAgentsModalTitle: 'Kiszolgáló(k) Újraindítása',

  // Original text: "Are you sure you want to restart {nHosts} Host{nHosts, plural, one {} other {s}} agent{nHosts, plural, one {} other {s}}?"
  restartHostsAgentsModalMessage: 'Biztos benne, hogy újraindítja?',

  // Original text: "Restart Host{nHosts, plural, one {} other {s}}"
  restartHostsModalTitle: 'Kiszolgáló(k) Újraindítása',

  // Original text: "Are you sure you want to restart {nHosts} Host{nHosts, plural, one {} other {s}}?"
  restartHostsModalMessage: 'Biztos benne, hogy újraindítja?',

  // Original text: "Start VM{vms, plural, one {} other {s}}"
  startVmsModalTitle: 'VPS Elindítása',

  // Original text: "Are you sure you want to start {vms} VM{vms, plural, one {} other {s}}?"
  startVmsModalMessage: 'Biztos benne, hogy elindítja?',

  // Original text: "Stop Host{nHosts, plural, one {} other {s}}"
  stopHostsModalTitle: 'Kiszolgáló Leállítása',

  // Original text: "Are you sure you want to stop {nHosts} Host{nHosts, plural, one {} other {s}}?"
  stopHostsModalMessage: 'Biztos benne, hogy leállítja? Ha ez a master, a kapcsolat elveszhet!',

  // Original text: "Stop VM{vms, plural, one {} other {s}}"
  stopVmsModalTitle: 'VPS Leállítás',

  // Original text: "Are you sure you want to stop {vms} VM{vms, plural, one {} other {s}}?"
  stopVmsModalMessage: 'Biztos benne, hogy leállítja?',

  // Original text: "Restart VM"
  restartVmModalTitle: 'VPS Újraindítása',

  // Original text: "Are you sure you want to restart {name}?"
  restartVmModalMessage: 'Biztos benne, hogy újraindítja: {name}-t?',

  // Original text: "Stop VM"
  stopVmModalTitle: 'VPS Leállítás',

  // Original text: "Are you sure you want to stop {name}?"
  stopVmModalMessage: 'Biztos benne, hogy to leállítja: {name}-t?',

  // Original text: "Restart VM{vms, plural, one {} other {s}}"
  restartVmsModalTitle: 'VPS Újraindítás',

  // Original text: "Are you sure you want to restart {vms} VM{vms, plural, one {} other {s}}?"
  restartVmsModalMessage: 'Biztos benne, hogy újraindítja?',

  // Original text: "Snapshot VM{vms, plural, one {} other {s}}"
  snapshotVmsModalTitle: 'VPS Pillanatképek',

  // Original text: "Are you sure you want to snapshot {vms} VM{vms, plural, one {} other {s}}?"
  snapshotVmsModalMessage: 'Biztos benne, hogy készít Pillanatképet a VPS-ről?',

  // Original text: "Delete VM{vms, plural, one {} other {s}}"
  deleteVmsModalTitle: 'VPS Törlés',

  // Original text: "Are you sure you want to delete {vms} VM{vms, plural, one {} other {s}}? ALL VM DISKS WILL BE REMOVED"
  deleteVmsModalMessage: 'Biztos benne, hogy törli a VPS-t? ÖSSZES VPS DISZK ELTÁVOLÍTÁSRA KERÜL!',

  // Original text: "Delete VM"
  deleteVmModalTitle: 'VPS Törlés',

  // Original text: "Are you sure you want to delete this VM? ALL VM DISKS WILL BE REMOVED"
  deleteVmModalMessage: 'Biztos benne, hogy törli a VPS-t? ÖSSZES VPS DISZK ELTÁVOLÍTÁSRA KERÜL!',

  // Original text: "Migrate VM"
  migrateVmModalTitle: 'VPS Migrálása',

  // Original text: "Select a destination host:"
  migrateVmSelectHost: 'Válasszon cél Kiszolgálót:',

  // Original text: "Select a migration network:"
  migrateVmSelectMigrationNetwork: 'Válasszon egy migrációs hálózatot:',

  // Original text: "For each VDI, select an SR:"
  migrateVmSelectSrs: 'Minden VDI számára: válasszon egy Adattárolót:',

  // Original text: "For each VIF, select a network:"
  migrateVmSelectNetworks: 'Minden VIF számára, válasszon egy Hálózatot:',

  // Original text: "Select a destination SR:"
  migrateVmsSelectSr: 'Válasszon cél Adattárolót:',

  // Original text: "Select a destination SR for local disks:"
  migrateVmsSelectSrIntraPool: 'Válasszon egy cél Adattárolót a helyi diszkek számára:',

  // Original text: "Select a network on which to connect each VIF:"
  migrateVmsSelectNetwork: 'Válasszon egy Hálózatot amelyekhez csatlakoztasson minden VIF-et:',

  // Original text: "Smart mapping"
  migrateVmsSmartMapping: 'Okos feltérképezés',

  // Original text: "Name"
  migrateVmName: 'Név',

  // Original text: "SR"
  migrateVmSr: 'Adattároló',

  // Original text: "VIF"
  migrateVmVif: 'VIF',

  // Original text: "Network"
  migrateVmNetwork: 'Hálózat',

  // Original text: "No target host"
  migrateVmNoTargetHost: 'Nincs cél Kiszolgáló',

  // Original text: "A target host is required to migrate a VM"
  migrateVmNoTargetHostMessage: 'Egy cél Kiszolgáló szükséges a VPS migráláshoz!',

  // Original text: "Delete VDI"
  deleteVdiModalTitle: 'VDI Törlése',

  // Original text: "Are you sure you want to delete this disk? ALL DATA ON THIS DISK WILL BE LOST"
  deleteVdiModalMessage: 'Biztos benne, hogy törli a VPS diszkjét? ÖSSZES ADAT ELTÁVOLÍTÁSRA KERÜL!',

  // Original text: "Revert your VM"
  revertVmModalTitle: 'VPS Visszaállítása',

  // Original text: "Delete snapshot"
  deleteSnapshotModalTitle: 'Pillanatkép Törlése',

  // Original text: "Are you sure you want to delete this snapshot?"
  deleteSnapshotModalMessage: 'Biztos benne, hogy törli a kiválasztott Pillanatképet?',

  // Original text: "Are you sure you want to revert this VM to the snapshot state? This operation is irreversible."
  revertVmModalMessage:
    'Biztos benne, hogy visszaállítja a VPS-t a kiválasztott Pillanatkép állapotra? A folyamat visszafordíthatatlan és minden adat elveszik ami a Pillanatkép készítése óta keletkezett!',

  // Original text: "Snapshot before"
  revertVmModalSnapshotBefore: 'Pillanatkép ezelőtt',

  // Original text: "Import a {name} Backup"
  importBackupModalTitle: '{name} Mentés Importálása',

  // Original text: "Start VM after restore"
  importBackupModalStart: 'Visszaállítás után a VPS elindítása',

  // Original text: "Select your backup…"
  importBackupModalSelectBackup: 'Válasszon mentést…',

  // Original text: "Are you sure you want to remove all orphaned snapshot VDIs?"
  removeAllOrphanedModalWarning: 'Biztos benne, hogy Eltávolítja az összes árvány hagyott Pillanatkép VDI-t?',

  // Original text: "Remove all logs"
  removeAllLogsModalTitle: 'Összes Log Eltávolítása',

  // Original text: "Are you sure you want to remove all logs?"
  removeAllLogsModalWarning: 'Biztos benne, hogy Eltávolítja az összes Logot?',

  // Original text: "This operation is definitive."
  definitiveMessageModal: 'Ez a művelet végleges.',

  // Original text: "Previous SR Usage"
  existingSrModalTitle: 'Előző Adattároló használata',

  // Original text: "This path has been previously used as a Storage by a XenServer host. All data will be lost if you choose to continue the SR creation."
  existingSrModalText:
    'This path has been previously used as a Storage by a XenServer Host. All data will be lost if you choose to continue the Storage Creation.',

  // Original text: "Previous LUN Usage"
  existingLunModalTitle: 'Előző LUN használat',

  // Original text: "This LUN has been previously used as a Storage by a XenServer host. All data will be lost if you choose to continue the SR creation."
  existingLunModalText:
    'This LUN has been previously used as a Storage by a XenServer Host. All data will be lost if you choose to continue the Storage Creation.',

  // Original text: "Replace current registration?"
  alreadyRegisteredModal: 'Replace current registration?',

  // Original text: "Your XO appliance is already registered to {email}, do you want to forget and replace this registration ?"
  alreadyRegisteredModalText:
    'Your XO appliance is already registered to {email}, do you want to Elfelejt and replace this registration ?',

  // Original text: "Ready for trial?"
  trialReadyModal: 'Ready for trial?',

  // Original text: "During the trial period, XOA need to have a working internet connection. This limitation does not apply for our paid plans!"
  trialReadyModalText:
    'During the trial period, XOA need to have a working internet Ceonnection This limitation does not apply for our paid plans!',

  // Original text: "Host"
  serverHost: 'Kiszolgáló',

  // Original text: "Username"
  serverUsername: 'Felhasználónév',

  // Original text: "Password"
  serverPassword: 'Jelszó',

  // Original text: "Action"
  serverAction: 'Művelet',

  // Original text: "Read Only"
  serverReadOnly: 'Csak Olvasható',

  // Original text: "username"
  serverPlaceHolderUser: 'felhasználónév',

  // Original text: "password"
  serverPlaceHolderPassword: 'jelszó',

  // Original text: "address[:port]"
  serverPlaceHolderAddress: 'address[:port]',

  // Original text: "Connect"
  serverConnect: 'Csatlakozás',

  // Original text: "Error"
  serverError: 'Hiba',

  // Original text: "Adding server failed"
  serverAddFailed: 'Szerver Hozzáadása Sikertelen',

  // Original text: "Status"
  serverStatus: 'Állapot',

  // Original text: "Connection failed"
  serverConnectionFailed: 'Csatlakozás Sikertelen',

  // Original text: "Connecting…"
  serverConnecting: 'Csatlakozás…',

  // Original text: "Authentication error"
  serverAuthFailed: 'Bejelentkezési hiba',

  // Original text: "Unknown error"
  serverUnknownError: 'Ismeretlen hiba',

  // Original text: "Copy VM"
  copyVm: 'VPS Másolás',

  // Original text: "Are you sure you want to copy this VM to {SR}?"
  copyVmConfirm: 'Biztos benne, hogy a VPS-t a következő Adattárolóra másolja? {Storage}?',

  // Original text: "Name"
  copyVmName: 'Név',

  // Original text: "Name pattern"
  copyVmNamePattern: 'Név minta',

  // Original text: "If empty: name of the copied VM"
  copyVmNamePlaceholder: 'Ha üres: a másolt VPS neve',

  // Original text: "e.g.: \"\\{name\\}_COPY\""
  copyVmNamePatternPlaceholder: 'pl.: "\\{name\\}_Masolat"',

  // Original text: "Select SR"
  copyVmSelectSr: 'Válasszon Adattárolót',

  // Original text: "Use compression"
  copyVmCompress: 'Tömörítés használata',

  // Original text: "No target SR"
  copyVmsNoTargetSr: 'Nincs cél Adattároló',

  // Original text: "A target SR is required to copy a VM"
  copyVmsNoTargetSrMessage: 'Egy cél Adattároló szükséges a VPS másolásához',

  // Original text: "Detach host"
  detachHostModalTitle: 'Detach Host',

  // Original text: "Are you sure you want to detach {host} from its pool? THIS WILL REMOVE ALL VMs ON ITS LOCAL STORAGE AND REBOOT THE HOST."
  detachHostModalMessage: 'Biztos benne?? THIS WILL REMOVE ALL VMs ON ITS LOCAL STORAGE AND RESTART THE HOST.',

  // Original text: "Detach"
  detachHost: 'Detach',

  // Original text: "Create network"
  newNetworkCreate: 'Hálózat Létrehozása',

  // Original text: "Create bonded network"
  newBondedNetworkCreate: 'Bond Hálózat Létrehozás',

  // Original text: "Interface"
  newNetworkInterface: 'Interfész',

  // Original text: "Name"
  newNetworkName: 'Név',

  // Original text: "Description"
  newNetworkDescription: 'Leírás',

  // Original text: "VLAN"
  newNetworkVlan: 'VLAN',

  // Original text: "No VLAN if empty"
  newNetworkDefaultVlan: 'Nincs VLAN ha üres',

  // Original text: "MTU"
  newNetworkMtu: 'MTU',

  // Original text: "Default: 1500"
  newNetworkDefaultMtu: 'Alapértelmezett: 1500',

  // Original text: "Name required"
  newNetworkNoNameErrorTitle: 'Név szükséges',

  // Original text: "A name is required to create a network"
  newNetworkNoNameErrorMessage: 'Egy név szükséges a Hálózat létrehozásához',

  // Original text: "Bond mode"
  newNetworkBondMode: 'Bond üzem',

  // Original text: "Delete network"
  deleteNetwork: 'Hálózat Törlése',

  // Original text: "Are you sure you want to delete this network?"
  deleteNetworkConfirm: 'Biztos benne, hogy törli a Hálózatot?',

  // Original text: "This network is currently in use"
  networkInUse: 'Ez a Hálózat jelenleg használatban van',

  // Original text: "Bonded"
  pillBonded: 'Bonded',

  // Original text: "Host"
  addHostSelectHost: 'Kiszolgáló',

  // Original text: "No host"
  addHostNoHost: 'Nincs Kiszolgáló',

  // Original text: "No host selected to be added"
  addHostNoHostMessage: 'Nincs Kiszolgáló kiválasztva amihez hozzá lehetne adni',

  // Original text: "Xen Orchestra"
  xenOrchestra: 'CLOUDXO',

  // Original text: "Xen Orchestra server"
  xenOrchestraServer: 'Cloudxo szerver',

  // Original text: "Xen Orchestra web client"
  xenOrchestraWeb: 'Cloudxo web kliens',

  // Original text: "No pro support provided!"
  noProSupport: 'Nincsen pro-szupport!',

  // Original text: "Use in production at your own risks"
  noProductionUse: 'Use in production at your own risks',

  // Original text: "You can download our turnkey appliance at {website}"
  downloadXoaFromWebsite: 'You can download our turnkey appliance at {website}',

  // Original text: "Bug Tracker"
  bugTracker: 'Bug Tracker',

  // Original text: "Issues? Report it!"
  bugTrackerText: 'Issues? Report it!',

  // Original text: "Community"
  community: 'Community',

  // Original text: "Join our community forum!"
  communityText: 'Join our community forum!',

  // Original text: "Free Trial for Premium Edition!"
  freeTrial: 'Free Trial for Premium Edition!',

  // Original text: "Request your trial now!"
  freeTrialNow: 'Request your trial now!',

  // Original text: "Any issue?"
  issues: 'Any issue?',

  // Original text: "Problem? Contact us!"
  issuesText: 'Problem? Contact us!',

  // Original text: "Documentation"
  documentation: 'Documentation',

  // Original text: "Read our official doc"
  documentationText: 'Read our official doc',

  // Original text: "Pro support included"
  proSupportIncluded: 'Pro support included',

  // Original text: "Access your XO Account"
  xoAccount: 'Access your XO Account',

  // Original text: "Report a problem"
  openTicket: 'Report a problem',

  // Original text: "Problem? Open a ticket!"
  openTicketText: 'Problem? Open a ticket!',

  // Original text: "Upgrade needed"
  upgradeNeeded: 'Upgrade needed',

  // Original text: "Upgrade now!"
  upgradeNow: 'Upgrade now!',

  // Original text: "Or"
  or: 'Or',

  // Original text: "Try it for free!"
  tryIt: 'Try it for free!',

  // Original text: "This feature is available starting from {plan} Edition"
  availableIn: 'This feature is available Starting from {plan} Edition',

  // Original text: "This feature is not available in your version, contact your administrator to know more."
  notAvailable: 'This feature is not available in your Version, contact your administrator to know more.',

  // Original text: "Updates"
  updateTitle: 'UpDates',

  // Original text: "Registration"
  registration: 'Registration',

  // Original text: "Trial"
  trial: 'Trial',

  // Original text: "Settings"
  settings: 'Beállítások',

  // Original text: "Proxy settings"
  proxySettings: 'Proxy settings',

  // Original text: "Host (myproxy.example.org)"
  proxySettingsHostPlaceHolder: 'Kiszolgáló (myproxy.example.org)',

  // Original text: "Port (eg: 3128)"
  proxySettingsPortPlaceHolder: 'Port (eg: 3128)',

  // Original text: "Username"
  proxySettingsUsernamePlaceHolder: 'Felhasználónév',

  // Original text: "Password"
  proxySettingsPasswordPlaceHolder: 'Jelszó',

  // Original text: "Your email account"
  updateRegistrationEmailPlaceHolder: 'Your email account',

  // Original text: "Your password"
  updateRegistrationPasswordPlaceHolder: 'Your jelszó',

  // Original text: "Update"
  update: 'UpDates',

  // Original text: "Refresh"
  refresh: 'Refresh',

  // Original text: "Upgrade"
  upgrade: 'Upgrade',

  // Original text: "No updater available for Community Edition"
  noUpdaterCommunity: 'No upDate available for Community Edition',

  // Original text: "Please consider subscribe and try it with all features for free during 15 days on {link}."
  considerSubscribe: 'Please consider subscribe and try it with all features for free during 15 days on {link}.',

  // Original text: "Manual update could break your current installation due to dependencies issues, do it with caution"
  noUpdaterWarning:
    'Manual upDate could break your current installation due to dependencies issues, do it with caution',

  // Original text: "Current version:"
  currentVersion: 'Jelenlegi Verzió:',

  // Original text: "Register"
  register: 'Register',

  // Original text: "Edit registration"
  editRegistration: 'Szerkesztés registration',

  // Original text: "Please, take time to register in order to enjoy your trial."
  trialRegistration: 'Please, take time to register in order to enjoy your trial.',

  // Original text: "Start trial"
  trialStartButton: 'Elindít trial',

  // Original text: "You can use a trial version until {date, date, medium}. Upgrade your appliance to get it."
  trialAvailableUntil: 'You can use a trial Verzió until {date, Dátum, medium}. Upgrade your appliance to get it.',

  // Original text: "Your trial has been ended. Contact us or downgrade to Free version"
  trialConsumed: 'Your trial has been ended. Contact us or downgrade to Free Verzió',

  // Original text: "Your xoa-updater service appears to be down. Your XOA cannot run fully without reaching this service."
  trialLocked: 'Your xoa-upDátumr service appears to be down. Your XOA cannot run fully without reaching this service.',

  // Original text: "No update information available"
  noUpdateInfo: 'No upDátum information available',

  // Original text: "Update information may be available"
  waitingUpdateInfo: 'UpDátum information may be available',

  // Original text: "Your XOA is up-to-date"
  upToDate: 'Your XOA is up-to-Dátum',

  // Original text: "You need to update your XOA (new version is available)"
  mustUpgrade: 'You need to upDate your XOA (new Verzió is available)',

  // Original text: "Your XOA is not registered for updates"
  registerNeeded: 'Your XOA is not registered for upDates',

  // Original text: "Can't fetch update information"
  updaterError: "Can't fetch upDátum information",

  // Original text: "Upgrade successful"
  promptUpgradeReloadTitle: 'Upgrade successful',

  // Original text: "Your XOA has successfully upgraded, and your browser must reload the application. Do you want to reload now ?"
  promptUpgradeReloadMessage:
    'Your XOA has successfully upgraded, and your browser must reload the application. Do you want to reload now ?',

  // Original text: "Xen Orchestra from the sources"
  disclaimerTitle: 'Xen Orchestra from the sources',

  // Original text: "You are using XO from the sources! That's great for a personal/non-profit usage."
  disclaimerText1: "You are using XO from the sources! That's great for a personal/non-profit használat.",

  // Original text: "If you are a company, it's better to use it with our appliance + pro support included:"
  disclaimerText2: "If you are a company, it's better to use it with our appliance + pro support included:",

  // Original text: "This version is not bundled with any support nor updates. Use it with caution for critical tasks."
  disclaimerText3: 'This Verzió is not bundled with any support nor upDates. Use it with caution.',

  // Original text: "Connect PIF"
  connectPif: 'Csatlakozás PIF',

  // Original text: "Are you sure you want to connect this PIF?"
  connectPifConfirm: 'Biztos benne, hogyi to Csatlakozás this PIF?',

  // Original text: "Disconnect PIF"
  disconnectPif: 'Lecsatlakozás PIF',

  // Original text: "Are you sure you want to disconnect this PIF?"
  disconnectPifConfirm: 'Biztos benne, hogyi to Lecsatlakozás this PIF?',

  // Original text: "Delete PIF"
  deletePif: 'Törlés PIF',

  // Original text: "Are you sure you want to delete this PIF?"
  deletePifConfirm: 'Biztos benne, hogyi to delete this PIF?',

  // Original text: "Username"
  username: 'Felhasználónév',

  // Original text: "Password"
  password: 'Jelszó',

  // Original text: "Language"
  language: 'Nyelv',

  // Original text: "Old password"
  oldPasswordPlaceholder: 'Régi jelszó',

  // Original text: "New password"
  newPasswordPlaceholder: 'Új jelszó',

  // Original text: "Confirm new password"
  confirmPasswordPlaceholder: 'Új Jelszó Megerősítése',

  // Original text: "Confirmation password incorrect"
  confirmationPasswordError: 'Megerősítő jelszó helytelen',

  // Original text: "Password does not match the confirm password."
  confirmationPasswordErrorBody: 'A megadott jelszavak nem egyeznek.',

  // Original text: "Password changed"
  pwdChangeSuccess: 'Jelszó megváltoztatva',

  // Original text: "Your password has been successfully changed."
  pwdChangeSuccessBody: 'A jelszó sikeresen megváltoztatva.',

  // Original text: "Incorrect password"
  pwdChangeError: 'Helytelen jelszó',

  // Original text: "The old password provided is incorrect. Your password has not been changed."
  pwdChangeErrorBody: 'A megadott régi jelszó helytelen, így a jelszó NEM lett megváltoztatva!',

  // Original text: "OK"
  changePasswordOk: 'OK',

  // Original text: "SSH keys"
  sshKeys: 'SSH kulcsok',

  // Original text: "New SSH key"
  newSshKey: 'Új SSH kulcs',

  // Original text: "Delete"
  deleteSshKey: 'Törlés',

  // Original text: "No SSH keys"
  noSshKeys: 'Nincsenek SSH kulcsok',

  // Original text: "New SSH key"
  newSshKeyModalTitle: 'Új SSH kulcs',

  // Original text: "Invalid key"
  sshKeyErrorTitle: 'Helytelen kulcs',

  // Original text: "An SSH key requires both a title and a key."
  sshKeyErrorMessage: 'Az SSH kulcshoz szükség van egy címre és egy kulcsra.',

  // Original text: "Title"
  title: 'Cím',

  // Original text: "Key"
  key: 'kulcs',

  // Original text: "Delete SSH key"
  deleteSshKeyConfirm: 'SSH kulcs törlése',

  // Original text: "Are you sure you want to delete the SSH key {title}?"
  deleteSshKeyConfirmMessage: 'Biztos benne, hogy törli a(z) {title} SSH kulcsot?',

  // Original text: "Others"
  others: 'Egyebek',

  // Original text: "Loading logs…"
  loadingLogs: 'Logok betöltése…',

  // Original text: "User"
  logUser: 'Felhasználó',

  // Original text: "Method"
  logMethod: 'Módszer',

  // Original text: "Params"
  logParams: 'Paraméterek',

  // Original text: "Message"
  logMessage: 'Üzenet',

  // Original text: "Error"
  logError: 'Hiba',

  // Original text: "Display details"
  logDisplayDetails: 'Részletek megjelenítése',

  // Original text: "Date"
  logTime: 'Dátum',

  // Original text: "No stack trace"
  logNoStackTrace: 'No stack trace',

  // Original text: "No params"
  logNoParams: 'No params',

  // Original text: "Delete log"
  logDelete: 'Log Törlése',

  // Original text: "Delete all logs"
  logDeleteAll: 'Összes Log Törlése',

  // Original text: "Delete all logs"
  logDeleteAllTitle: 'Összes Log Törlése',

  // Original text: "Are you sure you want to delete all the logs?"
  logDeleteAllMessage: 'Biztos benne, hogy törli az összes Logot?',

  // Original text: 'Click to enable'
  logIndicationToEnable: undefined,

  // Original text: 'Click to disable'
  logIndicationToDisable: undefined,

  // Original text: "Report a bug"
  reportBug: 'Hibabejelentés',

  // Original text: "Name"
  ipPoolName: 'Név',

  // Original text: "IPs"
  ipPoolIps: 'IP címek',

  // Original text: "IPs (e.g.: 1.0.0.12-1.0.0.17;1.0.0.23)"
  ipPoolIpsPlaceholder: 'IP címek (e.g.: 1.0.0.12-1.0.0.17;1.0.0.23)',

  // Original text: "Networks"
  ipPoolNetworks: 'Hálózatok',

  // Original text: "No IP pools"
  ipsNoIpPool: 'No IP pools',

  // Original text: "Create"
  ipsCreate: 'Létrehozás',

  // Original text: "Delete all IP pools"
  ipsDeleteAllTitle: 'Delet all IP pools',

  // Original text: "Are you sure you want to delete all the IP pools?"
  ipsDeleteAllMessage: 'Are you sure you want to delete all the IP pools?',

  // Original text: "VIFs"
  ipsVifs: 'VIFs',

  // Original text: "Not used"
  ipsNotUsed: 'Not used',

  // Original text: "unknown VIF"
  ipPoolUnknownVif: 'ismeretlen VIF',

  // Original text: "Keyboard shortcuts"
  shortcutModalTitle: 'Billentyűzet kiosztások',

  // Original text: "Global"
  shortcut_XoApp: 'Globális',

  // Original text: "Go to hosts list"
  shortcut_GO_TO_HOSTS: 'Menjen a Kiszolgálók listájához',

  // Original text: "Go to pools list"
  shortcut_GO_TO_POOLS: 'Go to pools list',

  // Original text: "Go to VMs list"
  shortcut_GO_TO_VMS: 'Go to VMs list',

  // Original text: "Go to SRs list"
  shortcut_GO_TO_SRS: 'Go to Storage list',

  // Original text: "Create a new VM"
  shortcut_CREATE_VM: 'Új VPS Létrehozása',

  // Original text: "Unfocus field"
  shortcut_UNFOCUS: 'Unfocus field',

  // Original text: "Show shortcuts key bindings"
  shortcut_HELP: 'Show shortcuts key bindings',

  // Original text: "Home"
  shortcut_Home: 'Kezdőlap',

  // Original text: "Focus search bar"
  shortcut_SEARCH: 'Focus keresősáv',

  // Original text: "Next item"
  shortcut_NAV_DOWN: 'Következő',

  // Original text: "Previous item"
  shortcut_NAV_UP: 'Előző',

  // Original text: "Select item"
  shortcut_SELECT: 'Válasszon',

  // Original text: "Open"
  shortcut_JUMP_INTO: 'Megnyitás',

  // Original text: "VM"
  settingsAclsButtonTooltipVM: 'VMPS',

  // Original text: "Hosts"
  settingsAclsButtonTooltiphost: 'Kiszolgáló',

  // Original text: "Pool"
  settingsAclsButtonTooltippool: 'Pool',

  // Original text: "SR"
  settingsAclsButtonTooltipSR: 'Adattároló',

  // Original text: "Network"
  settingsAclsButtonTooltipnetwork: 'Hálózat',

  // Original text: "No config file selected"
  noConfigFile: 'Nincs kiválasztott konfigurációs fájl',

  // Original text: "Try dropping a config file here, or click to select a config file to upload."
  importTip: 'Try dropping a config file here, or click to choose a config file to upload.',

  // Original text: "Config"
  config: 'Konfiguráció',

  // Original text: "Import"
  importConfig: 'Importálás',

  // Original text: "Config file successfully imported"
  importConfigSuccess: 'Config file successfully imported',

  // Original text: "Error while importing config file"
  importConfigError: 'Hiba while importing config file',

  // Original text: "Export"
  exportConfig: 'Export',

  // Original text: "Download current config"
  downloadConfig: 'Download current config',

  // Original text: "No config import available for Community Edition"
  noConfigImportCommunity: 'No config import available for Community Szerkesztésion',

  // Original text: "Reconnect all hosts"
  srReconnectAllModalTitle: 'Reconnect all hosts',

  // Original text: "This will reconnect this SR to all its hosts."
  srReconnectAllModalMessage: 'This will reconnecting this Storage to all its hosts.',

  // Original text: "This will reconnect each selected SR to its host (local SR) or to every hosts of its pool (shared SR)."
  srsReconnectAllModalMessage:
    'This will reconnecz each kiválasztott SR to its Kiszolgáló (local SR) or to every kiszolgálók of its pool (Megosztva Adattároló).',

  // Original text: "Disconnect all hosts"
  srDisconnectAllModalTitle: 'Lecsatlakozás all kiszolgálók',

  // Original text: "This will disconnect this SR from all its hosts."
  srDisconnectAllModalMessage: 'This will Lecsatlakozás this Adattároló from all its kiszolgálók.',

  // Original text: "This will disconnect each selected SR from its host (local SR) or from every hosts of its pool (shared SR)."
  srsDisconnectAllModalMessage:
    'This will Lecsatlakozás each kiválasztott SR from its Kiszolgáló (local SR) or from every kiszolgálók of its pool (Megosztva Adattároló).',

  // Original text: "Forget SR"
  srForgetModalTitle: 'Elfelejt Adattároló',

  // Original text: "Forget selected SRs"
  srsForgetModalTitle: 'Elfelejt kiválasztott Adattárolók',

  // Original text: "Are you sure you want to forget this SR? VDIs on this storage won't be removed."
  srForgetModalMessage: "Biztos benne, hogyi to Elfelejt this Adattároló? VDIs on this storage won't be Eltávolításd.",

  // Original text: "Are you sure you want to forget all the selected SRs? VDIs on these storages won't be removed."
  srsForgetModalMessage:
    "Biztos benne, hogyi to Elfelejt all the kiválasztott Adattárolók? VDIs on these storages won't be Eltávolításd.",

  // Original text: "Disconnected"
  srAllDisconnected: 'Lekapcsolódva',

  // Original text: "Partially connected"
  srSomeConnected: 'Partially Kapcsolódva',

  // Original text: "Connected"
  srAllConnected: 'Kapcsolódva',

  // Original text: 'XOSAN'
  xosanTitle: undefined,

  // Original text: 'Xen Orchestra SAN SR'
  xosanSrTitle: undefined,

  // Original text: 'Select local SRs (lvm)'
  xosanAvailableSrsTitle: undefined,

  // Original text: 'Suggestions'
  xosanSuggestions: undefined,

  // Original text: 'Name'
  xosanName: undefined,

  // Original text: 'Host'
  xosanHost: undefined,

  // Original text: 'Hosts'
  xosanHosts: undefined,

  // Original text: 'Volume ID'
  xosanVolumeId: undefined,

  // Original text: 'Size'
  xosanSize: undefined,

  // Original text: 'Used space'
  xosanUsedSpace: undefined,

  // Original text: 'XOSAN pack needs to be installed on each host of the pool.'
  xosanNeedPack: undefined,

  // Original text: 'Install it now!'
  xosanInstallIt: undefined,

  // Original text: 'Install XOSAN pack on {pool}'
  xosanInstallPackTitle: undefined,

  // Original text: 'Select at least 2 SRs'
  xosanSelect2Srs: undefined,

  // Original text: 'Layout'
  xosanLayout: undefined,

  // Original text: 'Redundancy'
  xosanRedundancy: undefined,

  // Original text: 'Capacity'
  xosanCapacity: undefined,

  // Original text: 'Available space'
  xosanAvailableSpace: undefined,

  // Original text: '* Can fail without data loss'
  xosanDiskLossLegend: undefined,

  // Original text: 'Create'
  xosanCreate: undefined,

  // Original text: 'Installing XOSAN. Please wait…'
  xosanInstalling: undefined,

  // Original text: 'You need XenServer 7.0 to install XOSAN'
  xosanBadVersion: undefined,

  // Original text: 'No XOSAN available for Community Edition'
  xosanCommunity: undefined,

  // Original text: 'Install cloud plugin first'
  xosanInstallCloudPlugin: undefined,

  // Original text: 'Load cloud plugin first'
  xosanLoadCloudPlugin: undefined,

  // Original text: 'Loading…'
  xosanLoading: undefined,

  // Original text: 'XOSAN is not available at the moment'
  xosanNotAvailable: undefined,

  // Original text: 'Register for the XOSAN beta'
  xosanRegisterBeta: undefined,

  // Original text: 'You have successfully registered for the XOSAN beta. Please wait until your request has been approved.'
  xosanSuccessfullyRegistered: undefined,

  // Original text: 'Install XOSAN pack on these hosts:'
  xosanInstallPackOnHosts: undefined,

  // Original text: 'Install {pack} v{version}?'
  xosanInstallPack: undefined,
}
