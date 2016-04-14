import forEach from 'lodash/forEach'
import isString from 'lodash/isString'
import frLocaleData from 'react-intl/locale-data/fr'
import React, {
  Component,
  PropTypes
} from 'react'
import {
  connect
} from 'react-redux'
import {
  addLocaleData,
  FormattedMessage,
  IntlProvider as IntlProvider_
} from 'react-intl'

// ===================================================================

export const messages = {
  // ----- Titles -----
  homePage: {
    defaultMessage: 'Home'
  },
  dashboardPage: {
    defaultMessage: 'Dashboard'
  },
  overviewDashboardPage: {
    defaultMessage: 'Overview'
  },
  overviewVisualizationDashboardPage: {
    defaultMessage: 'Visualizations'
  },
  overviewStatsDashboardPage: {
    defaultMessage: 'Statistics'
  },
  overviewHealthDashboardPage: {
    defaultMessage: 'Health'
  },
  selfServicePage: {
    defaultMessage: 'Self service'
  },
  selfServiceDashboardPage: {
    defaultMessage: 'Dashboard'
  },
  selfServiceAdminPage: {
    defaultMessage: 'Administration'
  },
  backupPage: {
    defaultMessage: 'Backup'
  },
  updatePage: {
    defaultMessage: 'Updates'
  },
  settingsPage: {
    defaultMessage: 'Settings'
  },
  settingsServersPage: {
    defaultMessage: 'Servers'
  },
  settingsUsersPage: {
    defaultMessage: 'Users'
  },
  settingsGroupsPage: {
    defaultMessage: 'Groups'
  },
  settingsAclsPage: {
    defaultMessage: 'ACLs'
  },
  settingsPluginsPage: {
    defaultMessage: 'Plugins'
  },
  aboutPage: {
    defaultMessage: 'About'
  },
  newMenu: {
    defaultMessage: 'New'
  },
  newVmPage: {
    defaultMessage: 'VM'
  },
  newSrPage: {
    defaultMessage: 'Storage'
  },
  newServerPage: {
    defaultMessage: 'Server'
  },
  newImport: {
    defaultMessage: 'Import'
  },
  backupOverviewPage: {
    defaultMessage: 'Overview'
  },
  backupNewPage: {
    defaultMessage: 'New'
  },
  backupRemotesPage: {
    defaultMessage: 'Remotes'
  },
  backupRestorePage: {
    defaultMessage: 'Restore'
  },

  // ----- Languages -----
  enLang: {
    defaultMessage: 'EN'
  },
  frLang: {
    defaultMessage: 'FR'
  },

  // ----- Sign in -----
  usernameLabel: {
    defaultMessage: 'Username:'
  },
  passwordLabel: {
    defaultMessage: 'Password:'
  },
  signInButton: {
    defaultMessage: 'Sign in'
  },

  // ----- VM actions ------
  startVmLabel: {
    defaultMessage: 'Start'
  },
  recoveryModeLabel: {
    defaultMessage: 'Start in recovery mode'
  },
  suspendVmLabel: {
    defaultMessage: 'Suspend'
  },
  stopVmLabel: {
    defaultMessage: 'Stop'
  },
  forceShutdownVmLabel: {
    defaultMessage: 'Force shutdown'
  },
  rebootVmLabel: {
    defaultMessage: 'Reboot'
  },
  forceRebootVmLabel: {
    defaultMessage: 'Force reboot'
  },
  deleteVmLabel: {
    defaultMessage: 'Delete'
  },
  migrateVmLabel: {
    defaultMessage: 'Migrate'
  },
  snapshotVmLabel: {
    defaultMessage: 'Snapshot'
  },
  exportVmLabel: {
    defaultMessage: 'Export'
  },
  copyVmLabel: {
    defaultMessage: 'Copy'
  },
  cloneVmLabel: {
    defaultMessage: 'Clone'
  },
  fastCloneVmLabel: {
    defaultMessage: 'Fast clone'
  },
  convertVmToTemplateLabel: {
    defaultMessage: 'Convert to template'
  },
  vmConsoleLabel: {
    defaultMessage: 'Console'
  },

  // ----- VM tabs -----
  generalTabName: {
    defaultMessage: 'General'
  },
  statsTabName: {
    defaultMessage: 'Stats'
  },
  consoleTabName: {
    defaultMessage: 'Console'
  },
  snapshotsTabName: {
    defaultMessage: 'Snapshots'
  },
  logsTabName: {
    defaultMessage: 'Logs'
  },
  advancedTabName: {
    defaultMessage: 'Advanced'
  },
  networkTabName: {
    defaultMessage: 'Network'
  },
  disksTabName: {
    defaultMessage: 'Disk{disks, plural, one {} other {s}}'
  },

  powerStateHalted: {
    defaultMessage: 'halted'
  },
  powerStateRunning: {
    defaultMessage: 'running'
  },

  // ----- VM general tab -----
  noToolsDetected: {
    defaultMessage: 'No Xen tools detected'
  },
  noIpv4Record: {
    defaultMessage: 'No IPv4 record'
  },
  noIpRecord: {
    defaultMessage: 'No IP record'
  },
  started: {
    defaultMessage: 'Started {ago}'
  },
  paraVirtualizedMode: {
    defaultMessage: 'Paravirtualization (PV)'
  },
  hardwareVirtualizedMode: {
    defaultMessage: 'Hardware virtualization (HVM)'
  },

  // ----- VM stat tab -----
  statsCpu: {
    defaultMessage: 'CPU usage'
  },
  statsMemory: {
    defaultMessage: 'Memory usage'
  },
  statsNetwork: {
    defaultMessage: 'Network throughput'
  },
  statDisk: {
    defaultMessage: 'Disk throughput'
  },
  statLastTenMinutes: {
    defaultMessage: 'Last 10 minutes'
  },
  statLastTwoHours: {
    defaultMessage: 'Last 2 hours'
  },
  statLastWeek: {
    defaultMessage: 'Last week'
  },
  statLastYear: {
    defaultMessage: 'Last year'
  },

  // ----- VM console tab -----
  copyToClipboardLabel: {
    defaultMessage: 'Copy'
  },
  ctrlAltDelButtonLabel: {
    defaultMessage: 'Ctrl+Alt+Del'
  },
  tipLabel: {
    defaultMessage: 'Tip:'
  },
  tipConsoleLabel: {
    defaultMessage: 'non-US keyboard could have issues with console: switch your own layout to US.'
  },

  // ----- VM disk tab -----
  vdiAttachDeviceButton: {
    defaultMessage: 'Attach disk'
  },
  vbdCreateDeviceButton: {
    defaultMessage: 'New disk'
  },
  vdiBootOrder: {
    defaultMessage: 'Boot order'
  },
  vdiNameLabel: {
    defaultMessage: 'Name'
  },
  vdiNameDescription: {
    defaultMessage: 'Description'
  },
  vdiTags: {
    defaultMessage: 'Tags'
  },
  vdiSize: {
    defaultMessage: 'Size'
  },
  vdiSr: {
    defaultMessage: 'SR'
  },
  vdbBootableStatus: {
    defaultMessage: 'Boot flag'
  },
  vdbBootable: {
    defaultMessage: 'Bootable'
  },
  vdbNotBootable: {
    defaultMessage: 'Not bootable'
  },
  vdbStatus: {
    defaultMessage: 'Status'
  },
  vbdStatusConnected: {
    defaultMessage: 'Connected'
  },
  vbdStatusDisconnected: {
    defaultMessage: 'Disconnected'
  },
  vbdNoVbd: {
    defaultMessage: 'No disks'
  },

  // ----- VM network tab -----
  vifCreateDeviceButton: {
    defaultMessage: 'New device'
  },
  vifNoInterface: {
    defaultMessage: 'No interface'
  },
  vifDeviceLabel: {
    defaultMessage: 'Device'
  },
  vifMacLabel: {
    defaultMessage: 'MAC address'
  },
  vifMtuLabel: {
    defaultMessage: 'MTU'
  },
  vifNetworkLabel: {
    defaultMessage: 'Network'
  },
  vifStatusLabel: {
    defaultMessage: 'Status'
  },
  vifStatusConnected: {
    defaultMessage: 'Connected'
  },
  vifStatusDisconnected: {
    defaultMessage: 'Disconnected'
  },
  vifIpAddresses: {
    defaultMessage: 'IP addresses'
  },

  // ----- VM snapshot tab -----
  noSnapshot: {
    defaultMessage: 'No snapshot'
  },
  snapshotCreateButton: {
    defaultMessage: 'New snapshot'
  },
  tipCreateSnapshotLabel: {
    defaultMessage: 'Just click on the snapshot button to create one!'
  },
  snapshotDate: {
    defaultMessage: 'Creation date'
  },
  snapshotName: {
    defaultMessage: 'Name'
  },
  snapshotAction: {
    defaultMessage: 'Action'
  },

  // ----- VM log tab -----
  logRemoveAll: {
    defaultMessage: 'Remove all logs'
  },
  noLogs: {
    defaultMessage: 'No logs so far'
  },
  logDate: {
    defaultMessage: 'Creation date'
  },
  logName: {
    defaultMessage: 'Name'
  },
  logAction: {
    defaultMessage: 'Action'
  },

  // ----- VM advanced tab -----
  xenSettingsLabel: {
    defaultMessage: 'Xen settings'
  },
  guestOsLabel: {
    defaultMessage: 'Guest OS'
  },
  miscLabel: {
    defaultMessage: 'Misc'
  },
  uuid: {
    defaultMessage: 'UUID'
  },
  virtualizationMode: {
    defaultMessage: 'Virtualization mode'
  },
  cpuWeightLabel: {
    defaultMessage: 'CPU weight'
  },
  defaultCpuWeight: {
    defaultMessage: 'Default'
  },
  pvArgsLabel: {
    defaultMessage: 'PV args'
  },
  xenToolsStatus: {
    defaultMessage: 'Xen tools status'
  },
  xenToolsStatusValue: {
    defaultMessage: '{status}',
    description: 'status can be `not-installed`, `unknown`, `out-of-date` & `up-to-date`'
  },
  osName: {
    defaultMessage: 'OS name'
  },
  osKernel: {
    defaultMessage: 'OS kernel'
  },
  autoPowerOn: {
    defaultMessage: 'Auto power on'
  },
  ha: {
    defaultMessage: 'HA'
  },
  originalTemplate: {
    defaultMessage: 'Original template'
  },
  unknownOsName: {
    defaultMessage: 'Unknown'
  },
  unknownOsKernel: {
    defaultMessage: 'Unknown'
  },
  enabledAutoPowerOn: {
    defaultMessage: 'Enabled'
  },
  disabledAutoPowerOn: {
    defaultMessage: 'Disabled'
  },
  enabledHa: {
    defaultMessage: 'Enabled'
  },
  disabledHa: {
    defaultMessage: 'Disabled'
  },
  unknownOriginalTemplate: {
    defaultMessage: 'Unknown'
  },
  vmLimitsLabel: {
    defaultMessage: 'VM limits'
  },
  vmCpuLimitsLabel: {
    defaultMessage: 'CPU limits'
  },
  vmMemoryLimitsLabel: {
    defaultMessage: 'Memory limits'
  },

  // ----- Dashboard -----
  poolPanel: {
    defaultMessage: 'Pool{pools, plural, one {} other {s}}'
  },
  hostPanel: {
    defaultMessage: 'Host{hosts, plural, one {} other {s}}'
  },
  vmPanel: {
    defaultMessage: 'VM{vms, plural, one {} other {s}}'
  },
  memoryStatePanel: {
    defaultMessage: 'RAM Usage'
  },
  cpuStatePanel: {
    defaultMessage: 'CPUs Usage'
  },
  vmStatePanel: {
    defaultMessage: 'VMs Power state'
  },
  taskStatePanel: {
    defaultMessage: 'Pending tasks'
  },
  usersStatePanel: {
    defaultMessage: 'Users'
  },
  srStatePanel: {
    defaultMessage: 'Storage state'
  },
  ofUsage: {
    defaultMessage: 'of'
  },
  noSrs: {
    defaultMessage: 'No storage'
  },
  srName: {
    defaultMessage: 'Name'
  },
  srPool: {
    defaultMessage: 'Pool'
  },
  srHost: {
    defaultMessage: 'Host'
  },
  srFormat: {
    defaultMessage: 'Type'
  },
  srSize: {
    defaultMessage: 'Size'
  },
  srUsage: {
    defaultMessage: 'Usage'
  },
  srUsageStatePanel: {
    defaultMessage: 'Storage Usage'
  },
  srTopUsageStatePanel: {
    defaultMessage: 'Top 5 SR Usage (in %)'
  },

  // ----- Health -----
  orphanedVdis: {
    defaultMessage: 'Orphaned VDIs'
  },
  orphanedVms: {
    defaultMessage: 'Orphaned VMs'
  },
  noOrphanedObject: {
    defaultMessage: 'No orphans'
  },
  vmNameLabel: {
    defaultMessage: 'Name'
  },
  vmNameDescription: {
    defaultMessage: 'Description'
  },
  vmContainer: {
    defaultMessage: 'Resident on'
  },
  alarmMessage: {
    defaultMessage: 'Alarms'
  },
  noAlarms: {
    defaultMessage: 'No alarms'
  },
  alarmDate: {
    defaultMessage: 'Date'
  },
  alarmContent: {
    defaultMessage: 'Content'
  },
  alarmObject: {
    defaultMessage: 'Issue on'
  },
  alarmPool: {
    defaultMessage: 'Pool'
  },
  alarmRemoveAll: {
    defaultMessage: 'Remove all alarms'
  },

  // ----- Servers -----
  serverHost: 'Host',
  serverUsername: 'Username',
  serverPassword: 'Password'
}
forEach(messages, (message, id) => {
  if (isString(message)) {
    messages[id] = {
      id,
      defaultMessage: message
    }
  } else if (!message.id) {
    message.id = id
  }
})

