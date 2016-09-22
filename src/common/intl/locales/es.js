// See http://momentjs.com/docs/#/use-it/browserify/
import 'moment/locale/es'

import reactIntlData from 'react-intl/locale-data/es'
import { addLocaleData } from 'react-intl'
addLocaleData(reactIntlData)

// ===================================================================

export default {
  // Original text: "Long click to edit"
  editableLongClickPlaceholder: 'Click largo para editar',

  // Original text: "Click to edit"
  editableClickPlaceholder: 'Click para editar',

  // Original text: "OK"
  alertOk: 'OK',

  // Original text: "OK"
  confirmOk: 'OK',

  // Original text: "Cancel"
  confirmCancel: 'Cancelar',

  // Original text: "Home"
  homePage: 'Inicio',

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

  // Original text: "Dashboard"
  selfServiceDashboardPage: 'Resumen',

  // Original text: "Administration"
  selfServiceAdminPage: 'Administracion',

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

  // Original text: "About"
  aboutPage: 'Acerca de',

  // Original text: "New"
  newMenu: 'Nuevo',

  // Original text: "Tasks"
  taskMenu: 'Tareas',

  // Original text: "VM"
  newVmPage: 'VM',

  // Original text: "Storage"
  newSrPage: 'Almacenamiento',

  // Original text: "Server"
  newServerPage: 'Servidor',

  // Original text: "Import"
  newImport: 'Importar',

  // Original text: "Overview"
  backupOverviewPage: 'Visión General',

  // Original text: "New"
  backupNewPage: 'Nuevo',

  // Original text: "Remotes"
  backupRemotesPage: 'Remotos',

  // Original text: "Restore"
  backupRestorePage: 'Restaurar',

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

  // Original text: "Username:"
  usernameLabel: 'Usuario:',

  // Original text: "Password:"
  passwordLabel: 'Calave:',

  // Original text: "Sign in"
  signInButton: 'Entrar',

  // Original text: "Sign out"
  signOut: 'Salir',

  // Original text: "Fetching data…"
  homeFetchingData: 'Recuperando datos...',

  // Original text: "Welcome on Xen Orchestra!"
  homeWelcome: '¡Bienvenido a Xen Orchestra!',

  // Original text: "Add your XenServer hosts or pools"
  homeWelcomeText: 'Añade tus hosts/pools de XenServer',

  // Original text: "Want some help?"
  homeHelp: '¿Necesitas ayuda?',

  // Original text: "Add server"
  homeAddServer: 'Añadir servidor',

  // Original text: "Online Doc"
  homeOnlineDoc: 'Documentación en línea',

  // Original text: "Pro Support"
  homeProSupport: 'Soporte Pro',

  // Original text: "There are no VMs!"
  homeNoVms: '¡No hay VMs!',

  // Original text: "Or…"
  homeNoVmsOr: 'O...',

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

  // Original text: "Pool"
  homeTypePool: 'Pool',

  // Original text: "Host"
  homeTypeHost: 'Host',

  // Original text: "VM"
  homeTypeVm: 'VM',

  // Original text: "SR"
  homeTypeSr: 'SR',

  // Original text: "VDI"
  homeTypeVdi: 'VDI',

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

  // Original text: "{displayed, number}x {icon} (on {total, number})"
  homeDisplayedItems: '{displayed, number}x {icon} (sobre {total, number})',

  // Original text: "{selected, number}x {icon} selected (on {total, number})"
  homeSelectedItems: '{selected, number}x {icon} seleccionados (sobre {total, number})',

  // Original text: "More"
  homeMore: 'Más',

  // Original text: "Migrate to…"
  homeMigrateTo: 'Migrar a...',

  // Original text: "Add"
  add: 'Añadir',

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
  selectObjects: 'Elegir Objeto(s)...',

  // Original text: "Choose a role"
  selectRole: 'Elegir un rol',

  // Original text: "Select Host(s)…"
  selectHosts: 'Elegir Host(s)...',

  // Original text: "Select object(s)…"
  selectHostsVms: 'Elegir objeto(s)...',

  // Original text: "Select Network(s)…"
  selectNetworks: 'Elegir Red(es)...',

  // Original text: "Select PIF(s)…"
  selectPifs: 'Elegir PIF(s)...',

  // Original text: "Select Pool(s)…"
  selectPools: 'Elegir Pool(s)...',

  // Original text: "Select Remote(s)…"
  selectRemotes: 'Elegir almacenamiento(s) remoto(s)...',

  // Original text: "Select SR(s)…"
  selectSrs: 'Elegir SR(s)...',

  // Original text: "Select VM(s)…"
  selectVms: 'Elegir VM(s)...',

  // Original text: "Select VM template(s)…"
  selectVmTemplates: 'Elegir plantilla(s) de VM...',

  // Original text: "Select tag(s)…"
  selectTags: 'Elegir etiqueta(s)...',

  // Original text: "Select disk(s)…"
  selectVdis: 'Elegir disco(s)...',

  // Original text: "Fill required informations."
  fillRequiredInformations: 'Introducir la información requerida',

  // Original text: "Fill informations (optional)"
  fillOptionalInformations: 'Introducir datos (opcional)',

  // Original text: "Reset"
  selectTableReset: 'Reiniciar',

  // Original text: "Month"
  schedulingMonth: 'Mes',

  // Original text: "Every month"
  schedulingEveryMonth: 'Cada mes',

  // Original text: "Each selected month"
  schedulingEachSelectedMonth: 'Cada mes seleccionado',

  // Original text: "Day of the month"
  schedulingMonthDay: 'Día del mes',

  // Original text: "Every day"
  schedulingEveryMonthDay: 'Cada día',

  // Original text: "Each selected day"
  schedulingEachSelectedMonthDay: 'Cada día seleccionado',

  // Original text: "Day of the week"
  schedulingWeekDay: 'Día de la semana',

  // Original text: "Every day"
  schedulingEveryWeekDay: 'Cada día',

  // Original text: "Each selected day"
  schedulingEachSelectedWeekDay: 'Cada día seleccionado',

  // Original text: "Hour"
  schedulingHour: 'Hora',

  // Original text: "Every hour"
  schedulingEveryHour: 'Cada hora',

  // Original text: "Every N hour"
  schedulingEveryNHour: 'Cada N horas',

  // Original text: "Each selected hour"
  schedulingEachSelectedHour: 'Cada hora seleccionada',

  // Original text: "Minute"
  schedulingMinute: 'Minuto',

  // Original text: "Every minute"
  schedulingEveryMinute: 'Cada minuto',

  // Original text: "Every N minute"
  schedulingEveryNMinute: 'Cada N minutos',

  // Original text: "Each selected minute"
  schedulingEachSelectedMinute: 'Cada minuto seleccionado',

  // Original text: "Reset"
  schedulingReset: 'Reiniciar',

  // Original text: "Unknown"
  unknownSchedule: 'Desconocido',

  // Original text: "Cannot edit backup"
  backupEditNotFoundTitle: 'Imposible editar backup',

  // Original text: "Missing required info for edition"
  backupEditNotFoundMessage: 'Falta información requerida para la edición',

  // Original text: "Job"
  job: 'Tarea',

  // Original text: "Job ID"
  jobId: 'ID de Tarea',

  // Original text: "Name"
  jobName: 'Nombre',

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

  // Original text: "Select your backup type:"
  newBackupSelection: 'Elige el tipo de backup',

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

  // Original text: "General"
  newSrGeneral: 'General',

  // Original text: "Select Strorage Type:"
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

  // Original text: "Users/Groups"
  subjectName: 'Usuarios/Grupos',

  // Original text: "Object"
  objectName: 'Objeto',

  // Original text: "Role"
  roleName: 'Rol',

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

  // Original text: "{users} user{users, plural, one {} other {s}}"
  countUsers: '{users} user{users, plural, one {} other {s}}',

  // Original text: "Select Permission"
  selectPermission: 'Seleccionar permiso',

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

  // Original text: "Disconnect to all hosts"
  srDisconnectAll: 'Desconectar de todos los hosts',

  // Original text: "Forget this SR"
  srForget: 'Olvidar este SR',

  // Original text: "Remove this SR"
  srRemoveButton: 'Borrar este SR',

  // Original text: "No VDIs in this storage"
  srNoVdis: 'No hay VDIs en éste almancenamiento',

  // Original text: "Hosts"
  hostsTabName: 'Hosts',

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

  // Original text: "Add SR"
  addSrLabel: 'Añadir SR',

  // Original text: "Add VM"
  addVmLabel: 'Añadir VM',

  // Original text: "Add Host"
  addHostLabel: 'Añadir host',

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

  // Original text: "Emergency mode"
  emergencyModeLabel: 'Modo de Emergencia',

  // Original text: "Storage"
  storageTabName: 'Almacenamiento',

  // Original text: "Patches"
  patchesTabName: 'Parches',

  // Original text: "Load average"
  statLoad: 'Carga',

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

  // Original text: "Add a network"
  networkCreateButton: 'Añadir red',

  // Original text: "Device"
  pifDeviceLabel: 'Dispositivo',

  // Original text: "Network"
  pifNetworkLabel: 'Red',

  // Original text: "VLAN"
  pifVlanLabel: 'VLAN',

  // Original text: "Address"
  pifAddressLabel: 'Dirección',

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

  // Original text: "Add a storage"
  addSrDeviceButton: 'Añadir un almacenamiento',

  // Original text: "Name"
  srNameLabel: 'Nombre',

  // Original text: "Type"
  srType: 'Tipo',

  // Original text: "Status"
  pbdStatus: 'Estado',

  // Original text: "Connected"
  pbdStatusConnected: 'Conectado',

  // Original text: "Disconnected"
  pbdStatusDisconnected: 'Desconectado',

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

  // Original text: "Release date"
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

  // Original text: "Downloaded patches"
  hostInstalledPatches: 'Parches descargados',

  // Original text: "Missing patches"
  hostMissingPatches: 'Parches pendientes',

  // Original text: "Host up-to-date!"
  hostUpToDate: '¡Host al día!',

  // Original text: "General"
  generalTabName: 'General',

  // Original text: "Stats"
  statsTabName: 'Estadísticas',

  // Original text: "Console"
  consoleTabName: 'Consola',

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

  // Original text: "non-US keyboard could have issues with console: switch your own layout to US."
  tipConsoleLabel: 'Cambia la distribución del teclado a US para no tener problemas con la consola',

  // Original text: "Action"
  vdiAction: 'Acción',

  // Original text: "Attach disk"
  vdiAttachDeviceButton: 'Adjuntar disco',

  // Original text: "New disk"
  vbdCreateDeviceButton: 'Nuevo disco',

  // Original text: "Boot order"
  vdiBootOrder: 'Order de arranque',

  // Original text: "Name"
  vdiNameLabel: 'Nombre',

  // Original text: "Description"
  vdiNameDescription: 'Descripción',

  // Original text: "Tags"
  vdiTags: 'Tareas',

  // Original text: "Size"
  vdiSize: 'Tamaño',

  // Original text: "SR"
  vdiSr: 'SR',

  // Original text: "Boot flag"
  vdbBootableStatus: 'Etiqueta de Inicio',

  // Original text: "Status"
  vdbStatus: 'Estado',

  // Original text: "Connected"
  vbdStatusConnected: 'Conectado',

  // Original text: "Disconnected"
  vbdStatusDisconnected: 'Desconectado',

  // Original text: "No disks"
  vbdNoVbd: 'Sin discos',

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

  // Original text: "IP addresses"
  vifIpAddresses: 'Dirección IP',

  // Original text: "No snapshots"
  noSnapshots: 'Sin snapshots',

  // Original text: "New snapshot"
  snapshotCreateButton: 'Nuevo snapshot',

  // Original text: "Just click on the snapshot button to create one!"
  tipCreateSnapshotLabel: '¡Haz click en el botón de snapshot para crear uno!',

  // Original text: "Creation date"
  snapshotDate: 'Fecha de creación',

  // Original text: "Name"
  snapshotName: 'Nombre',

  // Original text: "Action"
  snapshotAction: 'Acción',

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

  // Original text: "Default"
  defaultCpuWeight: 'Por defecto',

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

  // Original text: "Pool{pools, plural, one {} other {s}}"
  poolPanel: 'Pool{pools, plural, one {} other {s}}',

  // Original text: "Host{hosts, plural, one {} other {s}}"
  hostPanel: 'Host{hosts, plural, one {} other {s}}',

  // Original text: "VM{vms, plural, one {} other {s}}"
  vmPanel: 'VM{vms, plural, one {} other {s}}',

  // Original text: "RAM Usage"
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

  // Original text: "of"
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
  metricsLoading: 'Cargando...',

  // Original text: "Coming soon!"
  comingSoon: '¡Próximamente!',

  // Original text: "Orphaned VDIs"
  orphanedVdis: 'VIDs huérfanos',

  // Original text: "Orphaned VMs"
  orphanedVms: 'VMs huérfanas',

  // Original text: "No orphans"
  noOrphanedObject: 'Sin huérfanos',

  // Original text: "Remove all orphaned VDIs"
  removeAllOrphanedObject: 'Eliminar todos los VDIs huérfanos',

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

  // Original text: "Create a new VM on {pool}"
  newVmCreateNewVmOn: 'Crear una nueva VM en {pool}',

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

  // Original text: "Install settings"
  newVmInstallSettingsPanel: 'Opciones de instalación',

  // Original text: "ISO/DVD"
  newVmIsoDvdLabel: 'ISO/DVD',

  // Original text: "Network"
  newVmNetworkLabel: 'Red',

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

  // Original text: "Bootable"
  newVmBootableLabel: 'Arrancable',

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

  // Original text: "Quarter (1/4)"
  newVmCpuWeightQuarter: 'Un cuarto (1/4)',

  // Original text: "Half (1/2)"
  newVmCpuWeightHalf: 'Un medio (1/2)',

  // Original text: "Normal"
  newVmCpuWeightNormal: 'Normal',

  // Original text: "Double (x2)"
  newVmCpuWeightDouble: 'Doble (x2)',

  // Original text: "Cloud config"
  newVmCloudConfig: 'Cloud config',

  // Original text: "Create VMs"
  newVmCreateVms: 'VMs creadas',

  // Original text: "Are you sure you want to create {nbVms} VMs?"
  newVmCreateVmsConfirm: '¿Estás seguro de querer crear {nbVms} VMs?',

  // Original text: "Multiple VMs:"
  newVmMultipleVms: 'Múltiple VMs:',

  // Original text: "Resource sets"
  resourceSets: 'Conjunto de recursos',

  // Original text: "No resource sets."
  noResourceSets: 'No hay conjuntos de recursos',

  // Original text: "Resource set name"
  resourceSetName: 'Nombre del conjunto de recursos',

  // Original text: "Creation and edition"
  resourceSetCreation: 'Creación y edición',

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

  // Original text: "No limits."
  noResourceSetLimits: 'Sin límites',

  // Original text: "Total:"
  totalResource: 'Total:',

  // Original text: "Remaining:"
  remainingResource: 'Restante:',

  // Original text: "Used:"
  usedResource: 'Utilizado:',

  // Original text: "Try dropping some backups here, or click to select backups to upload. Accept only .xva files."
  importVmsList: 'Haz drag & drop de backups aquí, o haz click para seleccionar qué backups subir. Sólo se aceptan ficheros .xva',

  // Original text: "No selected VMs."
  noSelectedVms: 'No se han seleccionado VMs',

  // Original text: "To Pool:"
  vmImportToPool: 'Al Pool:',

  // Original text: "To SR:"
  vmImportToSr: 'al SR:',

  // Original text: "VMs to import"
  vmsToImport: 'VMs para importar',

  // Original text: "Reset"
  importVmsCleanList: 'Reiniciar',

  // Original text: "VM import success"
  vmImportSuccess: 'Importación de VM satisfactoria',

  // Original text: "VM import failed"
  vmImportFailed: 'Falló la importación de VM',

  // Original text: "Import starting…"
  startVmImport: 'Comenzando importación...',

  // Original text: "Export starting…"
  startVmExport: 'Comenzando export...',

  // Original text: "No pending tasks"
  noTasks: 'No hay tareas pendientes',

  // Original text: "Currently, there are not any pending XenServer tasks"
  xsTasks: 'Ahora mismo no hay tareas de XenServer pendientes',

  // Original text: "List Remote"
  listRemote: 'Listar backups remotos',

  // Original text: "simple"
  simpleBackup: 'simple',

  // Original text: "delta"
  delta: 'diferencial',

  // Original text: "Restore Backups"
  restoreBackups: 'Restaurar backups',

  // Original text: "No remotes"
  noRemotes: 'No hay backups remotos',

  // Original text: "enabled"
  remoteEnabled: 'activado',

  // Original text: "error"
  remoteError: 'error',

  // Original text: "No backup available"
  noBackup: 'No hay backups disponibles',

  // Original text: "VM Name"
  backupVmNameColumn: 'Nombre VM',

  // Original text: "Backup Tag"
  backupTagColumn: 'Etiqueta de Backup',

  // Original text: "Last Backup"
  lastBackupColumn: 'Último backup',

  // Original text: "Available Backups"
  availableBackupsColumn: 'Backups disponibles',

  // Original text: "Restore"
  restoreColumn: 'Restaurar',

  // Original text: "Restore VM"
  restoreTip: 'Restaurar VM',

  // Original text: "Import VM"
  importBackupTitle: 'Importar VM',

  // Original text: "Starting your backup import"
  importBackupMessage: 'Comenzando importación del backup',

  // Original text: "Start VM{vms, plural, one {} other {s}}"
  startVmsModalTitle: 'Arrancar VM{vms, plural, one {} other {s}}',

  // Original text: "Are you sure you want to start {vms} VM{vms, plural, one {} other {s}}?"
  startVmsModalMessage: '¿Estás seguro de querar arrancar {vms} VM{vms, plural, one {} other {s}}?',

  // Original text: "Stop VM{vms, plural, one {} other {s}}"
  stopVmsModalTitle: 'Parar VM{vms, plural, one {} other {s}}',

  // Original text: "Are you sure you want to stop {vms} VM{vms, plural, one {} other {s}}?"
  stopVmsModalMessage: '¿Estás seguro de querer parar {vms} VM{vms, plural, one {} other {s}}?',

  // Original text: "Restart VM{vms, plural, one {} other {s}}"
  restartVmsModalTitle: 'Reiniciar VM{vms, plural, one {} other {s}}',

  // Original text: "Are you sure you want to restart {vms} VM{vms, plural, one {} other {s}}?"
  restartVmsModalMessage: '¿Estás seguro de querer reiniciar {vms} VM{vms, plural, one {} other {s}}?',

  // Original text: "Snapshot VM{vms, plural, one {} other {s}}"
  snapshotVmsModalTitle: 'Snapshot VM{vms, plural, one {} other {s}}',

  // Original text: "Are you sure you want to snapshot {vms} VM{vms, plural, one {} other {s}}?"
  snapshotVmsModalMessage: '¿Estás seguro de querer hacer snapshot de {vms} VM{vms, plural, one {} other {s}}?',

  // Original text: "Delete VM"
  deleteVmModalTitle: 'Borrar VM',

  // Original text: "Delete VM{vms, plural, one {} other {s}}"
  deleteVmsModalTitle: 'Borrar VM{vms, plural, one {} other {s}}',

  // Original text: "Are you sure you want to delete this VM? ALL VM DISKS WILL BE REMOVED"
  deleteVmModalMessage: '¿Estás seguro de querer borrar esta VM? TODOS SUS DISCOS SERAN ELIMINADOS',

  // Original text: "Are you sure you want to delete {vms} VM{vms, plural, one {} other {s}}? ALL VM DISKS WILL BE REMOVED"
  deleteVmsModalMessage: '¿Estás seguro de querar borrar {vms} VM{vms, plural, one {} other {s}}? TODOS SUS DISCOS SERAN ELIMINADOS',

  // Original text: "Migrate VM"
  migrateVmModalTitle: 'Migrar VM',

  // Original text: "Select a destination host:"
  migrateVmAdvancedModalSelectHost: 'Elige el host de destino:',

  // Original text: "Select a migration network:"
  migrateVmAdvancedModalSelectNetwork: 'Elige la red de la migración',

  // Original text: "For each VDI, select an SR:"
  migrateVmAdvancedModalSelectSrs: 'Para cada VDI, elige un SR:',

  // Original text: "For each VIF, select a network:"
  migrateVmAdvancedModalSelectNetworks: 'Para cada VIF, elige una red:',

  // Original text: "Name"
  migrateVmAdvancedModalName: 'Nombre',

  // Original text: "SR"
  migrateVmAdvancedModalSr: 'SR',

  // Original text: "VIF"
  migrateVmAdvancedModalVif: 'VIF',

  // Original text: "Network"
  migrateVmAdvancedModalNetwork: 'Red',

  // Original text: "Import a {name} Backup"
  importBackupModalTitle: 'Importar un backup {name}',

  // Original text: "Start VM after restore"
  importBackupModalStart: 'Arrancar la VM tras la restauración',

  // Original text: "Select your backup…"
  importBackupModalSelectBackup: 'Elige el backup...',

  // Original text: "Are you sure you want to remove all orphaned VDIs?"
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
  existingSrModalText: 'Esta ruta ya ha sido utilizada anteriormente como Almacenamiento por un host XenServer. Todos los datos existentes se perderán si continuas con la creación del SR.',

  // Original text: "Previous LUN Usage"
  existingLunModalTitle: 'Uso anterior de la LUN',

  // Original text: "This LUN has been previously used as a Storage by a XenServer host. All data will be lost if you choose to continue the SR creation."
  existingLunModalText: 'Esta LUN ya ha sido utilizada anteriormente como Almacenamiento por un host XenServer. Todos los datos existentes se perderán si continuas con la creación del SR.',

  // Original text: "Replace current registration?"
  alreadyRegisteredModal: '¿Reemplazar el registro actual?',

  // Original text: "Your XO appliance is already registered to {email}, do you want to forget and replace this registration ?"
  alreadyRegisteredModalText: 'Tu XOA ya está registrado en {email}, ¿quieres olvidar y reemplazar este registro?',

  // Original text: "Ready for trial?"
  trialReadyModal: '¿Preparado para el periodo de prueba?',

  // Original text: "During the trial period, XOA need to have a working internet connection. This limitation does not apply for our paid plans!"
  trialReadyModalText: 'Durante el periodo de prueba, XOA necesita conexión a Internet. Esta limitación no aplica a los planes de pago',

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

  // Original text: "Copy VM"
  copyVm: 'Copiar VM',

  // Original text: "Are you sure you want to copy this VM to {SR}?"
  copyVmConfirm: '¿Estás seguro de querer copiar esta VM a {SR}?',

  // Original text: "Name"
  copyVmName: 'Nombre',

  // Original text: "If empty: name of the copied VM"
  copyVmNamePlaceholder: 'Vacío: nombre de la VM copiada',

  // Original text: "Select SR"
  copyVmSelectSr: 'Elegir SR',

  // Original text: "Use compression"
  copyVmCompress: 'Usar compresión',

  // Original text: "Create network"
  newNetworkCreate: 'Crear red',

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

  // Original text: "Delete network"
  deleteNetwork: 'Borrar red',

  // Original text: "Are you sure you want to delete this network?"
  deleteNetworkConfirm: '¿Estás seguro de querer borrar esta red?',

  // Original text: "Xen Orchestra"
  xenOrchestra: 'Xen Orchestra',

  // Original text: "server"
  xenOrchestraServer: 'servidor',

  // Original text: "web client"
  xenOrchestraWeb: 'cliente web',

  // Original text: "No pro support provided!"
  noProSupport: '¡Sin soporte Pro!',

  // Original text: "Use in production at your own risks"
  noProductionUse: 'Usar en producción bajo tu propia cuenta y riesgo',

  // Original text: "You can download our turnkey appliance at"
  downloadXoa: 'Puedes descargar nuestro appliance en',

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

  // Original text: "Acces your XO Account"
  xoAccount: 'Entra en tu cuenta XO',

  // Original text: "Report a problem"
  openTicket: 'Reportar un problema',

  // Original text: "Problem? Open a ticket !"
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

  // Original text: "Registration"
  registration: 'Registro',

  // Original text: "Trial"
  trial: 'Prueba',

  // Original text: "Settings"
  settings: 'Configuración',

  // Original text: "Update"
  update: 'Refrescar',

  // Original text: "Upgrade"
  upgrade: 'Actualizar',

  // Original text: "No updater available for Community Edition"
  noUpdaterCommunity: 'No hay actualizador para la Edición Community',

  // Original text: "Please consider subscribe and try it with all features for free during 15 days on"
  noUpdaterSubscribe: 'Por favor plantéate la suscripción y pruébala con todas las características gratis durante 15 días',

  // Original text: "Manual update could break your current installation due to dependencies issues, do it with caution"
  noUpdaterWarning: 'La actualización manual podría romper tu instalación actual debido a problemas de dependencias, hazlo con precaución',

  // Original text: "Current version:"
  currentVersion: 'Versión actual',

  // Original text: "Register"
  register: 'Registrar',

  // Original text: "Please, take time to register in order to enjoy your trial."
  trialRegistration: 'Por favor, regístrate para poder disfrutar del periodo de prueba',

  // Original text: "Start trial"
  trialStartButton: 'Comenzar prueba',

  // Original text: "You can use a trial version until {date, date, medium}. Upgrade your appliance to get it."
  trialAvailableUntil: 'Puedes usar la versión de prueba hasta {date, date, medium}. Actualiza tu instalación para obtenerla.',

  // Original text: "Your trial has been ended. Contact us or downgrade to Free version"
  trialConsumed: 'Tu periodo de prueba ha terminado. Contacta con nosotros o vuelve a la Edición Libre',

  // Original text: "Your xoa-updater service appears to be down. Your XOA cannot run fully without reaching this service."
  trialLocked: 'Tu servicio xoa-updater parece estar caído. XOA no puede funcionar correctamente sin contactar con este servicio',

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

  // Original text: "Xen Orchestra from the sources"
  disclaimerTitle: 'Xen Orchestra desde código fuente',

  // Original text: "You are using XO from the sources! That's great for a personal/non-profit usage."
  disclaimerText1: '¡Estás utilizando XO a partir del código fuente! Estupendo para un uso personal/sin ánimo de lucro',

  // Original text: "If you are a company, it's better to use it with our appliance + pro support included:"
  disclaimerText2: 'Si eres una empresa, es mejor utilizarlo con nuestro appliance con soporte Pro incluído',

  // Original text: "This version is not bundled with any support nor updates. Use it with caution for critical tasks."
  disclaimerText3: 'Esta versión no está creada para recibir soporte ni actualizaciones. Úsala con precaución para tareas críticas.',

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
  deletePifConfirm: '¿Estás seguro de querer borrar este PIF?'
}
