// See http://momentjs.com/docs/#/use-it/browserify/
import 'moment/locale/fr'

import reactIntlData from 'react-intl/locale-data/fr'
import { addLocaleData } from 'react-intl'
addLocaleData(reactIntlData)

// ===================================================================

export default {
  // Original text: "{key}: {value}"
  keyValue: '{key} : {value}',

  // Original text: "Connecting"
  statusConnecting: 'Connexion…',

  // Original text: "Disconnected"
  statusDisconnected: 'Déconnecté',

  // Original text: "Loading…"
  statusLoading: 'Chargement…',

  // Original text: "Page not found"
  errorPageNotFound: 'Page introuvable',

  // Original text: "no such item"
  errorNoSuchItem: 'aucune correspondance',

  // Original text: "Long click to edit"
  editableLongClickPlaceholder: 'Clic long pour éditer',

  // Original text: "Click to edit"
  editableClickPlaceholder: 'Cliquer pour éditer',

  // Original text: "Browse files"
  browseFiles: 'Parcourir',

  // Original text: "OK"
  alertOk: 'OK',

  // Original text: "OK"
  confirmOk: 'OK',

  // Original text: "Cancel"
  genericCancel: 'Annuler',

  // Original text: "On error"
  onError: 'En erreur',

  // Original text: "Successful"
  successful: 'Réussi',

  // Original text: "Managed disks"
  filterOnlyManaged: 'Supervisés',

  // Original text: "Orphaned disks"
  filterOnlyOrphaned: 'Orphelins',

  // Original text: "Normal disks"
  filterOnlyRegular: 'Normaux',

  // Original text: "Snapshot disks"
  filterOnlySnapshots: 'Instantanés',

  // Original text: "Unmanaged disks"
  filterOnlyUnmanaged: 'Bases delta',

  // Original text: "Copy to clipboard"
  copyToClipboard: 'Copier dans le presse-papier',

  // Original text: "Master"
  pillMaster: 'Maître',

  // Original text: "Home"
  homePage: 'Accueil',

  // Original text: "VMs"
  homeVmPage: 'VMs',

  // Original text: "Hosts"
  homeHostPage: 'Hôtes',

  // Original text: "Pools"
  homePoolPage: 'Pools',

  // Original text: "Templates"
  homeTemplatePage: 'Templates',

  // Original text: "Storages"
  homeSrPage: 'Stockages',

  // Original text: "Dashboard"
  dashboardPage: 'Tableau de bord',

  // Original text: "Overview"
  overviewDashboardPage: "Vue d'ensemble",

  // Original text: "Visualizations"
  overviewVisualizationDashboardPage: 'Visualisations',

  // Original text: "Statistics"
  overviewStatsDashboardPage: 'Statistiques',

  // Original text: "Health"
  overviewHealthDashboardPage: 'État de santé',

  // Original text: "Self service"
  selfServicePage: 'Libre service',

  // Original text: "Backup"
  backupPage: 'Sauvegardes',

  // Original text: "Jobs"
  jobsPage: 'Jobs',

  // Original text: "Updates"
  updatePage: 'Mises à jour',

  // Original text: "Settings"
  settingsPage: 'Paramètres',

  // Original text: "Servers"
  settingsServersPage: 'Serveurs',

  // Original text: "Users"
  settingsUsersPage: 'Utilisateurs',

  // Original text: "Groups"
  settingsGroupsPage: 'Groupes',

  // Original text: "ACLs"
  settingsAclsPage: 'Droits',

  // Original text: "Plugins"
  settingsPluginsPage: 'Greffons',

  // Original text: "Logs"
  settingsLogsPage: 'Journaux',

  // Original text: "IPs"
  settingsIpsPage: 'IPs',

  // Original text: "Config"
  settingsConfigPage: 'Configuration',

  // Original text: "About"
  aboutPage: 'À propos',

  // Original text: "About XO {xoaPlan}"
  aboutXoaPlan: 'À propos de XO {xoaPlan}',

  // Original text: "New"
  newMenu: 'Nouveau',

  // Original text: "Tasks"
  taskMenu: 'Tâches',

  // Original text: "Tasks"
  taskPage: 'Tâches',

  // Original text: "VM"
  newVmPage: 'VM',

  // Original text: "Storage"
  newSrPage: 'Stockage',

  // Original text: "Server"
  newServerPage: 'Serveur',

  // Original text: "Import"
  newImport: 'Importer',

  // Original text: "XOSAN"
  xosan: 'XOSAN',

  // Original text: "Overview"
  backupOverviewPage: "Vue d'ensemble",

  // Original text: "New"
  backupNewPage: 'Nouveau',

  // Original text: "Remotes"
  backupRemotesPage: 'Emplacement',

  // Original text: "Restore"
  backupRestorePage: 'Restaurer',

  // Original text: "File restore"
  backupFileRestorePage: 'Restauration de fichiers',

  // Original text: "Schedule"
  schedule: 'Planifier',

  // Original text: "New VM backup"
  newVmBackup: 'Nouvelle sauvegarde de VM',

  // Original text: "Edit VM backup"
  editVmBackup: 'Éditer une sauvegarde de VM',

  // Original text: "Backup"
  backup: 'Sauvegarder',

  // Original text: "Rolling Snapshot"
  rollingSnapshot: 'Rolling Snapshot',

  // Original text: "Delta Backup"
  deltaBackup: 'Delta Backup',

  // Original text: "Disaster Recovery"
  disasterRecovery: 'Reprise après panne',

  // Original text: "Continuous Replication"
  continuousReplication: 'Réplication continue',

  // Original text: "Overview"
  jobsOverviewPage: "Vue d'ensemble",

  // Original text: "New"
  jobsNewPage: 'Nouveau',

  // Original text: "Scheduling"
  jobsSchedulingPage: 'Planifier',

  // Original text: "Custom Job"
  customJob: 'Job personnalisé',

  // Original text: "User"
  userPage: 'Utilisateur',

  // Original text: "No support"
  noSupport: 'Pas de support professionnel',

  // Original text: "Free upgrade!"
  freeUpgrade: 'Mise à jour gratuite !',

  // Original text: "Sign out"
  signOut: 'Se déconnecter',

  // Original text: "Edit my settings {username}"
  editUserProfile: 'Éditer mes options {username}',

  // Original text: "Fetching data…"
  homeFetchingData: 'Récupération des données…',

  // Original text: "Welcome on Xen Orchestra!"
  homeWelcome: 'Bienvenue sur Xen Orchestra !',

  // Original text: "Add your XCP-ng hosts or pools"
  homeWelcomeText: 'Ajouter vos serveurs ou pools XCP-ng',

  // Original text: "Some XCP-ng hosts have been registered but are not connected"
  homeConnectServerText: "Des hôtes XCP-ng sont enregistrés mais aucun n'est connecté",

  // Original text: "Want some help?"
  homeHelp: "Besoin d'aide ?",

  // Original text: "Add server"
  homeAddServer: 'Ajouter un serveur',

  // Original text: "Connect servers"
  homeConnectServer: 'Connecter des serveurs',

  // Original text: "Online Doc"
  homeOnlineDoc: 'Documentation en ligne',

  // Original text: "Pro Support"
  homeProSupport: 'Support professionel',

  // Original text: "There are no VMs!"
  homeNoVms: "Il n'y a pas de VMs !",

  // Original text: "Or…"
  homeNoVmsOr: 'Ou…',

  // Original text: "Import VM"
  homeImportVm: 'Importer une VM',

  // Original text: "Import an existing VM in xva format"
  homeImportVmMessage: 'Importer une VM existante au format xva',

  // Original text: "Restore a backup"
  homeRestoreBackup: 'Restaurer une sauvegarde',

  // Original text: "Restore a backup from a remote store"
  homeRestoreBackupMessage: 'Restaurer une sauvegarde depuis un stockage distant',

  // Original text: "This will create a new VM"
  homeNewVmMessage: 'Cela va créer une nouvelle VM',

  // Original text: "Filters"
  homeFilters: 'Filtres',

  // Original text: "No results! Click here to reset your filters"
  homeNoMatches: 'Aucun résultat ! Cliquez ici pour réinitialiser vos filtres',

  // Original text: "Pool"
  homeTypePool: 'Pool',

  // Original text: "Host"
  homeTypeHost: 'Hôte',

  // Original text: "VM"
  homeTypeVm: 'VM',

  // Original text: "SR"
  homeTypeSr: 'SR',

  // Original text: "Template"
  homeTypeVmTemplate: 'Template',

  // Original text: "Sort"
  homeSort: 'Trier',

  // Original text: "Pools"
  homeAllPools: 'Pools',

  // Original text: "Hosts"
  homeAllHosts: 'Hôtes',

  // Original text: "Tags"
  homeAllTags: 'Tags',

  // Original text: "New VM"
  homeNewVm: 'Nouvelle VM',

  // Original text: "None"
  homeFilterNone: 'Aucun',

  // Original text: "Running hosts"
  homeFilterRunningHosts: 'Hôtes démarrés',

  // Original text: "Disabled hosts"
  homeFilterDisabledHosts: 'Hôtes désactivés',

  // Original text: "Running VMs"
  homeFilterRunningVms: 'VMs démarrées',

  // Original text: "Non running VMs"
  homeFilterNonRunningVms: 'VMs éteintes',

  // Original text: "Pending VMs"
  homeFilterPendingVms: 'VMs en attente',

  // Original text: "HVM guests"
  homeFilterHvmGuests: 'Invités HVM',

  // Original text: "Tags"
  homeFilterTags: 'Tags',

  // Original text: "Sort by"
  homeSortBy: 'Trier par',

  // Original text: "Name"
  homeSortByName: 'Nom',

  // Original text: "Power state"
  homeSortByPowerstate: 'Alimentation',

  // Original text: "RAM"
  homeSortByRAM: 'RAM',

  // Original text: "vCPUs"
  homeSortByvCPUs: 'vCPUs',

  // Original text: "CPUs"
  homeSortByCpus: 'CPUs',

  // Original text: "Shared/Not shared"
  homeSortByShared: 'Partagé/Non partagé',

  // Original text: "Size"
  homeSortBySize: 'Taille',

  // Original text: "Usage"
  homeSortByUsage: 'Utilisation',

  // Original text: "Type"
  homeSortByType: 'Type',

  // Original text: "{displayed, number}x {icon} (on {total, number})"
  homeDisplayedItems: '{displayed, number}x {icon} (sur {total, number})',

  // Original text: "{selected, number}x {icon} selected (on {total, number})"
  homeSelectedItems: '{selected, number}x {icon} sélectionné{selected, plural, one {} other {s}} (sur {total, number})',

  // Original text: "More"
  homeMore: 'Plus',

  // Original text: "Migrate to…"
  homeMigrateTo: 'Migrer vers…',

  // Original text: "Missing patches"
  homeMissingPatches: 'Patches manquant',

  // Original text: "Master:"
  homePoolMaster: 'Maître :',

  // Original text: "Resource set: {resourceSet}"
  homeResourceSet: 'Jeu de ressources : {resourceSet}',

  // Original text: "High Availability"
  highAvailability: 'Haute disponibilité',

  // Original text: "Shared {type}"
  srSharedType: '{type} partagé',

  // Original text: "Not shared {type}"
  srNotSharedType: '{type} non partagé',

  // Original text: 'All of them are selected'
  sortedTableAllItemsSelected: 'Toutes sont sélectionnées ({nItems, number})',

  // Original text: '{nFiltered, number} of {nTotal, number} items'
  sortedTableNumberOfFilteredItems: '{nFiltered, number} entrées sur {nTotal, number}',

  // Original text: '{nTotal, number} items'
  sortedTableNumberOfItems: '{nTotal, number} entrées',

  // Original text: '{nSelected, number} selected'
  sortedTableNumberOfSelectedItems: '{nSelected, number} sélectionnées',

  // Original text: 'Click here to select all items'
  sortedTableSelectAllItems: 'Cliquez ici pour sélectionner toutes les entrées',

  // Original text: "Add"
  add: 'Ajouter',

  // Original text: "Select all"
  selectAll: 'Tout sélectionner',

  // Original text: "Remove"
  remove: 'Supprimer',

  // Original text: "Preview"
  preview: 'Aperçu',

  // Original text: "Item"
  item: 'Objet',

  // Original text: "No selected value"
  noSelectedValue: 'Pas de valeur sélectionnée',

  // Original text: "Choose user(s) and/or group(s)"
  selectSubjects: 'Sélectionner un ou des utilisateur(s) et/ou groupe(s)',

  // Original text: "Select Object(s)…"
  selectObjects: 'Sélectionner de(s) objet(s)…',

  // Original text: "Choose a role"
  selectRole: 'Choisir un rôle',

  // Original text: "Select Host(s)…"
  selectHosts: 'Choisir un/des hôte(s)…',

  // Original text: "Select object(s)…"
  selectHostsVms: 'Choisir un/des object(s)…',

  // Original text: "Select Network(s)…"
  selectNetworks: 'Choisir un/des réseau(x)…',

  // Original text: "Select PIF(s)…"
  selectPifs: 'Sélectionner une/des PIF(s)…',

  // Original text: "Select Pool(s)…"
  selectPools: 'Sélectionner un/des Pool(s)…',

  // Original text: "Select Remote(s)…"
  selectRemotes: 'Choisir un/des emplacement(s)…',

  // Original text: "Select resource set(s)…"
  selectResourceSets: 'Choisir un jeu de ressource(s)…',

  // Original text: "Select template(s)…"
  selectResourceSetsVmTemplate: 'Sélectionner un/des template(s)…',

  // Original text: "Select SR(s)…"
  selectResourceSetsSr: 'Sélectionner un/des SR(s)…',

  // Original text: "Select network(s)…"
  selectResourceSetsNetwork: 'Sélectionner un/des réseau(x)…',

  // Original text: "Select disk(s)…"
  selectResourceSetsVdi: 'Sélectionner un/des disque(s)…',

  // Original text: "Select SSH key(s)…"
  selectSshKey: 'Sélectionner une/des clef(s) SSH…',

  // Original text: "Select SR(s)…"
  selectSrs: 'Sélectionner un/des SR(s)…',

  // Original text: "Select VM(s)…"
  selectVms: 'Sélectionner une/des VM(s)…',

  // Original text: "Select VM template(s)…"
  selectVmTemplates: 'Sélectionner un/des template(s) de VM…',

  // Original text: "Select tag(s)…"
  selectTags: 'Sélectionner un/des tag(s)…',

  // Original text: "Select disk(s)…"
  selectVdis: 'Sélectionner un/des disque(s)…',

  // Original text: "Select timezone…"
  selectTimezone: 'Sélectionner le fuseau horaire…',

  // Original text: "Select IP(s)…"
  selectIp: 'Sélectionner une/des IP(s)…',

  // Original text: "Select IP pool(s)…"
  selectIpPool: "Sélectionner une/des plage(s) d'IP(s)…",

  // Original text: "Fill required informations."
  fillRequiredInformations: 'Saisir les informations obligatoires.',

  // Original text: "Fill informations (optional)"
  fillOptionalInformations: 'Saisir les informations (optionnel)',

  // Original text: "Reset"
  selectTableReset: 'Réinitialiser',

  // Original text: "Month"
  schedulingMonth: 'Mois',

  // Original text: "Every N month"
  schedulingEveryNMonth: 'Tous les N mois',

  // Original text: "Each selected month"
  schedulingEachSelectedMonth: 'Chaque mois sélectionné',

  // Original text: "Day"
  schedulingDay: 'Jour',

  // Original text: "Every N day"
  schedulingEveryNDay: 'Tous les N jours',

  // Original text: "Each selected day"
  schedulingEachSelectedDay: 'Chaque jour sélectionné',

  // Original text: "Switch to week days"
  schedulingSetWeekDayMode: 'Utiliser les jours de la semaine',

  // Original text: "Switch to month days"
  schedulingSetMonthDayMode: 'Utiliser les jours du mois',

  // Original text: "Hour"
  schedulingHour: 'Heure',

  // Original text: "Each selected hour"
  schedulingEachSelectedHour: 'Chaque heure sélectionnée',

  // Original text: "Every N hour"
  schedulingEveryNHour: 'Toutes les N heures',

  // Original text: "Minute"
  schedulingMinute: 'Minute',

  // Original text: "Each selected minute"
  schedulingEachSelectedMinute: 'Chaque minute sélectionnée',

  // Original text: "Every N minute"
  schedulingEveryNMinute: 'Toutes les N minutes',

  // Original text: "Every month"
  selectTableAllMonth: 'Tous les mois',

  // Original text: "Every day"
  selectTableAllDay: 'Tous les jours',

  // Original text: "Every hour"
  selectTableAllHour: 'Toutes les heures',

  // Original text: "Every minute"
  selectTableAllMinute: 'Toutes les minutes',

  // Original text: "Reset"
  schedulingReset: 'Réinitialiser',

  // Original text: "Unknown"
  unknownSchedule: 'Inconnu',

  // Original text: "Web browser timezone"
  timezonePickerUseLocalTime: 'Fuseau horaire de votre navigateur',

  // Original text: "Server timezone ({value})"
  serverTimezoneOption: 'Fuseau horaire du serveur ({value})',

  // Original text: "Cron Pattern:"
  cronPattern: 'Motif Cron :',

  // Original text: "Cannot edit backup"
  backupEditNotFoundTitle: "Impossible d'éditer la sauvegarde",

  // Original text: "Missing required info for edition"
  backupEditNotFoundMessage: "Il manque les informations nécessaires à l'édition",

  // Original text: "Successful"
  successfulJobCall: 'Réussi',

  // Original text: "Failed"
  failedJobCall: 'Échoué',

  // Original text: "In progress"
  jobCallInProgess: 'En cours',

  // Original text: "size:"
  jobTransferredDataSize: 'Taille :',

  // Original text: "speed:"
  jobTransferredDataSpeed: 'Vitesse :',

  // Original text: "Job"
  job: 'Job',

  // Original text: "Job {job}"
  jobModalTitle: 'Job {job}',

  // Original text: "ID"
  jobId: 'ID du job',

  // Original text: "Type"
  jobType: 'Type',

  // Original text: "Name"
  jobName: 'Nom',

  // Original text: "Name of your job (forbidden: \"_\")"
  jobNamePlaceholder: 'Nom de votre job (caractère interdit : "_")',

  // Original text: "Start"
  jobStart: 'Début',

  // Original text: "End"
  jobEnd: 'Fin',

  // Original text: "Duration"
  jobDuration: 'Durée',

  // Original text: "Status"
  jobStatus: 'État',

  // Original text: "Action"
  jobAction: 'Action',

  // Original text: "Tag"
  jobTag: 'Tag',

  // Original text: "Scheduling"
  jobScheduling: 'Planifié',

  // Original text: "State"
  jobState: 'État',

  // Original text: "Enabled"
  jobStateEnabled: 'Activé',

  // Original text: "Disabled"
  jobStateDisabled: 'Désactivé',

  // Original text: "Timezone"
  jobTimezone: 'Fuseau horaire',

  // Original text: "Server"
  jobServerTimezone: 'xo-server',

  // Original text: "Run job"
  runJob: 'Lancer le job',

  // Original text: "One shot running started. See overview for logs."
  runJobVerbose: "Une exécution a été lancée. Voir l'overview pour plus de détails.",

  // Original text: "Started"
  jobStarted: 'Démarré',

  // Original text: "Finished"
  jobFinished: 'Terminé',

  // Original text: "Save"
  saveBackupJob: 'Enregistrer',

  // Original text: "Remove backup job"
  deleteBackupSchedule: 'Supprimer ce job de sauvegarde',

  // Original text: "Are you sure you want to delete this backup job?"
  deleteBackupScheduleQuestion: 'Êtes-vous sûr de vouloir supprimer ce job de sauvegarde ?',

  // Original text: "Enable immediately after creation"
  scheduleEnableAfterCreation: 'Activer aussitôt après la création',

  // Original text: "You are editing Schedule {name} ({id}). Saving will override previous schedule state."
  scheduleEditMessage: "Vous êtes en train d'éditer {name} ({id}). Enregistrer écrasera l'état planifié précédent.",

  // Original text: "You are editing job {name} ({id}). Saving will override previous job state."
  jobEditMessage: "Vous êtes en train d'éditer le job {name} ({id}). Enregistrer écrasera l'état du job précédent.",

  // Original text: "No scheduled jobs."
  noScheduledJobs: 'Pas de job planifié.',

  // Original text: "No jobs found."
  noJobs: 'Pas de job trouvé.',

  // Original text: "No schedules found"
  noSchedules: 'Pas de planification trouvée',

  // Original text: "Select a xo-server API command"
  jobActionPlaceHolder: "Sélectionnez une commande de l'API xo-server",

  // Original text: "Timeout (number of seconds after which a VM is considered failed)"
  jobTimeoutPlaceHolder: 'Temporisation (nombre de secondes autorisé pour chaque VM)',

  // Original text: "Schedules"
  jobSchedules: 'Planning',

  // Original text: "Name of your schedule"
  jobScheduleNamePlaceHolder: 'Nom de votre planification',

  // Original text: "Select a Job"
  jobScheduleJobPlaceHolder: 'Choisir un Job',

  // Original text: "Job owner"
  jobOwnerPlaceholder: 'Propriétaire',

  // Original text: "This job's creator no longer exists"
  jobUserNotFound: "Le propriétaire de ce job n'existe plus",

  // Original text: "This backup's creator no longer exists"
  backupUserNotFound: "Le propriétaire de cette sauvegarde n'existe plus",

  // Original text: "Backup owner"
  backupOwner: 'Propriétaire',

  // Original text: "Select your backup type:"
  newBackupSelection: 'Choisissez votre type de sauvegarde :',

  // Original text: "Select backup mode:"
  smartBackupModeSelection: 'Sélectionnez votre mode de sauvegarde :',

  // Original text: "Normal backup"
  normalBackup: 'Backup normal',

  // Original text: "Smart backup"
  smartBackup: 'Backup intelligent',

  // Original text: "Local remote selected"
  localRemoteWarningTitle: 'Emplacement local sélectionné',

  // Original text: "Warning: local remotes will use limited XOA disk space. Only for advanced users."
  localRemoteWarningMessage:
    "Attention : utiliser un emplacement local limite l'espace pour XO. Restreignez ceci aux utilisateurs avancés.",

  // Original text: "Warning: this feature works only with XenServer 6.5 or newer."
  backupVersionWarning: "Attention : cette fonctionnalité ne fonctionne qu'avec XenServer 6.5 et plus récent.",

  // Original text: "VMs"
  editBackupVmsTitle: 'VMs',

  // Original text: "VMs statuses"
  editBackupSmartStatusTitle: 'État des VMs',

  // Original text: "Resident on"
  editBackupSmartResidentOn: 'Situé sur',

  // Original text: "Pools"
  editBackupSmartPools: 'Pools',

  // Original text: "Tags"
  editBackupSmartTags: 'Tags',

  // Original text: "VMs Tags"
  editBackupSmartTagsTitle: 'Tags des VMs',

  // Original text: "Reverse"
  editBackupNot: 'Inverser',

  // Original text: "Tag"
  editBackupTagTitle: 'Tag',

  // Original text: "Report"
  editBackupReportTitle: 'Rapport',

  // Original text: "Automatically run as scheduled"
  editBackupScheduleEnabled: 'Executer en fonction de la planification',

  // Original text: "Depth"
  editBackupDepthTitle: 'Profondeur',

  // Original text: "Remote"
  editBackupRemoteTitle: 'Emplacement',

  // Original text: "Delete the old backups first"
  deleteOldBackupsFirst: 'Supprimer les anciennes sauvegardes',

  // Original text: "Remote stores for backup"
  remoteList: 'Emplacement de stockage de backup',

  // Original text: "New File System Remote"
  newRemote: 'Nouvel emplacement de stockage',

  // Original text: "Local"
  remoteTypeLocal: 'Local',

  // Original text: "NFS"
  remoteTypeNfs: 'NFS',

  // Original text: "SMB"
  remoteTypeSmb: 'SMB',

  // Original text: "Type"
  remoteType: 'Type',

  // Original text: "Test your remote"
  remoteTestTip: 'Testez votre emplacement',

  // Original text: "Test Remote"
  testRemote: "Tester l'emplacement",

  // Original text: "Test failed for {name}"
  remoteTestFailure: 'Test réussi pour {name}',

  // Original text: "Test passed for {name}"
  remoteTestSuccess: 'Test échoué pour {name}',

  // Original text: "Error"
  remoteTestError: 'Erreur',

  // Original text: "Test Step"
  remoteTestStep: 'Étape de test',

  // Original text: "Test file"
  remoteTestFile: 'Fichier de test',

  // Original text: 'Test name'
  remoteTestName: undefined,

  // Original text: "Remote name already exists!"
  remoteTestNameFailure: "Le nom de l'emplacement existe déjà",

  // Original text: "The remote appears to work correctly"
  remoteTestSuccessMessage: "L'emplacement distant semble marcher correctement",

  // Original text: "Connection failed"
  remoteConnectionFailed: 'La connexion a échoué',

  // Original text: "Name"
  remoteName: 'Nom',

  // Original text: "Path"
  remotePath: 'Chemin',

  // Original text: "State"
  remoteState: 'État',

  // Original text: "Device"
  remoteDevice: 'Équipement',

  // Original text: "Share"
  remoteShare: 'Partage',

  // Original text: "Action"
  remoteAction: 'Action',

  // Original text: "Auth"
  remoteAuth: 'Accès',

  // Original text: "Mounted"
  remoteMounted: 'Monté',

  // Original text: "Unmounted"
  remoteUnmounted: 'Démonté',

  // Original text: "Connect"
  remoteConnectTip: 'Connecter',

  // Original text: "Disconnect"
  remoteDisconnectTip: 'Déconnecter',

  // Original text: "Connected"
  remoteConnected: 'Connecté',

  // Original text: "Disconnected"
  remoteDisconnected: 'Déconnecté',

  // Original text: "Delete"
  remoteDeleteTip: 'Supprimer',

  // Original text: "remote name *"
  remoteNamePlaceHolder: 'nom distant*',

  // Original text: "Name *"
  remoteMyNamePlaceHolder: 'Nom',

  // Original text: "/path/to/backup"
  remoteLocalPlaceHolderPath: '/chemin/de/la/sauvegarde',

  // Original text: "host *"
  remoteNfsPlaceHolderHost: 'hôte',

  // Original text: "path/to/backup"
  remoteNfsPlaceHolderPath: 'chemin/de/la/sauvegarde',

  // Original text: "subfolder [path\\to\\backup]"
  remoteSmbPlaceHolderRemotePath: 'sous-répertoire [chemin\\vers\\la\\sauvegarde]',

  // Original text: "Username"
  remoteSmbPlaceHolderUsername: "Nom d'utilisateur",

  // Original text: "Password"
  remoteSmbPlaceHolderPassword: 'Mot de passe',

  // Original text: "Domain"
  remoteSmbPlaceHolderDomain: 'Domaine',

  // Original text : "Use HTTPS"
  remoteS3LabelUseHttps: 'Utiliser HTTPS',

  // Original text : "Allow unauthorized"
  remoteS3LabelAllowInsecure: 'Autoriser les connexions non-sécurisées',

  // Original text : "AWS S3 endpoint (ex: s3.us-east-2.amazonaws.com)"
  remoteS3PlaceHolderEndpoint: 'Point de terminaison AWS S3 (ex: s3.us-east-2.amazonaws.com)',

  // Original text : "AWS S3 bucket name"
  remoteS3PlaceHolderBucket: 'Nom du bucket AWS S3',

  // Original text : "Directory"
  remoteS3PlaceHolderDirectory: 'Chemin',

  // Original text : "Access key ID"
  remoteS3PlaceHolderAccessKeyID: "Clé d'accès",

  // Original text : "Paste secret here to change it"
  remoteS3PlaceHolderSecret: 'Secret',

  // Original text : "Enter your encryption key here (32 characters)"
  remoteS3PlaceHolderEncryptionKey: 'Clé de chiffrement (32 caractères)',

  // Original text : "Region, leave blank for default"
  remoteS3Region: 'Région (optionnel)',

  // Original text : "Uncheck if you want HTTP instead of HTTPS"
  remoteS3TooltipProtocol: 'Décocher pour utiliser HTTP au lieu de HTTPS',

  // Original text : "Check if you want to accept self signed certificates"
  remoteS3TooltipAcceptInsecure: 'Cochez pour accepter les certificats auto-signés',

  // Original text: "<address>\\<share> *"
  remoteSmbPlaceHolderAddressShare: '<adresse>\\<partage>',

  // Original text: "password(fill to edit)"
  remotePlaceHolderPassword: 'mot de passe (saisir ici pour éditer)',

  // Original text: "Create a new SR"
  newSrTitle: 'Créer un nouvel SR',

  // Original text: "General"
  newSrGeneral: 'Général',

  // Original text: "Select Storage Type:"
  newSrTypeSelection: 'Sélectionner un type de stockage :',

  // Original text: "Settings"
  newSrSettings: 'Paramètres',

  // Original text: "Storage Usage"
  newSrUsage: 'Utilisation du stockage',

  // Original text: "Summary"
  newSrSummary: 'Récapitulatif',

  // Original text: "Host"
  newSrHost: 'Hôtes',

  // Original text: "Type"
  newSrType: 'Type',

  // Original text: "Name"
  newSrName: 'Nom',

  // Original text: "Description"
  newSrDescription: 'Description',

  // Original text: "Server"
  newSrServer: 'Serveur',

  // Original text: "Path"
  newSrPath: 'Chemin',

  // Original text: "IQN"
  newSrIqn: 'IQN',

  // Original text: "LUN"
  newSrLun: 'LUN',

  // Original text: "with auth."
  newSrAuth: 'avec identification',

  // Original text: "User Name"
  newSrUsername: "Nom d'utilisateur",

  // Original text: "Password"
  newSrPassword: 'Mot de passe',

  // Original text: "Device"
  newSrDevice: 'Équipement',

  // Original text: "in use"
  newSrInUse: 'utilisé',

  // Original text: "Size"
  newSrSize: 'Taille',

  // Original text: "Create"
  newSrCreate: 'Créer',

  // Original text: "Storage name"
  newSrNamePlaceHolder: "Nom de l'emplacement",

  // Original text: "Storage description"
  newSrDescPlaceHolder: "Description de l'emplacement",

  // Original text: "Address"
  newSrAddressPlaceHolder: 'Adresse',

  // Original text: "[port]"
  newSrPortPlaceHolder: '[port]',

  // Original text: "Username"
  newSrUsernamePlaceHolder: "Nom d'utilisateur",

  // Original text: "Password"
  newSrPasswordPlaceHolder: 'Mot de passe',

  // Original text: "Device, e.g /dev/sda…"
  newSrLvmDevicePlaceHolder: 'Matériel, par exemple /dev/sda…',

  // Original text: "/path/to/directory"
  newSrLocalPathPlaceHolder: '/chemin/du/répertoire',

  // Original text: "Users/Groups"
  subjectName: 'Utilisateurs/Groupes',

  // Original text: "Object"
  objectName: 'Objet',

  // Original text: "No acls found"
  aclNoneFound: 'Aucun droit existant',

  // Original text: "Role"
  roleName: 'Rôle',

  // Original text: "Create"
  aclCreate: 'Créer',

  // Original text: "New Group Name"
  newGroupName: 'Nouveau nom de groupe',

  // Original text: "Create Group"
  createGroup: 'Créer un groupe',

  // Original text: "Create"
  createGroupButton: 'Créer',

  // Original text: "Delete Group"
  deleteGroup: 'Supprimer le groupe',

  // Original text: "Are you sure you want to delete this group?"
  deleteGroupConfirm: 'Êtes-vous sûr de vouloir supprimer ce groupe ?',

  // Original text: "Remove user from Group"
  removeUserFromGroup: "Supprimer l'utilisateur du groupe",

  // Original text: "Are you sure you want to delete this user?"
  deleteUserConfirm: 'Êtes-vous sûr de vouloir supprimer cet utilisateur ?',

  // Original text: "Delete User"
  deleteUser: "Supprimer l'utilisateur",

  // Original text: "no user"
  noUser: "pas d'utilisateur",

  // Original text: "unknown user"
  unknownUser: 'utilisateur inconnu',

  // Original text: "No group found"
  noGroupFound: 'Pas de groupe trouvé',

  // Original text: "Name"
  groupNameColumn: 'Nom',

  // Original text: "Users"
  groupUsersColumn: 'Utilisateur',

  // Original text: "Add User"
  addUserToGroupColumn: 'Ajouter un utilisateur',

  // Original text: "Email"
  userNameColumn: 'Email',

  // Original text: "Permissions"
  userPermissionColumn: 'Droits',

  // Original text: "Password"
  userPasswordColumn: 'Mot de passe',

  // Original text: "Email"
  userName: 'Email',

  // Original text: "Password"
  userPassword: 'Mot de passe',

  // Original text: "Create"
  createUserButton: 'Créer',

  // Original text: "No user found"
  noUserFound: "Pas d'utilisateur trouvé",

  // Original text: "User"
  userLabel: 'Utilisateur',

  // Original text: "Admin"
  adminLabel: 'Administrateur',

  // Original text: "No user in group"
  noUserInGroup: "Pas d'utilisateur dans ce groupe",

  // Original text: "{users, number} user{users, plural, one {} other {s}}"
  countUsers: '{users} utilisateur{users, plural, one {} other {s}}',

  // Original text: "Select Permission"
  selectPermission: 'Choisir les droits',

  // Original text: "No plugins found"
  noPlugins: 'Aucun plugin trouvé',

  // Original text: "Auto-load at server start"
  autoloadPlugin: 'Charger automatiquement au démarrage du serveur',

  // Original text: "Save configuration"
  savePluginConfiguration: 'Sauvegarder la configuration',

  // Original text: "Delete configuration"
  deletePluginConfiguration: 'Supprimer la configuration',

  // Original text: "Plugin error"
  pluginError: 'Erreur du greffon',

  // Original text: "Unknown error"
  unknownPluginError: 'Erreur inconnue',

  // Original text: "Purge plugin configuration"
  purgePluginConfiguration: 'Purger la configuration du greffon',

  // Original text: "Are you sure you want to purge this configuration ?"
  purgePluginConfigurationQuestion: 'Êtes-vous sûr de vouloir purger la configuration de ce greffon ?',

  // Original text: "Edit"
  editPluginConfiguration: 'Éditer',

  // Original text: "Cancel"
  cancelPluginEdition: 'Annuler',

  // Original text: "Plugin configuration"
  pluginConfigurationSuccess: 'Configuration du greffon',

  // Original text: "Plugin configuration successfully saved!"
  pluginConfigurationChanges: 'La configuration du greffon a été sauvegardée avec succés !',

  // Original text: "Predefined configuration"
  pluginConfigurationPresetTitle: 'Configuration pré-définie',

  // Original text: "Choose a predefined configuration."
  pluginConfigurationChoosePreset: 'Choisir une configuration pré-définie.',

  // Original text: "Apply"
  applyPluginPreset: 'Appliquer',

  // Original text: "Save filter error"
  saveNewUserFilterErrorTitle: "Erreur lors de l'enregistrement du filtre",

  // Original text: "Bad parameter: name must be given."
  saveNewUserFilterErrorBody: 'Erreur: un nom doit être spécifié.',

  // Original text: "Name:"
  filterName: 'Nom :',

  // Original text: "Value:"
  filterValue: 'Valeur :',

  // Original text: "Save new filter"
  saveNewFilterTitle: 'Enregistrer un nouveau filtre',

  // Original text: "Set custom filters"
  setUserFiltersTitle: 'Personnaliser un filtre',

  // Original text: "Are you sure you want to set custom filters?"
  setUserFiltersBody: 'Êtes-vous sûr de vouloir personnaliser un filtre ?',

  // Original text: "Remove custom filter"
  removeUserFilterTitle: 'Supprimer un filtre personnalisé',

  // Original text: "Are you sure you want to remove custom filter?"
  removeUserFilterBody: 'Êtes-vous sûr de vouloir supprimer ce filtre personnalisé ?',

  // Original text: "Default filter"
  defaultFilter: 'Filtre par défaut',

  // Original text: "Default filters"
  defaultFilters: 'Filtres par défaut',

  // Original text: "Custom filters"
  customFilters: 'Filtre personnalisé',

  // Original text: "Customize filters"
  customizeFilters: 'Personnaliser les filtres',

  // Original text: "Save custom filters"
  saveCustomFilters: 'Sauvegarder les filtres personnalisés',

  // Original text: "Start"
  startVmLabel: 'Créer',

  // Original text: "Recovery start"
  recoveryModeLabel: 'Démarrage de dépannage',

  // Original text: "Suspend"
  suspendVmLabel: 'Suspendre',

  // Original text: "Stop"
  stopVmLabel: 'Arrêter',

  // Original text: "Force shutdown"
  forceShutdownVmLabel: "Forcer l'arrêt",

  // Original text: "Reboot"
  rebootVmLabel: 'Redémarrer',

  // Original text: "Force reboot"
  forceRebootVmLabel: 'Forcer le redémarrage',

  // Original text: "Delete"
  deleteVmLabel: 'Supprimer',

  // Original text: "Migrate"
  migrateVmLabel: 'Migrer',

  // Original text: "Snapshot"
  snapshotVmLabel: 'Instantané',

  // Original text: "Export"
  exportVmLabel: 'Exporter',

  // Original text: "Resume"
  resumeVmLabel: 'Reprendre',

  // Original text: "Copy"
  copyVmLabel: 'Copier',

  // Original text: "Clone"
  cloneVmLabel: 'Cloner',

  // Original text: "Fast clone"
  fastCloneVmLabel: 'Clonage rapide',

  // Original text: "Convert to template"
  convertVmToTemplateLabel: 'Convertir en template',

  // Original text: "Console"
  vmConsoleLabel: 'Console',

  // Original text: "Rescan all disks"
  srRescan: 'Rescanner tous les disques',

  // Original text: "Connect to all hosts"
  srReconnectAll: 'Connecter sur tous les hôtes',

  // Original text: "Disconnect from all hosts"
  srDisconnectAll: 'Déconnecter de tous les hôtes',

  // Original text: "Forget this SR"
  srForget: 'Oublier ce SR',

  // Original text: "Forget SRs"
  srsForget: 'Oublier les stockages',

  // Original text: "Remove this SR"
  srRemoveButton: 'Supprimer ce SR',

  // Original text: "No VDIs in this storage"
  srNoVdis: 'Pas de VDI sur ce stockage',

  // Original text: "Pool RAM usage:"
  poolTitleRamUsage: 'Utilisation RAM du pool :',

  // Original text: "{used} used on {total}"
  poolRamUsage: '{used} utilisé sur {total}',

  // Original text: "Master:"
  poolMaster: 'Maître :',

  // Original text: "Display all hosts of this pool"
  displayAllHosts: 'Afficher les hôtes du pool',

  // Original text: "Display all storages of this pool"
  displayAllStorages: 'Afficher les stockages du pool',

  // Original text: "Display all VMs of this pool"
  displayAllVMs: 'Afficher les VMs du pool',

  // Original text: "Hosts"
  hostsTabName: 'Hôtes',

  // Original text: "Vms"
  vmsTabName: 'VMs',

  // Original text: "Srs"
  srsTabName: 'stockages',

  // Original text: "High Availability"
  poolHaStatus: 'Haute Disponibilité',

  // Original text: "Enabled"
  poolHaEnabled: 'Activé',

  // Original text: "Disabled"
  poolHaDisabled: 'Désactivé',

  // Original text: "Name"
  hostNameLabel: 'Nom',

  // Original text: "Description"
  hostDescription: 'Description',

  // Original text: "Memory"
  hostMemory: 'Mémoire',

  // Original text: "No hosts"
  noHost: "Pas d'hôte",

  // Original text: "{used}% used ({free} free)"
  memoryLeftTooltip: '{used}% utilisé ({free} libre)',

  // Original text: "PIF"
  pif: 'PIF',

  // Original text: "Name"
  poolNetworkNameLabel: 'Nom',

  // Original text: "Description"
  poolNetworkDescription: 'Description',

  // Original text: "PIFs"
  poolNetworkPif: 'PIFs',

  // Original text: "No networks"
  poolNoNetwork: 'Pas de réseaux',

  // Original text: "MTU"
  poolNetworkMTU: 'MTU',

  // Original text: "Connected"
  poolNetworkPifAttached: 'Connecté',

  // Original text: "Disconnected"
  poolNetworkPifDetached: 'Déconnecté',

  // Original text: "Show PIFs"
  showPifs: 'Afficher les PIFs',

  // Original text: "Hide PIFs"
  hidePifs: 'Cacher les PIFs',

  // Original text: "Show details"
  showDetails: 'Afficher les détails',

  // Original text: "Hide details"
  hideDetails: 'Cacher les détails',

  // Original text: "No stats"
  poolNoStats: 'Pas de statistiques',

  // Original text: "All hosts"
  poolAllHosts: 'Tous les hôtes',

  // Original text: "Add SR"
  addSrLabel: 'Ajouter un SR',

  // Original text: "Add VM"
  addVmLabel: 'Ajouter une VM',

  // Original text: "Add Host"
  addHostLabel: 'Ajouter un hôte',

  // Original text: "This host needs to install {patches, number} patch{patches, plural, one {} other {es}} before it can be added to the pool. This operation may be long."
  hostNeedsPatchUpdate:
    "Cet hôte a besoin d'installer {patches, number} patch{patches, plural, one {} other {es}} avant de pouvoir être ajouté au pool. Cette opération peut être longue.",

  // Original text: "This host cannot be added to the pool because it's missing some patches."
  hostNeedsPatchUpdateNoInstall: 'Cette hôte ne peut pas être ajouté au pool car il lui manque des patches.',

  // Original text: "Adding host failed"
  addHostErrorTitle: "L'ajout de l'hôte a échoué.",

  // Original text: "Host patches could not be homogenized."
  addHostNotHomogeneousErrorMessage: "Les patches de l'hôte n'ont pas pu être homogénéisés.",

  // Original text: "Disconnect"
  disconnectServer: 'Déconnecter',

  // Original text: "Start"
  startHostLabel: 'Démarrer',

  // Original text: "Stop"
  stopHostLabel: 'Arrêter',

  // Original text: "Enable"
  enableHostLabel: 'Activer',

  // Original text: "Disable"
  disableHostLabel: 'Désactiver',

  // Original text: "Restart toolstack"
  restartHostAgent: 'Redémarrer la toolstack',

  // Original text: "Force reboot"
  forceRebootHostLabel: 'Forcer un redémarrage',

  // Original text: "Reboot"
  rebootHostLabel: 'Redémarrer',

  // Original text: "Error while restarting host"
  noHostsAvailableErrorTitle: "Erreur lors du redémarrage de l'hôte",

  // Original text: "Some VMs cannot be migrated before restarting this host. Please try force reboot."
  noHostsAvailableErrorMessage:
    "Certaines VMs ne peuvent pas être migrées avant le redémarrage de l'hôte. Essayez de forcer le redémarrage.",

  // Original text: "Error while restarting hosts"
  failHostBulkRestartTitle: 'Erreur lors du redémarrage des hôtes',

  // Original text: "{failedHosts, number}/{totalHosts, number} host{failedHosts, plural, one {} other {s}} could not be restarted."
  failHostBulkRestartMessage:
    "{failedHosts, number}/{totalHosts, number} {failedHosts, plural, one {hôte n'a pas pu être redémarré} other {n'ont pas pu être redémarrés}} ",

  // Original text: "Reboot to apply updates"
  rebootUpdateHostLabel: 'Redémarrer pour appliquer les mises à jour',

  // Original text: "Emergency mode"
  emergencyModeLabel: 'Emergency mode',

  // Original text: "Storage"
  storageTabName: 'Stockage',

  // Original text: "Patches"
  patchesTabName: 'Patches',

  // Original text: "Load average"
  statLoad: 'Charge (load) moyenne :',

  // Original text: "RAM Usage: {memoryUsed}"
  memoryHostState: 'Mémoire utilisée : {memoryUsed}',

  // Original text: "Hardware"
  hardwareHostSettingsLabel: 'Matériel',

  // Original text: "Address"
  hostAddress: 'Adresse',

  // Original text: "Status"
  hostStatus: 'État',

  // Original text: "Build number"
  hostBuildNumber: 'Numéro de build',

  // Original text: "iSCSI name"
  hostIscsiName: 'Nom iSCSI',

  // Original text: "Version"
  hostXenServerVersion: 'Version',

  // Original text: "Enabled"
  hostStatusEnabled: 'Activé',

  // Original text: "Disabled"
  hostStatusDisabled: 'Désactivé',

  // Original text: "Power on mode"
  hostPowerOnMode: "Mode d'allumage",

  // Original text: "Host uptime"
  hostStartedSince: "Temps d'activité",

  // Original text: "Toolstack uptime"
  hostStackStartedSince: 'Toolstack uptime',

  // Original text: "CPU model"
  hostCpusModel: 'Modèle de CPU',

  // Original text: "Core (socket)"
  hostCpusNumber: 'Cœur (socket)',

  // Original text: "Manufacturer info"
  hostManufacturerinfo: 'Informations constructeur',

  // Original text: "BIOS info"
  hostBiosinfo: 'Informations BIOS',

  // Original text: "Licence"
  licenseHostSettingsLabel: 'Licence',

  // Original text: "Type"
  hostLicenseType: 'Type',

  // Original text: "Socket"
  hostLicenseSocket: 'Socket',

  // Original text: "Expiry"
  hostLicenseExpiry: 'Expiration',

  // Original text: "Installed supplemental packs"
  supplementalPacks: 'Packs supplémentaires installés',

  // Original text: "Install new supplemental pack"
  supplementalPackNew: 'Installer un nouveau pack supplémentaire',

  // Original text: "Install supplemental pack on every host"
  supplementalPackPoolNew: 'Installer un pack supplémentaire sur tous les hôtes',

  // Original text: "{name} (by {author})"
  supplementalPackTitle: '{name} (par {author})',

  // Original text: "Installation started"
  supplementalPackInstallStartedTitle: 'Installation démarrée',

  // Original text: "Installing new supplemental pack…"
  supplementalPackInstallStartedMessage: "Installation d'un nouveau pack supplémentaire",

  // Original text: "Installation error"
  supplementalPackInstallErrorTitle: "Erreur d'installation",

  // Original text: "The installation of the supplemental pack failed."
  supplementalPackInstallErrorMessage: "L'installation du pack supplémentaire a échoué.",

  // Original text: "Installation success"
  supplementalPackInstallSuccessTitle: "Succès de l'installation",

  // Original text: "Supplemental pack successfully installed."
  supplementalPackInstallSuccessMessage: 'Le pack supplémentaire a été installé avec succès.',

  // Original text: "Add a network"
  networkCreateButton: 'Ajouter un réseau',

  // Original text: "Add a bonded network"
  networkCreateBondedButton: 'Ajouter un réseau agrégé',

  // Original text: "Device"
  pifDeviceLabel: 'Device',

  // Original text: "Network"
  pifNetworkLabel: 'Réseau',

  // Original text: "VLAN"
  pifVlanLabel: 'VLAN',

  // Original text: "Address"
  pifAddressLabel: 'Adresse',

  // Original text: "Mode"
  pifModeLabel: 'Mode',

  // Original text: "MAC"
  pifMacLabel: 'MAC',

  // Original text: "MTU"
  pifMtuLabel: 'MTU',

  // Original text: "Status"
  pifStatusLabel: 'État',

  // Original text: "Connected"
  pifStatusConnected: 'Connecté',

  // Original text: "Disconnected"
  pifStatusDisconnected: 'Déconnecté',

  // Original text: "No physical interface detected"
  pifNoInterface: "Pas d'interface physique détectée",

  // Original text: "This interface is currently in use"
  pifInUse: "Cette interface est en cours d'utilisation",

  // Original text: "Action"
  pifAction: 'Action',

  // Original text: "Default locking mode"
  defaultLockingMode: 'Verrouillage par défaut',

  // Original text: "Configure IP address"
  pifConfigureIp: "Configurer l'adresse IP",

  // Original text: "Invalid parameters"
  configIpErrorTitle: 'Paramètres invalides',

  // Original text: "IP address and netmask required"
  configIpErrorMessage: 'Adresse IP et masque de réseau requis',

  // Original text: "Static IP address"
  staticIp: 'Adresse IP statique',

  // Original text: "Netmask"
  netmask: 'Masque de réseau',

  // Original text: "DNS"
  dns: 'DNS',

  // Original text: "Gateway"
  gateway: 'Passerelle',

  // Original text: "Add a storage"
  addSrDeviceButton: 'Ajouter un stockage',

  // Original text: "Name"
  srNameLabel: 'Nom',

  // Original text: "Type"
  srType: 'Type',

  // Original text: "Action"
  pbdAction: 'Action',

  // Original text: "Status"
  pbdStatus: 'État',

  // Original text: "Connected"
  pbdStatusConnected: 'Connecté',

  // Original text: "Disconnected"
  pbdStatusDisconnected: 'Déconnecté',

  // Original text: "Connect"
  pbdConnect: 'Connecter',

  // Original text: "Disconnect"
  pbdDisconnect: 'Déconnecter',

  // Original text: "Forget"
  pbdForget: 'Oublier',

  // Original text: "Shared"
  srShared: 'Partager',

  // Original text: "Not shared"
  srNotShared: 'Non partagé',

  // Original text: "No storage detected"
  pbdNoSr: 'Pas de stockage détecté',

  // Original text: "Name"
  patchNameLabel: 'Nom',

  // Original text: "Install all patches"
  patchUpdateButton: 'installer tous les patchs',

  // Original text: "Description"
  patchDescription: 'Description',

  // Original text: "Applied date"
  patchApplied: "Date d'installation",

  // Original text: "Size"
  patchSize: 'Taille',

  // Original text: "Status"
  patchStatus: 'État',

  // Original text: "Applied"
  patchStatusApplied: 'Appliqué',

  // Original text: "Missing patches"
  patchStatusNotApplied: 'Patches manquants',

  // Original text: "No patch detected"
  patchNothing: 'Pas de patch détecté',

  // Original text: "Release date"
  patchReleaseDate: 'Date de diffusion',

  // Original text: "Guidance"
  patchGuidance: 'Guidance',

  // Original text: "Action"
  patchAction: 'Action',

  // Original text: "Applied patches"
  hostAppliedPatches: 'Patches appliqués',

  // Original text: "Missing patches"
  hostMissingPatches: 'Patches manquants',

  // Original text: "Host up-to-date!"
  hostUpToDate: 'Hôte à jour !',

  // Original text: "Non-recommended patch install"
  installPatchWarningTitle: 'Installation de patch non recommandée',

  // Original text: "This will install a patch only on this host. This is NOT the recommended way: please go into the Pool patch view and follow instructions there. If you are sure about this, you can continue anyway"
  installPatchWarningContent:
    "Installer un patch sur un hôte seul est déconseillé. Il est recommandé d'aller sur la page du pool et de faire l'installation sur tous les hôtes.",

  // Original text: "Go to pool"
  installPatchWarningReject: 'Aller au pool',

  // Original text: "Install"
  installPatchWarningResolve: 'Installer',

  // Original text: "Refresh patches"
  refreshPatches: 'Rafraichir patchs',

  // Original text: "Install pool patches"
  installPoolPatches: 'Installer les patchs sur le pool',

  // Original text: "Default SR"
  defaultSr: 'SR par défaut',

  // Original text: "Set as default SR"
  setAsDefaultSr: 'Définir comme SR par défaut',

  // Original text: "General"
  generalTabName: 'Général',

  // Original text: "Stats"
  statsTabName: 'Stats',

  // Original text: "Console"
  consoleTabName: 'Console',

  // Original text: "Container"
  containersTabName: 'Conteneur',

  // Original text: "Snapshots"
  snapshotsTabName: 'Instantanés',

  // Original text: "Logs"
  logsTabName: 'Journaux',

  // Original text: "Advanced"
  advancedTabName: 'Avancé',

  // Original text: "Network"
  networkTabName: 'Réseaux',

  // Original text: "Disk{disks, plural, one {} other {s}}"
  disksTabName: 'Disque{disks, plural, one {} other {s}}',

  // Original text: "halted"
  powerStateHalted: 'stoppé',

  // Original text: "running"
  powerStateRunning: 'en cours',

  // Original text: "suspended"
  powerStateSuspended: 'suspendu',

  // Original text: "No Xen tools detected"
  vmStatus: 'Pas de Xen tools détectés',

  // Original text: "No IPv4 record"
  vmName: "Pas d'enregistrement IPv4",

  // Original text: "No IP record"
  vmDescription: "Pas d'enregistrement IP",

  // Original text: "Started {ago}"
  vmSettings: 'Démarré il y a {ago}',

  // Original text: "Current status:"
  vmCurrentStatus: 'État actuel :',

  // Original text: "Not running"
  vmNotRunning: 'Éteinte',

  // Original text: "Halted {ago}"
  vmHaltedSince: 'Stoppée {ago}',

  // Original text: "No Xen tools detected"
  noToolsDetected: 'Pas de Xen tools détectés',

  // Original text: "No IPv4 record"
  noIpv4Record: "Pas d'enregistrement IPv4",

  // Original text: "No IP record"
  noIpRecord: "Pas d'enregistrement IP",

  // Original text: "Started {ago}"
  started: 'Démarré {ago}',

  // Original text: "Paravirtualization (PV)"
  paraVirtualizedMode: 'Paravirtualisation (PV)',

  // Original text: "Hardware virtualization (HVM)"
  hardwareVirtualizedMode: 'Virtualisation matérielle (HVM)',

  // Original text: "CPU usage"
  statsCpu: 'Utilisation CPU',

  // Original text: "Memory usage"
  statsMemory: 'Utilisation mémoire',

  // Original text: "Network throughput"
  statsNetwork: 'Échanges réseaux',

  // Original text: "Stacked values"
  useStackedValuesOnStats: 'Valeurs cumulées',

  // Original text: "Disk throughput"
  statDisk: 'Échanges disques',

  // Original text: "Last 10 minutes"
  statLastTenMinutes: 'Les 10 dernières minutes',

  // Original text: "Last 2 hours"
  statLastTwoHours: 'Les 2 dernières heures',

  // Original text: "Last week"
  statLastWeek: 'La dernière semaine',

  // Original text: "Last year"
  statLastYear: 'La dernière année',

  // Original text: "Copy"
  copyToClipboardLabel: 'Copier',

  // Original text: "Ctrl+Alt+Del"
  ctrlAltDelButtonLabel: 'Ctrl+Alt+Supp',

  // Original text: "Tip:"
  tipLabel: 'Astuces :',

  // Original text: "Hide infos"
  hideHeaderTooltip: 'Cacher les infos',

  // Original text: "Show infos"
  showHeaderTooltip: 'Afficher les infos',

  // Original text: "Name"
  containerName: 'Nom',

  // Original text: "Command"
  containerCommand: 'Commande',

  // Original text: "Creation date"
  containerCreated: 'Date de création',

  // Original text: "Status"
  containerStatus: 'État',

  // Original text: "Action"
  containerAction: 'Action',

  // Original text: "No existing containers"
  noContainers: 'Aucun conteneur',

  // Original text: "Stop this container"
  containerStop: 'Arrêter ce conteneur',

  // Original text: "Start this container"
  containerStart: 'Démarrer ce conteneur',

  // Original text: "Pause this container"
  containerPause: 'Mettre ce conteneur en pause',

  // Original text: "Resume this container"
  containerResume: 'Relancer ce conteneur',

  // Original text: "Restart this container"
  containerRestart: 'Redémarrer ce conteneur',

  // Original text: "Action"
  vdiAction: 'Action',

  // Original text: "Attach disk"
  vdiAttachDevice: 'Attacher un disque',

  // Original text: "New disk"
  vbdCreateDeviceButton: 'Nouveau disque',

  // Original text: "Boot order"
  vdiBootOrder: 'Séquence de démarrage',

  // Original text: "Name"
  vdiNameLabel: 'Nom',

  // Original text: "Description"
  vdiNameDescription: 'Description',

  // Original text: "Pool"
  vdiPool: 'Pool',

  // Original text: "Disconnect"
  vdiDisconnect: 'Déconnecté',

  // Original text: "Tags"
  vdiTags: 'Tags',

  // Original text: "Size"
  vdiSize: 'Taille',

  // Original text: "SR"
  vdiSr: 'SR',

  // Original text: "VM"
  vdiVm: 'VM',

  // Original text: "Migrate VDI"
  vdiMigrate: 'Migrer le VDI',

  // Original text: "Destination SR:"
  vdiMigrateSelectSr: 'SR de destination :',

  // Original text: "No SR"
  vdiMigrateNoSr: 'Pas de SR',

  // Original text: "A target SR is required to migrate a VDI"
  vdiMigrateNoSrMessage: 'Un SR cible est nécessaire pour migrer un VDI',

  // Original text: "Forget"
  vdiForget: 'Oublier',

  // Original text: "Remove VDI"
  vdiRemove: 'Supprimer le VDI',

  // Original text: "No VDIs attached to Control Domain"
  noControlDomainVdis: 'Aucun VDI attaché au Control Domain',

  // Original text: "Boot flag"
  vbdBootableStatus: 'Boot flag',

  // Original text: "Status"
  vbdStatus: 'État',

  // Original text: "Connected"
  vbdStatusConnected: 'Connecté',

  // Original text: "Disconnected"
  vbdStatusDisconnected: 'Déconnecté',

  // Original text: "No disks"
  vbdNoVbd: 'Pas de disque',

  // Original text: "Connect VBD"
  vbdConnect: 'Connecter un VBD',

  // Original text: "Disconnect VBD"
  vbdDisconnect: 'Déconnecter un VBD',

  // Original text: "Bootable"
  vbdBootable: 'Bootable',

  // Original text: "Readonly"
  vbdReadonly: 'Lecture seule',

  // Original text: "Action"
  vbdAction: 'Action',

  // Original text: "Create"
  vbdCreate: 'Créer',

  // Original text: "Disk name"
  vbdNamePlaceHolder: 'Nom du disque',

  // Original text: "Size"
  vbdSizePlaceHolder: 'Taille',

  // Original text: "CD drive not completely installed"
  cdDriveNotInstalled: "Le lecteur CD n'est pas complètement installé",

  // Original text: "Stop and start the VM to install the CD drive"
  cdDriveInstallation: 'Arrêtez et démarrez la VM pour installer le lecteur CD',

  // Original text: "Save"
  saveBootOption: 'Enregistrer',

  // Original text: "Reset"
  resetBootOption: 'Réinitialiser',

  // Original text: "New device"
  vifCreateDeviceButton: 'Nouvelle interface',

  // Original text: "No interface"
  vifNoInterface: "Pas d'interface",

  // Original text: "Device"
  vifDeviceLabel: 'Device',

  // Original text: "MAC address"
  vifMacLabel: 'Adresse MAC',

  // Original text: "MTU"
  vifMtuLabel: 'MTU',

  // Original text: "Network"
  vifNetworkLabel: 'Réseaux',

  // Original text: "Status"
  vifStatusLabel: 'État',

  // Original text: "Connected"
  vifStatusConnected: 'Connecté',

  // Original text: "Disconnected"
  vifStatusDisconnected: 'Déconnecté',

  // Original text: "Connect"
  vifConnect: 'Connecter',

  // Original text: "Disconnect"
  vifDisconnect: 'Déconnecter',

  // Original text: "Remove"
  vifRemove: 'Supprimer',

  // Original text: "IP addresses"
  vifIpAddresses: 'Adresses IP',

  // Original text: "Auto-generated if empty"
  vifMacAutoGenerate: 'Si vide, généré automatiquement',

  // Original text: "Allowed IPs"
  vifAllowedIps: 'IPs autorisées',

  // Original text: "No IPs"
  vifNoIps: "Pas d'IP",

  // Original text: "Network locked"
  vifLockedNetwork: 'Réseau verrouillé',

  // Original text: "Network locked and no IPs are allowed for this interface"
  vifLockedNetworkNoIps: "Le réseau est verrouillé et aucune IP n'est autorisée sur cette interface",

  // Original text: "Network not locked"
  vifUnLockedNetwork: 'Réseau non verrouillé',

  // Original text: "Unknown network"
  vifUnknownNetwork: 'Réseau inconnu',

  // Original text: "Action"
  vifAction: 'Action',

  // Original text: "Create"
  vifCreate: 'Créer',

  // Original text: "No snapshots"
  noSnapshots: "Pas d'instantané",

  // Original text: "New snapshot"
  snapshotCreateButton: 'Nouvel instantané',

  // Original text: "Just click on the snapshot button to create one!"
  tipCreateSnapshotLabel: "Cliquer simplement sur le bouton d'instantané pour en créer un !",

  // Original text: "Revert VM to this snapshot"
  revertSnapshot: 'Restaurer la MV à cet instantané',

  // Original text: "Remove this snapshot"
  deleteSnapshot: 'Supprimer cet instantané',

  // Original text: "Create a VM from this snapshot"
  copySnapshot: 'Créer une VM depuis cet instantané',

  // Original text: "Export this snapshot"
  exportSnapshot: 'Exporter cet instantané',

  // Original text: "Creation date"
  snapshotDate: 'Date de création',

  // Original text: "Name"
  snapshotName: 'Nom',

  // Original text: "Name"
  snapshotDescription: 'Description',

  // Original text: "Action"
  snapshotAction: 'Action',

  // Original text: "Quiesced snapshot"
  snapshotQuiesce: 'Instantané quiesce',

  // Original text: "Remove all logs"
  logRemoveAll: 'Supprimer tous les journaux',

  // Original text: "No logs so far"
  noLogs: 'Pas de journaux jusque là',

  // Original text: "Creation date"
  logDate: 'Date de création',

  // Original text: "Name"
  logName: 'Nom',

  // Original text: "Content"
  logContent: 'Contenu',

  // Original text: "Action"
  logAction: 'Action',

  // Original text: "Remove"
  vmRemoveButton: 'Supprimer',

  // Original text: "Convert"
  vmConvertButton: 'Convertir',

  // Original text: "Xen settings"
  xenSettingsLabel: 'Configuration Xen',

  // Original text: "Guest OS"
  guestOsLabel: 'OS invité',

  // Original text: "Misc"
  miscLabel: 'Divers',

  // Original text: "UUID"
  uuid: 'UUID',

  // Original text: "Virtualization mode"
  virtualizationMode: 'Mode de virtualisation',

  // Original text: "CPU weight"
  cpuWeightLabel: 'Pondération CPU',

  // Original text: "Default ({value, number})"
  defaultCpuWeight: 'Défaut ({value, number})',

  // Original text: "CPU cap"
  cpuCapLabel: 'Fonctionnalités CPU',

  // Original text: "Default ({value, number})"
  defaultCpuCap: 'Défaut ({value, number})',

  // Original text: "PV args"
  pvArgsLabel: 'PV params',

  // Original text: "Xen tools status"
  xenToolsStatus: 'État des Xen tools',

  // Original text: "{status}"
  xenToolsStatusValue: '{status}',

  // Original text: "OS name"
  osName: "Nom de l'OS",

  // Original text: "OS kernel"
  osKernel: "Kernel de l'OS",

  // Original text: "Auto power on"
  autoPowerOn: 'Allumage automatique',

  // Original text: "HA"
  ha: 'Haute Dispo',

  // Original text: "Affinity host"
  vmAffinityHost: 'Hôte préféré',

  // Original text: "VGA"
  vmVga: 'VGA',

  // Original text: "Video RAM"
  vmVideoram: 'Mémoire vidéo',

  // Original text: "None"
  noAffinityHost: 'Aucun',

  // Original text: "Original template"
  originalTemplate: "Template d'origine",

  // Original text: "Unknown"
  unknownOsName: 'Inconnu',

  // Original text: "Unknown"
  unknownOsKernel: 'Inconnu',

  // Original text: "Unknown"
  unknownOriginalTemplate: 'Inconnu',

  // Original text: "VM limits"
  vmLimitsLabel: 'Limites de la VM',

  // Original text: "CPU limits"
  vmCpuLimitsLabel: 'Limites de CPU',

  // Original text: "Topology"
  vmCpuTopology: 'Topologie',

  // Original text: "Default behavior"
  vmChooseCoresPerSocket: 'Comportement par défaut',

  // Original text: "{nSockets, number} socket{nSockets, plural, one {} other {s}} with {nCores, number} core{nCores, plural, one {} other {s}} per socket"
  vmSocketsWithCoresPerSocket:
    '{nSockets, number} socket{nSockets, plural, one {} other {s}} avec {nCores, number} cœur{nCores, plural, one {} other {s}} par socket',

  // Original text: "Incorrect cores per socket value"
  vmCoresPerSocketIncorrectValue: 'Valeur incorrecte de cœurs par socket',

  // Original text: "Please change the selected value to fix it."
  vmCoresPerSocketIncorrectValueSolution: 'Veuillez modifier la valeur.',

  // Original text: "Memory limits (min/max)"
  vmMemoryLimitsLabel: 'Limites de mémoire (min/max)',

  // Original text: "vCPUs max:"
  vmMaxVcpus: 'vCPUs max :',

  // Original text: "Memory max:"
  vmMaxRam: 'Mémoire max :',

  // Original text: "Long click to add a name"
  vmHomeNamePlaceholder: 'Clic long pour définir un nom',

  // Original text: "Long click to add a description"
  vmHomeDescriptionPlaceholder: 'Clic long pour définir une description',

  // Original text: "Click to add a name"
  vmViewNamePlaceholder: 'Cliquer pour définir un nom',

  // Original text: "Click to add a description"
  vmViewDescriptionPlaceholder: 'Cliquer pour définir une description',

  // Original text: "Click to add a name"
  templateHomeNamePlaceholder: 'Cliquer pour ajouter un nom',

  // Original text: "Click to add a description"
  templateHomeDescriptionPlaceholder: 'Cliquer pour ajouter une description',

  // Original text: "Delete template"
  templateDelete: 'Supprimer le template',

  // Original text: "Delete VM template{templates, plural, one {} other {s}}"
  templateDeleteModalTitle: 'Supprimer le(s) template{templates, plural, one {} other {s}} de VMs',

  // Original text: "Are you sure you want to delete {templates, plural, one {this} other {these}} template{templates, plural, one {} other {s}}?"
  templateDeleteModalBody: 'Êtes-vous sûr de vouloir supprimer ce(s) template(s) ?',

  // Original text: "Pool{pools, plural, one {} other {s}}"
  poolPanel: 'Pool{pools, plural, one {} other {s}}',

  // Original text: "Host{hosts, plural, one {} other {s}}"
  hostPanel: 'Hôte{hosts, plural, one {} other {s}}',

  // Original text: "VM{vms, plural, one {} other {s}}"
  vmPanel: 'VM{vms, plural, one {} other {s}}',

  // Original text: "RAM Usage:"
  memoryStatePanel: 'Utilisation RAM',

  // Original text: "CPUs Usage"
  cpuStatePanel: 'Utilisation CPUs',

  // Original text: "VMs Power state"
  vmStatePanel: 'Etats des VMs',

  // Original text: "Pending tasks"
  taskStatePanel: 'Tâches en attente',

  // Original text: "Users"
  usersStatePanel: 'Utilisateurs',

  // Original text: "Storage state"
  srStatePanel: 'État du stockage',

  // Original text: "{usage} (of {total})"
  ofUsage: '{usage} (sur {total})',

  // Original text: "No storage"
  noSrs: 'Pas de stockage',

  // Original text: "Name"
  srName: 'Nom',

  // Original text: "Pool"
  srPool: 'Pool',

  // Original text: "Host"
  srHost: 'Hôte',

  // Original text: "Type"
  srFormat: 'Type',

  // Original text: "Size"
  srSize: 'Taille',

  // Original text: "Usage"
  srUsage: 'Usage',

  // Original text: "used"
  srUsed: 'utilisé',

  // Original text: "free"
  srFree: 'libre',

  // Original text: "Storage Usage"
  srUsageStatePanel: 'Utilisation du stockage',

  // Original text: "Top 5 SR Usage (in %)"
  srTopUsageStatePanel: "Top 5 d'utilisation des SRs (en %)",

  // Original text: "{running, number} running ({halted, number} halted)"
  vmsStates: '{running} allumée{halted, plural, one {} other {s}} ({halted} éteinte{halted, plural, one {} other {s}})',

  // Original text: "Clear selection"
  dashboardStatsButtonRemoveAll: 'Vider la sélection',

  // Original text: "Add all hosts"
  dashboardStatsButtonAddAllHost: 'Ajouter tous les hôtes',

  // Original text: "Add all VMs"
  dashboardStatsButtonAddAllVM: 'Ajouter toutes les VMs',

  // Original text: "{value} {date, date, medium}"
  weekHeatmapData: '{value} {date, date, medium}',

  // Original text: "No data."
  weekHeatmapNoData: 'Pas de données.',

  // Original text: "Weekly Heatmap"
  weeklyHeatmap: 'Heatmap hebdomadaire',

  // Original text: "Weekly Charts"
  weeklyCharts: 'Graphes hebdomadaires',

  // Original text: "Synchronize scale:"
  weeklyChartsScaleInfo: 'Synchroniser les échelles :',

  // Original text: "Stats error"
  statsDashboardGenericErrorTitle: 'Erreurs de stats',

  // Original text: "There is no stats available for:"
  statsDashboardGenericErrorMessage: 'Pas de statistiques disponibles pour :',

  // Original text: "No selected metric"
  noSelectedMetric: 'Pas de métrique sélectionnée.',

  // Original text: "Select"
  statsDashboardSelectObjects: 'Sélectionner',

  // Original text: "Loading…"
  metricsLoading: 'Chargement en cours…',

  // Original text: "Coming soon!"
  comingSoon: "C'est pour bientôt !",

  // Original text: "Orphaned snapshot VDIs"
  orphanedVdis: 'Instantanés de VDIs orphelins',

  // Original text: "Orphaned VMs snapshot"
  orphanedVms: 'Instantanés VMs orphelins',

  // Original text: "No orphans"
  noOrphanedObject: "Pas d'orphelin",

  // Original text: "Remove all orphaned snapshot VDIs"
  removeAllOrphanedObject: 'Supprimer tous les snapshots de VDIs orphelins',

  // Original text: "VDIs attached to Control Domain"
  vdisOnControlDomain: 'VDIs attachés au Control Domain',

  // Original text: "Name"
  vmNameLabel: 'Nom',

  // Original text: "Description"
  vmNameDescription: 'Description',

  // Original text: "Resident on"
  vmContainer: 'Situé sur',

  // Original text: "Alarms"
  alarmMessage: 'Alarmes',

  // Original text: "No alarms"
  noAlarms: "Pas d'alarmes",

  // Original text: "Date"
  alarmDate: 'Date',

  // Original text: "Content"
  alarmContent: 'Contenu',

  // Original text: "Issue on"
  alarmObject: 'Concerné',

  // Original text: "Pool"
  alarmPool: 'Pool',

  // Original text: "Remove all alarms"
  alarmRemoveAll: 'Supprimer toutes les alarmes',

  // Original text: "{used}% used ({free} left)"
  spaceLeftTooltip: '{used}% utilisés ({free} restants)',

  // Original text: "Create a new VM on {select}"
  newVmCreateNewVmOn: 'Créer une nouvelle VM sur {select}',

  // Original text: "Create a new VM on {select1} or {select2}"
  newVmCreateNewVmOn2: 'Créer une nouvelle VM sur  {select1} ou {select2}',

  // Original text: "You have no permission to create a VM"
  newVmCreateNewVmNoPermission: "Vous n'avez pas les droits pour créer une VM",

  // Original text: "Infos"
  newVmInfoPanel: 'Infos',

  // Original text: "Name"
  newVmNameLabel: 'Nom',

  // Original text: "Template"
  newVmTemplateLabel: 'Template',

  // Original text: "Description"
  newVmDescriptionLabel: 'Description',

  // Original text: "Performances"
  newVmPerfPanel: 'Performances',

  // Original text: "vCPUs"
  newVmVcpusLabel: 'vCPUs',

  // Original text: "RAM"
  newVmRamLabel: 'RAM',

  // Original text: "Static memory max"
  newVmStaticMaxLabel: 'Mémoire fixe max',

  // Original text: "Dynamic memory min"
  newVmDynamicMinLabel: 'Mémoire dynamique min',

  // Original text: "Dynamic memory max"
  newVmDynamicMaxLabel: 'Mémoire dynamique max',

  // Original text: "Install settings"
  newVmInstallSettingsPanel: "Paramètres d'installation",

  // Original text: "ISO/DVD"
  newVmIsoDvdLabel: 'ISO/DVD',

  // Original text: "Network"
  newVmNetworkLabel: 'Réseau',

  // Original text: "e.g: http://httpredir.debian.org/debian"
  newVmInstallNetworkPlaceHolder: 'ex : http://httpredir.debian.org/debian',

  // Original text: "PV Args"
  newVmPvArgsLabel: 'PV Args',

  // Original text: "PXE"
  newVmPxeLabel: 'PXE',

  // Original text: "Interfaces"
  newVmInterfacesPanel: 'Interfaces',

  // Original text: "MAC"
  newVmMacLabel: 'MAC',

  // Original text: "Add interface"
  newVmAddInterface: 'Ajouter interface',

  // Original text: "Disks"
  newVmDisksPanel: 'Disques',

  // Original text: "SR"
  newVmSrLabel: 'SR',

  // Original text: "Size"
  newVmSizeLabel: 'Taille',

  // Original text: "Add disk"
  newVmAddDisk: 'Ajouter un disque',

  // Original text: "Summary"
  newVmSummaryPanel: 'Récapitulatif',

  // Original text: "Create"
  newVmCreate: 'Créer',

  // Original text: "Reset"
  newVmReset: 'Réinitialiser',

  // Original text: "Select template"
  newVmSelectTemplate: 'Sélectionner un template',

  // Original text: "SSH key"
  newVmSshKey: 'Clef SSH',

  // Original text: "Config drive"
  newVmConfigDrive: 'Config drive',

  // Original text: "Custom config"
  newVmCustomConfig: 'Configuration personnalisée',

  // Original text: "Boot VM after creation"
  newVmBootAfterCreate: 'Démarrer la VM après sa création',

  // Original text: "Auto-generated if empty"
  newVmMacPlaceholder: 'Si vide, généré automatiquement',

  // Original text: "CPU weight"
  newVmCpuWeightLabel: 'Pondération CPU',

  // Original text: "Default: {value, number}"
  newVmDefaultCpuWeight: 'Par défaut: {value, number}',

  // Original text: "CPU cap"
  newVmCpuCapLabel: 'Fonctionnalités CPU',

  // Original text: "Default: {value, number}"
  newVmDefaultCpuCap: 'Par défaut : {value, number}',

  // Original text: "Cloud config"
  newVmCloudConfig: 'Configuration Cloud',

  // Original text: "Create VMs"
  newVmCreateVms: 'Créer les VMs',

  // Original text: "Are you sure you want to create {nbVms, number} VMs?"
  newVmCreateVmsConfirm: 'Êtes-vous sûr de vouloir créer {nbVms} VMs ?',

  // Original text: "Multiple VMs:"
  newVmMultipleVms: 'Multiples VMs :',

  // Original text: "Select a resource set:"
  newVmSelectResourceSet: 'Choisir un jeu de ressources :',

  // Original text: "Name pattern:"
  newVmMultipleVmsPattern: 'Motif de nom :',

  // Original text: "e.g.: \\{name\\}_%"
  newVmMultipleVmsPatternPlaceholder: 'ex. : \\{name\\}_%',

  // Original text: "First index:"
  newVmFirstIndex: 'Première itération :',

  // Original text: "Recalculate VMs number"
  newVmNumberRecalculate: 'Recalculer le nombre des VMs',

  // Original text: "Refresh VMs name"
  newVmNameRefresh: 'Rafraîchir le nom des VMs',

  // Original text: "Affinity host"
  newVmAffinityHost: 'Hôte préféré',

  // Original text: "Advanced"
  newVmAdvancedPanel: 'Avancé',

  // Original text: "Show advanced settings"
  newVmShowAdvanced: 'Afficher les paramètres avancés',

  // Original text: "Hide advanced settings"
  newVmHideAdvanced: 'Cacher les paramètres avancés',

  // Original text: "Share this VM"
  newVmShare: 'Partager cette VM',

  // Original text: "Resource sets"
  resourceSets: 'Jeu de ressources',

  // Original text: "No resource sets."
  noResourceSets: 'Pas de jeu de ressources.',

  // Original text: "Loading resource sets"
  loadingResourceSets: 'Chargement des jeux de ressources…',

  // Original text: "Resource set name"
  resourceSetName: 'Nom du jeu de ressources',

  // Original text: "Recompute all limits"
  recomputeResourceSets: 'Recalculer les limites',

  // Original text: "Save"
  saveResourceSet: 'Enregistrer',

  // Original text: "Reset"
  resetResourceSet: 'Réinitialiser',

  // Original text: "Edit"
  editResourceSet: 'Éditer',

  // Original text: "Delete"
  deleteResourceSet: 'Supprimer',

  // Original text: "Delete resource set"
  deleteResourceSetWarning: 'Supprimer le jeu de ressources',

  // Original text: "Are you sure you want to delete this resource set?"
  deleteResourceSetQuestion: 'Êtes-vous sûr de vouloir supprimer ce jeu de ressources ?',

  // Original text: "Missing objects:"
  resourceSetMissingObjects: 'Objets manquants :',

  // Original text: "vCPUs"
  resourceSetVcpus: 'vCPUs',

  // Original text: "Memory"
  resourceSetMemory: 'Mémoire',

  // Original text: "Storage"
  resourceSetStorage: 'Stockage',

  // Original text: "Unknown"
  unknownResourceSetValue: 'Inconnu',

  // Original text: "Available hosts"
  availableHosts: 'Hôtes disponibles',

  // Original text: "Excluded hosts"
  excludedHosts: 'Hôtes exclus',

  // Original text: "No hosts available."
  noHostsAvailable: "Pas d'hôte disponible.",

  // Original text: "VMs created from this resource set shall run on the following hosts."
  availableHostsDescription: 'Les VMs créées sur ce jeu de ressources doivent être démarrées sur les hôtes suivants.',

  // Original text: "Maximum CPUs"
  maxCpus: 'CPUs maximum',

  // Original text: "Maximum RAM (GiB)"
  maxRam: 'RAM maximum (GiB)',

  // Original text: "Maximum disk space"
  maxDiskSpace: 'Espace disque maximum',

  // Original text: "IP pool"
  ipPool: "Plages d'IPs",

  // Original text: "Quantity"
  quantity: 'Quantité',

  // Original text: "No limits."
  noResourceSetLimits: 'Pas de limites.',

  // Original text: "Total:"
  totalResource: 'Total :',

  // Original text: "Remaining:"
  remainingResource: 'Restant :',

  // Original text: "Used:"
  usedResource: 'Utilisé :',

  // Original text: "New"
  resourceSetNew: 'Nouvelle',

  // Original text: "Drop OVA or XVA files here to import Virtual Machines."
  importVmsList: 'Déposez ici vos fichiers OVA ou XVA pour importer des machines virtuelles.',

  // Original text: "No selected VMs."
  noSelectedVms: 'Pas de VM sélectionnée.',

  // Original text: "To Pool:"
  vmImportToPool: 'Sur le Pool:',

  // Original text: "To SR:"
  vmImportToSr: 'Sur le SR:',

  // Original text: "VM{nVms, plural, one {} other {s}}  to import"
  vmsToImport: 'VM{nVms, plural, one {} other {s}}  à importer',

  // Original text: "Reset"
  importVmsCleanList: 'Réinitialiser',

  // Original text: "VM import success"
  vmImportSuccess: 'Import de VM réussi',

  // Original text: "VM import failed"
  vmImportFailed: 'Import de VM échoué',

  // Original text: "Import starting…"
  startVmImport: "L'import commence…",

  // Original text: "Export starting…"
  startVmExport: "L'export commence…",

  // Original text: "Number of CPUs"
  nCpus: 'Nombre de CPUs',

  // Original text: "Memory"
  vmMemory: 'Mémoire',

  // Original text: "Disk {position} ({capacity})"
  diskInfo: 'Disque {position} ({capacity})',

  // Original text: "Disk description"
  diskDescription: 'Description du disque',

  // Original text: "No disks."
  noDisks: 'Pas de disque.',

  // Original text: "No networks."
  noNetworks: 'Pas de réseau.',

  // Original text: "Network {name}"
  networkInfo: 'Réseau {name}',

  // Original text: "No description available"
  noVmImportErrorDescription: 'Pas de description disponible',

  // Original text: "Error:"
  vmImportError: 'Erreur :',

  // Original text: "{type} file:"
  vmImportFileType: '{type} fichier:',

  // Original text: "Please to check and/or modify the VM configuration."
  vmImportConfigAlert: 'Merci de vérifier et/ou modifier la configuration de la VM.',

  // Original text: "No pending tasks"
  noTasks: 'Pas de tâche en attente',

  // Original text: "Currently, there are not any pending XenServer tasks"
  xsTasks: "Actuellement, il n'y a aucune tâche en attente",

  // Original text: "Schedules"
  backupSchedules: 'Planifier',

  // Original text: "Get remote"
  getRemote: 'Récupérer les emplacements',

  // Original text: "List Remote"
  listRemote: 'Lister les emplacements',

  // Original text: "simple"
  simpleBackup: 'simple',

  // Original text: "delta"
  delta: 'delta',

  // Original text: "Restore Backups"
  restoreBackups: 'Restauration de sauvegardes',

  // Original text: "Click on a VM to display restore options"
  restoreBackupsInfo: 'Cliquez sur une VM pour afficher les options de récupération',

  // Original text: "Enabled"
  remoteEnabled: 'activé',

  // Original text: "Error"
  remoteError: 'Erreur',

  // Original text: "No backup available"
  noBackup: 'Pas de sauvegarde disponible',

  // Original text: "VM Name"
  backupVmNameColumn: 'Nom de la VM',

  // Original text: "Tags"
  backupTags: 'Tags',

  // Original text: "Last Backup"
  lastBackupColumn: 'Dernière sauvegarde',

  // Original text: "Available Backups"
  availableBackupsColumn: 'Sauvegardes disponibles',

  // Original text: "Missing parameters"
  backupRestoreErrorTitle: 'Paramètres manquants',

  // Original text: "Choose a SR and a backup"
  backupRestoreErrorMessage: 'Choisir un SR et une sauvegarde',

  // Original text: "Select default SR…"
  backupRestoreSelectDefaultSr: 'Sélectionner le SR par défaut…',

  // Original text: "Choose a SR for each VDI"
  backupRestoreChooseSrForEachVdis: 'Choisir un SR pour chaque VDI',

  // Original text: "VDI"
  backupRestoreVdiLabel: 'VDI',

  // Original text: "SR"
  backupRestoreSrLabel: 'SR',

  // Original text: "Display backups"
  displayBackup: 'Afficher les sauvegardes',

  // Original text: "Import VM"
  importBackupTitle: 'Importer une VM',

  // Original text: "Starting your backup import"
  importBackupMessage: "Démarrer l'import d'une sauvegarde",

  // Original text: "VMs to backup"
  vmsToBackup: 'VMs à sauvegarder',

  // Original text: "List remote backups"
  listRemoteBackups: 'Lister les emplacements de sauvegardes',

  // Original text: "Restore backup files"
  restoreFiles: 'Restaurer les fichiers de sauvegarde',

  // Original text: "Invalid options"
  restoreFilesError: 'Options invalides',

  // Original text: "Restore file from {name}"
  restoreFilesFromBackup: 'Restaurer les fichiers depuis {name}',

  // Original text: "Select a backup…"
  restoreFilesSelectBackup: 'Sélectionner une sauvegarde…',

  // Original text: "Select a disk…"
  restoreFilesSelectDisk: 'Sélectionner un disque…',

  // Original text: "Select a partition…"
  restoreFilesSelectPartition: 'Sélectionner un partition…',

  // Original text: "Folder path"
  restoreFilesSelectFolderPath: 'Chemin du dossier',

  // Original text: "Select a file…"
  restoreFilesSelectFiles: 'Sélectionner un fichier…',

  // Original text: "Content not found"
  restoreFileContentNotFound: 'Contenu non trouvé',

  // Original text: "No files selected"
  restoreFilesNoFilesSelected: 'Pas de fichier sélectionné',

  // Original text: "Selected files ({files}):"
  restoreFilesSelectedFiles: 'Fichiers sélectionnés ({files}) :',

  // Original text: "Error while scanning disk"
  restoreFilesDiskError: 'Erreur lors du scan du disque',

  // Original text: "Select all this folder's files"
  restoreFilesSelectAllFiles: 'Sélectionner tous les fichiers de ce dossier',

  // Original text: "Unselect all files"
  restoreFilesUnselectAll: 'Déselectionner tous les fichiers',

  // Original text: "Emergency shutdown Host{nHosts, plural, one {} other {s}}"
  emergencyShutdownHostsModalTitle: "Extinction d'urgence {nHosts, plural, one {de l'hôte} other {des hôtes}}",

  // Original text: "Are you sure you want to shutdown {nHosts, number} Host{nHosts, plural, one {} other {s}}?"
  emergencyShutdownHostsModalMessage:
    'Êtes-vous sûr de vouloir arrêter {nHosts} hôte{nHosts, plural, one {} other {s}}?',

  // Original text: "Shutdown host"
  stopHostModalTitle: "Arrêter l'hôte",

  // Original text: "This will shutdown your host. Do you want to continue? If it's the pool master, your connection to the pool will be lost"
  stopHostModalMessage:
    "Vous allez éteindre cet hôte. Voulez-vous continuer ? Si c'est le Maître du Pool, la connexion à tout le Pool sera perdue.",

  // Original text: "Add host"
  addHostModalTitle: 'Ajouter un hôte',

  // Original text: "Are you sure you want to add {host} to {pool}?"
  addHostModalMessage: 'Êtes-vous sûr de vouloir ajouter {host} à {pool}?',

  // Original text: "Restart host"
  restartHostModalTitle: "Redémarrer l'hôte",

  // Original text: "This will restart your host. Do you want to continue?"
  restartHostModalMessage: 'Votre hôte va devoir redémarrer. Voulez-vous continuer ?',

  // Original text: "Restart Host{nHosts, plural, one {} other {s}} agent{nHosts, plural, one {} other {s}}"
  restartHostsAgentsModalTitle: "Redémarrer les agents {nHosts, plural, one {de l'hôte} other {des hôtes}}",

  // Original text: "Are you sure you want to restart {nHosts, number} Host{nHosts, plural, one {} other {s}} agent{nHosts, plural, one {} other {s}}?"
  restartHostsAgentsModalMessage:
    "Êtes-vous sûr de vouloir redémarrer les agents {nHosts, plural, one {de l'hôte} other {des hôtes}} ?",

  // Original text: "Restart Host{nHosts, plural, one {} other {s}}"
  restartHostsModalTitle: "Redémarrer {nHosts, plural, one {l'} other {les}} hôte{nHosts, plural, one {} other {s}}",

  // Original text: "Are you sure you want to restart {nHosts, number} Host{nHosts, plural, one {} other {s}}?"
  restartHostsModalMessage:
    "Êtes-vous sûr de vouloir redémarrer {nHosts, plural, one {l'} other {les}} hôte{nHosts, plural, one {} other {s}} ?",

  // Original text: "Start VM{vms, plural, one {} other {s}}"
  startVmsModalTitle: 'Démarrer {vms, plural, one {la} other {les}} VM{vms, plural, one {} other {s}}',

  // Original text: "Start a copy"
  cloneAndStartVM: 'Démarrer une copie',

  // Original text: "Force start"
  forceStartVm: 'Forcer le démarrage',

  // Original text: "Forbidden operation"
  forceStartVmModalTitle: 'Opération non autorisée',

  // Original text: "Start operation for this vm is blocked."
  blockedStartVmModalMessage: 'Le démarrage est bloqué pour cette VM.',

  // Original text: "Forbidden operation start for {nVms, number} vm{nVms, plural, one {} other {s}}."
  blockedStartVmsModalMessage: 'Démarrage non autorisé pour {nVms, number} VM{nVms, plural, one {} other {s}}',

  // Original text: "Are you sure you want to start {vms, number} VM{vms, plural, one {} other {s}}?"
  startVmsModalMessage:
    'Êtes-vous sûr de vouloir démarrer {vms, plural, one {la} other {les}} {vms} VM{vms, plural, one {} other {s}} ?',

  // Original text: "{nVms, number} vm{nVms, plural, one {} other {s}} are failed. Please see your logs to get more information"
  failedVmsErrorMessage:
    "{nVms, number} VM{nVms, plural, one {} other {s}} ont échoué. Veuillez consulter les journaux pour plus d'informations",

  // Original text: "Start failed"
  failedVmsErrorTitle: 'Echec du démarrage',

  // Original text: "Stop Host{nHosts, plural, one {} other {s}}"
  stopHostsModalTitle: "Arrêter {nHosts, plural, one {l'} other {les}} hôte{nHosts, plural, one {} other {s}}",

  // Original text: "Are you sure you want to stop {nHosts, number} Host{nHosts, plural, one {} other {s}}?"
  stopHostsModalMessage:
    "Êtes-vous sûr de vouloir arrêter {nHosts, plural, one {l'} other {les}} hôte{nHosts, plural, one {} other {s}} ?",

  // Original text: "Stop VM{vms, plural, one {} other {s}}"
  stopVmsModalTitle: 'Éteindre {vms, plural, one {cette} other {ces}} VM{vms, plural, one {} other {s}}',

  // Original text: "Are you sure you want to stop {vms, number} VM{vms, plural, one {} other {s}}?"
  stopVmsModalMessage:
    'Êtes-vous sûr de vouloir éteindre {vms, plural, one {cette} other {ces}} {vms} VM{vms, plural, one {} other {s}} ?',

  // Original text: "Restart VM"
  restartVmModalTitle: 'Redémarrer la VM',

  // Original text: "Are you sure you want to restart {name}?"
  restartVmModalMessage: 'Êtes-vous sûr de vouloir redémarrer {name}?',

  // Original text: "Stop VM"
  stopVmModalTitle: 'Arrêter la VM',

  // Original text: "Are you sure you want to stop {name}?"
  stopVmModalMessage: 'Êtes-vous sûr de vouloir arrêter {name}?',

  // Original text: "Restart VM{vms, plural, one {} other {s}}"
  restartVmsModalTitle: 'Redémarrer {vms, plural, one {la} other {les}} VM{vms, plural, one {} other {s}}',

  // Original text: "Are you sure you want to restart {vms, number} VM{vms, plural, one {} other {s}}?"
  restartVmsModalMessage:
    'Êtes-vous sûr de vouloir redémarrer {vms, plural, one {la} other {les}} VM{vms, plural, one {} other {s}} {vms} ?',

  // Original text: "Snapshot VM{vms, plural, one {} other {s}}"
  snapshotVmsModalTitle: 'Faire un instantané {vms, plural, one {de la} other {des}} VM{vms, plural, one {} other {s}}',

  // Original text: "Are you sure you want to snapshot {vms, number} VM{vms, plural, one {} other {s}}?"
  snapshotVmsModalMessage:
    'Êtes-vous sûr de vouloir faire un instantané {vms, plural, one {de la VM} other {des {vms} VMs}} ?',

  // Original text: "Delete VM{vms, plural, one {} other {s}}"
  deleteVmsModalTitle: 'Supprimer {vms, plural, one {la} other {les}} VM{vms, plural, one {} other {s}}',

  // Original text: "Are you sure you want to delete {vms, number} VM{vms, plural, one {} other {s}}? ALL VM DISKS WILL BE REMOVED"
  deleteVmsModalMessage:
    'Êtes-vous sûr de vouloir supprimer {vms, plural, one {la VM} other {les {vms} VMs}} ? TOUS LES DISQUES ASSOCIÉS SERONT SUPPRIMÉS',

  // Original text: "Delete VM"
  deleteVmModalTitle: 'Supprimer la VM',

  // Original text: "Are you sure you want to delete this VM? ALL VM DISKS WILL BE REMOVED"
  deleteVmModalMessage:
    'Êtes-vous sûr de vouloir supprimer cette VM ? TOUS LES DISQUES DE LA VM SERONT SUPPRIMÉS DEFINITIVEMENT',

  // Original text: "Migrate VM"
  migrateVmModalTitle: 'Migrer la VM',

  // Original text: "Select a destination host:"
  migrateVmSelectHost: 'Sélectionner un hôte de destination :',

  // Original text: "Select a migration network:"
  migrateVmSelectMigrationNetwork: 'Choisir un réseau de migration :',

  // Original text: "For each VIF, select a network:"
  migrateVmSelectNetworks: 'Pour chaque VIF, choisir un réseau :',

  // Original text: "Select a destination SR:"
  migrateVmsSelectSr: 'Sélectionner un SR de destination :',

  // Original text: "Select a destination SR for local disks:"
  migrateVmsSelectSrIntraPool: 'Choisir un SR de destination pour les disques locaux :',

  // Original text: "Select a network on which to connect each VIF:"
  migrateVmsSelectNetwork: 'Choisir un réseau pour chaque VIF :',

  // Original text: "Smart mapping"
  migrateVmsSmartMapping: 'Réaffectation intelligente',

  // Original text: "VIF"
  migrateVmVif: 'VIF',

  // Original text: "Network"
  migrateVmNetwork: 'Réseaux',

  // Original text: "No target host"
  migrateVmNoTargetHost: "Pas d'hôte cible",

  // Original text: "A target host is required to migrate a VM"
  migrateVmNoTargetHostMessage: 'Un hôte cible est nécessaire pour migrer une VM',

  // Original text: "No default SR"
  migrateVmNoDefaultSrError: 'Pas de SR par défaut',

  // Original text: "Default SR not connected to host"
  migrateVmNotConnectedDefaultSrError: "Le SR par défaut n'est pas connecté à l'hôte",

  // Original text: "For each VDI, select an SR:"
  chooseSrForEachVdisModalSelectSr: 'Pour chaque VDI, sélectionner un SR (optionnel)',

  // Original text: "Select main SR…"
  chooseSrForEachVdisModalMainSr: 'Sélectionner le SR principal…',

  // Original text: "VDI"
  chooseSrForEachVdisModalVdiLabel: 'VDI',

  // Original text: "SR*"
  chooseSrForEachVdisModalSrLabel: 'SR*',

  // Original text: "* optional"
  optionalEntry: '* optionnel',

  // Original text: "Delete VDI"
  deleteVdiModalTitle: 'Supprimer le VDI',

  // Original text: "Are you sure you want to delete this disk? ALL DATA ON THIS DISK WILL BE LOST"
  deleteVdiModalMessage:
    'Êtes-vous sûr de vouloir supprimer ce disque ? TOUTES LES DONNÉES CONTENUES SERONT PERDUES IRRÉMÉDIABLEMENT',

  // Original text: "Revert your VM"
  revertVmModalTitle: 'Restaurer la VM',

  // Original text: "Delete snapshot"
  deleteSnapshotModalTitle: "Supprimer l'instantané",

  // Original text: "Are you sure you want to delete this snapshot?"
  deleteSnapshotModalMessage: 'Êtes-vous sûr de vouloir supprimer cet instantané ?',

  // Original text: "Are you sure you want to revert this VM to the snapshot state? This operation is irreversible."
  revertVmModalMessage:
    "Êtes-vous sûr de vouloir restaurer cette VM à l'état de cet instantané ? Cette opération est irrévocable.",

  // Original text: "Snapshot before"
  revertVmModalSnapshotBefore: 'Faire un instantané avant',

  // Original text: "Import a {name} Backup"
  importBackupModalTitle: 'Importer une sauvegarde de {name}',

  // Original text: "Start VM after restore"
  importBackupModalStart: 'Démarrer la VM après la restauration',

  // Original text: "Select your backup…"
  importBackupModalSelectBackup: 'Sélectionnez votre sauvegarde…',

  // Original text: "Are you sure you want to remove all orphaned snapshot VDIs?"
  removeAllOrphanedModalWarning: 'Êtes-vous sûr de vouloir supprimer tous les instantanés de VDIs orphelins ?',

  // Original text: "Remove all logs"
  removeAllLogsModalTitle: 'Supprimer tous les journaux',

  // Original text: "Are you sure you want to remove all logs?"
  removeAllLogsModalWarning: 'Êtes-vous sûr de vouloir supprimer tous les journaux ?',

  // Original text: "This operation is definitive."
  definitiveMessageModal: 'Cette action est irréversible.',

  // Original text: "Previous SR Usage"
  existingSrModalTitle: 'Emplacement utilisé',

  // Original text: "This path has been previously used as a Storage by a XenServer host. All data will be lost if you choose to continue the SR creation."
  existingSrModalText:
    'Cet emplacement avait été utilisé auparavant comme un Stockage par un hôte XenServer. Toutes les données présentes seront perdues si vous décidez de continuer la création du SR.',

  // Original text: "Previous LUN Usage"
  existingLunModalTitle: 'LUN utilisé',

  // Original text: "This LUN has been previously used as a Storage by a XenServer host. All data will be lost if you choose to continue the SR creation."
  existingLunModalText:
    'Ce LUN avait été utilisé auparavant comme un Stockage par un hôte XenServer. Toutes les données présentes seront perdues si vous décidez de continuer la création du SR.',

  // Original text: "Replace current registration?"
  alreadyRegisteredModal: "Remplacer l'enregistrement actuel ?",

  // Original text: "Your XO appliance is already registered to {email}, do you want to forget and replace this registration ?"
  alreadyRegisteredModalText:
    'Votre instance XOA est déjà enregistrée pour {email}, voulez-vous remplacer cet enregistrement ?',

  // Original text: "Ready for trial?"
  trialReadyModal: "Prêt pour l'essai ?",

  // Original text: "During the trial period, XOA need to have a working internet connection. This limitation does not apply for our paid plans!"
  trialReadyModalText:
    "Durant la période de démonstration, XOA nécessite une connexion internet fonctionnelle. Cette limitation disparaît avec la souscription d'une de nos formules.",

  // Original text: "Label"
  serverLabel: 'Nom',

  // Original text: "Host"
  serverHost: 'Hôte',

  // Original text: "Username"
  serverUsername: "Nom d'utilisateur",

  // Original text: "Password"
  serverPassword: 'Mot de passe',

  // Original text: "Action"
  serverAction: 'Action',

  // Original text: "Read Only"
  serverReadOnly: 'Lecture seule',

  // Original text: "Unauthorized Certificates"
  serverUnauthorizedCertificates: 'Certificats non approuvés',

  // Original text: "Allow Unauthorized Certificates"
  serverAllowUnauthorizedCertificates: 'Autoriser les certificats non approuvés',

  // Original text: "Enable it if your certificate is rejected, but it's not recommended because your connection will not be secured."
  serverUnauthorizedCertificatesInfo:
    "Activez ceci si votre certificat est rejeté, mais ce n'est pas recommandé car votre connexion ne sera pas sécurisée.",

  // Original text: "username"
  serverPlaceHolderUser: "nom d'utilisateur",

  // Original text: "password"
  serverPlaceHolderPassword: 'mot de passe',

  // Original text: "address[:port]"
  serverPlaceHolderAddress: 'adresse[:port]',

  // Original text: "label"
  serverPlaceHolderLabel: 'nom',

  // Original text: "Connect"
  serverConnect: 'Connecter',

  // Original text: "Error"
  serverError: 'Erreur',

  // Original text: "Adding server failed"
  serverAddFailed: "Echec de l'ajout du serveur",

  // Original text: "Status"
  serverStatus: 'Statut',

  // Original text: "Connection failed. Click for more information."
  serverConnectionFailed: "Echec de connexion. Cliquer pour plus d'informations.",

  // Original text: "Connecting…"
  serverConnecting: 'Connexion…',

  // Original text: "Authentication error"
  serverAuthFailed: "Erreur d'authentification",

  // Original text: "Unknown error"
  serverUnknownError: 'Erreur inconnue',

  // Original text: "Invalid self-signed certificate"
  serverSelfSignedCertError: 'Certificat auto-signé rejeté',

  // Original text: "Do you want to accept self-signed certificate for this server even though it would decrease security?"
  serverSelfSignedCertQuestion:
    'Voulez-vous accepter un certificat auto-signé pour ce serveur même si cela réduit la sécurité ?',

  // Original text: "Copy VM"
  copyVm: 'Copier la VM',

  // Original text: "Are you sure you want to copy this VM to {SR}?"
  copyVmConfirm: 'Êtes-vous sûr de vouloir copier cette VM vers {SR}?',

  // Original text: "Name"
  copyVmName: 'Nom',

  // Original text: "Name pattern"
  copyVmNamePattern: 'Motif de nom',

  // Original text: "If empty: name of the copied VM"
  copyVmNamePlaceholder: 'Si vide : nom de la VM',

  // Original text: "e.g.: \"\\{name\\}_COPY\""
  copyVmNamePatternPlaceholder: 'ex. : "\\{name\\}_COPY"',

  // Original text: "Select SR"
  copyVmSelectSr: 'Sélectionner le SR',

  // Original text: "Use compression"
  copyVmCompress: 'Utiliser la compression',

  // Original text: "No target SR"
  copyVmsNoTargetSr: 'Pas de SR cible',

  // Original text: "A target SR is required to copy a VM"
  copyVmsNoTargetSrMessage: 'Un SR cible est nécessaire pour copier une VM',

  // Original text: "Detach host"
  detachHostModalTitle: "Détacher l'hôte",

  // Original text: "Are you sure you want to detach {host} from its pool? THIS WILL REMOVE ALL VMs ON ITS LOCAL STORAGE AND REBOOT THE HOST."
  detachHostModalMessage:
    "Êtes-vous sûr de vouloir détacher {host} de son pool? CELA SUPPRIMERA TOUTES LES VMs DE SON STOCKAGE LOCAL ET REDÉMARRERA L'HÔTE.",

  // Original text: "Detach"
  detachHost: 'Détacher',

  // Original text: "Forget host"
  forgetHostModalTitle: "Oublier l'hôte",

  // Original text: "Are you sure you want to forget {host} from its pool? Be sure this host can't be back online, or use detach instead."
  forgetHostModalMessage:
    'Êtes-vous sûr de vouloir oublier {host} de son pool ? Soyez certain que cet hôte ne peut pas être de retour en ligne ou utilisez "Détacher" à la place.',

  // Original text: "Forget"
  forgetHost: 'Oublier',

  // Original text: "Create network"
  newNetworkCreate: 'Créer un réseau',

  // Original text: "Create bonded network"
  newBondedNetworkCreate: 'Créer un réseau agrégé',

  // Original text: "Interface"
  newNetworkInterface: 'Interface',

  // Original text: "Name"
  newNetworkName: 'Nom',

  // Original text: "Description"
  newNetworkDescription: 'Description',

  // Original text: "VLAN"
  newNetworkVlan: 'VLAN',

  // Original text: "No VLAN if empty"
  newNetworkDefaultVlan: 'Si vide, pas de VLAN',

  // Original text: "MTU"
  newNetworkMtu: 'MTU',

  // Original text: "Default: 1500"
  newNetworkDefaultMtu: 'Défaut : 1500',

  // Original text: "Name required"
  newNetworkNoNameErrorTitle: 'Un nom est nécessaire',

  // Original text: "A name is required to create a network"
  newNetworkNoNameErrorMessage: 'Un nom est nécessaire pour créer un réseau',

  // Original text: "Bond mode"
  newNetworkBondMode: 'Mode agrégé',

  // Original text: "Delete network"
  deleteNetwork: 'Supprimer le réseau',

  // Original text: "Are you sure you want to delete this network?"
  deleteNetworkConfirm: 'Êtes-vous sûr de vouloir supprimer ce réseau ?',

  // Original text: "This network is currently in use"
  networkInUse: "Ce réseau est en cours d'utilisation",

  // Original text: "Bonded"
  pillBonded: 'Agrégé',

  // Original text: "Host"
  addHostSelectHost: 'Hôte',

  // Original text: "No host"
  addHostNoHost: "Pas d'hôte",

  // Original text: "No host selected to be added"
  addHostNoHostMessage: 'Aucun hôte sélectionné pour ajout',

  // Original text: "Xen Orchestra"
  xenOrchestra: 'Xen Orchestra',

  // Original text: "Xen Orchestra server"
  xenOrchestraServer: 'Serveur Xen Orchestra',

  // Original text: "Xen Orchestra web client"
  xenOrchestraWeb: 'Client web Xen Orchestra',

  // Original text: "No pro support provided!"
  noProSupport: 'Pas de support professionel fourni !',

  // Original text: "Use in production at your own risks"
  noProductionUse: 'Utilisez en production à vos risques et périls',

  // Original text: "You can download our turnkey appliance at {website}"
  downloadXoaFromWebsite: 'Téléchargez notre édition clef en main sur {website}',

  // Original text: "Bug Tracker"
  bugTracker: 'Gestionnaire de tickets',

  // Original text: "Issues? Report it!"
  bugTrackerText: 'Un souci ? Dites-le nous !',

  // Original text: "Community"
  community: 'Communauté',

  // Original text: "Join our community forum!"
  communityText: 'Rejoignez notre communauté !',

  // Original text: "Free Trial for Premium Edition!"
  freeTrial: "Démonstration gratuite de l'Édition Premium !",

  // Original text: "Request your trial now!"
  freeTrialNow: 'Demandez une démonstration dès maintenant !',

  // Original text: "Any issue?"
  issues: 'Des soucis ?',

  // Original text: "Problem? Contact us!"
  issuesText: 'Un problème ? Contactez-nous !',

  // Original text: "Documentation"
  documentation: 'Documentation',

  // Original text: "Read our official doc"
  documentationText: 'Consultez notre documentation officielle',

  // Original text: "Pro support included"
  proSupportIncluded: 'Support professionel inclus',

  // Original text: "Access your XO Account"
  xoAccount: 'Accéder à votre compte XO',

  // Original text: "Report a problem"
  openTicket: 'Signaler un problème',

  // Original text: "Problem? Open a ticket!"
  openTicketText: 'Un problème ? Ouvrez un ticket !',

  // Original text: "Upgrade needed"
  upgradeNeeded: 'Mise à jour nécessaire',

  // Original text: "Upgrade now!"
  upgradeNow: 'Mettre à jour maintenant !',

  // Original text: "Or"
  or: 'Ou',

  // Original text: "Try it for free!"
  tryIt: 'Essayez gratuitement !',

  // Original text: "This feature is available starting from {plan} Edition"
  availableIn: "Cette fonctionnalité est disponible à partir de l'édition {plan}",

  // Original text: "This feature is not available in your version, contact your administrator to know more."
  notAvailable:
    "Cette fonctionnalité n'est pas disponible dans cette édtition. Pour plus d'informations, contactez votre administrateur.",

  // Original text: "Updates"
  updateTitle: 'Mise à jour',

  // Original text: "Registration"
  registration: 'Enregistrement',

  // Original text: "Trial"
  trial: 'Démonstration',

  // Original text: "Settings"
  settings: 'Paramètres',

  // Original text: "Proxy settings"
  proxySettings: 'Configuration du proxy',

  // Original text: "Host (myproxy.example.org)"
  proxySettingsHostPlaceHolder: 'Hôte (monproxy.exemple.tld)',

  // Original text: "Port (eg: 3128)"
  proxySettingsPortPlaceHolder: 'Port (ex : 3128)',

  // Original text: "Username"
  proxySettingsUsernamePlaceHolder: "Nom d'utilisateur",

  // Original text: "Password"
  proxySettingsPasswordPlaceHolder: 'Mot de passe',

  // Original text: "Your email account"
  updateRegistrationEmailPlaceHolder: 'Email du compte',

  // Original text: "Your password"
  updateRegistrationPasswordPlaceHolder: 'Mot de passe',

  // Original text: "Update"
  update: 'Actualiser',

  // Original text: "Refresh"
  refresh: 'Rafraîchir',

  // Original text: "Upgrade"
  upgrade: 'Mettre à jour',

  // Original text: "No updater available for Community Edition"
  noUpdaterCommunity: 'Pas de mise à jour sur la version Communautaire',

  // Original text: "Please consider subscribe and try it with all features for free during 15 days on {link}."
  considerSubscribe: 'Envisagez de souscrire, et essayez toutes les fonctionnalités gratuitement pendant 15 jours.',

  // Original text: "Manual update could break your current installation due to dependencies issues, do it with caution"
  noUpdaterWarning:
    'Une mise à jour manuelle pourrait corrompre votre installation actuelle à cause des dépendances, soyez prudent.',

  // Original text: "Current version:"
  currentVersion: 'Version actuelle :',

  // Original text: "Register"
  register: "S'enregistrer",

  // Original text: "Edit registration"
  editRegistration: "Éditer l'enregistrement",

  // Original text: "Please, take time to register in order to enjoy your trial."
  trialRegistration: 'Merci de prendre le temps de vous enregistrer afin de profiter de votre essai.',

  // Original text: "Start trial"
  trialStartButton: "Commencer la période d'essai",

  // Original text: "You can use a trial version until {date, date, medium}. Upgrade your appliance to get it."
  trialAvailableUntil:
    "Vous pouvez utiliser une version d'essai jusqu'au {date, date, medium}. Mettez à jour votre XOA pour en profiter.",

  // Original text: "Your trial has been ended. Contact us or downgrade to Free version"
  trialConsumed: "Votre période d'essai est terminé. Contactez-nous, ou régressez sur l'édition gratuite.",

  // Original text: "Your xoa-updater service appears to be down. Your XOA cannot run fully without reaching this service."
  trialLocked:
    'Votre service xoa-update semble inaccessible. Votre XOA ne peut pas fonctionner pleinement si elle ne peut pas joindre ce service.',

  // Original text: "No update information available"
  noUpdateInfo: "Pas d'informations de mises à jour disponible",

  // Original text: "Update information may be available"
  waitingUpdateInfo: 'Des informations de mises à jour sont peut-être disponibles',

  // Original text: "Your XOA is up-to-date"
  upToDate: 'Votre XOA est à jour',

  // Original text: "You need to update your XOA (new version is available)"
  mustUpgrade: 'Vous devez mettre à jour votre XOA (une nouvelle version est disponible)',

  // Original text: "Your XOA is not registered for updates"
  registerNeeded: "Votre XOA n'est pas enregistrée pour les mises à jour",

  // Original text: "Can't fetch update information"
  updaterError: 'Impossible de récupérer les informations de mise à jour.',

  // Original text: "Upgrade successful"
  promptUpgradeReloadTitle: 'Mise à jour réussie',

  // Original text: "Your XOA has successfully upgraded, and your browser must reload the application. Do you want to reload now ?"
  promptUpgradeReloadMessage:
    "Votre XOA à été mise à jour avec brio, et votre navigateur doit rafraîchir l'application pour en profiter. Voulez-vous rafraîchir dès maintenant ?",

  // Original text: "Xen Orchestra from the sources"
  disclaimerTitle: 'Xen Orchestra depuis les sources',

  // Original text: "You are using XO from the sources! That's great for a personal/non-profit usage."
  disclaimerText1: "Vous utilisez XO depuis les sources. C'est parfait pour un usage personnel ou non lucratif.",

  // Original text: "If you are a company, it's better to use it with our appliance + pro support included:"
  disclaimerText2:
    "Si vous êtes une entrerprise, il est préférable d'utiliser notre applicance qui inclut du support professionel.",

  // Original text: "This version is not bundled with any support nor updates. Use it with caution for critical tasks."
  disclaimerText3: "Cette version n'est fournie avec aucun support ni aucune mise à jour. Utilisez-la avec précaution.",

  // Original text: "Connect PIF"
  connectPif: 'Connecter la PIF',

  // Original text: "Are you sure you want to connect this PIF?"
  connectPifConfirm: 'Êtes-vous sûr de vouloir connecter cette PIF ?',

  // Original text: "Disconnect PIF"
  disconnectPif: 'Déconnecter la PIF',

  // Original text: "Are you sure you want to disconnect this PIF?"
  disconnectPifConfirm: 'Êtes-vous sûr de vouloir déconnecter cette PIF ?',

  // Original text: "Delete PIF"
  deletePif: 'Supprimer la PIF',

  // Original text: "Are you sure you want to delete this PIF?"
  deletePifConfirm: 'Êtes-vous sûr de vouloir supprimer cette PIF ?',

  // Original text: "Connected"
  pifConnected: 'Connecté',

  // Original text: "Disconnected"
  pifDisconnected: 'Déconnecté',

  // Original text: "Physically connected"
  pifPhysicallyConnected: 'Connecté physiquement',

  // Original text: "Physically disconnected"
  pifPhysicallyDisconnected: 'Déconnecté physiquement',

  // Original text: "Username"
  username: "Nom d'utilisateur",

  // Original text: "Password"
  password: 'Mot de passe',

  // Original text: "Language"
  language: 'Langue',

  // Original text: "Old password"
  oldPasswordPlaceholder: 'Ancien mot de passe',

  // Original text: "New password"
  newPasswordPlaceholder: 'Nouveau mot de passe',

  // Original text: "Confirm new password"
  confirmPasswordPlaceholder: 'Confirmer le nouveau mot de passe',

  // Original text: "Confirmation password incorrect"
  confirmationPasswordError: 'Confirmation du nouveau mot de passe invalide',

  // Original text: "Password does not match the confirm password."
  confirmationPasswordErrorBody: 'Le mot de passe ne correspond pas à la confirmation du mot de passe.',

  // Original text: "Password changed"
  pwdChangeSuccess: 'Mot de passe modifié',

  // Original text: "Your password has been successfully changed."
  pwdChangeSuccessBody: 'Votre mot de passe a été modifié avec succés.',

  // Original text: "Incorrect password"
  pwdChangeError: 'Mot de passe invalide',

  // Original text: "The old password provided is incorrect. Your password has not been changed."
  pwdChangeErrorBody: "L'ancien mot de passe n'est pas valide. Votre mot de passe n'a pas été changé.",

  // Original text: "OK"
  changePasswordOk: 'OK',

  // Original text: "SSH keys"
  sshKeys: 'Clefs SSH',

  // Original text: "New SSH key"
  newSshKey: 'Nouvelle clef SSH',

  // Original text: "Delete"
  deleteSshKey: 'Supprimer',

  // Original text: "No SSH keys"
  noSshKeys: 'Pas de clef SSH',

  // Original text: "New SSH key"
  newSshKeyModalTitle: 'Nouvelle clef SSH',

  // Original text: "Invalid key"
  sshKeyErrorTitle: 'Clef invalide',

  // Original text: "An SSH key requires both a title and a key."
  sshKeyErrorMessage: 'Une clef SSH nécessite un titre et une clef',

  // Original text: "Title"
  title: 'Titre',

  // Original text: "Key"
  key: 'Clef',

  // Original text: "Delete SSH key"
  deleteSshKeyConfirm: 'Supprimer la clef SSH',

  // Original text: "Are you sure you want to delete the SSH key {title}?"
  deleteSshKeyConfirmMessage: 'Êtes-vous sûr de vouloir supprimer la clef SSH {title}?',

  // Original text: "Others"
  others: 'Autres',

  // Original text: "Loading logs…"
  loadingLogs: 'Chargement des journaux…',

  // Original text: "User"
  logUser: 'Utilisateur',

  // Original text: "Method"
  logMethod: 'Méthode',

  // Original text: "Params"
  logParams: 'Paramètres',

  // Original text: "Message"
  logMessage: 'Message',

  // Original text: "Error"
  logError: 'Erreur',

  // Original text: "Display details"
  logDisplayDetails: 'Afficher les détails',

  // Original text: "Date"
  logTime: 'Date',

  // Original text: "No stack trace"
  logNoStackTrace: 'No stack trace',

  // Original text: "No params"
  logNoParams: 'No params',

  // Original text: "Delete log"
  logDelete: 'Supprimer le log',

  // Original text: "Delete all logs"
  logDeleteAll: 'Supprimer tous les journaux',

  // Original text: "Delete all logs"
  logDeleteAllTitle: 'Supprimer tous les journaux',

  // Original text: "Are you sure you want to delete all the logs?"
  logDeleteAllMessage: 'Êtes-vous sûr de vouloir supprimer tous les journaux ?',

  // Original text: "Click to enable"
  logIndicationToEnable: 'Cliquer pour activer',

  // Original text: "Click to disable"
  logIndicationToDisable: 'Cliquer pour désactiver',

  // Original text: "Report a bug"
  reportBug: 'Rapporter un bug',

  // Original text: "Name"
  ipPoolName: 'Nom',

  // Original text: "IPs"
  ipPoolIps: 'IPs',

  // Original text: "IPs (e.g.: 1.0.0.12-1.0.0.17;1.0.0.23)"
  ipPoolIpsPlaceholder: 'IPs (e.g.: 1.0.0.12-1.0.0.17;1.0.0.23)',

  // Original text: "Networks"
  ipPoolNetworks: 'Réseaux',

  // Original text: "No IP pools"
  ipsNoIpPool: "Pas de plages d'IPs",

  // Original text: "Create"
  ipsCreate: 'Créer',

  // Original text: "Delete all IP pools"
  ipsDeleteAllTitle: "Supprimer toutes les plages d'IPs",

  // Original text: "Are you sure you want to delete all the IP pools?"
  ipsDeleteAllMessage: "Êtes-vous sûr de vouloir supprimer toutes les plages d'IPs ?",

  // Original text: "VIFs"
  ipsVifs: 'VIFs',

  // Original text: "Not used"
  ipsNotUsed: 'Non utilisé',

  // Original text: "unknown VIF"
  ipPoolUnknownVif: 'VIF inconnue',

  // Original text: "Name already exists"
  ipPoolNameAlreadyExists: 'Ce nom existe déjà',

  // Original text: "Keyboard shortcuts"
  shortcutModalTitle: 'Raccourcis clavier',

  // Original text: "Global"
  shortcut_XoApp: 'Global',

  // Original text: "Go to hosts list"
  shortcut_GO_TO_HOSTS: 'Aller sur la liste des hôtes',

  // Original text: "Go to pools list"
  shortcut_GO_TO_POOLS: 'Aller sur la liste des pools',

  // Original text: "Go to VMs list"
  shortcut_GO_TO_VMS: 'Aller sur la liste des VMs',

  // Original text: "Go to SRs list"
  shortcut_GO_TO_SRS: 'Aller à la liste des SRs',

  // Original text: "Create a new VM"
  shortcut_CREATE_VM: 'Créer une nouvelle VM',

  // Original text: "Unfocus field"
  shortcut_UNFOCUS: 'Quitter le champ',

  // Original text: "Show shortcuts key bindings"
  shortcut_HELP: 'Afficher les raccourcis clavier',

  // Original text: "Home"
  shortcut_Home: 'Accueil',

  // Original text: "Focus search bar"
  shortcut_SEARCH: 'Curseur dans la barre de recherche',

  // Original text: "Next item"
  shortcut_NAV_DOWN: 'Élément suivant',

  // Original text: "Previous item"
  shortcut_NAV_UP: 'Élément précédent',

  // Original text: "Select item"
  shortcut_SELECT: "Sélectionner l'élément",

  // Original text: "Open"
  shortcut_JUMP_INTO: 'Ouvrir',

  // Original text: "VM"
  settingsAclsButtonTooltipVM: 'VM',

  // Original text: "Hosts"
  settingsAclsButtonTooltiphost: 'Hôtes',

  // Original text: "Pool"
  settingsAclsButtonTooltippool: 'Pool',

  // Original text: "SR"
  settingsAclsButtonTooltipSR: 'SR',

  // Original text: "Network"
  settingsAclsButtonTooltipnetwork: 'Réseaux',

  // Original text: "No config file selected"
  noConfigFile: 'Pas de fichier de configuration sélectionné',

  // Original text: "Try dropping a config file here, or click to select a config file to upload."
  importTip:
    'Essayez de déposer un fichier de configuration ou cliquez pour sélectionner un fichier de configuration à importer.',

  // Original text: "Config"
  config: 'Configuration',

  // Original text: "Import"
  importConfig: 'Importer',

  // Original text: "Config file successfully imported"
  importConfigSuccess: 'Fichier de configuration importé avec succès',

  // Original text: "Error while importing config file"
  importConfigError: "Erreur lors de l'import du fichier de configuration",

  // Original text: "Export"
  exportConfig: 'Exporter',

  // Original text: "Download current config"
  downloadConfig: 'Télécharger la configuration actuelle',

  // Original text: "No config import available for Community Edition"
  noConfigImportCommunity: 'Import de configuration non disponible pour la Community Edition',

  // Original text: "Reconnect all hosts"
  srReconnectAllModalTitle: 'Reconnecter tous les hôtes',

  // Original text: "This will reconnect this SR to all its hosts."
  srReconnectAllModalMessage: 'Ceci reconnectera ce SR à tous ses hôtes',

  // Original text: "This will reconnect each selected SR to its host (local SR) or to every hosts of its pool (shared SR)."
  srsReconnectAllModalMessage:
    'Ceci reconnectera tous les SRs sélectionnés à son hôte (SR local) ou à tous les hôtes de son pool (SR partagé).',

  // Original text: "Disconnect all hosts"
  srDisconnectAllModalTitle: 'Déconnecter tous les hôtes',

  // Original text: "This will disconnect this SR from all its hosts."
  srDisconnectAllModalMessage: 'Ceci déconnectera ce SR de tous ses hôtes.',

  // Original text: "This will disconnect each selected SR from its host (local SR) or from every hosts of its pool (shared SR)."
  srsDisconnectAllModalMessage:
    'Ceci déconnectera tous les SRs sélectionnés de leur hôte (SR local) ou de tous les hôtes de leur pool (SR partagé).',

  // Original text: "Forget SR"
  srForgetModalTitle: 'Oublier le SR',

  // Original text: "Forget selected SRs"
  srsForgetModalTitle: 'Oublier les SRs sélectionnés',

  // Original text: "Are you sure you want to forget this SR? VDIs on this storage won't be removed."
  srForgetModalMessage: 'Êtes-vous sûr de vouloir oublier ce SR ? Les VDIs de ce stockage ne seront pas supprimés.',

  // Original text: "Are you sure you want to forget all the selected SRs? VDIs on these storages won't be removed."
  srsForgetModalMessage:
    'Êtes-vous sûr de vouloir oublier tous les SRs sélectionnés ? Les VDIs sur ces stockages ne seront pas supprimés.',

  // Original text: "Disconnected"
  srAllDisconnected: 'Déconnectés',

  // Original text: "Partially connected"
  srSomeConnected: 'Partiellement connectés',

  // Original text: "Connected"
  srAllConnected: 'Connectés',

  // Original text: "XOSAN"
  xosanTitle: 'XOSAN',

  // Original text: "Xen Orchestra SAN SR"
  xosanSrTitle: 'SR NAS Xen Orchestra',

  // Original text: "Select local SRs (lvm)"
  xosanAvailableSrsTitle: 'Sélectionner des SRs locaux (lvm)',

  // Original text: "Suggestions"
  xosanSuggestions: 'Suggestions',

  // Original text: "Name"
  xosanName: 'Nom',

  // Original text: "Host"
  xosanHost: 'Hôte',

  // Original text: "Hosts"
  xosanHosts: 'Hôtes',

  // Original text: "Volume ID"
  xosanVolumeId: 'ID du volume',

  // Original text: "Size"
  xosanSize: 'Taille',

  // Original text: "Used space"
  xosanUsedSpace: 'Espace utilisé',

  // Original text: "XOSAN pack needs to be installed on each host of the pool."
  xosanNeedPack: 'Le pack XOSAN doit être installé et à jour sur tous les hôtes du pool.',

  // Original text: "Install it now!"
  xosanInstallIt: 'Installer maintenant !',

  // Original text: "Some hosts need their toolstack to be restarted before you can create an XOSAN"
  xosanNeedRestart: 'Certains hôtes ont besoin que leur toolstack soit redémarrée avant de pouvoir créer un XOSAN',

  // Original text: "Restart toolstacks"
  xosanRestartAgents: 'Redémarrer les toolstacks',

  // Original text: "Pool master is not running"
  xosanMasterOffline: "Le master du pool n'est pas démarré",

  // Original text: "Install XOSAN pack on {pool}"
  xosanInstallPackTitle: 'Installer le pack XOSAN sur {pool}',

  // Original text: "Select at least 2 SRs"
  xosanSelect2Srs: 'Sélectionner au moins 2 SRs',

  // Original text: "Layout"
  xosanLayout: 'Disposition',

  // Original text: "Redundancy"
  xosanRedundancy: 'Redondance',

  // Original text: "Capacity"
  xosanCapacity: 'Capacité',

  // Original text: "Available space"
  xosanAvailableSpace: 'Espace disponible',

  // Original text: "* Can fail without data loss"
  xosanDiskLossLegend: '* Peut tomber en panne sans perte de données',

  // Original text: "Create"
  xosanCreate: 'Créer',

  // Original text: "Installing XOSAN. Please wait…"
  xosanInstalling: 'Installation de XOSAN. Veuillez patienter…',

  // Original text: "No XOSAN available for Community Edition"
  xosanCommunity: 'XOSAN non disponible pour la Community Edition',

  // Original text: "Install cloud plugin first"
  xosanInstallCloudPlugin: 'Installer le plugin XOA avant',

  // Original text: "Load cloud plugin first"
  xosanLoadCloudPlugin: 'Charger le plugin XOA avant',

  // Original text: "Loading…"
  xosanLoading: 'Chargement…',

  // Original text: "XOSAN is not available at the moment"
  xosanNotAvailable: "XOSAN n'est pas disponible pour le moment",

  // Original text: "Register for the XOSAN beta"
  xosanRegisterBeta: 'Inscrivez-vous pour la beta de XOSAN',

  // Original text: "You have successfully registered for the XOSAN beta. Please wait until your request has been approved."
  xosanSuccessfullyRegistered:
    'Vous êtes inscrit pour la beta de XOSAN. Veuillez attendre que votre demande soit approuvée.',

  // Original text: "Install XOSAN pack on these hosts:"
  xosanInstallPackOnHosts: 'Installer le pack XOSAN sur ces hôtes :',

  // Original text: "Install {pack} v{version}?"
  xosanInstallPack: 'Installer {pack} v{version} ?',

  // Original text: "No compatible XOSAN pack found for your XenServer versions."
  xosanNoPackFound: 'Pas de pack XOSAN compatible pour vos versions de XenServers.',

  // Original text: "At least one of these version requirements must be satisfied by all the hosts in this pool:"
  xosanPackRequirements:
    'Au moins une de ces condtions de version doit être satisfaite par tous les hôtes de ce pool :',
}
