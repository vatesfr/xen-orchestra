// See http://momentjs.com/docs/#/use-it/browserify/
import 'moment/locale/he'

import reactIntlData from 'react-intl/locale-data/he'
import { addLocaleData } from 'react-intl'
addLocaleData(reactIntlData)

// ===================================================================

export default {
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

  // Original text: "Long click to edit"
  editableLongClickPlaceholder: 'לחץ כאן לחיצה ערוכה לעריכה',

  // Original text: "Click to edit"
  editableClickPlaceholder: 'לחץ לעריכה',

  // Original text: 'OK'
  alertOk: undefined,

  // Original text: 'OK'
  confirmOk: undefined,

  // Original text: 'Cancel'
  confirmCancel: undefined,

  // Original text: 'On error'
  onError: undefined,

  // Original text: 'Successful'
  successful: undefined,

  // Original text: 'Copy to clipboard'
  copyToClipboard: undefined,

  // Original text: 'Master'
  pillMaster: undefined,

  // Original text: "Home"
  homePage: 'בית',

  // Original text: 'VMs'
  homeVmPage: undefined,

  // Original text: 'Hosts'
  homeHostPage: undefined,

  // Original text: 'Pools'
  homePoolPage: undefined,

  // Original text: 'Templates'
  homeTemplatePage: undefined,

  // Original text: "Dashboard"
  dashboardPage: 'לוח מכוונים',

  // Original text: "Overview"
  overviewDashboardPage: 'איזור אישי',

  // Original text: "Visualizations"
  overviewVisualizationDashboardPage: 'וירטואליזציה',

  // Original text: "Statistics"
  overviewStatsDashboardPage: 'סטטיסטיקה',

  // Original text: "Health"
  overviewHealthDashboardPage: 'בדיקת ביצועים',

  // Original text: "Self service"
  selfServicePage: 'שירות עצמי',

  // Original text: "Backup"
  backupPage: 'גיבוי',

  // Original text: "Jobs"
  jobsPage: 'משימות',

  // Original text: "Updates"
  updatePage: 'עדכונים',

  // Original text: "Settings"
  settingsPage: 'הגדרות',

  // Original text: "Servers"
  settingsServersPage: 'שרתים',

  // Original text: "Users"
  settingsUsersPage: 'משתמשים',

  // Original text: "Groups"
  settingsGroupsPage: 'קבוצות',

  // Original text: "ACLs"
  settingsAclsPage: 'רמות גישה',

  // Original text: "Plugins"
  settingsPluginsPage: 'פלאגינים',

  // Original text: 'Logs'
  settingsLogsPage: undefined,

  // Original text: 'IPs'
  settingsIpsPage: undefined,

  // Original text: "About"
  aboutPage: 'אודות',

  // Original text: "New"
  newMenu: 'חדש',

  // Original text: "Tasks"
  taskMenu: 'משימות',

  // Original text: 'Tasks'
  taskPage: undefined,

  // Original text: "VM"
  newVmPage: 'מכונה',

  // Original text: "Storage"
  newSrPage: 'אחסון',

  // Original text: "Server"
  newServerPage: 'שרת',

  // Original text: "Import"
  newImport: 'ההלעה',

  // Original text: "Overview"
  backupOverviewPage: 'הרחבה',

  // Original text: "New"
  backupNewPage: 'חדש',

  // Original text: "Remotes"
  backupRemotesPage: 'גישה מרחוק',

  // Original text: "Restore"
  backupRestorePage: 'שחזור',

  // Original text: "Schedule"
  schedule: 'תזמון',

  // Original text: "New VM backup"
  newVmBackup: 'גיבוי חדש למכונה',

  // Original text: "Edit VM backup"
  editVmBackup: 'ערוך הגדרות גיבוי למכונה',

  // Original text: "Backup"
  backup: 'גיבוי',

  // Original text: "Rolling Snapshot"
  rollingSnapshot: 'גיבוי סנאפשוט',

  // Original text: "Delta Backup"
  deltaBackup: 'גיבוי חלקי',

  // Original text: "Disaster Recovery"
  disasterRecovery: 'חזרה מDR',

  // Original text: "Continuous Replication"
  continuousReplication: 'רפליקציה מתממשכת',

  // Original text: "Overview"
  jobsOverviewPage: 'רשימת משימות',

  // Original text: "New"
  jobsNewPage: 'משימה חדשה',

  // Original text: "Scheduling"
  jobsSchedulingPage: 'תזמון משימות',

  // Original text: "Custom Job"
  customJob: 'משימה קסטומית',

  // Original text: 'User'
  userPage: undefined,

  // Original text: 'No support'
  noSupport: undefined,

  // Original text: 'Free upgrade!'
  freeUpgrade: undefined,

  // Original text: "Sign out"
  signOut: 'יציאה',

  // Original text: 'Edit my settings {username}'
  editUserProfile: undefined,

  // Original text: "Fetching data…"
  homeFetchingData: 'מקבל נתונים, נא להמתין…',

  // Original text: "Welcome on Xen Orchestra!"
  homeWelcome: 'ברוכים הבאים',

  // Original text: "Add your XCP-ng hosts or pools"
  homeWelcomeText: 'נא להוסיף שרתים או משאבים',

  // Original text: "Want some help?"
  homeHelp: 'צריך עזרה?',

  // Original text: "Add server"
  homeAddServer: 'הוספת שרת',

  // Original text: "Online Doc"
  homeOnlineDoc: 'דוקומנטציה',

  // Original text: "Pro Support"
  homeProSupport: 'תמיכה מקצועית',

  // Original text: "There are no VMs!"
  homeNoVms: 'אין מכונות',

  // Original text: "Or…"
  homeNoVmsOr: 'או…',

  // Original text: "Import VM"
  homeImportVm: 'ההלעה של מכונה',

  // Original text: "Import an existing VM in xva format"
  homeImportVmMessage: 'להלעות מכונה חדשה בפורמת XVA',

  // Original text: "Restore a backup"
  homeRestoreBackup: 'שחזור מגיבוי',

  // Original text: "Restore a backup from a remote store"
  homeRestoreBackupMessage: 'שחזור מגיבוי ממכונה אחרת',

  // Original text: "This will create a new VM"
  homeNewVmMessage: 'זה יצור מכונה חדשה',

  // Original text: "Filters"
  homeFilters: 'מסננים',

  // Original text: 'No results! Click here to reset your filters'
  homeNoMatches: undefined,

  // Original text: "Pool"
  homeTypePool: 'משאבים',

  // Original text: "Host"
  homeTypeHost: 'מכונה',

  // Original text: "VM"
  homeTypeVm: 'שרת',

  // Original text: "SR"
  homeTypeSr: 'SR',

  // Original text: 'Template'
  homeTypeVmTemplate: undefined,

  // Original text: "Sort"
  homeSort: 'סינון',

  // Original text: "Pools"
  homeAllPools: 'POOLS',

  // Original text: "Hosts"
  homeAllHosts: 'מכונות',

  // Original text: "Tags"
  homeAllTags: 'מילות מפתח',

  // Original text: "New VM"
  homeNewVm: 'מכונה חדשה',

  // Original text: "Running hosts"
  homeFilterRunningHosts: 'מערכות פעילות',

  // Original text: "Disabled hosts"
  homeFilterDisabledHosts: 'מערכות לא פעילות',

  // Original text: "Running VMs"
  homeFilterRunningVms: 'מכונות פעילות',

  // Original text: 'Non running VMs'
  homeFilterNonRunningVms: undefined,

  // Original text: 'Pending VMs'
  homeFilterPendingVms: undefined,

  // Original text: 'HVM guests'
  homeFilterHvmGuests: undefined,

  // Original text: "Tags"
  homeFilterTags: 'מילות מפתח',

  // Original text: "Sort by"
  homeSortBy: 'סנן לפי',

  // Original text: "Name"
  homeSortByName: 'שם',

  // Original text: "Power state"
  homeSortByPowerstate: 'מצב',

  // Original text: "RAM"
  homeSortByRAM: 'זכרון RAM',

  // Original text: "vCPUs"
  homeSortByvCPUs: 'כמות המאבדים',

  // Original text: 'CPUs'
  homeSortByCpus: undefined,

  // Original text: '{displayed, number}x {icon} (on {total, number})'
  homeDisplayedItems: undefined,

  // Original text: '{selected, number}x {icon} selected (on {total, number})'
  homeSelectedItems: undefined,

  // Original text: "More"
  homeMore: 'עוד',

  // Original text: "Migrate to…"
  homeMigrateTo: 'העבר ל…',

  // Original text: 'Missing patches'
  homeMissingPatches: undefined,

  // Original text: 'Master:'
  homePoolMaster: undefined,

  // Original text: 'High Availability'
  highAvailability: undefined,

  // Original text: "Add"
  add: 'הוסף',

  // Original text: "Remove"
  remove: 'הסר',

  // Original text: 'Preview'
  preview: undefined,

  // Original text: "Item"
  item: 'פריט',

  // Original text: "No selected value"
  noSelectedValue: 'לא נבחר כלום',

  // Original text: "Choose user(s) and/or group(s)"
  selectSubjects: 'בחר משתמש או קבוצה להוספה',

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

  // Original text: 'Fill required informations.'
  fillRequiredInformations: undefined,

  // Original text: 'Fill informations (optional)'
  fillOptionalInformations: undefined,

  // Original text: 'Reset'
  selectTableReset: undefined,

  // Original text: 'Month'
  schedulingMonth: undefined,

  // Original text: 'Each selected month'
  schedulingEachSelectedMonth: undefined,

  // Original text: 'Day of the month'
  schedulingMonthDay: undefined,

  // Original text: 'Each selected day'
  schedulingEachSelectedMonthDay: undefined,

  // Original text: 'Day of the week'
  schedulingWeekDay: undefined,

  // Original text: 'Each selected day'
  schedulingEachSelectedWeekDay: undefined,

  // Original text: 'Hour'
  schedulingHour: undefined,

  // Original text: 'Every N hour'
  schedulingEveryNHour: undefined,

  // Original text: 'Each selected hour'
  schedulingEachSelectedHour: undefined,

  // Original text: 'Minute'
  schedulingMinute: undefined,

  // Original text: 'Every N minute'
  schedulingEveryNMinute: undefined,

  // Original text: 'Each selected minute'
  schedulingEachSelectedMinute: undefined,

  // Original text: 'Reset'
  schedulingReset: undefined,

  // Original text: 'Unknown'
  unknownSchedule: undefined,

  // Original text: 'Xo-server timezone:'
  timezonePickerServerValue: undefined,

  // Original text: 'Web browser timezone'
  timezonePickerUseLocalTime: undefined,

  // Original text: 'Xo-server timezone'
  timezonePickerUseServerTime: undefined,

  // Original text: 'Server timezone ({value})'
  serverTimezoneOption: undefined,

  // Original text: 'Cron Pattern:'
  cronPattern: undefined,

  // Original text: 'Cannot edit backup'
  backupEditNotFoundTitle: undefined,

  // Original text: 'Missing required info for edition'
  backupEditNotFoundMessage: undefined,

  // Original text: 'Job'
  job: undefined,

  // Original text: 'Job ID'
  jobId: undefined,

  // Original text: 'Name'
  jobName: undefined,

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

  // Original text: 'Timezone'
  jobTimezone: undefined,

  // Original text: 'xo-server'
  jobServerTimezone: undefined,

  // Original text: 'Run job'
  runJob: undefined,

  // Original text: 'One shot running started. See overview for logs.'
  runJobVerbose: undefined,

  // Original text: 'Started'
  jobStarted: undefined,

  // Original text: 'Finished'
  jobFinished: undefined,

  // Original text: 'Save'
  saveBackupJob: undefined,

  // Original text: 'Remove backup job'
  deleteBackupSchedule: undefined,

  // Original text: 'Are you sure you want to delete this backup job?'
  deleteBackupScheduleQuestion: undefined,

  // Original text: 'Enable immediately after creation'
  scheduleEnableAfterCreation: undefined,

  // Original text: 'You are editing Schedule {name} ({id}). Saving will override previous schedule state.'
  scheduleEditMessage: undefined,

  // Original text: 'You are editing job {name} ({id}). Saving will override previous job state.'
  jobEditMessage: undefined,

  // Original text: 'No scheduled jobs.'
  noScheduledJobs: undefined,

  // Original text: 'No jobs found.'
  noJobs: undefined,

  // Original text: 'No schedules found'
  noSchedules: undefined,

  // Original text: 'Select a xo-server API command'
  jobActionPlaceHolder: undefined,

  // Original text: 'Schedules'
  jobSchedules: undefined,

  // Original text: 'Name of your schedule'
  jobScheduleNamePlaceHolder: undefined,

  // Original text: 'Select a Job'
  jobScheduleJobPlaceHolder: undefined,

  // Original text: 'Select your backup type:'
  newBackupSelection: undefined,

  // Original text: 'Select backup mode:'
  smartBackupModeSelection: undefined,

  // Original text: 'Normal backup'
  normalBackup: undefined,

  // Original text: 'Smart backup'
  smartBackup: undefined,

  // Original text: 'Local remote selected'
  localRemoteWarningTitle: undefined,

  // Original text: 'Warning: local remotes will use limited XOA disk space. Only for advanced users.'
  localRemoteWarningMessage: undefined,

  // Original text: 'VMs'
  editBackupVmsTitle: undefined,

  // Original text: 'VMs statuses'
  editBackupSmartStatusTitle: undefined,

  // Original text: 'Resident on'
  editBackupSmartResidentOn: undefined,

  // Original text: 'VMs Tags'
  editBackupSmartTagsTitle: undefined,

  // Original text: 'Tag'
  editBackupTagTitle: undefined,

  // Original text: 'Report'
  editBackupReportTitle: undefined,

  // Original text: 'Enable immediately after creation'
  editBackupScheduleEnabled: undefined,

  // Original text: 'Depth'
  editBackupDepthTitle: undefined,

  // Original text: 'Remote'
  editBackupRemoteTitle: undefined,

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

  // Original text: 'The remote appears to work correctly'
  remoteTestSuccessMessage: undefined,

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

  // Original text: 'Delete'
  remoteDeleteTip: undefined,

  // Original text: 'remote name *'
  remoteNamePlaceHolder: undefined,

  // Original text: 'Name *'
  remoteMyNamePlaceHolder: undefined,

  // Original text: '/path/to/backup'
  remoteLocalPlaceHolderPath: undefined,

  // Original text: 'host *'
  remoteNfsPlaceHolderHost: undefined,

  // Original text: '/path/to/backup'
  remoteNfsPlaceHolderPath: undefined,

  // Original text: 'subfolder [path\\to\\backup]'
  remoteSmbPlaceHolderRemotePath: undefined,

  // Original text: 'Username'
  remoteSmbPlaceHolderUsername: undefined,

  // Original text: 'Password'
  remoteSmbPlaceHolderPassword: undefined,

  // Original text: 'Domain'
  remoteSmbPlaceHolderDomain: undefined,

  // Original text: '<address>\\<share> *'
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

  // Original text: "Name"
  groupNameColumn: 'שם',

  // Original text: "Users"
  groupUsersColumn: 'משתמשים',

  // Original text: "Add User"
  addUserToGroupColumn: 'הוסף משתמש',

  // Original text: "Email"
  userNameColumn: 'מייל',

  // Original text: "Permissions"
  userPermissionColumn: 'הרשאות',

  // Original text: "Password"
  userPasswordColumn: 'סיסמא',

  // Original text: "Email"
  userName: 'שם משתמש',

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

  // Original text: '{users} user{users, plural, one {} other {s}}'
  countUsers: undefined,

  // Original text: 'Select Permission'
  selectPermission: undefined,

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

  // Original text: "Start"
  startVmLabel: 'הפעל מכונה',

  // Original text: 'Recovery start'
  recoveryModeLabel: undefined,

  // Original text: "Suspend"
  suspendVmLabel: 'הקפא מכונה',

  // Original text: "Stop"
  stopVmLabel: 'עצור מכונה',

  // Original text: "Force shutdown"
  forceShutdownVmLabel: 'עצירה בכוח',

  // Original text: "Reboot"
  rebootVmLabel: 'הפעלה מחדש',

  // Original text: "Force reboot"
  forceRebootVmLabel: 'הפעלה מחדש בכוח',

  // Original text: "Delete"
  deleteVmLabel: 'מחיקה',

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

  // Original text: "Console"
  vmConsoleLabel: 'קונסול',

  // Original text: 'Rescan all disks'
  srRescan: undefined,

  // Original text: 'Connect to all hosts'
  srReconnectAll: undefined,

  // Original text: 'Disconnect to all hosts'
  srDisconnectAll: undefined,

  // Original text: 'Forget this SR'
  srForget: undefined,

  // Original text: 'Remove this SR'
  srRemoveButton: undefined,

  // Original text: 'No VDIs in this storage'
  srNoVdis: undefined,

  // Original text: 'Pool RAM usage:'
  poolTitleRamUsage: undefined,

  // Original text: '{used} used on {total}'
  poolRamUsage: undefined,

  // Original text: 'Master:'
  poolMaster: undefined,

  // Original text: 'Hosts'
  hostsTabName: undefined,

  // Original text: 'High Availability'
  poolHaStatus: undefined,

  // Original text: 'Enabled'
  poolHaEnabled: undefined,

  // Original text: 'Disabled'
  poolHaDisabled: undefined,

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

  // Original text: 'Add SR'
  addSrLabel: undefined,

  // Original text: 'Add VM'
  addVmLabel: undefined,

  // Original text: 'Add Host'
  addHostLabel: undefined,

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

  // Original text: 'Core (socket)'
  hostCpusNumber: undefined,

  // Original text: 'Manufacturer info'
  hostManufacturerinfo: undefined,

  // Original text: 'BIOS info'
  hostBiosinfo: undefined,

  // Original text: 'Licence'
  licenseHostSettingsLabel: undefined,

  // Original text: 'Type'
  hostLicenseType: undefined,

  // Original text: 'Socket'
  hostLicenseSocket: undefined,

  // Original text: 'Expiry'
  hostLicenseExpiry: undefined,

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

  // Original text: 'No patch detected'
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

  // Original text: 'non-US keyboard could have issues with console: switch your own layout to US.'
  tipConsoleLabel: undefined,

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
  vdiAttachDevice: undefined,

  // Original text: 'New disk'
  vbdCreateDeviceButton: undefined,

  // Original text: 'Boot order'
  vdiBootOrder: undefined,

  // Original text: 'Name'
  vdiNameLabel: undefined,

  // Original text: 'Description'
  vdiNameDescription: undefined,

  // Original text: 'Tags'
  vdiTags: undefined,

  // Original text: 'Size'
  vdiSize: undefined,

  // Original text: 'SR'
  vdiSr: undefined,

  // Original text: 'VM'
  vdiVm: undefined,

  // Original text: 'Migrate VDI'
  vdiMigrate: undefined,

  // Original text: 'Destination SR:'
  vdiMigrateSelectSr: undefined,

  // Original text: 'No SR'
  vdiMigrateNoSr: undefined,

  // Original text: 'A target SR is required to migrate a VDI'
  vdiMigrateNoSrMessage: undefined,

  // Original text: 'Forget'
  vdiForget: undefined,

  // Original text: 'Remove VDI'
  vdiRemove: undefined,

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

  // Original text: 'Bootable'
  vbdBootable: undefined,

  // Original text: 'Readonly'
  vbdReadonly: undefined,

  // Original text: 'Create'
  vbdCreate: undefined,

  // Original text: 'Disk name'
  vbdNamePlaceHolder: undefined,

  // Original text: 'Size'
  vbdSizePlaceHolder: undefined,

  // Original text: 'Save'
  saveBootOption: undefined,

  // Original text: 'Reset'
  resetBootOption: undefined,

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

  // Original text: 'Create a VM from this snapshot'
  copySnapshot: undefined,

  // Original text: 'Export this snapshot'
  exportSnapshot: undefined,

  // Original text: 'Creation date'
  snapshotDate: undefined,

  // Original text: 'Name'
  snapshotName: undefined,

  // Original text: 'Action'
  snapshotAction: undefined,

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

  // Original text: 'Xen tools status'
  xenToolsStatus: undefined,

  // Original text: '{status}'
  xenToolsStatusValue: undefined,

  // Original text: 'OS name'
  osName: undefined,

  // Original text: 'OS kernel'
  osKernel: undefined,

  // Original text: 'Auto power on'
  autoPowerOn: undefined,

  // Original text: 'HA'
  ha: undefined,

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

  // Original text: 'CPU limits'
  vmCpuLimitsLabel: undefined,

  // Original text: 'Memory limits (min/max)'
  vmMemoryLimitsLabel: undefined,

  // Original text: 'vCPUs max:'
  vmMaxVcpus: undefined,

  // Original text: 'Memory max:'
  vmMaxRam: undefined,

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

  // Original text: 'Pool{pools, plural, one {} other {s}}'
  poolPanel: undefined,

  // Original text: 'Host{hosts, plural, one {} other {s}}'
  hostPanel: undefined,

  // Original text: 'VM{vms, plural, one {} other {s}}'
  vmPanel: undefined,

  // Original text: 'RAM Usage'
  memoryStatePanel: undefined,

  // Original text: 'CPUs Usage'
  cpuStatePanel: undefined,

  // Original text: 'VMs Power state'
  vmStatePanel: undefined,

  // Original text: 'Pending tasks'
  taskStatePanel: undefined,

  // Original text: 'Users'
  usersStatePanel: undefined,

  // Original text: 'Storage state'
  srStatePanel: undefined,

  // Original text: '{usage} (of {total})'
  ofUsage: undefined,

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

  // Original text: '{running} running ({halted} halted)'
  vmsStates: undefined,

  // Original text: 'Clear selection'
  dashboardStatsButtonRemoveAll: undefined,

  // Original text: 'Add all hosts'
  dashboardStatsButtonAddAllHost: undefined,

  // Original text: 'Add all VMs'
  dashboardStatsButtonAddAllVM: undefined,

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

  // Original text: 'Create a new VM on {select1} or {select2}'
  newVmCreateNewVmOn2: undefined,

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

  // Original text: 'Bootable'
  newVmBootableLabel: undefined,

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

  // Original text: 'Are you sure you want to create {nbVms} VMs?'
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

  // Original text: 'Advanced'
  newVmAdvancedPanel: undefined,

  // Original text: 'Show advanced settings'
  newVmShowAdvanced: undefined,

  // Original text: 'Hide advanced settings'
  newVmHideAdvanced: undefined,

  // Original text: 'Resource sets'
  resourceSets: undefined,

  // Original text: 'No resource sets.'
  noResourceSets: undefined,

  // Original text: 'Loading resource sets'
  loadingResourceSets: undefined,

  // Original text: 'Resource set name'
  resourceSetName: undefined,

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

  // Original text: 'Maximum RAM (GiB)'
  maxRam: undefined,

  // Original text: 'Maximum disk space'
  maxDiskSpace: undefined,

  // Original text: 'IP pool'
  ipPool: undefined,

  // Original text: 'Quantity'
  quantity: undefined,

  // Original text: 'No limits.'
  noResourceSetLimits: undefined,

  // Original text: 'Total:'
  totalResource: undefined,

  // Original text: 'Remaining:'
  remainingResource: undefined,

  // Original text: 'Used:'
  usedResource: undefined,

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

  // Original text: 'VM{nVms, plural, one {} other {s}} to import'
  vmsToImport: undefined,

  // Original text: 'Reset'
  importVmsCleanList: undefined,

  // Original text: 'VM import success'
  vmImportSuccess: undefined,

  // Original text: 'VM import failed'
  vmImportFailed: undefined,

  // Original text: 'Import starting…'
  startVmImport: undefined,

  // Original text: 'Export starting…'
  startVmExport: undefined,

  // Original text: 'Number of CPUs'
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

  // Original text: 'Schedules'
  backupSchedules: undefined,

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

  // Original text: 'Enabled'
  remoteEnabled: undefined,

  // Original text: 'Error'
  remoteError: undefined,

  // Original text: 'No backup available'
  noBackup: undefined,

  // Original text: 'VM Name'
  backupVmNameColumn: undefined,

  // Original text: 'Tags'
  backupTags: undefined,

  // Original text: 'Last Backup'
  lastBackupColumn: undefined,

  // Original text: 'Available Backups'
  availableBackupsColumn: undefined,

  // Original text: 'Missing parameters'
  backupRestoreErrorTitle: undefined,

  // Original text: 'Choose a SR and a backup'
  backupRestoreErrorMessage: undefined,

  // Original text: 'Display backups'
  displayBackup: undefined,

  // Original text: 'Import VM'
  importBackupTitle: undefined,

  // Original text: 'Starting your backup import'
  importBackupMessage: undefined,

  // Original text: 'VMs to backup'
  vmsToBackup: undefined,

  // Original text: 'Emergency shutdown Host{nHosts, plural, one {} other {s}}'
  emergencyShutdownHostsModalTitle: undefined,

  // Original text: 'Are you sure you want to shutdown {nHosts} Host{nHosts, plural, one {} other {s}}?'
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

  // Original text: 'Are you sure you want to restart {nHosts} Host{nHosts, plural, one {} other {s}} agent{nHosts, plural, one {} other {s}}?'
  restartHostsAgentsModalMessage: undefined,

  // Original text: 'Restart Host{nHosts, plural, one {} other {s}}'
  restartHostsModalTitle: undefined,

  // Original text: 'Are you sure you want to restart {nHosts} Host{nHosts, plural, one {} other {s}}?'
  restartHostsModalMessage: undefined,

  // Original text: 'Start VM{vms, plural, one {} other {s}}'
  startVmsModalTitle: undefined,

  // Original text: 'Are you sure you want to start {vms} VM{vms, plural, one {} other {s}}?'
  startVmsModalMessage: undefined,

  // Original text: 'Stop Host{nHosts, plural, one {} other {s}}'
  stopHostsModalTitle: undefined,

  // Original text: 'Are you sure you want to stop {nHosts} Host{nHosts, plural, one {} other {s}}?'
  stopHostsModalMessage: undefined,

  // Original text: 'Stop VM{vms, plural, one {} other {s}}'
  stopVmsModalTitle: undefined,

  // Original text: 'Are you sure you want to stop {vms} VM{vms, plural, one {} other {s}}?'
  stopVmsModalMessage: undefined,

  // Original text: 'Restart VM'
  restartVmModalTitle: undefined,

  // Original text: 'Are you sure you want to restart {name}?'
  restartVmModalMessage: undefined,

  // Original text: 'Stop VM'
  stopVmModalTitle: undefined,

  // Original text: 'Are you sure you want to stop {name}?'
  stopVmModalMessage: undefined,

  // Original text: 'Restart VM{vms, plural, one {} other {s}}'
  restartVmsModalTitle: undefined,

  // Original text: 'Are you sure you want to restart {vms} VM{vms, plural, one {} other {s}}?'
  restartVmsModalMessage: undefined,

  // Original text: 'Snapshot VM{vms, plural, one {} other {s}}'
  snapshotVmsModalTitle: undefined,

  // Original text: 'Are you sure you want to snapshot {vms} VM{vms, plural, one {} other {s}}?'
  snapshotVmsModalMessage: undefined,

  // Original text: 'Delete VM{vms, plural, one {} other {s}}'
  deleteVmsModalTitle: undefined,

  // Original text: 'Are you sure you want to delete {vms} VM{vms, plural, one {} other {s}}? ALL VM DISKS WILL BE REMOVED'
  deleteVmsModalMessage: undefined,

  // Original text: 'Delete VM'
  deleteVmModalTitle: undefined,

  // Original text: 'Are you sure you want to delete this VM? ALL VM DISKS WILL BE REMOVED'
  deleteVmModalMessage: undefined,

  // Original text: 'Migrate VM'
  migrateVmModalTitle: undefined,

  // Original text: 'Select a destination host:'
  migrateVmSelectHost: undefined,

  // Original text: 'Select a migration network:'
  migrateVmSelectMigrationNetwork: undefined,

  // Original text: 'For each VDI, select an SR:'
  migrateVmSelectSrs: undefined,

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

  // Original text: 'Name'
  migrateVmName: undefined,

  // Original text: 'SR'
  migrateVmSr: undefined,

  // Original text: 'VIF'
  migrateVmVif: undefined,

  // Original text: 'Network'
  migrateVmNetwork: undefined,

  // Original text: 'No target host'
  migrateVmNoTargetHost: undefined,

  // Original text: 'A target host is required to migrate a VM'
  migrateVmNoTargetHostMessage: undefined,

  // Original text: 'Delete VDI'
  deleteVdiModalTitle: undefined,

  // Original text: 'Are you sure you want to delete this disk? ALL DATA ON THIS DISK WILL BE LOST'
  deleteVdiModalMessage: undefined,

  // Original text: 'Revert your VM'
  revertVmModalTitle: undefined,

  // Original text: 'Delete snapshot'
  deleteSnapshotModalTitle: undefined,

  // Original text: 'Are you sure you want to delete this snapshot?'
  deleteSnapshotModalMessage: undefined,

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

  // Original text: 'username'
  serverPlaceHolderUser: undefined,

  // Original text: 'password'
  serverPlaceHolderPassword: undefined,

  // Original text: 'address[:port]'
  serverPlaceHolderAddress: undefined,

  // Original text: 'Connect'
  serverConnect: undefined,

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

  // Original text: 'server'
  xenOrchestraServer: undefined,

  // Original text: 'web client'
  xenOrchestraWeb: undefined,

  // Original text: 'No pro support provided!'
  noProSupport: undefined,

  // Original text: 'Use in production at your own risks'
  noProductionUse: undefined,

  // Original text: 'You can download our turnkey appliance at'
  downloadXoa: undefined,

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

  // Original text: 'Acces your XO Account'
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

  // Original text: 'Update'
  update: undefined,

  // Original text: 'Refresh'
  refresh: undefined,

  // Original text: 'Upgrade'
  upgrade: undefined,

  // Original text: 'No updater available for Community Edition'
  noUpdaterCommunity: undefined,

  // Original text: 'Please consider subscribe and try it with all features for free during 15 days on'
  noUpdaterSubscribe: undefined,

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

  // Original text: 'Delete all logs'
  logDeleteAll: undefined,

  // Original text: 'Delete all logs'
  logDeleteAllTitle: undefined,

  // Original text: 'Are you sure you want to delete all the logs?'
  logDeleteAllMessage: undefined,

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

  // Original text: 'Keyboard shortcuts'
  shortcutModalTitle: undefined,

  // Original text: 'Global'
  shortcut_XoApp: undefined,

  // Original text: 'Go to hosts list'
  shortcut_GO_TO_HOSTS: undefined,

  // Original text: 'Go to pools list'
  shortcut_GO_TO_POOLS: undefined,

  // Original text: 'Go to VMs list'
  shortcut_GO_TO_VMS: undefined,

  // Original text: 'Create a new VM'
  shortcut_CREATE_VM: undefined,

  // Original text: 'Unfocus field'
  shortcut_UNFOCUS: undefined,

  // Original text: 'Show shortcuts key bindings'
  shortcut_HELP: undefined,

  // Original text: 'Home'
  shortcut_Home: undefined,

  // Original text: 'Focus search bar'
  shortcut_SEARCH: undefined,

  // Original text: 'Next item'
  shortcut_NAV_DOWN: undefined,

  // Original text: 'Previous item'
  shortcut_NAV_UP: undefined,

  // Original text: 'Select item'
  shortcut_SELECT: undefined,

  // Original text: 'Open'
  shortcut_JUMP_INTO: undefined,

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
}
