// See http://momentjs.com/docs/#/use-it/browserify/
import 'moment/locale/de'

import reactIntlData from 'react-intl/locale-data/de'
import { addLocaleData } from 'react-intl'
addLocaleData(reactIntlData)

// ===================================================================

export default {
  // Original text: '{key}: {value}'
  keyValue: undefined,

  // Original text: 'Connecting'
  statusConnecting: undefined,

  // Original text: 'Disconnected'
  statusDisconnected: undefined,

  // Original text: 'Loading…'
  statusLoading: undefined,

  // Original text: 'Page not found'
  errorPageNotFound: undefined,

  // Original text: 'no such item'
  errorNoSuchItem: undefined,

  // Original text: 'Long click to edit'
  editableLongClickPlaceholder: undefined,

  // Original text: 'Click to edit'
  editableClickPlaceholder: undefined,

  // Original text: 'Browse files'
  browseFiles: undefined,

  // Original text: 'Show logs'
  showLogs: undefined,

  // Original text: 'OK'
  alertOk: undefined,

  // Original text: 'OK'
  confirmOk: undefined,

  // Original text: 'Cancel'
  genericCancel: undefined,

  // Original text: 'Enter the following text to confirm:'
  enterConfirmText: undefined,

  // Original text: 'On error'
  onError: undefined,

  // Original text: 'Successful'
  successful: undefined,

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

  // Original text: 'Connected remotes'
  filterRemotesOnlyConnected: undefined,

  // Original text: 'Disconnected remotes'
  filterRemotesOnlyDisconnected: undefined,

  // Original text: 'Copy to clipboard'
  copyToClipboard: undefined,

  // Original text: 'Master'
  pillMaster: undefined,

  // Original text: 'Home'
  homePage: undefined,

  // Original text: 'VMs'
  homeVmPage: undefined,

  // Original text: 'Hosts'
  homeHostPage: undefined,

  // Original text: 'Pools'
  homePoolPage: undefined,

  // Original text: 'Templates'
  homeTemplatePage: undefined,

  // Original text: 'Storages'
  homeSrPage: undefined,

  // Original text: 'Dashboard'
  dashboardPage: undefined,

  // Original text: 'Overview'
  overviewDashboardPage: undefined,

  // Original text: 'Visualizations'
  overviewVisualizationDashboardPage: undefined,

  // Original text: 'Statistics'
  overviewStatsDashboardPage: undefined,

  // Original text: 'Health'
  overviewHealthDashboardPage: undefined,

  // Original text: 'Self service'
  selfServicePage: undefined,

  // Original text: 'Backup'
  backupPage: undefined,

  // Original text: 'Jobs'
  jobsPage: undefined,

  // Original text: 'XOA'
  xoaPage: undefined,

  // Original text: 'Updates'
  updatePage: undefined,

  // Original text: 'Licenses'
  licensesPage: undefined,

  // Original text: 'Settings'
  settingsPage: undefined,

  // Original text: 'Servers'
  settingsServersPage: undefined,

  // Original text: 'Users'
  settingsUsersPage: undefined,

  // Original text: 'Groups'
  settingsGroupsPage: undefined,

  // Original text: 'ACLs'
  settingsAclsPage: undefined,

  // Original text: 'Plugins'
  settingsPluginsPage: undefined,

  // Original text: 'Logs'
  settingsLogsPage: undefined,

  // Original text: 'IPs'
  settingsIpsPage: undefined,

  // Original text: 'Config'
  settingsConfigPage: undefined,

  // Original text: 'About'
  aboutPage: undefined,

  // Original text: 'About XO {xoaPlan}'
  aboutXoaPlan: undefined,

  // Original text: 'New'
  newMenu: undefined,

  // Original text: 'Tasks'
  taskMenu: undefined,

  // Original text: 'Tasks'
  taskPage: undefined,

  // Original text: 'VM'
  newVmPage: undefined,

  // Original text: 'Storage'
  newSrPage: undefined,

  // Original text: 'Server'
  newServerPage: undefined,

  // Original text: 'Import'
  newImport: undefined,

  // Original text: 'XOSAN'
  xosan: undefined,

  // Original text: 'Overview'
  backupOverviewPage: undefined,

  // Original text: 'New'
  backupNewPage: undefined,

  // Original text: 'Remotes'
  backupRemotesPage: undefined,

  // Original text: 'Restore'
  backupRestorePage: undefined,

  // Original text: 'File restore'
  backupFileRestorePage: undefined,

  // Original text: 'Schedule'
  schedule: undefined,

  // Original text: 'New VM backup'
  newVmBackup: undefined,

  // Original text: 'Edit VM backup'
  editVmBackup: undefined,

  // Original text: 'Backup'
  backup: undefined,

  // Original text: 'Rolling Snapshot'
  rollingSnapshot: undefined,

  // Original text: 'Delta Backup'
  deltaBackup: undefined,

  // Original text: 'Disaster Recovery'
  disasterRecovery: undefined,

  // Original text: 'Continuous Replication'
  continuousReplication: undefined,

  // Original text: 'Overview'
  jobsOverviewPage: undefined,

  // Original text: 'New'
  jobsNewPage: undefined,

  // Original text: 'Scheduling'
  jobsSchedulingPage: undefined,

  // Original text: 'Custom Job'
  customJob: undefined,

  // Original text: 'User'
  userPage: undefined,

  // Original text: 'XOA'
  xoa: undefined,

  // Original text: 'No support'
  noSupport: undefined,

  // Original text: 'Free upgrade!'
  freeUpgrade: undefined,

  // Original text: 'Sign out'
  signOut: undefined,

  // Original text: 'Edit my settings {username}'
  editUserProfile: undefined,

  // Original text: 'Fetching data…'
  homeFetchingData: undefined,

  // Original text: 'Welcome to Xen Orchestra!'
  homeWelcome: undefined,

  // Original text: 'Add your XenServer hosts or pools'
  homeWelcomeText: undefined,

  // Original text: 'Some XenServers have been registered but are not connected'
  homeConnectServerText: undefined,

  // Original text: 'Want some help?'
  homeHelp: undefined,

  // Original text: 'Add server'
  homeAddServer: undefined,

  // Original text: 'Connect servers'
  homeConnectServer: undefined,

  // Original text: 'Online Doc'
  homeOnlineDoc: undefined,

  // Original text: 'Pro Support'
  homeProSupport: undefined,

  // Original text: 'There are no VMs!'
  homeNoVms: undefined,

  // Original text: 'Or…'
  homeNoVmsOr: undefined,

  // Original text: 'Import VM'
  homeImportVm: undefined,

  // Original text: 'Import an existing VM in xva format'
  homeImportVmMessage: undefined,

  // Original text: 'Restore a backup'
  homeRestoreBackup: undefined,

  // Original text: 'Restore a backup from a remote store'
  homeRestoreBackupMessage: undefined,

  // Original text: 'This will create a new VM'
  homeNewVmMessage: undefined,

  // Original text: 'Filters'
  homeFilters: undefined,

  // Original text: 'No results! Click here to reset your filters'
  homeNoMatches: undefined,

  // Original text: 'Pool'
  homeTypePool: undefined,

  // Original text: 'Host'
  homeTypeHost: undefined,

  // Original text: 'VM'
  homeTypeVm: undefined,

  // Original text: 'SR'
  homeTypeSr: undefined,

  // Original text: 'Template'
  homeTypeVmTemplate: undefined,

  // Original text: 'Sort'
  homeSort: undefined,

  // Original text: 'Pools'
  homeAllPools: undefined,

  // Original text: 'Hosts'
  homeAllHosts: undefined,

  // Original text: 'Tags'
  homeAllTags: undefined,

  // Original text: 'Resource sets'
  homeAllResourceSets: undefined,

  // Original text: 'New VM'
  homeNewVm: undefined,

  // Original text: 'None'
  homeFilterNone: undefined,

  // Original text: 'Running hosts'
  homeFilterRunningHosts: undefined,

  // Original text: 'Disabled hosts'
  homeFilterDisabledHosts: undefined,

  // Original text: 'Running VMs'
  homeFilterRunningVms: undefined,

  // Original text: 'Non running VMs'
  homeFilterNonRunningVms: undefined,

  // Original text: 'Pending VMs'
  homeFilterPendingVms: undefined,

  // Original text: 'HVM guests'
  homeFilterHvmGuests: undefined,

  // Original text: 'Tags'
  homeFilterTags: undefined,

  // Original text: 'Sort by'
  homeSortBy: undefined,

  // Original text: 'CPUs'
  homeSortByCpus: undefined,

  // Original text: 'Name'
  homeSortByName: undefined,

  // Original text: 'Power state'
  homeSortByPowerstate: undefined,

  // Original text: 'RAM'
  homeSortByRAM: undefined,

  // Original text: 'Shared/Not shared'
  homeSortByShared: undefined,

  // Original text: 'Size'
  homeSortBySize: undefined,

  // Original text: 'Type'
  homeSortByType: undefined,

  // Original text: 'Usage'
  homeSortByUsage: undefined,

  // Original text: 'vCPUs'
  homeSortByvCPUs: undefined,

  // Original text: 'Snapshots'
  homeSortVmsBySnapshots: undefined,

  // Original text: '{displayed, number}x {icon} (on {total, number})'
  homeDisplayedItems: undefined,

  // Original text: '{selected, number}x {icon} selected (on {total, number})'
  homeSelectedItems: undefined,

  // Original text: 'More'
  homeMore: undefined,

  // Original text: 'Migrate to…'
  homeMigrateTo: undefined,

  // Original text: 'Missing patches'
  homeMissingPaths: undefined,

  // Original text: 'Master:'
  homePoolMaster: undefined,

  // Original text: 'Resource set: {resourceSet}'
  homeResourceSet: undefined,

  // Original text: 'High Availability'
  highAvailability: undefined,

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

  // Original text: 'Add'
  add: undefined,

  // Original text: 'Select all'
  selectAll: undefined,

  // Original text: 'Remove'
  remove: undefined,

  // Original text: 'Preview'
  preview: undefined,

  // Original text: 'Action'
  action: undefined,

  // Original text: 'Item'
  item: undefined,

  // Original text: 'No selected value'
  noSelectedValue: undefined,

  // Original text: 'Choose user(s) and/or group(s)'
  selectSubjects: undefined,

  // Original text: 'Select Object(s)…'
  selectObjects: undefined,

  // Original text: 'Choose a role'
  selectRole: undefined,

  // Original text: 'Select Host(s)…'
  selectHosts: undefined,

  // Original text: 'Select object(s)…'
  selectHostsVms: undefined,

  // Original text: 'Select Network(s)…'
  selectNetworks: undefined,

  // Original text: 'Select PIF(s)…'
  selectPifs: undefined,

  // Original text: 'Select Pool(s)…'
  selectPools: undefined,

  // Original text: 'Select Remote(s)…'
  selectRemotes: undefined,

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
  selectSshKey: undefined,

  // Original text: 'Select SR(s)…'
  selectSrs: undefined,

  // Original text: 'Select VM(s)…'
  selectVms: undefined,

  // Original text: 'Select snapshot(s)…'
  selectVmSnapshots: undefined,

  // Original text: 'Select VM template(s)…'
  selectVmTemplates: undefined,

  // Original text: 'Select tag(s)…'
  selectTags: undefined,

  // Original text: 'Select disk(s)…'
  selectVdis: undefined,

  // Original text: 'Select timezone…'
  selectTimezone: undefined,

  // Original text: 'Select IP(s)…'
  selectIp: undefined,

  // Original text: 'Select IP pool(s)…'
  selectIpPool: undefined,

  // Original text: 'Select VGPU type(s)…'
  selectVgpuType: undefined,

  // Original text: 'Fill required informations.'
  fillRequiredInformations: undefined,

  // Original text: 'Fill informations (optional)'
  fillOptionalInformations: undefined,

  // Original text: 'Reset'
  selectTableReset: undefined,

  // Original text: 'Month'
  schedulingMonth: undefined,

  // Original text: 'Every N month'
  schedulingEveryNMonth: undefined,

  // Original text: 'Each selected month'
  schedulingEachSelectedMonth: undefined,

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

  // Original text: 'Hour'
  schedulingHour: undefined,

  // Original text: 'Each selected hour'
  schedulingEachSelectedHour: undefined,

  // Original text: 'Every N hour'
  schedulingEveryNHour: undefined,

  // Original text: 'Minute'
  schedulingMinute: undefined,

  // Original text: 'Each selected minute'
  schedulingEachSelectedMinute: undefined,

  // Original text: 'Every N minute'
  schedulingEveryNMinute: undefined,

  // Original text: 'Every month'
  selectTableAllMonth: undefined,

  // Original text: 'Every day'
  selectTableAllDay: undefined,

  // Original text: 'Every hour'
  selectTableAllHour: undefined,

  // Original text: 'Every minute'
  selectTableAllMinute: undefined,

  // Original text: 'Reset'
  schedulingReset: undefined,

  // Original text: 'Unknown'
  unknownSchedule: undefined,

  // Original text: 'Web browser timezone'
  timezonePickerUseLocalTime: undefined,

  // Original text: 'Server timezone ({value})'
  serverTimezoneOption: undefined,

  // Original text: 'Cron Pattern:'
  cronPattern: undefined,

  // Original text: 'Cannot edit backup'
  backupEditNotFoundTitle: undefined,

  // Original text: 'Missing required info for edition'
  backupEditNotFoundMessage: undefined,

  // Original text: 'Successful'
  successfulJobCall: undefined,

  // Original text: 'Failed'
  failedJobCall: undefined,

  // Original text: 'Skipped'
  jobCallSkipped: undefined,

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

  // Original text: 'Job'
  job: undefined,

  // Original text: 'Job {job}'
  jobModalTitle: undefined,

  // Original text: 'ID'
  jobId: undefined,

  // Original text: 'Type'
  jobType: undefined,

  // Original text: 'Name'
  jobName: undefined,

  // Original text: 'Mode'
  jobMode: undefined,

  // Original text: 'Name of your job (forbidden: "_")'
  jobNamePlaceholder: undefined,

  // Original text: 'Start'
  jobStart: undefined,

  // Original text: 'End'
  jobEnd: undefined,

  // Original text: 'Duration'
  jobDuration: undefined,

  // Original text: 'Status'
  jobStatus: undefined,

  // Original text: 'Action'
  jobAction: undefined,

  // Original text: 'Tag'
  jobTag: undefined,

  // Original text: 'Scheduling'
  jobScheduling: undefined,

  // Original text: 'State'
  jobState: undefined,

  // Original text: 'Enabled'
  jobStateEnabled: undefined,

  // Original text: 'Disabled'
  jobStateDisabled: undefined,

  // Original text: 'Timezone'
  jobTimezone: undefined,

  // Original text: 'Server'
  jobServerTimezone: undefined,

  // Original text: 'Run job'
  runJob: undefined,

  // Original text: 'Are you sure you want to run {backupType} {id} ({tag})?'
  runJobConfirm: undefined,

  // Original text: 'One shot running started. See overview for logs.'
  runJobVerbose: undefined,

  // Original text: 'Edit job'
  jobEdit: undefined,

  // Original text: 'Delete'
  jobDelete: undefined,

  // Original text: 'Finished'
  jobFinished: undefined,

  // Original text: 'Interrupted'
  jobInterrupted: undefined,

  // Original text: 'Started'
  jobStarted: undefined,

  // Original text: 'Save'
  saveBackupJob: undefined,

  // Original text: 'Reset'
  resetBackupJob: undefined,

  // Original text: 'Create'
  createBackupJob: undefined,

  // Original text: 'Remove backup job'
  deleteBackupSchedule: undefined,

  // Original text: 'Are you sure you want to delete this backup job?'
  deleteBackupScheduleQuestion: undefined,

  // Original text: 'Delete selected jobs'
  deleteSelectedJobs: undefined,

  // Original text: 'Enable immediately after creation'
  scheduleEnableAfterCreation: undefined,

  // Original text: 'You are editing Schedule {name} ({id}). Saving will override previous schedule state.'
  scheduleEditMessage: undefined,

  // Original text: 'You are editing job {name} ({id}). Saving will override previous job state.'
  jobEditMessage: undefined,

  // Original text: 'Edit schedule'
  scheduleEdit: undefined,

  // Original text: 'Save'
  scheduleSave: undefined,

  // Original text: 'Cancel'
  cancelScheduleEdition: undefined,

  // Original text: 'Add a schedule'
  scheduleAdd: undefined,

  // Original text: 'Delete'
  scheduleDelete: undefined,

  // Original text: 'Run schedule'
  scheduleRun: undefined,

  // Original text: 'Delete selected schedules'
  deleteSelectedSchedules: undefined,

  // Original text: 'No scheduled jobs.'
  noScheduledJobs: undefined,

  // Original text: 'New schedule'
  newSchedule: undefined,

  // Original text: 'No jobs found.'
  noJobs: undefined,

  // Original text: 'No schedules found'
  noSchedules: undefined,

  // Original text: 'Select a xo-server API command'
  jobActionPlaceHolder: undefined,

  // Original text: 'Timeout (number of seconds after which a VM is considered failed)'
  jobTimeoutPlaceHolder: undefined,

  // Original text: 'Schedules'
  jobSchedules: undefined,

  // Original text: 'Name of your schedule'
  jobScheduleNamePlaceHolder: undefined,

  // Original text: 'Select a Job'
  jobScheduleJobPlaceHolder: undefined,

  // Original text: 'Job owner'
  jobOwnerPlaceholder: undefined,

  // Original text: "This job's creator no longer exists"
  jobUserNotFound: undefined,

  // Original text: "This backup's creator no longer exists"
  backupUserNotFound: undefined,

  // Original text: 'Click here to see the matching VMs'
  redirectToMatchingVms: undefined,

  // Original text: 'There are no matching VMs!'
  noMatchingVms: undefined,

  // Original text: '{icon} See the matching VMs ({nMatchingVms, number})'
  allMatchingVms: undefined,

  // Original text: 'Backup owner'
  backupOwner: undefined,

  // Original text: 'Migrate to backup NG'
  migrateBackupSchedule: undefined,

  // Original text: 'This will migrate this backup to a backup NG. This operation is not reversible. Do you want to continue?'
  migrateBackupScheduleMessage: undefined,

  // Original text: 'Are you sure you want to run {name} ({id})?'
  runBackupNgJobConfirm: undefined,

  // Original text: 'Select your backup type:'
  newBackupSelection: undefined,

  // Original text: 'Select backup mode:'
  smartBackupModeSelection: undefined,

  // Original text: 'Normal backup'
  normalBackup: undefined,

  // Original text: 'Smart backup'
  smartBackup: undefined,

  // Original text: 'Export retention'
  exportRetention: undefined,

  // Original text: 'Snapshot retention'
  snapshotRetention: undefined,

  // Original text: 'Name'
  backupName: undefined,

  // Original text: 'Use delta'
  useDelta: undefined,

  // Original text: 'Use compression'
  useCompression: undefined,

  // Original text: 'Delta Backup and DR require Entreprise plan'
  dbAndDrRequireEntreprisePlan: undefined,

  // Original text: 'CR requires Premium plan'
  crRequiresPremiumPlan: undefined,

  // Original text: 'Smart mode'
  smartBackupModeTitle: undefined,

  // Original text: 'Target remotes (for Export)'
  backupTargetRemotes: undefined,

  // Original text: 'Target SRs (for Replication)'
  backupTargetSrs: undefined,

  // Original text: 'Local remote selected'
  localRemoteWarningTitle: undefined,

  // Original text: 'Warning: local remotes will use limited XOA disk space. Only for advanced users.'
  localRemoteWarningMessage: undefined,

  // Original text: 'Warning: this feature works only with XenServer 6.5 or newer.'
  backupVersionWarning: undefined,

  // Original text: 'VMs'
  editBackupVmsTitle: undefined,

  // Original text: 'VMs statuses'
  editBackupSmartStatusTitle: undefined,

  // Original text: 'Resident on'
  editBackupSmartResidentOn: undefined,

  // Original text: 'Not resident on'
  editBackupSmartNotResidentOn: undefined,

  // Original text: 'Pools'
  editBackupSmartPools: undefined,

  // Original text: 'Tags'
  editBackupSmartTags: undefined,

  // Original text: 'Sample of matching Vms'
  sampleOfMatchingVms: undefined,

  // Original text: 'VMs Tags'
  editBackupSmartTagsTitle: undefined,

  // Original text: 'Excluded VMs tags'
  editBackupSmartExcludedTagsTitle: undefined,

  // Original text: 'Reverse'
  editBackupNot: undefined,

  // Original text: 'Tag'
  editBackupTagTitle: undefined,

  // Original text: 'Report'
  editBackupReportTitle: undefined,

  // Original text: 'Automatically run as scheduled'
  editBackupScheduleEnabled: undefined,

  // Original text: 'Retention'
  editBackupRetentionTitle: undefined,

  // Original text: 'Remote'
  editBackupRemoteTitle: undefined,

  // Original text: 'Delete the old backups first'
  deleteOldBackupsFirst: undefined,

  // Original text: 'Remote stores for backup'
  remoteList: undefined,

  // Original text: 'New File System Remote'
  newRemote: undefined,

  // Original text: 'Local'
  remoteTypeLocal: undefined,

  // Original text: 'NFS'
  remoteTypeNfs: undefined,

  // Original text: 'SMB'
  remoteTypeSmb: undefined,

  // Original text: 'Type'
  remoteType: undefined,

  // Original text: 'SMB remotes are meant to work on Windows Server. For other systems (Linux Samba, which means almost all NAS), please use NFS.'
  remoteSmbWarningMessage: undefined,

  // Original text: 'Test your remote'
  remoteTestTip: undefined,

  // Original text: 'Test Remote'
  testRemote: undefined,

  // Original text: 'Test failed for {name}'
  remoteTestFailure: undefined,

  // Original text: 'Test passed for {name}'
  remoteTestSuccess: undefined,

  // Original text: 'Error'
  remoteTestError: undefined,

  // Original text: 'Test Step'
  remoteTestStep: undefined,

  // Original text: 'Test file'
  remoteTestFile: undefined,

  // Original text: 'Test name'
  remoteTestName: undefined,

  // Original text: 'Remote name already exists!'
  remoteTestNameFailure: undefined,

  // Original text: 'The remote appears to work correctly'
  remoteTestSuccessMessage: undefined,

  // Original text: 'Connection failed'
  remoteConnectionFailed: undefined,

  // Original text: 'Delete backup job{nJobs, plural, one {} other {s}}'
  confirmDeleteBackupJobsTitle: undefined,

  // Original text: 'Are you sure you want to delete {nJobs, number} backup job{nJobs, plural, one {} other {s}}?'
  confirmDeleteBackupJobsBody: undefined,

  // Original text: 'Name'
  remoteName: undefined,

  // Original text: 'Path'
  remotePath: undefined,

  // Original text: 'State'
  remoteState: undefined,

  // Original text: 'Device'
  remoteDevice: undefined,

  // Original text: 'Share'
  remoteShare: undefined,

  // Original text: 'Action'
  remoteAction: undefined,

  // Original text: 'Auth'
  remoteAuth: undefined,

  // Original text: 'Mounted'
  remoteMounted: undefined,

  // Original text: 'Unmounted'
  remoteUnmounted: undefined,

  // Original text: 'Connect'
  remoteConnectTip: undefined,

  // Original text: 'Disconnect'
  remoteDisconnectTip: undefined,

  // Original text: 'Connected'
  remoteConnected: undefined,

  // Original text: 'Disconnected'
  remoteDisconnected: undefined,

  // Original text: 'Delete'
  remoteDeleteTip: undefined,

  // Original text: 'Delete selected remotes'
  remoteDeleteSelected: undefined,

  // Original text: 'remote name *'
  remoteNamePlaceHolder: undefined,

  // Original text: 'Name *'
  remoteMyNamePlaceHolder: undefined,

  // Original text: '/path/to/backup'
  remoteLocalPlaceHolderPath: undefined,

  // Original text: 'host *'
  remoteNfsPlaceHolderHost: undefined,

  // Original text: 'path/to/backup'
  remoteNfsPlaceHolderPath: undefined,

  // Original text: 'subfolder [path\\\\to\\\\backup]'
  remoteSmbPlaceHolderRemotePath: undefined,

  // Original text: 'Username'
  remoteSmbPlaceHolderUsername: undefined,

  // Original text: 'Password'
  remoteSmbPlaceHolderPassword: undefined,

  // Original text: 'Domain'
  remoteSmbPlaceHolderDomain: undefined,

  // Original text: '<address>\\\\<share> *'
  remoteSmbPlaceHolderAddressShare: undefined,

  // Original text: 'password(fill to edit)'
  remotePlaceHolderPassword: undefined,

  // Original text: 'Create a new SR'
  newSrTitle: undefined,

  // Original text: 'General'
  newSrGeneral: undefined,

  // Original text: 'Select Storage Type:'
  newSrTypeSelection: undefined,

  // Original text: 'Settings'
  newSrSettings: undefined,

  // Original text: 'Storage Usage'
  newSrUsage: undefined,

  // Original text: 'Summary'
  newSrSummary: undefined,

  // Original text: 'Host'
  newSrHost: undefined,

  // Original text: 'Type'
  newSrType: undefined,

  // Original text: 'Name'
  newSrName: undefined,

  // Original text: 'Description'
  newSrDescription: undefined,

  // Original text: 'Server'
  newSrServer: undefined,

  // Original text: 'Path'
  newSrPath: undefined,

  // Original text: 'IQN'
  newSrIqn: undefined,

  // Original text: 'LUN'
  newSrLun: undefined,

  // Original text: 'No HBA devices'
  newSrNoHba: undefined,

  // Original text: 'with auth.'
  newSrAuth: undefined,

  // Original text: 'User Name'
  newSrUsername: undefined,

  // Original text: 'Password'
  newSrPassword: undefined,

  // Original text: 'Device'
  newSrDevice: undefined,

  // Original text: 'in use'
  newSrInUse: undefined,

  // Original text: 'Size'
  newSrSize: undefined,

  // Original text: 'Create'
  newSrCreate: undefined,

  // Original text: 'Storage name'
  newSrNamePlaceHolder: undefined,

  // Original text: 'Storage description'
  newSrDescPlaceHolder: undefined,

  // Original text: 'Address'
  newSrAddressPlaceHolder: undefined,

  // Original text: '[port]'
  newSrPortPlaceHolder: undefined,

  // Original text: 'Username'
  newSrUsernamePlaceHolder: undefined,

  // Original text: 'Password'
  newSrPasswordPlaceHolder: undefined,

  // Original text: 'Device, e.g /dev/sda…'
  newSrLvmDevicePlaceHolder: undefined,

  // Original text: '/path/to/directory'
  newSrLocalPathPlaceHolder: undefined,

  // Original text: 'Use NFSv4'
  newSrUseNfs4: undefined,

  // Original text: 'Comma delimited NFS options'
  newSrNfsOptions: undefined,

  // Original text: 'Users/Groups'
  subjectName: undefined,

  // Original text: 'Object'
  objectName: undefined,

  // Original text: 'No acls found'
  aclNoneFound: undefined,

  // Original text: 'Role'
  roleName: undefined,

  // Original text: 'Create'
  aclCreate: undefined,

  // Original text: 'New Group Name'
  newGroupName: undefined,

  // Original text: 'Create Group'
  createGroup: undefined,

  // Original text: 'Create'
  createGroupButton: undefined,

  // Original text: 'Delete Group'
  deleteGroup: undefined,

  // Original text: 'Are you sure you want to delete this group?'
  deleteGroupConfirm: undefined,

  // Original text: 'Remove user from Group'
  removeUserFromGroup: undefined,

  // Original text: 'Are you sure you want to delete this user?'
  deleteUserConfirm: undefined,

  // Original text: 'Delete User'
  deleteUser: undefined,

  // Original text: 'no user'
  noUser: undefined,

  // Original text: 'unknown user'
  unknownUser: undefined,

  // Original text: 'No group found'
  noGroupFound: undefined,

  // Original text: 'Name'
  groupNameColumn: undefined,

  // Original text: 'Users'
  groupUsersColumn: undefined,

  // Original text: 'Add User'
  addUserToGroupColumn: undefined,

  // Original text: 'Username'
  userNameColumn: undefined,

  // Original text: 'Permissions'
  userPermissionColumn: undefined,

  // Original text: 'Password'
  userPasswordColumn: undefined,

  // Original text: 'Username'
  userName: undefined,

  // Original text: 'Password'
  userPassword: undefined,

  // Original text: 'Create'
  createUserButton: undefined,

  // Original text: 'No user found'
  noUserFound: undefined,

  // Original text: 'User'
  userLabel: undefined,

  // Original text: 'Admin'
  adminLabel: undefined,

  // Original text: 'No user in group'
  noUserInGroup: undefined,

  // Original text: '{users, number} user{users, plural, one {} other {s}}'
  countUsers: undefined,

  // Original text: 'Select Permission'
  selectPermission: undefined,

  // Original text: 'No plugins found'
  noPlugins: undefined,

  // Original text: 'Auto-load at server start'
  autoloadPlugin: undefined,

  // Original text: 'Save configuration'
  savePluginConfiguration: undefined,

  // Original text: 'Delete configuration'
  deletePluginConfiguration: undefined,

  // Original text: 'Plugin error'
  pluginError: undefined,

  // Original text: 'Unknown error'
  unknownPluginError: undefined,

  // Original text: 'Purge plugin configuration'
  purgePluginConfiguration: undefined,

  // Original text: 'Are you sure you want to purge this configuration ?'
  purgePluginConfigurationQuestion: undefined,

  // Original text: 'Edit'
  editPluginConfiguration: undefined,

  // Original text: 'Cancel'
  cancelPluginEdition: undefined,

  // Original text: 'Plugin configuration'
  pluginConfigurationSuccess: undefined,

  // Original text: 'Plugin configuration successfully saved!'
  pluginConfigurationChanges: undefined,

  // Original text: 'Predefined configuration'
  pluginConfigurationPresetTitle: undefined,

  // Original text: 'Choose a predefined configuration.'
  pluginConfigurationChoosePreset: undefined,

  // Original text: 'Apply'
  applyPluginPreset: undefined,

  // Original text: 'Save filter error'
  saveNewUserFilterErrorTitle: undefined,

  // Original text: 'Bad parameter: name must be given.'
  saveNewUserFilterErrorBody: undefined,

  // Original text: 'Name:'
  filterName: undefined,

  // Original text: 'Value:'
  filterValue: undefined,

  // Original text: 'Save new filter'
  saveNewFilterTitle: undefined,

  // Original text: 'Set custom filters'
  setUserFiltersTitle: undefined,

  // Original text: 'Are you sure you want to set custom filters?'
  setUserFiltersBody: undefined,

  // Original text: 'Remove custom filter'
  removeUserFilterTitle: undefined,

  // Original text: 'Are you sure you want to remove custom filter?'
  removeUserFilterBody: undefined,

  // Original text: 'Default filter'
  defaultFilter: undefined,

  // Original text: 'Default filters'
  defaultFilters: undefined,

  // Original text: 'Custom filters'
  customFilters: undefined,

  // Original text: 'Customize filters'
  customizeFilters: undefined,

  // Original text: 'Save custom filters'
  saveCustomFilters: undefined,

  // Original text: 'Start'
  startVmLabel: undefined,

  // Original text: 'Recovery start'
  recoveryModeLabel: undefined,

  // Original text: 'Suspend'
  suspendVmLabel: undefined,

  // Original text: 'Stop'
  stopVmLabel: undefined,

  // Original text: 'Force shutdown'
  forceShutdownVmLabel: undefined,

  // Original text: 'Reboot'
  rebootVmLabel: undefined,

  // Original text: 'Force reboot'
  forceRebootVmLabel: undefined,

  // Original text: 'Delete'
  deleteVmLabel: undefined,

  // Original text: 'Migrate'
  migrateVmLabel: undefined,

  // Original text: 'Snapshot'
  snapshotVmLabel: undefined,

  // Original text: 'Export'
  exportVmLabel: undefined,

  // Original text: 'Resume'
  resumeVmLabel: undefined,

  // Original text: 'Copy'
  copyVmLabel: undefined,

  // Original text: 'Clone'
  cloneVmLabel: undefined,

  // Original text: 'Fast clone'
  fastCloneVmLabel: undefined,

  // Original text: 'Convert to template'
  convertVmToTemplateLabel: undefined,

  // Original text: 'Console'
  vmConsoleLabel: undefined,

  // Original text: 'Name'
  srUnhealthyVdiNameLabel: undefined,

  // Original text: 'Size'
  srUnhealthyVdiSize: undefined,

  // Original text: 'Depth'
  srUnhealthyVdiDepth: undefined,

  // Original text: 'VDI to coalesce ({total, number})'
  srUnhealthyVdiTitle: undefined,

  // Original text: 'Rescan all disks'
  srRescan: undefined,

  // Original text: 'Connect to all hosts'
  srReconnectAll: undefined,

  // Original text: 'Disconnect from all hosts'
  srDisconnectAll: undefined,

  // Original text: 'Forget this SR'
  srForget: undefined,

  // Original text: 'Forget SRs'
  srsForget: undefined,

  // Original text: 'Remove this SR'
  srRemoveButton: undefined,

  // Original text: 'No VDIs in this storage'
  srNoVdis: undefined,

  // Original text: 'Pool RAM usage:'
  poolTitleRamUsage: undefined,

  // Original text: '{used} used on {total} ({free} free)'
  poolRamUsage: undefined,

  // Original text: 'Master:'
  poolMaster: undefined,

  // Original text: 'Display all hosts of this pool'
  displayAllHosts: undefined,

  // Original text: 'Display all storages of this pool'
  displayAllStorages: undefined,

  // Original text: 'Display all VMs of this pool'
  displayAllVMs: undefined,

  // Original text: 'Hosts'
  hostsTabName: undefined,

  // Original text: 'Vms'
  vmsTabName: undefined,

  // Original text: 'Srs'
  srsTabName: undefined,

  // Original text: 'High Availability'
  poolHaStatus: undefined,

  // Original text: 'Enabled'
  poolHaEnabled: undefined,

  // Original text: 'Disabled'
  poolHaDisabled: undefined,

  // Original text: 'Master'
  setpoolMaster: undefined,

  // Original text: 'GPU groups'
  poolGpuGroups: undefined,

  // Original text: 'Name'
  hostNameLabel: undefined,

  // Original text: 'Description'
  hostDescription: undefined,

  // Original text: 'Memory'
  hostMemory: undefined,

  // Original text: 'No hosts'
  noHost: undefined,

  // Original text: '{used}% used ({free} free)'
  memoryLeftTooltip: undefined,

  // Original text: 'PIF'
  pif: undefined,

  // Original text: 'Name'
  poolNetworkNameLabel: undefined,

  // Original text: 'Description'
  poolNetworkDescription: undefined,

  // Original text: 'PIFs'
  poolNetworkPif: undefined,

  // Original text: 'No networks'
  poolNoNetwork: undefined,

  // Original text: 'MTU'
  poolNetworkMTU: undefined,

  // Original text: 'Connected'
  poolNetworkPifAttached: undefined,

  // Original text: 'Disconnected'
  poolNetworkPifDetached: undefined,

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

  // Original text: 'Add SR'
  addSrLabel: undefined,

  // Original text: 'Add VM'
  addVmLabel: undefined,

  // Original text: 'Add Host'
  addHostLabel: undefined,

  // Original text: 'This host needs to install {patches, number} patch{patches, plural, one {} other {es}} before it can be added to the pool. This operation may be long.'
  hostNeedsPatchUpdate: undefined,

  // Original text: "This host cannot be added to the pool because it's missing some patches."
  hostNeedsPatchUpdateNoInstall: undefined,

  // Original text: 'Adding host failed'
  addHostErrorTitle: undefined,

  // Original text: 'Host patches could not be homogenized.'
  addHostNotHomogeneousErrorMessage: undefined,

  // Original text: 'Disconnect'
  disconnectServer: undefined,

  // Original text: 'Start'
  startHostLabel: undefined,

  // Original text: 'Stop'
  stopHostLabel: undefined,

  // Original text: 'Enable'
  enableHostLabel: undefined,

  // Original text: 'Disable'
  disableHostLabel: undefined,

  // Original text: 'Restart toolstack'
  restartHostAgent: undefined,

  // Original text: 'Force reboot'
  forceRebootHostLabel: undefined,

  // Original text: 'Reboot'
  rebootHostLabel: undefined,

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

  // Original text: 'Emergency mode'
  emergencyModeLabel: undefined,

  // Original text: 'Storage'
  storageTabName: undefined,

  // Original text: 'Patches'
  patchesTabName: undefined,

  // Original text: 'Load average'
  statLoad: undefined,

  // Original text: 'Host RAM usage:'
  hostTitleRamUsage: undefined,

  // Original text: 'RAM: {memoryUsed} used on {memoryTotal} ({memoryFree} free)'
  memoryHostState: undefined,

  // Original text: 'Hardware'
  hardwareHostSettingsLabel: undefined,

  // Original text: 'Address'
  hostAddress: undefined,

  // Original text: 'Status'
  hostStatus: undefined,

  // Original text: 'Build number'
  hostBuildNumber: undefined,

  // Original text: 'iSCSI name'
  hostIscsiName: undefined,

  // Original text: 'Version'
  hostXenServerVersion: undefined,

  // Original text: 'Enabled'
  hostStatusEnabled: undefined,

  // Original text: 'Disabled'
  hostStatusDisabled: undefined,

  // Original text: 'Power on mode'
  hostPowerOnMode: undefined,

  // Original text: 'Host uptime'
  hostStartedSince: undefined,

  // Original text: 'Toolstack uptime'
  hostStackStartedSince: undefined,

  // Original text: 'CPU model'
  hostCpusModel: undefined,

  // Original text: 'GPUs'
  hostGpus: undefined,

  // Original text: 'Core (socket)'
  hostCpusNumber: undefined,

  // Original text: 'Manufacturer info'
  hostManufacturerinfo: undefined,

  // Original text: 'BIOS info'
  hostBiosinfo: undefined,

  // Original text: 'License'
  licenseHostSettingsLabel: undefined,

  // Original text: 'Type'
  hostLicenseType: undefined,

  // Original text: 'Socket'
  hostLicenseSocket: undefined,

  // Original text: 'Expiry'
  hostLicenseExpiry: undefined,

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

  // Original text: 'Add a network'
  networkCreateButton: undefined,

  // Original text: 'Add a bonded network'
  networkCreateBondedButton: undefined,

  // Original text: 'Device'
  pifDeviceLabel: undefined,

  // Original text: 'Network'
  pifNetworkLabel: undefined,

  // Original text: 'VLAN'
  pifVlanLabel: undefined,

  // Original text: 'Address'
  pifAddressLabel: undefined,

  // Original text: 'Mode'
  pifModeLabel: undefined,

  // Original text: 'MAC'
  pifMacLabel: undefined,

  // Original text: 'MTU'
  pifMtuLabel: undefined,

  // Original text: 'Status'
  pifStatusLabel: undefined,

  // Original text: 'Connected'
  pifStatusConnected: undefined,

  // Original text: 'Disconnected'
  pifStatusDisconnected: undefined,

  // Original text: 'No physical interface detected'
  pifNoInterface: undefined,

  // Original text: 'This interface is currently in use'
  pifInUse: undefined,

  // Original text: 'Action'
  pifAction: undefined,

  // Original text: 'Default locking mode'
  defaultLockingMode: undefined,

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

  // Original text: 'Add a storage'
  addSrDeviceButton: undefined,

  // Original text: 'Name'
  srNameLabel: undefined,

  // Original text: 'Type'
  srType: undefined,

  // Original text: 'Action'
  pbdAction: undefined,

  // Original text: 'Status'
  pbdStatus: undefined,

  // Original text: 'Connected'
  pbdStatusConnected: undefined,

  // Original text: 'Disconnected'
  pbdStatusDisconnected: undefined,

  // Original text: 'Connect'
  pbdConnect: undefined,

  // Original text: 'Disconnect'
  pbdDisconnect: undefined,

  // Original text: 'Forget'
  pbdForget: undefined,

  // Original text: 'Shared'
  srShared: undefined,

  // Original text: 'Not shared'
  srNotShared: undefined,

  // Original text: 'No storage detected'
  pbdNoSr: undefined,

  // Original text: 'Name'
  patchNameLabel: undefined,

  // Original text: 'Install all patches'
  patchUpdateButton: undefined,

  // Original text: 'Description'
  patchDescription: undefined,

  // Original text: 'Applied date'
  patchApplied: undefined,

  // Original text: 'Size'
  patchSize: undefined,

  // Original text: 'Status'
  patchStatus: undefined,

  // Original text: 'Applied'
  patchStatusApplied: undefined,

  // Original text: 'Missing patches'
  patchStatusNotApplied: undefined,

  // Original text: 'No patches detected'
  patchNothing: undefined,

  // Original text: 'Release date'
  patchReleaseDate: undefined,

  // Original text: 'Guidance'
  patchGuidance: undefined,

  // Original text: 'Action'
  patchAction: undefined,

  // Original text: 'Applied patches'
  hostAppliedPatches: undefined,

  // Original text: 'Missing patches'
  hostMissingPatches: undefined,

  // Original text: 'Host up-to-date!'
  hostUpToDate: undefined,

  // Original text: 'Non-recommended patch install'
  installPatchWarningTitle: undefined,

  // Original text: 'This will install a patch only on this host. This is NOT the recommended way: please go into the Pool patch view and follow instructions there. If you are sure about this, you can continue anyway'
  installPatchWarningContent: undefined,

  // Original text: 'Go to pool'
  installPatchWarningReject: undefined,

  // Original text: 'Install'
  installPatchWarningResolve: undefined,

  // Original text: 'Refresh patches'
  refreshPatches: undefined,

  // Original text: 'Install pool patches'
  installPoolPatches: undefined,

  // Original text: 'Default SR'
  defaultSr: undefined,

  // Original text: 'Set as default SR'
  setAsDefaultSr: undefined,

  // Original text: 'General'
  generalTabName: undefined,

  // Original text: 'Stats'
  statsTabName: undefined,

  // Original text: 'Console'
  consoleTabName: undefined,

  // Original text: 'Container'
  containersTabName: undefined,

  // Original text: 'Snapshots'
  snapshotsTabName: undefined,

  // Original text: 'Logs'
  logsTabName: undefined,

  // Original text: 'Advanced'
  advancedTabName: undefined,

  // Original text: 'Network'
  networkTabName: undefined,

  // Original text: 'Disk{disks, plural, one {} other {s}}'
  disksTabName: undefined,

  // Original text: 'halted'
  powerStateHalted: undefined,

  // Original text: 'running'
  powerStateRunning: undefined,

  // Original text: 'suspended'
  powerStateSuspended: undefined,

  // Original text: 'No Xen tools detected'
  vmStatus: undefined,

  // Original text: 'No IPv4 record'
  vmName: undefined,

  // Original text: 'No IP record'
  vmDescription: undefined,

  // Original text: 'Started {ago}'
  vmSettings: undefined,

  // Original text: 'Current status:'
  vmCurrentStatus: undefined,

  // Original text: 'Not running'
  vmNotRunning: undefined,

  // Original text: 'Halted {ago}'
  vmHaltedSince: undefined,

  // Original text: 'No Xen tools detected'
  noToolsDetected: undefined,

  // Original text: 'No IPv4 record'
  noIpv4Record: undefined,

  // Original text: 'No IP record'
  noIpRecord: undefined,

  // Original text: 'Started {ago}'
  started: undefined,

  // Original text: 'Paravirtualization (PV)'
  paraVirtualizedMode: undefined,

  // Original text: 'Hardware virtualization (HVM)'
  hardwareVirtualizedMode: undefined,

  // Original text: 'CPU usage'
  statsCpu: undefined,

  // Original text: 'Memory usage'
  statsMemory: undefined,

  // Original text: 'Network throughput'
  statsNetwork: undefined,

  // Original text: 'Stacked values'
  useStackedValuesOnStats: undefined,

  // Original text: 'Disk throughput'
  statDisk: undefined,

  // Original text: 'Last 10 minutes'
  statLastTenMinutes: undefined,

  // Original text: 'Last 2 hours'
  statLastTwoHours: undefined,

  // Original text: 'Last week'
  statLastWeek: undefined,

  // Original text: 'Last year'
  statLastYear: undefined,

  // Original text: 'Copy'
  copyToClipboardLabel: undefined,

  // Original text: 'Ctrl+Alt+Del'
  ctrlAltDelButtonLabel: undefined,

  // Original text: 'Tip:'
  tipLabel: undefined,

  // Original text: 'Hide infos'
  hideHeaderTooltip: undefined,

  // Original text: 'Show infos'
  showHeaderTooltip: undefined,

  // Original text: 'Name'
  containerName: undefined,

  // Original text: 'Command'
  containerCommand: undefined,

  // Original text: 'Creation date'
  containerCreated: undefined,

  // Original text: 'Status'
  containerStatus: undefined,

  // Original text: 'Action'
  containerAction: undefined,

  // Original text: 'No existing containers'
  noContainers: undefined,

  // Original text: 'Stop this container'
  containerStop: undefined,

  // Original text: 'Start this container'
  containerStart: undefined,

  // Original text: 'Pause this container'
  containerPause: undefined,

  // Original text: 'Resume this container'
  containerResume: undefined,

  // Original text: 'Restart this container'
  containerRestart: undefined,

  // Original text: 'Action'
  vdiAction: undefined,

  // Original text: 'Attach disk'
  vdiAttachDeviceButton: undefined,

  // Original text: 'New disk'
  vbdCreateDeviceButton: undefined,

  // Original text: 'Boot order'
  vdiBootOrder: undefined,

  // Original text: 'Name'
  vdiNameLabel: undefined,

  // Original text: 'Description'
  vdiNameDescription: undefined,

  // Original text: 'Pool'
  vdiPool: undefined,

  // Original text: 'Disconnect'
  vdiDisconnect: undefined,

  // Original text: 'Tags'
  vdiTags: undefined,

  // Original text: 'Size'
  vdiSize: undefined,

  // Original text: 'SR'
  vdiSr: undefined,

  // Original text: 'VMs'
  vdiVms: undefined,

  // Original text: 'Migrate VDI'
  vdiMigrate: undefined,

  // Original text: 'Destination SR:'
  vdiMigrateSelectSr: undefined,

  // Original text: 'Migrate all VDIs'
  vdiMigrateAll: undefined,

  // Original text: 'No SR'
  vdiMigrateNoSr: undefined,

  // Original text: 'A target SR is required to migrate a VDI'
  vdiMigrateNoSrMessage: undefined,

  // Original text: 'Delete VDI'
  vdiDelete: undefined,

  // Original text: 'Forget'
  vdiForget: undefined,

  // Original text: 'Remove VDI'
  vdiRemove: undefined,

  // Original text: 'No VDIs attached to Control Domain'
  noControlDomainVdis: undefined,

  // Original text: 'Boot flag'
  vbdBootableStatus: undefined,

  // Original text: 'Status'
  vbdStatus: undefined,

  // Original text: 'Connected'
  vbdStatusConnected: undefined,

  // Original text: 'Disconnected'
  vbdStatusDisconnected: undefined,

  // Original text: 'No disks'
  vbdNoVbd: undefined,

  // Original text: 'Connect VBD'
  vbdConnect: undefined,

  // Original text: 'Disconnect VBD'
  vbdDisconnect: undefined,

  // Original text: 'Disconnect VBDs'
  vbdsDisconnect: undefined,

  // Original text: 'Bootable'
  vbdBootable: undefined,

  // Original text: 'Readonly'
  vbdReadonly: undefined,

  // Original text: 'Action'
  vbdAction: undefined,

  // Original text: 'Create'
  vbdCreate: undefined,

  // Original text: 'Attach'
  vbdAttach: undefined,

  // Original text: 'Disk name'
  vbdNamePlaceHolder: undefined,

  // Original text: 'Size'
  vbdSizePlaceHolder: undefined,

  // Original text: 'CD drive not completely installed'
  cdDriveNotInstalled: undefined,

  // Original text: 'Stop and start the VM to install the CD drive'
  cdDriveInstallation: undefined,

  // Original text: 'Save'
  saveBootOption: undefined,

  // Original text: 'Reset'
  resetBootOption: undefined,

  // Original text: 'Delete selected VDIs'
  deleteSelectedVdis: undefined,

  // Original text: 'Delete selected VDI'
  deleteSelectedVdi: undefined,

  // Original text: 'Creating this disk will use the disk space quota from the resource set {resourceSet} ({spaceLeft} left)'
  useQuotaWarning: undefined,

  // Original text: 'Not enough space in resource set {resourceSet} ({spaceLeft} left)'
  notEnoughSpaceInResourceSet: undefined,

  // Original text: 'New device'
  vifCreateDeviceButton: undefined,

  // Original text: 'No interface'
  vifNoInterface: undefined,

  // Original text: 'Device'
  vifDeviceLabel: undefined,

  // Original text: 'MAC address'
  vifMacLabel: undefined,

  // Original text: 'MTU'
  vifMtuLabel: undefined,

  // Original text: 'Network'
  vifNetworkLabel: undefined,

  // Original text: 'Status'
  vifStatusLabel: undefined,

  // Original text: 'Connected'
  vifStatusConnected: undefined,

  // Original text: 'Disconnected'
  vifStatusDisconnected: undefined,

  // Original text: 'Connect'
  vifConnect: undefined,

  // Original text: 'Disconnect'
  vifDisconnect: undefined,

  // Original text: 'Remove'
  vifRemove: undefined,

  // Original text: 'Remove selected VIFs'
  vifsRemove: undefined,

  // Original text: 'IP addresses'
  vifIpAddresses: undefined,

  // Original text: 'Auto-generated if empty'
  vifMacAutoGenerate: undefined,

  // Original text: 'Allowed IPs'
  vifAllowedIps: undefined,

  // Original text: 'No IPs'
  vifNoIps: undefined,

  // Original text: 'Network locked'
  vifLockedNetwork: undefined,

  // Original text: 'Network locked and no IPs are allowed for this interface'
  vifLockedNetworkNoIps: undefined,

  // Original text: 'Network not locked'
  vifUnLockedNetwork: undefined,

  // Original text: 'Unknown network'
  vifUnknownNetwork: undefined,

  // Original text: 'Action'
  vifAction: undefined,

  // Original text: 'Create'
  vifCreate: undefined,

  // Original text: 'No snapshots'
  noSnapshots: undefined,

  // Original text: 'New snapshot'
  snapshotCreateButton: undefined,

  // Original text: 'Just click on the snapshot button to create one!'
  tipCreateSnapshotLabel: undefined,

  // Original text: 'Revert VM to this snapshot'
  revertSnapshot: undefined,

  // Original text: 'Remove this snapshot'
  deleteSnapshot: undefined,

  // Original text: 'Remove selected snapshots'
  deleteSnapshots: undefined,

  // Original text: 'Create a VM from this snapshot'
  copySnapshot: undefined,

  // Original text: 'Export this snapshot'
  exportSnapshot: undefined,

  // Original text: 'Creation date'
  snapshotDate: undefined,

  // Original text: 'Name'
  snapshotName: undefined,

  // Original text: 'Description'
  snapshotDescription: undefined,

  // Original text: 'Action'
  snapshotAction: undefined,

  // Original text: 'Quiesced snapshot'
  snapshotQuiesce: undefined,

  // Original text: 'Remove all logs'
  logRemoveAll: undefined,

  // Original text: 'No logs so far'
  noLogs: undefined,

  // Original text: 'Creation date'
  logDate: undefined,

  // Original text: 'Name'
  logName: undefined,

  // Original text: 'Content'
  logContent: undefined,

  // Original text: 'Action'
  logAction: undefined,

  // Original text: 'Remove'
  vmRemoveButton: undefined,

  // Original text: 'Convert'
  vmConvertButton: undefined,

  // Original text: 'Share'
  vmShareButton: undefined,

  // Original text: 'Xen settings'
  xenSettingsLabel: undefined,

  // Original text: 'Guest OS'
  guestOsLabel: undefined,

  // Original text: 'Misc'
  miscLabel: undefined,

  // Original text: 'UUID'
  uuid: undefined,

  // Original text: 'Virtualization mode'
  virtualizationMode: undefined,

  // Original text: 'CPU weight'
  cpuWeightLabel: undefined,

  // Original text: 'Default ({value, number})'
  defaultCpuWeight: undefined,

  // Original text: 'CPU cap'
  cpuCapLabel: undefined,

  // Original text: 'Default ({value, number})'
  defaultCpuCap: undefined,

  // Original text: 'PV args'
  pvArgsLabel: undefined,

  // Original text: 'Xen tools version'
  xenToolsStatus: undefined,

  // Original text: 'OS name'
  osName: undefined,

  // Original text: 'OS kernel'
  osKernel: undefined,

  // Original text: 'Auto power on'
  autoPowerOn: undefined,

  // Original text: 'HA'
  ha: undefined,

  // Original text: 'Affinity host'
  vmAffinityHost: undefined,

  // Original text: 'VGA'
  vmVga: undefined,

  // Original text: 'Video RAM'
  vmVideoram: undefined,

  // Original text: 'None'
  noAffinityHost: undefined,

  // Original text: 'Original template'
  originalTemplate: undefined,

  // Original text: 'Unknown'
  unknownOsName: undefined,

  // Original text: 'Unknown'
  unknownOsKernel: undefined,

  // Original text: 'Unknown'
  unknownOriginalTemplate: undefined,

  // Original text: 'VM limits'
  vmLimitsLabel: undefined,

  // Original text: 'Resource set'
  resourceSet: undefined,

  // Original text: 'None'
  resourceSetNone: undefined,

  // Original text: 'CPU limits'
  vmCpuLimitsLabel: undefined,

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

  // Original text: 'Memory limits (min/max)'
  vmMemoryLimitsLabel: undefined,

  // Original text: 'vCPUs max:'
  vmMaxVcpus: undefined,

  // Original text: 'Memory max:'
  vmMaxRam: undefined,

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

  // Original text: 'Long click to add a name'
  vmHomeNamePlaceholder: undefined,

  // Original text: 'Long click to add a description'
  vmHomeDescriptionPlaceholder: undefined,

  // Original text: 'Click to add a name'
  vmViewNamePlaceholder: undefined,

  // Original text: 'Click to add a description'
  vmViewDescriptionPlaceholder: undefined,

  // Original text: 'Click to add a name'
  templateHomeNamePlaceholder: undefined,

  // Original text: 'Click to add a description'
  templateHomeDescriptionPlaceholder: undefined,

  // Original text: 'Delete template'
  templateDelete: undefined,

  // Original text: 'Delete VM template{templates, plural, one {} other {s}}'
  templateDeleteModalTitle: undefined,

  // Original text: 'Are you sure you want to delete {templates, plural, one {this} other {these}} template{templates, plural, one {} other {s}}?'
  templateDeleteModalBody: undefined,

  // Original text: 'Delete template{nTemplates, plural, one {} other {s}} failed'
  failedToDeleteTemplatesTitle: undefined,

  // Original text: 'Failed to delete {nTemplates, number} template{nTemplates, plural, one {} other {s}}.'
  failedToDeleteTemplatesMessage: undefined,

  // Original text: 'Delete default template{nDefaultTemplates, plural, one {} other {s}}'
  deleteDefaultTemplatesTitle: undefined,

  // Original text: 'You are attempting to delete {nDefaultTemplates, number} default template{nDefaultTemplates, plural, one {} other {s}}. Do you want to continue?'
  deleteDefaultTemplatesMessage: undefined,

  // Original text: 'Pool{pools, plural, one {} other {s}}'
  poolPanel: undefined,

  // Original text: 'Host{hosts, plural, one {} other {s}}'
  hostPanel: undefined,

  // Original text: 'VM{vms, plural, one {} other {s}}'
  vmPanel: undefined,

  // Original text: 'RAM Usage:'
  memoryStatePanel: undefined,

  // Original text: 'Used Memory'
  usedMemory: undefined,

  // Original text: 'Total Memory'
  totalMemory: undefined,

  // Original text: 'CPUs Total'
  totalCpus: undefined,

  // Original text: 'Used vCPUs'
  usedVCpus: undefined,

  // Original text: 'Used Space'
  usedSpace: undefined,

  // Original text: 'Total Space'
  totalSpace: undefined,

  // Original text: 'CPUs Usage'
  cpuStatePanel: undefined,

  // Original text: 'VMs Power state'
  vmStatePanel: undefined,

  // Original text: 'Halted'
  vmStateHalted: undefined,

  // Original text: 'Other'
  vmStateOther: undefined,

  // Original text: 'Running'
  vmStateRunning: undefined,

  // Original text: 'All'
  vmStateAll: undefined,

  // Original text: 'Pending tasks'
  taskStatePanel: undefined,

  // Original text: 'Users'
  usersStatePanel: undefined,

  // Original text: 'Storage state'
  srStatePanel: undefined,

  // Original text: '{usage} (of {total})'
  ofUsage: undefined,

  // Original text: '{nVcpus, number} vCPU{nVcpus, plural, one {} other {s}} (of {nCpus, number} CPU{nCpus, plural, one {} other {s}})'
  ofCpusUsage: undefined,

  // Original text: 'No storage'
  noSrs: undefined,

  // Original text: 'Name'
  srName: undefined,

  // Original text: 'Pool'
  srPool: undefined,

  // Original text: 'Host'
  srHost: undefined,

  // Original text: 'Type'
  srFormat: undefined,

  // Original text: 'Size'
  srSize: undefined,

  // Original text: 'Usage'
  srUsage: undefined,

  // Original text: 'used'
  srUsed: undefined,

  // Original text: 'free'
  srFree: undefined,

  // Original text: 'Storage Usage'
  srUsageStatePanel: undefined,

  // Original text: 'Top 5 SR Usage (in %)'
  srTopUsageStatePanel: undefined,

  // Original text: 'Not enough permissions!'
  notEnoughPermissionsError: undefined,

  // Original text: '{running, number} running ({halted, number} halted)'
  vmsStates: undefined,

  // Original text: 'Clear selection'
  dashboardStatsButtonRemoveAll: undefined,

  // Original text: 'Add all hosts'
  dashboardStatsButtonAddAllHost: undefined,

  // Original text: 'Add all VMs'
  dashboardStatsButtonAddAllVM: undefined,

  // Original text: 'Send report'
  dashboardSendReport: undefined,

  // Original text: 'Report'
  dashboardReport: undefined,

  // Original text: 'This will send a usage report to your configured emails.'
  dashboardSendReportMessage: undefined,

  // Original text: 'The usage report and transport email plugins need to be loaded!'
  dashboardSendReportInfo: undefined,

  // Original text: '{value} {date, date, medium}'
  weekHeatmapData: undefined,

  // Original text: 'No data.'
  weekHeatmapNoData: undefined,

  // Original text: 'Weekly Heatmap'
  weeklyHeatmap: undefined,

  // Original text: 'Weekly Charts'
  weeklyCharts: undefined,

  // Original text: 'Synchronize scale:'
  weeklyChartsScaleInfo: undefined,

  // Original text: 'Stats error'
  statsDashboardGenericErrorTitle: undefined,

  // Original text: 'There is no stats available for:'
  statsDashboardGenericErrorMessage: undefined,

  // Original text: 'No selected metric'
  noSelectedMetric: undefined,

  // Original text: 'Select'
  statsDashboardSelectObjects: undefined,

  // Original text: 'Loading…'
  metricsLoading: undefined,

  // Original text: 'Coming soon!'
  comingSoon: undefined,

  // Original text: 'Orphaned snapshot VDIs'
  orphanedVdis: undefined,

  // Original text: 'Orphaned VMs snapshot'
  orphanedVms: undefined,

  // Original text: 'No orphans'
  noOrphanedObject: undefined,

  // Original text: 'Remove all orphaned snapshot VDIs'
  removeAllOrphanedObject: undefined,

  // Original text: 'VDIs attached to Control Domain'
  vdisOnControlDomain: undefined,

  // Original text: 'Name'
  vmNameLabel: undefined,

  // Original text: 'Description'
  vmNameDescription: undefined,

  // Original text: 'Resident on'
  vmContainer: undefined,

  // Original text: 'Alarms'
  alarmMessage: undefined,

  // Original text: 'No alarms'
  noAlarms: undefined,

  // Original text: 'Date'
  alarmDate: undefined,

  // Original text: 'Content'
  alarmContent: undefined,

  // Original text: 'Issue on'
  alarmObject: undefined,

  // Original text: 'Pool'
  alarmPool: undefined,

  // Original text: 'Remove all alarms'
  alarmRemoveAll: undefined,

  // Original text: '{used}% used ({free} left)'
  spaceLeftTooltip: undefined,

  // Original text: 'Create a new VM on {select}'
  newVmCreateNewVmOn: undefined,

  // Original text: 'You have no permission to create a VM'
  newVmCreateNewVmNoPermission: undefined,

  // Original text: 'Infos'
  newVmInfoPanel: undefined,

  // Original text: 'Name'
  newVmNameLabel: undefined,

  // Original text: 'Template'
  newVmTemplateLabel: undefined,

  // Original text: 'Description'
  newVmDescriptionLabel: undefined,

  // Original text: 'Performances'
  newVmPerfPanel: undefined,

  // Original text: 'vCPUs'
  newVmVcpusLabel: undefined,

  // Original text: 'RAM'
  newVmRamLabel: undefined,

  // Original text: 'Static memory max'
  newVmStaticMaxLabel: undefined,

  // Original text: 'Dynamic memory min'
  newVmDynamicMinLabel: undefined,

  // Original text: 'Dynamic memory max'
  newVmDynamicMaxLabel: undefined,

  // Original text: 'Install settings'
  newVmInstallSettingsPanel: undefined,

  // Original text: 'ISO/DVD'
  newVmIsoDvdLabel: undefined,

  // Original text: 'Network'
  newVmNetworkLabel: undefined,

  // Original text: 'e.g: http://httpredir.debian.org/debian'
  newVmInstallNetworkPlaceHolder: undefined,

  // Original text: 'PV Args'
  newVmPvArgsLabel: undefined,

  // Original text: 'PXE'
  newVmPxeLabel: undefined,

  // Original text: 'Interfaces'
  newVmInterfacesPanel: undefined,

  // Original text: 'MAC'
  newVmMacLabel: undefined,

  // Original text: 'Add interface'
  newVmAddInterface: undefined,

  // Original text: 'Disks'
  newVmDisksPanel: undefined,

  // Original text: 'SR'
  newVmSrLabel: undefined,

  // Original text: 'Size'
  newVmSizeLabel: undefined,

  // Original text: 'Add disk'
  newVmAddDisk: undefined,

  // Original text: 'Summary'
  newVmSummaryPanel: undefined,

  // Original text: 'Create'
  newVmCreate: undefined,

  // Original text: 'Reset'
  newVmReset: undefined,

  // Original text: 'Select template'
  newVmSelectTemplate: undefined,

  // Original text: 'SSH key'
  newVmSshKey: undefined,

  // Original text: 'Config drive'
  newVmConfigDrive: undefined,

  // Original text: 'Custom config'
  newVmCustomConfig: undefined,

  // Original text: 'Boot VM after creation'
  newVmBootAfterCreate: undefined,

  // Original text: 'Auto-generated if empty'
  newVmMacPlaceholder: undefined,

  // Original text: 'CPU weight'
  newVmCpuWeightLabel: undefined,

  // Original text: 'Default: {value, number}'
  newVmDefaultCpuWeight: undefined,

  // Original text: 'CPU cap'
  newVmCpuCapLabel: undefined,

  // Original text: 'Default: {value, number}'
  newVmDefaultCpuCap: undefined,

  // Original text: 'Cloud config'
  newVmCloudConfig: undefined,

  // Original text: 'Create VMs'
  newVmCreateVms: undefined,

  // Original text: 'Are you sure you want to create {nbVms, number} VMs?'
  newVmCreateVmsConfirm: undefined,

  // Original text: 'Multiple VMs:'
  newVmMultipleVms: undefined,

  // Original text: 'Select a resource set:'
  newVmSelectResourceSet: undefined,

  // Original text: 'Name pattern:'
  newVmMultipleVmsPattern: undefined,

  // Original text: 'e.g.: \\{name\\}_%'
  newVmMultipleVmsPatternPlaceholder: undefined,

  // Original text: 'First index:'
  newVmFirstIndex: undefined,

  // Original text: 'Recalculate VMs number'
  newVmNumberRecalculate: undefined,

  // Original text: 'Refresh VMs name'
  newVmNameRefresh: undefined,

  // Original text: 'Affinity host'
  newVmAffinityHost: undefined,

  // Original text: 'Advanced'
  newVmAdvancedPanel: undefined,

  // Original text: 'Show advanced settings'
  newVmShowAdvanced: undefined,

  // Original text: 'Hide advanced settings'
  newVmHideAdvanced: undefined,

  // Original text: 'Share this VM'
  newVmShare: undefined,

  // Original text: 'Resource sets'
  resourceSets: undefined,

  // Original text: 'No resource sets.'
  noResourceSets: undefined,

  // Original text: 'Loading resource sets'
  loadingResourceSets: undefined,

  // Original text: 'Resource set name'
  resourceSetName: undefined,

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

  // Original text: 'Recompute all limits'
  recomputeResourceSets: undefined,

  // Original text: 'Save'
  saveResourceSet: undefined,

  // Original text: 'Reset'
  resetResourceSet: undefined,

  // Original text: 'Edit'
  editResourceSet: undefined,

  // Original text: 'Delete'
  deleteResourceSet: undefined,

  // Original text: 'Delete resource set'
  deleteResourceSetWarning: undefined,

  // Original text: 'Are you sure you want to delete this resource set?'
  deleteResourceSetQuestion: undefined,

  // Original text: 'Missing objects:'
  resourceSetMissingObjects: undefined,

  // Original text: 'vCPUs'
  resourceSetVcpus: undefined,

  // Original text: 'Memory'
  resourceSetMemory: undefined,

  // Original text: 'Storage'
  resourceSetStorage: undefined,

  // Original text: 'Unknown'
  unknownResourceSetValue: undefined,

  // Original text: 'Available hosts'
  availableHosts: undefined,

  // Original text: 'Excluded hosts'
  excludedHosts: undefined,

  // Original text: 'No hosts available.'
  noHostsAvailable: undefined,

  // Original text: 'VMs created from this resource set shall run on the following hosts.'
  availableHostsDescription: undefined,

  // Original text: 'Maximum CPUs'
  maxCpus: undefined,

  // Original text: 'Maximum RAM'
  maxRam: undefined,

  // Original text: 'Maximum disk space'
  maxDiskSpace: undefined,

  // Original text: 'IP pool'
  ipPool: undefined,

  // Original text: 'Quantity'
  quantity: undefined,

  // Original text: 'No limits.'
  noResourceSetLimits: undefined,

  // Original text: 'Remaining:'
  remainingResource: undefined,

  // Original text: 'Used'
  usedResourceLabel: undefined,

  // Original text: 'Available'
  availableResourceLabel: undefined,

  // Original text: 'Used: {usage} (Total: {total})'
  resourceSetQuota: undefined,

  // Original text: 'New'
  resourceSetNew: undefined,

  // Original text: 'Try dropping some VMs files here, or click to select VMs to upload. Accept only .xva/.ova files.'
  importVmsList: undefined,

  // Original text: 'No selected VMs.'
  noSelectedVms: undefined,

  // Original text: 'To Pool:'
  vmImportToPool: undefined,

  // Original text: 'To SR:'
  vmImportToSr: undefined,

  // Original text: 'VMs to import'
  vmsToImport: undefined,

  // Original text: 'Reset'
  importVmsCleanList: undefined,

  // Original text: 'VM import success'
  vmImportSuccess: undefined,

  // Original text: 'VM import failed'
  vmImportFailed: undefined,

  // Original text: 'Error on setting the VM: {vm}'
  setVmFailed: undefined,

  // Original text: 'Import starting…'
  startVmImport: undefined,

  // Original text: 'Export starting…'
  startVmExport: undefined,

  // Original text: 'N CPUs'
  nCpus: undefined,

  // Original text: 'Memory'
  vmMemory: undefined,

  // Original text: 'Disk {position} ({capacity})'
  diskInfo: undefined,

  // Original text: 'Disk description'
  diskDescription: undefined,

  // Original text: 'No disks.'
  noDisks: undefined,

  // Original text: 'No networks.'
  noNetworks: undefined,

  // Original text: 'Network {name}'
  networkInfo: undefined,

  // Original text: 'No description available'
  noVmImportErrorDescription: undefined,

  // Original text: 'Error:'
  vmImportError: undefined,

  // Original text: '{type} file:'
  vmImportFileType: undefined,

  // Original text: 'Please to check and/or modify the VM configuration.'
  vmImportConfigAlert: undefined,

  // Original text: 'No pending tasks'
  noTasks: undefined,

  // Original text: 'Currently, there are not any pending XenServer tasks'
  xsTasks: undefined,

  // Original text: 'Cancel'
  cancelTask: undefined,

  // Original text: 'Destroy'
  destroyTask: undefined,

  // Original text: 'Cancel selected tasks'
  cancelTasks: undefined,

  // Original text: 'Destroy selected tasks'
  destroyTasks: undefined,

  // Original text: 'Pool'
  pool: undefined,

  // Original text: 'Task'
  task: undefined,

  // Original text: 'Progress'
  progress: undefined,

  // Original text: 'Schedules'
  backupSchedules: undefined,

  // Original text: 'Saved schedules'
  backupSavedSchedules: undefined,

  // Original text: 'New schedules'
  backupNewSchedules: undefined,

  // Original text: 'Cron pattern'
  scheduleCron: undefined,

  // Original text: 'Name'
  scheduleName: undefined,

  // Original text: 'Timezone'
  scheduleTimezone: undefined,

  // Original text: 'Export ret.'
  scheduleExportRetention: undefined,

  // Original text: 'Snapshot ret.'
  scheduleSnapshotRetention: undefined,

  // Original text: 'Get remote'
  getRemote: undefined,

  // Original text: 'List Remote'
  listRemote: undefined,

  // Original text: 'simple'
  simpleBackup: undefined,

  // Original text: 'delta'
  delta: undefined,

  // Original text: 'Restore Backups'
  restoreBackups: undefined,

  // Original text: 'Click on a VM to display restore options'
  restoreBackupsInfo: undefined,

  // Original text: 'Only the files of Delta Backup which are not on a SMB remote can be restored'
  restoreDeltaBackupsInfo: undefined,

  // Original text: 'Enabled'
  remoteEnabled: undefined,

  // Original text: 'Error'
  remoteError: undefined,

  // Original text: 'No backup available'
  noBackup: undefined,

  // Original text: 'VM Name'
  backupVmNameColumn: undefined,

  // Original text: 'VM Description'
  backupVmDescriptionColumn: undefined,

  // Original text: 'Tags'
  backupTags: undefined,

  // Original text: 'Oldest backup'
  firstBackupColumn: undefined,

  // Original text: 'Latest backup'
  lastBackupColumn: undefined,

  // Original text: 'Available Backups'
  availableBackupsColumn: undefined,

  // Original text: 'Missing parameters'
  backupRestoreErrorTitle: undefined,

  // Original text: 'Choose a SR and a backup'
  backupRestoreErrorMessage: undefined,

  // Original text: 'Select default SR…'
  backupRestoreSelectDefaultSr: undefined,

  // Original text: 'Choose a SR for each VDI'
  backupRestoreChooseSrForEachVdis: undefined,

  // Original text: 'VDI'
  backupRestoreVdiLabel: undefined,

  // Original text: 'SR'
  backupRestoreSrLabel: undefined,

  // Original text: 'Display backups'
  displayBackup: undefined,

  // Original text: 'Import VM'
  importBackupTitle: undefined,

  // Original text: 'Starting your backup import'
  importBackupMessage: undefined,

  // Original text: 'VMs to backup'
  vmsToBackup: undefined,

  // Original text: 'Refresh backup list'
  restoreResfreshList: undefined,

  // Original text: 'Restore'
  restoreVmBackups: undefined,

  // Original text: 'Restore {vm}'
  restoreVmBackupsTitle: undefined,

  // Original text: 'Restore {nVms, number} VM{nVms, plural, one {} other {s}}'
  restoreVmBackupsBulkTitle: undefined,

  // Original text: 'Restore {nVms, number} VM{nVms, plural, one {} other {s}} from {nVms, plural, one {its} other {their}} {oldestOrLatest} backup.'
  restoreVmBackupsBulkMessage: undefined,

  // Original text: 'oldest'
  oldest: undefined,

  // Original text: 'latest'
  latest: undefined,

  // Original text: 'Start VM{nVms, plural, one {} other {s}} after restore'
  restoreVmBackupsStart: undefined,

  // Original text: 'Multi-restore error'
  restoreVmBackupsBulkErrorTitle: undefined,

  // Original text: 'You need to select a destination SR'
  restoreVmBackupsBulkErrorMessage: undefined,

  // Original text: 'Delete backups…'
  deleteVmBackups: undefined,

  // Original text: 'Delete {vm} backups'
  deleteVmBackupsTitle: undefined,

  // Original text: 'Select backups to delete:'
  deleteVmBackupsSelect: undefined,

  // Original text: 'All'
  deleteVmBackupsSelectAll: undefined,

  // Original text: 'Delete backups'
  deleteVmBackupsBulkTitle: undefined,

  // Original text: 'Are you sure you want to delete all the backups from {nVms, number} VM{nVms, plural, one {} other {s}}?'
  deleteVmBackupsBulkMessage: undefined,

  // Original text: 'delete {nBackups} backup{nBackups, plural, one {} other {s}}'
  deleteVmBackupsBulkConfirmText: undefined,

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

  // Original text: 'Emergency shutdown Host'
  emergencyShutdownHostModalTitle: undefined,

  // Original text: 'Are you sure you want to shutdown {host}?'
  emergencyShutdownHostModalMessage: undefined,

  // Original text: 'Emergency shutdown Host{nHosts, plural, one {} other {s}}'
  emergencyShutdownHostsModalTitle: undefined,

  // Original text: 'Are you sure you want to shutdown {nHosts, number} Host{nHosts, plural, one {} other {s}}?'
  emergencyShutdownHostsModalMessage: undefined,

  // Original text: 'Shutdown host'
  stopHostModalTitle: undefined,

  // Original text: "This will shutdown your host. Do you want to continue? If it's the pool master, your connection to the pool will be lost"
  stopHostModalMessage: undefined,

  // Original text: 'Add host'
  addHostModalTitle: undefined,

  // Original text: 'Are you sure you want to add {host} to {pool}?'
  addHostModalMessage: undefined,

  // Original text: 'Restart host'
  restartHostModalTitle: undefined,

  // Original text: 'This will restart your host. Do you want to continue?'
  restartHostModalMessage: undefined,

  // Original text: 'Restart Host{nHosts, plural, one {} other {s}} agent{nHosts, plural, one {} other {s}}'
  restartHostsAgentsModalTitle: undefined,

  // Original text: 'Are you sure you want to restart {nHosts, number} Host{nHosts, plural, one {} other {s}} agent{nHosts, plural, one {} other {s}}?'
  restartHostsAgentsModalMessage: undefined,

  // Original text: 'Restart Host{nHosts, plural, one {} other {s}}'
  restartHostsModalTitle: undefined,

  // Original text: 'Are you sure you want to restart {nHosts, number} Host{nHosts, plural, one {} other {s}}?'
  restartHostsModalMessage: undefined,

  // Original text: 'Start VM{vms, plural, one {} other {s}}'
  startVmsModalTitle: undefined,

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

  // Original text: 'Are you sure you want to start {vms, number} VM{vms, plural, one {} other {s}}?'
  startVmsModalMessage: undefined,

  // Original text: '{nVms, number} vm{nVms, plural, one {} other {s}} are failed. Please see your logs to get more information'
  failedVmsErrorMessage: undefined,

  // Original text: 'Start failed'
  failedVmsErrorTitle: undefined,

  // Original text: 'Stop Host{nHosts, plural, one {} other {s}}'
  stopHostsModalTitle: undefined,

  // Original text: 'Are you sure you want to stop {nHosts, number} Host{nHosts, plural, one {} other {s}}?'
  stopHostsModalMessage: undefined,

  // Original text: 'Stop VM{vms, plural, one {} other {s}}'
  stopVmsModalTitle: undefined,

  // Original text: 'Are you sure you want to stop {vms, number} VM{vms, plural, one {} other {s}}?'
  stopVmsModalMessage: undefined,

  // Original text: 'Restart VM'
  restartVmModalTitle: undefined,

  // Original text: 'Are you sure you want to restart {name}?'
  restartVmModalMessage: undefined,

  // Original text: 'Stop VM'
  stopVmModalTitle: undefined,

  // Original text: 'Are you sure you want to stop {name}?'
  stopVmModalMessage: undefined,

  // Original text: 'Suspend VM{vms, plural, one {} other {s}}'
  suspendVmsModalTitle: undefined,

  // Original text: 'Are you sure you want to suspend {vms, number} VM{vms, plural, one {} other {s}}?'
  suspendVmsModalMessage: undefined,

  // Original text: 'Restart VM{vms, plural, one {} other {s}}'
  restartVmsModalTitle: undefined,

  // Original text: 'Are you sure you want to restart {vms, number} VM{vms, plural, one {} other {s}}?'
  restartVmsModalMessage: undefined,

  // Original text: 'Snapshot VM{vms, plural, one {} other {s}}'
  snapshotVmsModalTitle: undefined,

  // Original text: 'Are you sure you want to snapshot {vms, number} VM{vms, plural, one {} other {s}}?'
  snapshotVmsModalMessage: undefined,

  // Original text: 'Delete VM{vms, plural, one {} other {s}}'
  deleteVmsModalTitle: undefined,

  // Original text: 'Are you sure you want to delete {vms, number} VM{vms, plural, one {} other {s}}? ALL VM DISKS WILL BE REMOVED'
  deleteVmsModalMessage: undefined,

  // Original text: 'delete {nVms, number} vm{nVms, plural, one {} other {s}}'
  deleteVmsConfirmText: undefined,

  // Original text: 'Delete VM'
  deleteVmModalTitle: undefined,

  // Original text: 'Are you sure you want to delete this VM? ALL VM DISKS WILL BE REMOVED'
  deleteVmModalMessage: undefined,

  // Original text: 'Blocked operation'
  deleteVmBlockedModalTitle: undefined,

  // Original text: 'Removing the VM is a blocked operation. Would you like to remove it anyway?'
  deleteVmBlockedModalMessage: undefined,

  // Original text: 'Migrate VM'
  migrateVmModalTitle: undefined,

  // Original text: 'Select a destination host:'
  migrateVmSelectHost: undefined,

  // Original text: 'Select a migration network:'
  migrateVmSelectMigrationNetwork: undefined,

  // Original text: 'For each VIF, select a network:'
  migrateVmSelectNetworks: undefined,

  // Original text: 'Select a destination SR:'
  migrateVmsSelectSr: undefined,

  // Original text: 'Select a destination SR for local disks:'
  migrateVmsSelectSrIntraPool: undefined,

  // Original text: 'Select a network on which to connect each VIF:'
  migrateVmsSelectNetwork: undefined,

  // Original text: 'Smart mapping'
  migrateVmsSmartMapping: undefined,

  // Original text: 'VIF'
  migrateVmVif: undefined,

  // Original text: 'Network'
  migrateVmNetwork: undefined,

  // Original text: 'No target host'
  migrateVmNoTargetHost: undefined,

  // Original text: 'A target host is required to migrate a VM'
  migrateVmNoTargetHostMessage: undefined,

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

  // Original text: 'Delete job{nJobs, plural, one {} other {s}}'
  deleteJobsModalTitle: undefined,

  // Original text: 'Are you sure you want to delete {nJobs, number} job{nJobs, plural, one {} other {s}}?'
  deleteJobsModalMessage: undefined,

  // Original text: 'Delete VBD{nVbds, plural, one {} other {s}}'
  deleteVbdsModalTitle: undefined,

  // Original text: 'Are you sure you want to delete {nVbds, number} VBD{nVbds, plural, one {} other {s}}?'
  deleteVbdsModalMessage: undefined,

  // Original text: 'Delete VDI'
  deleteVdiModalTitle: undefined,

  // Original text: 'Are you sure you want to delete this disk? ALL DATA ON THIS DISK WILL BE LOST'
  deleteVdiModalMessage: undefined,

  // Original text: 'Delete VDI{nVdis, plural, one {} other {s}}'
  deleteVdisModalTitle: undefined,

  // Original text: 'Are you sure you want to delete {nVdis, number} disk{nVdis, plural, one {} other {s}}? ALL DATA ON THESE DISKS WILL BE LOST'
  deleteVdisModalMessage: undefined,

  // Original text: 'Delete schedule{nSchedules, plural, one {} other {s}}'
  deleteSchedulesModalTitle: undefined,

  // Original text: 'Are you sure you want to delete {nSchedules, number} schedule{nSchedules, plural, one {} other {s}}?'
  deleteSchedulesModalMessage: undefined,

  // Original text: 'Delete remote{nRemotes, plural, one {} other {s}}'
  deleteRemotesModalTitle: undefined,

  // Original text: 'Are you sure you want to delete {nRemotes, number} remote{nRemotes, plural, one {} other {s}}?'
  deleteRemotesModalMessage: undefined,

  // Original text: 'Revert your VM'
  revertVmModalTitle: undefined,

  // Original text: 'Share your VM'
  shareVmInResourceSetModalTitle: undefined,

  // Original text: 'This VM will be shared with all the members of the self-service {self}. Are you sure?'
  shareVmInResourceSetModalMessage: undefined,

  // Original text: 'Delete VIF{nVifs, plural, one {} other {s}}'
  deleteVifsModalTitle: undefined,

  // Original text: 'Are you sure you want to delete {nVifs, number} VIF{nVifs, plural, one {} other {s}}?'
  deleteVifsModalMessage: undefined,

  // Original text: 'Delete snapshot'
  deleteSnapshotModalTitle: undefined,

  // Original text: 'Are you sure you want to delete this snapshot?'
  deleteSnapshotModalMessage: undefined,

  // Original text: 'Delete snapshot{nVms, plural, one {} other {s}}'
  deleteSnapshotsModalTitle: undefined,

  // Original text: 'Are you sure you want to delete {nVms, number} snapshot{nVms, plural, one {} other {s}}?'
  deleteSnapshotsModalMessage: undefined,

  // Original text: 'Disconnect VBD{nVbds, plural, one {} other {s}}'
  disconnectVbdsModalTitle: undefined,

  // Original text: 'Are you sure you want to disconnect {nVbds, number} VBD{nVbds, plural, one {} other {s}}?'
  disconnectVbdsModalMessage: undefined,

  // Original text: 'Are you sure you want to revert this VM to the snapshot state? This operation is irreversible.'
  revertVmModalMessage: undefined,

  // Original text: 'Snapshot before'
  revertVmModalSnapshotBefore: undefined,

  // Original text: 'Import a {name} Backup'
  importBackupModalTitle: undefined,

  // Original text: 'Start VM after restore'
  importBackupModalStart: undefined,

  // Original text: 'Select your backup…'
  importBackupModalSelectBackup: undefined,

  // Original text: 'Select a destination SR…'
  importBackupModalSelectSr: undefined,

  // Original text: 'Are you sure you want to remove all orphaned snapshot VDIs?'
  removeAllOrphanedModalWarning: undefined,

  // Original text: 'Remove all logs'
  removeAllLogsModalTitle: undefined,

  // Original text: 'Are you sure you want to remove all logs?'
  removeAllLogsModalWarning: undefined,

  // Original text: 'This operation is definitive.'
  definitiveMessageModal: undefined,

  // Original text: 'Previous SR Usage'
  existingSrModalTitle: undefined,

  // Original text: 'This path has been previously used as a Storage by a XenServer host. All data will be lost if you choose to continue the SR creation.'
  existingSrModalText: undefined,

  // Original text: 'Previous LUN Usage'
  existingLunModalTitle: undefined,

  // Original text: 'This LUN has been previously used as a Storage by a XenServer host. All data will be lost if you choose to continue the SR creation.'
  existingLunModalText: undefined,

  // Original text: 'Replace current registration?'
  alreadyRegisteredModal: undefined,

  // Original text: 'Your XO appliance is already registered to {email}, do you want to forget and replace this registration ?'
  alreadyRegisteredModalText: undefined,

  // Original text: 'Ready for trial?'
  trialReadyModal: undefined,

  // Original text: 'During the trial period, XOA need to have a working internet connection. This limitation does not apply for our paid plans!'
  trialReadyModalText: undefined,

  // Original text: 'Cancel task{nTasks, plural, one {} other {s}}'
  cancelTasksModalTitle: undefined,

  // Original text: 'Are you sure you want to cancel {nTasks, number} task{nTasks, plural, one {} other {s}}?'
  cancelTasksModalMessage: undefined,

  // Original text: 'Destroy task{nTasks, plural, one {} other {s}}'
  destroyTasksModalTitle: undefined,

  // Original text: 'Are you sure you want to destroy {nTasks, number} task{nTasks, plural, one {} other {s}}?'
  destroyTasksModalMessage: undefined,

  // Original text: 'Label'
  serverLabel: undefined,

  // Original text: 'Host'
  serverHost: undefined,

  // Original text: 'Username'
  serverUsername: undefined,

  // Original text: 'Password'
  serverPassword: undefined,

  // Original text: 'Action'
  serverAction: undefined,

  // Original text: 'Read Only'
  serverReadOnly: undefined,

  // Original text: 'Unauthorized Certificates'
  serverUnauthorizedCertificates: undefined,

  // Original text: 'Allow Unauthorized Certificates'
  serverAllowUnauthorizedCertificates: undefined,

  // Original text: "Enable it if your certificate is rejected, but it's not recommended because your connection will not be secured."
  serverUnauthorizedCertificatesInfo: undefined,

  // Original text: 'Disconnect server'
  serverDisconnect: undefined,

  // Original text: 'username'
  serverPlaceHolderUser: undefined,

  // Original text: 'password'
  serverPlaceHolderPassword: undefined,

  // Original text: 'address[:port]'
  serverPlaceHolderAddress: undefined,

  // Original text: 'label'
  serverPlaceHolderLabel: undefined,

  // Original text: 'Connect'
  serverConnect: undefined,

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

  // Original text: 'Copy VM'
  copyVm: undefined,

  // Original text: 'Are you sure you want to copy this VM to {SR}?'
  copyVmConfirm: undefined,

  // Original text: 'Name'
  copyVmName: undefined,

  // Original text: 'Name pattern'
  copyVmNamePattern: undefined,

  // Original text: 'If empty: name of the copied VM'
  copyVmNamePlaceholder: undefined,

  // Original text: 'e.g.: "\\{name\\}_COPY"'
  copyVmNamePatternPlaceholder: undefined,

  // Original text: 'Select SR'
  copyVmSelectSr: undefined,

  // Original text: 'Use compression'
  copyVmCompress: undefined,

  // Original text: 'No target SR'
  copyVmsNoTargetSr: undefined,

  // Original text: 'A target SR is required to copy a VM'
  copyVmsNoTargetSrMessage: undefined,

  // Original text: 'Detach host'
  detachHostModalTitle: undefined,

  // Original text: 'Are you sure you want to detach {host} from its pool? THIS WILL REMOVE ALL VMs ON ITS LOCAL STORAGE AND REBOOT THE HOST.'
  detachHostModalMessage: undefined,

  // Original text: 'Detach'
  detachHost: undefined,

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

  // Original text: 'Create network'
  newNetworkCreate: undefined,

  // Original text: 'Create bonded network'
  newBondedNetworkCreate: undefined,

  // Original text: 'Interface'
  newNetworkInterface: undefined,

  // Original text: 'Name'
  newNetworkName: undefined,

  // Original text: 'Description'
  newNetworkDescription: undefined,

  // Original text: 'VLAN'
  newNetworkVlan: undefined,

  // Original text: 'No VLAN if empty'
  newNetworkDefaultVlan: undefined,

  // Original text: 'MTU'
  newNetworkMtu: undefined,

  // Original text: 'Default: 1500'
  newNetworkDefaultMtu: undefined,

  // Original text: 'Name required'
  newNetworkNoNameErrorTitle: undefined,

  // Original text: 'A name is required to create a network'
  newNetworkNoNameErrorMessage: undefined,

  // Original text: 'Bond mode'
  newNetworkBondMode: undefined,

  // Original text: 'Delete network'
  deleteNetwork: undefined,

  // Original text: 'Are you sure you want to delete this network?'
  deleteNetworkConfirm: undefined,

  // Original text: 'This network is currently in use'
  networkInUse: undefined,

  // Original text: 'Bonded'
  pillBonded: undefined,

  // Original text: 'Host'
  addHostSelectHost: undefined,

  // Original text: 'No host'
  addHostNoHost: undefined,

  // Original text: 'No host selected to be added'
  addHostNoHostMessage: undefined,

  // Original text: 'Xen Orchestra'
  xenOrchestra: undefined,

  // Original text: 'Xen Orchestra server'
  xenOrchestraServer: undefined,

  // Original text: 'Xen Orchestra web client'
  xenOrchestraWeb: undefined,

  // Original text: 'No pro support provided!'
  noProSupport: undefined,

  // Original text: 'Use in production at your own risks'
  noProductionUse: undefined,

  // Original text: 'You can download our turnkey appliance at {website}'
  downloadXoaFromWebsite: undefined,

  // Original text: 'Bug Tracker'
  bugTracker: undefined,

  // Original text: 'Issues? Report it!'
  bugTrackerText: undefined,

  // Original text: 'Community'
  community: undefined,

  // Original text: 'Join our community forum!'
  communityText: undefined,

  // Original text: 'Free Trial for Premium Edition!'
  freeTrial: undefined,

  // Original text: 'Request your trial now!'
  freeTrialNow: undefined,

  // Original text: 'Any issue?'
  issues: undefined,

  // Original text: 'Problem? Contact us!'
  issuesText: undefined,

  // Original text: 'Documentation'
  documentation: undefined,

  // Original text: 'Read our official doc'
  documentationText: undefined,

  // Original text: 'Pro support included'
  proSupportIncluded: undefined,

  // Original text: 'Access your XO Account'
  xoAccount: undefined,

  // Original text: 'Report a problem'
  openTicket: undefined,

  // Original text: 'Problem? Open a ticket!'
  openTicketText: undefined,

  // Original text: 'Upgrade needed'
  upgradeNeeded: undefined,

  // Original text: 'Upgrade now!'
  upgradeNow: undefined,

  // Original text: 'Or'
  or: undefined,

  // Original text: 'Try it for free!'
  tryIt: undefined,

  // Original text: 'This feature is available starting from {plan} Edition'
  availableIn: undefined,

  // Original text: 'This feature is not available in your version, contact your administrator to know more.'
  notAvailable: undefined,

  // Original text: 'Updates'
  updateTitle: undefined,

  // Original text: 'Registration'
  registration: undefined,

  // Original text: 'Trial'
  trial: undefined,

  // Original text: 'Settings'
  settings: undefined,

  // Original text: 'Proxy settings'
  proxySettings: undefined,

  // Original text: 'Host (myproxy.example.org)'
  proxySettingsHostPlaceHolder: undefined,

  // Original text: 'Port (eg: 3128)'
  proxySettingsPortPlaceHolder: undefined,

  // Original text: 'Username'
  proxySettingsUsernamePlaceHolder: undefined,

  // Original text: 'Password'
  proxySettingsPasswordPlaceHolder: undefined,

  // Original text: 'Your email account'
  updateRegistrationEmailPlaceHolder: undefined,

  // Original text: 'Your password'
  updateRegistrationPasswordPlaceHolder: undefined,

  // Original text: 'Troubleshooting documentation'
  updaterTroubleshootingLink: undefined,

  // Original text: 'Update'
  update: undefined,

  // Original text: 'Refresh'
  refresh: undefined,

  // Original text: 'Upgrade'
  upgrade: undefined,

  // Original text: 'No updater available for Community Edition'
  noUpdaterCommunity: undefined,

  // Original text: 'Please consider subscribing and trying it with all the features for free during 15 days on {link}.'
  considerSubscribe: undefined,

  // Original text: 'Manual update could break your current installation due to dependencies issues, do it with caution'
  noUpdaterWarning: undefined,

  // Original text: 'Current version:'
  currentVersion: undefined,

  // Original text: 'Register'
  register: undefined,

  // Original text: 'Edit registration'
  editRegistration: undefined,

  // Original text: 'Please, take time to register in order to enjoy your trial.'
  trialRegistration: undefined,

  // Original text: 'Start trial'
  trialStartButton: undefined,

  // Original text: 'You can use a trial version until {date, date, medium}. Upgrade your appliance to get it.'
  trialAvailableUntil: undefined,

  // Original text: 'Your trial has been ended. Contact us or downgrade to Free version'
  trialConsumed: undefined,

  // Original text: 'Your xoa-updater service appears to be down. Your XOA cannot run fully without reaching this service.'
  trialLocked: undefined,

  // Original text: 'No update information available'
  noUpdateInfo: undefined,

  // Original text: 'Update information may be available'
  waitingUpdateInfo: undefined,

  // Original text: 'Your XOA is up-to-date'
  upToDate: undefined,

  // Original text: 'You need to update your XOA (new version is available)'
  mustUpgrade: undefined,

  // Original text: 'Your XOA is not registered for updates'
  registerNeeded: undefined,

  // Original text: "Can't fetch update information"
  updaterError: undefined,

  // Original text: 'Upgrade successful'
  promptUpgradeReloadTitle: undefined,

  // Original text: 'Your XOA has successfully upgraded, and your browser must reload the application. Do you want to reload now ?'
  promptUpgradeReloadMessage: undefined,

  // Original text: 'Upgrade warning'
  upgradeWarningTitle: undefined,

  // Original text: 'You have some backup jobs in progress. If you upgrade now, these jobs will be interrupted! Are you sure you want to continue?'
  upgradeWarningMessage: undefined,

  // Original text: 'Xen Orchestra from the sources'
  disclaimerTitle: undefined,

  // Original text: "You are using XO from the sources! That's great for a personal/non-profit usage."
  disclaimerText1: undefined,

  // Original text: "If you are a company, it's better to use it with our appliance + pro support included:"
  disclaimerText2: undefined,

  // Original text: 'This version is not bundled with any support nor updates. Use it with caution for critical tasks.'
  disclaimerText3: undefined,

  // Original text: 'Connect PIF'
  connectPif: undefined,

  // Original text: 'Are you sure you want to connect this PIF?'
  connectPifConfirm: undefined,

  // Original text: 'Disconnect PIF'
  disconnectPif: undefined,

  // Original text: 'Are you sure you want to disconnect this PIF?'
  disconnectPifConfirm: undefined,

  // Original text: 'Delete PIF'
  deletePif: undefined,

  // Original text: 'Are you sure you want to delete this PIF?'
  deletePifConfirm: undefined,

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

  // Original text: 'Username'
  username: undefined,

  // Original text: 'Password'
  password: undefined,

  // Original text: 'Language'
  language: undefined,

  // Original text: 'Old password'
  oldPasswordPlaceholder: undefined,

  // Original text: 'New password'
  newPasswordPlaceholder: undefined,

  // Original text: 'Confirm new password'
  confirmPasswordPlaceholder: undefined,

  // Original text: 'Confirmation password incorrect'
  confirmationPasswordError: undefined,

  // Original text: 'Password does not match the confirm password.'
  confirmationPasswordErrorBody: undefined,

  // Original text: 'Password changed'
  pwdChangeSuccess: undefined,

  // Original text: 'Your password has been successfully changed.'
  pwdChangeSuccessBody: undefined,

  // Original text: 'Incorrect password'
  pwdChangeError: undefined,

  // Original text: 'The old password provided is incorrect. Your password has not been changed.'
  pwdChangeErrorBody: undefined,

  // Original text: 'OK'
  changePasswordOk: undefined,

  // Original text: 'SSH keys'
  sshKeys: undefined,

  // Original text: 'New SSH key'
  newSshKey: undefined,

  // Original text: 'Delete'
  deleteSshKey: undefined,

  // Original text: 'Delete selected SSH keys'
  deleteSshKeys: undefined,

  // Original text: 'No SSH keys'
  noSshKeys: undefined,

  // Original text: 'New SSH key'
  newSshKeyModalTitle: undefined,

  // Original text: 'Invalid key'
  sshKeyErrorTitle: undefined,

  // Original text: 'An SSH key requires both a title and a key.'
  sshKeyErrorMessage: undefined,

  // Original text: 'Title'
  title: undefined,

  // Original text: 'Key'
  key: undefined,

  // Original text: 'Delete SSH key'
  deleteSshKeyConfirm: undefined,

  // Original text: 'Are you sure you want to delete the SSH key {title}?'
  deleteSshKeyConfirmMessage: undefined,

  // Original text: 'Delete SSH key{nKeys, plural, one {} other {s}}'
  deleteSshKeysConfirm: undefined,

  // Original text: 'Are you sure you want to delete {nKeys, number} SSH key{nKeys, plural, one {} other {s}}?'
  deleteSshKeysConfirmMessage: undefined,

  // Original text: 'Others'
  others: undefined,

  // Original text: 'Loading logs…'
  loadingLogs: undefined,

  // Original text: 'User'
  logUser: undefined,

  // Original text: 'Method'
  logMethod: undefined,

  // Original text: 'Params'
  logParams: undefined,

  // Original text: 'Message'
  logMessage: undefined,

  // Original text: 'Error'
  logError: undefined,

  // Original text: 'Display details'
  logDisplayDetails: undefined,

  // Original text: 'Date'
  logTime: undefined,

  // Original text: 'No stack trace'
  logNoStackTrace: undefined,

  // Original text: 'No params'
  logNoParams: undefined,

  // Original text: 'Delete log'
  logDelete: undefined,

  // Original text: 'Delete logs'
  logsDelete: undefined,

  // Original text: 'Delete log{nLogs, plural, one {} other {s}}'
  logDeleteMultiple: undefined,

  // Original text: 'Are you sure you want to delete {nLogs, number} log{nLogs, plural, one {} other {s}}?'
  logDeleteMultipleMessage: undefined,

  // Original text: 'Delete all logs'
  logDeleteAll: undefined,

  // Original text: 'Delete all logs'
  logDeleteAllTitle: undefined,

  // Original text: 'Are you sure you want to delete all the logs?'
  logDeleteAllMessage: undefined,

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

  // Original text: 'Name'
  ipPoolName: undefined,

  // Original text: 'IPs'
  ipPoolIps: undefined,

  // Original text: 'IPs (e.g.: 1.0.0.12-1.0.0.17;1.0.0.23)'
  ipPoolIpsPlaceholder: undefined,

  // Original text: 'Networks'
  ipPoolNetworks: undefined,

  // Original text: 'No IP pools'
  ipsNoIpPool: undefined,

  // Original text: 'Create'
  ipsCreate: undefined,

  // Original text: 'Delete all IP pools'
  ipsDeleteAllTitle: undefined,

  // Original text: 'Are you sure you want to delete all the IP pools?'
  ipsDeleteAllMessage: undefined,

  // Original text: 'VIFs'
  ipsVifs: undefined,

  // Original text: 'Not used'
  ipsNotUsed: undefined,

  // Original text: 'unknown VIF'
  ipPoolUnknownVif: undefined,

  // Original text: 'Name already exists'
  ipPoolNameAlreadyExists: undefined,

  // Original text: 'Keyboard shortcuts'
  shortcutModalTitle: undefined,

  // Original text: 'Global'
  shortcut_XoApp: undefined,

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

  // Original text: 'Home'
  shortcut_Home: undefined,

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

  // Original text: 'VM'
  settingsAclsButtonTooltipVM: undefined,

  // Original text: 'Hosts'
  settingsAclsButtonTooltiphost: undefined,

  // Original text: 'Pool'
  settingsAclsButtonTooltippool: undefined,

  // Original text: 'SR'
  settingsAclsButtonTooltipSR: undefined,

  // Original text: 'Network'
  settingsAclsButtonTooltipnetwork: undefined,

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
