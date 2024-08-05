// See http://momentjs.com/docs/#/use-it/browserify/
import 'moment/locale/es'

import reactIntlData from 'react-intl/locale-data/es'
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
  editableLongClickPlaceholder: 'Click largo para editar',

  // Original text: "Click to edit"
  editableClickPlaceholder: 'Click para editar',

  // Original text: 'Browse files'
  browseFiles: undefined,

  // Original text: "OK"
  alertOk: 'OK',

  // Original text: "OK"
  confirmOk: 'OK',

  // Original text: "Cancel"
  genericCancel: 'Cancelar',

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

  // Original text: 'Copy to clipboard'
  copyToClipboard: undefined,

  // Original text: 'Master'
  pillMaster: undefined,

  // Original text: "Home"
  homePage: 'Inicio',

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

  // Original text: "Dashboard"
  dashboardPage: 'Resumen',

  // Original text: "Overview"
  overviewDashboardPage: 'Vista General',

  // Original text: "Visualizations"
  overviewVisualizationDashboardPage: 'Visualizaciones',

  // Original text: "Statistics"
  overviewStatsDashboardPage: 'Estadísticas',

  // Original text: "Health"
  overviewHealthDashboardPage: 'Estado',

  // Original text: "Self service"
  selfServicePage: 'Auto servicio',

  // Original text: "Backup"
  backupPage: 'Backup',

  // Original text: "Jobs"
  jobsPage: 'Trabajos',

  // Original text: "Updates"
  updatePage: 'Actualizaciones',

  // Original text: "Settings"
  settingsPage: 'Configuración',

  // Original text: "Servers"
  settingsServersPage: 'Servidores',

  // Original text: "Users"
  settingsUsersPage: 'Usuarios',

  // Original text: "Groups"
  settingsGroupsPage: 'Grupos',

  // Original text: "ACLs"
  settingsAclsPage: 'Control de acceso',

  // Original text: "Plugins"
  settingsPluginsPage: 'Plugins',

  // Original text: 'Logs'
  settingsLogsPage: undefined,

  // Original text: 'IPs'
  settingsIpsPage: undefined,

  // Original text: "About"
  aboutPage: 'Acerca de',

  // Original text: 'About XO {xoaPlan}'
  aboutXoaPlan: undefined,

  // Original text: "New"
  newMenu: 'Nuevo',

  // Original text: "Tasks"
  taskMenu: 'Tareas',

  // Original text: 'Tasks'
  taskPage: undefined,

  // Original text: "VM"
  newVmPage: 'VM',

  // Original text: "Storage"
  newSrPage: 'Almacenamiento',

  // Original text: "Server"
  newServerPage: 'Servidor',

  // Original text: "Import"
  newImport: 'Importar',

  // Original text: 'XOSAN'
  xosan: undefined,

  // Original text: "Overview"
  backupOverviewPage: 'Visión General',

  // Original text: "New"
  backupNewPage: 'Nuevo',

  // Original text: "Remotes"
  backupRemotesPage: 'Remotos',

  // Original text: "Restore"
  backupRestorePage: 'Restaurar',

  // Original text: 'File restore'
  backupFileRestorePage: undefined,

  // Original text: "Schedule"
  schedule: 'Programación',

  // Original text: "New VM backup"
  newVmBackup: 'Nuevo backup de VM',

  // Original text: "Edit VM backup"
  editVmBackup: 'Editar backup de VM',

  // Original text: "Backup"
  backup: 'Backup',

  // Original text: "Rolling Snapshot"
  rollingSnapshot: 'Snapshot rotatorio',

  // Original text: "Delta Backup"
  deltaBackup: 'Backup diferencial',

  // Original text: "Disaster Recovery"
  disasterRecovery: 'Recuperación de desastres',

  // Original text: "Continuous Replication"
  continuousReplication: 'Replicación continua',

  // Original text: "Overview"
  jobsOverviewPage: 'Vistazo',

  // Original text: "New"
  jobsNewPage: 'Nuevo',

  // Original text: "Scheduling"
  jobsSchedulingPage: 'Programación',

  // Original text: "Custom Job"
  customJob: 'Trabajo personalizado',

  // Original text: 'User'
  userPage: undefined,

  // Original text: 'No support'
  noSupport: undefined,

  // Original text: 'Free upgrade!'
  freeUpgrade: undefined,

  // Original text: "Sign out"
  signOut: 'Salir',

  // Original text: 'Edit my settings {username}'
  editUserProfile: undefined,

  // Original text: "Fetching data…"
  homeFetchingData: 'Recuperando datos…',

  // Original text: "Welcome on Xen Orchestra!"
  homeWelcome: '¡Bienvenido a Xen Orchestra!',

  // Original text: "Add your XCP-ng hosts or pools"
  homeWelcomeText: 'Añade tus hosts/pools de XenServer',

  // Original text: 'Some XCP-ng hosts have been registered but are not connected'
  homeConnectServerText: undefined,

  // Original text: "Want some help?"
  homeHelp: '¿Necesitas ayuda?',

  // Original text: "Add server"
  homeAddServer: 'Añadir servidor',

  // Original text: 'Connect servers'
  homeConnectServer: undefined,

  // Original text: "Online Doc"
  homeOnlineDoc: 'Documentación en línea',

  // Original text: "Pro Support"
  homeProSupport: 'Soporte Pro',

  // Original text: "There are no VMs!"
  homeNoVms: '¡No hay VMs!',

  // Original text: "Or…"
  homeNoVmsOr: 'O…',

  // Original text: "Import VM"
  homeImportVm: 'Importar VM',

  // Original text: "Import an existing VM in xva format"
  homeImportVmMessage: 'Importar una VM existente en formato xva',

  // Original text: "Restore a backup"
  homeRestoreBackup: 'Restaurar un backup',

  // Original text: "Restore a backup from a remote store"
  homeRestoreBackupMessage: 'Restaurar un backup de un almacenamiento remoto',

  // Original text: "This will create a new VM"
  homeNewVmMessage: 'Esto creará una nueva VM',

  // Original text: "Filters"
  homeFilters: 'Filtros',

  // Original text: 'No results! Click here to reset your filters'
  homeNoMatches: undefined,

  // Original text: "Pool"
  homeTypePool: 'Pool',

  // Original text: "Host"
  homeTypeHost: 'Host',

  // Original text: "VM"
  homeTypeVm: 'VM',

  // Original text: "SR"
  homeTypeSr: 'SR',

  // Original text: 'Template'
  homeTypeVmTemplate: undefined,

  // Original text: "Sort"
  homeSort: 'Ordenar',

  // Original text: "Pools"
  homeAllPools: 'Pools',

  // Original text: "Hosts"
  homeAllHosts: 'Hosts',

  // Original text: "Tags"
  homeAllTags: 'Etiquetas',

  // Original text: "New VM"
  homeNewVm: 'Nueva VM',

  // Original text: 'None'
  homeFilterNone: undefined,

  // Original text: "Running hosts"
  homeFilterRunningHosts: 'Hosts en funcionamiento',

  // Original text: "Disabled hosts"
  homeFilterDisabledHosts: 'Hosts inhabilitados',

  // Original text: "Running VMs"
  homeFilterRunningVms: 'VMs en funcionamiento',

  // Original text: "Non running VMs"
  homeFilterNonRunningVms: 'VMs paradas',

  // Original text: "Pending VMs"
  homeFilterPendingVms: 'VMs pendientes',

  // Original text: "HVM guests"
  homeFilterHvmGuests: 'Invitados HVM',

  // Original text: "Tags"
  homeFilterTags: 'Etiquetas',

  // Original text: "Sort by"
  homeSortBy: 'Ordenar por',

  // Original text: "Name"
  homeSortByName: 'Nombre',

  // Original text: "Power state"
  homeSortByPowerstate: 'Estado alimentación',

  // Original text: "RAM"
  homeSortByRAM: 'RAM',

  // Original text: "vCPUs"
  homeSortByvCPUs: 'vCPUs',

  // Original text: 'CPUs'
  homeSortByCpus: undefined,

  // Original text: 'Shared/Not shared'
  homeSortByShared: undefined,

  // Original text: 'Size'
  homeSortBySize: undefined,

  // Original text: 'Usage'
  homeSortByUsage: undefined,

  // Original text: 'Type'
  homeSortByType: undefined,

  // Original text: "{displayed, number}x {icon} (on {total, number})"
  homeDisplayedItems: '{displayed, number}x {icon} (sobre {total, number})',

  // Original text: "{selected, number}x {icon} selected (on {total, number})"
  homeSelectedItems: '{selected, number}x {icon} seleccionados (sobre {total, number})',

  // Original text: "More"
  homeMore: 'Más',

  // Original text: "Migrate to…"
  homeMigrateTo: 'Migrar a…',

  // Original text: 'Missing patches'
  homeMissingPatches: undefined,

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

  // Original text: "Add"
  add: 'Añadir',

  // Original text: 'Select all'
  selectAll: undefined,

  // Original text: "Remove"
  remove: 'Quitar',

  // Original text: "Preview"
  preview: 'Vista previa',

  // Original text: "Item"
  item: 'Elemento',

  // Original text: "No selected value"
  noSelectedValue: 'No se ha seleccionado un valor',

  // Original text: "Choose user(s) and/or group(s)"
  selectSubjects: 'Elegir usuario(s) y/o grupo(s)',

  // Original text: "Select Object(s)…"
  selectObjects: 'Elegir Objeto(s)…',

  // Original text: "Choose a role"
  selectRole: 'Elegir un rol',

  // Original text: "Select Host(s)…"
  selectHosts: 'Elegir Host(s)…',

  // Original text: "Select object(s)…"
  selectHostsVms: 'Elegir objeto(s)…',

  // Original text: "Select Network(s)…"
  selectNetworks: 'Elegir Red(es)…',

  // Original text: "Select PIF(s)…"
  selectPifs: 'Elegir PIF(s)…',

  // Original text: "Select Pool(s)…"
  selectPools: 'Elegir Pool(s)…',

  // Original text: "Select Remote(s)…"
  selectRemotes: 'Elegir almacenamiento(s) remoto(s)…',

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

  // Original text: "Select SR(s)…"
  selectSrs: 'Elegir SR(s)…',

  // Original text: "Select VM(s)…"
  selectVms: 'Elegir VM(s)…',

  // Original text: "Select VM template(s)…"
  selectVmTemplates: 'Elegir plantilla(s) de VM…',

  // Original text: "Select tag(s)…"
  selectTags: 'Elegir etiqueta(s)…',

  // Original text: "Select disk(s)…"
  selectVdis: 'Elegir disco(s)…',

  // Original text: 'Select timezone…'
  selectTimezone: undefined,

  // Original text: 'Select IP(s)…'
  selectIp: undefined,

  // Original text: 'Select IP pool(s)…'
  selectIpPool: undefined,

  // Original text: "Fill required informations."
  fillRequiredInformations: 'Introducir la información requerida',

  // Original text: "Fill informations (optional)"
  fillOptionalInformations: 'Introducir datos (opcional)',

  // Original text: "Reset"
  selectTableReset: 'Reiniciar',

  // Original text: "Month"
  schedulingMonth: 'Mes',

  // Original text: 'Every N month'
  schedulingEveryNMonth: undefined,

  // Original text: "Each selected month"
  schedulingEachSelectedMonth: 'Cada mes seleccionado',

  // Original text: 'Day'
  schedulingDay: undefined,

  // Original text: 'Every N day'
  schedulingEveryNDay: undefined,

  // Original text: "Each selected day"
  schedulingEachSelectedDay: 'Cada día seleccionado',

  // Original text: 'Switch to week days'
  schedulingSetWeekDayMode: undefined,

  // Original text: 'Switch to month days'
  schedulingSetMonthDayMode: undefined,

  // Original text: "Hour"
  schedulingHour: 'Hora',

  // Original text: "Each selected hour"
  schedulingEachSelectedHour: 'Cada hora seleccionada',

  // Original text: "Every N hour"
  schedulingEveryNHour: 'Cada N horas',

  // Original text: "Minute"
  schedulingMinute: 'Minuto',

  // Original text: "Each selected minute"
  schedulingEachSelectedMinute: 'Cada minuto seleccionado',

  // Original text: "Every N minute"
  schedulingEveryNMinute: 'Cada N minutos',

  // Original text: 'Every month'
  selectTableAllMonth: undefined,

  // Original text: 'Every day'
  selectTableAllDay: undefined,

  // Original text: 'Every hour'
  selectTableAllHour: undefined,

  // Original text: 'Every minute'
  selectTableAllMinute: undefined,

  // Original text: "Reset"
  schedulingReset: 'Reiniciar',

  // Original text: "Unknown"
  unknownSchedule: 'Desconocido',

  // Original text: 'Web browser timezone'
  timezonePickerUseLocalTime: undefined,

  // Original text: 'Server timezone ({value})'
  serverTimezoneOption: undefined,

  // Original text: 'Cron Pattern:'
  cronPattern: undefined,

  // Original text: "Cannot edit backup"
  backupEditNotFoundTitle: 'Imposible editar backup',

  // Original text: "Missing required info for edition"
  backupEditNotFoundMessage: 'Falta información requerida para la edición',

  // Original text: 'Successful'
  successfulJobCall: undefined,

  // Original text: 'Failed'
  failedJobCall: undefined,

  // Original text: 'In progress'
  jobCallInProgess: undefined,

  // Original text: 'size:'
  jobTransferredDataSize: undefined,

  // Original text: 'speed:'
  jobTransferredDataSpeed: undefined,

  // Original text: "Job"
  job: 'Tarea',

  // Original text: 'Job {job}'
  jobModalTitle: undefined,

  // Original text: "ID"
  jobId: 'ID de Tarea',

  // Original text: 'Type'
  jobType: undefined,

  // Original text: "Name"
  jobName: 'Nombre',

  // Original text: 'Name of your job (forbidden: "_")'
  jobNamePlaceholder: undefined,

  // Original text: "Start"
  jobStart: 'Comenzar',

  // Original text: "End"
  jobEnd: 'Finalizar',

  // Original text: "Duration"
  jobDuration: 'Duración',

  // Original text: "Status"
  jobStatus: 'Estado',

  // Original text: "Action"
  jobAction: 'Acción',

  // Original text: "Tag"
  jobTag: 'Etiqueta',

  // Original text: "Scheduling"
  jobScheduling: 'Programación',

  // Original text: "State"
  jobState: 'Estado',

  // Original text: 'Enabled'
  jobStateEnabled: undefined,

  // Original text: 'Disabled'
  jobStateDisabled: undefined,

  // Original text: 'Timezone'
  jobTimezone: undefined,

  // Original text: 'Server'
  jobServerTimezone: undefined,

  // Original text: "Run job"
  runJob: 'Ejecutar tarea',

  // Original text: "One shot running started. See overview for logs."
  runJobVerbose: 'Comienzo del backup manual. Ir a Resumen para ver logs',

  // Original text: "Started"
  jobStarted: 'Comenzado',

  // Original text: "Finished"
  jobFinished: 'Finalizado',

  // Original text: "Save"
  saveBackupJob: 'Guardar',

  // Original text: "Remove backup job"
  deleteBackupSchedule: 'Eliminar tarea de backup',

  // Original text: "Are you sure you want to delete this backup job?"
  deleteBackupScheduleQuestion: '¿Estás seguro de querer borrar esta tarea de backup?',

  // Original text: "Enable immediately after creation"
  scheduleEnableAfterCreation: 'Activar inmediatamente tras la creación',

  // Original text: "You are editing Schedule {name} ({id}). Saving will override previous schedule state."
  scheduleEditMessage: 'Estás editando la Programación {name} ({id}). Se sobreescribirá el estado actual al guardar.',

  // Original text: "You are editing job {name} ({id}). Saving will override previous job state."
  jobEditMessage: 'Estás editando la Tarea {name} ({id}). Se sobreescribirá el estado actual al guardar.',

  // Original text: "No scheduled jobs."
  noScheduledJobs: 'No hay tareas programadas',

  // Original text: "No jobs found."
  noJobs: 'No se han encontrado tareas',

  // Original text: "No schedules found"
  noSchedules: 'No se han encontrado programaciones',

  // Original text: "Select a xo-server API command"
  jobActionPlaceHolder: 'Elige un comando de la API de xo-server',

  // Original text: ' Timeout (number of seconds after which a VM is considered failed)'
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

  // Original text: 'Backup owner'
  backupOwner: undefined,

  // Original text: "Select your backup type:"
  newBackupSelection: 'Elige el tipo de backup',

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

  // Original text: 'Warning: this feature works only with XenServer 6.5 or newer.'
  backupVersionWarning: undefined,

  // Original text: 'VMs'
  editBackupVmsTitle: undefined,

  // Original text: 'VMs statuses'
  editBackupSmartStatusTitle: undefined,

  // Original text: 'Resident on'
  editBackupSmartResidentOn: undefined,

  // Original text: 'Pools'
  editBackupSmartPools: undefined,

  // Original text: 'Tags'
  editBackupSmartTags: undefined,

  // Original text: 'VMs Tags'
  editBackupSmartTagsTitle: undefined,

  // Original text: 'Reverse'
  editBackupNot: undefined,

  // Original text: 'Tag'
  editBackupTagTitle: undefined,

  // Original text: 'Report'
  editBackupReportTitle: undefined,

  // Original text: 'Automatically run as scheduled'
  editBackupScheduleEnabled: undefined,

  // Original text: 'Depth'
  editBackupDepthTitle: undefined,

  // Original text: 'Remote'
  editBackupRemoteTitle: undefined,

  // Original text: 'Delete the old backups first'
  deleteOldBackupsFirst: undefined,

  // Original text: "Remote stores for backup"
  remoteList: 'Almacenamientos remotos para el backup',

  // Original text: "New File System Remote"
  newRemote: 'Nuevo Sistema de Archivos Remoto',

  // Original text: "Local"
  remoteTypeLocal: 'Local',

  // Original text: "NFS"
  remoteTypeNfs: 'NFS',

  // Original text: "SMB"
  remoteTypeSmb: 'Samba',

  // Original text: "Type"
  remoteType: 'Tipo',

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

  // Original text: "General"
  newSrGeneral: 'General',

  // Original text: "Select Storage Type:"
  newSrTypeSelection: 'Elige el tipo de almacenamiento',

  // Original text: "Settings"
  newSrSettings: 'Configuración',

  // Original text: "Storage Usage"
  newSrUsage: 'Utilización del almacenamiento',

  // Original text: "Summary"
  newSrSummary: 'Sumario',

  // Original text: "Host"
  newSrHost: 'Host',

  // Original text: "Type"
  newSrType: 'Tipo',

  // Original text: "Name"
  newSrName: 'Nombre',

  // Original text: "Description"
  newSrDescription: 'Descripción',

  // Original text: "Server"
  newSrServer: 'Servidor',

  // Original text: "Path"
  newSrPath: 'Ruta',

  // Original text: "IQN"
  newSrIqn: 'IQN',

  // Original text: "LUN"
  newSrLun: 'LUN',

  // Original text: "with auth."
  newSrAuth: 'con autenticación',

  // Original text: "User Name"
  newSrUsername: 'Nombre de usuario',

  // Original text: "Password"
  newSrPassword: 'Clave',

  // Original text: "Device"
  newSrDevice: 'Dispositivo',

  // Original text: "in use"
  newSrInUse: 'en uso',

  // Original text: "Size"
  newSrSize: 'Tamaño',

  // Original text: "Create"
  newSrCreate: 'Crear',

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

  // Original text: "Users/Groups"
  subjectName: 'Usuarios/Grupos',

  // Original text: "Object"
  objectName: 'Objeto',

  // Original text: 'No acls found'
  aclNoneFound: undefined,

  // Original text: "Role"
  roleName: 'Rol',

  // Original text: 'Create'
  aclCreate: undefined,

  // Original text: "New Group Name"
  newGroupName: 'Nuevo nombre del Grupo',

  // Original text: "Create Group"
  createGroup: 'Crear grupo',

  // Original text: "Create"
  createGroupButton: 'Crear',

  // Original text: "Delete Group"
  deleteGroup: 'Borrar grupo',

  // Original text: "Are you sure you want to delete this group?"
  deleteGroupConfirm: '¿Estás seguro de querer borrar este grupo?',

  // Original text: "Remove user from Group"
  removeUserFromGroup: '¿Quitar usuario del grupo?',

  // Original text: "Are you sure you want to delete this user?"
  deleteUserConfirm: '¿Estás seguro de querer borrar este usuario?',

  // Original text: "Delete User"
  deleteUser: 'Borrar usuario',

  // Original text: 'no user'
  noUser: undefined,

  // Original text: "unknown user"
  unknownUser: 'usuario desconocido',

  // Original text: "No group found"
  noGroupFound: 'Grupo no encontrado',

  // Original text: "Name"
  groupNameColumn: 'Nombre',

  // Original text: "Users"
  groupUsersColumn: 'Usuarios',

  // Original text: "Add User"
  addUserToGroupColumn: 'Añadir usuario',

  // Original text: "Email"
  userNameColumn: 'Email',

  // Original text: "Permissions"
  userPermissionColumn: 'Permisos',

  // Original text: "Password"
  userPasswordColumn: 'Clave',

  // Original text: "Email"
  userName: 'Email',

  // Original text: "Password"
  userPassword: 'Clave',

  // Original text: "Create"
  createUserButton: 'Crear',

  // Original text: "No user found"
  noUserFound: 'Usuario no encontrado',

  // Original text: "User"
  userLabel: 'Usuario',

  // Original text: "Admin"
  adminLabel: 'Admin',

  // Original text: "No user in group"
  noUserInGroup: 'Grupo sin usuarios',

  // Original text: "{users, number} user{users, plural, one {} other {s}}"
  countUsers: '{users, number} user{users, plural, one {} other {s}}',

  // Original text: "Select Permission"
  selectPermission: 'Seleccionar permiso',

  // Original text: 'No plugins found'
  noPlugins: undefined,

  // Original text: "Auto-load at server start"
  autoloadPlugin: 'Cargar al iniciar el servidor',

  // Original text: "Save configuration"
  savePluginConfiguration: 'Guardar configuración',

  // Original text: "Delete configuration"
  deletePluginConfiguration: 'Borrar configuración',

  // Original text: "Plugin error"
  pluginError: 'Error del Plugin',

  // Original text: "Unknown error"
  unknownPluginError: 'Error desconocido',

  // Original text: "Purge plugin configuration"
  purgePluginConfiguration: 'Purgar la configuración de plugins',

  // Original text: "Are you sure you want to purge this configuration ?"
  purgePluginConfigurationQuestion: '¿Estás seguro de querer purgar esta configuración?',

  // Original text: "Edit"
  editPluginConfiguration: 'Editar',

  // Original text: "Cancel"
  cancelPluginEdition: 'Cancelar',

  // Original text: "Plugin configuration"
  pluginConfigurationSuccess: 'Configuración del Plugin',

  // Original text: "Plugin configuration successfully saved!"
  pluginConfigurationChanges: '¡Configuración del Plugin guardada correctamente!',

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
  startVmLabel: 'Iniciar',

  // Original text: "Recovery start"
  recoveryModeLabel: 'Inicio de rescate',

  // Original text: "Suspend"
  suspendVmLabel: 'Suspender',

  // Original text: "Stop"
  stopVmLabel: 'Parar',

  // Original text: "Force shutdown"
  forceShutdownVmLabel: 'Forzar apagado',

  // Original text: "Reboot"
  rebootVmLabel: 'Reiniciar',

  // Original text: "Force reboot"
  forceRebootVmLabel: 'Forzar reinicio',

  // Original text: "Delete"
  deleteVmLabel: 'Borrar',

  // Original text: "Migrate"
  migrateVmLabel: 'Migrar',

  // Original text: "Snapshot"
  snapshotVmLabel: 'Snapshot',

  // Original text: "Export"
  exportVmLabel: 'Exportar',

  // Original text: "Resume"
  resumeVmLabel: 'Reanudar',

  // Original text: "Copy"
  copyVmLabel: 'Copiar',

  // Original text: "Clone"
  cloneVmLabel: 'Clonar',

  // Original text: "Fast clone"
  fastCloneVmLabel: 'Clonado rápido',

  // Original text: "Convert to template"
  convertVmToTemplateLabel: 'Convertir en plantilla',

  // Original text: "Console"
  vmConsoleLabel: 'Consola',

  // Original text: "Rescan all disks"
  srRescan: 'Releer todos los discos',

  // Original text: "Connect to all hosts"
  srReconnectAll: 'Conectar a todos los hosts',

  // Original text: "Disconnect from all hosts"
  srDisconnectAll: 'Desconectar de todos los hosts',

  // Original text: "Forget this SR"
  srForget: 'Olvidar este SR',

  // Original text: 'Forget SRs'
  srsForget: undefined,

  // Original text: "Remove this SR"
  srRemoveButton: 'Borrar este SR',

  // Original text: "No VDIs in this storage"
  srNoVdis: 'No hay VDIs en éste almancenamiento',

  // Original text: 'Pool RAM usage:'
  poolTitleRamUsage: undefined,

  // Original text: '{used} used on {total}'
  poolRamUsage: undefined,

  // Original text: 'Master:'
  poolMaster: undefined,

  // Original text: 'Display all hosts of this pool'
  displayAllHosts: undefined,

  // Original text: 'Display all storages of this pool'
  displayAllStorages: undefined,

  // Original text: 'Display all VMs of this pool'
  displayAllVMs: undefined,

  // Original text: "Hosts"
  hostsTabName: 'Hosts',

  // Original text: 'Vms'
  vmsTabName: undefined,

  // Original text: 'Srs'
  srsTabName: undefined,

  // Original text: "High Availability"
  poolHaStatus: 'Alta Disponibilidad',

  // Original text: "Enabled"
  poolHaEnabled: 'Activado',

  // Original text: "Disabled"
  poolHaDisabled: 'Desactivado',

  // Original text: "Name"
  hostNameLabel: 'Nombre',

  // Original text: "Description"
  hostDescription: 'Descripción',

  // Original text: "Memory"
  hostMemory: 'Memoria',

  // Original text: "No hosts"
  noHost: 'Sin hosts',

  // Original text: '{used}% used ({free} free)'
  memoryLeftTooltip: undefined,

  // Original text: 'PIF'
  pif: undefined,

  // Original text: "Name"
  poolNetworkNameLabel: 'Nombre',

  // Original text: "Description"
  poolNetworkDescription: 'Descripción',

  // Original text: "PIFs"
  poolNetworkPif: 'PIFs',

  // Original text: "No networks"
  poolNoNetwork: 'Sin redes',

  // Original text: "MTU"
  poolNetworkMTU: 'MTU',

  // Original text: "Connected"
  poolNetworkPifAttached: 'Conectado',

  // Original text: "Disconnected"
  poolNetworkPifDetached: 'Desconectado',

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
  addSrLabel: 'Añadir SR',

  // Original text: "Add VM"
  addVmLabel: 'Añadir VM',

  // Original text: "Add Host"
  addHostLabel: 'Añadir host',

  // Original text: 'This host needs to install {patches, number} patch{patches, plural, one {} other {es}} before it can be added to the pool. This operation may be long.'
  hostNeedsPatchUpdate: undefined,

  // Original text: "This host cannot be added to the pool because it's missing some patches."
  hostNeedsPatchUpdateNoInstall: undefined,

  // Original text: 'Adding host failed'
  addHostErrorTitle: undefined,

  // Original text: 'Host patches could not be homogenized.'
  addHostNotHomogeneousErrorMessage: undefined,

  // Original text: "Disconnect"
  disconnectServer: 'Desconectar',

  // Original text: "Start"
  startHostLabel: 'Arrancar',

  // Original text: "Stop"
  stopHostLabel: 'Parar',

  // Original text: "Enable"
  enableHostLabel: 'Activar',

  // Original text: "Disable"
  disableHostLabel: 'Desactivar',

  // Original text: "Restart toolstack"
  restartHostAgent: 'Reiniciar toolstack',

  // Original text: "Force reboot"
  forceRebootHostLabel: 'Forzar reinicio',

  // Original text: "Reboot"
  rebootHostLabel: 'Reiniciar',

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
  emergencyModeLabel: 'Modo de Emergencia',

  // Original text: "Storage"
  storageTabName: 'Almacenamiento',

  // Original text: "Patches"
  patchesTabName: 'Parches',

  // Original text: "Load average"
  statLoad: 'Carga',

  // Original text: 'RAM Usage: {memoryUsed}'
  memoryHostState: undefined,

  // Original text: "Hardware"
  hardwareHostSettingsLabel: 'Hardware',

  // Original text: "Address"
  hostAddress: 'Dirección',

  // Original text: "Status"
  hostStatus: 'Estado',

  // Original text: "Build number"
  hostBuildNumber: 'Número de compilación',

  // Original text: "iSCSI name"
  hostIscsiName: 'Nombre iSCSI',

  // Original text: "Version"
  hostXenServerVersion: 'Versión',

  // Original text: "Enabled"
  hostStatusEnabled: 'Activado',

  // Original text: "Disabled"
  hostStatusDisabled: 'Desactivado',

  // Original text: "Power on mode"
  hostPowerOnMode: 'Modo de encendido',

  // Original text: "Host uptime"
  hostStartedSince: 'Tiempo encendido',

  // Original text: "Toolstack uptime"
  hostStackStartedSince: 'Tiempo de encendido del toolstack',

  // Original text: "CPU model"
  hostCpusModel: 'Modelo de CPU',

  // Original text: "Core (socket)"
  hostCpusNumber: 'Core (socket)',

  // Original text: "Manufacturer info"
  hostManufacturerinfo: 'Información del fabricante',

  // Original text: "BIOS info"
  hostBiosinfo: 'Información de BIOS',

  // Original text: "Licence"
  licenseHostSettingsLabel: 'Licencia',

  // Original text: "Type"
  hostLicenseType: 'Tipo',

  // Original text: "Socket"
  hostLicenseSocket: 'Socket',

  // Original text: "Expiry"
  hostLicenseExpiry: 'Expiración',

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
  networkCreateButton: 'Añadir red',

  // Original text: 'Add a bonded network'
  networkCreateBondedButton: undefined,

  // Original text: "Device"
  pifDeviceLabel: 'Dispositivo',

  // Original text: "Network"
  pifNetworkLabel: 'Red',

  // Original text: "VLAN"
  pifVlanLabel: 'VLAN',

  // Original text: "Address"
  pifAddressLabel: 'Dirección',

  // Original text: 'Mode'
  pifModeLabel: undefined,

  // Original text: "MAC"
  pifMacLabel: 'MAC',

  // Original text: "MTU"
  pifMtuLabel: 'MTU',

  // Original text: "Status"
  pifStatusLabel: 'Estado',

  // Original text: "Connected"
  pifStatusConnected: 'Conectado',

  // Original text: "Disconnected"
  pifStatusDisconnected: 'Desconectado',

  // Original text: "No physical interface detected"
  pifNoInterface: 'No se ha detectado ningún interface físico',

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

  // Original text: 'Static IP address'
  staticIp: undefined,

  // Original text: 'Netmask'
  netmask: undefined,

  // Original text: 'DNS'
  dns: undefined,

  // Original text: 'Gateway'
  gateway: undefined,

  // Original text: "Add a storage"
  addSrDeviceButton: 'Añadir un almacenamiento',

  // Original text: "Name"
  srNameLabel: 'Nombre',

  // Original text: "Type"
  srType: 'Tipo',

  // Original text: 'Action'
  pbdAction: undefined,

  // Original text: "Status"
  pbdStatus: 'Estado',

  // Original text: "Connected"
  pbdStatusConnected: 'Conectado',

  // Original text: "Disconnected"
  pbdStatusDisconnected: 'Desconectado',

  // Original text: 'Connect'
  pbdConnect: undefined,

  // Original text: 'Disconnect'
  pbdDisconnect: undefined,

  // Original text: 'Forget'
  pbdForget: undefined,

  // Original text: "Shared"
  srShared: 'Compartido',

  // Original text: "Not shared"
  srNotShared: 'No compartido',

  // Original text: "No storage detected"
  pbdNoSr: 'No se han detectado almacenamientos',

  // Original text: "Name"
  patchNameLabel: 'Nombre',

  // Original text: "Install all patches"
  patchUpdateButton: 'Instalar todos los parches',

  // Original text: "Description"
  patchDescription: 'Descripción',

  // Original text: "Applied date"
  patchApplied: 'Fecha de publicación',

  // Original text: "Size"
  patchSize: 'Tamaño',

  // Original text: "Status"
  patchStatus: 'Estado',

  // Original text: "Applied"
  patchStatusApplied: 'Aplicado',

  // Original text: "Missing patches"
  patchStatusNotApplied: 'Parches pendientes',

  // Original text: "No patch detected"
  patchNothing: 'No se ha detectado el parche',

  // Original text: "Release date"
  patchReleaseDate: 'Fecha de publicación',

  // Original text: "Guidance"
  patchGuidance: 'Guía',

  // Original text: "Action"
  patchAction: 'Acción',

  // Original text: 'Applied patches'
  hostAppliedPatches: undefined,

  // Original text: "Missing patches"
  hostMissingPatches: 'Parches pendientes',

  // Original text: "Host up-to-date!"
  hostUpToDate: '¡Host al día!',

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

  // Original text: "General"
  generalTabName: 'General',

  // Original text: "Stats"
  statsTabName: 'Estadísticas',

  // Original text: "Console"
  consoleTabName: 'Consola',

  // Original text: 'Container'
  containersTabName: undefined,

  // Original text: "Snapshots"
  snapshotsTabName: 'Snapshots',

  // Original text: "Logs"
  logsTabName: 'Logs',

  // Original text: "Advanced"
  advancedTabName: 'Avanzado',

  // Original text: "Network"
  networkTabName: 'Red',

  // Original text: "Disk{disks, plural, one {} other {s}}"
  disksTabName: 'Disco{disks, plural, one {} other {s}}',

  // Original text: "halted"
  powerStateHalted: 'parada',

  // Original text: "running"
  powerStateRunning: 'corriendo',

  // Original text: "suspended"
  powerStateSuspended: 'suspendida',

  // Original text: "No Xen tools detected"
  vmStatus: 'Xen Tools no detectado',

  // Original text: "No IPv4 record"
  vmName: 'Sin registro IPv4',

  // Original text: "No IP record"
  vmDescription: 'Sin registro IP',

  // Original text: "Started {ago}"
  vmSettings: 'Arrancada {ago}',

  // Original text: "Current status:"
  vmCurrentStatus: 'Estado actual',

  // Original text: "Not running"
  vmNotRunning: 'No está corriendo',

  // Original text: 'Halted {ago}'
  vmHaltedSince: undefined,

  // Original text: "No Xen tools detected"
  noToolsDetected: 'Xen Tools no detectado',

  // Original text: "No IPv4 record"
  noIpv4Record: 'Sin registro IPv4',

  // Original text: "No IP record"
  noIpRecord: 'Sin  registro IP',

  // Original text: "Started {ago}"
  started: 'Arrancada {ago}',

  // Original text: "Paravirtualization (PV)"
  paraVirtualizedMode: 'Paravirtualización (PV)',

  // Original text: "Hardware virtualization (HVM)"
  hardwareVirtualizedMode: 'Paravirtualización por Hardware (HVM)',

  // Original text: "CPU usage"
  statsCpu: 'Uso de CPU',

  // Original text: "Memory usage"
  statsMemory: 'Uso de Memoria',

  // Original text: "Network throughput"
  statsNetwork: 'Actividad de Red',

  // Original text: 'Stacked values'
  useStackedValuesOnStats: undefined,

  // Original text: "Disk throughput"
  statDisk: 'Actividad de Disco',

  // Original text: "Last 10 minutes"
  statLastTenMinutes: 'Últimos 10 minutos',

  // Original text: "Last 2 hours"
  statLastTwoHours: 'Últimas 2 horas',

  // Original text: "Last week"
  statLastWeek: 'Última semana',

  // Original text: "Last year"
  statLastYear: 'Último año',

  // Original text: "Copy"
  copyToClipboardLabel: 'Copiar',

  // Original text: "Ctrl+Alt+Del"
  ctrlAltDelButtonLabel: 'Ctrl+Alt+Del',

  // Original text: "Tip:"
  tipLabel: 'Consejo:',

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

  // Original text: "Action"
  vdiAction: 'Acción',

  // Original text: "Attach disk"
  vdiAttachDevice: 'Adjuntar disco',

  // Original text: "New disk"
  vbdCreateDeviceButton: 'Nuevo disco',

  // Original text: "Boot order"
  vdiBootOrder: 'Order de arranque',

  // Original text: "Name"
  vdiNameLabel: 'Nombre',

  // Original text: "Description"
  vdiNameDescription: 'Descripción',

  // Original text: 'Pool'
  vdiPool: undefined,

  // Original text: 'Disconnect'
  vdiDisconnect: undefined,

  // Original text: "Tags"
  vdiTags: 'Tareas',

  // Original text: "Size"
  vdiSize: 'Tamaño',

  // Original text: "SR"
  vdiSr: 'SR',

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

  // Original text: 'No VDIs attached to Control Domain'
  noControlDomainVdis: undefined,

  // Original text: "Boot flag"
  vbdBootableStatus: 'Etiqueta de Inicio',

  // Original text: "Status"
  vbdStatus: 'Estado',

  // Original text: "Connected"
  vbdStatusConnected: 'Conectado',

  // Original text: "Disconnected"
  vbdStatusDisconnected: 'Desconectado',

  // Original text: "No disks"
  vbdNoVbd: 'Sin discos',

  // Original text: 'Connect VBD'
  vbdConnect: undefined,

  // Original text: 'Disconnect VBD'
  vbdDisconnect: undefined,

  // Original text: 'Bootable'
  vbdBootable: undefined,

  // Original text: 'Readonly'
  vbdReadonly: undefined,

  // Original text: 'Action'
  vbdAction: undefined,

  // Original text: 'Create'
  vbdCreate: undefined,

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

  // Original text: "New device"
  vifCreateDeviceButton: 'Nuevo dispositivo',

  // Original text: "No interface"
  vifNoInterface: 'Sin interface',

  // Original text: "Device"
  vifDeviceLabel: 'Dispositivo',

  // Original text: "MAC address"
  vifMacLabel: 'Dirección MAC',

  // Original text: "MTU"
  vifMtuLabel: 'MTU',

  // Original text: "Network"
  vifNetworkLabel: 'Red',

  // Original text: "Status"
  vifStatusLabel: 'Estado',

  // Original text: "Connected"
  vifStatusConnected: 'Conectado',

  // Original text: "Disconnected"
  vifStatusDisconnected: 'Desconectado',

  // Original text: 'Connect'
  vifConnect: undefined,

  // Original text: 'Disconnect'
  vifDisconnect: undefined,

  // Original text: 'Remove'
  vifRemove: undefined,

  // Original text: "IP addresses"
  vifIpAddresses: 'Dirección IP',

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

  // Original text: "No snapshots"
  noSnapshots: 'Sin snapshots',

  // Original text: "New snapshot"
  snapshotCreateButton: 'Nuevo snapshot',

  // Original text: "Just click on the snapshot button to create one!"
  tipCreateSnapshotLabel: '¡Haz click en el botón de snapshot para crear uno!',

  // Original text: 'Revert VM to this snapshot'
  revertSnapshot: undefined,

  // Original text: 'Remove this snapshot'
  deleteSnapshot: undefined,

  // Original text: 'Create a VM from this snapshot'
  copySnapshot: undefined,

  // Original text: 'Export this snapshot'
  exportSnapshot: undefined,

  // Original text: "Creation date"
  snapshotDate: 'Fecha de creación',

  // Original text: "Name"
  snapshotName: 'Nombre',

  // Original text: "Action"
  snapshotAction: 'Acción',

  // Original text: 'Quiesced snapshot'
  snapshotQuiesce: undefined,

  // Original text: "Remove all logs"
  logRemoveAll: 'Elimintar todos los logs',

  // Original text: "No logs so far"
  noLogs: 'No hay logs',

  // Original text: "Creation date"
  logDate: 'Fecha de creación',

  // Original text: "Name"
  logName: 'Nombre',

  // Original text: "Content"
  logContent: 'Contenido',

  // Original text: "Action"
  logAction: 'Acción',

  // Original text: "Remove"
  vmRemoveButton: 'Quitar',

  // Original text: "Convert"
  vmConvertButton: 'Convertir',

  // Original text: "Xen settings"
  xenSettingsLabel: 'Configuraciones de Xen',

  // Original text: "Guest OS"
  guestOsLabel: 'SO Invitado',

  // Original text: "Misc"
  miscLabel: 'Varuis',

  // Original text: "UUID"
  uuid: 'UUID',

  // Original text: "Virtualization mode"
  virtualizationMode: 'Modo de virtualización',

  // Original text: "CPU weight"
  cpuWeightLabel: 'Peso de CPU',

  // Original text: "Default ({value, number})"
  defaultCpuWeight: 'Por defecto',

  // Original text: 'CPU cap'
  cpuCapLabel: undefined,

  // Original text: 'Default ({value, number})'
  defaultCpuCap: undefined,

  // Original text: "PV args"
  pvArgsLabel: 'Argumentos PV',

  // Original text: "Xen tools status"
  xenToolsStatus: 'Estado de Xen Tools',

  // Original text: "{status}"
  xenToolsStatusValue: '{status}',

  // Original text: "OS name"
  osName: 'Nombre del OS',

  // Original text: "OS kernel"
  osKernel: 'Kernel del OS',

  // Original text: "Auto power on"
  autoPowerOn: 'Auto encendido',

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
  originalTemplate: 'Plantilla original',

  // Original text: "Unknown"
  unknownOsName: 'Desconocido',

  // Original text: "Unknown"
  unknownOsKernel: 'Desconocido',

  // Original text: "Unknown"
  unknownOriginalTemplate: 'Desconocido',

  // Original text: "VM limits"
  vmLimitsLabel: 'Límites de VM',

  // Original text: "CPU limits"
  vmCpuLimitsLabel: 'Límites de CPU',

  // Original text: 'Topology'
  vmCpuTopology: undefined,

  // Original text: 'Default behavior'
  vmChooseCoresPerSocket: undefined,

  // Original text: '{nSockets, number} socket{nSockets, plural, one {} other {s}} with {nCores, number} core{nCores, plural, one {} other {s}} per socket'
  vmSocketsWithCoresPerSocket: undefined,

  // Original text: 'Incorrect cores per socket value'
  vmCoresPerSocketIncorrectValue: undefined,

  // Original text: 'Please change the selected value to fix it.'
  vmCoresPerSocketIncorrectValueSolution: undefined,

  // Original text: "Memory limits (min/max)"
  vmMemoryLimitsLabel: 'Límites de memoria (min/max)',

  // Original text: "vCPUs max:"
  vmMaxVcpus: 'Max vCPUs:',

  // Original text: "Memory max:"
  vmMaxRam: 'Max Memoria:',

  // Original text: "Long click to add a name"
  vmHomeNamePlaceholder: 'Click largo para poner el nombre',

  // Original text: "Long click to add a description"
  vmHomeDescriptionPlaceholder: 'Click largo para poner la descripción',

  // Original text: "Click to add a name"
  vmViewNamePlaceholder: 'Click para definir el nombre',

  // Original text: "Click to add a description"
  vmViewDescriptionPlaceholder: 'Click para definir la descripción',

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

  // Original text: "Pool{pools, plural, one {} other {s}}"
  poolPanel: 'Pool{pools, plural, one {} other {s}}',

  // Original text: "Host{hosts, plural, one {} other {s}}"
  hostPanel: 'Host{hosts, plural, one {} other {s}}',

  // Original text: "VM{vms, plural, one {} other {s}}"
  vmPanel: 'VM{vms, plural, one {} other {s}}',

  // Original text: "RAM Usage:"
  memoryStatePanel: 'Uso de RAM',

  // Original text: "CPUs Usage"
  cpuStatePanel: 'Uso de CPU',

  // Original text: "VMs Power state"
  vmStatePanel: 'Estado alimentación de las VMs',

  // Original text: "Pending tasks"
  taskStatePanel: 'Tareas pendientes',

  // Original text: "Users"
  usersStatePanel: 'Usuarios',

  // Original text: "Storage state"
  srStatePanel: 'Estado del almacenamiento',

  // Original text: "{usage} (of {total})"
  ofUsage: 'de',

  // Original text: "No storage"
  noSrs: 'Sin almacenamiento',

  // Original text: "Name"
  srName: 'Nombre',

  // Original text: "Pool"
  srPool: 'Pool',

  // Original text: "Host"
  srHost: 'Host',

  // Original text: "Type"
  srFormat: 'Tipo',

  // Original text: "Size"
  srSize: 'Tamaño',

  // Original text: "Usage"
  srUsage: 'Uso',

  // Original text: "used"
  srUsed: 'Usado',

  // Original text: "free"
  srFree: 'libre',

  // Original text: "Storage Usage"
  srUsageStatePanel: 'Uso del almacenamiento',

  // Original text: "Top 5 SR Usage (in %)"
  srTopUsageStatePanel: 'Top 5 de uso de SR (en %)',

  // Original text: '{running, number} running ({halted, number} halted)'
  vmsStates: undefined,

  // Original text: 'Clear selection'
  dashboardStatsButtonRemoveAll: undefined,

  // Original text: 'Add all hosts'
  dashboardStatsButtonAddAllHost: undefined,

  // Original text: 'Add all VMs'
  dashboardStatsButtonAddAllVM: undefined,

  // Original text: "{value} {date, date, medium}"
  weekHeatmapData: '{value} {date, date, medium}',

  // Original text: "No data."
  weekHeatmapNoData: 'Sin datos.',

  // Original text: "Weekly Heatmap"
  weeklyHeatmap: 'Heatmap Semanal',

  // Original text: "Weekly Charts"
  weeklyCharts: 'Gráficos Semanales',

  // Original text: "Synchronize scale:"
  weeklyChartsScaleInfo: 'Sincronizar escala',

  // Original text: "Stats error"
  statsDashboardGenericErrorTitle: 'Error de stats',

  // Original text: "There is no stats available for:"
  statsDashboardGenericErrorMessage: 'No hay stats disponibles para:',

  // Original text: "No selected metric"
  noSelectedMetric: 'Métrica no seleccionada',

  // Original text: "Select"
  statsDashboardSelectObjects: 'Seleccionar',

  // Original text: "Loading…"
  metricsLoading: 'Cargando…',

  // Original text: "Coming soon!"
  comingSoon: '¡Próximamente!',

  // Original text: "Orphaned snapshot VDIs"
  orphanedVdis: 'VIDs huérfanos',

  // Original text: "Orphaned VMs snapshot"
  orphanedVms: 'VMs huérfanas',

  // Original text: "No orphans"
  noOrphanedObject: 'Sin huérfanos',

  // Original text: "Remove all orphaned snapshot VDIs"
  removeAllOrphanedObject: 'Eliminar todos los VDIs huérfanos',

  // Original text: 'VDIs attached to Control Domain'
  vdisOnControlDomain: undefined,

  // Original text: "Name"
  vmNameLabel: 'Nombre',

  // Original text: "Description"
  vmNameDescription: 'Descripción',

  // Original text: "Resident on"
  vmContainer: 'Residente en',

  // Original text: "Alarms"
  alarmMessage: 'Alarmas',

  // Original text: "No alarms"
  noAlarms: 'Sin alarmas',

  // Original text: "Date"
  alarmDate: 'Fecha',

  // Original text: "Content"
  alarmContent: 'Contenido',

  // Original text: "Issue on"
  alarmObject: 'Producido el',

  // Original text: "Pool"
  alarmPool: 'Pool',

  // Original text: "Remove all alarms"
  alarmRemoveAll: 'Eliminar todas las alarmas',

  // Original text: '{used}% used ({free} left)'
  spaceLeftTooltip: undefined,

  // Original text: "Create a new VM on {select}"
  newVmCreateNewVmOn: 'Crear una nueva VM en {pool}',

  // Original text: 'Create a new VM on {select1} or {select2}'
  newVmCreateNewVmOn2: undefined,

  // Original text: 'You have no permission to create a VM'
  newVmCreateNewVmNoPermission: undefined,

  // Original text: "Infos"
  newVmInfoPanel: 'Información',

  // Original text: "Name"
  newVmNameLabel: 'Nombre',

  // Original text: "Template"
  newVmTemplateLabel: 'Plantilla',

  // Original text: "Description"
  newVmDescriptionLabel: 'Descripción',

  // Original text: "Performances"
  newVmPerfPanel: 'Rendimiento',

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
  newVmInstallSettingsPanel: 'Opciones de instalación',

  // Original text: "ISO/DVD"
  newVmIsoDvdLabel: 'ISO/DVD',

  // Original text: "Network"
  newVmNetworkLabel: 'Red',

  // Original text: 'e.g: http://httpredir.debian.org/debian'
  newVmInstallNetworkPlaceHolder: undefined,

  // Original text: "PV Args"
  newVmPvArgsLabel: 'Detalles del PV',

  // Original text: "PXE"
  newVmPxeLabel: 'PXE',

  // Original text: "Interfaces"
  newVmInterfacesPanel: 'Interfaces',

  // Original text: "MAC"
  newVmMacLabel: 'MAC',

  // Original text: "Add interface"
  newVmAddInterface: 'Añadir interface',

  // Original text: "Disks"
  newVmDisksPanel: 'Discos',

  // Original text: "SR"
  newVmSrLabel: 'SR',

  // Original text: "Size"
  newVmSizeLabel: 'Tamaño',

  // Original text: "Add disk"
  newVmAddDisk: 'Añadir disco',

  // Original text: "Summary"
  newVmSummaryPanel: 'Sumario',

  // Original text: "Create"
  newVmCreate: 'Crear',

  // Original text: "Reset"
  newVmReset: 'Reiniciar',

  // Original text: "Select template"
  newVmSelectTemplate: 'Elegir plantilla',

  // Original text: "SSH key"
  newVmSshKey: 'Clave SSH',

  // Original text: "Config drive"
  newVmConfigDrive: 'Config drive',

  // Original text: "Custom config"
  newVmCustomConfig: 'Configuración personalizada',

  // Original text: "Boot VM after creation"
  newVmBootAfterCreate: 'Arrancar la VM tras crearla',

  // Original text: "Auto-generated if empty"
  newVmMacPlaceholder: 'Auto generada si se deja vacío',

  // Original text: "CPU weight"
  newVmCpuWeightLabel: 'Peso de CPU',

  // Original text: 'Default: {value, number}'
  newVmDefaultCpuWeight: undefined,

  // Original text: 'CPU cap'
  newVmCpuCapLabel: undefined,

  // Original text: 'Default: {value, number}'
  newVmDefaultCpuCap: undefined,

  // Original text: "Cloud config"
  newVmCloudConfig: 'Cloud config',

  // Original text: "Create VMs"
  newVmCreateVms: 'VMs creadas',

  // Original text: "Are you sure you want to create {nbVms, number} VMs?"
  newVmCreateVmsConfirm: '¿Estás seguro de querer crear {nbVms, number} VMs?',

  // Original text: "Multiple VMs:"
  newVmMultipleVms: 'Múltiple VMs:',

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

  // Original text: "Resource sets"
  resourceSets: 'Conjunto de recursos',

  // Original text: "No resource sets."
  noResourceSets: 'No hay conjuntos de recursos',

  // Original text: 'Loading resource sets'
  loadingResourceSets: undefined,

  // Original text: "Resource set name"
  resourceSetName: 'Nombre del conjunto de recursos',

  // Original text: 'Recompute all limits'
  recomputeResourceSets: undefined,

  // Original text: "Save"
  saveResourceSet: 'Guardar',

  // Original text: "Reset"
  resetResourceSet: 'Reiniciar',

  // Original text: "Edit"
  editResourceSet: 'Editar',

  // Original text: "Delete"
  deleteResourceSet: 'Bprrar',

  // Original text: "Delete resource set"
  deleteResourceSetWarning: 'Borrar conjunto de recursos',

  // Original text: "Are you sure you want to delete this resource set?"
  deleteResourceSetQuestion: '¿Estás seguro de querer borrar este conjunto de recursos?',

  // Original text: "Missing objects:"
  resourceSetMissingObjects: 'Objetos perdidos:',

  // Original text: "vCPUs"
  resourceSetVcpus: 'vCPUs',

  // Original text: "Memory"
  resourceSetMemory: 'Memoria',

  // Original text: "Storage"
  resourceSetStorage: 'Almacenamiento',

  // Original text: "Unknown"
  unknownResourceSetValue: 'Desconocido',

  // Original text: "Available hosts"
  availableHosts: 'Hosts disponibles',

  // Original text: "Excluded hosts"
  excludedHosts: 'Hosts excluídos',

  // Original text: "No hosts available."
  noHostsAvailable: 'No hay hosts disponibles',

  // Original text: "VMs created from this resource set shall run on the following hosts."
  availableHostsDescription: 'Las VMs creadas con este conjunto de recursos correrán en los siguientes hosts.',

  // Original text: "Maximum CPUs"
  maxCpus: 'Máximas CPUs',

  // Original text: "Maximum RAM (GiB)"
  maxRam: 'Máxima RAM (GiB)',

  // Original text: "Maximum disk space"
  maxDiskSpace: 'Máximo espacio en disco',

  // Original text: 'IP pool'
  ipPool: undefined,

  // Original text: 'Quantity'
  quantity: undefined,

  // Original text: "No limits."
  noResourceSetLimits: 'Sin límites',

  // Original text: "Total:"
  totalResource: 'Total:',

  // Original text: "Remaining:"
  remainingResource: 'Restante:',

  // Original text: "Used:"
  usedResource: 'Utilizado:',

  // Original text: 'New'
  resourceSetNew: undefined,

  // Original text: "Try dropping some VMs files here, or click to select VMs to upload. Accept only .xva/.ova files."
  importVmsList:
    'Haz drag & drop de backups aquí, o haz click para seleccionar qué backups subir. Sólo se aceptan ficheros .xva',

  // Original text: "No selected VMs."
  noSelectedVms: 'No se han seleccionado VMs',

  // Original text: "To Pool:"
  vmImportToPool: 'Al Pool:',

  // Original text: "To SR:"
  vmImportToSr: 'al SR:',

  // Original text: "VM{nVms, plural, one {} other {s}} to import"
  vmsToImport: 'VM{nVms, plural, one {} other {s}} para importar',

  // Original text: "Reset"
  importVmsCleanList: 'Reiniciar',

  // Original text: "VM import success"
  vmImportSuccess: 'Importación de VM satisfactoria',

  // Original text: "VM import failed"
  vmImportFailed: 'Falló la importación de VM',

  // Original text: "Import starting…"
  startVmImport: 'Comenzando importación…',

  // Original text: "Export starting…"
  startVmExport: 'Comenzando export…',

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

  // Original text: "No pending tasks"
  noTasks: 'No hay tareas pendientes',

  // Original text: "Currently, there are not any pending XenServer tasks"
  xsTasks: 'Ahora mismo no hay tareas de XenServer pendientes',

  // Original text: 'Schedules'
  backupSchedules: undefined,

  // Original text: 'Get remote'
  getRemote: undefined,

  // Original text: "List Remote"
  listRemote: 'Listar backups remotos',

  // Original text: "simple"
  simpleBackup: 'simple',

  // Original text: "delta"
  delta: 'diferencial',

  // Original text: "Restore Backups"
  restoreBackups: 'Restaurar backups',

  // Original text: 'Click on a VM to display restore options'
  restoreBackupsInfo: undefined,

  // Original text: "Enabled"
  remoteEnabled: 'activado',

  // Original text: "Error"
  remoteError: 'error',

  // Original text: "No backup available"
  noBackup: 'No hay backups disponibles',

  // Original text: "VM Name"
  backupVmNameColumn: 'Nombre VM',

  // Original text: 'Tags'
  backupTags: undefined,

  // Original text: "Last Backup"
  lastBackupColumn: 'Último backup',

  // Original text: "Available Backups"
  availableBackupsColumn: 'Backups disponibles',

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

  // Original text: "Import VM"
  importBackupTitle: 'Importar VM',

  // Original text: "Starting your backup import"
  importBackupMessage: 'Comenzando importación del backup',

  // Original text: 'VMs to backup'
  vmsToBackup: undefined,

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

  // Original text: "Start VM{vms, plural, one {} other {s}}"
  startVmsModalTitle: 'Arrancar VM{vms, plural, one {} other {s}}',

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
  startVmsModalMessage: '¿Estás seguro de querar arrancar {vms} VM{vms, plural, one {} other {s}}?',

  // Original text: '{nVms, number} vm{nVms, plural, one {} other {s}} are failed. Please see your logs to get more information'
  failedVmsErrorMessage: undefined,

  // Original text: 'Start failed'
  failedVmsErrorTitle: undefined,

  // Original text: 'Stop Host{nHosts, plural, one {} other {s}}'
  stopHostsModalTitle: undefined,

  // Original text: 'Are you sure you want to stop {nHosts, number} Host{nHosts, plural, one {} other {s}}?'
  stopHostsModalMessage: undefined,

  // Original text: "Stop VM{vms, plural, one {} other {s}}"
  stopVmsModalTitle: 'Parar VM{vms, plural, one {} other {s}}',

  // Original text: "Are you sure you want to stop {vms, number} VM{vms, plural, one {} other {s}}?"
  stopVmsModalMessage: '¿Estás seguro de querer parar {vms, number} VM{vms, plural, one {} other {s}}?',

  // Original text: 'Restart VM'
  restartVmModalTitle: undefined,

  // Original text: 'Are you sure you want to restart {name}?'
  restartVmModalMessage: undefined,

  // Original text: 'Stop VM'
  stopVmModalTitle: undefined,

  // Original text: 'Are you sure you want to stop {name}?'
  stopVmModalMessage: undefined,

  // Original text: "Restart VM{vms, plural, one {} other {s}}"
  restartVmsModalTitle: 'Reiniciar VM{vms, plural, one {} other {s}}',

  // Original text: "Are you sure you want to restart {vms, number} VM{vms, plural, one {} other {s}}?"
  restartVmsModalMessage: '¿Estás seguro de querer reiniciar {vms, number} VM{vms, plural, one {} other {s}}?',

  // Original text: "Snapshot VM{vms, plural, one {} other {s}}"
  snapshotVmsModalTitle: 'Snapshot VM{vms, plural, one {} other {s}}',

  // Original text: "Are you sure you want to snapshot {vms, number} VM{vms, plural, one {} other {s}}?"
  snapshotVmsModalMessage: '¿Estás seguro de querer hacer snapshot de {vms, number} VM{vms, plural, one {} other {s}}?',

  // Original text: "Delete VM{vms, plural, one {} other {s}}"
  deleteVmsModalTitle: 'Borrar VM{vms, plural, one {} other {s}}',

  // Original text: "Are you sure you want to delete {vms, number} VM{vms, plural, one {} other {s}}? ALL VM DISKS WILL BE REMOVED"
  deleteVmsModalMessage:
    '¿Estás seguro de querar borrar {vms, number} VM{vms, plural, one {} other {s}}? TODOS SUS DISCOS SERAN ELIMINADOS',

  // Original text: "Delete VM"
  deleteVmModalTitle: 'Borrar VM',

  // Original text: "Are you sure you want to delete this VM? ALL VM DISKS WILL BE REMOVED"
  deleteVmModalMessage: '¿Estás seguro de querer borrar esta VM? TODOS SUS DISCOS SERAN ELIMINADOS',

  // Original text: "Migrate VM"
  migrateVmModalTitle: 'Migrar VM',

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
  optionalEntry: undefined,

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

  // Original text: "Import a {name} Backup"
  importBackupModalTitle: 'Importar un backup {name}',

  // Original text: "Start VM after restore"
  importBackupModalStart: 'Arrancar la VM tras la restauración',

  // Original text: "Select your backup…"
  importBackupModalSelectBackup: 'Elige el backup…',

  // Original text: "Are you sure you want to remove all orphaned snapshot VDIs?"
  removeAllOrphanedModalWarning: '¿Estás seguro de querer borrar todos los VDIs huérfanos?',

  // Original text: "Remove all logs"
  removeAllLogsModalTitle: 'Borrar todos los logs',

  // Original text: "Are you sure you want to remove all logs?"
  removeAllLogsModalWarning: '¿Estás seguro de querar borrar todos los logs?',

  // Original text: "This operation is definitive."
  definitiveMessageModal: 'Esta operación es definitiva',

  // Original text: "Previous SR Usage"
  existingSrModalTitle: 'Uso anterior del SR',

  // Original text: "This path has been previously used as a Storage by a XenServer host. All data will be lost if you choose to continue the SR creation."
  existingSrModalText:
    'Esta ruta ya ha sido utilizada anteriormente como Almacenamiento por un host XenServer. Todos los datos existentes se perderán si continuas con la creación del SR.',

  // Original text: "Previous LUN Usage"
  existingLunModalTitle: 'Uso anterior de la LUN',

  // Original text: "This LUN has been previously used as a Storage by a XenServer host. All data will be lost if you choose to continue the SR creation."
  existingLunModalText:
    'Esta LUN ya ha sido utilizada anteriormente como Almacenamiento por un host XenServer. Todos los datos existentes se perderán si continuas con la creación del SR.',

  // Original text: "Replace current registration?"
  alreadyRegisteredModal: '¿Reemplazar el registro actual?',

  // Original text: "Your XO appliance is already registered to {email}, do you want to forget and replace this registration ?"
  alreadyRegisteredModalText: 'Tu XOA ya está registrado en {email}, ¿quieres olvidar y reemplazar este registro?',

  // Original text: "Ready for trial?"
  trialReadyModal: '¿Preparado para el periodo de prueba?',

  // Original text: "During the trial period, XOA need to have a working internet connection. This limitation does not apply for our paid plans!"
  trialReadyModalText:
    'Durante el periodo de prueba, XOA necesita conexión a Internet. Esta limitación no aplica a los planes de pago',

  // Original text: 'Label'
  serverLabel: undefined,

  // Original text: "Host"
  serverHost: 'Host',

  // Original text: "Username"
  serverUsername: 'Usuario',

  // Original text: "Password"
  serverPassword: 'Clave',

  // Original text: "Action"
  serverAction: 'Acción',

  // Original text: "Read Only"
  serverReadOnly: 'Sólo lectura',

  // Original text: 'Unauthorized Certificates'
  serverUnauthorizedCertificates: undefined,

  // Original text: 'Allow Unauthorized Certificates'
  serverAllowUnauthorizedCertificates: undefined,

  // Original text: "Enable it if your certificate is rejected, but it's not recommended because your connection will not be secured."
  serverUnauthorizedCertificatesInfo: undefined,

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

  // Original text: 'Authentication error'
  serverAuthFailed: undefined,

  // Original text: 'Unknown error'
  serverUnknownError: undefined,

  // Original text: 'Invalid self-signed certificate'
  serverSelfSignedCertError: undefined,

  // Original text: 'Do you want to accept self-signed certificate for this server even though it would decrease security?'
  serverSelfSignedCertQuestion: undefined,

  // Original text: "Copy VM"
  copyVm: 'Copiar VM',

  // Original text: "Are you sure you want to copy this VM to {SR}?"
  copyVmConfirm: '¿Estás seguro de querer copiar esta VM a {SR}?',

  // Original text: "Name"
  copyVmName: 'Nombre',

  // Original text: 'Name pattern'
  copyVmNamePattern: undefined,

  // Original text: "If empty: name of the copied VM"
  copyVmNamePlaceholder: 'Vacío: nombre de la VM copiada',

  // Original text: 'e.g.: "\\{name\\}_COPY"'
  copyVmNamePatternPlaceholder: undefined,

  // Original text: "Select SR"
  copyVmSelectSr: 'Elegir SR',

  // Original text: "Use compression"
  copyVmCompress: 'Usar compresión',

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

  // Original text: "Create network"
  newNetworkCreate: 'Crear red',

  // Original text: 'Create bonded network'
  newBondedNetworkCreate: undefined,

  // Original text: "Interface"
  newNetworkInterface: 'Interface',

  // Original text: "Name"
  newNetworkName: 'Nombre',

  // Original text: "Description"
  newNetworkDescription: 'Descripción',

  // Original text: "VLAN"
  newNetworkVlan: 'VLAN',

  // Original text: "No VLAN if empty"
  newNetworkDefaultVlan: 'Sin VLAN si se deja vacío',

  // Original text: "MTU"
  newNetworkMtu: 'MTU',

  // Original text: "Default: 1500"
  newNetworkDefaultMtu: 'Por defecto: 1500',

  // Original text: 'Name required'
  newNetworkNoNameErrorTitle: undefined,

  // Original text: 'A name is required to create a network'
  newNetworkNoNameErrorMessage: undefined,

  // Original text: 'Bond mode'
  newNetworkBondMode: undefined,

  // Original text: "Delete network"
  deleteNetwork: 'Borrar red',

  // Original text: "Are you sure you want to delete this network?"
  deleteNetworkConfirm: '¿Estás seguro de querer borrar esta red?',

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

  // Original text: "Xen Orchestra"
  xenOrchestra: 'Xen Orchestra',

  // Original text: "No pro support provided!"
  noProSupport: '¡Sin soporte Pro!',

  // Original text: "Use in production at your own risks"
  noProductionUse: 'Usar en producción bajo tu propia cuenta y riesgo',

  // Original text: "You can download our turnkey appliance at {website}""
  downloadXoaFromWebsite: 'Puedes descargar nuestro appliance en {website}',

  // Original text: "Bug Tracker"
  bugTracker: 'Bug Tracker',

  // Original text: "Issues? Report it!"
  bugTrackerText: '¿Problemas? ¡Repórtalos!',

  // Original text: "Community"
  community: 'Comunidad',

  // Original text: "Join our community forum!"
  communityText: '¡Únete al foro de nuestra comunidad!',

  // Original text: "Free Trial for Premium Edition!"
  freeTrial: 'Prueba gratis de la Edición Premium',

  // Original text: "Request your trial now!"
  freeTrialNow: '¡Pide la prueba gratuíta ahora!',

  // Original text: "Any issue?"
  issues: '¿Algún problema?',

  // Original text: "Problem? Contact us!"
  issuesText: '¿Problemas? ¡Ponte en contacto con nosotros!',

  // Original text: "Documentation"
  documentation: 'Documentación',

  // Original text: "Read our official doc"
  documentationText: 'Lee nuestra documentación oficial',

  // Original text: "Pro support included"
  proSupportIncluded: 'Soporte Pro incluído',

  // Original text: "Access your XO Account"
  xoAccount: 'Entra en tu cuenta XO',

  // Original text: "Report a problem"
  openTicket: 'Reportar un problema',

  // Original text: "Problem? Open a ticket!"
  openTicketText: '¿Problemas? ¡Abre un ticket!',

  // Original text: "Upgrade needed"
  upgradeNeeded: 'Actualización necesaria',

  // Original text: "Upgrade now!"
  upgradeNow: '¡Actualiza ahora!',

  // Original text: "Or"
  or: 'O',

  // Original text: "Try it for free!"
  tryIt: '¡Pruébalo gratis!',

  // Original text: "This feature is available starting from {plan} Edition"
  availableIn: 'Esta característica está sólo disponible a partir de la Edición {plan}',

  // Original text: 'This feature is not available in your version, contact your administrator to know more.'
  notAvailable: undefined,

  // Original text: 'Updates'
  updateTitle: undefined,

  // Original text: "Registration"
  registration: 'Registro',

  // Original text: "Trial"
  trial: 'Prueba',

  // Original text: "Settings"
  settings: 'Configuración',

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

  // Original text: "Update"
  update: 'Refrescar',

  // Original text: 'Refresh'
  refresh: undefined,

  // Original text: "Upgrade"
  upgrade: 'Actualizar',

  // Original text: "No updater available for Community Edition"
  noUpdaterCommunity: 'No hay actualizador para la Edición Community',

  // Original text: "Please consider subscribe and try it with all features for free during 30 days on {link}.""
  considerSubscribe:
    'Por favor plantéate la suscripción y pruébala con todas las características gratis durante 30 días {link}',

  // Original text: "Manual update could break your current installation due to dependencies issues, do it with caution"
  noUpdaterWarning:
    'La actualización manual podría romper tu instalación actual debido a problemas de dependencias, hazlo con precaución',

  // Original text: "Current version:"
  currentVersion: 'Versión actual',

  // Original text: "Register"
  register: 'Registrar',

  // Original text: 'Edit registration'
  editRegistration: undefined,

  // Original text: "Please, take time to register in order to enjoy your trial."
  trialRegistration: 'Por favor, regístrate para poder disfrutar del periodo de prueba',

  // Original text: "Start trial"
  trialStartButton: 'Comenzar prueba',

  // Original text: "You can use a trial version until {date, date, medium}. Upgrade your appliance to get it."
  trialAvailableUntil:
    'Puedes usar la versión de prueba hasta {date, date, medium}. Actualiza tu instalación para obtenerla.',

  // Original text: "Your trial has been ended. Contact us or downgrade to Free version"
  trialConsumed: 'Tu periodo de prueba ha terminado. Contacta con nosotros o vuelve a la Edición Libre',

  // Original text: "Your xoa-updater service appears to be down. Your XOA cannot run fully without reaching this service."
  trialLocked:
    'Tu servicio xoa-updater parece estar caído. XOA no puede funcionar correctamente sin contactar con este servicio',

  // Original text: "No update information available"
  noUpdateInfo: 'No hay información de actualización',

  // Original text: "Update information may be available"
  waitingUpdateInfo: 'Podría haber información de actualización disponible',

  // Original text: "Your XOA is up-to-date"
  upToDate: 'Tu XOA está al día',

  // Original text: "You need to update your XOA (new version is available)"
  mustUpgrade: 'Necesitas actualizar tu XOA (hay disponible una nueva versión)',

  // Original text: "Your XOA is not registered for updates"
  registerNeeded: 'Tu XOA no está registrado para recibir actualizaciones',

  // Original text: "Can't fetch update information"
  updaterError: 'No se puede obtener la información de actualización',

  // Original text: 'Upgrade successful'
  promptUpgradeReloadTitle: undefined,

  // Original text: 'Your XOA has successfully upgraded, and your browser must reload the application. Do you want to reload now ?'
  promptUpgradeReloadMessage: undefined,

  // Original text: "Xen Orchestra from the sources"
  disclaimerTitle: 'Xen Orchestra desde código fuente',

  // Original text: "You are using XO from the sources! That's great for a personal/non-profit usage."
  disclaimerText1: '¡Estás utilizando XO a partir del código fuente! Estupendo para un uso personal/sin ánimo de lucro',

  // Original text: "If you are a company, it's better to use it with our appliance + pro support included:"
  disclaimerText2: 'Si eres una empresa, es mejor utilizarlo con nuestro appliance con soporte Pro incluído',

  // Original text: "This version is not bundled with any support nor updates. Use it with caution for critical tasks."
  disclaimerText3: 'Esta versión no está creada para recibir soporte ni actualizaciones. Úsala con precaución.',

  // Original text: "Connect PIF"
  connectPif: 'Conectar PIF',

  // Original text: "Are you sure you want to connect this PIF?"
  connectPifConfirm: '¿Estás seguro de querer conectar este PIF?',

  // Original text: "Disconnect PIF"
  disconnectPif: 'Desconectar PIF',

  // Original text: "Are you sure you want to disconnect this PIF?"
  disconnectPifConfirm: '¿Estás seguro de querer desconectar este PIF?',

  // Original text: "Delete PIF"
  deletePif: 'Borrar PIF',

  // Original text: "Are you sure you want to delete this PIF?"
  deletePifConfirm: '¿Estás seguro de querer borrar este PIF?',

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

  // Original text: 'Click to enable'
  logIndicationToEnable: undefined,

  // Original text: 'Click to disable'
  logIndicationToDisable: undefined,

  // Original text: 'Report a bug'
  reportBug: undefined,

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
  shortcut_GO_TO_HOSTS: undefined,

  // Original text: 'Go to pools list'
  shortcut_GO_TO_POOLS: undefined,

  // Original text: 'Go to VMs list'
  shortcut_GO_TO_VMS: undefined,

  // Original text: 'Go to SRs list'
  shortcut_GO_TO_SRS: undefined,

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

  // Original text: 'Installing XOSAN. Please wait…'
  xosanInstalling: undefined,

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

  // Original text: 'No compatible XOSAN pack found for your XenServer versions.'
  xosanNoPackFound: undefined,

  // Original text: 'At least one of these version requirements must be satisfied by all the hosts in this pool:'
  xosanPackRequirements: undefined,
}
