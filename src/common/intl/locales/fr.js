// See http://momentjs.com/docs/#/use-it/browserify/
import 'moment/locale/fr'

import reactIntlData from 'react-intl/locale-data/fr'
import { addLocaleData } from 'react-intl'
addLocaleData(reactIntlData)

// ===================================================================

export default {
  editableLongClickPlaceholder: 'Clic long pour éditer',
  editableClickPlaceholder: 'Cliquer pour éditer',

  // ----- Modals -----
  alertOk: 'OK',
  confirmOk: 'OK',
  confirmCancel: 'Annuler',

  // ----- General Menu -----
  dashboardPage: 'Tableau de bord',
  overviewDashboardPage: 'Vue d\'ensemble',
  overviewVisualizationDashboardPage: 'Visualisations',
  overviewStatsDashboardPage: 'Statistiques',
  overviewHealthDashboardPage: 'État de santé',
  selfServicePage: 'Self service',
  selfServiceDashboardPage: 'Tableau de bord',
  settingsServersPage: 'Serveurs',
  settingsUsersPage: 'Utilisateurs',
  settingsGroupsPage: 'Groupes',
  settingsAclsPage: 'ACLs',
  settingsPluginsPage: 'Extensions',
  selfServiceAdminPage: 'Administration',
  backupPage: 'Sauvegarde',
  backupOverviewPage: 'Vue d\'ensemble',
  backupNewPage: 'Créer',
  backupRemotesPage: 'Emplacement',
  backupRestorePage: 'Restaurer',
  updatePage: 'Mises à jour',
  settingsPage: 'Paramètres',
  aboutPage: 'À propos',
  newMenu: 'Nouveau',
  newVmPage: 'VM',
  newServerPage: 'Serveur',
  newSrPage: 'Stockage',
  newImport: 'Importer',
  // ----- Home view -----
  homeDisplayedVms: '{displayed}x {vmIcon} (sur {total})',
  homeSelectedVms: '{selected}x {vmIcon} sélectionnée{selected, plural, zero {} one {} other {s}} (sur {total})',
  homeMigrateTo: 'Migrer sur…',
  // ----- General Stuff -----
  homePage: 'Accueil',
  usernameLabel: 'Nom :',
  passwordLabel: 'Mot de passe :',
  signInButton: 'Connexion',
  signOut: 'Déconnexion',
  add: 'Ajouter',
  remove: 'Supprimer',
  schedule: 'Plan',
  newVmBackup: 'Nouvelle sauvegarde de VM',
  editVmBackup: 'Edition d\'un job de backup',
  backup: 'Sauvegarde',
  rollingSnapshot: 'Sauvegarde continue',
  deltaBackup: 'Sauvegarde différentielle',
  disasterRecovery: 'Reprise après panne',
  continuousReplication: 'Réplication continue',
  preview: 'Aperçu',
  item: 'Objet',
  noSelectedValue: 'Pas de valeur sélectionnée',
  selectSubjects: 'Select. utilisateurs et/ou groupe(s)',
  selectHosts: 'Selectionner Hôte(s)…',
  selectNetworks: 'Selectionner Network(s)…',
  selectPifs: 'Sélectionner PIF(s)…',
  selectHostsVms: 'Selectionner objet(s)…',
  selectPools: 'Selectionner Pool(s)…',
  selectRemotes: 'Selectionner Remote(s)…',
  selectSrs: 'Selectionner Stockages(s)…',
  selectVms: 'Selectionner VM(s)…',
  selectVmTemplates: 'Selectionner patrons de VM…',
  selectTags: 'Selectionner tag(s)…',
  selectVdis: 'Selectionner disque(s)…',
  fillRequiredInformations: 'Remplir les champs requis.',
  fillOptionalInformations: 'Remplir informations (optionnel)',
  selectTableReset: 'Réinitialiser',
  schedulingMonth: 'Mois',
  schedulingEveryMonth: 'Tous les mois',
  schedulingEachSelectedMonth: 'Chaque mois sélectionné',
  schedulingMonthDay: 'Jour du mois',
  schedulingEveryMonthDay: 'Tous les jours',
  schedulingEachSelectedMonthDay: 'Chaque jour sélectionné',
  schedulingWeekDay: 'Jour de la semaine',
  schedulingEveryWeekDay: 'Tous les jours',
  schedulingEachSelectedWeekDay: 'Chaque jour sélectionné',
  schedulingHour: 'Heure',
  schedulingEveryHour: 'Toutes les heures',
  schedulingEveryNHour: 'Toutes les N heures',
  schedulingEachSelectedHour: 'Chaque heure sélectionnée',
  schedulingMinute: 'Minute',
  schedulingEveryMinute: 'Toutes les minutes',
  schedulingEveryNMinute: 'Toutes les N minutes',
  schedulingEachSelectedMinute: 'Chaque minute sélectionnée',
  schedulingReset: 'Reset',
  unknownSchedule: 'Inconnu',
  job: 'Job',
  jobTag: 'Tag',
  jobScheduling: 'Plan d\'exécution',
  jobState: 'Etat',
  runJob: 'Execution d\'un job',
  runJobVerbose: 'Une exécution a été lancée. Voir l\'overview pour plus de détails.',
  jobStarted: 'Démarré',
  jobFinished: 'Terminé',
  saveBackupJob: 'Sauvegarder',
  deleteJob: 'Supprimer Job',
  deleteJobQuestion: 'Etes-vous sûr de vouloir supprimer ce job ?',
  noScheduledJobs: 'Aucun job programmé.',
  newBackupSelection: 'Sélectionner votre type de sauvegarde :',
  autoloadPlugin: 'Charger au démarrage du serveur',
  savePluginConfiguration: 'Sauvegarder config.',
  deletePluginConfiguration: 'Supprimer config.',
  pluginError: 'Erreur plugin',
  unknownPluginError: 'Erreur inconnue',
  purgePluginConfiguration: 'Suppression de la config. du plugin',
  purgePluginConfigurationQuestion: 'Etes-vous sûr de vouloir supprimer la configuration de ce plugin ?',
  editPluginConfiguration: 'Editer',
  cancelPluginEdition: 'Annuler',
  pluginConfigurationSuccess: 'Configuration du plugin',
  pluginConfigurationChanges: 'La configuration du plugin a été sauvegardée !',
  startVmLabel: 'Démarrer',
  recoveryModeLabel: 'Démarrer en mode sans échec',
  suspendVmLabel: 'Suspendre',
  stopVmLabel: 'Arrêter',
  forceShutdownVmLabel: 'Forcer l\'arrêt',
  rebootVmLabel: 'Redémarrer',
  forceRebootVmLabel: 'Forcer le redémarrage',
  deleteVmLabel: 'Supprimer',
  migrateVmLabel: 'Migrer',
  snapshotVmLabel: 'Prendre un instantané',
  exportVmLabel: 'Exporter',
  copyVmLabel: 'Copier',
  cloneVmLabel: 'Cloner',
  convertToTemplateLabel: 'Convertir en modèle',
  // ----- host tab names -----
  storageTabName: 'Stockage',
  patchesTabName: 'Patches',
  // ----- host advanced tab -----
  hardwareHostSettingsLabel: 'Matériel',
  hostAddress: 'Adresse',
  hostStatus: 'Statut',
  hostBuildNumber: 'Numéro de build',
  hostIscsiName: 'Nom iSCSI',
  hostXenServerVersion: 'Version',
  hostStatusEnabled: 'Activé',
  hostStatusDisabled: 'Désactivé',
  hostPowerOnMode: 'Mode d\'allumage',
  powerOnDisabled: 'Désactivé',
  hostStartedSince: 'Système',
  hostStackStartedSince: 'XAPI',
  hostCpusModel: 'Modèle de processeur',
  hostCpusNumber: 'Cœur (socket)',
  hostManufacturerinfo: 'Informations constructeur',
  hostBiosinfo: 'Informations BIOS',
  licenseHostSettingsLabel: 'Licence',
  hostLicenseType: 'Type de licence',
  hostLicenseSocket: 'Nombre de socket',
  hostLicenseExpiry: 'Expiration',
  // ----- VM stat tab -----
  statLoad: 'Charge système',
  // ----- VM tab names -----
  vmConsoleLabel: 'Console',
  generalTabName: 'Général',
  statsTabName: 'Stats',
  consoleTabName: 'Console',
  snapshotsTabName: 'Instantanés',
  logsTabName: 'Journaux',
  advancedTabName: 'Avancé',
  networkTabName: 'Réseau',
  disksTabName: 'Disque{disks, plural, zero {} one {} other {s}}',
  powerStateHalted: 'arrêtée',
  powerStateRunning: 'en marche',
  started: 'Démarrée {ago}',
  noToolsDetected: 'Pas d\'outils Xen détectés',
  noIpv4Record: 'Aucune IPv4',
  noIpRecord: 'Aucune IP',
  virtualizationMode: 'Mode de virtualisation',
  // ----- VM stat tab -----
  statsCpu: 'Utilisation processeur',
  statsMemory: 'Utilisation mémoire',
  statsNetwork: 'Débit réseau',
  statDisk: 'Débit disque',
  statLastTenMinutes: 'Il y a 10 minutes',
  statLastTwoHours: 'Il y a 2 heures',
  statLastWeek: 'La semaine dernière',
  statLastYear: 'L\'année dernière',
  // ----- VM console tab -----
  copyToClipboardLabel: 'Copier',
  ctrlAltDelButtonLabel: 'Ctrl+Alt+Suppr',
  tipLabel: 'Conseil :',
  tipConsoleLabel: 'Les agencements de clavier hors États-Unis ont des problèmes avec la console: passez le votre en "US".',
  // ----- VM disk tab -----
  vdiAttachDeviceButton: 'Brancher un disque',
  vbdCreateDeviceButton: 'Nouveau disque',
  vdiBootOrder: 'Ordre de démarrage',
  vdiNameLabel: 'Nom',
  vdiNameDescription: 'Déscription',
  vdiTags: 'Tags',
  vdiSize: 'Taille',
  vdiSr: 'Stockage',
  vdbBootableStatus: 'Démarrable ?',
  vdbBootable: 'Démarrable',
  vdbNotBootable: 'Non démarrable',
  vdbStatus: 'Statut',
  vbdStatusConnected: 'Connecté',
  vbdStatusDisconnected: 'Déconnecté',
  vbdNoVbd: 'Pas de disque',
  // ----- VM network tab -----
  vifCreateDeviceButton: 'Nouvelle interface',
  vifNoInterface: 'Aucune interface',
  vifDeviceLabel: 'Interface',
  vifMacLabel: 'Adresse physique',
  vifMtuLabel: 'MTU',
  vifNetworkLabel: 'Réseau',
  vifStatusLabel: 'Statut',
  vifStatusConnected: 'Connecté',
  vifStatusDisconnected: 'Déconnecté',
  // ----- VM snapshot tab -----
  noSnapshot: 'Aucun instantané',
  snapshotCreateButton: 'Nouvel instantané',
  tipCreateSnapshotLabel: 'Cliquez sur le bouton pour en créer un !',
  snapshotDate: 'Date de l\'instantané',
  snapshotName: 'Nom',
  snapshotAction: 'Action',
  // ----- VM log tab -----
  logRemoveAll: 'Supprimer tous les journaux',
  noLogs: 'Aucun journal pour l\'instant',
  logDate: 'Date du journal',
  logName: 'Nom',
  logContent: 'Contenu',
  logAction: 'Action',
  // ----- VM advanced tab -----
  uuid: 'Identifiant unique',
  miscLabel: 'Divers',
  xenSettingsLabel: 'Paramètres Xen',
  guestOsLabel: 'Système d\'exploitatation',
  paraVirtualizedMode: 'Paravirtualisation (PV)',
  hardwareVirtualizedMode: 'Virtualisation matérielle (HVM)',
  xenToolsStatus: 'État des outils Xen',
  xenToolsStatusValue: `{status, select,
    unknown {Inconnu}
    up-to-date {À jour}
    out-of-date {Obsolètes}
    not-installed {Pas installés}
  }`,
  osName: 'Nom du système d\'exploitation',
  cpuWeightLabel: 'Poids CPU',
  defaultCpuWeight: 'Par défaut',
  osKernel: 'Noyau du système d\'exploitation',
  autoPowerOn: 'Démarrage automatique',
  ha: 'Haute disponibilité',
  originalTemplate: 'Modèle d\'origine',
  unknownOsName: 'Inconnu',
  unknownOsKernel: 'Inconnu',
  vmLimitsLabel: 'Limites',
  vmCpuLimitsLabel: 'Limites processeur',
  vmMemoryLimitsLabel: 'Limites mémoire',
  unknownOriginalTemplate: 'Inconnu',
  // ----- VM placholders -----
  vmHomeNamePlaceholder: 'Clic long pour ajouter un nom',
  vmHomeDescriptionPlaceholder: 'Clic long pour ajouter une description',
  vmViewNamePlaceholder: 'Cliquer pour ajouter un nom',
  vmViewDescriptionPlaceholder: 'Cliquer pour ajouter une description',

  // ----- Dashboard -----
  poolPanel: 'Pool{pools, plural, zero {} one {} other {s}}',
  hostPanel: 'Hôte{hosts, plural, zero {} one {} other {s}}',
  vmPanel: 'VM{vms, plural, zero {} one {} other {s}}',
  memoryStatePanel: 'Utilisation mémoire',
  cpuStatePanel: 'Attribution CPU',
  srUsageStatePanel: 'Utilisation du stockage',
  vmStatePanel: 'État des VMs',
  srStatePanel: 'État du stockage',
  taskStatePanel: 'Tâches en cours',
  usersStatePanel: 'Utilisateurs',
  ofUsage: 'sur',
  noSrs: 'Aucun stockage',
  srName: 'Nom',
  srPool: 'Pool',
  srHost: 'Hôte',
  srFormat: 'Type',
  srSize: 'Taille',
  srUsage: 'Utilisation',
  srTopUsageStatePanel: 'Top 5 d\'utilisation des stockages (en %)',
  // --- Stats board --
  weekHeatmapNoData: 'Pas de données.',
  statsDashboardGenericErrorTitle: 'Erreur stats',
  statsDashboardGenericErrorMessage: 'Pas de stats disponibles pour :',
  noSelectedMetric: 'Pas de métrique sélectionnée',
  statsDashboardSelectObjects: 'Valider',
  metricsLoading: 'Chargement…',
  // ----- Health -----
  orphanedVdis: 'Disques orphelins',
  orphanedVms: 'VM orphelines',
  noOrphanedObject: 'Pas d\'orphelin',
  vmNameLabel: 'Nom',
  vmNameDescription: 'Description',
  vmContainer: 'Présent sur',
  alarmMessage: 'Alarmes',
  noAlarms: 'Aucune alarme',
  alarmDate: 'Date',
  alarmContent: 'Contenu',
  alarmObject: 'Concernant',
  alarmPool: 'Pool',
  alarmRemoveAll: 'Supprimer toutes les alarmes',
  // ----- New VM -----
  newVmCreateNewVmOn: 'Créer une nouvelle VM sur {pool}',
  newVmInfoPanel: 'Informations',
  newVmNameLabel: 'Nom',
  newVmTemplateLabel: 'Modèle',
  newVmDescriptionLabel: 'Description',
  newVmPerfPanel: 'Performances',
  newVmVcpusLabel: 'vCPUs',
  newVmRamLabel: 'RAM',
  newVmInstallSettingsPanel: 'Paramètres d\'installation',
  newVmIsoDvdLabel: 'ISO/DVD',
  newVmNetworkLabel: 'Network',
  newVmPvArgsLabel: 'PV Args',
  newVmPxeLabel: 'PXE',
  newVmInterfacesPanel: 'Interfaces',
  newVmMacLabel: 'MAC',
  newVmAddInterface: 'Ajouter une interface',
  newVmDisksPanel: 'Disques',
  newVmSrLabel: 'SR',
  newVmBootableLabel: 'Amorçable',
  newVmSizeLabel: 'Taille',
  newVmAddDisk: 'Ajouter un disque',
  newVmSummaryPanel: 'Résumé',
  newVmCreate: 'Créer',
  newVmReset: 'Effacer',
  newVmSelectTemplate: 'Sélectionner un template',
  newVmSshKey: 'Clé SSH',
  newVmCustomConfig: 'Configuration personnalisée',
  newVmBootAfterCreate: 'Démarrer la VM après sa création',
  newVmMacPlaceholder: 'Auto-généré si vide',
  newVmCpuWeightLabel: 'Poids CPU',
  newVmCpuWeightQuarter: 'Quart (1/4)',
  newVmCpuWeightHalf: 'Moitié (1/2)',
  newVmCpuWeightNormal: 'Normal',
  newVmCpuWeightDouble: 'Double (x2)',

  // ---- VM import ---
  importVmsList: 'Glissez des backups ici ou cliquez pour sélectionner des backups à envoyer. Accepte seulement les fichiers .xva.',
  noSelectedVms: 'Pas de VMs sélectionnées.',
  vmImportToPool: 'Sur le Pool:',
  vmImportToSr: 'Sur le SR:',
  vmsToImport: 'VMs à importer',
  importVmsCleanList: 'Reset',
  vmImportSuccess: 'Import de VM réussi',
  vmImportFailed: 'Import de VM échoué',
  startVmImport: 'Lancement de l\'import…',
  startVmExport: 'Lancement de l\'export…',
  // ----- Modals -----
  startVmsModalTitle: 'Démarrer {vms, plural, one {la} other {les}} VM{vms, plural, one {} other {s}}',
  startVmsModalMessage: 'Voulez-vous vraiment démarrer {vms} VM{vms, plural, one {} other {s}} ?',
  stopVmsModalTitle: 'Arrêter {vms, plural, one {la} other {les}} VM{vms, plural, one {} other {s}}',
  stopVmsModalMessage: 'Voulez-vous vraiment arrêter {vms} VM{vms, plural, one {} other {s}} ?',
  restartVmsModalTitle: 'Redémarrer {vms, plural, one {la} other {les}} VM{vms, plural, one {} other {s}}',
  restartVmsModalMessage: 'Voulez-vous vraiment redémarrer {vms} VM{vms, plural, one {} other {s}} ?',
  migrateVmModalTitle: 'Migrer la VM',
  migrateVmModalBody: 'Voulez-vous vraiment migrer cette VM sur {hostName} ?',
  migrateVmAdvancedModalSelectHost: 'Sélectionnez un hôte de destination:',
  migrateVmAdvancedModalSelectNetwork: 'Sélectionnez un réseau pour la migration:',
  migrateVmAdvancedModalSelectSrs: 'Pour chaque VDI, sélectionnez un SR:',
  migrateVmAdvancedModalSelectNetworks: 'Pour chaque VIF, sélectionnez un réseau:',
  migrateVmAdvancedModalName: 'Nom',
  migrateVmAdvancedModalSr: 'SR',
  migrateVmAdvancedModalVif: 'VIF',
  migrateVmAdvancedModalNetwork: 'Réseau',
  migrateVmAdvancedModalNoRemapping: 'Migration intra-pool : le re-mappage n\'est pas requis',
  // ------ Self ------
  resourceSets: 'Ensemble de ressources',
  resourceSetName: 'Nom de l\'ensemble de ressources',
  resourceSetCreation: 'Création and édition',
  saveResourceSet: 'Sauvegarder',
  resetResourceSet: 'Effacer',
  editResourceSet: 'Editer',
  deleteResourceSet: 'Supprimer',
  deleteResourceSetWarning: 'Suppression d\'un ensemble de ressources.',
  deleteResourceSetQuestion: 'Etes-vous sûr de vouloir supprimer cet ensemble ?',
  resourceSetMissingObjects: 'Objets manquants :',
  resourceSetVcpus: 'vCPUs',
  resourceSetMemory: 'Mémoire',
  resourceSetStorage: 'Stockage',
  unknownResourceSetValue: 'Inconnu',
  availableHosts: 'Hôtes disponibles',
  excludedHosts: 'Hôtes exclus',
  noHostsAvailable: 'Pas d\'hôtes disponibles.',
  availableHostsDescription: 'Les VMs crées par cet ensemble de ressources doivent tourner sur les hôtes suivants.',
  maxCpus: 'Nombre max de CPUs',
  maxRam: 'Maximum RAM (GiB)',
  maxDiskSpace: 'Maximum d\'espace disque',
  totalResource: 'Total :',
  remainingResource: 'Restants :',
  usedResource: 'Utilisés :',
  noResourceSetLimits: 'Pas de limites.',
  // ----- Copy VM -----
  copyVm: 'Copier la VM',
  copyVmConfirm: 'Voulez-vous vraiment copier cette VM sur {SR} ?',
  copyVmName: 'Nom',
  copyVmNamePlaceholder: 'Si vide : nom de la VM copiée',
  copyVmSelectSr: 'Sélectionnez un SR',
  copyVmCompress: 'Utiliser la compression',
  // ----- Network -----
  networkCreate: 'Créer un réseau',
  deleteNetwork: 'Supprimer le réseau',
  deleteNetworkConfirm: 'Etes-vous sûr de vouloir supprimer ce réseau ?',
  // ----- PIF -----
  connectPif: 'Connecter la PIF',
  connectPifConfirm: 'Etes-vous sûr de vouloir connecter cette PIF ?',
  disconnectPif: 'Déconnecter la PIF',
  disconnectPifConfirm: 'Etes-vous sûr de vouloir déconnecter cette PIF ?',
  deletePif: 'Supprimer la PIF',
  deletePifConfirm: 'Etes-vous sûr de vouloir supprimer cette PIF ?'
}
