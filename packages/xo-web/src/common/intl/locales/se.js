// See http://momentjs.com/docs/#/use-it/browserify/
import 'moment/locale/se'

import reactIntlData from 'react-intl/locale-data/se'
import { addLocaleData } from 'react-intl'
addLocaleData(reactIntlData)

// ===================================================================

export default {
  // Original text: 'Connecting'
  statusConnecting: 'Ansluter',

  // Original text: 'Disconnected'
  statusDisconnected: 'Bortkopplad',

  // Original text: 'Loading…'
  statusLoading: 'Laddar…',

  // Original text: 'Page not found'
  errorPageNotFound: 'Sida hittas ej' ,

  // Original text: 'no such item'
  errorNoSuchItem: 'Inget sådant objekt',

  // Original text: "Long click to edit"
  editableLongClickPlaceholder: 'Långklicka för att redigera',

  // Original text: "Click to edit"
  editableClickPlaceholder: 'Klicka för att redigera',

  // Original text: 'Browse files'
  browseFiles: 'Utforska filer',

  // Original text: "OK"
  alertOk: 'OK',

  // Original text: "OK"
  confirmOk: 'OK',

  // Original text: "Cancel"
  genericCancel: 'Avbryt',

  // Original text: 'On error'
  onError: 'På error',

  // Original text: 'Successful'
  successful: 'Lyckades',

  // Original text: 'Managed disks'
  filterOnlyManaged: 'Hanterade diskar',

  // Original text: 'Orphaned disks'
  filterOnlyOrphaned: 'Föräldralösa diskar',

  // Original text: 'Normal disks'
  filterOnlyRegular: 'Normala diskar',

  // Original text: 'Snapshot disks'
  filterOnlySnapshots: 'Snapshotdiskar',

  // Original text: 'Unmanaged disks'
  filterOnlyUnmanaged: 'Ohanterade diskar',

  // Original text: 'Copy to clipboard'
  copyToClipboard: 'Kopiera till urklipp',

  // Original text: 'Master'
  pillMaster: 'Master',

  // Original text: "Home"
  homePage: 'Hem',

  // Original text: 'VMs'
  homeVmPage: undefined,

  // Original text: 'Hosts'
  homeHostPage: 'Värdar',

  // Original text: 'Pools'
  homePoolPage: 'Pooler',

  // Original text: 'Templates'
  homeTemplatePage: 'Mallar',

  // Original text: 'Storages'
  homeSrPage: 'Lagringar',

  // Original text: "Dashboard"
  dashboardPage: undefined,

  // Original text: "Overview"
  overviewDashboardPage: 'Överblick',

  // Original text: "Visualizations"
  overviewVisualizationDashboardPage: 'Visualisera',

  // Original text: "Statistics"
  overviewStatsDashboardPage: 'Statistik',

  // Original text: "Health"
  overviewHealthDashboardPage: 'Hälsa',

  // Original text: "Self service"
  selfServicePage: 'Självservice',

  // Original text: "Backup"
  backupPage: 'Backup',

  // Original text: "Jobs"
  jobsPage: 'Jobb',

  // Original text: "Updates"
  updatePage: 'Uppdateringar',

  // Original text: "Settings"
  settingsPage: 'Inställningar',

  // Original text: "Servers"
  settingsServersPage: 'Servers',

  // Original text: "Users"
  settingsUsersPage: 'Användare',

  // Original text: "Groups"
  settingsGroupsPage: 'Grupper',

  // Original text: "ACLs"
  settingsAclsPage: undefined,

  // Original text: "Plugins"
  settingsPluginsPage: 'Plugin',

  // Original text: 'Logs'
  settingsLogsPage: 'Loggar',

  // Original text: 'IPs'
  settingsIpsPage: undefined,

  // Original text: "About"
  aboutPage: 'Om',

  // Original text: 'About XO {xoaPlan}'
  aboutXoaPlan: undefined,

  // Original text: "New"
  newMenu: 'Ny',

  // Original text: "Tasks"
  taskMenu: 'Uppgifter',

  // Original text: 'Tasks'
  taskPage: 'Uppgifter',

  // Original text: "VM"
  newVmPage: 'VM',

  // Original text: "Storage"
  newSrPage: 'Lagring',

  // Original text: "Server"
  newServerPage: 'Server',

  // Original text: "Import"
  newImport: 'Import',

  // Original text: 'XOSAN'
  xosan: undefined,

  // Original text: "Overview"
  backupOverviewPage: 'Överblick',

  // Original text: "New"
  backupNewPage: 'Ny',

  // Original text: "Remotes"
  backupRemotesPage: undefined,

  // Original text: "Restore"
  backupRestorePage: 'Återställ',

  // Original text: 'File restore'
  backupFileRestorePage: 'Filåterställning',

  // Original text: "Schedule"
  schedule: 'Schema',

  // Original text: "New VM backup"
  newVmBackup: 'Ny VM-backup',

  // Original text: "Edit VM backup"
  editVmBackup: 'Redigera VM-backup',

  // Original text: "Backup"
  backup: 'Backup',

  // Original text: "Rolling Snapshot"
  rollingSnapshot: 'Rullande Snapshots',

  // Original text: "Delta Backup"
  deltaBackup: undefined,

  // Original text: "Disaster Recovery"
  disasterRecovery: undefined,

  // Original text: "Continuous Replication"
  continuousReplication: 'Pågående replikering',

  // Original text: "Overview"
  jobsOverviewPage: 'Överblick',

  // Original text: "New"
  jobsNewPage: 'Ny',

  // Original text: "Scheduling"
  jobsSchedulingPage: 'Schemaläggnig',

  // Original text: "Custom Job"
  customJob: 'Anpassad uppgift',

  // Original text: 'User'
  userPage: undefined,

  // Original text: 'No support'
  noSupport: 'Ingen support',

  // Original text: 'Free upgrade!'
  freeUpgrade: 'Gratis uppgradering',

  // Original text: "Sign out"
  signOut: 'Logga ut',

  // Original text: 'Edit my settings {username}'
  editUserProfile: 'Ändra mina inställningar {username}',

  // Original text: "Fetching data…"
  homeFetchingData: 'Hämtar data…',

  // Original text: "Welcome on Xen Orchestra!"
  homeWelcome: 'Välkommen till Xen Orchestra!',

  // Original text: "Add your XCP-ng hosts or pools"
  homeWelcomeText: 'Lägg till dina XCP-ng värdar eller pooler',

  // Original text: 'Some XCP-ng hosts have been registered but are not connected'
  homeConnectServerText: 'Några XCP-ng värdar har registrerats men är inte anslutna',

  // Original text: "Want some help?"
  homeHelp: 'Önskas hjälp?',

  // Original text: "Add server"
  homeAddServer: 'Lägg till server',

  // Original text: 'Connect servers'
  homeConnectServer: 'Anslut servrar',

  // Original text: "Online Doc"
  homeOnlineDoc: 'Online dokumentation',

  // Original text: "Pro Support"
  homeProSupport: undefined,

  // Original text: "There are no VMs!"
  homeNoVms: 'Det finns inga VMs!',

  // Original text: "Or…"
  homeNoVmsOr: 'Eller…',

  // Original text: "Import VM"
  homeImportVm: 'Importera VM',

  // Original text: "Import an existing VM in xva format"
  homeImportVmMessage: 'Importera en existerande VM i xva-format',

  // Original text: "Restore a backup"
  homeRestoreBackup: 'Återställ en backup',

  // Original text: "Restore a backup from a remote store"
  homeRestoreBackupMessage: 'Återställ en backup från en fjärrlagring',

  // Original text: "This will create a new VM"
  homeNewVmMessage: 'Detta kommer skapa en ny VM',

  // Original text: "Filters"
  homeFilters: 'Filter',

  // Original text: 'No results! Click here to reset your filters'
  homeNoMatches: 'Inga resultat! Klicka här för att återställa dina filter',

  // Original text: "Pool"
  homeTypePool: 'Pool',

  // Original text: "Host"
  homeTypeHost: 'Värd',

  // Original text: "VM"
  homeTypeVm: 'VM',

  // Original text: "SR"
  homeTypeSr: 'SR',

  // Original text: 'Template'
  homeTypeVmTemplate: 'Mall',

  // Original text: "Sort"
  homeSort: 'Sortera',

  // Original text: "Pools"
  homeAllPools: 'Pooler',

  // Original text: "Hosts"
  homeAllHosts: 'Värdar',

  // Original text: "Tags"
  homeAllTags: 'Etiketter',

  // Original text: "New VM"
  homeNewVm: 'Ny VM',

  // Original text: 'None'
  homeFilterNone: 'Inga',

  // Original text: "Running hosts"
  homeFilterRunningHosts: 'Aktiva värdar',

  // Original text: "Disabled hosts"
  homeFilterDisabledHosts: 'Inaktiverade värdar',

  // Original text: "Running VMs"
  homeFilterRunningVms: 'Körande VMs',

  // Original text: "Non running VMs"
  homeFilterNonRunningVms: 'Icke-körande VMs',

  // Original text: "Pending VMs"
  homeFilterPendingVms: 'Väntande VMs',

  // Original text: "HVM guests"
  homeFilterHvmGuests: undefined,

  // Original text: "Tags"
  homeFilterTags: 'Etiketter',

  // Original text: "Sort by"
  homeSortBy: 'Sortera enligt',

  // Original text: "Name"
  homeSortByName: 'Namn',

  // Original text: "Power state"
  homeSortByPowerstate: 'Körande status',

  // Original text: "RAM"
  homeSortByRAM: undefined,

  // Original text: "vCPUs"
  homeSortByvCPUs: undefined,

  // Original text: 'CPUs'
  homeSortByCpus: undefined,

  // Original text: 'Shared/Not shared'
  homeSortByShared: 'Delat/Icke delat',

  // Original text: 'Size'
  homeSortBySize: 'Storlek',

  // Original text: 'Usage'
  homeSortByUsage: 'Användning',

  // Original text: 'Type'
  homeSortByType: 'Typ',

  // Original text: "{displayed, number}x {icon} (on {total, number})"
  homeDisplayedItems: '{displayed, number}x {icon} (av {total, number})',

  // Original text: "{selected, number}x {icon} selected (on {total, number})"
  homeSelectedItems: '{selected, number}x {icon} valda (av {total, number})',

  // Original text: "More"
  homeMore: 'Mer',

  // Original text: "Migrate to…"
  homeMigrateTo: 'Migrera till…',

  // Original text: 'Missing patches'
  homeMissingPatches: 'Saknar uppdateringar',

  // Original text: 'Master:'
  homePoolMaster: undefined,

  // Original text: 'Resource set: {resourceSet}'
  homeResourceSet: undefined,

  // Original text: 'High Availability'
  highAvailability: undefined,

  // Original text: 'Shared {type}'
  srSharedType: 'Delad',

  // Original text: 'Not shared {type}'
  srNotSharedType: 'Ej delad',

  // Original text: "Add"
  add: 'Lägg till',

  // Original text: 'Select all'
  selectAll: 'Välj allt',

  // Original text: "Remove"
  remove: 'Ta bort',

  // Original text: "Preview"
  preview: 'Förandsvisa',

  // Original text: "Item"
  item: 'Föremål',

  // Original text: "No selected value"
  noSelectedValue: 'Inget valt värde',

  // Original text: "Choose user(s) and/or group(s)"
  selectSubjects: 'Välj användare och/eller grupp(er)',

  // Original text: "Select Object(s)…"
  selectObjects: 'Välj object…',

  // Original text: "Choose a role"
  selectRole: 'Välj en roll',

  // Original text: "Select Host(s)…"
  selectHosts: 'Välj värd(ar)…',

  // Original text: "Select object(s)…"
  selectHostsVms: 'Välj object…',

  // Original text: "Select Network(s)…"
  selectNetworks: 'Välj nätverk…',

  // Original text: "Select PIF(s)…"
  selectPifs: 'Välj PIF(s)…',

  // Original text: "Select Pool(s)…"
  selectPools: 'Välj Pool(er)…',

  // Original text: "Select Remote(s)…"
  selectRemotes: 'Välj fjärrlagring(ar)…',

  // Original text: 'Select resource set(s)…'
  selectResourceSets: undefined,

  // Original text: 'Select template(s)…'
  selectResourceSetsVmTemplate: undefined,

  // Original text: 'Select SR(s)…'
  selectResourceSetsSr: undefined,

  // Original text: 'Select network(s)…'
  selectResourceSetsNetwork: undefined,

  // Original text: 'Select disk(s)…'
  selectResourceSetsVdi: undefined,

  // Original text: 'Select SSH key(s)…'
  selectSshKey: 'Välj SSH nycklar',

  // Original text: "Select SR(s)…"
  selectSrs: 'Välj SR(s)…',

  // Original text: "Select VM(s)…"
  selectVms: 'Välj VM(s)…',

  // Original text: "Select VM template(s)…"
  selectVmTemplates: 'Välj VM mall(ar)…',

  // Original text: "Select tag(s)…"
  selectTags: 'Välj etikett(er)…',

  // Original text: "Select disk(s)…"
  selectVdis: 'Välj disk(ar)…',

  // Original text: 'Select timezone…'
  selectTimezone: 'Välj tidzon',

  // Original text: 'Select IP(s)…'
  selectIp: 'Välj IP-adress(er)',

  // Original text: 'Select IP pool(s)…'
  selectIpPool: undefined,

  // Original text: "Fill required informations."
  fillRequiredInformations: 'Fyll i den behövda informationen',

  // Original text: "Fill informations (optional)"
  fillOptionalInformations: 'Fyll i informationen (valfritt)',

  // Original text: "Reset"
  selectTableReset: undefined,

  // Original text: "Month"
  schedulingMonth: 'Månad',

  // Original text: 'Every N month'
  schedulingEveryNMonth: 'Varje N månad',

  // Original text: "Each selected month"
  schedulingEachSelectedMonth: 'Varje vald månad',

  // Original text: 'Day'
  schedulingDay: 'Dag',

  // Original text: 'Every N day'
  schedulingEveryNDay: 'Varje N dag',

  // Original text: "Each selected day"
  schedulingEachSelectedDay: 'Varje vald dag',

  // Original text: 'Switch to week days'
  schedulingSetWeekDayMode: 'Byt till veckodagar',

  // Original text: 'Switch to month days'
  schedulingSetMonthDayMode: 'Byt till månadsdagar',

  // Original text: "Hour"
  schedulingHour: 'Timme',

  // Original text: "Each selected hour"
  schedulingEachSelectedHour: 'Varje vald timme',

  // Original text: "Every N hour"
  schedulingEveryNHour: 'Varje N timme',

  // Original text: "Minute"
  schedulingMinute: 'Minut',

  // Original text: "Each selected minute"
  schedulingEachSelectedMinute: 'Varje vald minut',

  // Original text: "Every N minute"
  schedulingEveryNMinute: 'Varje N minut',

  // Original text: 'Every month'
  selectTableAllMonth: 'Varje månad',

  // Original text: 'Every day'
  selectTableAllDay: 'Varje dag',

  // Original text: 'Every hour'
  selectTableAllHour: 'Varje timme',

  // Original text: 'Every minute'
  selectTableAllMinute: 'Varje minut',

  // Original text: "Reset"
  schedulingReset: undefined,

  // Original text: "Unknown"
  unknownSchedule: 'Okänt',

  // Original text: 'Web browser timezone'
  timezonePickerUseLocalTime: 'Webbläsar-tidzon',

  // Original text: 'Server timezone ({value})'
  serverTimezoneOption: 'Server tidzon ({värde})',

  // Original text: 'Cron Pattern:'
  cronPattern: 'Cron mönster',

  // Original text: "Cannot edit backup"
  backupEditNotFoundTitle: 'Kan inte redigera backup',

  // Original text: "Missing required info for edition"
  backupEditNotFoundMessage: 'Nödvändig information saknas',

  // Original text: 'Successful'
  successfulJobCall: 'Lyckat',

  // Original text: 'Failed'
  failedJobCall: 'Misslyckat',

  // Original text: 'In progress'
  jobCallInProgess: 'Pågående',

  // Original text: 'size:'
  jobTransferredDataSize: 'Storlek',

  // Original text: 'speed:'
  jobTransferredDataSpeed: 'Hastighet',

  // Original text: "Job"
  job: 'Arbete',

  // Original text: 'Job {job}'
  jobModalTitle: 'Arbete {job}',

  // Original text: "ID"
  jobId: 'ID',

  // Original text: 'Type'
  jobType: 'Typ',

  // Original text: "Name"
  jobName: 'Namn',

  // Original text: 'Name of your job (forbidden: "_")'
  jobNamePlaceholder: undefined,

  // Original text: "Start"
  jobStart: 'Start',

  // Original text: "End"
  jobEnd: 'Slut',

  // Original text: "Duration"
  jobDuration: 'Varaktighet',

  // Original text: "Status"
  jobStatus: undefined,

  // Original text: "Action"
  jobAction: 'Åtgärd',

  // Original text: "Tag"
  jobTag: 'Etikett',

  // Original text: "Scheduling"
  jobScheduling: 'Schemaläggning',

  // Original text: "State"
  jobState: 'Status',

  // Original text: 'Enabled'
  jobStateEnabled: 'Aktiverad',

  // Original text: 'Disabled'
  jobStateDisabled: 'Inaktiverad',

  // Original text: 'Timezone'
  jobTimezone: 'Tidzon',

  // Original text: 'Server'
  jobServerTimezone: undefined,

  // Original text: "Run job"
  runJob: 'Kör arbete',

  // Original text: "One shot running started. See overview for logs."
  runJobVerbose: undefined,

  // Original text: "Started"
  jobStarted: 'Startad',

  // Original text: "Finished"
  jobFinished: 'Färdig',

  // Original text: "Save"
  saveBackupJob: 'Sparad',

  // Original text: "Remove backup job"
  deleteBackupSchedule: 'Radera backup-uppgift',

  // Original text: "Are you sure you want to delete this backup job?"
  deleteBackupScheduleQuestion: 'Är du säker att du vill radera denna backup-uppgift?',

  // Original text: "Enable immediately after creation"
  scheduleEnableAfterCreation: 'Aktivera omedelbart efter skapande',

  // Original text: "You are editing Schedule {name} ({id}). Saving will override previous schedule state."
  scheduleEditMessage: 'Du redigerar Schema {name} ({id}). Sparande kommer skriva över föregående schema-status',

  // Original text: "You are editing job {name} ({id}). Saving will override previous job state."
  jobEditMessage: 'Du redigerar Uppgift {name} ({id}). Sparande kommer skriva över föregående uppgift-status',

  // Original text: "No scheduled jobs."
  noScheduledJobs: 'Inga schemalagda uppgifter',

  // Original text: "No jobs found."
  noJobs: 'Inga uppgifter funna',

  // Original text: "No schedules found"
  noSchedules: 'Inga scheman funna',

  // Original text: "Select a xo-server API command"
  jobActionPlaceHolder: 'Välj ett xo-server API-kommando',

  // Original text: ' Timeout (number of seconds after which a VM is considered failed)'
  jobTimeoutPlaceHolder: undefined,

  // Original text: 'Schedules'
  jobSchedules: 'Scheman',

  // Original text: 'Name of your schedule'
  jobScheduleNamePlaceHolder: 'Schemanamn',

  // Original text: 'Select a Job'
  jobScheduleJobPlaceHolder: 'Välj en uppgift',

  // Original text: 'Job owner'
  jobOwnerPlaceholder: 'Uppgiftsägare',

  // Original text: "This job's creator no longer exists"
  jobUserNotFound: 'Denna uppgiftens skapare existerar inte längre',

  // Original text: "This backup's creator no longer exists"
  backupUserNotFound: 'Denna backupens skapare existerar inte längre',

  // Original text: 'Backup owner'
  backupOwner: 'Backupägare',

  // Original text: "Select your backup type:"
  newBackupSelection: 'Välj din backup-typ',

  // Original text: 'Select backup mode:'
  smartBackupModeSelection: 'Välj backupvariant',

  // Original text: 'Normal backup'
  normalBackup: undefined,

  // Original text: 'Smart backup'
  smartBackup: undefined,

  // Original text: 'Local remote selected'
  localRemoteWarningTitle: undefined,

  // Original text: 'Warning: local remotes will use limited XOA disk space. Only for advanced users.'
  localRemoteWarningMessage: undefined,

  // Original text: 'Warning: this feature works only with XenServer 6.5 or newer.'
  backupVersionWarning: 'Varning: Denna funktion fungerar endast med XenServer 6.5 eller nyare.',

  // Original text: 'VMs'
  editBackupVmsTitle: 'VMs',

  // Original text: 'VMs statuses'
  editBackupSmartStatusTitle: 'VMs statusar',

  // Original text: 'Resident on'
  editBackupSmartResidentOn: 'Befinner sig på',

  // Original text: 'Pools'
  editBackupSmartPools: 'Pooler',

  // Original text: 'Tags'
  editBackupSmartTags: 'Etiketter',

  // Original text: 'VMs Tags'
  editBackupSmartTagsTitle: 'VMs etiketter',

  // Original text: 'Reverse'
  editBackupNot: 'Ångra',

  // Original text: 'Tag'
  editBackupTagTitle: 'Etikett',

  // Original text: 'Report'
  editBackupReportTitle: 'Rapport',

  // Original text: 'Automatically run as scheduled'
  editBackupScheduleEnabled: 'Automatiskt kör enligt schema',

  // Original text: 'Depth'
  editBackupDepthTitle: 'Djup',

  // Original text: 'Remote'
  editBackupRemoteTitle: 'Fjärr',

  // Original text: 'Delete the old backups first'
  deleteOldBackupsFirst: 'Radera dom gamla backuperna först',

  // Original text: "Remote stores for backup"
  remoteList: 'Fjärrlagring för backup',

  // Original text: "New File System Remote"
  newRemote: 'Ny fjärrlagning',

  // Original text: "Local"
  remoteTypeLocal: 'Lokalt',

  // Original text: "NFS"
  remoteTypeNfs: 'NFS',

  // Original text: "SMB"
  remoteTypeSmb: 'Samba',

  // Original text: "Type"
  remoteType: 'Typ',

  // Original text: 'Test your remote'
  remoteTestTip: 'Testa din fjärrlagring',

  // Original text: 'Test Remote'
  testRemote: 'Testa fjärrlagring',

  // Original text: 'Test failed for {name}'
  remoteTestFailure: 'Test misslyckades för {name}',

  // Original text: 'Test passed for {name}'
  remoteTestSuccess: 'Test lyckades för {name}',

  // Original text: 'Error'
  remoteTestError: undefined,

  // Original text: 'Test Step'
  remoteTestStep: undefined,

  // Original text: 'Test file'
  remoteTestFile: undefined,

  // Original text: 'Test name'
  remoteTestName: undefined,

  // Original text: 'Remote name already exists!'
  remoteTestNameFailure: 'Fjärrlagrinsnamn existerar redan',

  // Original text: 'The remote appears to work correctly'
  remoteTestSuccessMessage: 'Fjärrlagringen verkar fungera korrekt',

  // Original text: 'Connection failed'
  remoteConnectionFailed: 'Anslutning misslyckades',

  // Original text: 'Name'
  remoteName: 'Namn',

  // Original text: 'Path'
  remotePath: 'Sökväg',

  // Original text: 'State'
  remoteState: 'Status',

  // Original text: 'Device'
  remoteDevice: 'Enhet',

  // Original text: 'Share'
  remoteShare: 'Dela',

  // Original text: 'Action'
  remoteAction: 'Åtgärd',

  // Original text: 'Auth'
  remoteAuth: undefined,

  // Original text: 'Mounted'
  remoteMounted: 'Monterad',

  // Original text: 'Unmounted'
  remoteUnmounted: 'Avmonterad',

  // Original text: 'Connect'
  remoteConnectTip: 'Anslut',

  // Original text: 'Disconnect'
  remoteDisconnectTip: 'Koppla ifrån',

  // Original text: 'Connected'
  remoteConnected: 'Ansluten',

  // Original text: 'Disconnected'
  remoteDisconnected: 'Bortkopplad',

  // Original text: 'Delete'
  remoteDeleteTip: 'Radera',

  // Original text: 'remote name *'
  remoteNamePlaceHolder: 'fjärrlagringsnamn *',

  // Original text: 'Name *'
  remoteMyNamePlaceHolder: 'Namn *',

  // Original text: '/path/to/backup'
  remoteLocalPlaceHolderPath: undefined,

  // Original text: 'host *'
  remoteNfsPlaceHolderHost: 'värd *',

  // Original text: 'path/to/backup'
  remoteNfsPlaceHolderPath: undefined,

  // Original text: 'subfolder [path\\to\\backup]'
  remoteSmbPlaceHolderRemotePath: 'undermapp [path\\to\\backup]',

  // Original text: 'Username'
  remoteSmbPlaceHolderUsername: 'Användarnamn',

  // Original text: 'Password'
  remoteSmbPlaceHolderPassword: 'Lösenord',

  // Original text: 'Domain'
  remoteSmbPlaceHolderDomain: 'Domän',

  // Original text: '<address>\\<share> *'
  remoteSmbPlaceHolderAddressShare: undefined,

  // Original text: 'password(fill to edit)'
  remotePlaceHolderPassword: 'lösenord(fill to edit)',

  // Original text: 'Create a new SR'
  newSrTitle: 'Skapa ny SR',

  // Original text: "General"
  newSrGeneral: 'Generell',

  // Original text: "Select Storage Type:"
  newSrTypeSelection: 'Välj lagringstyp',

  // Original text: "Settings"
  newSrSettings: 'Inställningar',

  // Original text: "Storage Usage"
  newSrUsage: 'Lagringsanvändning',

  // Original text: "Summary"
  newSrSummary: 'Sammanfattning',

  // Original text: "Host"
  newSrHost: 'Värd',

  // Original text: "Type"
  newSrType: 'Typ',

  // Original text: "Name"
  newSrName: 'Namn',

  // Original text: "Description"
  newSrDescription: 'Beskrivning',

  // Original text: "Server"
  newSrServer: 'Server',

  // Original text: "Path"
  newSrPath: 'Sökväg',

  // Original text: "IQN"
  newSrIqn: 'IQN',

  // Original text: "LUN"
  newSrLun: 'LUN',

  // Original text: "with auth."
  newSrAuth: 'med autentisering',

  // Original text: "User Name"
  newSrUsername: 'Användarnamn',

  // Original text: "Password"
  newSrPassword: 'Lösenord',

  // Original text: "Device"
  newSrDevice: 'Enhet',

  // Original text: "in use"
  newSrInUse: 'används',

  // Original text: "Size"
  newSrSize: 'Storlek',

  // Original text: "Create"
  newSrCreate: 'Skapa',

  // Original text: 'Storage name'
  newSrNamePlaceHolder: 'Lagringsnamn',

  // Original text: 'Storage description'
  newSrDescPlaceHolder: 'Lagringsbeskrivning',

  // Original text: 'Address'
  newSrAddressPlaceHolder: 'Adress',

  // Original text: '[port]'
  newSrPortPlaceHolder: undefined,

  // Original text: 'Username'
  newSrUsernamePlaceHolder: 'Användarnamn',

  // Original text: 'Password'
  newSrPasswordPlaceHolder: 'Lösenord',

  // Original text: 'Device, e.g /dev/sda…'
  newSrLvmDevicePlaceHolder: 'Enhet, t.ex. /dev/sda…',

  // Original text: '/path/to/directory'
  newSrLocalPathPlaceHolder: undefined,

  // Original text: "Users/Groups"
  subjectName: 'Användare/Gruppoer',

  // Original text: "Object"
  objectName: 'Objekt',

  // Original text: 'No acls found'
  aclNoneFound: 'Inga acls funna',

  // Original text: "Role"
  roleName: 'Roll',

  // Original text: 'Create'
  aclCreate: 'Skapa',

  // Original text: "New Group Name"
  newGroupName: 'Nytt gruppnamn',

  // Original text: "Create Group"
  createGroup: 'Skapa grupp',

  // Original text: "Create"
  createGroupButton: 'Skapa',

  // Original text: "Delete Group"
  deleteGroup: 'Radera grupp',

  // Original text: "Are you sure you want to delete this group?"
  deleteGroupConfirm: 'Är du säker att du vill radera denna gruppen?',

  // Original text: "Remove user from Group"
  removeUserFromGroup: 'Ta bort användare från grupp',

  // Original text: "Are you sure you want to delete this user?"
  deleteUserConfirm: 'Är du säker du vill radera denna användaren?',

  // Original text: "Delete User"
  deleteUser: 'Radera användare',

  // Original text: 'no user'
  noUser: 'ingen användare',

  // Original text: "unknown user"
  unknownUser: 'okänd användare',

  // Original text: "No group found"
  noGroupFound: 'Ingen grupp funnen',

  // Original text: "Name"
  groupNameColumn: 'Namn',

  // Original text: "Users"
  groupUsersColumn: 'Användare',

  // Original text: "Add User"
  addUserToGroupColumn: 'Lägg till användare',

  // Original text: "Email"
  userNameColumn: 'E-post',

  // Original text: "Permissions"
  userPermissionColumn: 'Rättigheter',

  // Original text: "Password"
  userPasswordColumn: 'Lösenord',

  // Original text: "Email"
  userName: 'E-post',

  // Original text: "Password"
  userPassword: 'Lösenord',

  // Original text: "Create"
  createUserButton: 'Skapa',

  // Original text: "No user found"
  noUserFound: 'Ingen användare funnen',

  // Original text: "User"
  userLabel: 'Användare',

  // Original text: "Admin"
  adminLabel: 'Admin',

  // Original text: "No user in group"
  noUserInGroup: 'Ingen användare i gruppen',

  // Original text: "{users, number} user{users, plural, one {} other {s}}"
  countUsers: '{users, number} user{users, plural, one {} other {s}}',

  // Original text: "Select Permission"
  selectPermission: 'Välj rättighet',

  // Original text: 'No plugins found'
  noPlugins: 'Inga plugins funna',

  // Original text: "Auto-load at server start"
  autoloadPlugin: 'Ladda in automatiskt vid serverstart',

  // Original text: "Save configuration"
  savePluginConfiguration: 'Spara konfiguration',

  // Original text: "Delete configuration"
  deletePluginConfiguration: 'Radera konfiguration',

  // Original text: "Plugin error"
  pluginError: undefined,

  // Original text: "Unknown error"
  unknownPluginError: 'Okänt fel',

  // Original text: "Purge plugin configuration"
  purgePluginConfiguration: 'Nollställ pluginkonfiguration',

  // Original text: "Are you sure you want to purge this configuration ?"
  purgePluginConfigurationQuestion: 'Är du säker du vill nollställa denn konfigurationen?',

  // Original text: "Edit"
  editPluginConfiguration: 'Redigera',

  // Original text: "Cancel"
  cancelPluginEdition: 'Avbryt',

  // Original text: "Plugin configuration"
  pluginConfigurationSuccess: 'Pluginkonfiguration',

  // Original text: "Plugin configuration successfully saved!"
  pluginConfigurationChanges: 'Pluginkonfiguration sparades framgångsrikt',

  // Original text: 'Predefined configuration'
  pluginConfigurationPresetTitle: 'Förinställnd konfiguration',

  // Original text: 'Choose a predefined configuration.'
  pluginConfigurationChoosePreset: 'Välj en förinställd konfiguration',

  // Original text: 'Apply'
  applyPluginPreset: 'Applicera',

  // Original text: 'Save filter error'
  saveNewUserFilterErrorTitle: 'Spara filterfel',

  // Original text: 'Bad parameter: name must be given.'
  saveNewUserFilterErrorBody: 'Felaktig parameter: namne måste anges',

  // Original text: 'Name:'
  filterName: 'Namn',

  // Original text: 'Value:'
  filterValue: 'Värde',

  // Original text: 'Save new filter'
  saveNewFilterTitle: 'Spara mitt filter',

  // Original text: 'Set custom filters'
  setUserFiltersTitle: 'Sätt anpassat filter',

  // Original text: 'Are you sure you want to set custom filters?'
  setUserFiltersBody: 'Är du säker att du vill sätta ett anpassat filter?',

  // Original text: 'Remove custom filter'
  removeUserFilterTitle: 'Ta bort anpassat filter',

  // Original text: 'Are you sure you want to remove custom filter?'
  removeUserFilterBody: 'Är du säker du vill ta bort ett anpassat filter?',

  // Original text: 'Default filter'
  defaultFilter: 'Standardfilter',

  // Original text: 'Default filters'
  defaultFilters: 'Standardfilter',

  // Original text: 'Custom filters'
  customFilters: 'Anpassade filter',

  // Original text: 'Customize filters'
  customizeFilters: 'Anpassa filter',

  // Original text: 'Save custom filters'
  saveCustomFilters: 'Spara anpassade filter',

  // Original text: "Start"
  startVmLabel: 'Starta',

  // Original text: "Recovery start"
  recoveryModeLabel: 'Återhämtningsstart',

  // Original text: "Suspend"
  suspendVmLabel: 'Pausad',

  // Original text: "Stop"
  stopVmLabel: 'Stopp',

  // Original text: "Force shutdown"
  forceShutdownVmLabel: 'Tvinga avstängning',

  // Original text: "Reboot"
  rebootVmLabel: 'Starta om',

  // Original text: "Force reboot"
  forceRebootVmLabel: 'Tvinga omstart',

  // Original text: "Delete"
  deleteVmLabel: 'Radera',

  // Original text: "Migrate"
  migrateVmLabel: 'Migrera',

  // Original text: "Snapshot"
  snapshotVmLabel: 'Snapshot',

  // Original text: "Export"
  exportVmLabel: 'Exportera',

  // Original text: "Resume"
  resumeVmLabel: 'Återuppta',

  // Original text: "Copy"
  copyVmLabel: 'Kopiera',

  // Original text: "Clone"
  cloneVmLabel: 'Klona',

  // Original text: "Fast clone"
  fastCloneVmLabel: 'Snabbklona',

  // Original text: "Convert to template"
  convertVmToTemplateLabel: 'Konvertera till en mall',

  // Original text: "Console"
  vmConsoleLabel: 'Konsol',

  // Original text: "Rescan all disks"
  srRescan: 'Återscanna alla diskar',

  // Original text: "Connect to all hosts"
  srReconnectAll: 'Anslut till alla värdar',

  // Original text: "Disconnect from all hosts"
  srDisconnectAll: 'Koppla bort från alla värdar',

  // Original text: "Forget this SR"
  srForget: 'Glöm denna SR',

  // Original text: 'Forget SRs'
  srsForget: 'Glöm SRs',

  // Original text: "Remove this SR"
  srRemoveButton: 'Radera denna SR',

  // Original text: "No VDIs in this storage"
  srNoVdis: 'Denna lagringen saknar VDIs',

  // Original text: 'Pool RAM usage:'
  poolTitleRamUsage: 'Användning Pool RAM',

  // Original text: '{used} used on {total}'
  poolRamUsage: undefined,

  // Original text: 'Master:'
  poolMaster: undefined,

  // Original text: 'Display all hosts of this pool'
  displayAllHosts: 'Visa alla värdar i denna pool',

  // Original text: 'Display all storages of this pool'
  displayAllStorages: 'Visa alla lagringar i denna pool',

  // Original text: 'Display all VMs of this pool'
  displayAllVMs: 'Visa alla VMs i denna pool',

  // Original text: "Hosts"
  hostsTabName: 'Värdar',

  // Original text: 'Vms'
  vmsTabName: undefined,

  // Original text: 'Srs'
  srsTabName: undefined,

  // Original text: "High Availability"
  poolHaStatus: undefined,

  // Original text: "Enabled"
  poolHaEnabled: 'Aktiverad',

  // Original text: "Disabled"
  poolHaDisabled: 'Inaktiverad',

  // Original text: "Name"
  hostNameLabel: 'Namn',

  // Original text: "Description"
  hostDescription: 'Beskrivning',

  // Original text: "Memory"
  hostMemory: 'Minne',

  // Original text: "No hosts"
  noHost: 'Inga värdar',

  // Original text: '{used}% used ({free} free)'
  memoryLeftTooltip: undefined,

  // Original text: 'PIF'
  pif: undefined,

  // Original text: "Name"
  poolNetworkNameLabel: 'Namn',

  // Original text: "Description"
  poolNetworkDescription: 'Beskrivning',

  // Original text: "PIFs"
  poolNetworkPif: 'PIFs',

  // Original text: "No networks"
  poolNoNetwork: 'Inga nätverk',

  // Original text: "MTU"
  poolNetworkMTU: 'MTU',

  // Original text: "Connected"
  poolNetworkPifAttached: 'Ansluten',

  // Original text: "Disconnected"
  poolNetworkPifDetached: 'Bortkopplad',

  // Original text: 'Show PIFs'
  showPifs: undefined,

  // Original text: 'Hide PIFs'
  hidePifs: undefined,

  // Original text: 'Show details'
  showDetails: undefined,

  // Original text: 'Hide details'
  hideDetails: undefined,

  // Original text: 'No stats'
  poolNoStats: undefined,

  // Original text: 'All hosts'
  poolAllHosts: undefined,

  // Original text: "Add SR"
  addSrLabel: 'Lägg till SR',

  // Original text: "Add VM"
  addVmLabel: 'Lägg till VM',

  // Original text: "Add Host"
  addHostLabel: 'Lägg till host',

  // Original text: 'This host needs to install {patches, number} patch{patches, plural, one {} other {es}} before it can be added to the pool. This operation may be long.'
  hostNeedsPatchUpdate: undefined,

  // Original text: "This host cannot be added to the pool because it's missing some patches."
  hostNeedsPatchUpdateNoInstall: undefined,

  // Original text: 'Adding host failed'
  addHostErrorTitle: 'Lägga till värd misslyckades',

  // Original text: 'Host patches could not be homogenized.'
  addHostNotHomogeneousErrorMessage: undefined,

  // Original text: "Disconnect"
  disconnectServer: 'Koppla bort',

  // Original text: "Start"
  startHostLabel: 'Start',

  // Original text: "Stop"
  stopHostLabel: 'Stop',

  // Original text: "Enable"
  enableHostLabel: 'Aktivera',

  // Original text: "Disable"
  disableHostLabel: 'Inaktivera',

  // Original text: "Restart toolstack"
  restartHostAgent: undefined,

  // Original text: "Force reboot"
  forceRebootHostLabel: 'Tvinga omstart',

  // Original text: "Reboot"
  rebootHostLabel: 'Starta om',
  
  // Original text: 'Error while restarting host'
  noHostsAvailableErrorTitle: undefined,

  // Original text: 'Some VMs cannot be migrated before restarting this host. Please try force reboot.'
  noHostsAvailableErrorMessage: undefined,

  // Original text: 'Error while restarting hosts'
  failHostBulkRestartTitle: undefined,

  // Original text: '{failedHosts, number}/{totalHosts, number} host{failedHosts, plural, one {} other {s}} could not be restarted.'
  failHostBulkRestartMessage: undefined,

  // Original text: 'Reboot to apply updates'
  rebootUpdateHostLabel: undefined,

  // Original text: "Emergency mode"
  emergencyModeLabel: 'Nödläge',

  // Original text: "Storage"
  storageTabName: 'Lagring',

  // Original text: "Patches"
  patchesTabName: 'patchar',

  // Original text: "Load average"
  statLoad: 'Belastningsmedelvärde',

  // Original text: 'RAM Usage: {memoryUsed}'
  memoryHostState: undefined,

  // Original text: "Hardware"
  hardwareHostSettingsLabel: 'Hårdvara',

  // Original text: "Address"
  hostAddress: 'Adress',

  // Original text: "Status"
  hostStatus: 'Status',

  // Original text: "Build number"
  hostBuildNumber: 'Número de compilación',

  // Original text: "iSCSI name"
  hostIscsiName: 'iSCSI namn',

  // Original text: "Version"
  hostXenServerVersion: 'Version',

  // Original text: "Enabled"
  hostStatusEnabled: 'Aktiverad',

  // Original text: "Disabled"
  hostStatusDisabled: 'Inaktiverad',

  // Original text: "Power on mode"
  hostPowerOnMode: undefined,

  // Original text: "Host uptime"
  hostStartedSince: 'Värd upptid',

  // Original text: "Toolstack uptime"
  hostStackStartedSince: undefined,

  // Original text: "CPU model"
  hostCpusModel: 'CPU-modell',

  // Original text: "Core (socket)"
  hostCpusNumber: 'Core (socket)',

  // Original text: "Manufacturer info"
  hostManufacturerinfo: 'Tillverkarens information',

  // Original text: "BIOS info"
  hostBiosinfo: 'BIOS-information',

  // Original text: "Licence"
  licenseHostSettingsLabel: 'Licens',

  // Original text: "Type"
  hostLicenseType: 'Typ',

  // Original text: "Socket"
  hostLicenseSocket: 'Socket',

  // Original text: "Expiry"
  hostLicenseExpiry: 'Utgångsdatum',

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
  networkCreateButton: 'Lägg till ett nätverk',

  // Original text: 'Add a bonded network'
  networkCreateBondedButton: undefined,
//FORTSÄTT
  // Original text: "Device"
  pifDeviceLabel: 'Enhet',

  // Original text: "Network"
  pifNetworkLabel: 'Nätverk',

  // Original text: "VLAN"
  pifVlanLabel: 'VLAN',

  // Original text: "Address"
  pifAddressLabel: 'adress',

  // Original text: 'Mode'
  pifModeLabel: undefined,

  // Original text: "MAC"
  pifMacLabel: 'MAC',

  // Original text: "MTU"
  pifMtuLabel: 'MTU',

  // Original text: "Status"
  pifStatusLabel: 'Status',

  // Original text: "Connected"
  pifStatusConnected: 'Ansluten',

  // Original text: "Disconnected"
  pifStatusDisconnected: 'Bortkopplad',

  // Original text: "No physical interface detected"
  pifNoInterface: 'Inga fysiska interface funna',

  // Original text: 'This interface is currently in use'
  pifInUse: 'Detta interface används',

  // Original text: 'Action'
  pifAction: 'Åtgärd',

  // Original text: 'Default locking mode'
  defaultLockingMode: 'Standard låsningläge',

  // Original text: 'Configure IP address'
  pifConfigureIp: 'Konfigurera IP-adress',

  // Original text: 'Invalid parameters'
  configIpErrorTitle: 'Ogiltiga parametrar',

  // Original text: 'Static IP address'
  staticIp: 'Statisk IP-Adress',

  // Original text: 'Netmask'
  netmask: 'Nätmask',

  // Original text: 'DNS'
  dns: undefined,

  // Original text: 'Gateway'
  gateway: undefined,

  // Original text: "Add a storage"
  addSrDeviceButton: 'Lägg till lagring',

  // Original text: "Name"
  srNameLabel: 'Namn',

  // Original text: "Type"
  srType: 'Typ',

  // Original text: 'Action'
  pbdAction: undefined,

  // Original text: "Status"
  pbdStatus: 'Status',

  // Original text: "Connected"
  pbdStatusConnected: 'Ansluten',

  // Original text: "Disconnected"
  pbdStatusDisconnected: 'Bortkopplad',

  // Original text: 'Connect'
  pbdConnect: undefined,

  // Original text: 'Disconnect'
  pbdDisconnect: undefined,

  // Original text: 'Forget'
  pbdForget: undefined,

  // Original text: "Shared"
  srShared: 'Delad',

  // Original text: "Not shared"
  srNotShared: 'Ej delad',

  // Original text: "No storage detected"
  pbdNoSr: 'Ingen lagring funnen',

  // Original text: "Name"
  patchNameLabel: 'Namn',

  // Original text: "Install all patches"
  patchUpdateButton: 'Installera alla uppdateringar',

  // Original text: "Description"
  patchDescription: 'Beskrivning',

  // Original text: "Applied date"
  patchApplied: 'Appliceringsdatum',

  // Original text: "Size"
  patchSize: 'Storlek',

  // Original text: "Status"
  patchStatus: 'Status',

  // Original text: "Applied"
  patchStatusApplied: 'Applicerades',

  // Original text: "Missing patches"
  patchStatusNotApplied: 'Uppdateringar saknas',

  // Original text: "No patch detected"
  patchNothing: 'Ingen uppdatering funnen',

  // Original text: "Release date"
  patchReleaseDate: 'Publiceringsdatum',

  // Original text: "Guidance"
  patchGuidance: 'Guidning',

  // Original text: "Action"
  patchAction: 'Åtgärd',

  // Original text: 'Applied patches'
  hostAppliedPatches: undefined,

  // Original text: "Missing patches"
  hostMissingPatches: 'Uppdateringar saknas',

  // Original text: "Host up-to-date!"
  hostUpToDate: 'Värd är uppdaterad',

  // Original text: 'Non-recommended patch install'
  installPatchWarningTitle: undefined,

  // Original text: 'This will install a patch only on this host. This is NOT the recommended way: please go into the Pool patch view and follow instructions there. If you are sure about this, you can continue anyway'
  installPatchWarningContent: undefined,

  // Original text: 'Go to pool'
  installPatchWarningReject: undefined,

  // Original text: 'Install'
  installPatchWarningResolve: 'Installera',

  // Original text: 'Refresh patches'
  refreshPatches: 'Förnya uppdateringar',

  // Original text: 'Install pool patches'
  installPoolPatches: 'Installera pooluppdateringar',

  // Original text: 'Default SR'
  defaultSr: 'Standard-SR',

  // Original text: 'Set as default SR'
  setAsDefaultSr: 'Sätt som standard-SR',

  // Original text: "General"
  generalTabName: 'Generell',

  // Original text: "Stats"
  statsTabName: 'Statistik',

  // Original text: "Console"
  consoleTabName: 'Konsol',

  // Original text: 'Container'
  containersTabName: undefined,

  // Original text: "Snapshots"
  snapshotsTabName: 'Snapshots',

  // Original text: "Logs"
  logsTabName: 'Logs',

  // Original text: "Advanced"
  advancedTabName: 'Avancerat',

  // Original text: "Network"
  networkTabName: 'Nätverk',

  // Original text: "Disk{disks, plural, one {} other {s}}"
  disksTabName: 'Disk{disks, plural, one {} other {s}}',

  // Original text: "halted"
  powerStateHalted: 'stannad',

  // Original text: "running"
  powerStateRunning: 'körande',

  // Original text: "suspended"
  powerStateSuspended: 'pausad',

  // Original text: "No Xen tools detected"
  vmStatus: 'Inga Xen Tools funna',

  // Original text: "No IPv4 record"
  vmName: undefined,

  // Original text: "No IP record"
  vmDescription: undefined,

  // Original text: "Started {ago}"
  vmSettings: 'Startades {ago}',

  // Original text: "Current status:"
  vmCurrentStatus: 'Aktuell status',

  // Original text: "Not running"
  vmNotRunning: 'Körs inte',

  // Original text: 'Halted {ago}'
  vmHaltedSince: undefined,

  // Original text: "No Xen tools detected"
  noToolsDetected: 'Inga Xen Tools funna',

  // Original text: "No IPv4 record"
  noIpv4Record: undefined,

  // Original text: "No IP record"
  noIpRecord: undefined,

  // Original text: "Started {ago}"
  started: 'Startades {ago}',

  // Original text: "Paravirtualization (PV)"
  paraVirtualizedMode: undefined,

  // Original text: "Hardware virtualization (HVM)"
  hardwareVirtualizedMode: undefined,

  // Original text: "CPU usage"
  statsCpu: 'CPU-användning',

  // Original text: "Memory usage"
  statsMemory: 'Minnesanvändning',

  // Original text: "Network throughput"
  statsNetwork: 'Nätverks genomströmning',

  // Original text: 'Stacked values'
  useStackedValuesOnStats: undefined,

  // Original text: "Disk throughput"
  statDisk: 'Disk genomströmning',

  // Original text: "Last 10 minutes"
  statLastTenMinutes: 'Senaste 10 minuterna',

  // Original text: "Last 2 hours"
  statLastTwoHours: 'Senaste 2 timmarna',

  // Original text: "Last week"
  statLastWeek: 'Senaste veckan',

  // Original text: "Last year"
  statLastYear: 'Senaste året',

  // Original text: "Copy"
  copyToClipboardLabel: 'Kopiera',

  // Original text: "Ctrl+Alt+Del"
  ctrlAltDelButtonLabel: 'Ctrl+Alt+Del',

  // Original text: "Tip:"
  tipLabel: 'Tips:',

  // Original text: 'Hide infos'
  hideHeaderTooltip: 'Dölj info',

  // Original text: 'Show infos'
  showHeaderTooltip: 'Visa info',

  // Original text: 'Name'
  containerName: 'Namn',

  // Original text: 'Command'
  containerCommand: 'Kommando',

  // Original text: 'Creation date'
  containerCreated: 'Skapandedatum',

  // Original text: 'Status'
  containerStatus: undefined,

  // Original text: 'Action'
  containerAction: 'Åtgärd',

  // Original text: 'No existing containers'
  noContainers: 'Inga existerande containrar',

  // Original text: 'Stop this container'
  containerStop: 'Stanna denna container',

  // Original text: 'Start this container'
  containerStart: 'Starta denna container',

  // Original text: 'Pause this container'
  containerPause: 'Pausa denna container',

  // Original text: 'Resume this container'
  containerResume: 'Återuppta denna container',

  // Original text: 'Restart this container'
  containerRestart: 'Starta om denna container',

  // Original text: "Action"
  vdiAction: 'Åtgärd',

  // Original text: "Attach disk"
  vdiAttachDevice: 'Anslut disk',

  // Original text: "New disk"
  vbdCreateDeviceButton: 'Ny disk',

  // Original text: "Boot order"
  vdiBootOrder: 'Boot-ordning',

  // Original text: "Name"
  vdiNameLabel: 'Namn',

  // Original text: "Description"
  vdiNameDescription: 'Beskrivning',

  // Original text: 'Pool'
  vdiPool: undefined,

  // Original text: 'Disconnect'
  vdiDisconnect: 'Koppla bort',

  // Original text: "Tags"
  vdiTags: 'Etiketter',

  // Original text: "Size"
  vdiSize: 'Storlek',

  // Original text: "SR"
  vdiSr: 'SR',

  // Original text: 'VM'
  vdiVm: undefined,

  // Original text: 'Migrate VDI'
  vdiMigrate: 'Migrera VDI',

  // Original text: 'Destination SR:'
  vdiMigrateSelectSr: 'Destinations-SR',

  // Original text: 'No SR'
  vdiMigrateNoSr: 'Ingen SR',

  // Original text: 'A target SR is required to migrate a VDI'
  vdiMigrateNoSrMessage: 'Ett mål-SR krävs för att migrera en VDI',

  // Original text: 'Forget'
  vdiForget: 'Glöm',

  // Original text: 'Remove VDI'
  vdiRemove: 'Ta bort VDI',

  // Original text: 'No VDIs attached to Control Domain'
  noControlDomainVdis: 'Inga VDIs anslutna till Control Domain',

  // Original text: "Boot flag"
  vbdBootableStatus: 'Boot flagga',

  // Original text: "Status"
  vbdStatus: 'Status',

  // Original text: "Connected"
  vbdStatusConnected: 'Ansluten',

  // Original text: "Disconnected"
  vbdStatusDisconnected: 'Bortkopplad',

  // Original text: "No disks"
  vbdNoVbd: 'Inga diskar',

  // Original text: 'Connect VBD'
  vbdConnect: 'Anslut VBD',

  // Original text: 'Disconnect VBD'
  vbdDisconnect: 'Koppla bort VBD',

  // Original text: 'Bootable'
  vbdBootable: 'Bootbar',

  // Original text: 'Readonly'
  vbdReadonly: 'Endast läsa',

  // Original text: 'Action'
  vbdAction: 'Åtgärd',

  // Original text: 'Create'
  vbdCreate: 'Skapa',

  // Original text: 'Disk name'
  vbdNamePlaceHolder: 'Disknamn',

  // Original text: 'Size'
  vbdSizePlaceHolder: 'Storlek',

  // Original text: 'CD drive not completely installed'
  cdDriveNotInstalled: 'CD-enheten är inte fullständigt installerad',

  // Original text: 'Stop and start the VM to install the CD drive'
  cdDriveInstallation: 'Stoppa och starta VM för att installera CD-enhet',

  // Original text: 'Save'
  saveBootOption: 'Spara',

  // Original text: 'Reset'
  resetBootOption: 'Reset',

  // Original text: "New device"
  vifCreateDeviceButton: 'Ny enhet',

  // Original text: "No interface"
  vifNoInterface: 'Inget interface',

  // Original text: "Device"
  vifDeviceLabel: 'Enhet',

  // Original text: "MAC address"
  vifMacLabel: 'MAC-adress',

  // Original text: "MTU"
  vifMtuLabel: 'MTU',

  // Original text: "Network"
  vifNetworkLabel: 'Nätverk',

  // Original text: "Status"
  vifStatusLabel: 'Status',

  // Original text: "Connected"
  vifStatusConnected: 'Ansluten',

  // Original text: "Disconnected"
  vifStatusDisconnected: 'Bortkopplad',

  // Original text: 'Connect'
  vifConnect: 'Anslut',

  // Original text: 'Disconnect'
  vifDisconnect: 'Koppla bort',

  // Original text: 'Remove'
  vifRemove: 'Ta bort',

  // Original text: "IP addresses"
  vifIpAddresses: 'IP-adress',

  // Original text: 'Auto-generated if empty'
  vifMacAutoGenerate: 'Auto-genererad om tom',

  // Original text: 'Allowed IPs'
  vifAllowedIps: 'Tillåtna IPs',

  // Original text: 'No IPs'
  vifNoIps: 'Inga IPS',

  // Original text: 'Network locked'
  vifLockedNetwork: 'Nätverk låst',

  // Original text: 'Network locked and no IPs are allowed for this interface'
  vifLockedNetworkNoIps: 'Nätverk låst och inga IPs tillåtna på detta interface',

  // Original text: 'Network not locked'
  vifUnLockedNetwork: 'Nätverk olåst',

  // Original text: 'Unknown network'
  vifUnknownNetwork: 'Okänt nätverk',

  // Original text: 'Action'
  vifAction: 'Åtgärd',

  // Original text: 'Create'
  vifCreate: 'Skapa',

  // Original text: "No snapshots"
  noSnapshots: 'Inga snapshots',

  // Original text: "New snapshot"
  snapshotCreateButton: 'Ny snapshot',

  // Original text: "Just click on the snapshot button to create one!"
  tipCreateSnapshotLabel: 'Klicka bara på snapshot-knappen för att skapa en',

  // Original text: 'Revert VM to this snapshot'
  revertSnapshot: 'Återställ VM till denna snapshot',

  // Original text: 'Remove this snapshot'
  deleteSnapshot: 'Ta bort denna snapshot',

  // Original text: 'Create a VM from this snapshot'
  copySnapshot: 'Skapa en VM från denna snapshot',

  // Original text: 'Export this snapshot'
  exportSnapshot: 'Exportera denna snapshot',

  // Original text: "Creation date"
  snapshotDate: 'Skapandedatum',

  // Original text: "Name"
  snapshotName: 'Namn',

  // Original text: "Action"
  snapshotAction: 'Åtgärd',

  // Original text: 'Quiesced snapshot'
  snapshotQuiesce: undefined,

  // Original text: "Remove all logs"
  logRemoveAll: 'Radera alla loggar',

  // Original text: "No logs so far"
  noLogs: 'Inga loggar hittills',

  // Original text: "Creation date"
  logDate: 'Datum de creación',

  // Original text: "Name"
  logName: 'Namn',

  // Original text: "Content"
  logContent: 'Innehåll',

  // Original text: "Action"
  logAction: 'Åtgärd',

  // Original text: "Remove"
  vmRemoveButton: 'Ta bort',

  // Original text: "Convert"
  vmConvertButton: 'Konvertera',

  // Original text: "Xen settings"
  xenSettingsLabel: 'Xen-inställningar',

  // Original text: "Guest OS"
  guestOsLabel: 'Gäst-OS',

  // Original text: "Misc"
  miscLabel: 'Diverse',

  // Original text: "UUID"
  uuid: 'UUID',

  // Original text: "Virtualization mode"
  virtualizationMode: 'Virtualiseringsläge',

  // Original text: "CPU weight"
  cpuWeightLabel: 'CPU-vikt',

  // Original text: "Default ({value, number})"
  defaultCpuWeight: 'Standard ({value, number})',

  // Original text: 'CPU cap'
  cpuCapLabel: 'CPU-tak',

  // Original text: 'Default ({value, number})'
  defaultCpuCap: 'Standard ({value, number})',

  // Original text: "PV args"
  pvArgsLabel: 'PV args',

  // Original text: "Xen tools status"
  xenToolsStatus: 'Xen tools status',

  // Original text: "{status}"
  xenToolsStatusValue: '{status}',

  // Original text: "OS name"
  osName: 'OS-namn',

  // Original text: "OS kernel"
  osKernel: 'OS-kernel',

  // Original text: "Auto power on"
  autoPowerOn: undefined,

  // Original text: "HA"
  ha: 'HA',

  // Original text: 'Affinity host'
  vmAffinityHost: undefined,

  // Original text: 'VGA'
  vmVga: undefined,

  // Original text: 'Video RAM'
  vmVideoram: undefined,

  // Original text: 'None'
  noAffinityHost: 'Ingen',

  // Original text: "Original template"
  originalTemplate: 'Original mall',

  // Original text: "Unknown"
  unknownOsName: 'Okänd',

  // Original text: "Unknown"
  unknownOsKernel: 'Okänd',

  // Original text: "Unknown"
  unknownOriginalTemplate: 'Okänd',

  // Original text: "VM limits"
  vmLimitsLabel: 'VM-begränsningar',

  // Original text: "CPU limits"
  vmCpuLimitsLabel: 'CPU-begränsningar',

  // Original text: 'Topology'
  vmCpuTopology: 'Topologi',

  // Original text: 'Default behavior'
  vmChooseCoresPerSocket: 'Standardbeteende',

  // Original text: '{nSockets, number} socket{nSockets, plural, one {} other {s}} with {nCores, number} core{nCores, plural, one {} other {s}} per socket'
  vmSocketsWithCoresPerSocket: undefined,

  // Original text: 'Incorrect cores per socket value'
  vmCoresPerSocketIncorrectValue: undefined,

  // Original text: 'Please change the selected value to fix it.'
  vmCoresPerSocketIncorrectValueSolution: undefined,

  // Original text: "Memory limits (min/max)"
  vmMemoryLimitsLabel: 'Minnesbegränsningar (min/max)',

  // Original text: "vCPUs max:"
  vmMaxVcpus: 'Max vCPUs:',

  // Original text: "Memory max:"
  vmMaxRam: 'Max minne:',

  // Original text: "Long click to add a name"
  vmHomeNamePlaceholder: 'Långklicka för att lägga till ett namn',

  // Original text: "Long click to add a description"
  vmHomeDescriptionPlaceholder: 'Långklicka för att lägga till en beskrivning',

  // Original text: "Click to add a name"
  vmViewNamePlaceholder: 'Klicka för att lägga till ett namn',

  // Original text: "Click to add a description"
  vmViewDescriptionPlaceholder: 'Klicka för att lägga till en beskrivning',

  // Original text: 'Click to add a name'
  templateHomeNamePlaceholder: 'Klicka för att lägga till ett namn',

  // Original text: 'Click to add a description'
  templateHomeDescriptionPlaceholder: 'Klicka för att lägga till en beskrivning',

  // Original text: 'Delete template'
  templateDelete: 'Radera mall',

  // Original text: 'Delete VM template{templates, plural, one {} other {s}}'
  templateDeleteModalTitle: 'Radera VM-mall{templates, plural, one {} other {s}}',

  // Original text: 'Are you sure you want to delete {templates, plural, one {this} other {these}} template{templates, plural, one {} other {s}}?'
  templateDeleteModalBody: 'Är du säker du vill radera {templates, plural, one {this} other {these}} template{templates, plural, one {} other {s}}?',

  // Original text: "Pool{pools, plural, one {} other {s}}"
  poolPanel: 'Pool{pools, plural, one {} other {s}}',

  // Original text: "Host{hosts, plural, one {} other {s}}"
  hostPanel: 'Värd{hosts, plural, one {} other {s}}',

  // Original text: "VM{vms, plural, one {} other {s}}"
  vmPanel: 'VM{vms, plural, one {} other {s}}',

  // Original text: "RAM Usage:"
  memoryStatePanel: 'RAM-användning',

  // Original text: "CPUs Usage"
  cpuStatePanel: 'CPU-användning',

  // Original text: "VMs Power state"
  vmStatePanel: 'Power-status',

  // Original text: "Pending tasks"
  taskStatePanel: 'Väntande uppgifter',

  // Original text: "Users"
  usersStatePanel: 'Användare',

  // Original text: "Storage state"
  srStatePanel: 'Lagringstatus',

  // Original text: "{usage} (of {total})"
  ofUsage: undefined,

  // Original text: "No storage"
  noSrs: 'Ingen lagring',

  // Original text: "Name"
  srName: 'Namn',

  // Original text: "Pool"
  srPool: 'Pool',

  // Original text: "Host"
  srHost: 'Värd',

  // Original text: "Type"
  srFormat: 'Typ',

  // Original text: "Size"
  srSize: 'Storlek',

  // Original text: "Usage"
  srUsage: 'Användning',

  // Original text: "used"
  srUsed: 'Använt',

  // Original text: "free"
  srFree: 'fri',

  // Original text: "Storage Usage"
  srUsageStatePanel: 'Lagringsanvändning',

  // Original text: "Top 5 SR Usage (in %)"
  srTopUsageStatePanel: 'Top 5 SR-användning (%)',

  // Original text: '{running, number} running ({halted, number} halted)'
  vmsStates: undefined,

  // Original text: 'Clear selection'
  dashboardStatsButtonRemoveAll: 'Rensa urval',

  // Original text: 'Add all hosts'
  dashboardStatsButtonAddAllHost: 'Lägg till alla värdar',

  // Original text: 'Add all VMs'
  dashboardStatsButtonAddAllVM: 'Lägg till alla VMs',

  // Original text: "{value} {date, date, medium}"
  weekHeatmapData: '{value} {date, date, medium}',

  // Original text: "No data."
  weekHeatmapNoData: 'Inget datum.',

  // Original text: "Weekly Heatmap"
  weeklyHeatmap: undefined,

  // Original text: "Weekly Charts"
  weeklyCharts: undefined,

  // Original text: "Synchronize scale:"
  weeklyChartsScaleInfo: undefined,

  // Original text: "Stats error"
  statsDashboardGenericErrorTitle: 'Error statistik',

  // Original text: "There is no stats available for:"
  statsDashboardGenericErrorMessage: 'Det finns ingen statistik tillgänglig för:',

  // Original text: "No selected metric"
  noSelectedMetric: 'Ingen metrik vald',

  // Original text: "Select"
  statsDashboardSelectObjects: 'Välj',

  // Original text: "Loading…"
  metricsLoading: 'Laddar…',

  // Original text: "Coming soon!"
  comingSoon: 'Kommer snart!',

  // Original text: "Orphaned snapshot VDIs"
  orphanedVdis: 'Föräldralösa snapshot VDIs',

  // Original text: "Orphaned VMs snapshot"
  orphanedVms: 'Föräldralösa VMs snapshot',

  // Original text: "No orphans"
  noOrphanedObject: 'Inga föräldralösa',

  // Original text: "Remove all orphaned snapshot VDIs"
  removeAllOrphanedObject: 'Eliminera alla föräldralösa snapshot VDIs',

  // Original text: 'VDIs attached to Control Domain'
  vdisOnControlDomain: undefined,

  // Original text: "Name"
  vmNameLabel: 'Namn',

  // Original text: "Description"
  vmNameDescription: 'Beskrivning',

  // Original text: "Resident on"
  vmContainer: 'Befinner sig på',

  // Original text: "Alarms"
  alarmMessage: 'Larm',

  // Original text: "No alarms"
  noAlarms: 'Inga larm',

  // Original text: "Date"
  alarmDate: 'Datum',

  // Original text: "Content"
  alarmContent: 'Innehåll',

  // Original text: "Issue on"
  alarmObject: 'Utgivet på',

  // Original text: "Pool"
  alarmPool: 'Pool',

  // Original text: "Remove all alarms"
  alarmRemoveAll: 'Ta bort alla larm',

  // Original text: '{used}% used ({free} left)'
  spaceLeftTooltip: undefined,

  // Original text: "Create a new VM on {select}"
  newVmCreateNewVmOn: 'Skapa en ny VM på {select}',

  // Original text: 'Create a new VM on {select1} or {select2}'
  newVmCreateNewVmOn2: undefined,

  // Original text: 'You have no permission to create a VM'
  newVmCreateNewVmNoPermission: 'Du saknar rättigheter för att skapa en VM',

  // Original text: "Infos"
  newVmInfoPanel: 'Information',

  // Original text: "Name"
  newVmNameLabel: 'Namn',

  // Original text: "Template"
  newVmTemplateLabel: 'Mall',

  // Original text: "Description"
  newVmDescriptionLabel: 'Beskrivning',

  // Original text: "Performances"
  newVmPerfPanel: 'Prestanda',

  // Original text: "vCPUs"
  newVmVcpusLabel: 'vCPUs',

  // Original text: "RAM"
  newVmRamLabel: 'RAM',

  // Original text: 'Static memory max'
  newVmStaticMaxLabel: undefined,

  // Original text: 'Dynamic memory min'
  newVmDynamicMinLabel: undefined,

  // Original text: 'Dynamic memory max'
  newVmDynamicMaxLabel: undefined,

  // Original text: "Install settings"
  newVmInstallSettingsPanel: 'Installationsinställnigar',

  // Original text: "ISO/DVD"
  newVmIsoDvdLabel: 'ISO/DVD',

  // Original text: "Network"
  newVmNetworkLabel: 'Nätverk',

  // Original text: 'e.g: http://httpredir.debian.org/debian'
  newVmInstallNetworkPlaceHolder: undefined,

  // Original text: "PV Args"
  newVmPvArgsLabel: undefined,

  // Original text: "PXE"
  newVmPxeLabel: undefined,

  // Original text: "Interfaces"
  newVmInterfacesPanel: undefined,

  // Original text: "MAC"
  newVmMacLabel: undefined,

  // Original text: "Add interface"
  newVmAddInterface: 'Lägg till interface',

  // Original text: "Disks"
  newVmDisksPanel: 'Diskar',

  // Original text: "SR"
  newVmSrLabel: undefined,

  // Original text: "Size"
  newVmSizeLabel: 'Storlek',

  // Original text: "Add disk"
  newVmAddDisk: 'Lägg till disk',

  // Original text: "Summary"
  newVmSummaryPanel: 'Summering',

  // Original text: "Create"
  newVmCreate: 'Skapa',

  // Original text: "Reset"
  newVmReset: 'Starta om',

  // Original text: "Select template"
  newVmSelectTemplate: 'Välj mall',

  // Original text: "SSH key"
  newVmSshKey: 'SSH-nyckel',

  // Original text: "Config drive"
  newVmConfigDrive: 'Konfigurera drive',

  // Original text: "Custom config"
  newVmCustomConfig: 'Anpassad konfiguration',

  // Original text: "Boot VM after creation"
  newVmBootAfterCreate: 'Starta VM efter den har skapats',

  // Original text: "Auto-generated if empty"
  newVmMacPlaceholder: 'Autogenereras om tom',

  // Original text: "CPU weight"
  newVmCpuWeightLabel: undefined,

  // Original text: 'Default: {value, number}'
  newVmDefaultCpuWeight: undefined,

  // Original text: 'CPU cap'
  newVmCpuCapLabel: undefined,

  // Original text: 'Default: {value, number}'
  newVmDefaultCpuCap: undefined,

  // Original text: "Cloud config"
  newVmCloudConfig: undefined,

  // Original text: "Create VMs"
  newVmCreateVms: 'Skapa VMs',

  // Original text: "Are you sure you want to create {nbVms, number} VMs?"
  newVmCreateVmsConfirm: 'Är du säker du vill skapa {nbVms, number} VMs?',

  // Original text: "Multiple VMs:"
  newVmMultipleVms: 'Multipla VMs:',

  // Original text: 'Select a resource set:'
  newVmSelectResourceSet: undefined,

  // Original text: 'Name pattern:'
  newVmMultipleVmsPattern: 'Namnmönster',

  // Original text: 'e.g.: \\{name\\}_%'
  newVmMultipleVmsPatternPlaceholder: undefined,

  // Original text: 'First index:'
  newVmFirstIndex: undefined,

  // Original text: 'Recalculate VMs number'
  newVmNumberRecalculate: 'Räkna om VMs nummer',

  // Original text: 'Refresh VMs name'
  newVmNameRefresh: undefined,

  // Original text: 'Affinity host'
  newVmAffinityHost: undefined,

  // Original text: 'Advanced'
  newVmAdvancedPanel: 'Avancerat',

  // Original text: 'Show advanced settings'
  newVmShowAdvanced: 'Visa avancerade inställningar',

  // Original text: 'Hide advanced settings'
  newVmHideAdvanced: 'Dölj avancerade inställningar',

  // Original text: 'Share this VM'
  newVmShare: 'Dela denna VM',

  // Original text: "Resource sets"
  resourceSets: 'Resursset',

  // Original text: "No resource sets."
  noResourceSets: 'Inga resursset',

  // Original text: 'Loading resource sets'
  loadingResourceSets: 'Laddar resursset',

  // Original text: "Resource set name"
  resourceSetName: 'Resursset namn',

  // Original text: 'Recompute all limits'
  recomputeResourceSets: undefined,

  // Original text: "Save"
  saveResourceSet: 'Spara',

  // Original text: "Reset"
  resetResourceSet: undefined,

  // Original text: "Edit"
  editResourceSet: 'Redigera',

  // Original text: "Delete"
  deleteResourceSet: 'Radera',

  // Original text: "Delete resource set"
  deleteResourceSetWarning: 'Radera resursset',

  // Original text: "Are you sure you want to delete this resource set?"
  deleteResourceSetQuestion: 'Är du säker du vill radera detta resursset?',

  // Original text: "Missing objects:"
  resourceSetMissingObjects: 'Objekt saknas',

  // Original text: "vCPUs"
  resourceSetVcpus: 'vCPUs',

  // Original text: "Memory"
  resourceSetMemory: 'Minne',

  // Original text: "Storage"
  resourceSetStorage: 'Lagring',

  // Original text: "Unknown"
  unknownResourceSetValue: 'Okänd',

  // Original text: "Available hosts"
  availableHosts: 'Tillgängliga värdar',

  // Original text: "Excluded hosts"
  excludedHosts: 'Exkluderade värdar',

  // Original text: "No hosts available."
  noHostsAvailable: 'Inga värdar tillgängliga',

  // Original text: "VMs created from this resource set shall run on the following hosts."
  availableHostsDescription: 'VMs skapade från detta resurssettet ska köras på följande värdar',

  // Original text: "Maximum CPUs"
  maxCpus: 'Maximala CPUs',

  // Original text: "Maximum RAM (GiB)"
  maxRam: 'Maximalt RAM (GiB)',

  // Original text: "Maximum disk space"
  maxDiskSpace: 'Maximal diskstorlek',

  // Original text: 'IP pool'
  ipPool: undefined,

  // Original text: 'Quantity'
  quantity: 'Mängd',

  // Original text: "No limits."
  noResourceSetLimits: 'Inga begränsningar',

  // Original text: "Total:"
  totalResource: 'Total:',

  // Original text: "Remaining:"
  remainingResource: 'Återstående:',

  // Original text: "Used:"
  usedResource: 'Använt:',

  // Original text: 'New'
  resourceSetNew: 'Ny',
  //fortsätt
  // Original text: "Try dropping some VMs files here, or click to select VMs to upload. Accept only .xva/.ova files."
  importVmsList:
    'Försök drag-o-släpp några VM-filer här. Eller klicka på Välj VMs för att ladda upp. Endast .xva/ .ova filer godkänns.',

  // Original text: "No selected VMs."
  noSelectedVms: 'Inga valda VMs',

  // Original text: "To Pool:"
  vmImportToPool: 'Till Pool:',

  // Original text: "To SR:"
  vmImportToSr: 'Till SR:',

  // Original text: "VM{nVms, plural, one {} other {s}} to import"
  vmsToImport: 'VM{nVms, plural, one {} other {s}} att importera',

  // Original text: "Reset"
  importVmsCleanList: undefined,

  // Original text: "VM import success"
  vmImportSuccess: 'VM-import lyckades',

  // Original text: "VM import failed"
  vmImportFailed: 'VM-import misslyckades',

  // Original text: "Import starting…"
  startVmImport: 'Import påbörjad…',

  // Original text: "Export starting…"
  startVmExport: 'Export påbörjad…',

  // Original text: 'Number of CPUs'
  nCpus: undefined,

  // Original text: 'Memory'
  vmMemory: undefined,

  // Original text: 'Disk {position} ({capacity})'
  diskInfo: undefined,

  // Original text: 'Disk description'
  diskDescription: 'Diskbeskrivning',

  // Original text: 'No disks.'
  noDisks: 'Inga diskar',

  // Original text: 'No networks.'
  noNetworks: 'Inga nätverk',

  // Original text: 'Network {name}'
  networkInfo: 'Nätverk {name}',

  // Original text: 'No description available'
  noVmImportErrorDescription: 'Ingen beskrivning tillgänglig',

  // Original text: 'Error:'
  vmImportError: undefined,

  // Original text: '{type} file:'
  vmImportFileType: undefined,

  // Original text: 'Please to check and/or modify the VM configuration.'
  vmImportConfigAlert: 'Vänligen kolla och/eller modifiera VM konfigurationen',

  // Original text: "No pending tasks"
  noTasks: 'Inga väntande uppgifter',

  // Original text: "Currently, there are not any pending XenServer tasks"
  xsTasks: 'Det finns inga väntande XenServer uppgifter för närvarande',

  // Original text: 'Schedules'
  backupSchedules: 'Scheman',

  // Original text: 'Get remote'
  getRemote: 'Hämta fjärrlagring',

  // Original text: "List Remote"
  listRemote: 'Visa fjärrlagring',

  // Original text: "simple"
  simpleBackup: 'enkel',

  // Original text: "delta"
  delta: undefined,

  // Original text: "Restore Backups"
  restoreBackups: 'Återställ backuper',

  // Original text: 'Click on a VM to display restore options'
  restoreBackupsInfo: 'Klicka på en VM för att visa återställnings möjligheter',

  // Original text: "Enabled"
  remoteEnabled: 'Aktiverad',

  // Original text: "Error"
  remoteError: undefined,

  // Original text: "No backup available"
  noBackup: 'Inga backuper tillgängliga',

  // Original text: "VM Name"
  backupVmNameColumn: 'VM-namn',

  // Original text: 'Tags'
  backupTags: 'Etiketter',

  // Original text: "Last Backup"
  lastBackupColumn: 'Senaste Backup',

  // Original text: "Available Backups"
  availableBackupsColumn: 'Tillgängliga Backuper',

  // Original text: 'Missing parameters'
  backupRestoreErrorTitle: 'Parametrar saknas',

  // Original text: 'Choose a SR and a backup'
  backupRestoreErrorMessage: 'Välj en SR och en backup',

  // Original text: 'Select default SR…'
  backupRestoreSelectDefaultSr: 'Völj standard SR',

  // Original text: 'Choose a SR for each VDI'
  backupRestoreChooseSrForEachVdis: 'Välj en SR för varje VDI',

  // Original text: 'VDI'
  backupRestoreVdiLabel: undefined,

  // Original text: 'SR'
  backupRestoreSrLabel: undefined,

  // Original text: 'Display backups'
  displayBackup: 'Visa backuper',

  // Original text: "Import VM"
  importBackupTitle: 'Importera VM',

  // Original text: "Starting your backup import"
  importBackupMessage: 'Startar din backupimport',

  // Original text: 'VMs to backup'
  vmsToBackup: 'VMs för backup',

  // Original text: 'List remote backups'
  listRemoteBackups: 'Visa fjärr backuper',

  // Original text: 'Restore backup files'
  restoreFiles: 'Återställ backupfiler',

  // Original text: 'Invalid options'
  restoreFilesError: 'Ogiltiga val',

  // Original text: 'Restore file from {name}'
  restoreFilesFromBackup: 'Återställ fil från {name}',

  // Original text: 'Select a backup…'
  restoreFilesSelectBackup: 'Välj en backup',

  // Original text: 'Select a disk…'
  restoreFilesSelectDisk: 'Välj en disk',

  // Original text: 'Select a partition…'
  restoreFilesSelectPartition: 'Välj en partition',

  // Original text: 'Folder path'
  restoreFilesSelectFolderPath: 'Mappsökväg',

  // Original text: 'Select a file…'
  restoreFilesSelectFiles: 'Välj en fil',

  // Original text: 'Content not found'
  restoreFileContentNotFound: 'Inget innehåll funnet',

  // Original text: 'No files selected'
  restoreFilesNoFilesSelected: 'Inga filer valda',

  // Original text: 'Selected files ({files}):'
  restoreFilesSelectedFiles: 'Valda filer ({files}):',

  // Original text: 'Error while scanning disk'
  restoreFilesDiskError: 'Error medans diskscanning',

  // Original text: "Select all this folder's files"
  restoreFilesSelectAllFiles: 'Markera alla filder i denna mappen',

  // Original text: 'Unselect all files'
  restoreFilesUnselectAll: 'Avmarkera alla filer',

  // Original text: 'Emergency shutdown Host{nHosts, plural, one {} other {s}}'
  emergencyShutdownHostsModalTitle: 'Nödavstängning värd{nHosts, plural, one {} other {s}}',

  // Original text: 'Are you sure you want to shutdown {nHosts, number} Host{nHosts, plural, one {} other {s}}?'
  emergencyShutdownHostsModalMessage: 'Är du säker att du vill stänga ner {nHosts, number} Host{nHosts, plural, one {} other {s}}?',

  // Original text: 'Shutdown host'
  stopHostModalTitle: 'Stäng av värd',

  // Original text: "This will shutdown your host. Do you want to continue? If it's the pool master, your connection to the pool will be lost"
  stopHostModalMessage: 'Detta kommer stänga ner din värd. Vill du fortsätta? Om det är poolens master, kommer din anslutning till poolen att förloras',

  // Original text: 'Add host'
  addHostModalTitle: 'Lägg till värd',

  // Original text: 'Are you sure you want to add {host} to {pool}?'
  addHostModalMessage: 'Är du säker du vill lägga till {host} to {pool}?',

  // Original text: 'Restart host'
  restartHostModalTitle: 'Starta om värd',

  // Original text: 'This will restart your host. Do you want to continue?'
  restartHostModalMessage: 'Detta kommer starta om din värd. Vill du fortsätta?',

  // Original text: 'Restart Host{nHosts, plural, one {} other {s}} agent{nHosts, plural, one {} other {s}}'
  restartHostsAgentsModalTitle: 'Starta om Värd{nHosts, plural, one {} other {s}} agent{nHosts, plural, one {} other {s}}',

  // Original text: 'Are you sure you want to restart {nHosts, number} Host{nHosts, plural, one {} other {s}} agent{nHosts, plural, one {} other {s}}?'
  restartHostsAgentsModalMessage: 'Är du säker du vill starta om {nHosts, number} Host{nHosts, plural, one {} other {s}} agent{nHosts, plural, one {} other {s}}?',

  // Original text: 'Restart Host{nHosts, plural, one {} other {s}}'
  restartHostsModalTitle: 'Starta om Värd{nHosts, plural, one {} other {s}}',

  // Original text: 'Are you sure you want to restart {nHosts, number} Host{nHosts, plural, one {} other {s}}?'
  restartHostsModalMessage: 'Är du säker du vill starta om {nHosts, number} Host{nHosts, plural, one {} other {s}}?',

  // Original text: "Start VM{vms, plural, one {} other {s}}"
  startVmsModalTitle: 'Starta VM{vms, plural, one {} other {s}}',

  // Original text: 'Start a copy'
  cloneAndStartVM: 'Starta en kopia',

  // Original text: 'Force start'
  forceStartVm: 'Tvinga start',

  // Original text: 'Forbidden operation'
  forceStartVmModalTitle: 'Förbjuden åtgärd',

  // Original text: 'Start operation for this vm is blocked.'
  blockedStartVmModalMessage: 'Startåtgärd för denna vm är blockerad',

  // Original text: 'Forbidden operation start for {nVms, number} vm{nVms, plural, one {} other {s}}.'
  blockedStartVmsModalMessage: 'Förbjuden startåtgärd för {nVms, number} vm{nVms, plural, one {} other {s}}.',

  // Original text: "Are you sure you want to start {vms, number} VM{vms, plural, one {} other {s}}?"
  startVmsModalMessage: 'Är du säker du vill starta {vms} VM{vms, plural, one {} other {s}}?',

  // Original text: '{nVms, number} vm{nVms, plural, one {} other {s}} are failed. Please see your logs to get more information'
  failedVmsErrorMessage: undefined,

  // Original text: 'Start failed'
  failedVmsErrorTitle: 'Start misslyckades',

  // Original text: 'Stop Host{nHosts, plural, one {} other {s}}'
  stopHostsModalTitle: 'Stoppa Värd{nHosts, plural, one {} other {s}}',

  // Original text: 'Are you sure you want to stop {nHosts, number} Host{nHosts, plural, one {} other {s}}?'
  stopHostsModalMessage: 'Är du säker du vill stoppa {nHosts, number} Host{nHosts, plural, one {} other {s}}?',

  // Original text: "Stop VM{vms, plural, one {} other {s}}"
  stopVmsModalTitle: 'Stoppa VM{vms, plural, one {} other {s}}',

  // Original text: "Are you sure you want to stop {vms, number} VM{vms, plural, one {} other {s}}?"
  stopVmsModalMessage: 'Är du säker du vill stoppa {vms, number} VM{vms, plural, one {} other {s}}?',

  // Original text: 'Restart VM'
  restartVmModalTitle: 'Starta om VM',

  // Original text: 'Are you sure you want to restart {name}?'
  restartVmModalMessage: 'Är du säker du vill starta om {name}?',

  // Original text: 'Stop VM'
  stopVmModalTitle: 'Stoppa VM',

  // Original text: 'Are you sure you want to stop {name}?'
  stopVmModalMessage: 'Är du säker du vill stoppa {name}?',

  // Original text: "Restart VM{vms, plural, one {} other {s}}"
  restartVmsModalTitle: 'Starta om VM{vms, plural, one {} other {s}}',

  // Original text: "Are you sure you want to restart {vms, number} VM{vms, plural, one {} other {s}}?"
  restartVmsModalMessage: 'Är du säker du vill starta om {vms, number} VM{vms, plural, one {} other {s}}?',

  // Original text: "Snapshot VM{vms, plural, one {} other {s}}"
  snapshotVmsModalTitle: 'Snapshot VM{vms, plural, one {} other {s}}',

  // Original text: "Are you sure you want to snapshot {vms, number} VM{vms, plural, one {} other {s}}?"
  snapshotVmsModalMessage: 'Är du säker du vill ta en snapshot på {vms, number} VM{vms, plural, one {} other {s}}?',

  // Original text: "Delete VM{vms, plural, one {} other {s}}"
  deleteVmsModalTitle: 'Radera VM{vms, plural, one {} other {s}}',

  // Original text: "Are you sure you want to delete {vms, number} VM{vms, plural, one {} other {s}}? ALL VM DISKS WILL BE REMOVED"
  deleteVmsModalMessage:
    'Är du säker du vill radera {vms, number} VM{vms, plural, one {} other {s}}? ALLA VM DISKAR KOMMER TAS BORT',

  // Original text: "Delete VM"
  deleteVmModalTitle: 'Radera VM',

  // Original text: "Are you sure you want to delete this VM? ALL VM DISKS WILL BE REMOVED"
  deleteVmModalMessage: 'Är du säker du vill radera denn VM? ALLA VM DISKAR KOMMER TAS BORT',

  // Original text: "Migrate VM"
  migrateVmModalTitle: 'Migrera VM',

  // Original text: 'Select a destination host:'
  migrateVmSelectHost: 'Välj en destinationsvärd',

  // Original text: 'Select a migration network:'
  migrateVmSelectMigrationNetwork: 'Välj ett migrationsnätverk',

  // Original text: 'For each VIF, select a network:'
  migrateVmSelectNetworks: 'För varje VIF, välj ett nätverk',

  // Original text: 'Select a destination SR:'
  migrateVmsSelectSr: 'Välj ett destinations SR',

  // Original text: 'Select a destination SR for local disks:'
  migrateVmsSelectSrIntraPool: 'Välj ett destinations SR för lokala diskar',

  // Original text: 'Select a network on which to connect each VIF:'
  migrateVmsSelectNetwork: 'Välj ett nätverk att ansluta varje VIF',

  // Original text: 'Smart mapping'
  migrateVmsSmartMapping: undefined,

  // Original text: 'VIF'
  migrateVmVif: undefined,

  // Original text: 'Network'
  migrateVmNetwork: 'Nätverk',

  // Original text: 'No target host'
  migrateVmNoTargetHost: 'Ingen målvärd',

  // Original text: 'A target host is required to migrate a VM'
  migrateVmNoTargetHostMessage: 'En målvärd krävs för att migrera en VM',

  // Original text: 'No default SR'
  migrateVmNoDefaultSrError: 'Ingen standard SR',

  // Original text: 'Default SR not connected to host'
  migrateVmNotConnectedDefaultSrError: 'Standard SR är inte ansluten till värd',

  // Original text: 'For each VDI, select an SR:'
  chooseSrForEachVdisModalSelectSr: 'För varje VDI, välj en SR',

  // Original text: 'Select main SR…'
  chooseSrForEachVdisModalMainSr: 'Välj huvudsakliga SR',

  // Original text: 'VDI'
  chooseSrForEachVdisModalVdiLabel: undefined,

  // Original text: 'SR*'
  chooseSrForEachVdisModalSrLabel: undefined,

  // Original text: '* optional'
  optionalEntry: '* valfritt',

  // Original text: 'Delete VDI'
  deleteVdiModalTitle: 'Radera VDI',

  // Original text: 'Are you sure you want to delete this disk? ALL DATA ON THIS DISK WILL BE LOST'
  deleteVdiModalMessage: 'Är du säker du vill radera disken? ALL DATA PÅ DENNA DISKEN KOMMER FÖRSTÖRAS',

  // Original text: 'Revert your VM'
  revertVmModalTitle: 'Återställ din VM',

  // Original text: 'Delete snapshot'
  deleteSnapshotModalTitle: 'Radera snapshot',

  // Original text: 'Are you sure you want to delete this snapshot?'
  deleteSnapshotModalMessage: 'Är du säker du vill radera denna snapshot?',

  // Original text: 'Are you sure you want to revert this VM to the snapshot state? This operation is irreversible.'
  revertVmModalMessage: 'Är du säker du vill återställa denna VM från denna snapshot? Denna åtgärd går inte att ångra.',

  // Original text: 'Snapshot before'
  revertVmModalSnapshotBefore: 'Ta en snapshot före',

  // Original text: "Import a {name} Backup"
  importBackupModalTitle: 'Importera en {name} backup',

  // Original text: "Start VM after restore"
  importBackupModalStart: 'Starta VM efter återställning',

  // Original text: "Select your backup…"
  importBackupModalSelectBackup: 'Välj din backup…',

  // Original text: "Are you sure you want to remove all orphaned snapshot VDIs?"
  removeAllOrphanedModalWarning: 'Är du säker du vill ta bort alla föräldralösa snapshot VDIs?',

  // Original text: "Remove all logs"
  removeAllLogsModalTitle: 'Radera alla loggar',

  // Original text: "Are you sure you want to remove all logs?"
  removeAllLogsModalWarning: 'Är du säker du vill radera alla loggar?',

  // Original text: "This operation is definitive."
  definitiveMessageModal: 'Denna åtgärd är slutgiltig',

  // Original text: "Previous SR Usage"
  existingSrModalTitle: 'Tdigare SR-använding',

  // Original text: "This path has been previously used as a Storage by a XenServer host. All data will be lost if you choose to continue the SR creation."
  existingSrModalText:
    'Denna sökväg har tidigare varit använt som lagring av en XenServer värd. All data kommer att försvinna om du fortsätter med SR-skapandet',

  // Original text: "Previous LUN Usage"
  existingLunModalTitle: 'Tidigare LUN-användning',

  // Original text: "This LUN has been previously used as a Storage by a XenServer host. All data will be lost if you choose to continue the SR creation."
  existingLunModalText:
    'Esta LUN ya ha sido utilizada anteriormente como Lagring por un host XenServer. Todos los datos existentes se perderán si continuas con la creación del SR.',

  // Original text: "Replace current registration?"
  alreadyRegisteredModal: 'Ersätt nuvarande registrering',

  // Original text: "Your XO appliance is already registered to {email}, do you want to forget and replace this registration ?"
  alreadyRegisteredModalText: 'Din XO appliance är redan registrerad till {email}. Vill du ersätta denna regitreringen?',

  // Original text: "Ready for trial?"
  trialReadyModal: 'Redo för testperiod?',

  // Original text: "During the trial period, XOA need to have a working internet connection. This limitation does not apply for our paid plans!"
  trialReadyModalText:
    'Under testperioden behöver XOA en fungerande internetanslutning. Denna begränsning gäller ej för betalda prenumerationer!',

  // Original text: 'Label'
  serverLabel: undefined,

  // Original text: "Host"
  serverHost: 'Värd',

  // Original text: "Username"
  serverUsername: 'Användarnamn',

  // Original text: "Password"
  serverPassword: 'Lösenord',

  // Original text: "Action"
  serverAction: 'Åtgärd',

  // Original text: "Read Only"
  serverReadOnly: 'Enbart läsa',

  // Original text: 'Unauthorized Certificates'
  serverUnauthorizedCertificates: 'Oautentiserade certifikat',

  // Original text: 'Allow Unauthorized Certificates'
  serverAllowUnauthorizedCertificates: 'Tillåt oautentiserade certifikat',

  // Original text: "Enable it if your certificate is rejected, but it's not recommended because your connection will not be secured."
  serverUnauthorizedCertificatesInfo: 'Aktivera det om ditt certifikat är avvisat, men det är inte rekomenderat eftersom anslutningen kommer inte vara säkrad',

  // Original text: 'username'
  serverPlaceHolderUser: 'användarnamn',

  // Original text: 'password'
  serverPlaceHolderPassword: 'lösenord',

  // Original text: 'address[:port]'
  serverPlaceHolderAddress: undefined,

  // Original text: 'label'
  serverPlaceHolderLabel: 'Etikett',

  // Original text: 'Connect'
  serverConnect: 'Anslut',

  // Original text: 'Error'
  serverError: undefined,

  // Original text: 'Adding server failed'
  serverAddFailed: 'Lägga till server misslyckades',

  // Original text: 'Status'
  serverStatus: undefined,

  // Original text: 'Connection failed. Click for more information.'
  serverConnectionFailed: 'Anslutning misslyckades. Klicka för mer information',

  // Original text: 'Connecting…'
  serverConnecting: 'Ansluter',

  // Original text: 'Authentication error'
  serverAuthFailed: 'Autentiseringsfel',

  // Original text: 'Unknown error'
  serverUnknownError: 'Okänt fel',

  // Original text: 'Invalid self-signed certificate'
  serverSelfSignedCertError: 'Ogiltigt självsignerat certifikat',

  // Original text: 'Do you want to accept self-signed certificate for this server even though it would decrease security?'
  serverSelfSignedCertQuestion: 'Vill du acceptera självsignerat certifikat för denna servern, även om det minskar säkerheten?',

  // Original text: "Copy VM"
  copyVm: 'Kopiera VM',

  // Original text: "Are you sure you want to copy this VM to {SR}?"
  copyVmConfirm: 'Är du säker du vill kopiera denna VM till {SR}?',

  // Original text: "Name"
  copyVmName: 'Namn',

  // Original text: 'Name pattern'
  copyVmNamePattern: 'Namnmönster',

  // Original text: "If empty: name of the copied VM"
  copyVmNamePlaceholder: 'Om tomt: namn på den kopierade VM',

  // Original text: 'e.g.: "\\{name\\}_COPY"'
  copyVmNamePatternPlaceholder: undefined,

  // Original text: "Select SR"
  copyVmSelectSr: 'Välj SR',

  // Original text: "Use compression"
  copyVmCompress: 'Använd komprimering',

  // Original text: 'No target SR'
  copyVmsNoTargetSr: 'Ingen mål-SR',

  // Original text: 'A target SR is required to copy a VM'
  copyVmsNoTargetSrMessage: 'En mål-SR krävs för att kopiera VM',

  // Original text: 'Detach host'
  detachHostModalTitle: 'Koppla bort värd',

  // Original text: 'Are you sure you want to detach {host} from its pool? THIS WILL REMOVE ALL VMs ON ITS LOCAL STORAGE AND REBOOT THE HOST.'
  detachHostModalMessage: 'Är du säker du vill koppla bort {host} från poolen? DETTA KOMMER TA BORT ALLA VMs PÅ DESS LOKALA LAGRING OCH STARTA OM VÄRDEN.',

  // Original text: 'Detach'
  detachHost: 'Koppla bort',

  // Original text: 'Forget host'
  forgetHostModalTitle: 'Glöm värd',

  // Original text: "Are you sure you want to forget {host} from its pool? Be sure this host can't be back online, or use detach instead."
  forgetHostModalMessage: 'Är du säker du vill glömma {host} från poolen? Var säker denna inte kan komma tillbaka online, eller använd koppla bort istället',

  // Original text: 'Forget'
  forgetHost: 'Glöm',

  // Original text: "Create network"
  newNetworkCreate: 'Skapa nätverk',

  // Original text: 'Create bonded network'
  newBondedNetworkCreate: undefined,

  // Original text: "Interface"
  newNetworkInterface: 'Interface',

  // Original text: "Name"
  newNetworkName: 'Namn',

  // Original text: "Description"
  newNetworkDescription: 'Beskrivning',

  // Original text: "VLAN"
  newNetworkVlan: 'VLAN',

  // Original text: "No VLAN if empty"
  newNetworkDefaultVlan: 'Inget VLAN om tomt',

  // Original text: "MTU"
  newNetworkMtu: 'MTU',

  // Original text: "Default: 1500"
  newNetworkDefaultMtu: 'Standard: 1500',

  // Original text: 'Name required'
  newNetworkNoNameErrorTitle: 'Namn krävs',

  // Original text: 'A name is required to create a network'
  newNetworkNoNameErrorMessage: 'Ett namn krävs för att skapa ett nätverk',

  // Original text: 'Bond mode'
  newNetworkBondMode: undefined,

  // Original text: "Delete network"
  deleteNetwork: 'Radera nätverk',

  // Original text: "Are you sure you want to delete this network?"
  deleteNetworkConfirm: 'Är du säker du vill radera detta nätverket?',

  // Original text: 'This network is currently in use'
  networkInUse: 'Detta nätverket används redan',

  // Original text: 'Bonded'
  pillBonded: undefined,

  // Original text: 'Host'
  addHostSelectHost: 'Värd',

  // Original text: 'No host'
  addHostNoHost: 'Ingen värd',

  // Original text: 'No host selected to be added'
  addHostNoHostMessage: 'Ingen värd vald för att läggas till',

  // Original text: "Xen Orchestra"
  xenOrchestra: 'Xen Orchestra',

  // Original text: "No pro support provided!"
  noProSupport: 'Ingen pro support tillhandahållen!',

  // Original text: "Use in production at your own risks"
  noProductionUse: 'Använd i produktion på egen risk',

  // Original text: "You can download our turnkey appliance at {website}""
  downloadXoaFromWebsite: 'Du kan ladda ner vår turnkey appliance på {website}',

  // Original text: "Bug Tracker"
  bugTracker: 'Bug Tracker',

  // Original text: "Issues? Report it!"
  bugTrackerText: 'Problem? Rapportera det!',

  // Original text: "Community"
  community: undefined,

  // Original text: "Join our community forum!"
  communityText: 'Gå med vårat medlemsforum',

  // Original text: "Free Trial for Premium Edition!"
  freeTrial: 'Gratis testperiod för Premium Edition!',

  // Original text: "Request your trial now!"
  freeTrialNow: 'Fråga efter din testperiod nu!',

  // Original text: "Any issue?"
  issues: 'Några problem?',

  // Original text: "Problem? Contact us!"
  issuesText: 'Problem? Kontakta oss!',

  // Original text: "Documentation"
  documentation: 'Dokumentation',

  // Original text: "Read our official doc"
  documentationText: 'Läs vår officiella documentation',

  // Original text: "Pro support included"
  proSupportIncluded: 'Pro support inkluderad',

  // Original text: "Access your XO Account"
  xoAccount: 'Använd ditt XO-konto',

  // Original text: "Report a problem"
  openTicket: 'Rapportera ett problem',

  // Original text: "Problem? Open a ticket!"
  openTicketText: 'Problem? Öppna en ticket!',

  // Original text: "Upgrade needed"
  upgradeNeeded: 'Uppgradering behövs',

  // Original text: "Upgrade now!"
  upgradeNow: 'Uppgradera nu!',

  // Original text: "Or"
  or: 'Eller',

  // Original text: "Try it for free!"
  tryIt: 'Prova nu utan kostnad!',

  // Original text: "This feature is available starting from {plan} Edition"
  availableIn: 'Denna funktionen är tillgänglig från {plan}',

  // Original text: 'This feature is not available in your version, contact your administrator to know more.'
  notAvailable: 'Denna funktionen är inte tillgänlig i din version. Kontakta din administratör för att veta mer.',

  // Original text: 'Updates'
  updateTitle: 'Uppdateringar',

  // Original text: "Registration"
  registration: 'Registrering',

  // Original text: "Trial"
  trial: 'Testperiod',

  // Original text: "Settings"
  settings: 'Inställningar',

  // Original text: 'Proxy settings'
  proxySettings: 'Proxyinställningar',

  // Original text: 'Host (myproxy.example.org)'
  proxySettingsHostPlaceHolder: 'Värd (myproxy.example.org)',

  // Original text: 'Port (eg: 3128)'
  proxySettingsPortPlaceHolder: undefined,

  // Original text: 'Username'
  proxySettingsUsernamePlaceHolder: 'Användarnamn',

  // Original text: 'Password'
  proxySettingsPasswordPlaceHolder: 'Lösenord',

  // Original text: 'Your email account'
  updateRegistrationEmailPlaceHolder: 'Ditt e-postkonto',

  // Original text: 'Your password'
  updateRegistrationPasswordPlaceHolder: 'Ditt lösenord',

  // Original text: "Update"
  update: 'Uppdatera',

  // Original text: 'Refresh'
  refresh: 'Ladda om',

  // Original text: "Upgrade"
  upgrade: 'Uppgradera',

  // Original text: "No updater available for Community Edition"
  noUpdaterCommunity: 'Ingen uppgraderare tillgänglig för Community Edition',

  // Original text: "Please consider subscribe and try it with all features for free during 30 days on {link}.""
  considerSubscribe:
    'Vänligen överväg att prenumera och testa gratis med alla funktioner på {link}',

  // Original text: "Manual update could break your current installation due to dependencies issues, do it with caution"
  noUpdaterWarning:
    'Manuell uppdatering kan förstöra din nuvarande installation. Använd med försiktighet',

  // Original text: "Current version:"
  currentVersion: 'Aktuell version',

  // Original text: "Register"
  register: 'Registrera',

  // Original text: 'Edit registration'
  editRegistration: 'Redigera registrering',

  // Original text: "Please, take time to register in order to enjoy your trial."
  trialRegistration: 'Vänligen registrera för att åtnjuta din gratis testperiod',

  // Original text: "Start trial"
  trialStartButton: 'Starta testperiod',

  // Original text: "You can use a trial version until {date, date, medium}. Upgrade your appliance to get it."
  trialAvailableUntil:
    'Du kan användar testversionen tills {date, date, medium}. Uppgradera din XO appliance för att få den.',

  // Original text: "Your trial has been ended. Contact us or downgrade to Free version"
  trialConsumed: 'Din testperiod har löpt ut. Kontakta oss eller nedgradera till gratisversionen',

  // Original text: "Your xoa-updater service appears to be down. Your XOA cannot run fully without reaching this service."
  trialLocked:
    'Din xoa-uppdaterare verkar vara nere. Din XOA kan inte köra fullt ut utan att nå denna tjänst.',

  // Original text: "No update information available"
  noUpdateInfo: 'Ingen uppdateringsinformation tillgänglig',

  // Original text: "Update information may be available"
  waitingUpdateInfo: 'Uppdateringsinformation kan finnas tillgängligt',

  // Original text: "Your XOA is up-to-date"
  upToDate: 'Din XOA är uppdaterad',

  // Original text: "You need to update your XOA (new version is available)"
  mustUpgrade: 'Du behöver uppdatera din XOA (ny version är tillgänglig)',

  // Original text: "Your XOA is not registered for updates"
  registerNeeded: 'Din XOA är inte registrerad för uppdateringar',

  // Original text: "Can't fetch update information"
  updaterError: 'Kan inte hämta uppdateringsinformation',

  // Original text: 'Upgrade successful'
  promptUpgradeReloadTitle: 'Uppgradering lyckades',

  // Original text: 'Your XOA has successfully upgraded, and your browser must reload the application. Do you want to reload now ?'
  promptUpgradeReloadMessage: 'Din XOA uppgradering lyckades. Din webbläsare behöver ladda om applikationen. Vill du ladda om nu?',

  // Original text: "Xen Orchestra from the sources"
  disclaimerTitle: 'Xen Orchestra från källkod',

  // Original text: "You are using XO from the sources! That's great for a personal/non-profit usage."
  disclaimerText1: 'Du använder XO från källkod! Det är fantastiskt för personligt/ideelt användande.',

  // Original text: "If you are a company, it's better to use it with our appliance + pro support included:"
  disclaimerText2: 'Om ni är ett företag är det bättre att använda vår XO Appliance + Pro support inkluderad:',

  // Original text: "This version is not bundled with any support nor updates. Use it with caution for critical tasks."
  disclaimerText3: 'Denna version inkluderar inte någon support eller uppdateringar. Använd med försiktighet för kritiska uppgifter',

  // Original text: "Connect PIF"
  connectPif: 'Anslut PIF',

  // Original text: "Are you sure you want to connect this PIF?"
  connectPifConfirm: 'Är du säker du vill ansluta denna PIF?',

  // Original text: "Disconnect PIF"
  disconnectPif: 'Koppla bort PIF',

  // Original text: "Are you sure you want to disconnect this PIF?"
  disconnectPifConfirm: 'Är du säker du vill koppla bort denna PIF?',

  // Original text: "Delete PIF"
  deletePif: 'Radera PIF',

  // Original text: "Are you sure you want to delete this PIF?"
  deletePifConfirm: 'Är du säker du vill radera denna PIF?',

  // Original text: 'Connected'
  pifConnected: 'Ansluten',

  // Original text: 'Disconnected'
  pifDisconnected: 'Bortkopplad',

  // Original text: 'Physically connected'
  pifPhysicallyConnected: 'Fysiskt ansluten',

  // Original text: 'Physically disconnected'
  pifPhysicallyDisconnected: 'Fysiskt bortkopplad',

  // Original text: 'Username'
  username: 'Användarnamn',

  // Original text: 'Password'
  password: 'Lösenord',

  // Original text: 'Language'
  language: 'Språk',

  // Original text: 'Old password'
  oldPasswordPlaceholder: 'Gammalt lösenord',

  // Original text: 'New password'
  newPasswordPlaceholder: 'Nytt lösenord',

  // Original text: 'Confirm new password'
  confirmPasswordPlaceholder: 'Bekräfta nytt lösenord',

  // Original text: 'Confirmation password incorrect'
  confirmationPasswordError: 'Lösenordsbekräftelse felaktigt',

  // Original text: 'Password does not match the confirm password.'
  confirmationPasswordErrorBody: 'Lösenordet matchar inte bekräftelselösenordet',

  // Original text: 'Password changed'
  pwdChangeSuccess: 'Lösenord bytt',

  // Original text: 'Your password has been successfully changed.'
  pwdChangeSuccessBody: 'Lösenordet har bytts med lyckat resultat',

  // Original text: 'Incorrect password'
  pwdChangeError: 'Felaktigt lösenord',

  // Original text: 'The old password provided is incorrect. Your password has not been changed.'
  pwdChangeErrorBody: 'Det angivna gamla lösenordet är felaktigt. Ditt lösenord har inte bytts.',

  // Original text: 'OK'
  changePasswordOk: undefined,

  // Original text: 'SSH keys'
  sshKeys: 'SSH-nycklar',

  // Original text: 'New SSH key'
  newSshKey: 'Ny SSH-nyckel',

  // Original text: 'Delete'
  deleteSshKey: 'Radera',

  // Original text: 'No SSH keys'
  noSshKeys: 'Inga SSH-nycklar',

  // Original text: 'New SSH key'
  newSshKeyModalTitle: 'Ny SSH-nyckel',

  // Original text: 'Invalid key'
  sshKeyErrorTitle: 'Ogiltig nyckel',

  // Original text: 'An SSH key requires both a title and a key.'
  sshKeyErrorMessage: 'En SSH-nyckel kräver både titel och nyckel',

  // Original text: 'Title'
  title: 'Titel',

  // Original text: 'Key'
  key: 'Nyckel',

  // Original text: 'Delete SSH key'
  deleteSshKeyConfirm: 'Radera SSH-nyckel',

  // Original text: 'Are you sure you want to delete the SSH key {title}?'
  deleteSshKeyConfirmMessage: 'Är du säker du vill radera SSH-nyckeln {title}',

  // Original text: 'Others'
  others: 'Andra',

  // Original text: 'Loading logs…'
  loadingLogs: 'Laddar loggar',

  // Original text: 'User'
  logUser: 'Användare',

  // Original text: 'Method'
  logMethod: 'Metod',

  // Original text: 'Params'
  logParams: undefined,

  // Original text: 'Message'
  logMessage: 'Meddelande',

  // Original text: 'Error'
  logError: undefined,

  // Original text: 'Display details'
  logDisplayDetails: 'Visa detaljer',

  // Original text: 'Date'
  logTime: 'Datum',

  // Original text: 'No stack trace'
  logNoStackTrace: undefined,

  // Original text: 'No params'
  logNoParams: undefined,

  // Original text: 'Delete log'
  logDelete: 'Radera log',

  // Original text: 'Delete all logs'
  logDeleteAll: 'Radera alla loggar',

  // Original text: 'Delete all logs'
  logDeleteAllTitle: 'Radera alla loggar',

  // Original text: 'Are you sure you want to delete all the logs?'
  logDeleteAllMessage: 'Är du säker du vill radera alla loggar?',

  // Original text: 'Click to enable'
  logIndicationToEnable: 'Klicka för att aktivera',

  // Original text: 'Click to disable'
  logIndicationToDisable: 'Klicka för att inaktivera',

  // Original text: 'Report a bug'
  reportBug: 'Rapportera en bugg',

  // Original text: 'Name'
  ipPoolName: 'Namn',

  // Original text: 'IPs'
  ipPoolIps: undefined,

  // Original text: 'IPs (e.g.: 1.0.0.12-1.0.0.17;1.0.0.23)'
  ipPoolIpsPlaceholder: undefined,

  // Original text: 'Networks'
  ipPoolNetworks: 'Nätverk',

  // Original text: 'No IP pools'
  ipsNoIpPool: 'Inga IP pooler',

  // Original text: 'Create'
  ipsCreate: 'Skapa',

  // Original text: 'Delete all IP pools'
  ipsDeleteAllTitle: 'Radera alla IP pooler',

  // Original text: 'Are you sure you want to delete all the IP pools?'
  ipsDeleteAllMessage: 'Är du säker du vill radera alla IP pooler?',

  // Original text: 'VIFs'
  ipsVifs: undefined,

  // Original text: 'Not used'
  ipsNotUsed: 'Används ej',

  // Original text: 'unknown VIF'
  ipPoolUnknownVif: 'okänd VIF',

  // Original text: 'Name already exists'
  ipPoolNameAlreadyExists: 'Namnet existerar redan',

  // Original text: 'Keyboard shortcuts'
  shortcutModalTitle: 'Tangentbordsgenvägar',

  // Original text: 'Global'
  shortcut_XoApp: undefined,

  // Original text: 'Go to hosts list'
  shortcut_GO_TO_HOSTS: 'Gå till värd-listan',

  // Original text: 'Go to pools list'
  shortcut_GO_TO_POOLS: 'Gå till pool-listan',

  // Original text: 'Go to VMs list'
  shortcut_GO_TO_VMS: 'Gå till VMs-listan',

  // Original text: 'Go to SRs list'
  shortcut_GO_TO_SRS: 'Gå till SRs-listan',

  // Original text: 'Create a new VM'
  shortcut_CREATE_VM: 'Skapa ny VM',

  // Original text: 'Unfocus field'
  shortcut_UNFOCUS: undefined,

  // Original text: 'Show shortcuts key bindings'
  shortcut_HELP: 'Visa genvägarns knappkombinationer',

  // Original text: 'Home'
  shortcut_Home: 'Hem',

  // Original text: 'Focus search bar'
  shortcut_SEARCH: 'Fokusera sökrutan',

  // Original text: 'Next item'
  shortcut_NAV_DOWN: 'Nästa föremål',

  // Original text: 'Previous item'
  shortcut_NAV_UP: 'Föregående föremål',

  // Original text: 'Select item'
  shortcut_SELECT: 'Välj föremål',

  // Original text: 'Open'
  shortcut_JUMP_INTO: 'Öppna',

  // Original text: 'VM'
  settingsAclsButtonTooltipVM: 'VM',

  // Original text: 'Hosts'
  settingsAclsButtonTooltiphost: 'Värdar',

  // Original text: 'Pool'
  settingsAclsButtonTooltippool: 'Pool',

  // Original text: 'SR'
  settingsAclsButtonTooltipSR: undefined,

  // Original text: 'Network'
  settingsAclsButtonTooltipnetwork: 'Nätverk',

  // Original text: 'No config file selected'
  noConfigFile: 'Ingen konfigurationsfil vald',

  // Original text: 'Try dropping a config file here, or click to select a config file to upload.'
  importTip: 'Prova släpp en konfigurationsfil här, eller klicka för att välja en att ladda upp.',

  // Original text: 'Config'
  config: 'Konfiguration',

  // Original text: 'Import'
  importConfig: 'Importera',

  // Original text: 'Config file successfully imported'
  importConfigSuccess: 'Importen av konfigurationsfilen lyckades',

  // Original text: 'Error while importing config file'
  importConfigError: 'Import av konfigurationsfilen misslyckades',

  // Original text: 'Export'
  exportConfig: 'Exportera',

  // Original text: 'Download current config'
  downloadConfig: 'Ladda ner den aktuella konfigurationen',

  // Original text: 'No config import available for Community Edition'
  noConfigImportCommunity: 'Import av konfigurering är inte tillgänglig för Community Edition',

  // Original text: 'Reconnect all hosts'
  srReconnectAllModalTitle: 'Återanslut alla värdar',

  // Original text: 'This will reconnect this SR to all its hosts.'
  srReconnectAllModalMessage: 'Detta kommer återansluta denna SR till alla dess värdar',

  // Original text: 'This will reconnect each selected SR to its host (local SR) or to every hosts of its pool (shared SR).'
  srsReconnectAllModalMessage: 'Detta kommer återansluta varje vald SR till dess värd (lokal SR) eller till varje värd i dess pool (delad SR)',

  // Original text: 'Disconnect all hosts'
  srDisconnectAllModalTitle: 'Koppla bort alla värdar',

  // Original text: 'This will disconnect this SR from all its hosts.'
  srDisconnectAllModalMessage: 'Detta kommer koppla bort denna SR från alla dess värdar',

  // Original text: 'This will disconnect each selected SR from its host (local SR) or from every hosts of its pool (shared SR).'
  srsDisconnectAllModalMessage: 'Detta kommer koppla bort varje vald SR från dess värd (lokal SR) eller från varje värd i dess pool (shared SR)',

  // Original text: 'Forget SR'
  srForgetModalTitle: 'Glöm SR',

  // Original text: 'Forget selected SRs'
  srsForgetModalTitle: 'Glöm markerade SRs',

  // Original text: "Are you sure you want to forget this SR? VDIs on this storage won't be removed."
  srForgetModalMessage: 'Är du säker du vill glömma denna SR? VDIs på denna lagringen kommer inte tas bort.',

  // Original text: "Are you sure you want to forget all the selected SRs? VDIs on these storages won't be removed."
  srsForgetModalMessage: 'Är du säker du vill glömma alla valda SRs? VDIs på dessa lagringarna kommer inte tas bort.',

  // Original text: 'Disconnected'
  srAllDisconnected: 'Bortkopplad',

  // Original text: 'Partially connected'
  srSomeConnected: 'Delvis ansluten',

  // Original text: 'Connected'
  srAllConnected: 'Ansluten',

  // Original text: 'XOSAN'
  xosanTitle: undefined,

  // Original text: 'Xen Orchestra SAN SR'
  xosanSrTitle: undefined,

  // Original text: 'Select local SRs (lvm)'
  xosanAvailableSrsTitle: 'Välj lokal SRs (lvm)',

  // Original text: 'Suggestions'
  xosanSuggestions: 'Förslag',

  // Original text: 'Name'
  xosanName: 'Namn',

  // Original text: 'Host'
  xosanHost: 'Värd',

  // Original text: 'Hosts'
  xosanHosts: 'Värdar',

  // Original text: 'Volume ID'
  xosanVolumeId: undefined,

  // Original text: 'Size'
  xosanSize: 'Storlek',

  // Original text: 'Used space'
  xosanUsedSpace: 'Använt utrymme',

  // Original text: 'XOSAN pack needs to be installed on each host of the pool.'
  xosanNeedPack: 'XOSAN paket behöver vara installerad på varje värd i poolen',

  // Original text: 'Install it now!'
  xosanInstallIt: 'Installera det nu!',

  // Original text: 'Some hosts need their toolstack to be restarted before you can create an XOSAN'
  xosanNeedRestart: 'Några värdar behöver starta om sina toolstacks före du kan skapa XOSAN',

  // Original text: 'Restart toolstacks'
  xosanRestartAgents: 'Starta om toolstakcs',

  // Original text: 'Pool master is not running'
  xosanMasterOffline: 'Pool master körs inte',

  // Original text: 'Install XOSAN pack on {pool}'
  xosanInstallPackTitle: 'Installera XOSAN paket på {pool}',

  // Original text: 'Select at least 2 SRs'
  xosanSelect2Srs: 'Välj åtminstone 2 SRs',

  // Original text: 'Layout'
  xosanLayout: undefined,

  // Original text: 'Redundancy'
  xosanRedundancy: 'Redundans',

  // Original text: 'Capacity'
  xosanCapacity: 'Kapacitet',

  // Original text: 'Available space'
  xosanAvailableSpace: 'Tillgängligt utrymme',

  // Original text: '* Can fail without data loss'
  xosanDiskLossLegend: 'Kan fallera utan att data försvinner',

  // Original text: 'Create'
  xosanCreate: 'Skapa',

  // Original text: 'Installing XOSAN. Please wait…'
  xosanInstalling: 'Installerar XOSAN. Vänligen vänta',

  // Original text: 'No XOSAN available for Community Edition'
  xosanCommunity: 'Ingen XOSAN tillgänglig för Community Edition',

  // Original text: 'Install cloud plugin first'
  xosanInstallCloudPlugin: 'Installera cloud plugin först',

  // Original text: 'Load cloud plugin first'
  xosanLoadCloudPlugin: 'Ladda cloud plugin först',

  // Original text: 'Loading…'
  xosanLoading: 'Laddar',

  // Original text: 'XOSAN is not available at the moment'
  xosanNotAvailable: 'XOSAN är inte tillgängligt just nu',

  // Original text: 'Register for the XOSAN beta'
  xosanRegisterBeta: 'Registrera för XOSAN beta',

  // Original text: 'You have successfully registered for the XOSAN beta. Please wait until your request has been approved.'
  xosanSuccessfullyRegistered: 'Regitreringen för XOSAN betan lyckades. Vänligen vänta på att din ansökan blir godkänd',

  // Original text: 'Install XOSAN pack on these hosts:'
  xosanInstallPackOnHosts: 'Installera XOSAN paket på dessa värdar:',

  // Original text: 'Install {pack} v{version}?'
  xosanInstallPack: 'Installera {pack} v{version}?',

  // Original text: 'No compatible XOSAN pack found for your XenServer versions.'
  xosanNoPackFound: 'Inget kompatibelt XOSAN paket hittat för din XenServer version',

  // Original text: 'At least one of these version requirements must be satisfied by all the hosts in this pool:'
  xosanPackRequirements: 'Åtminstone en av dessa versionskrav måste uppfyllas av alla värdar i denna poolen:',
}

