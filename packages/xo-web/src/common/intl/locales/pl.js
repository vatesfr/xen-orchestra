// See http://momentjs.com/docs/#/use-it/browserify/
import 'moment/locale/pl'

import reactIntlData from 'react-intl/locale-data/pl'
import { addLocaleData } from 'react-intl'
addLocaleData(reactIntlData)

// ===================================================================

export default {
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

  // Original text: "OK"
  alertOk: 'OK',

  // Original text: "OK"
  confirmOk: 'OK',

  // Original text: "Cancel"
  confirmCancel: 'Anuluj',

  // Original text: "On error"
  onError: 'Błąd',

  // Original text: "Successful"
  successful: 'Ukończone',

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

  // Original text: "Updates"
  updatePage: 'Aktualizacje',

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

  // Original text: "About"
  aboutPage: 'O oprogramowaniu',

  // Original text: "About {xoaPlan}"
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

  // Original text: "Overview"
  backupOverviewPage: 'Podgląd',

  // Original text: "New"
  backupNewPage: 'Nowy',

  // Original text: "Remotes"
  backupRemotesPage: 'Zdalne',

  // Original text: "Restore"
  backupRestorePage: 'Odtwórz',

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

  // Original text: "Welcome on Xen Orchestra!"
  homeWelcome: 'Witaj w Xen Orchestra!',

  // Original text: "Add your XCP-ng hosts or pools"
  homeWelcomeText: 'Dodaj serwery XenServer lub pule',

  // Original text: "Want some help?"
  homeHelp: 'Potrzebujesz pomocy?',

  // Original text: "Add server"
  homeAddServer: 'Dodaj serwer',

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

  // Original text: "New VM"
  homeNewVm: 'Nowa VM',

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

  // Original text: "Name"
  homeSortByName: 'Nazwa',

  // Original text: "Power state"
  homeSortByPowerstate: 'Stan zasilania',

  // Original text: "RAM"
  homeSortByRAM: 'RAM',

  // Original text: "vCPUs"
  homeSortByvCPUs: 'vCPUs',

  // Original text: "CPUs"
  homeSortByCpus: 'CPUs',

  // Original text: "{displayed, number}x {icon} (on {total, number})"
  homeDisplayedItems: '{displayed, number}x {icon} (w {total, number})',

  // Original text: "{selected, number}x {icon} selected (on {total, number})"
  homeSelectedItems: '{selected, number}x {icon} wybrane {selected, plural, one {} other {s}} (w {total, number})',

  // Original text: "More"
  homeMore: 'Więcej',

  // Original text: "Migrate to…"
  homeMigrateTo: 'Migruj do…',

  // Original text: "Missing patches"
  homeMissingPatches: 'Brakujące łatki',

  // Original text: "Master:"
  homePoolMaster: 'Master:',

  // Original text: "High Availability"
  highAvailability: 'Wysoka dostępność',

  // Original text: "Add"
  add: 'Dodaj',

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

  // Original text: "Fill required informations."
  fillRequiredInformations: 'Wypełnij brakujące informacje.',

  // Original text: "Fill informations (optional)"
  fillOptionalInformations: 'Wypełnij informacje (opcjonalnie)',

  // Original text: "Reset"
  selectTableReset: 'Reset',

  // Original text: "Month"
  schedulingMonth: 'Miesiąc',

  // Original text: "Each selected month"
  schedulingEachSelectedMonth: 'Każdy wybrany miesiąc',

  // Original text: "Day of the month"
  schedulingMonthDay: 'Dzień z miesiąca',

  // Original text: "Each selected day"
  schedulingEachSelectedMonthDay: 'Każdy wybrany dzień',

  // Original text: "Day of the week"
  schedulingWeekDay: 'Dzień z tygodnia',

  // Original text: "Each selected day"
  schedulingEachSelectedWeekDay: 'Każdy wybrany dzień',

  // Original text: "Hour"
  schedulingHour: 'Godzina',

  // Original text: "Every N hour"
  schedulingEveryNHour: 'Każda N godzina',

  // Original text: "Each selected hour"
  schedulingEachSelectedHour: 'Każda wybrana godzina',

  // Original text: "Minute"
  schedulingMinute: 'Minuta',

  // Original text: "Every N minute"
  schedulingEveryNMinute: 'Każda N minuta',

  // Original text: "Each selected minute"
  schedulingEachSelectedMinute: 'Każda wybrana minuta',

  // Original text: "Reset"
  schedulingReset: 'Reset',

  // Original text: "Unknown"
  unknownSchedule: 'Nieznany',

  // Original text: "Xo-server timezone:"
  timezonePickerServerValue: 'Strefa czasowa Xo-server:',

  // Original text: "Web browser timezone"
  timezonePickerUseLocalTime: 'Strefa czasowa przeglądarki internetowej',

  // Original text: "Xo-server timezone"
  timezonePickerUseServerTime: 'Strefa czasowa Xo-server',

  // Original text: "Server timezone ({value})"
  serverTimezoneOption: 'Strefa czasowa serwera({value})',

  // Original text: "Cron Pattern:"
  cronPattern: 'Cron Pattern :',

  // Original text: "Cannot edit backup"
  backupEditNotFoundTitle: 'Nie można edytować kopii zapasowej',

  // Original text: "Missing required info for edition"
  backupEditNotFoundMessage: 'Brakuje wymaganych informacji do edycji',

  // Original text: "Job"
  job: 'Job',

  // Original text: "Job ID"
  jobId: 'Job ID',

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

  // Original text: "Timezone"
  jobTimezone: 'Strefa czasowa',

  // Original text: "xo-server"
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

  // Original text: "No scheduled jobs."
  noScheduledJobs: 'Brak zaplanowanych zadań',

  // Original text: "No jobs found."
  noJobs: 'Brak zadań',

  // Original text: "No schedules found"
  noSchedules: 'Brak harmonogramów',

  // Original text: "Select a xo-server API command"
  jobActionPlaceHolder: 'Wybierz polecenie API dla xo-server',

  // Original text: "Schedules"
  jobSchedules: 'Harmonogramy',

  // Original text: "Name of your schedule"
  jobScheduleNamePlaceHolder: 'Nazwa twojego harmonogramu',

  // Original text: "Select a Job"
  jobScheduleJobPlaceHolder: 'Wybierz zadanie',

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

  // Original text: "VMs"
  editBackupVmsTitle: 'VMs',

  // Original text: "VMs statuses"
  editBackupSmartStatusTitle: 'Statusy VMs',

  // Original text: "Resident on"
  editBackupSmartResidentOn: 'Resident on',

  // Original text: "VMs Tags"
  editBackupSmartTagsTitle: 'Tagi VMs',

  // Original text: "Tag"
  editBackupTagTitle: 'Tag',

  // Original text: "Report"
  editBackupReportTitle: 'Raport',

  // Original text: "Enable immediately after creation"
  editBackupScheduleEnabled: 'Uruchom natychamiast po utworzeniu',

  // Original text: "Depth"
  editBackupDepthTitle: 'Depth',

  // Original text: "Remote"
  editBackupRemoteTitle: 'Zdalny',

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

  // Original text: "The remote appears to work correctly"
  remoteTestSuccessMessage: 'The remote appears to work correctly',

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

  // Original text: "Delete"
  remoteDeleteTip: 'Usuń',

  // Original text: "remote name *"
  remoteNamePlaceHolder: 'Nazwa zdalna*',

  // Original text: "Name *"
  remoteMyNamePlaceHolder: 'Nazwa',

  // Original text: "/path/to/backup"
  remoteLocalPlaceHolderPath: '/ścieżka/do/kopii/zapasowej',

  // Original text: "host *"
  remoteNfsPlaceHolderHost: 'Host',

  // Original text: "/path/to/backup"
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
  remoteSmbPlaceHolderAddressShare: '<adres>\\<udział>',

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

  // Original text: "{users} user{users, plural, one {} other {s}}"
  countUsers: '{users} użytkownik{users, plural, one {} other {s}}',

  // Original text: "Select Permission"
  selectPermission: 'Wybierz uprawnienia',

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

  // Original text: "Rescan all disks"
  srRescan: 'Skanuj wszystkie dyski',

  // Original text: "Connect to all hosts"
  srReconnectAll: 'Połącz z wszystkimi hostami',

  // Original text: "Disconnect to all hosts"
  srDisconnectAll: 'Rozłącz z wszystkimi hostami',

  // Original text: "Forget this SR"
  srForget: 'Zapomnij te pulę dyskową',

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

  // Original text: "Hosts"
  hostsTabName: 'Hosty',

  // Original text: "High Availability"
  poolHaStatus: 'Wysoka dostępność',

  // Original text: "Enabled"
  poolHaEnabled: 'Włączone',

  // Original text: "Disabled"
  poolHaDisabled: 'Wyłączone',

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

  // Original text: "Add SR"
  addSrLabel: 'Dodaj przestrzeń dyskową',

  // Original text: "Add VM"
  addVmLabel: 'Dodaj VM',

  // Original text: "Add Host"
  addHostLabel: 'Dodaj hosta',

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

  // Original text: "Core (socket)"
  hostCpusNumber: 'Core (socket)',

  // Original text: "Manufacturer info"
  hostManufacturerinfo: 'Informacje o producencie',

  // Original text: "BIOS info"
  hostBiosinfo: 'BIOS informacje',

  // Original text: "Licence"
  licenseHostSettingsLabel: 'Licencja',

  // Original text: "Type"
  hostLicenseType: 'Typ',

  // Original text: "Socket"
  hostLicenseSocket: 'Gniazdo',

  // Original text: "Expiry"
  hostLicenseExpiry: 'Wygasa',

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

  // Original text: 'Mode'
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

  // Original text: "No patch detected"
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

  // Original text: "non-US keyboard could have issues with console: switch your own layout to US."
  tipConsoleLabel: 'non-US keyboard could have issues with console: switch your own layout to US.',

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
  vdiAttachDevice: 'Dołącz dysk',

  // Original text: "New disk"
  vbdCreateDeviceButton: 'Nowy dysk',

  // Original text: "Boot order"
  vdiBootOrder: 'Kolejność bootowania',

  // Original text: "Name"
  vdiNameLabel: 'Nazwa',

  // Original text: "Description"
  vdiNameDescription: 'Opis',

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

  // Original text: "No SR"
  vdiMigrateNoSr: 'No SR',

  // Original text: "A target SR is required to migrate a VDI"
  vdiMigrateNoSrMessage: 'Docelowy SR jest wymagany żeby zmigrować VDI',

  // Original text: "Forget"
  vdiForget: 'Zapomnij',

  // Original text: "Remove VDI"
  vdiRemove: 'Usuń VDI',

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

  // Original text: "Create"
  vbdCreate: 'Utwórz',

  // Original text: "Disk name"
  vbdNamePlaceHolder: 'Nazwa dysku',

  // Original text: "Size"
  vbdSizePlaceHolder: 'Rozmiar',

  // Original text: "Save"
  saveBootOption: 'Zapisz',

  // Original text: "Reset"
  resetBootOption: 'Reset',

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

  // Original text: "Action"
  snapshotAction: 'Akcja',

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

  // Original text: "Memory limits (min/max)"
  vmMemoryLimitsLabel: 'Limity pamięci (min/max)',

  // Original text: "vCPUs max:"
  vmMaxVcpus: 'vCPUs max :',

  // Original text: "Memory max:"
  vmMaxRam: 'Pamięć max :',

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

  // Original text: "RAM Usage"
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

  // Original text: "{running} running ({halted} halted)"
  vmsStates:
    '{running} uruchomiona{halted, plural, one {} other {s}} ({halted} zatrzymana{halted, plural, one {} other {s}})',

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

  // Original text: "Create a new VM on {select1} or {select2}"
  newVmCreateNewVmOn2: 'Stwórz nową VM w  {select1} lub {select2}',

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

  // Original text: "Bootable"
  newVmBootableLabel: 'Bootable',

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

  // Original text: "Are you sure you want to create {nbVms} VMs?"
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

  // Original text: "Advanced"
  newVmAdvancedPanel: 'Zaawansowane',

  // Original text: "Show advanced settings"
  newVmShowAdvanced: 'Pokaż ustawienia zaawansowane',

  // Original text: "Hide advanced settings"
  newVmHideAdvanced: 'Ukryj ustawienia zaawansowane',

  // Original text: "Resource sets"
  resourceSets: 'Resource sets',

  // Original text: "No resource sets."
  noResourceSets: 'No resource sets.',

  // Original text: "Loading resource sets"
  loadingResourceSets: 'Loading resource sets',

  // Original text: "Resource set name"
  resourceSetName: 'Resource set name',

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

  // Original text: "Maximum RAM (GiB)"
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

  // Original text: "VM{nVms, plural, one {} other {s}} to import"
  vmsToImport: 'VM{nVms, plural, one {} other {s}} to import',

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

  // Original text: "Number of CPUs"
  nCpus: undefined,

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

  // Original text: 'Click on a VM to display restore options'
  restoreBackupsInfo: 'Kliknij w VM żeby wyświetlić możliwości odtworzenia',

  // Original text: "Enabled"
  remoteEnabled: 'Włączone',

  // Original text: "Error"
  remoteError: 'Błąd',

  // Original text: "No backup available"
  noBackup: 'Brak dostępnej kopi zapasowej',

  // Original text: "VM Name"
  backupVmNameColumn: 'Nazwa VM',

  // Original text: 'Tags'
  backupTags: 'Tagi',

  // Original text: "Last Backup"
  lastBackupColumn: 'Ostatnia kopia zapasowa',

  // Original text: "Available Backups"
  availableBackupsColumn: 'Dostępne kopie zapasowe',

  // Original text: 'Missing parameters'
  backupRestoreErrorTitle: 'Brakujące parametry',

  // Original text: 'Choose a SR and a backup'
  backupRestoreErrorMessage: 'Wybierz SR i kopię zapasową',

  // Original text: "Display backups"
  displayBackup: 'Wyświetl kopie zapasowe',

  // Original text: "Import VM"
  importBackupTitle: 'Importuj VM',

  // Original text: "Starting your backup import"
  importBackupMessage: 'Rozpoczynanie imortu kopii zapasowej',

  // Original text: "VMs to backup"
  vmsToBackup: 'VMs do kopii zapasowej',

  // Original text: "Emergency shutdown Host{nHosts, plural, one {} other {s}}"
  emergencyShutdownHostsModalTitle: 'Wyłączenie awaryjne hosta {nHosts, plural, one {} other {s}}',

  // Original text: "Are you sure you want to shutdown {nHosts} Host{nHosts, plural, one {} other {s}}?"
  emergencyShutdownHostsModalMessage:
    'Jesteś peweny że chcesz wyłączyć {nHosts} hosta{nHosts, plural, one {} other {s}}?',

  // Original text: "Shutdown host"
  stopHostModalTitle: 'Wyłączenie hosta',

  // Original text: "This will shutdown your host. Do you want to continue? If it's the pool master, your connection to the pool will be lost"
  stopHostModalMessage:
    'To wyłączy twojego hosta. Chcesz kontynuować? Jeżeli jest to zarządca puli, twoje połaczenie do puli zostanie utracone',

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

  // Original text: "Are you sure you want to restart {nHosts} Host{nHosts, plural, one {} other {s}} agent{nHosts, plural, one {} other {s}}?"
  restartHostsAgentsModalMessage:
    "Êtes-vous sûr de vouloir redémarrer les agents {nHosts, plural, one {de l'hôte} other {des hôtes}} ?",

  // Original text: "Restart Host{nHosts, plural, one {} other {s}}"
  restartHostsModalTitle: 'Restart hosta{nHosts, plural, one {} other {s}}',

  // Original text: "Are you sure you want to restart {nHosts} Host{nHosts, plural, one {} other {s}}?"
  restartHostsModalMessage: 'Czy na pewno chcesz zrestartować {nHosts} Host{nHosts, plural, one {} other {s}}?',

  // Original text: "Start VM{vms, plural, one {} other {s}}"
  startVmsModalTitle: 'Uruchom VM{vms, plural, one {} other {s}}',

  // Original text: "Are you sure you want to start {vms} VM{vms, plural, one {} other {s}}?"
  startVmsModalMessage: 'Are you sure you want to start {vms} VM{vms, plural, one {} other {s}}?',

  // Original text: "Stop Host{nHosts, plural, one {} other {s}}"
  stopHostsModalTitle: 'Zatrzymaj hosta{nHosts, plural, one {} other {s}}',

  // Original text: "Are you sure you want to stop {nHosts} Host{nHosts, plural, one {} other {s}}?"
  stopHostsModalMessage: 'Jesteś pewny że chcesz zatrzymać {nHosts} Host{nHosts, plural, one {} other {s}}?',

  // Original text: "Stop VM{vms, plural, one {} other {s}}"
  stopVmsModalTitle: 'Zatrzymaj VM {vms, plural, one {} other {s}}',

  // Original text: "Are you sure you want to stop {vms} VM{vms, plural, one {} other {s}}?"
  stopVmsModalMessage: 'Jesteś pewien że chcesz zatrzymać {vms} VM{vms, plural, one {} other {s}}?',

  // Original text: "Restart VM"
  restartVmModalTitle: 'Restart VM',

  // Original text: "Are you sure you want to restart {name}?"
  restartVmModalMessage: 'Na pewno chcesz zrestartować {name}?',

  // Original text: "Stop VM"
  stopVmModalTitle: 'Zatrzymaj VM',

  // Original text: "Are you sure you want to stop {name}?"
  stopVmModalMessage: 'Na pewno chcesz wyłączyć {name}?',

  // Original text: "Restart VM{vms, plural, one {} other {s}}"
  restartVmsModalTitle: 'Restart VM{vms, plural, one {} other {s}}',

  // Original text: "Are you sure you want to restart {vms} VM{vms, plural, one {} other {s}}?"
  restartVmsModalMessage: 'Are you sure you want to restart {vms} VM{vms, plural, one {} other {s}}?',

  // Original text: "Snapshot VM{vms, plural, one {} other {s}}"
  snapshotVmsModalTitle: 'Snapshot VM{vms, plural, one {} other {s}}',

  // Original text: "Are you sure you want to snapshot {vms} VM{vms, plural, one {} other {s}}?"
  snapshotVmsModalMessage: 'Jesteś pewny że chcesz zrobić snapshot {vms} VM{vms, plural, one {} other {s}}?',

  // Original text: "Delete VM{vms, plural, one {} other {s}}"
  deleteVmsModalTitle: 'Delete VM{vms, plural, one {} other {s}}',

  // Original text: "Are you sure you want to delete {vms} VM{vms, plural, one {} other {s}}? ALL VM DISKS WILL BE REMOVED"
  deleteVmsModalMessage:
    'Are you sure you want to delete {vms} VM{vms, plural, one {} other {s}}? ALL VM DISKS WILL BE REMOVED',

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

  // Original text: "For each VDI, select an SR:"
  migrateVmSelectSrs: 'For each VDI, select an SR:',

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

  // Original text: "Name"
  migrateVmName: 'Nazwa',

  // Original text: "SR"
  migrateVmSr: 'SR',

  // Original text: "VIF"
  migrateVmVif: 'VIF',

  // Original text: "Network"
  migrateVmNetwork: 'Sieć',

  // Original text: "No target host"
  migrateVmNoTargetHost: 'No target host',

  // Original text: "A target host is required to migrate a VM"
  migrateVmNoTargetHostMessage: 'A target host is required to migrate a VM',

  // Original text: "Delete VDI"
  deleteVdiModalTitle: 'Usuń VDI',

  // Original text: "Are you sure you want to delete this disk? ALL DATA ON THIS DISK WILL BE LOST"
  deleteVdiModalMessage: 'Jesteś pewien że chcesz usunąć dysk? Wszystkie dane na dysku zostaną utracone',

  // Original text: "Revert your VM"
  revertVmModalTitle: 'Revert your VM',

  // Original text: "Delete snapshot"
  deleteSnapshotModalTitle: 'Usuń snapshot',

  // Original text: "Are you sure you want to delete this snapshot?"
  deleteSnapshotModalMessage: 'Are you sure you want to delete this snapshot?',

  // Original text: "Are you sure you want to revert this VM to the snapshot state? This operation is irreversible."
  revertVmModalMessage:
    'Are you sure you want to revert this VM to the snapshot state? This operation is irreversible.',

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
  existingSrModalText:
    'This path has been previously used as a Storage by a XenServer host. All data will be lost if you choose to continue the SR creation.',

  // Original text: "Previous LUN Usage"
  existingLunModalTitle: 'Previous LUN Usage',

  // Original text: "This LUN has been previously used as a Storage by a XenServer host. All data will be lost if you choose to continue the SR creation."
  existingLunModalText:
    'This LUN has been previously used as a Storage by a XenServer host. All data will be lost if you choose to continue the SR creation.',

  // Original text: "Replace current registration?"
  alreadyRegisteredModal: 'Replace current registration?',

  // Original text: "Your XO appliance is already registered to {email}, do you want to forget and replace this registration ?"
  alreadyRegisteredModalText:
    'Your XO appliance is already registered to {email}, do you want to forget and replace this registration ?',

  // Original text: "Ready for trial?"
  trialReadyModal: 'Ready for trial?',

  // Original text: "During the trial period, XOA need to have a working internet connection. This limitation does not apply for our paid plans!"
  trialReadyModalText:
    'During the trial period, XOA need to have a working internet connection. This limitation does not apply for our paid plans!',

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

  // Original text: "username"
  serverPlaceHolderUser: 'Użytkownik',

  // Original text: "password"
  serverPlaceHolderPassword: 'hasło',

  // Original text: "address[:port]"
  serverPlaceHolderAddress: 'adres[:port]',

  // Original text: "Connect"
  serverConnect: 'Połącz',

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
  detachHostModalMessage:
    'Are you sure you want to detach {host} from its pool? THIS WILL REMOVE ALL VMs ON ITS LOCAL STORAGE AND REBOOT THE HOST.',

  // Original text: "Detach"
  detachHost: 'Detach',

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

  // Original text: "server"
  xenOrchestraServer: 'serwer',

  // Original text: "web client"
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

  // Original text: "Acces your XO Account"
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

  // Original text: "Update"
  update: 'Aktualizuj',

  // Original text: "Refresh"
  refresh: 'Odśwież',

  // Original text: "Upgrade"
  upgrade: 'Aktualizuj',

  // Original text: "No updater available for Community Edition"
  noUpdaterCommunity: 'No updater available for Community Edition',

  // Original text: "Please consider subscribe and try it with all features for free during 15 days on"
  considerSubscribe: 'Please consider subscribe and try it with all features for free during 15 days on',

  // Original text: "Manual update could break your current installation due to dependencies issues, do it with caution"
  noUpdaterWarning:
    'Manual update could break your current installation due to dependencies issues, do it with caution',

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
  promptUpgradeReloadMessage:
    'Your XOA has successfully upgraded, and your browser must reload the application. Do you want to reload now ?',

  // Original text: "Xen Orchestra from the sources"
  disclaimerTitle: 'Xen Orchestra z źródeł',

  // Original text: "You are using XO from the sources! That's great for a personal/non-profit usage."
  disclaimerText1: 'Używasz XO z źródeł!. To dobre rozwiązanie tylko do prywatnego/nieprodukcyjnego użytku',

  // Original text: "If you are a company, it's better to use it with our appliance + pro support included:"
  disclaimerText2: "If you are a company, it's better to use it with our appliance + pro support included:",

  // Original text: "This version is not bundled with any support nor updates. Use it with caution for critical tasks."
  disclaimerText3: 'This version is not bundled with any support nor updates. Use it with caution.',

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

  // Original text: "Delete all logs"
  logDeleteAll: 'Usuń wszystkie logi',

  // Original text: "Delete all logs"
  logDeleteAllTitle: 'Usuń wszystkie logi',

  // Original text: "Are you sure you want to delete all the logs?"
  logDeleteAllMessage: 'Are you sure you want to delete all the logs?',

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

  // Original text: "Keyboard shortcuts"
  shortcutModalTitle: 'Skróty klawiszowe',

  // Original text: "Global"
  shortcut_XoApp: 'Global',

  // Original text: "Go to hosts list"
  shortcut_GO_TO_HOSTS: 'Idź do listy hostów',

  // Original text: "Go to pools list"
  shortcut_GO_TO_POOLS: 'Idź do listy pul',

  // Original text: "Go to VMs list"
  shortcut_GO_TO_VMS: 'Idź do listy VMs',

  // Original text: "Create a new VM"
  shortcut_CREATE_VM: 'Utwórz nową VM',

  // Original text: "Unfocus field"
  shortcut_UNFOCUS: 'Niepodświetlone pole',

  // Original text: "Show shortcuts key bindings"
  shortcut_HELP: 'Show shortcuts key bindings',

  // Original text: "Home"
  shortcut_Home: 'Home',

  // Original text: "Focus search bar"
  shortcut_SEARCH: 'Focus search bar',

  // Original text: "Next item"
  shortcut_NAV_DOWN: 'Next item',

  // Original text: "Previous item"
  shortcut_NAV_UP: 'Previous item',

  // Original text: "Select item"
  shortcut_SELECT: 'Select item',

  // Original text: "Open"
  shortcut_JUMP_INTO: 'Otwarte',

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
}
