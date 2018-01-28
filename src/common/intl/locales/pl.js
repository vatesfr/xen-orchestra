// See http://momentjs.com/docs/#/use-it/browserify/
import 'moment/locale/pl'

import reactIntlData from 'react-intl/locale-data/pl'
import { addLocaleData } from 'react-intl'
addLocaleData(reactIntlData)

// ===================================================================

export default {
  // Original text: '{key}: {value}'
  keyValue: undefined,

  // Original text: "Connecting"
  statusConnecting: 'Trwa łączenie…',

  // Original text: "Disconnected"
  statusDisconnected: 'Rozłączono',

  // Original text: "Loading…"
  statusLoading: 'Ładowanie…',

  // Original text: "Page not found"
  errorPageNotFound: 'Nie znaleziono strony',

  // Original text: "no such item"
  errorNoSuchItem: 'nie ma takiego elementu',

  // Original text: "Long click to edit"
  editableLongClickPlaceholder: 'Przytrzymaj żeby edytować',

  // Original text: "Click to edit"
  editableClickPlaceholder: 'Kliknij żeby edytować',

  // Original text: 'Browse files'
  browseFiles: undefined,

  // Original text: 'Show logs'
  showLogs: undefined,

  // Original text: "OK"
  alertOk: 'OK',

  // Original text: "OK"
  confirmOk: 'OK',

  // Original text: 'Cancel'
  genericCancel: undefined,

  // Original text: 'Enter the following text to confirm:'
  enterConfirmText: undefined,

  // Original text: "On error"
  onError: 'Błąd',

  // Original text: "Successful"
  successful: 'Ukończone',

  // Original text: 'Managed disks'
  filterOnlyManaged: undefined,

  // Original text: 'Orphaned disks'
  filterOnlyOrphaned: undefined,

  // Original text: 'Normal disks'
  filterOnlyRegular: undefined,

  // Original text: 'Snapshot disks'
  filterOnlySnapshots: undefined,

  // Original text: 'Unmanaged disks'
  filterOnlyUnmanaged: undefined,

  // Original text: 'Save…'
  filterSaveAs: undefined,

  // Original text: 'Explore the search syntax in the documentation'
  filterSyntaxLinkTooltip: undefined,

  // Original text: 'Connected VIFs'
  filterVifsOnlyConnected: undefined,

  // Original text: 'Disconnected VIFs'
  filterVifsOnlyDisconnected: undefined,

  // Original text: "Copy to clipboard"
  copyToClipboard: 'Kopiuj do schowka',

  // Original text: "Master"
  pillMaster: 'Master',

  // Original text: "Home"
  homePage: 'Start',

  // Original text: "VMs"
  homeVmPage: 'VMs',

  // Original text: "Hosts"
  homeHostPage: 'Hosty',

  // Original text: "Pools"
  homePoolPage: 'Pule',

  // Original text: "Templates"
  homeTemplatePage: 'Szablony',

  // Original text: 'Storages'
  homeSrPage: undefined,

  // Original text: "Dashboard"
  dashboardPage: 'Dashboard',

  // Original text: "Overview"
  overviewDashboardPage: 'Podgląd',

  // Original text: "Visualizations"
  overviewVisualizationDashboardPage: 'Wizualizacje',

  // Original text: "Statistics"
  overviewStatsDashboardPage: 'Statystyki',

  // Original text: "Health"
  overviewHealthDashboardPage: 'Stan serwera',

  // Original text: "Self service"
  selfServicePage: 'Samoobsługa',

  // Original text: "Backup"
  backupPage: 'Backup',

  // Original text: "Jobs"
  jobsPage: 'Zadania',

  // Original text: 'XOA'
  xoaPage: undefined,

  // Original text: "Updates"
  updatePage: 'Aktualizacje',

  // Original text: 'Licenses'
  licensesPage: undefined,

  // Original text: "Settings"
  settingsPage: 'Settings',

  // Original text: "Servers"
  settingsServersPage: 'Serwery',

  // Original text: "Users"
  settingsUsersPage: 'Użytkownicy',

  // Original text: "Groups"
  settingsGroupsPage: 'Grupy',

  // Original text: "ACLs"
  settingsAclsPage: 'ACLs',

  // Original text: "Plugins"
  settingsPluginsPage: 'Dodatki',

  // Original text: "Logs"
  settingsLogsPage: 'Logi',

  // Original text: "IPs"
  settingsIpsPage: 'IPs',

  // Original text: 'Config'
  settingsConfigPage: undefined,

  // Original text: "About"
  aboutPage: 'O oprogramowaniu',

  // Original text: "About XO {xoaPlan}"
  aboutXoaPlan: 'O {xoaPlan}',

  // Original text: "New"
  newMenu: 'Nowy',

  // Original text: "Tasks"
  taskMenu: 'Zadania',

  // Original text: "Tasks"
  taskPage: 'Zadania',

  // Original text: "VM"
  newVmPage: 'VM',

  // Original text: "Storage"
  newSrPage: 'Przestrzeń dyskowa',

  // Original text: "Server"
  newServerPage: 'Serwer',

  // Original text: "Import"
  newImport: 'Importuj',

  // Original text: 'XOSAN'
  xosan: undefined,

  // Original text: "Overview"
  backupOverviewPage: 'Podgląd',

  // Original text: "New"
  backupNewPage: 'Nowy',

  // Original text: "Remotes"
  backupRemotesPage: 'Zdalne',

  // Original text: "Restore"
  backupRestorePage: 'Odtwórz',

  // Original text: 'File restore'
  backupFileRestorePage: undefined,

  // Original text: "Schedule"
  schedule: 'Harmonogram',

  // Original text: "New VM backup"
  newVmBackup: 'Nowy backup VM',

  // Original text: "Edit VM backup"
  editVmBackup: 'Edytuj backup VM',

  // Original text: "Backup"
  backup: 'Backup',

  // Original text: "Rolling Snapshot"
  rollingSnapshot: 'Rolling Snapshot',

  // Original text: "Delta Backup"
  deltaBackup: 'Delta Backup',

  // Original text: "Disaster Recovery"
  disasterRecovery: 'Odzyskiwanie po awarii',

  // Original text: "Continuous Replication"
  continuousReplication: 'Continous Replication',

  // Original text: "Overview"
  jobsOverviewPage: 'Podgląd',

  // Original text: "New"
  jobsNewPage: 'Nowe',

  // Original text: "Scheduling"
  jobsSchedulingPage: 'Planowanie',

  // Original text: "Custom Job"
  customJob: 'Zadania niestandardowe',

  // Original text: "User"
  userPage: 'Użytkownik',

  // Original text: 'XOA'
  xoa: undefined,

  // Original text: "No support"
  noSupport: 'Brak wsparcia',

  // Original text: "Free upgrade!"
  freeUpgrade: 'Darmowa aktualizacja!',

  // Original text: "Sign out"
  signOut: 'Wyloguj',

  // Original text: "Edit my settings {username}"
  editUserProfile: 'Edytuj moje ustawienia {username}',

  // Original text: "Fetching data…"
  homeFetchingData: 'Fetching data…',

  // Original text: "Welcome to Xen Orchestra!"
  homeWelcome: 'Witaj w Xen Orchestra!',

  // Original text: "Add your XenServer hosts or pools"
  homeWelcomeText: 'Dodaj serwery XenServer lub pule',

  // Original text: 'Some XenServers have been registered but are not connected'
  homeConnectServerText: undefined,

  // Original text: "Want some help?"
  homeHelp: 'Potrzebujesz pomocy?',

  // Original text: "Add server"
  homeAddServer: 'Dodaj serwer',

  // Original text: 'Connect servers'
  homeConnectServer: undefined,

  // Original text: "Online Doc"
  homeOnlineDoc: 'Online Doc',

  // Original text: "Pro Support"
  homeProSupport: 'Profesjonalne wsparcie',

  // Original text: "There are no VMs!"
  homeNoVms: 'Nie masz żadnych VMs!',

  // Original text: "Or…"
  homeNoVmsOr: 'Lub…',

  // Original text: "Import VM"
  homeImportVm: 'Importuj VM',

  // Original text: "Import an existing VM in xva format"
  homeImportVmMessage: 'Importuj istniejącą VM w formacie xva',

  // Original text: "Restore a backup"
  homeRestoreBackup: 'Przywróć kopię zapasową',

  // Original text: "Restore a backup from a remote store"
  homeRestoreBackupMessage: 'Przywróć kopię zapasową z innego miejsca',

  // Original text: "This will create a new VM"
  homeNewVmMessage: 'Kliknij w ikonę żeby utworzyć VM',

  // Original text: "Filters"
  homeFilters: 'Filtry',

  // Original text: "No results! Click here to reset your filters"
  homeNoMatches: 'Brak wyników! Kliknij tutaj żeby usunąć filtry',

  // Original text: "Pool"
  homeTypePool: 'Pula',

  // Original text: "Host"
  homeTypeHost: 'Host',

  // Original text: "VM"
  homeTypeVm: 'VM',

  // Original text: "SR"
  homeTypeSr: 'SR',

  // Original text: "Template"
  homeTypeVmTemplate: 'Szablon',

  // Original text: "Sort"
  homeSort: 'Sortuj',

  // Original text: "Pools"
  homeAllPools: 'Pule',

  // Original text: "Hosts"
  homeAllHosts: 'Hosty',

  // Original text: "Tags"
  homeAllTags: 'Tagi',

  // Original text: 'Resource sets'
  homeAllResourceSets: undefined,

  // Original text: "New VM"
  homeNewVm: 'Nowa VM',

  // Original text: 'None'
  homeFilterNone: undefined,

  // Original text: "Running hosts"
  homeFilterRunningHosts: 'Działające hosty',

  // Original text: "Disabled hosts"
  homeFilterDisabledHosts: 'Wyłączone hosty',

  // Original text: "Running VMs"
  homeFilterRunningVms: 'Działające VMs',

  // Original text: "Non running VMs"
  homeFilterNonRunningVms: 'Niedziałające VMs',

  // Original text: "Pending VMs"
  homeFilterPendingVms: 'Oczekujące VMs',

  // Original text: "HVM guests"
  homeFilterHvmGuests: 'Gość HVM',

  // Original text: "Tags"
  homeFilterTags: 'Tagi',

  // Original text: "Sort by"
  homeSortBy: 'Sortuj po',

  // Original text: "CPUs"
  homeSortByCpus: 'CPUs',

  // Original text: "Name"
  homeSortByName: 'Nazwa',

  // Original text: "Power state"
  homeSortByPowerstate: 'Stan zasilania',

  // Original text: "RAM"
  homeSortByRAM: 'RAM',

  // Original text: 'Shared/Not shared'
  homeSortByShared: undefined,

  // Original text: 'Size'
  homeSortBySize: undefined,

  // Original text: 'Type'
  homeSortByType: undefined,

  // Original text: 'Usage'
  homeSortByUsage: undefined,

  // Original text: "vCPUs"
  homeSortByvCPUs: 'vCPUs',

  // Original text: 'Snapshots'
  homeSortVmsBySnapshots: undefined,

  // Original text: "{displayed, number}x {icon} (on {total, number})"
  homeDisplayedItems: '{displayed, number}x {icon} (w {total, number})',

  // Original text: "{selected, number}x {icon} selected (on {total, number})"
  homeSelectedItems: '{selected, number}x {icon} wybrane {selected, plural, one {} other {s}} (w {total, number})',

  // Original text: "More"
  homeMore: 'Więcej',

  // Original text: "Migrate to…"
  homeMigrateTo: 'Migruj do…',

  // Original text: "Missing patches"
  homeMissingPaths: 'Brakujące łatki',

  // Original text: "Master:"
  homePoolMaster: 'Master:',

  // Original text: 'Resource set: {resourceSet}'
  homeResourceSet: undefined,

  // Original text: "High Availability"
  highAvailability: 'Wysoka dostępność',

  // Original text: 'Shared {type}'
  srSharedType: undefined,

  // Original text: 'Not shared {type}'
  srNotSharedType: undefined,

  // Original text: 'All of them are selected'
  sortedTableAllItemsSelected: undefined,

  // Original text: 'No items found'
  sortedTableNoItems: undefined,

  // Original text: '{nFiltered, number} of {nTotal, number} items'
  sortedTableNumberOfFilteredItems: undefined,

  // Original text: '{nTotal, number} items'
  sortedTableNumberOfItems: undefined,

  // Original text: '{nSelected, number} selected'
  sortedTableNumberOfSelectedItems: undefined,

  // Original text: 'Click here to select all items'
  sortedTableSelectAllItems: undefined,

  // Original text: "Add"
  add: 'Dodaj',

  // Original text: 'Select all'
  selectAll: undefined,

  // Original text: "Remove"
  remove: 'Usuń',

  // Original text: "Preview"
  preview: 'Podgląd',

  // Original text: "Item"
  item: 'Obiekt',

  // Original text: "No selected value"
  noSelectedValue: 'Nie wybrano wartości ',

  // Original text: "Choose user(s) and/or group(s)"
  selectSubjects: 'Wybierz użytkownika/użytkowników i/lub grupę/grupy',

  // Original text: "Select Object(s)…"
  selectObjects: 'Wybierz obiekt/obiekty…',

  // Original text: "Choose a role"
  selectRole: 'Wybierz rolę',

  // Original text: "Select Host(s)…"
  selectHosts: 'Wybierz Host/Hosty…',

  // Original text: "Select object(s)…"
  selectHostsVms: 'Wybierz obiekt/obiekty',

  // Original text: "Select Network(s)…"
  selectNetworks: 'Wybierz sieć/sieci…',

  // Original text: "Select PIF(s)…"
  selectPifs: 'Wybierz PIF(s)…',

  // Original text: "Select Pool(s)…"
  selectPools: 'Wybierz pulę/pule…',

  // Original text: "Select Remote(s)…"
  selectRemotes: 'Select Remote(s)…',

  // Original text: "Select resource set(s)…"
  selectResourceSets: 'Wybierz pulę zasobów…',

  // Original text: "Select template(s)…"
  selectResourceSetsVmTemplate: 'Wybierz szablon/szablony…',

  // Original text: "Select SR(s)…"
  selectResourceSetsSr: 'Wybierz pulę dyskową',

  // Original text: "Select network(s)…"
  selectResourceSetsNetwork: 'Wybierz sieć/sieci',

  // Original text: "Select disk(s)…"
  selectResourceSetsVdi: 'Wybierz dysk/dyski…',

  // Original text: "Select SSH key(s)…"
  selectSshKey: 'Wybierz klucz/klucze SSH…',

  // Original text: "Select SR(s)…"
  selectSrs: 'Wybierz SR(s)…',

  // Original text: "Select VM(s)…"
  selectVms: 'Wybierz VM(s)…',

  // Original text: "Select VM template(s)…"
  selectVmTemplates: 'Wybierz szablon/szablony VM…',

  // Original text: "Select tag(s)…"
  selectTags: 'Wybierz tag(i)…',

  // Original text: "Select disk(s)…"
  selectVdis: 'Wybierz dysk/dyski…',

  // Original text: "Select timezone…"
  selectTimezone: 'Wybierz strefę czasową…',

  // Original text: "Select IP(s)…"
  selectIp: 'Wybierz IP(s)…',

  // Original text: "Select IP pool(s)…"
  selectIpPool: 'Wybierz pulę/pule IP',

  // Original text: 'Select VGPU type(s)…'
  selectVgpuType: undefined,

  // Original text: "Fill required informations."
  fillRequiredInformations: 'Wypełnij brakujące informacje.',

  // Original text: "Fill informations (optional)"
  fillOptionalInformations: 'Wypełnij informacje (opcjonalnie)',

  // Original text: "Reset"
  selectTableReset: 'Reset',

  // Original text: "Month"
  schedulingMonth: 'Miesiąc',

  // Original text: 'Every N month'
  schedulingEveryNMonth: undefined,

  // Original text: "Each selected month"
  schedulingEachSelectedMonth: 'Każdy wybrany miesiąc',

  // Original text: 'Day'
  schedulingDay: undefined,

  // Original text: 'Every N day'
  schedulingEveryNDay: undefined,

  // Original text: 'Each selected day'
  schedulingEachSelectedDay: undefined,

  // Original text: 'Switch to week days'
  schedulingSetWeekDayMode: undefined,

  // Original text: 'Switch to month days'
  schedulingSetMonthDayMode: undefined,

  // Original text: "Hour"
  schedulingHour: 'Godzina',

  // Original text: "Each selected hour"
  schedulingEachSelectedHour: 'Każda wybrana godzina',

  // Original text: "Every N hour"
  schedulingEveryNHour: 'Każda N godzina',

  // Original text: "Minute"
  schedulingMinute: 'Minuta',

  // Original text: "Each selected minute"
  schedulingEachSelectedMinute: 'Każda wybrana minuta',

  // Original text: "Every N minute"
  schedulingEveryNMinute: 'Każda N minuta',

  // Original text: 'Every month'
  selectTableAllMonth: undefined,

  // Original text: 'Every day'
  selectTableAllDay: undefined,

  // Original text: 'Every hour'
  selectTableAllHour: undefined,

  // Original text: 'Every minute'
  selectTableAllMinute: undefined,

  // Original text: "Reset"
  schedulingReset: 'Reset',

  // Original text: "Unknown"
  unknownSchedule: 'Nieznany',

  // Original text: "Web browser timezone"
  timezonePickerUseLocalTime: 'Strefa czasowa przeglądarki internetowej',

  // Original text: "Server timezone ({value})"
  serverTimezoneOption: 'Strefa czasowa serwera({value})',

  // Original text: "Cron Pattern:"
  cronPattern: 'Cron Pattern :',

  // Original text: "Cannot edit backup"
  backupEditNotFoundTitle: 'Nie można edytować kopii zapasowej',

  // Original text: "Missing required info for edition"
  backupEditNotFoundMessage: 'Brakuje wymaganych informacji do edycji',

  // Original text: 'Successful'
  successfulJobCall: undefined,

  // Original text: 'Failed'
  failedJobCall: undefined,

  // Original text: 'In progress'
  jobCallInProgess: undefined,

  // Original text: 'Transfer size:'
  jobTransferredDataSize: undefined,

  // Original text: 'Transfer speed:'
  jobTransferredDataSpeed: undefined,

  // Original text: 'Merge size:'
  jobMergedDataSize: undefined,

  // Original text: 'Merge speed:'
  jobMergedDataSpeed: undefined,

  // Original text: 'All'
  allJobCalls: undefined,

  // Original text: "Job"
  job: 'Job',

  // Original text: 'Job {job}'
  jobModalTitle: undefined,

  // Original text: "ID"
  jobId: 'Job ID',

  // Original text: 'Type'
  jobType: undefined,

  // Original text: "Name"
  jobName: 'Nazwa',

  // Original text: "Name of your job (forbidden: \"_\")"
  jobNamePlaceholder: 'Name of your job (forbidden: "_")',

  // Original text: "Start"
  jobStart: 'Start',

  // Original text: "End"
  jobEnd: 'Koniec',

  // Original text: "Duration"
  jobDuration: 'Duration',

  // Original text: "Status"
  jobStatus: 'Status',

  // Original text: "Action"
  jobAction: 'Akcja',

  // Original text: "Tag"
  jobTag: 'Tag',

  // Original text: "Scheduling"
  jobScheduling: 'Planowanie',

  // Original text: "State"
  jobState: 'Stan',

  // Original text: 'Enabled'
  jobStateEnabled: undefined,

  // Original text: 'Disabled'
  jobStateDisabled: undefined,

  // Original text: "Timezone"
  jobTimezone: 'Strefa czasowa',

  // Original text: "Server"
  jobServerTimezone: 'xo-server',

  // Original text: "Run job"
  runJob: 'Uruchomione zadanie',

  // Original text: "One shot running started. See overview for logs."
  runJobVerbose: 'One shot running started. See overview for logs.',

  // Original text: "Started"
  jobStarted: 'Uruchomiono',

  // Original text: "Finished"
  jobFinished: 'Zakończono',

  // Original text: "Save"
  saveBackupJob: 'Zapisz',

  // Original text: "Remove backup job"
  deleteBackupSchedule: 'Usuń zadanie kopii zapasowej',

  // Original text: "Are you sure you want to delete this backup job?"
  deleteBackupScheduleQuestion: 'Jesteś pewny że chcesz usunąć zadanie kopii zapasowej?',

  // Original text: "Enable immediately after creation"
  scheduleEnableAfterCreation: 'Enable immediately after creation',

  // Original text: "You are editing Schedule {name} ({id}). Saving will override previous schedule state."
  scheduleEditMessage: 'Edytujesz harmonogram{name} ({id}). Zapisanie zastąpi poprzedni stan harmonogramu',

  // Original text: "You are editing job {name} ({id}). Saving will override previous job state."
  jobEditMessage: 'Edytujesz zadanie {name} ({id}). Zapisanie zastąpi poprzednie zadanie',

  // Original text: 'Edit'
  scheduleEdit: undefined,

  // Original text: 'Delete'
  scheduleDelete: undefined,

  // Original text: 'Delete selected schedules'
  deleteSelectedSchedules: undefined,

  // Original text: "No scheduled jobs."
  noScheduledJobs: 'Brak zaplanowanych zadań',

  // Original text: 'New schedule'
  newSchedule: undefined,

  // Original text: "No jobs found."
  noJobs: 'Brak zadań',

  // Original text: "No schedules found"
  noSchedules: 'Brak harmonogramów',

  // Original text: "Select a xo-server API command"
  jobActionPlaceHolder: 'Wybierz polecenie API dla xo-server',

  // Original text: 'Timeout (number of seconds after which a VM is considered failed)'
  jobTimeoutPlaceHolder: undefined,

  // Original text: "Schedules"
  jobSchedules: 'Harmonogramy',

  // Original text: "Name of your schedule"
  jobScheduleNamePlaceHolder: 'Nazwa twojego harmonogramu',

  // Original text: "Select a Job"
  jobScheduleJobPlaceHolder: 'Wybierz zadanie',

  // Original text: 'Job owner'
  jobOwnerPlaceholder: undefined,

  // Original text: "This job's creator no longer exists"
  jobUserNotFound: undefined,

  // Original text: "This backup's creator no longer exists"
  backupUserNotFound: undefined,

  // Original text: 'Backup owner'
  backupOwner: undefined,

  // Original text: "Select your backup type:"
  newBackupSelection: 'Wybierz typ kopii zapasowej :',

  // Original text: "Select backup mode:"
  smartBackupModeSelection: 'Wybierz tryb kopii zapasowej :',

  // Original text: "Normal backup"
  normalBackup: 'Normalna kopia zapasowa',

  // Original text: "Smart backup"
  smartBackup: 'Inteligentna kopia zapsowa',

  // Original text: "Local remote selected"
  localRemoteWarningTitle: 'Local remote selected',

  // Original text: "Warning: local remotes will use limited XOA disk space. Only for advanced users."
  localRemoteWarningMessage: 'Warning: local remotes will use limited XOA disk space. Only for advanced users.',

  // Original text: 'Warning: this feature works only with XenServer 6.5 or newer.'
  backupVersionWarning: undefined,

  // Original text: "VMs"
  editBackupVmsTitle: 'VMs',

  // Original text: "VMs statuses"
  editBackupSmartStatusTitle: 'Statusy VMs',

  // Original text: "Resident on"
  editBackupSmartResidentOn: 'Resident on',

  // Original text: 'Pools'
  editBackupSmartPools: undefined,

  // Original text: 'Tags'
  editBackupSmartTags: undefined,

  // Original text: "VMs Tags"
  editBackupSmartTagsTitle: 'Tagi VMs',

  // Original text: 'Reverse'
  editBackupNot: undefined,

  // Original text: "Tag"
  editBackupTagTitle: 'Tag',

  // Original text: "Report"
  editBackupReportTitle: 'Raport',

  // Original text: "Automatically run as scheduled"
  editBackupScheduleEnabled: 'Uruchom natychamiast po utworzeniu',

  // Original text: 'Retention'
  editBackupRetentionTitle: undefined,

  // Original text: "Remote"
  editBackupRemoteTitle: 'Zdalny',

  // Original text: 'Delete the old backups first'
  deleteOldBackupsFirst: undefined,

  // Original text: "Remote stores for backup"
  remoteList: 'Zdalne przechowywanie kopii zapasowej',

  // Original text: "New File System Remote"
  newRemote: 'Nowy zdalny system plików',

  // Original text: "Local"
  remoteTypeLocal: 'Lokalny',

  // Original text: "NFS"
  remoteTypeNfs: 'NFS',

  // Original text: "SMB"
  remoteTypeSmb: 'SMB',

  // Original text: "Type"
  remoteType: 'Typ',

  // Original text: 'SMB remotes are meant to work on Windows Server. For other systems (Linux Samba, which means almost all NAS), please use NFS.'
  remoteSmbWarningMessage: undefined,

  // Original text: "Test your remote"
  remoteTestTip: 'Przetestuj swoje zdalne połączenie',

  // Original text: "Test Remote"
  testRemote: 'Test Remote',

  // Original text: "Test failed for {name}"
  remoteTestFailure: 'Test zakończony niepowodzeniem dla {name}',

  // Original text: "Test passed for {name}"
  remoteTestSuccess: 'Test zakończony sukcesem {name}',

  // Original text: "Error"
  remoteTestError: 'Błąd',

  // Original text: "Test Step"
  remoteTestStep: 'Test Step',

  // Original text: "Test file"
  remoteTestFile: 'Testowy plik',

  // Original text: 'Test name'
  remoteTestName: undefined,

  // Original text: 'Remote name already exists!'
  remoteTestNameFailure: undefined,

  // Original text: "The remote appears to work correctly"
  remoteTestSuccessMessage: 'The remote appears to work correctly',

  // Original text: 'Connection failed'
  remoteConnectionFailed: undefined,

  // Original text: "Name"
  remoteName: 'Name',

  // Original text: "Path"
  remotePath: 'Scieżka',

  // Original text: "State"
  remoteState: 'Stan',

  // Original text: "Device"
  remoteDevice: 'Urządzenie',

  // Original text: "Share"
  remoteShare: 'Udostępnij',

  // Original text: 'Action'
  remoteAction: undefined,

  // Original text: "Auth"
  remoteAuth: 'Auth',

  // Original text: "Mounted"
  remoteMounted: 'Zamontowane',

  // Original text: "Unmounted"
  remoteUnmounted: 'Odmontowane',

  // Original text: "Connect"
  remoteConnectTip: 'Połącz',

  // Original text: "Disconnect"
  remoteDisconnectTip: 'Rozłącz',

  // Original text: 'Connected'
  remoteConnected: undefined,

  // Original text: 'Disconnected'
  remoteDisconnected: undefined,

  // Original text: "Delete"
  remoteDeleteTip: 'Usuń',

  // Original text: "remote name *"
  remoteNamePlaceHolder: 'Nazwa zdalna*',

  // Original text: "Name *"
  remoteMyNamePlaceHolder: 'Nazwa *',

  // Original text: "/path/to/backup"
  remoteLocalPlaceHolderPath: '/ścieżka/do/kopii/zapasowej',

  // Original text: "host *"
  remoteNfsPlaceHolderHost: 'Host *',

  // Original text: "path/to/backup"
  remoteNfsPlaceHolderPath: '/ścieżka/do/kopii/zapasowej',

  // Original text: "subfolder [path\\to\\backup]"
  remoteSmbPlaceHolderRemotePath: 'podfolder [ścieżka\\do\\kopii\\zapasowej]',

  // Original text: "Username"
  remoteSmbPlaceHolderUsername: 'Nazwa użytkownika',

  // Original text: "Password"
  remoteSmbPlaceHolderPassword: 'Hasło',

  // Original text: "Domain"
  remoteSmbPlaceHolderDomain: 'Domena',

  // Original text: "<address>\\<share> *"
  remoteSmbPlaceHolderAddressShare: '<adres>\\<udział> *',

  // Original text: "password(fill to edit)"
  remotePlaceHolderPassword: 'Hasło (wypełnij)',

  // Original text: "Create a new SR"
  newSrTitle: 'Stwórz nowy SR',

  // Original text: "General"
  newSrGeneral: 'General',

  // Original text: "Select Storage Type:"
  newSrTypeSelection: 'Wybierz typ puli dyskowej:',

  // Original text: "Settings"
  newSrSettings: 'Ustawienia',

  // Original text: "Storage Usage"
  newSrUsage: 'Użycie dysków',

  // Original text: "Summary"
  newSrSummary: 'Podsumowanie',

  // Original text: "Host"
  newSrHost: 'Host',

  // Original text: "Type"
  newSrType: 'Typ',

  // Original text: "Name"
  newSrName: 'Nazwa',

  // Original text: "Description"
  newSrDescription: 'Opis',

  // Original text: "Server"
  newSrServer: 'Serwer',

  // Original text: "Path"
  newSrPath: 'Ścieżka',

  // Original text: "IQN"
  newSrIqn: 'IQN',

  // Original text: "LUN"
  newSrLun: 'LUN',

  // Original text: "with auth."
  newSrAuth: 'z autoryzacją',

  // Original text: "User Name"
  newSrUsername: 'Nazwa użytkownika',

  // Original text: "Password"
  newSrPassword: 'Hasło',

  // Original text: "Device"
  newSrDevice: 'Urządzenie',

  // Original text: "in use"
  newSrInUse: 'Używane',

  // Original text: "Size"
  newSrSize: 'Rozmiar',

  // Original text: "Create"
  newSrCreate: 'Utwórz',

  // Original text: "Storage name"
  newSrNamePlaceHolder: 'Nazwa puli dyskowej',

  // Original text: "Storage description"
  newSrDescPlaceHolder: 'Opis puli dyskowej',

  // Original text: "Address"
  newSrAddressPlaceHolder: 'Adres',

  // Original text: "[port]"
  newSrPortPlaceHolder: '[port]',

  // Original text: "Username"
  newSrUsernamePlaceHolder: 'Nazwa użytkownika',

  // Original text: "Password"
  newSrPasswordPlaceHolder: 'Hasło',

  // Original text: "Device, e.g /dev/sda…"
  newSrLvmDevicePlaceHolder: 'Urządzenie, np. /dev/sda…',

  // Original text: "/path/to/directory"
  newSrLocalPathPlaceHolder: '/ścieżka/do/katalogu',

  // Original text: "Users/Groups"
  subjectName: 'Użytkownicy/Grupy',

  // Original text: "Object"
  objectName: 'Obiekt',

  // Original text: "No acls found"
  aclNoneFound: 'Nie znaleziono ACLs',

  // Original text: "Role"
  roleName: 'Rola',

  // Original text: "Create"
  aclCreate: 'Utwórz',

  // Original text: "New Group Name"
  newGroupName: 'Nazwa nowej grupy',

  // Original text: "Create Group"
  createGroup: 'Utwórz grupę',

  // Original text: "Create"
  createGroupButton: 'Utwórz',

  // Original text: "Delete Group"
  deleteGroup: 'Usuń grupę',

  // Original text: "Are you sure you want to delete this group?"
  deleteGroupConfirm: 'Jesteś pewny że chcesz usunąć te grupę?',

  // Original text: "Remove user from Group"
  removeUserFromGroup: 'Usuń użytkownika z grupy',

  // Original text: "Are you sure you want to delete this user?"
  deleteUserConfirm: 'Jesteś pewny że chcesz usunąć tego użytkownika?',

  // Original text: "Delete User"
  deleteUser: 'Usuń użytkownika',

  // Original text: "no user"
  noUser: 'Brak użytkownika',

  // Original text: "unknown user"
  unknownUser: 'Nieznany użytkownik',

  // Original text: "No group found"
  noGroupFound: 'Nie znaleziono grupy',

  // Original text: "Name"
  groupNameColumn: 'Nazwa',

  // Original text: "Users"
  groupUsersColumn: 'Użytkownicy',

  // Original text: "Add User"
  addUserToGroupColumn: 'Dodaj użytkownika',

  // Original text: "Email"
  userNameColumn: 'Email',

  // Original text: "Permissions"
  userPermissionColumn: 'Uprawnienia',

  // Original text: "Password"
  userPasswordColumn: 'Hasło',

  // Original text: "Email"
  userName: 'Email',

  // Original text: "Password"
  userPassword: 'Hasło',

  // Original text: "Create"
  createUserButton: 'Utwórz',

  // Original text: "No user found"
  noUserFound: 'Nie znaleziono użytkownika',

  // Original text: "User"
  userLabel: 'Użytkownik',

  // Original text: "Admin"
  adminLabel: 'Administrator',

  // Original text: "No user in group"
  noUserInGroup: 'Brak użytkownika w grupie',

  // Original text: "{users, number} user{users, plural, one {} other {s}}"
  countUsers: '{users} użytkownik{users, plural, one {} other {s}}',

  // Original text: "Select Permission"
  selectPermission: 'Wybierz uprawnienia',

  // Original text: 'No plugins found'
  noPlugins: undefined,

  // Original text: "Auto-load at server start"
  autoloadPlugin: 'Ładuj automatycznie gdy serwer startuje',

  // Original text: "Save configuration"
  savePluginConfiguration: 'Zapisz konfigurację',

  // Original text: "Delete configuration"
  deletePluginConfiguration: 'Usuń konfigurację',

  // Original text: "Plugin error"
  pluginError: 'Błąd dodatku',

  // Original text: "Unknown error"
  unknownPluginError: 'Nieznany błąd',

  // Original text: "Purge plugin configuration"
  purgePluginConfiguration: 'Purge plugin configuration',

  // Original text: "Are you sure you want to purge this configuration ?"
  purgePluginConfigurationQuestion: 'Czy napewno chcesz usunąć te konfigurację',

  // Original text: "Edit"
  editPluginConfiguration: 'Edytuj',

  // Original text: "Cancel"
  cancelPluginEdition: 'Anuluj',

  // Original text: "Plugin configuration"
  pluginConfigurationSuccess: 'Konfiguracja dodatków',

  // Original text: "Plugin configuration successfully saved!"
  pluginConfigurationChanges: 'Konfiguracja dodatków została zapisana !',

  // Original text: "Predefined configuration"
  pluginConfigurationPresetTitle: 'Wstępnie zdefiniowana konfiguracja',

  // Original text: "Choose a predefined configuration."
  pluginConfigurationChoosePreset: 'Wybierz wstępnie zdefiniowaną konfigurację.',

  // Original text: "Apply"
  applyPluginPreset: 'Akceptuj',

  // Original text: "Save filter error"
  saveNewUserFilterErrorTitle: 'Zapisz błąd filtra',

  // Original text: "Bad parameter: name must be given."
  saveNewUserFilterErrorBody: 'Zły parametr: nazwa musi byc nadana',

  // Original text: "Name:"
  filterName: 'Nazwa:',

  // Original text: "Value:"
  filterValue: 'Wartość :',

  // Original text: "Save new filter"
  saveNewFilterTitle: 'Zapisz nowy filtr',

  // Original text: "Set custom filters"
  setUserFiltersTitle: 'Ustaw niestandardowe filtry',

  // Original text: "Are you sure you want to set custom filters?"
  setUserFiltersBody: 'Jesteś pewny że chcesz ustawić niestandardowe filtry?',

  // Original text: "Remove custom filter"
  removeUserFilterTitle: 'Usuń niestandardowe filtry',

  // Original text: "Are you sure you want to remove custom filter?"
  removeUserFilterBody: 'Jesteś pewny że chcesz usunąć niestandardowe filtry?',

  // Original text: "Default filter"
  defaultFilter: 'Filtr domyślny',

  // Original text: "Default filters"
  defaultFilters: 'Domyślne filtry',

  // Original text: "Custom filters"
  customFilters: 'Filtry niestandardowe',

  // Original text: "Customize filters"
  customizeFilters: 'Dostosuj filtry',

  // Original text: "Save custom filters"
  saveCustomFilters: 'Zapisz filtry niestandardowe',

  // Original text: "Start"
  startVmLabel: 'Start',

  // Original text: "Recovery start"
  recoveryModeLabel: 'Rozpocznij odzyskiwanie',

  // Original text: "Suspend"
  suspendVmLabel: 'Uśpij',

  // Original text: "Stop"
  stopVmLabel: 'Stop',

  // Original text: "Force shutdown"
  forceShutdownVmLabel: 'Brtualne wyłączenie',

  // Original text: "Reboot"
  rebootVmLabel: 'Reboot',

  // Original text: "Force reboot"
  forceRebootVmLabel: 'Brutalny reboot',

  // Original text: "Delete"
  deleteVmLabel: 'Usuń',

  // Original text: "Migrate"
  migrateVmLabel: 'Migruj',

  // Original text: "Snapshot"
  snapshotVmLabel: 'Snapshot',

  // Original text: "Export"
  exportVmLabel: 'Eksportuj',

  // Original text: "Resume"
  resumeVmLabel: 'Wzów',

  // Original text: "Copy"
  copyVmLabel: 'Kopia',

  // Original text: "Clone"
  cloneVmLabel: 'Klonuj',

  // Original text: "Fast clone"
  fastCloneVmLabel: 'Szybki klon',

  // Original text: "Convert to template"
  convertVmToTemplateLabel: 'Konwertuj do szablonu',

  // Original text: "Console"
  vmConsoleLabel: 'Konsola',

  // Original text: 'Name'
  srUnhealthyVdiNameLabel: undefined,

  // Original text: 'Size'
  srUnhealthyVdiSize: undefined,

  // Original text: 'Depth'
  srUnhealthyVdiDepth: undefined,

  // Original text: 'VDI to coalesce ({total, number})'
  srUnhealthyVdiTitle: undefined,

  // Original text: "Rescan all disks"
  srRescan: 'Skanuj wszystkie dyski',

  // Original text: "Connect to all hosts"
  srReconnectAll: 'Połącz z wszystkimi hostami',

  // Original text: "Disconnect from all hosts"
  srDisconnectAll: 'Rozłącz z wszystkimi hostami',

  // Original text: "Forget this SR"
  srForget: 'Zapomnij te pulę dyskową',

  // Original text: 'Forget SRs'
  srsForget: undefined,

  // Original text: "Remove this SR"
  srRemoveButton: 'Usuń te pulę dyskową',

  // Original text: "No VDIs in this storage"
  srNoVdis: 'Brak VDIs na tej przestrzeni dyskowej',

  // Original text: "Pool RAM usage:"
  poolTitleRamUsage: 'Użycie puli RAM:',

  // Original text: "{used} used on {total}"
  poolRamUsage: '{used} używane w {total}',

  // Original text: "Master:"
  poolMaster: 'Master :',

  // Original text: 'Display all hosts of this pool'
  displayAllHosts: undefined,

  // Original text: 'Display all storages of this pool'
  displayAllStorages: undefined,

  // Original text: 'Display all VMs of this pool'
  displayAllVMs: undefined,

  // Original text: "Hosts"
  hostsTabName: 'Hosty',

  // Original text: 'Vms'
  vmsTabName: undefined,

  // Original text: 'Srs'
  srsTabName: undefined,

  // Original text: "High Availability"
  poolHaStatus: 'Wysoka dostępność',

  // Original text: "Enabled"
  poolHaEnabled: 'Włączone',

  // Original text: "Disabled"
  poolHaDisabled: 'Wyłączone',

  // Original text: 'Master'
  setpoolMaster: undefined,

  // Original text: 'GPU groups'
  poolGpuGroups: undefined,

  // Original text: "Name"
  hostNameLabel: 'Nazwa',

  // Original text: "Description"
  hostDescription: 'Opis',

  // Original text: "Memory"
  hostMemory: 'Pamieć',

  // Original text: "No hosts"
  noHost: 'Brak hostów',

  // Original text: "{used}% used ({free} free)"
  memoryLeftTooltip: '{used}% używane ({free} libre)',

  // Original text: 'PIF'
  pif: undefined,

  // Original text: "Name"
  poolNetworkNameLabel: 'Nazwa',

  // Original text: "Description"
  poolNetworkDescription: 'Opis',

  // Original text: "PIFs"
  poolNetworkPif: 'PIFs',

  // Original text: "No networks"
  poolNoNetwork: 'Brak sieci',

  // Original text: "MTU"
  poolNetworkMTU: 'MTU',

  // Original text: "Connected"
  poolNetworkPifAttached: 'Połączone',

  // Original text: "Disconnected"
  poolNetworkPifDetached: 'Rozłączone',

  // Original text: "Show PIFs"
  showPifs: 'Pokaż PIFs',

  // Original text: "Hide PIFs"
  hidePifs: 'Ukryj PIFs',

  // Original text: 'Show details'
  showDetails: undefined,

  // Original text: 'Hide details'
  hideDetails: undefined,

  // Original text: 'No stats'
  poolNoStats: undefined,

  // Original text: 'All hosts'
  poolAllHosts: undefined,

  // Original text: "Add SR"
  addSrLabel: 'Dodaj przestrzeń dyskową',

  // Original text: "Add VM"
  addVmLabel: 'Dodaj VM',

  // Original text: "Add Host"
  addHostLabel: 'Dodaj hosta',

  // Original text: 'This host needs to install {patches, number} patch{patches, plural, one {} other {es}} before it can be added to the pool. This operation may be long.'
  hostNeedsPatchUpdate: undefined,

  // Original text: "This host cannot be added to the pool because it's missing some patches."
  hostNeedsPatchUpdateNoInstall: undefined,

  // Original text: 'Adding host failed'
  addHostErrorTitle: undefined,

  // Original text: 'Host patches could not be homogenized.'
  addHostNotHomogeneousErrorMessage: undefined,

  // Original text: "Disconnect"
  disconnectServer: 'Rozłącz',

  // Original text: "Start"
  startHostLabel: 'Start',

  // Original text: "Stop"
  stopHostLabel: 'Stop',

  // Original text: "Enable"
  enableHostLabel: 'Włącz',

  // Original text: "Disable"
  disableHostLabel: 'Wyłącz',

  // Original text: "Restart toolstack"
  restartHostAgent: 'Restart toolstack',

  // Original text: "Force reboot"
  forceRebootHostLabel: 'Brutalny reboot',

  // Original text: "Reboot"
  rebootHostLabel: 'Reboot',

  // Original text: 'Error while restarting host'
  noHostsAvailableErrorTitle: undefined,

  // Original text: 'Some VMs cannot be migrated before restarting this host. Please try force reboot.'
  noHostsAvailableErrorMessage: undefined,

  // Original text: 'Error while restarting hosts'
  failHostBulkRestartTitle: undefined,

  // Original text: '{failedHosts, number}/{totalHosts, number} host{failedHosts, plural, one {} other {s}} could not be restarted.'
  failHostBulkRestartMessage: undefined,

  // Original text: "Reboot to apply updates"
  rebootUpdateHostLabel: 'Reboot żeby zastosować aktualizacje',

  // Original text: "Emergency mode"
  emergencyModeLabel: 'Tryb ratunku',

  // Original text: "Storage"
  storageTabName: 'Przestrzeń dyskowa',

  // Original text: "Patches"
  patchesTabName: 'Patches',

  // Original text: "Load average"
  statLoad: 'Średni load :',

  // Original text: 'RAM Usage: {memoryUsed}'
  memoryHostState: undefined,

  // Original text: "Hardware"
  hardwareHostSettingsLabel: 'Sprzęt',

  // Original text: "Address"
  hostAddress: 'Adres',

  // Original text: "Status"
  hostStatus: 'Status',

  // Original text: "Build number"
  hostBuildNumber: 'Build number',

  // Original text: "iSCSI name"
  hostIscsiName: 'Nazwa iSCSI',

  // Original text: "Version"
  hostXenServerVersion: 'Wersja',

  // Original text: "Enabled"
  hostStatusEnabled: 'Włącz',

  // Original text: "Disabled"
  hostStatusDisabled: 'Wyłącz',

  // Original text: "Power on mode"
  hostPowerOnMode: 'Tryb włączenia',

  // Original text: "Host uptime"
  hostStartedSince: 'Nieprzerwany czas działania hosta',

  // Original text: "Toolstack uptime"
  hostStackStartedSince: 'Toolstack uptime',

  // Original text: "CPU model"
  hostCpusModel: 'Model CPU',

  // Original text: 'GPUs'
  hostGpus: undefined,

  // Original text: "Core (socket)"
  hostCpusNumber: 'Core (socket)',

  // Original text: "Manufacturer info"
  hostManufacturerinfo: 'Informacje o producencie',

  // Original text: "BIOS info"
  hostBiosinfo: 'BIOS informacje',

  // Original text: "License"
  licenseHostSettingsLabel: 'Licencja',

  // Original text: "Type"
  hostLicenseType: 'Typ',

  // Original text: "Socket"
  hostLicenseSocket: 'Gniazdo',

  // Original text: "Expiry"
  hostLicenseExpiry: 'Wygasa',

  // Original text: 'Installed supplemental packs'
  supplementalPacks: undefined,

  // Original text: 'Install new supplemental pack'
  supplementalPackNew: undefined,

  // Original text: 'Install supplemental pack on every host'
  supplementalPackPoolNew: undefined,

  // Original text: '{name} (by {author})'
  supplementalPackTitle: undefined,

  // Original text: 'Installation started'
  supplementalPackInstallStartedTitle: undefined,

  // Original text: 'Installing new supplemental pack…'
  supplementalPackInstallStartedMessage: undefined,

  // Original text: 'Installation error'
  supplementalPackInstallErrorTitle: undefined,

  // Original text: 'The installation of the supplemental pack failed.'
  supplementalPackInstallErrorMessage: undefined,

  // Original text: 'Installation success'
  supplementalPackInstallSuccessTitle: undefined,

  // Original text: 'Supplemental pack successfully installed.'
  supplementalPackInstallSuccessMessage: undefined,

  // Original text: "Add a network"
  networkCreateButton: 'Dodaj sieć',

  // Original text: "Add a bonded network"
  networkCreateBondedButton: 'Dodaj bonding dla sieci',

  // Original text: "Device"
  pifDeviceLabel: 'Urządzenie',

  // Original text: "Network"
  pifNetworkLabel: 'Sieć',

  // Original text: "VLAN"
  pifVlanLabel: 'VLAN',

  // Original text: "Address"
  pifAddressLabel: 'Adres',

  // Original text: "Mode"
  pifModeLabel: 'Tryb',

  // Original text: "MAC"
  pifMacLabel: 'MAC',

  // Original text: "MTU"
  pifMtuLabel: 'MTU',

  // Original text: "Status"
  pifStatusLabel: 'Status',

  // Original text: "Connected"
  pifStatusConnected: 'Połączono',

  // Original text: "Disconnected"
  pifStatusDisconnected: 'Rozłączono',

  // Original text: "No physical interface detected"
  pifNoInterface: 'Brak fizycznych interfejsów',

  // Original text: "This interface is currently in use"
  pifInUse: 'Ten interfejs jest obecnie używany',

  // Original text: 'Action'
  pifAction: undefined,

  // Original text: "Default locking mode"
  defaultLockingMode: 'Domyślny tryb blokowania',

  // Original text: 'Configure IP address'
  pifConfigureIp: undefined,

  // Original text: 'Invalid parameters'
  configIpErrorTitle: undefined,

  // Original text: 'IP address and netmask required'
  configIpErrorMessage: undefined,

  // Original text: 'Static IP address'
  staticIp: undefined,

  // Original text: 'Netmask'
  netmask: undefined,

  // Original text: 'DNS'
  dns: undefined,

  // Original text: 'Gateway'
  gateway: undefined,

  // Original text: "Add a storage"
  addSrDeviceButton: 'Dodaj przestrzeń dyskową',

  // Original text: "Name"
  srNameLabel: 'Nazwa',

  // Original text: "Type"
  srType: 'Typ',

  // Original text: 'Action'
  pbdAction: undefined,

  // Original text: "Status"
  pbdStatus: 'Status',

  // Original text: "Connected"
  pbdStatusConnected: 'Połączone',

  // Original text: "Disconnected"
  pbdStatusDisconnected: 'Rozłączone',

  // Original text: "Connect"
  pbdConnect: 'Połącz',

  // Original text: "Disconnect"
  pbdDisconnect: 'Rozłącz',

  // Original text: "Forget"
  pbdForget: 'Zapomnij',

  // Original text: "Shared"
  srShared: 'Udostępnione',

  // Original text: "Not shared"
  srNotShared: 'Nieudostępnione',

  // Original text: "No storage detected"
  pbdNoSr: 'Nie wykryto macierzy dyskowej',

  // Original text: "Name"
  patchNameLabel: 'Nazwa',

  // Original text: "Install all patches"
  patchUpdateButton: 'Instaluj wszystkie łatki',

  // Original text: "Description"
  patchDescription: 'Opis',

  // Original text: "Applied date"
  patchApplied: 'Applied date',

  // Original text: "Size"
  patchSize: 'Rozmiar',

  // Original text: "Status"
  patchStatus: 'Status',

  // Original text: "Applied"
  patchStatusApplied: 'Applied',

  // Original text: "Missing patches"
  patchStatusNotApplied: 'Brakujące łatki',

  // Original text: "No patches detected"
  patchNothing: 'Nie wykryto łatek',

  // Original text: "Release date"
  patchReleaseDate: 'Data wydania',

  // Original text: "Guidance"
  patchGuidance: 'Guidance',

  // Original text: "Action"
  patchAction: 'Akcja',

  // Original text: "Applied patches"
  hostAppliedPatches: 'Łatki zostały zastosowane',

  // Original text: "Missing patches"
  hostMissingPatches: 'Brakujące łatki',

  // Original text: "Host up-to-date!"
  hostUpToDate: 'Host posiada najnowsze łatki!',

  // Original text: 'Non-recommended patch install'
  installPatchWarningTitle: undefined,

  // Original text: 'This will install a patch only on this host. This is NOT the recommended way: please go into the Pool patch view and follow instructions there. If you are sure about this, you can continue anyway'
  installPatchWarningContent: undefined,

  // Original text: 'Go to pool'
  installPatchWarningReject: undefined,

  // Original text: 'Install'
  installPatchWarningResolve: undefined,

  // Original text: "Refresh patches"
  refreshPatches: 'Odśwież łatki',

  // Original text: "Install pool patches"
  installPoolPatches: 'Instaluj pulę łatek',

  // Original text: "Default SR"
  defaultSr: 'Domyślny SR',

  // Original text: "Set as default SR"
  setAsDefaultSr: 'Ustaw domyślny SR',

  // Original text: "General"
  generalTabName: 'General',

  // Original text: "Stats"
  statsTabName: 'Statystyki',

  // Original text: "Console"
  consoleTabName: 'Konsola',

  // Original text: "Container"
  containersTabName: 'Kontener',

  // Original text: "Snapshots"
  snapshotsTabName: 'Snapshoty',

  // Original text: "Logs"
  logsTabName: 'Logi',

  // Original text: "Advanced"
  advancedTabName: 'Zaawansowane',

  // Original text: "Network"
  networkTabName: 'Sieć',

  // Original text: "Disk{disks, plural, one {} other {s}}"
  disksTabName: 'Dysk{disks, plural, one {} other {s}}',

  // Original text: "halted"
  powerStateHalted: 'Zatrzymany',

  // Original text: "running"
  powerStateRunning: 'Działający',

  // Original text: "suspended"
  powerStateSuspended: 'Uśpiony',

  // Original text: "No Xen tools detected"
  vmStatus: 'Nie wykryto Xen tools',

  // Original text: "No IPv4 record"
  vmName: 'Nie zapisano IPv4',

  // Original text: "No IP record"
  vmDescription: 'Nie zapisano IP',

  // Original text: "Started {ago}"
  vmSettings: 'Uruchomiono {ago}',

  // Original text: "Current status:"
  vmCurrentStatus: 'Obecny status:',

  // Original text: "Not running"
  vmNotRunning: 'Nie uruchomione',

  // Original text: 'Halted {ago}'
  vmHaltedSince: undefined,

  // Original text: "No Xen tools detected"
  noToolsDetected: 'Nie wykryto Xen tools',

  // Original text: "No IPv4 record"
  noIpv4Record: 'Nie zapisano IPv4',

  // Original text: "No IP record"
  noIpRecord: 'Nie zapisano IP',

  // Original text: "Started {ago}"
  started: 'Uruchomiono {ago}',

  // Original text: "Paravirtualization (PV)"
  paraVirtualizedMode: 'Parawirtualizacja (PV)',

  // Original text: "Hardware virtualization (HVM)"
  hardwareVirtualizedMode: 'Wirtualizacja sprzętowa (HVM)',

  // Original text: "CPU usage"
  statsCpu: 'Użycie CPU',

  // Original text: "Memory usage"
  statsMemory: 'Użycie pamięci',

  // Original text: "Network throughput"
  statsNetwork: 'Wydajność sieci',

  // Original text: "Stacked values"
  useStackedValuesOnStats: 'Skumulowane wartości',

  // Original text: "Disk throughput"
  statDisk: 'Wydajność dysku',

  // Original text: "Last 10 minutes"
  statLastTenMinutes: 'Ostatnie 10 minut',

  // Original text: "Last 2 hours"
  statLastTwoHours: 'Ostatnie 2 godziny',

  // Original text: "Last week"
  statLastWeek: 'Ostatni tydzień',

  // Original text: "Last year"
  statLastYear: 'Ostatni rok',

  // Original text: "Copy"
  copyToClipboardLabel: 'Kopia',

  // Original text: "Ctrl+Alt+Del"
  ctrlAltDelButtonLabel: 'Ctrl+Alt+Del',

  // Original text: "Tip:"
  tipLabel: 'Wskazówka:',

  // Original text: "Hide infos"
  hideHeaderTooltip: 'Ukryj informacje',

  // Original text: "Show infos"
  showHeaderTooltip: 'Pokaż informacje',

  // Original text: "Name"
  containerName: 'Nazwa',

  // Original text: "Command"
  containerCommand: 'Komenda',

  // Original text: "Creation date"
  containerCreated: 'Data utworzenia',

  // Original text: "Status"
  containerStatus: 'Status',

  // Original text: "Action"
  containerAction: 'Akcja',

  // Original text: "No existing containers"
  noContainers: 'Brak istniejących kontenerów',

  // Original text: "Stop this container"
  containerStop: 'Wyłącz ten kontener',

  // Original text: "Start this container"
  containerStart: 'Uruchom ten kontener',

  // Original text: "Pause this container"
  containerPause: 'Zatrzymaj ten kontener',

  // Original text: "Resume this container"
  containerResume: 'Wznów ten kontener',

  // Original text: "Restart this container"
  containerRestart: 'Uruchom ponownie ten kontener',

  // Original text: "Action"
  vdiAction: 'Akcja',

  // Original text: "Attach disk"
  vdiAttachDeviceButton: 'Dołącz dysk',

  // Original text: "New disk"
  vbdCreateDeviceButton: 'Nowy dysk',

  // Original text: "Boot order"
  vdiBootOrder: 'Kolejność bootowania',

  // Original text: "Name"
  vdiNameLabel: 'Nazwa',

  // Original text: "Description"
  vdiNameDescription: 'Opis',

  // Original text: 'Pool'
  vdiPool: undefined,

  // Original text: 'Disconnect'
  vdiDisconnect: undefined,

  // Original text: "Tags"
  vdiTags: 'Tagi',

  // Original text: "Size"
  vdiSize: 'Rozmiar',

  // Original text: "SR"
  vdiSr: 'SR',

  // Original text: "VM"
  vdiVm: 'VM',

  // Original text: "Migrate VDI"
  vdiMigrate: 'Migruj VDI',

  // Original text: "Destination SR:"
  vdiMigrateSelectSr: 'Destination SR:',

  // Original text: "Migrate all VDIs"
  vdiMigrateAll: 'Migruj wszystkie VDIs',

  // Original text: "No SR"
  vdiMigrateNoSr: 'No SR',

  // Original text: "A target SR is required to migrate a VDI"
  vdiMigrateNoSrMessage: 'Docelowy SR jest wymagany żeby zmigrować VDI',

  // Original text: "Forget"
  vdiForget: 'Zapomnij',

  // Original text: "Remove VDI"
  vdiRemove: 'Usuń VDI',

  // Original text: 'No VDIs attached to Control Domain'
  noControlDomainVdis: undefined,

  // Original text: "Boot flag"
  vbdBootableStatus: 'Boot flag',

  // Original text: "Status"
  vbdStatus: 'Status',

  // Original text: "Connected"
  vbdStatusConnected: 'Połączono',

  // Original text: "Disconnected"
  vbdStatusDisconnected: 'Rozłączono',

  // Original text: "No disks"
  vbdNoVbd: 'Brak dysków',

  // Original text: "Connect VBD"
  vbdConnect: 'Połącz z VBD',

  // Original text: "Disconnect VBD"
  vbdDisconnect: 'Rozłącz z VBD',

  // Original text: "Bootable"
  vbdBootable: 'Bootable',

  // Original text: "Readonly"
  vbdReadonly: 'Tylko do odcztu',

  // Original text: 'Action'
  vbdAction: undefined,

  // Original text: "Create"
  vbdCreate: 'Utwórz',

  // Original text: 'Attach'
  vbdAttach: undefined,

  // Original text: "Disk name"
  vbdNamePlaceHolder: 'Nazwa dysku',

  // Original text: "Size"
  vbdSizePlaceHolder: 'Rozmiar',

  // Original text: 'CD drive not completely installed'
  cdDriveNotInstalled: undefined,

  // Original text: 'Stop and start the VM to install the CD drive'
  cdDriveInstallation: undefined,

  // Original text: "Save"
  saveBootOption: 'Zapisz',

  // Original text: "Reset"
  resetBootOption: 'Reset',

  // Original text: 'Delete selected VDIs'
  deleteSelectedVdis: undefined,

  // Original text: 'Delete selected VDI'
  deleteSelectedVdi: undefined,

  // Original text: 'Creating this disk will use the disk space quota from the resource set {resourceSet} ({spaceLeft} left)'
  useQuotaWarning: undefined,

  // Original text: 'Not enough space in resource set {resourceSet} ({spaceLeft} left)'
  notEnoughSpaceInResourceSet: undefined,

  // Original text: "New device"
  vifCreateDeviceButton: 'Nowe urządzenie',

  // Original text: "No interface"
  vifNoInterface: 'Brak interfejsu',

  // Original text: "Device"
  vifDeviceLabel: 'Urządzenie',

  // Original text: "MAC address"
  vifMacLabel: 'Adres MAC',

  // Original text: "MTU"
  vifMtuLabel: 'MTU',

  // Original text: "Network"
  vifNetworkLabel: 'Sieć',

  // Original text: "Status"
  vifStatusLabel: 'Status',

  // Original text: "Connected"
  vifStatusConnected: 'Połączono',

  // Original text: "Disconnected"
  vifStatusDisconnected: 'Rozłączono',

  // Original text: "Connect"
  vifConnect: 'Połącz',

  // Original text: "Disconnect"
  vifDisconnect: 'Rozłącz',

  // Original text: "Remove"
  vifRemove: 'Usuń',

  // Original text: 'Remove selected VIFs'
  vifsRemove: undefined,

  // Original text: "IP addresses"
  vifIpAddresses: 'Adres IP',

  // Original text: "Auto-generated if empty"
  vifMacAutoGenerate: 'Auto-generated if empty',

  // Original text: "Allowed IPs"
  vifAllowedIps: 'Dopuszczone IPs',

  // Original text: "No IPs"
  vifNoIps: 'Brak IPs',

  // Original text: "Network locked"
  vifLockedNetwork: 'Sieć zablokowana',

  // Original text: "Network locked and no IPs are allowed for this interface"
  vifLockedNetworkNoIps: 'Sieć zablokowana i żadne IPs nie są dopuszczone do tego interfejsu',

  // Original text: "Network not locked"
  vifUnLockedNetwork: 'Sieć niezablokowana',

  // Original text: "Unknown network"
  vifUnknownNetwork: 'Sieć nieznana',

  // Original text: 'Action'
  vifAction: undefined,

  // Original text: "Create"
  vifCreate: 'Utwórz',

  // Original text: "No snapshots"
  noSnapshots: 'Brak snapshotów',

  // Original text: "New snapshot"
  snapshotCreateButton: 'Nowy snapshot',

  // Original text: "Just click on the snapshot button to create one!"
  tipCreateSnapshotLabel: 'Kliknij na guzik żeby stworzyć snapshota !',

  // Original text: "Revert VM to this snapshot"
  revertSnapshot: 'Przywróć VM do tego snapshota',

  // Original text: "Remove this snapshot"
  deleteSnapshot: 'Usuń snapshot',

  // Original text: "Create a VM from this snapshot"
  copySnapshot: 'Utwórz VM z tego snapshota',

  // Original text: "Export this snapshot"
  exportSnapshot: 'Exportuj tego snapshota',

  // Original text: "Creation date"
  snapshotDate: 'Data utworzenia',

  // Original text: "Name"
  snapshotName: 'Nazwa',

  // Original text: 'Description'
  snapshotDescription: undefined,

  // Original text: "Action"
  snapshotAction: 'Akcja',

  // Original text: 'Quiesced snapshot'
  snapshotQuiesce: undefined,

  // Original text: "Remove all logs"
  logRemoveAll: 'Usuń wszystkie logi',

  // Original text: "No logs so far"
  noLogs: 'No logs so far',

  // Original text: "Creation date"
  logDate: 'Data utworzenia',

  // Original text: "Name"
  logName: 'Nazwa',

  // Original text: "Content"
  logContent: 'Zawartość',

  // Original text: "Action"
  logAction: 'Akcja',

  // Original text: "Remove"
  vmRemoveButton: 'Usuń',

  // Original text: "Convert"
  vmConvertButton: 'Konwertuj',

  // Original text: "Xen settings"
  xenSettingsLabel: 'Ustawienia Xena',

  // Original text: "Guest OS"
  guestOsLabel: 'Geust OS',

  // Original text: "Misc"
  miscLabel: 'Misc',

  // Original text: "UUID"
  uuid: 'UUID',

  // Original text: "Virtualization mode"
  virtualizationMode: 'Tryb wirtualizacji',

  // Original text: "CPU weight"
  cpuWeightLabel: 'CPU weight',

  // Original text: "Default ({value, number})"
  defaultCpuWeight: 'Domyślnie ({value, number})',

  // Original text: "CPU cap"
  cpuCapLabel: 'CPU cap',

  // Original text: "Default ({value, number})"
  defaultCpuCap: 'Domyślny ({value, number})',

  // Original text: "PV args"
  pvArgsLabel: 'PV args',

  // Original text: "Xen tools status"
  xenToolsStatus: 'Status Xen tools',

  // Original text: '{status}'
  xenToolsStatusValue: undefined,

  // Original text: "OS name"
  osName: 'Nazwa systemu',

  // Original text: "OS kernel"
  osKernel: 'Kernel systemu',

  // Original text: "Auto power on"
  autoPowerOn: 'Autoamtyczne uruchamianie',

  // Original text: "HA"
  ha: 'HA',

  // Original text: 'Affinity host'
  vmAffinityHost: undefined,

  // Original text: 'VGA'
  vmVga: undefined,

  // Original text: 'Video RAM'
  vmVideoram: undefined,

  // Original text: 'None'
  noAffinityHost: undefined,

  // Original text: "Original template"
  originalTemplate: 'Oryginalny szablon',

  // Original text: "Unknown"
  unknownOsName: 'Nieznany',

  // Original text: "Unknown"
  unknownOsKernel: 'Nieznany',

  // Original text: "Unknown"
  unknownOriginalTemplate: 'Nieznany',

  // Original text: "VM limits"
  vmLimitsLabel: 'Limity VM',

  // Original text: "CPU limits"
  vmCpuLimitsLabel: 'Limity CPU',

  // Original text: 'Topology'
  vmCpuTopology: undefined,

  // Original text: 'Default behavior'
  vmChooseCoresPerSocket: undefined,

  // Original text: '{nSockets, number} socket{nSockets, plural, one {} other {s}} with {nCores, number} core{nCores, plural, one {} other {s}} per socket'
  vmCoresPerSocket: undefined,

  // Original text: 'None'
  vmCoresPerSocketNone: undefined,

  // Original text: 'Incorrect cores per socket value'
  vmCoresPerSocketIncorrectValue: undefined,

  // Original text: 'Please change the selected value to fix it.'
  vmCoresPerSocketIncorrectValueSolution: undefined,

  // Original text: "Memory limits (min/max)"
  vmMemoryLimitsLabel: 'Limity pamięci (min/max)',

  // Original text: "vCPUs max:"
  vmMaxVcpus: 'vCPUs max :',

  // Original text: "Memory max:"
  vmMaxRam: 'Pamięć max :',

  // Original text: 'vGPU'
  vmVgpu: undefined,

  // Original text: 'GPUs'
  vmVgpus: undefined,

  // Original text: 'None'
  vmVgpuNone: undefined,

  // Original text: 'Add vGPU'
  vmAddVgpu: undefined,

  // Original text: 'Select vGPU type'
  vmSelectVgpuType: undefined,

  // Original text: "Long click to add a name"
  vmHomeNamePlaceholder: 'Long click to add a name',

  // Original text: "Long click to add a description"
  vmHomeDescriptionPlaceholder: 'Long click to add a description',

  // Original text: "Click to add a name"
  vmViewNamePlaceholder: 'Click to add a name',

  // Original text: "Click to add a description"
  vmViewDescriptionPlaceholder: 'Kliknij żeby dodać opis',

  // Original text: "Click to add a name"
  templateHomeNamePlaceholder: 'Kliknij żeby dodać nazwę',

  // Original text: "Click to add a description"
  templateHomeDescriptionPlaceholder: 'Kliknij żeby dodać opis',

  // Original text: "Delete template"
  templateDelete: 'Usuń szablon',

  // Original text: "Delete VM template{templates, plural, one {} other {s}}"
  templateDeleteModalTitle: 'Usuń szablon VM{templates, plural, one {} other {s}} de VMs',

  // Original text: "Are you sure you want to delete {templates, plural, one {this} other {these}} template{templates, plural, one {} other {s}}?"
  templateDeleteModalBody: 'Jesteś pewien że chcesz usunąć?',

  // Original text: "Pool{pools, plural, one {} other {s}}"
  poolPanel: 'Pula{pools, plural, one {} other {s}}',

  // Original text: "Host{hosts, plural, one {} other {s}}"
  hostPanel: 'Host{hosts, plural, one {} other {s}}',

  // Original text: "VM{vms, plural, one {} other {s}}"
  vmPanel: 'VM{vms, plural, one {} other {s}}',

  // Original text: "RAM Usage:"
  memoryStatePanel: 'Użycie RAM',

  // Original text: "CPUs Usage"
  cpuStatePanel: 'Użycie CPUs',

  // Original text: "VMs Power state"
  vmStatePanel: 'Stan zasilania VMs',

  // Original text: "Pending tasks"
  taskStatePanel: 'Oczekujące zadania',

  // Original text: "Users"
  usersStatePanel: 'Użytkownicy',

  // Original text: "Storage state"
  srStatePanel: 'Status przestrzeni dyskowej',

  // Original text: "{usage} (of {total})"
  ofUsage: '{usage} (sur {total})',

  // Original text: "No storage"
  noSrs: 'No storage',

  // Original text: "Name"
  srName: 'Nazwa',

  // Original text: "Pool"
  srPool: 'Pula',

  // Original text: "Host"
  srHost: 'Host',

  // Original text: "Type"
  srFormat: 'Typ',

  // Original text: "Size"
  srSize: 'Size',

  // Original text: "Usage"
  srUsage: 'Usage',

  // Original text: "used"
  srUsed: 'Used',

  // Original text: "free"
  srFree: 'free',

  // Original text: "Storage Usage"
  srUsageStatePanel: 'Storage Usage',

  // Original text: "Top 5 SR Usage (in %)"
  srTopUsageStatePanel: 'Top 5 SRs (w %)',

  // Original text: "{running, number} running ({halted, number} halted)"
  vmsStates: '{running} uruchomiona{halted, plural, one {} other {s}} ({halted} zatrzymana{halted, plural, one {} other {s}})',

  // Original text: "Clear selection"
  dashboardStatsButtonRemoveAll: 'Clear selection',

  // Original text: "Add all hosts"
  dashboardStatsButtonAddAllHost: 'Dodaj wszystkie hosty',

  // Original text: "Add all VMs"
  dashboardStatsButtonAddAllVM: 'Dodaj wszystkie VMs',

  // Original text: "{value} {date, date, medium}"
  weekHeatmapData: '{value} {date, date, medium}',

  // Original text: "No data."
  weekHeatmapNoData: 'No data.',

  // Original text: "Weekly Heatmap"
  weeklyHeatmap: 'Tygodniowa mapa cieplna',

  // Original text: "Weekly Charts"
  weeklyCharts: 'Wykresy tygodniowe',

  // Original text: "Synchronize scale:"
  weeklyChartsScaleInfo: 'Synchronize scale:',

  // Original text: "Stats error"
  statsDashboardGenericErrorTitle: 'Błąd statystyk',

  // Original text: "There is no stats available for:"
  statsDashboardGenericErrorMessage: 'Nie ma dostępnych statystyk dla:',

  // Original text: "No selected metric"
  noSelectedMetric: 'No selected metric',

  // Original text: "Select"
  statsDashboardSelectObjects: 'Wybierz',

  // Original text: "Loading…"
  metricsLoading: 'Ładowanie…',

  // Original text: "Coming soon!"
  comingSoon: 'Coming soon!',

  // Original text: "Orphaned snapshot VDIs"
  orphanedVdis: 'Orphaned snapshot VDIs',

  // Original text: "Orphaned VMs snapshot"
  orphanedVms: 'Orphaned VMs snapshot',

  // Original text: "No orphans"
  noOrphanedObject: 'No orphans',

  // Original text: "Remove all orphaned snapshot VDIs"
  removeAllOrphanedObject: 'Remove all orphaned snapshot VDIs',

  // Original text: 'VDIs attached to Control Domain'
  vdisOnControlDomain: undefined,

  // Original text: "Name"
  vmNameLabel: 'Nazwa',

  // Original text: "Description"
  vmNameDescription: 'Opis',

  // Original text: "Resident on"
  vmContainer: 'Resident on',

  // Original text: "Alarms"
  alarmMessage: 'Alarmy',

  // Original text: "No alarms"
  noAlarms: 'Brak alarmów',

  // Original text: "Date"
  alarmDate: 'Data',

  // Original text: "Content"
  alarmContent: 'Zawartość',

  // Original text: "Issue on"
  alarmObject: 'Issue on',

  // Original text: "Pool"
  alarmPool: 'Pula',

  // Original text: "Remove all alarms"
  alarmRemoveAll: 'Usuń wszystkie alarmy',

  // Original text: "{used}% used ({free} left)"
  spaceLeftTooltip: '{used}% used ({free} left)',

  // Original text: "Create a new VM on {select}"
  newVmCreateNewVmOn: 'Stwórz nową VM w {select}',

  // Original text: "You have no permission to create a VM"
  newVmCreateNewVmNoPermission: 'Nie masz uprawnień do tworzenia VM',

  // Original text: "Infos"
  newVmInfoPanel: 'Informacje',

  // Original text: "Name"
  newVmNameLabel: 'Nazwa',

  // Original text: "Template"
  newVmTemplateLabel: 'Szablon',

  // Original text: "Description"
  newVmDescriptionLabel: 'Opis',

  // Original text: "Performances"
  newVmPerfPanel: 'CPU i RAM',

  // Original text: "vCPUs"
  newVmVcpusLabel: 'vCPUs',

  // Original text: "RAM"
  newVmRamLabel: 'RAM',

  // Original text: "Static memory max"
  newVmStaticMaxLabel: 'Pamieć statyczna max',

  // Original text: "Dynamic memory min"
  newVmDynamicMinLabel: 'Pamieć dynamiczna min',

  // Original text: "Dynamic memory max"
  newVmDynamicMaxLabel: 'Pamieć dynamiczna max',

  // Original text: "Install settings"
  newVmInstallSettingsPanel: 'Install settings',

  // Original text: "ISO/DVD"
  newVmIsoDvdLabel: 'ISO/DVD',

  // Original text: "Network"
  newVmNetworkLabel: 'Sieć',

  // Original text: "e.g: http://httpredir.debian.org/debian"
  newVmInstallNetworkPlaceHolder: 'ex : http://httpredir.debian.org/debian',

  // Original text: "PV Args"
  newVmPvArgsLabel: 'PV Args',

  // Original text: "PXE"
  newVmPxeLabel: 'PXE',

  // Original text: "Interfaces"
  newVmInterfacesPanel: 'Interfejsy',

  // Original text: "MAC"
  newVmMacLabel: 'MAC',

  // Original text: "Add interface"
  newVmAddInterface: 'Dodaj dodatkowy interfejs',

  // Original text: "Disks"
  newVmDisksPanel: 'Dyski',

  // Original text: "SR"
  newVmSrLabel: 'SR',

  // Original text: "Size"
  newVmSizeLabel: 'Rozmiar',

  // Original text: "Add disk"
  newVmAddDisk: 'Dodaj dodatkowy dysk',

  // Original text: "Summary"
  newVmSummaryPanel: 'Podsumowanie',

  // Original text: "Create"
  newVmCreate: 'Utwórz',

  // Original text: "Reset"
  newVmReset: 'Reset',

  // Original text: "Select template"
  newVmSelectTemplate: 'Wybierz szablon',

  // Original text: "SSH key"
  newVmSshKey: 'Klucz SSH',

  // Original text: "Config drive"
  newVmConfigDrive: 'Config drive',

  // Original text: "Custom config"
  newVmCustomConfig: 'Niestandardowa konfiguracja',

  // Original text: "Boot VM after creation"
  newVmBootAfterCreate: 'Boot VM po utworzeniu',

  // Original text: "Auto-generated if empty"
  newVmMacPlaceholder: 'Auto-generated if empty',

  // Original text: "CPU weight"
  newVmCpuWeightLabel: 'CPU weight',

  // Original text: "Default: {value, number}"
  newVmDefaultCpuWeight: 'Domyślnie: {value, number}',

  // Original text: "CPU cap"
  newVmCpuCapLabel: 'CPU cap',

  // Original text: "Default: {value, number}"
  newVmDefaultCpuCap: 'Domyślnie : {value, number}',

  // Original text: "Cloud config"
  newVmCloudConfig: 'Konfiguracja chmury',

  // Original text: "Create VMs"
  newVmCreateVms: 'Utwórz VMs',

  // Original text: "Are you sure you want to create {nbVms, number} VMs?"
  newVmCreateVmsConfirm: 'Jesteś pewny że chcesz utworzyć {nbVms} VMs ?',

  // Original text: "Multiple VMs:"
  newVmMultipleVms: 'Multiple VMs :',

  // Original text: "Select a resource set:"
  newVmSelectResourceSet: 'Select a resource set:',

  // Original text: "Name pattern:"
  newVmMultipleVmsPattern: 'Name pattern:',

  // Original text: "e.g.: \\{name\\}_%"
  newVmMultipleVmsPatternPlaceholder: 'np. : \\{name\\}_%',

  // Original text: "First index:"
  newVmFirstIndex: 'First index:',

  // Original text: "Recalculate VMs number"
  newVmNumberRecalculate: 'Przelicz ilość VMs',

  // Original text: "Refresh VMs name"
  newVmNameRefresh: 'Odśwież nazwę VMs',

  // Original text: 'Affinity host'
  newVmAffinityHost: undefined,

  // Original text: "Advanced"
  newVmAdvancedPanel: 'Zaawansowane',

  // Original text: "Show advanced settings"
  newVmShowAdvanced: 'Pokaż ustawienia zaawansowane',

  // Original text: "Hide advanced settings"
  newVmHideAdvanced: 'Ukryj ustawienia zaawansowane',

  // Original text: 'Share this VM'
  newVmShare: undefined,

  // Original text: "Resource sets"
  resourceSets: 'Resource sets',

  // Original text: "No resource sets."
  noResourceSets: 'No resource sets.',

  // Original text: "Loading resource sets"
  loadingResourceSets: 'Loading resource sets',

  // Original text: "Resource set name"
  resourceSetName: 'Resource set name',

  // Original text: 'Users'
  resourceSetUsers: undefined,

  // Original text: 'Pools'
  resourceSetPools: undefined,

  // Original text: 'Templates'
  resourceSetTemplates: undefined,

  // Original text: 'SRs'
  resourceSetSrs: undefined,

  // Original text: 'Networks'
  resourceSetNetworks: undefined,

  // Original text: "Recompute all limits"
  recomputeResourceSets: 'Przelicz wszystkie limity',

  // Original text: "Save"
  saveResourceSet: 'Zapisz',

  // Original text: "Reset"
  resetResourceSet: 'Reset',

  // Original text: "Edit"
  editResourceSet: 'Edytuj',

  // Original text: "Delete"
  deleteResourceSet: 'Usuń',

  // Original text: "Delete resource set"
  deleteResourceSetWarning: 'Delete resource set',

  // Original text: "Are you sure you want to delete this resource set?"
  deleteResourceSetQuestion: 'Are you sure you want to delete this resource set?',

  // Original text: "Missing objects:"
  resourceSetMissingObjects: 'Brakujące obiekty:',

  // Original text: "vCPUs"
  resourceSetVcpus: 'vCPUs',

  // Original text: "Memory"
  resourceSetMemory: 'Pamieć',

  // Original text: "Storage"
  resourceSetStorage: 'Przestrzeń dyskowa',

  // Original text: "Unknown"
  unknownResourceSetValue: 'Nieznany',

  // Original text: "Available hosts"
  availableHosts: 'Dostępne hosty',

  // Original text: "Excluded hosts"
  excludedHosts: 'Wykluczone hosty',

  // Original text: "No hosts available."
  noHostsAvailable: 'Brak dostępnych hostów.',

  // Original text: "VMs created from this resource set shall run on the following hosts."
  availableHostsDescription: 'VMs created from this resource set shall run on the following hosts.',

  // Original text: "Maximum CPUs"
  maxCpus: 'Maximum CPUs',

  // Original text: "Maximum RAM"
  maxRam: 'Maximum RAM (GiB)',

  // Original text: "Maximum disk space"
  maxDiskSpace: 'Maximum disk space',

  // Original text: "IP pool"
  ipPool: 'Pula IP',

  // Original text: "Quantity"
  quantity: 'Quantity',

  // Original text: "No limits."
  noResourceSetLimits: 'Brak limitów.',

  // Original text: "Total:"
  totalResource: 'Łącznie :',

  // Original text: "Remaining:"
  remainingResource: 'Pozostało :',

  // Original text: "Used:"
  usedResource: 'Używane:',

  // Original text: "New"
  resourceSetNew: 'Nowy',

  // Original text: "Try dropping some VMs files here, or click to select VMs to upload. Accept only .xva/.ova files."
  importVmsList: 'Try dropping some VMs files here, or click to select VMs to upload. Accept only .xva/.ova files.',

  // Original text: "No selected VMs."
  noSelectedVms: 'No selected VMs.',

  // Original text: "To Pool:"
  vmImportToPool: 'To Pool:',

  // Original text: "To SR:"
  vmImportToSr: 'To SR:',

  // Original text: "VMs to import"
  vmsToImport: 'VMs to import',

  // Original text: "Reset"
  importVmsCleanList: 'Reset',

  // Original text: "VM import success"
  vmImportSuccess: 'import VM udany!',

  // Original text: "VM import failed"
  vmImportFailed: 'Import VM nieudany',

  // Original text: "Import starting…"
  startVmImport: 'Rozpoczęcie importowania…',

  // Original text: "Export starting…"
  startVmExport: 'Eksport rozpoczęty…',

  // Original text: "N CPUs"
  nCpus: 'N CPUs',

  // Original text: "Memory"
  vmMemory: 'Pamieć',

  // Original text: "Disk {position} ({capacity})"
  diskInfo: 'Dysk {position} ({capacity})',

  // Original text: "Disk description"
  diskDescription: 'Opis dysku',

  // Original text: "No disks."
  noDisks: 'Brak dysków.',

  // Original text: "No networks."
  noNetworks: 'Brak sieci.',

  // Original text: "Network {name}"
  networkInfo: 'Sieć {name}',

  // Original text: "No description available"
  noVmImportErrorDescription: 'Opis jest niedostępny',

  // Original text: "Error:"
  vmImportError: 'Błąd:',

  // Original text: "{type} file:"
  vmImportFileType: '{type} plik:',

  // Original text: "Please to check and/or modify the VM configuration."
  vmImportConfigAlert: 'Proszę sprawdzić lub zmodyfikować konfigurację VM.',

  // Original text: "No pending tasks"
  noTasks: 'Brak oczekujących zadań',

  // Original text: "Currently, there are not any pending XenServer tasks"
  xsTasks: 'Aktualnie, nie ma żadnych oczekujących zadań na HyperVisorze',

  // Original text: "Schedules"
  backupSchedules: 'Harmonogramy',

  // Original text: "Get remote"
  getRemote: 'Get remote',

  // Original text: "List Remote"
  listRemote: 'List Remote',

  // Original text: "simple"
  simpleBackup: 'simple',

  // Original text: "delta"
  delta: 'delta',

  // Original text: "Restore Backups"
  restoreBackups: 'Odtwórz kopie zapasowe',

  // Original text: "Click on a VM to display restore options"
  restoreBackupsInfo: 'Kliknij w VM żeby wyświetlić możliwości odtworzenia',

  // Original text: 'Only the files of Delta Backup which are not on a SMB remote can be restored'
  restoreDeltaBackupsInfo: undefined,

  // Original text: "Enabled"
  remoteEnabled: 'Włączone',

  // Original text: "Error"
  remoteError: 'Błąd',

  // Original text: "No backup available"
  noBackup: 'Brak dostępnej kopi zapasowej',

  // Original text: "VM Name"
  backupVmNameColumn: 'Nazwa VM',

  // Original text: "Tags"
  backupTags: 'Tagi',

  // Original text: "Last Backup"
  lastBackupColumn: 'Ostatnia kopia zapasowa',

  // Original text: "Available Backups"
  availableBackupsColumn: 'Dostępne kopie zapasowe',

  // Original text: "Missing parameters"
  backupRestoreErrorTitle: 'Brakujące parametry',

  // Original text: "Choose a SR and a backup"
  backupRestoreErrorMessage: 'Wybierz SR i kopię zapasową',

  // Original text: 'Select default SR…'
  backupRestoreSelectDefaultSr: undefined,

  // Original text: 'Choose a SR for each VDI'
  backupRestoreChooseSrForEachVdis: undefined,

  // Original text: 'VDI'
  backupRestoreVdiLabel: undefined,

  // Original text: 'SR'
  backupRestoreSrLabel: undefined,

  // Original text: "Display backups"
  displayBackup: 'Wyświetl kopie zapasowe',

  // Original text: "Import VM"
  importBackupTitle: 'Importuj VM',

  // Original text: "Starting your backup import"
  importBackupMessage: 'Rozpoczynanie imortu kopii zapasowej',

  // Original text: "VMs to backup"
  vmsToBackup: 'VMs do kopii zapasowej',

  // Original text: 'List remote backups'
  listRemoteBackups: undefined,

  // Original text: 'Restore backup files'
  restoreFiles: undefined,

  // Original text: 'Invalid options'
  restoreFilesError: undefined,

  // Original text: 'Restore file from {name}'
  restoreFilesFromBackup: undefined,

  // Original text: 'Select a backup…'
  restoreFilesSelectBackup: undefined,

  // Original text: 'Select a disk…'
  restoreFilesSelectDisk: undefined,

  // Original text: 'Select a partition…'
  restoreFilesSelectPartition: undefined,

  // Original text: 'Folder path'
  restoreFilesSelectFolderPath: undefined,

  // Original text: 'Select a file…'
  restoreFilesSelectFiles: undefined,

  // Original text: 'Content not found'
  restoreFileContentNotFound: undefined,

  // Original text: 'No files selected'
  restoreFilesNoFilesSelected: undefined,

  // Original text: 'Selected files ({files}):'
  restoreFilesSelectedFiles: undefined,

  // Original text: 'Error while scanning disk'
  restoreFilesDiskError: undefined,

  // Original text: "Select all this folder's files"
  restoreFilesSelectAllFiles: undefined,

  // Original text: 'Unselect all files'
  restoreFilesUnselectAll: undefined,

  // Original text: "Emergency shutdown Host{nHosts, plural, one {} other {s}}"
  emergencyShutdownHostsModalTitle: 'Wyłączenie awaryjne hosta {nHosts, plural, one {} other {s}}',

  // Original text: "Are you sure you want to shutdown {nHosts, number} Host{nHosts, plural, one {} other {s}}?"
  emergencyShutdownHostsModalMessage: 'Jesteś peweny że chcesz wyłączyć {nHosts} hosta{nHosts, plural, one {} other {s}}?',

  // Original text: "Shutdown host"
  stopHostModalTitle: 'Wyłączenie hosta',

  // Original text: "This will shutdown your host. Do you want to continue? If it's the pool master, your connection to the pool will be lost"
  stopHostModalMessage: 'To wyłączy twojego hosta. Chcesz kontynuować? Jeżeli jest to zarządca puli, twoje połaczenie do puli zostanie utracone',

  // Original text: "Add host"
  addHostModalTitle: 'Dodaj hosta',

  // Original text: "Are you sure you want to add {host} to {pool}?"
  addHostModalMessage: 'Jesteś pewny że chcesz dodać hosta{host} do {pool}?',

  // Original text: "Restart host"
  restartHostModalTitle: 'Restart hosta',

  // Original text: "This will restart your host. Do you want to continue?"
  restartHostModalMessage: 'To zrestartuje twojego hosta. Chcesz kontynuować?',

  // Original text: "Restart Host{nHosts, plural, one {} other {s}} agent{nHosts, plural, one {} other {s}}"
  restartHostsAgentsModalTitle: 'Zrestartuj hosta{nHosts, plural, one {} other {s}}',

  // Original text: "Are you sure you want to restart {nHosts, number} Host{nHosts, plural, one {} other {s}} agent{nHosts, plural, one {} other {s}}?"
  restartHostsAgentsModalMessage: "Êtes-vous sûr de vouloir redémarrer les agents {nHosts, plural, one {de l'hôte} other {des hôtes}} ?",

  // Original text: "Restart Host{nHosts, plural, one {} other {s}}"
  restartHostsModalTitle: 'Restart hosta{nHosts, plural, one {} other {s}}',

  // Original text: "Are you sure you want to restart {nHosts, number} Host{nHosts, plural, one {} other {s}}?"
  restartHostsModalMessage: 'Czy na pewno chcesz zrestartować {nHosts} Host{nHosts, plural, one {} other {s}}?',

  // Original text: "Start VM{vms, plural, one {} other {s}}"
  startVmsModalTitle: 'Uruchom VM{vms, plural, one {} other {s}}',

  // Original text: 'Start a copy'
  cloneAndStartVM: undefined,

  // Original text: 'Force start'
  forceStartVm: undefined,

  // Original text: 'Forbidden operation'
  forceStartVmModalTitle: undefined,

  // Original text: 'Start operation for this vm is blocked.'
  blockedStartVmModalMessage: undefined,

  // Original text: 'Forbidden operation start for {nVms, number} vm{nVms, plural, one {} other {s}}.'
  blockedStartVmsModalMessage: undefined,

  // Original text: "Are you sure you want to start {vms, number} VM{vms, plural, one {} other {s}}?"
  startVmsModalMessage: 'Are you sure you want to start {vms} VM{vms, plural, one {} other {s}}?',

  // Original text: '{nVms, number} vm{nVms, plural, one {} other {s}} are failed. Please see your logs to get more information'
  failedVmsErrorMessage: undefined,

  // Original text: 'Start failed'
  failedVmsErrorTitle: undefined,

  // Original text: "Stop Host{nHosts, plural, one {} other {s}}"
  stopHostsModalTitle: 'Zatrzymaj hosta{nHosts, plural, one {} other {s}}',

  // Original text: "Are you sure you want to stop {nHosts, number} Host{nHosts, plural, one {} other {s}}?"
  stopHostsModalMessage: 'Jesteś pewny że chcesz zatrzymać {nHosts} Host{nHosts, plural, one {} other {s}}?',

  // Original text: "Stop VM{vms, plural, one {} other {s}}"
  stopVmsModalTitle: 'Zatrzymaj VM {vms, plural, one {} other {s}}',

  // Original text: "Are you sure you want to stop {vms, number} VM{vms, plural, one {} other {s}}?"
  stopVmsModalMessage: 'Jesteś pewien że chcesz zatrzymać {vms} VM{vms, plural, one {} other {s}}?',

  // Original text: "Restart VM"
  restartVmModalTitle: 'Restart VM',

  // Original text: "Are you sure you want to restart {name}?"
  restartVmModalMessage: 'Na pewno chcesz zrestartować {name}?',

  // Original text: "Stop VM"
  stopVmModalTitle: 'Zatrzymaj VM',

  // Original text: "Are you sure you want to stop {name}?"
  stopVmModalMessage: 'Na pewno chcesz wyłączyć {name}?',

  // Original text: 'Suspend VM{vms, plural, one {} other {s}}'
  suspendVmsModalTitle: undefined,

  // Original text: 'Are you sure you want to suspend {vms, number} VM{vms, plural, one {} other {s}}?'
  suspendVmsModalMessage: undefined,

  // Original text: "Restart VM{vms, plural, one {} other {s}}"
  restartVmsModalTitle: 'Restart VM{vms, plural, one {} other {s}}',

  // Original text: "Are you sure you want to restart {vms, number} VM{vms, plural, one {} other {s}}?"
  restartVmsModalMessage: 'Are you sure you want to restart {vms} VM{vms, plural, one {} other {s}}?',

  // Original text: "Snapshot VM{vms, plural, one {} other {s}}"
  snapshotVmsModalTitle: 'Snapshot VM{vms, plural, one {} other {s}}',

  // Original text: "Are you sure you want to snapshot {vms, number} VM{vms, plural, one {} other {s}}?"
  snapshotVmsModalMessage: 'Jesteś pewny że chcesz zrobić snapshot {vms} VM{vms, plural, one {} other {s}}?',

  // Original text: "Delete VM{vms, plural, one {} other {s}}"
  deleteVmsModalTitle: 'Delete VM{vms, plural, one {} other {s}}',

  // Original text: "Are you sure you want to delete {vms, number} VM{vms, plural, one {} other {s}}? ALL VM DISKS WILL BE REMOVED"
  deleteVmsModalMessage: 'Are you sure you want to delete {vms} VM{vms, plural, one {} other {s}}? ALL VM DISKS WILL BE REMOVED',

  // Original text: 'delete {nVms, number} vm{nVms, plural, one {} other {s}}'
  deleteVmsConfirmText: undefined,

  // Original text: "Delete VM"
  deleteVmModalTitle: 'Usuń VM',

  // Original text: "Are you sure you want to delete this VM? ALL VM DISKS WILL BE REMOVED"
  deleteVmModalMessage: 'Are you sure you want to delete this VM? ALL VM DISKS WILL BE REMOVED',

  // Original text: "Migrate VM"
  migrateVmModalTitle: 'Migruj VM',

  // Original text: "Select a destination host:"
  migrateVmSelectHost: 'Select a destination host:',

  // Original text: "Select a migration network:"
  migrateVmSelectMigrationNetwork: 'Select a migration network:',

  // Original text: "For each VIF, select a network:"
  migrateVmSelectNetworks: 'For each VIF, select a network:',

  // Original text: "Select a destination SR:"
  migrateVmsSelectSr: 'Select a destination SR:',

  // Original text: "Select a destination SR for local disks:"
  migrateVmsSelectSrIntraPool: 'Select a destination SR for local disks:',

  // Original text: "Select a network on which to connect each VIF:"
  migrateVmsSelectNetwork: 'Select a network on which to connect each VIF:',

  // Original text: "Smart mapping"
  migrateVmsSmartMapping: 'Smart mapping',

  // Original text: "VIF"
  migrateVmVif: 'VIF',

  // Original text: "Network"
  migrateVmNetwork: 'Sieć',

  // Original text: "No target host"
  migrateVmNoTargetHost: 'No target host',

  // Original text: "A target host is required to migrate a VM"
  migrateVmNoTargetHostMessage: 'A target host is required to migrate a VM',

  // Original text: 'No default SR'
  migrateVmNoDefaultSrError: undefined,

  // Original text: 'Default SR not connected to host'
  migrateVmNotConnectedDefaultSrError: undefined,

  // Original text: 'For each VDI, select an SR:'
  chooseSrForEachVdisModalSelectSr: undefined,

  // Original text: 'Select main SR…'
  chooseSrForEachVdisModalMainSr: undefined,

  // Original text: 'VDI'
  chooseSrForEachVdisModalVdiLabel: undefined,

  // Original text: 'SR*'
  chooseSrForEachVdisModalSrLabel: undefined,

  // Original text: '* optional'
  chooseSrForEachVdisModalOptionalEntry: undefined,

  // Original text: "Delete VDI"
  deleteVdiModalTitle: 'Usuń VDI',

  // Original text: "Are you sure you want to delete this disk? ALL DATA ON THIS DISK WILL BE LOST"
  deleteVdiModalMessage: 'Jesteś pewien że chcesz usunąć dysk? Wszystkie dane na dysku zostaną utracone',

  // Original text: 'Delete VDI{nVdis, plural, one {} other {s}}'
  deleteVdisModalTitle: undefined,

  // Original text: 'Are you sure you want to delete {nVdis, number} disk{nVdis, plural, one {} other {s}}? ALL DATA ON THESE DISKS WILL BE LOST'
  deleteVdisModalMessage: undefined,

  // Original text: 'Delete schedule{nSchedules, plural, one {} other {s}}'
  deleteSchedulesModalTitle: undefined,

  // Original text: 'Are you sure you want to delete {nSchedules, number} schedule{nSchedules, plural, one {} other {s}}?'
  deleteSchedulesModalMessage: undefined,

  // Original text: "Revert your VM"
  revertVmModalTitle: 'Revert your VM',

  // Original text: 'Delete VIF{nVifs, plural, one {} other {s}}'
  deleteVifsModalTitle: undefined,

  // Original text: 'Are you sure you want to delete {nVifs, number} VIF{nVifs, plural, one {} other {s}}?'
  deleteVifsModalMessage: undefined,

  // Original text: "Delete snapshot"
  deleteSnapshotModalTitle: 'Usuń snapshot',

  // Original text: "Are you sure you want to delete this snapshot?"
  deleteSnapshotModalMessage: 'Are you sure you want to delete this snapshot?',

  // Original text: "Are you sure you want to revert this VM to the snapshot state? This operation is irreversible."
  revertVmModalMessage: 'Are you sure you want to revert this VM to the snapshot state? This operation is irreversible.',

  // Original text: "Snapshot before"
  revertVmModalSnapshotBefore: 'Snapshot before',

  // Original text: "Import a {name} Backup"
  importBackupModalTitle: 'Import a {name} Backup',

  // Original text: "Start VM after restore"
  importBackupModalStart: 'Start VM after restore',

  // Original text: "Select your backup…"
  importBackupModalSelectBackup: 'Wybierz swój backup…',

  // Original text: "Are you sure you want to remove all orphaned snapshot VDIs?"
  removeAllOrphanedModalWarning: 'Are you sure you want to remove all orphaned snapshot VDIs?',

  // Original text: "Remove all logs"
  removeAllLogsModalTitle: 'Usuń wszystkie logi',

  // Original text: "Are you sure you want to remove all logs?"
  removeAllLogsModalWarning: 'Jesteś pewien że chcesz usunąć wszystkie logi?',

  // Original text: "This operation is definitive."
  definitiveMessageModal: 'This operation is definitive.',

  // Original text: "Previous SR Usage"
  existingSrModalTitle: 'Previous SR Usage',

  // Original text: "This path has been previously used as a Storage by a XenServer host. All data will be lost if you choose to continue the SR creation."
  existingSrModalText: 'This path has been previously used as a Storage by a XenServer host. All data will be lost if you choose to continue the SR creation.',

  // Original text: "Previous LUN Usage"
  existingLunModalTitle: 'Previous LUN Usage',

  // Original text: "This LUN has been previously used as a Storage by a XenServer host. All data will be lost if you choose to continue the SR creation."
  existingLunModalText: 'This LUN has been previously used as a Storage by a XenServer host. All data will be lost if you choose to continue the SR creation.',

  // Original text: "Replace current registration?"
  alreadyRegisteredModal: 'Replace current registration?',

  // Original text: "Your XO appliance is already registered to {email}, do you want to forget and replace this registration ?"
  alreadyRegisteredModalText: 'Your XO appliance is already registered to {email}, do you want to forget and replace this registration ?',

  // Original text: "Ready for trial?"
  trialReadyModal: 'Ready for trial?',

  // Original text: "During the trial period, XOA need to have a working internet connection. This limitation does not apply for our paid plans!"
  trialReadyModalText: 'During the trial period, XOA need to have a working internet connection. This limitation does not apply for our paid plans!',

  // Original text: 'Label'
  serverLabel: undefined,

  // Original text: "Host"
  serverHost: 'Host',

  // Original text: "Username"
  serverUsername: 'Nazwa użytkownika',

  // Original text: "Password"
  serverPassword: 'Hasło',

  // Original text: "Action"
  serverAction: 'Akcja',

  // Original text: "Read Only"
  serverReadOnly: 'Tylko do odczytu',

  // Original text: 'Unauthorized Certificates'
  serverUnauthorizedCertificates: undefined,

  // Original text: 'Allow Unauthorized Certificates'
  serverAllowUnauthorizedCertificates: undefined,

  // Original text: "Enable it if your certificate is rejected, but it's not recommended because your connection will not be secured."
  serverUnauthorizedCertificatesInfo: undefined,

  // Original text: "Disconnect server"
  serverDisconnect: 'Rozłącz serwer',

  // Original text: "username"
  serverPlaceHolderUser: 'Użytkownik',

  // Original text: "password"
  serverPlaceHolderPassword: 'hasło',

  // Original text: "address[:port]"
  serverPlaceHolderAddress: 'adres[:port]',

  // Original text: 'label'
  serverPlaceHolderLabel: undefined,

  // Original text: "Connect"
  serverConnect: 'Połącz',

  // Original text: 'Error'
  serverError: undefined,

  // Original text: 'Adding server failed'
  serverAddFailed: undefined,

  // Original text: 'Status'
  serverStatus: undefined,

  // Original text: 'Connection failed. Click for more information.'
  serverConnectionFailed: undefined,

  // Original text: 'Connecting…'
  serverConnecting: undefined,

  // Original text: 'Connected'
  serverConnected: undefined,

  // Original text: 'Disconnected'
  serverDisconnected: undefined,

  // Original text: 'Authentication error'
  serverAuthFailed: undefined,

  // Original text: 'Unknown error'
  serverUnknownError: undefined,

  // Original text: 'Invalid self-signed certificate'
  serverSelfSignedCertError: undefined,

  // Original text: 'Do you want to accept self-signed certificate for this server even though it would decrease security?'
  serverSelfSignedCertQuestion: undefined,

  // Original text: "Copy VM"
  copyVm: 'Copy VM',

  // Original text: "Are you sure you want to copy this VM to {SR}?"
  copyVmConfirm: 'Are you sure you want to copy this VM to {SR}?',

  // Original text: "Name"
  copyVmName: 'Nazwa',

  // Original text: "Name pattern"
  copyVmNamePattern: 'Name pattern',

  // Original text: "If empty: name of the copied VM"
  copyVmNamePlaceholder: 'If empty: name of the copied VM',

  // Original text: "e.g.: \"\\{name\\}_COPY\""
  copyVmNamePatternPlaceholder: 'np. : "\\{name\\}_COPY"',

  // Original text: "Select SR"
  copyVmSelectSr: 'Wybierz pulę dyskową',

  // Original text: "Use compression"
  copyVmCompress: 'Użyj kompresji',

  // Original text: "No target SR"
  copyVmsNoTargetSr: 'No target SR',

  // Original text: "A target SR is required to copy a VM"
  copyVmsNoTargetSrMessage: 'A target SR is required to copy a VM',

  // Original text: "Detach host"
  detachHostModalTitle: 'Detach host',

  // Original text: "Are you sure you want to detach {host} from its pool? THIS WILL REMOVE ALL VMs ON ITS LOCAL STORAGE AND REBOOT THE HOST."
  detachHostModalMessage: 'Are you sure you want to detach {host} from its pool? THIS WILL REMOVE ALL VMs ON ITS LOCAL STORAGE AND REBOOT THE HOST.',

  // Original text: "Detach"
  detachHost: 'Detach',

  // Original text: 'Forget host'
  forgetHostModalTitle: undefined,

  // Original text: "Are you sure you want to forget {host} from its pool? Be sure this host can't be back online, or use detach instead."
  forgetHostModalMessage: undefined,

  // Original text: 'Forget'
  forgetHost: undefined,

  // Original text: 'Designate a new master'
  setPoolMasterModalTitle: undefined,

  // Original text: 'This operation may take several minutes. Do you want to continue?'
  setPoolMasterModalMessage: undefined,

  // Original text: "Create network"
  newNetworkCreate: 'Utwórz sieć',

  // Original text: "Create bonded network"
  newBondedNetworkCreate: 'Create bonded network',

  // Original text: "Interface"
  newNetworkInterface: 'Interface',

  // Original text: "Name"
  newNetworkName: 'Nazwa',

  // Original text: "Description"
  newNetworkDescription: 'Opis',

  // Original text: "VLAN"
  newNetworkVlan: 'VLAN',

  // Original text: "No VLAN if empty"
  newNetworkDefaultVlan: 'No VLAN if empty',

  // Original text: "MTU"
  newNetworkMtu: 'MTU',

  // Original text: "Default: 1500"
  newNetworkDefaultMtu: 'Domyślnie : 1500',

  // Original text: "Name required"
  newNetworkNoNameErrorTitle: 'Nazwa wymagana',

  // Original text: "A name is required to create a network"
  newNetworkNoNameErrorMessage: 'Nazwa jest wymagana do utworzenia sieci',

  // Original text: "Bond mode"
  newNetworkBondMode: 'Tryb bondingu',

  // Original text: "Delete network"
  deleteNetwork: 'Usuń sieć',

  // Original text: "Are you sure you want to delete this network?"
  deleteNetworkConfirm: 'Jesteś pewien że chcesz usunąć te sieć ?',

  // Original text: "This network is currently in use"
  networkInUse: 'Ta sieć jest obecnie używana ',

  // Original text: "Bonded"
  pillBonded: 'Bonded',

  // Original text: "Host"
  addHostSelectHost: 'Host',

  // Original text: "No host"
  addHostNoHost: 'No host',

  // Original text: "No host selected to be added"
  addHostNoHostMessage: 'No host selected to be added',

  // Original text: "Xen Orchestra"
  xenOrchestra: 'Xen Orchestra',

  // Original text: "Xen Orchestra server"
  xenOrchestraServer: 'serwer',

  // Original text: "Xen Orchestra web client"
  xenOrchestraWeb: 'web klient',

  // Original text: "No pro support provided!"
  noProSupport: 'No pro support provided!',

  // Original text: "Use in production at your own risks"
  noProductionUse: 'Używanie produkcyjne na własne ryzyko',

  // Original text: "You can download our turnkey appliance at {website}"
  downloadXoaFromWebsite: 'You can download our turnkey appliance at {website}',

  // Original text: "Bug Tracker"
  bugTracker: 'Bug Tracker',

  // Original text: "Issues? Report it!"
  bugTrackerText: 'Issues? Report it!',

  // Original text: "Community"
  community: 'Społeczność',

  // Original text: "Join our community forum!"
  communityText: 'Dołącz do forum społeczności !',

  // Original text: "Free Trial for Premium Edition!"
  freeTrial: 'Free Trial for Premium Edition!',

  // Original text: "Request your trial now!"
  freeTrialNow: 'Request your trial now!',

  // Original text: "Any issue?"
  issues: 'Any issue?',

  // Original text: "Problem? Contact us!"
  issuesText: 'Masz problem? Zkontaktuj się z nami!',

  // Original text: "Documentation"
  documentation: 'Dokumentacja',

  // Original text: "Read our official doc"
  documentationText: 'Read our official doc',

  // Original text: "Pro support included"
  proSupportIncluded: 'Pro support included',

  // Original text: "Access your XO Account"
  xoAccount: 'Acces your XO Account',

  // Original text: "Report a problem"
  openTicket: 'Raportuj problem',

  // Original text: "Problem? Open a ticket!"
  openTicketText: 'Masz problem? Utwórz zgłoszenie!',

  // Original text: "Upgrade needed"
  upgradeNeeded: 'Upgrade needed',

  // Original text: "Upgrade now!"
  upgradeNow: 'Aktualizuj teraz!',

  // Original text: "Or"
  or: 'Lub',

  // Original text: "Try it for free!"
  tryIt: 'Spróbuj za darmo!',

  // Original text: "This feature is available starting from {plan} Edition"
  availableIn: 'This feature is available starting from {plan} Edition',

  // Original text: "This feature is not available in your version, contact your administrator to know more."
  notAvailable: 'This feature is not available in your version, contact your administrator to know more.',

  // Original text: "Updates"
  updateTitle: 'Aktualizuj',

  // Original text: "Registration"
  registration: 'Rejestracja',

  // Original text: "Trial"
  trial: 'Trial',

  // Original text: "Settings"
  settings: 'Ustawienia',

  // Original text: "Proxy settings"
  proxySettings: 'Ustawienia proxy',

  // Original text: "Host (myproxy.example.org)"
  proxySettingsHostPlaceHolder: 'Host (mojeproxy.przyklad.pl)',

  // Original text: "Port (eg: 3128)"
  proxySettingsPortPlaceHolder: 'Port (np : 3128)',

  // Original text: "Username"
  proxySettingsUsernamePlaceHolder: 'Użytkownik',

  // Original text: "Password"
  proxySettingsPasswordPlaceHolder: 'Hasło',

  // Original text: "Your email account"
  updateRegistrationEmailPlaceHolder: 'Twoje konto email',

  // Original text: "Your password"
  updateRegistrationPasswordPlaceHolder: 'Twoje hasło',

  // Original text: 'Troubleshooting documentation'
  updaterTroubleshootingLink: undefined,

  // Original text: "Update"
  update: 'Aktualizuj',

  // Original text: "Refresh"
  refresh: 'Odśwież',

  // Original text: "Upgrade"
  upgrade: 'Aktualizuj',

  // Original text: "No updater available for Community Edition"
  noUpdaterCommunity: 'No updater available for Community Edition',

  // Original text: "Please consider subscribing and trying it with all the features for free during 15 days on {link}."
  considerSubscribe: 'Please consider subscribe and try it with all features for free during 15 days on',

  // Original text: "Manual update could break your current installation due to dependencies issues, do it with caution"
  noUpdaterWarning: 'Manual update could break your current installation due to dependencies issues, do it with caution',

  // Original text: "Current version:"
  currentVersion: 'Obecna wersja:',

  // Original text: "Register"
  register: 'Rejestruj',

  // Original text: "Edit registration"
  editRegistration: 'Edit registration',

  // Original text: "Please, take time to register in order to enjoy your trial."
  trialRegistration: 'Please, take time to register in order to enjoy your trial.',

  // Original text: "Start trial"
  trialStartButton: 'Start trial',

  // Original text: "You can use a trial version until {date, date, medium}. Upgrade your appliance to get it."
  trialAvailableUntil: 'You can use a trial version until {date, date, medium}. Upgrade your appliance to get it.',

  // Original text: "Your trial has been ended. Contact us or downgrade to Free version"
  trialConsumed: 'Twoja wersja demonstracyjna właśnie się zakończyła. Skontaktuj się z nami żeby pobrać darmową wersję',

  // Original text: "Your xoa-updater service appears to be down. Your XOA cannot run fully without reaching this service."
  trialLocked: 'Your xoa-updater service appears to be down. Your XOA cannot run fully without reaching this service.',

  // Original text: "No update information available"
  noUpdateInfo: 'No update information available',

  // Original text: "Update information may be available"
  waitingUpdateInfo: 'Update information may be available',

  // Original text: "Your XOA is up-to-date"
  upToDate: 'Twoje XOA jest aktualne',

  // Original text: "You need to update your XOA (new version is available)"
  mustUpgrade: 'You need to update your XOA (new version is available)',

  // Original text: "Your XOA is not registered for updates"
  registerNeeded: 'Your XOA is not registered for updates',

  // Original text: "Can't fetch update information"
  updaterError: 'Nie mogę pobrać aktualizacji',

  // Original text: "Upgrade successful"
  promptUpgradeReloadTitle: 'Aktualizacja zakończona sukcesem',

  // Original text: "Your XOA has successfully upgraded, and your browser must reload the application. Do you want to reload now ?"
  promptUpgradeReloadMessage: 'Your XOA has successfully upgraded, and your browser must reload the application. Do you want to reload now ?',

  // Original text: "Xen Orchestra from the sources"
  disclaimerTitle: 'Xen Orchestra z źródeł',

  // Original text: "You are using XO from the sources! That's great for a personal/non-profit usage."
  disclaimerText1: 'Używasz XO z źródeł!. To dobre rozwiązanie tylko do prywatnego/nieprodukcyjnego użytku',

  // Original text: "If you are a company, it's better to use it with our appliance + pro support included:"
  disclaimerText2: "If you are a company, it's better to use it with our appliance + pro support included:",

  // Original text: "This version is not bundled with any support nor updates. Use it with caution for critical tasks."
  disclaimerText3: 'This version is not bundled with any support nor updates. Use it with caution for critical tasks.',

  // Original text: "Connect PIF"
  connectPif: 'Connect PIF',

  // Original text: "Are you sure you want to connect this PIF?"
  connectPifConfirm: 'Are you sure you want to connect this PIF?',

  // Original text: "Disconnect PIF"
  disconnectPif: 'Disconnect PIF',

  // Original text: "Are you sure you want to disconnect this PIF?"
  disconnectPifConfirm: 'Are you sure you want to disconnect this PIF ?',

  // Original text: "Delete PIF"
  deletePif: 'Delete PIF',

  // Original text: "Are you sure you want to delete this PIF?"
  deletePifConfirm: 'Are you sure you want to delete this PIF?',

  // Original text: 'Delete PIFs'
  deletePifs: undefined,

  // Original text: 'Are you sure you want to delete {nPifs, number} PIF{nPifs, plural, one {} other {s}}?'
  deletePifsConfirm: undefined,

  // Original text: 'Connected'
  pifConnected: undefined,

  // Original text: 'Disconnected'
  pifDisconnected: undefined,

  // Original text: 'Physically connected'
  pifPhysicallyConnected: undefined,

  // Original text: 'Physically disconnected'
  pifPhysicallyDisconnected: undefined,

  // Original text: "Username"
  username: 'Użytkownik',

  // Original text: "Password"
  password: 'Hasło',

  // Original text: "Language"
  language: 'Język',

  // Original text: "Old password"
  oldPasswordPlaceholder: 'Stare hasło',

  // Original text: "New password"
  newPasswordPlaceholder: 'Nowe hasło',

  // Original text: "Confirm new password"
  confirmPasswordPlaceholder: 'Potwierdź nowe hasło',

  // Original text: "Confirmation password incorrect"
  confirmationPasswordError: 'Potwierdzenie hasła niepoprawne',

  // Original text: "Password does not match the confirm password."
  confirmationPasswordErrorBody: 'Hasło nie zgadza się z potwierdzeniem',

  // Original text: "Password changed"
  pwdChangeSuccess: 'Hasło zmienione',

  // Original text: "Your password has been successfully changed."
  pwdChangeSuccessBody: 'Twoje hasło zostało pomyślnie zmienione',

  // Original text: "Incorrect password"
  pwdChangeError: 'Nieprawidłowe hasło',

  // Original text: "The old password provided is incorrect. Your password has not been changed."
  pwdChangeErrorBody: 'The old password provided is incorrect. Your password has not been changed.',

  // Original text: "OK"
  changePasswordOk: 'OK',

  // Original text: "SSH keys"
  sshKeys: 'Klucze SSH',

  // Original text: "New SSH key"
  newSshKey: 'Nowy klucz SSH',

  // Original text: "Delete"
  deleteSshKey: 'Usuń',

  // Original text: 'Delete selected SSH keys'
  deleteSshKeys: undefined,

  // Original text: "No SSH keys"
  noSshKeys: 'Brak kluczy SSH',

  // Original text: "New SSH key"
  newSshKeyModalTitle: 'Nowy klucz SSH',

  // Original text: "Invalid key"
  sshKeyErrorTitle: 'Nieprawidłowy klucz',

  // Original text: "An SSH key requires both a title and a key."
  sshKeyErrorMessage: 'An SSH key requires both a title and a key.',

  // Original text: "Title"
  title: 'Title',

  // Original text: "Key"
  key: 'Klucz',

  // Original text: "Delete SSH key"
  deleteSshKeyConfirm: 'Usuń klucz SSH',

  // Original text: "Are you sure you want to delete the SSH key {title}?"
  deleteSshKeyConfirmMessage: 'Are you sure you want to delete the SSH key {title}?',

  // Original text: 'Delete SSH key{nKeys, plural, one {} other {s}}'
  deleteSshKeysConfirm: undefined,

  // Original text: 'Are you sure you want to delete {nKeys, number} SSH key{nKeys, plural, one {} other {s}}?'
  deleteSshKeysConfirmMessage: undefined,

  // Original text: "Others"
  others: 'Inne',

  // Original text: "Loading logs…"
  loadingLogs: 'Ładowanie logów…',

  // Original text: "User"
  logUser: 'Użytkownik',

  // Original text: "Method"
  logMethod: 'Metoda',

  // Original text: "Params"
  logParams: 'Params',

  // Original text: "Message"
  logMessage: 'Wiadomość',

  // Original text: "Error"
  logError: 'Błąd',

  // Original text: "Display details"
  logDisplayDetails: 'Wyświetl szczegóły',

  // Original text: "Date"
  logTime: 'Data',

  // Original text: "No stack trace"
  logNoStackTrace: 'No stack trace',

  // Original text: "No params"
  logNoParams: 'No params',

  // Original text: "Delete log"
  logDelete: 'Usuń logi',

  // Original text: 'Delete logs'
  logsDelete: undefined,

  // Original text: 'Delete log{nLogs, plural, one {} other {s}}'
  logDeleteMultiple: undefined,

  // Original text: 'Are you sure you want to delete {nLogs, number} log{nLogs, plural, one {} other {s}}?'
  logDeleteMultipleMessage: undefined,

  // Original text: "Delete all logs"
  logDeleteAll: 'Usuń wszystkie logi',

  // Original text: "Delete all logs"
  logDeleteAllTitle: 'Usuń wszystkie logi',

  // Original text: "Are you sure you want to delete all the logs?"
  logDeleteAllMessage: 'Are you sure you want to delete all the logs?',

  // Original text: 'Click to enable'
  logIndicationToEnable: undefined,

  // Original text: 'Click to disable'
  logIndicationToDisable: undefined,

  // Original text: 'Report a bug'
  reportBug: undefined,

  // Original text: 'Job canceled to protect the VDI chain'
  unhealthyVdiChainError: undefined,

  // Original text: 'Click for more information'
  clickForMoreInformation: undefined,

  // Original text: "Name"
  ipPoolName: 'Nazwa',

  // Original text: "IPs"
  ipPoolIps: 'IPs',

  // Original text: "IPs (e.g.: 1.0.0.12-1.0.0.17;1.0.0.23)"
  ipPoolIpsPlaceholder: 'IPs (np.: 1.0.0.12-1.0.0.17;1.0.0.23)',

  // Original text: "Networks"
  ipPoolNetworks: 'Sieci',

  // Original text: "No IP pools"
  ipsNoIpPool: 'Brak puli IP',

  // Original text: "Create"
  ipsCreate: 'Utwórz',

  // Original text: "Delete all IP pools"
  ipsDeleteAllTitle: 'Usuń wszystkie pule IP',

  // Original text: "Are you sure you want to delete all the IP pools?"
  ipsDeleteAllMessage: 'Jesteś pewien że chcesz usunąć wszystkie pule IP?',

  // Original text: "VIFs"
  ipsVifs: 'VIFs',

  // Original text: "Not used"
  ipsNotUsed: 'Nieużywany',

  // Original text: 'unknown VIF'
  ipPoolUnknownVif: undefined,

  // Original text: 'Name already exists'
  ipPoolNameAlreadyExists: undefined,

  // Original text: "Keyboard shortcuts"
  shortcutModalTitle: 'Skróty klawiszowe',

  // Original text: "Global"
  shortcut_XoApp: 'Global',

  // Original text: 'Go to hosts list'
  shortcut_XoApp_GO_TO_HOSTS: undefined,

  // Original text: 'Go to pools list'
  shortcut_XoApp_GO_TO_POOLS: undefined,

  // Original text: 'Go to VMs list'
  shortcut_XoApp_GO_TO_VMS: undefined,

  // Original text: 'Go to SRs list'
  shortcut_XoApp_GO_TO_SRS: undefined,

  // Original text: 'Create a new VM'
  shortcut_XoApp_CREATE_VM: undefined,

  // Original text: 'Unfocus field'
  shortcut_XoApp_UNFOCUS: undefined,

  // Original text: 'Show shortcuts key bindings'
  shortcut_XoApp_HELP: undefined,

  // Original text: "Home"
  shortcut_Home: 'Home',

  // Original text: 'Focus search bar'
  shortcut_Home_SEARCH: undefined,

  // Original text: 'Next item'
  shortcut_Home_NAV_DOWN: undefined,

  // Original text: 'Previous item'
  shortcut_Home_NAV_UP: undefined,

  // Original text: 'Select item'
  shortcut_Home_SELECT: undefined,

  // Original text: 'Open'
  shortcut_Home_JUMP_INTO: undefined,

  // Original text: 'Supported tables'
  shortcut_SortedTable: undefined,

  // Original text: 'Focus the table search bar'
  shortcut_SortedTable_SEARCH: undefined,

  // Original text: 'Next item'
  shortcut_SortedTable_NAV_DOWN: undefined,

  // Original text: 'Previous item'
  shortcut_SortedTable_NAV_UP: undefined,

  // Original text: 'Select item'
  shortcut_SortedTable_SELECT: undefined,

  // Original text: 'Action'
  shortcut_SortedTable_ROW_ACTION: undefined,

  // Original text: "VM"
  settingsAclsButtonTooltipVM: 'VM',

  // Original text: "Hosts"
  settingsAclsButtonTooltiphost: 'Hosty',

  // Original text: "Pool"
  settingsAclsButtonTooltippool: 'Pule',

  // Original text: "SR"
  settingsAclsButtonTooltipSR: 'SR',

  // Original text: "Network"
  settingsAclsButtonTooltipnetwork: 'Sieć',

  // Original text: 'No config file selected'
  noConfigFile: undefined,

  // Original text: 'Try dropping a config file here, or click to select a config file to upload.'
  importTip: undefined,

  // Original text: 'Config'
  config: undefined,

  // Original text: 'Import'
  importConfig: undefined,

  // Original text: 'Config file successfully imported'
  importConfigSuccess: undefined,

  // Original text: 'Error while importing config file'
  importConfigError: undefined,

  // Original text: 'Export'
  exportConfig: undefined,

  // Original text: 'Download current config'
  downloadConfig: undefined,

  // Original text: 'No config import available for Community Edition'
  noConfigImportCommunity: undefined,

  // Original text: 'Reconnect all hosts'
  srReconnectAllModalTitle: undefined,

  // Original text: 'This will reconnect this SR to all its hosts.'
  srReconnectAllModalMessage: undefined,

  // Original text: 'This will reconnect each selected SR to its host (local SR) or to every hosts of its pool (shared SR).'
  srsReconnectAllModalMessage: undefined,

  // Original text: 'Disconnect all hosts'
  srDisconnectAllModalTitle: undefined,

  // Original text: 'This will disconnect this SR from all its hosts.'
  srDisconnectAllModalMessage: undefined,

  // Original text: 'This will disconnect each selected SR from its host (local SR) or from every hosts of its pool (shared SR).'
  srsDisconnectAllModalMessage: undefined,

  // Original text: 'Forget SR'
  srForgetModalTitle: undefined,

  // Original text: 'Forget selected SRs'
  srsForgetModalTitle: undefined,

  // Original text: "Are you sure you want to forget this SR? VDIs on this storage won't be removed."
  srForgetModalMessage: undefined,

  // Original text: "Are you sure you want to forget all the selected SRs? VDIs on these storages won't be removed."
  srsForgetModalMessage: undefined,

  // Original text: 'Disconnected'
  srAllDisconnected: undefined,

  // Original text: 'Partially connected'
  srSomeConnected: undefined,

  // Original text: 'Connected'
  srAllConnected: undefined,

  // Original text: 'XOSAN'
  xosanTitle: undefined,

  // Original text: 'Xen Orchestra SAN SR'
  xosanSrTitle: undefined,

  // Original text: 'Select local SRs (lvm)'
  xosanAvailableSrsTitle: undefined,

  // Original text: 'Suggestions'
  xosanSuggestions: undefined,

  // Original text: 'Warning: using disperse layout is not recommended right now. Please read {link}.'
  xosanDisperseWarning: undefined,

  // Original text: 'Name'
  xosanName: undefined,

  // Original text: 'Host'
  xosanHost: undefined,

  // Original text: 'Connected Hosts'
  xosanHosts: undefined,

  // Original text: 'Pool'
  xosanPool: undefined,

  // Original text: 'Volume ID'
  xosanVolumeId: undefined,

  // Original text: 'Size'
  xosanSize: undefined,

  // Original text: 'Used space'
  xosanUsedSpace: undefined,

  // Original text: 'License'
  xosanLicense: undefined,

  // Original text: 'This XOSAN has more than 1 license!'
  xosanMultipleLicenses: undefined,

  // Original text: 'XOSAN pack needs to be installed on each host of the pool.'
  xosanNeedPack: undefined,

  // Original text: 'Install it now!'
  xosanInstallIt: undefined,

  // Original text: 'Some hosts need their toolstack to be restarted before you can create an XOSAN'
  xosanNeedRestart: undefined,

  // Original text: 'Restart toolstacks'
  xosanRestartAgents: undefined,

  // Original text: 'Pool master is not running'
  xosanMasterOffline: undefined,

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

  // Original text: 'Add'
  xosanAdd: undefined,

  // Original text: 'Installing XOSAN. Please wait…'
  xosanInstalling: undefined,

  // Original text: 'No XOSAN available for Community Edition'
  xosanCommunity: undefined,

  // Original text: 'New'
  xosanNew: undefined,

  // Original text: 'Advanced'
  xosanAdvanced: undefined,

  // Original text: 'Remove subvolumes'
  xosanRemoveSubvolumes: undefined,

  // Original text: 'Add subvolume…'
  xosanAddSubvolume: undefined,

  // Original text: "This version of XOSAN SR is from the first beta phase. You can keep using it, but to modify it you'll have to save your disks and re-create it."
  xosanWarning: undefined,

  // Original text: 'VLAN'
  xosanVlan: undefined,

  // Original text: 'No XOSAN found'
  xosanNoSrs: undefined,

  // Original text: 'Some SRs are detached from the XOSAN'
  xosanPbdsDetached: undefined,

  // Original text: 'Something is wrong with: {badStatuses}'
  xosanBadStatus: undefined,

  // Original text: 'Running'
  xosanRunning: undefined,

  // Original text: 'Delete XOSAN'
  xosanDelete: undefined,

  // Original text: 'Fix'
  xosanFixIssue: undefined,

  // Original text: 'Creating XOSAN on {pool}'
  xosanCreatingOn: undefined,

  // Original text: 'Configuring network…'
  xosanState_configuringNetwork: undefined,

  // Original text: 'Importing VM…'
  xosanState_importingVm: undefined,

  // Original text: 'Copying VMs…'
  xosanState_copyingVms: undefined,

  // Original text: 'Configuring VMs…'
  xosanState_configuringVms: undefined,

  // Original text: 'Configuring gluster…'
  xosanState_configuringGluster: undefined,

  // Original text: 'Creating SR…'
  xosanState_creatingSr: undefined,

  // Original text: 'Scanning SR…'
  xosanState_scanningSr: undefined,

  // Original text: 'Install cloud plugin first'
  xosanInstallCloudPlugin: undefined,

  // Original text: 'Load cloud plugin first'
  xosanLoadCloudPlugin: undefined,

  // Original text: 'Register your appliance first'
  xosanRegister: undefined,

  // Original text: 'Loading…'
  xosanLoading: undefined,

  // Original text: 'XOSAN is not available at the moment'
  xosanNotAvailable: undefined,

  // Original text: 'Install XOSAN pack on these hosts:'
  xosanInstallPackOnHosts: undefined,

  // Original text: 'Install {pack} v{version}?'
  xosanInstallPack: undefined,

  // Original text: 'No compatible XOSAN pack found for your XenServer versions.'
  xosanNoPackFound: undefined,

  // Original text: 'At least one of these version requirements must be satisfied by all the hosts in this pool:'
  xosanPackRequirements: undefined,

  // Original text: 'Some XOSAN Virtual Machines are not running'
  xosanVmsNotRunning: undefined,

  // Original text: 'Some XOSAN Virtual Machines could not be found'
  xosanVmsNotFound: undefined,

  // Original text: 'Files needing healing'
  xosanFilesNeedingHealing: undefined,

  // Original text: 'Some XOSAN Virtual Machines have files needing healing'
  xosanFilesNeedHealing: undefined,

  // Original text: 'Host {hostName} is not in XOSAN network'
  xosanHostNotInNetwork: undefined,

  // Original text: 'VM controller'
  xosanVm: undefined,

  // Original text: 'SR'
  xosanUnderlyingStorage: undefined,

  // Original text: 'Replace…'
  xosanReplace: undefined,

  // Original text: 'On same VM'
  xosanOnSameVm: undefined,

  // Original text: 'Brick name'
  xosanBrickName: undefined,

  // Original text: 'Brick UUID'
  xosanBrickUuid: undefined,

  // Original text: 'Brick size'
  xosanBrickSize: undefined,

  // Original text: 'Memory size'
  xosanMemorySize: undefined,

  // Original text: 'Status'
  xosanStatus: undefined,

  // Original text: 'Arbiter'
  xosanArbiter: undefined,

  // Original text: 'Used Inodes'
  xosanUsedInodes: undefined,

  // Original text: 'Block size'
  xosanBlockSize: undefined,

  // Original text: 'Device'
  xosanDevice: undefined,

  // Original text: 'FS name'
  xosanFsName: undefined,

  // Original text: 'Mount options'
  xosanMountOptions: undefined,

  // Original text: 'Path'
  xosanPath: undefined,

  // Original text: 'Job'
  xosanJob: undefined,

  // Original text: 'PID'
  xosanPid: undefined,

  // Original text: 'Port'
  xosanPort: undefined,

  // Original text: 'Missing values'
  xosanReplaceBrickErrorTitle: undefined,

  // Original text: 'You need to select a SR and a size'
  xosanReplaceBrickErrorMessage: undefined,

  // Original text: 'Bad values'
  xosanAddSubvolumeErrorTitle: undefined,

  // Original text: 'You need to select {nSrs, number} and a size'
  xosanAddSubvolumeErrorMessage: undefined,

  // Original text: 'Select {nSrs, number} SRs'
  xosanSelectNSrs: undefined,

  // Original text: 'Run'
  xosanRun: undefined,

  // Original text: 'Remove'
  xosanRemove: undefined,

  // Original text: 'Volume'
  xosanVolume: undefined,

  // Original text: 'Volume options'
  xosanVolumeOptions: undefined,

  // Original text: 'Could not find VM'
  xosanCouldNotFindVm: undefined,

  // Original text: 'Using {usage}'
  xosanUnderlyingStorageUsage: undefined,

  // Original text: 'Custom IP network (/24)'
  xosanCustomIpNetwork: undefined,

  // Original text: 'Will configure the host xosan network device with a static IP address and plug it in.'
  xosanIssueHostNotInNetwork: undefined,

  // Original text: 'Licenses'
  licensesTitle: undefined,

  // Original text: 'You are not registered and therefore will not be able to create or manage your XOSAN SRs. {link}'
  xosanUnregisteredDisclaimer: undefined,

  // Original text: 'In order to create a XOSAN SR, you need to use the Xen Orchestra Appliance and buy a XOSAN license on {link}.'
  xosanSourcesDisclaimer: undefined,

  // Original text: 'Register now!'
  registerNow: undefined,

  // Original text: 'You need to register your appliance to manage your licenses.'
  licensesUnregisteredDisclaimer: undefined,

  // Original text: 'Product'
  licenseProduct: undefined,

  // Original text: 'Attached to'
  licenseBoundObject: undefined,

  // Original text: 'Purchaser'
  licensePurchaser: undefined,

  // Original text: 'Expires'
  licenseExpires: undefined,

  // Original text: 'You'
  licensePurchaserYou: undefined,

  // Original text: 'Support'
  productSupport: undefined,

  // Original text: 'No XOSAN attached'
  licenseNotBoundXosan: undefined,

  // Original text: 'License attached to an unknown XOSAN'
  licenseBoundUnknownXosan: undefined,

  // Original text: 'Manage the licenses'
  licensesManage: undefined,

  // Original text: 'New license'
  newLicense: undefined,

  // Original text: 'Refresh'
  refreshLicenses: undefined,

  // Original text: 'Limited size because XOSAN is in trial'
  xosanLicenseRestricted: undefined,

  // Original text: 'You need a license on this SR to manage the XOSAN.'
  xosanAdminNoLicenseDisclaimer: undefined,

  // Original text: 'Your XOSAN license has expired. You can still use the SR but cannot administrate it anymore.'
  xosanAdminExpiredLicenseDisclaimer: undefined,

  // Original text: 'Could not check the license on this XOSAN SR'
  xosanCheckLicenseError: undefined,

  // Original text: 'Could not fetch licenses'
  xosanGetLicensesError: undefined,

  // Original text: 'License has expired.'
  xosanLicenseHasExpired: undefined,

  // Original text: 'License expires on {date}.'
  xosanLicenseExpiresDate: undefined,

  // Original text: 'Update the license now!'
  xosanUpdateLicenseMessage: undefined,

  // Original text: 'Unknown XOSAN SR.'
  xosanUnknownSr: undefined,

  // Original text: 'Contact us!'
  contactUs: undefined,

  // Original text: 'No license.'
  xosanNoLicense: undefined,

  // Original text: 'Unlock now!'
  xosanUnlockNow: undefined,

  // Original text: 'XOSAN Beta is over. You may now delete and recreate previous existing XOSAN SRs.'
  xosanBetaOverMessage: undefined,

  // Original text: 'Select a license'
  selectLicense: undefined,

  // Original text: 'Bind license'
  bindLicense: undefined,

  // Original text: 'expires on {date}'
  expiresOn: undefined,

  // Original text: 'Install XOA plugin first'
  xosanInstallXoaPlugin: undefined,

  // Original text: 'Load XOA plugin first'
  xosanLoadXoaPlugin: undefined,

  // Original text: '{days, plural, =0 {} one {# day } other {# days }}{hours, plural, =0 {} one {# hour } other {# hours }}{minutes, plural, =0 {} one {# minute } other {# minutes }}{seconds, plural, =0 {} one {# second} other {# seconds}}'
  durationFormat: undefined,
}