const localizedMessages = {}

addLocaleData(frLocaleData)
localizedMessages.fr = {
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
  // ----- General Stuff -----
  homePage: 'Accueil',
  usernameLabel: 'Nom :',
  passwordLabel: 'Mot de passe :',
  signInButton: 'Connexion',
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
  enabledAutoPowerOn: 'Activé',
  disabledAutoPowerOn: 'Désactivé',
  enabledHa: 'Activée',
  disabledHa: 'Désactivée',
  vmLimitsLabel: 'Limites',
  vmCpuLimitsLabel: 'Limites processeur',
  vmMemoryLimitsLabel: 'Limites mémoire',
  unknownOriginalTemplate: 'Inconnu',
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
  alarmRemoveAll: 'Supprimer toutes les alarmes'
}

// ===================================================================

export default (messageId, values = {}) => <FormattedMessage
  {...messages[messageId]}
  values={values}
/>

@connect(({ lang }) => ({ lang }))
export class IntlProvider extends Component {
  static propTypes = {
    children: PropTypes.node.isRequired,
    lang: PropTypes.string.isRequired
  };

  render () {
    const { lang, children } = this.props
    return <IntlProvider_
      locale={lang}
      messages={localizedMessages[lang]}
    >
     {children}
    </IntlProvider_>
  }
}
