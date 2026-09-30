import { themes as prismThemes } from 'prism-react-renderer'
import type { Config } from '@docusaurus/types'
import type * as Preset from '@docusaurus/preset-classic'

export default {
  title: 'Xen Orchestra | XO Documentation',
  tagline: 'Discover how to use Xen Orchestra',
  favicon: 'img/favicon.ico',
  trailingSlash: false,
  // Set the production url of your site here
  url: 'https://docs.xen-orchestra.com/',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  // organizationName: 'facebook', // Usually your GitHub org/user name.
  // projectName: 'docusaurus', // Usually your repo name.

  onBrokenLinks: 'throw',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },
  themes: ['docusaurus-theme-search-typesense'],

  plugins: [
    // Kept even though Typesense provides the search UI: this plugin
    // generates search-doc.json, which the federated search indexer
    // consumes (src/theme/SearchBar picks the Typesense bar).
    require.resolve('docusaurus-lunr-search'),
    [
      '@docusaurus/plugin-client-redirects',
      {
        redirects: [
          {
            to: '/manage-your-infrastructure/manage_infrastructure#vms',
            from: '/administration',
          },
          {
            to: '/users-and-access/rbac',
            from: ['/xo6/acl-v2', '/rbac'],
          },
          {
            to: '/manage-your-infrastructure/advanced',
            from: ['/advanced', '/xo5/advanced'],
          },
          {
            to: '/manage-your-infrastructure/advanced#alerts',
            from: '/alerts',
          },
          {
            to: '/users-and-access/users#acls',
            from: '/acls',
          },
          {
            to: '/getting-started/architecture',
            from: ['/xo5/architecture', '/architecture'],
          },
          {
            to: '/getting-started/architecture#plugins',
            from: '/plugins',
          },
          {
            to: '/backups-and-dr/backup_howto',
            from: ['/xo5/backup_howto', '/backup_howto'],
          },
          {
            to: '/backups-and-dr/calculator',
            from: ['/xo5/calculator', '/calculator'],
          },
          {
            to: '/backups-and-dr/backup_reports',
            from: ['/backup_reports', '/xo5/backup_reports'],
          },
          {
            to: '/backups-and-dr/backup_troubleshooting',
            from: ['/backup_troubleshooting', '/xo5/backup_troubleshooting'],
          },
          {
            to: '/backups-and-dr/backup-features-and-settings',
            from: ['/backups', '/xo5/backups'],
          },
          {
            to: '/backups-and-dr/backups-in-xo6', 
            from: '/xo6/backups',
          },
          {
            to: '/support-and-licencing/community',
            from: ['/xo6/community', '/community'],
          },
          {
            to: '/getting-started/configuration',
            from: ['/xo5/configuration', '/configuration'],
          },
          {
            to: '/users-and-access/credential-encryption',
            from: ['/xo5/credential-encryption', '/credential-encryption'],
          },
          {
            to: '/backups-and-dr/backup-types/full_backups',
            from: ['/xo5/full_backups', '/full_backups'],
          },
          {
            to: '/backups-and-dr/backup-types/full_replication',
            from: ['/xo5/full_replication', '/full_replication'],
          },
          {
            to: '/backups-and-dr/scale-and-security/immutability',
            from: ['/xo5/immutability', '/immutability'],
          },
          {
            to: '/backups-and-dr/backup-types/incremental_backups',
            from: ['/incremental_backups', '/xo5/incremental_backups'],
          },
          {
            to: '/backups-and-dr/backup-types/incremental_replication',
            from: ['/incremental_replication', '/xo5/incremental_replication'],
          },
          {
            to: '/getting-started/installation',
            from: ['/xoa', '/xo5/xoa', '/installation', '/xo5/installation'],
          },
          {
            to: '/getting-started/install-from-sources',
            from: '/install-from-sources',
          },
          {
            to: '/backups-and-dr/backup',
            from: '/xo5/backup',
          },
          {
            to: '/support-and-licencing/support',
            from: ['/license_management', '/xo5/license_management', '/xo6/support', '/support'],
          },
          {
            to: '/manage-your-infrastructure/load_balancing',
            from: ['/load_balancing', '/xo5/load_balancing'],
          },
          {
            to: '/manage-your-infrastructure/manage_infrastructure',
            from: ['/manage', '/xo5/manage', '/manage_infrastructure'],
          },
          {
            to: '/automation/mcp',
            from: ['/mcp', '/xo5/mcp'],
          },
          {
            to: '/backups-and-dr/backup-types/metadata_backup',
            from: ['/metadata_backup', '/xo5/metadata_backup'],
          },
          {
            to: '/getting-started/migrate_to_new_xoa',
            from: '/migrate_to_new_xoa',
          },
          {
            to: '/backups-and-dr/backup-types/mirror_backup',
            from: ['/xo5/mirror_backup', '/mirror_backup'],
          },
          {
            to: '/backups-and-dr/scale-and-security/object-storage-support',
            from: ['/xo5/object-storage-support', '/object-storage-support'],
          },
          {
            to: '/backups-and-dr/scale-and-security/proxy',
            from: ['/proxy', '/xo5/proxy'],
          },
          {
            to: '/support-and-licencing/support#licensing',
            from: ['/purchase', '/xo6/purchase'],
          },
          {
            to: '/getting-started/releases',
            from: '/releases',
          },
          {
            to: '/automation/restapi',
            from: ['/restapi', '/xo5/restapi'],
          },
          {
            to: '/automation/terraform-provider',
            from: '/xo6/terraform-provider',
          },
          {
            to: '/automation/ansible',
            from: '/xo6/ansible',
          },
          {
            to: '/automation/pulumi-provider',
            from: '/xo6/pulumi-provider',
          },
          {
            to: '/automation/packer-provider',
            from: '/xo6/packer-provider',
          },
          {
            to: '/automation/powershell-module',
            from: '/xo6/powershell-module',
          },
          {
            to: '/automation/kubernetes',
            from: '/xo6/kubernetes',
          },
          {
            to: '/backups-and-dr/backup-types/rolling_snapshots',
            from: ['/xo5/rolling_snapshots', '/rolling_snapshots'],
          },
          {
            to: '/manage-your-infrastructure/sdn_controller',
            from: ['/sdn_controller', '/xo5/sdn_controller'],
          },
          {
            to: '/getting-started/supported_hosts',
            from: '/supported_hosts',
          },
          {
            to: '/getting-started/troubleshooting',
            from: ['/general-troubleshooting', '/xo5/troubleshooting', '/troubleshooting'],
          },
          {
            to: '/getting-started/updater',
            from: '/updater',
          },
          {
            to: '/users-and-access/users',
            from: ['/users', '/xo5/users'],
          },
          {
            to: '/guides/v2v-migration-guide',
            from: ['/v2v-migration-guide', '/xo5/v2v-migration-guide'],
          },
          {
            to: '/guides/windows-templates',
            from: '/windows-templates',
          },
          {
            to: '/manage-your-infrastructure/vm-templates',
            from: ['/vm-templates', '/xo5/vm-templates'],
          },
          {
            to: '/discover-xen-orchestra/whatsnew',
            from: '/xo6/whatsnew',
          },
          {
            to: '/discover-xen-orchestra/xo6vsxo5',
            from: '/xo6/xo6vsxo5',
          },
          {
            to: '/discover-xen-orchestra/gettingstarted',
            from: '/xo6/gettingstarted',
          },
          {
            to: '/discover-xen-orchestra/coreconcepts',
            from: '/xo6/coreconcepts',
          },
          {
            to: '/manage-your-infrastructure/management',
            from: '/xo6/management',
          },
          {
            to: '/manage-your-infrastructure/manage_infrastructure',
            from: '/xo5/manage_infrastructure',
          },
          {
            to: '/manage-your-infrastructure/ipmi-plugin',
            from: '/xo5/ipmi-plugin',
          },
          {
            to: '/backups-and-dr/backup',
            from: '/backup',
          },
          {
            to: '/backups-and-dr/scale-and-security/distributed_backups',
            from: '/distributed_backups',
          },
          {
            to: '/project/project',
            from: '/project',
          },
          {
            to: '/project/contributing',
            from: '/contributing',
          },
          {
            to: '/project/licenses',
            from: '/licenses',
          },
          {
            to: '/project/glossary',
            from: '/glossary',
          },
        ],
      },
    ],
  ],
  customFields: {
    // Formbricks feedback widget (see src/components/PageFeedback).
    // These IDs are client-safe: the widget only talks to the public client API.
    formbricks: {
      apiHost: 'https://survey.vates.tech',
      environmentId: 'cm1t5b3lt000811e86uf67vs8',
      surveyId: 'cms3hr8ab005hrw01fvsrsy17',
    },
    // Cookieless Matomo tracking (see src/clientModules/matomo.ts).
    // Site 23 is the dedicated XO docs site (5 is the XO website).
    // The site ID is client-visible by nature; an empty one disables
    // tracking entirely.
    matomo: {
      url: 'https://visit.vates.tech/',
      siteId: '23',
    },
  },
  clientModules: [
    require.resolve('./src/clientModules/matomo.ts'),
    require.resolve('./src/clientModules/movedAnchors.ts'),
  ],
  presets: [
    [
      'classic',
      {
        docs: {
          routeBasePath: '/',
          sidebarPath: './sidebars.ts',
          // "Last updated on…" stamp at the bottom of every page, from
          // the git history of each file.
          showLastUpdateTime: true,
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl: 'https://github.com/vatesfr/xen-orchestra/tree/master/docs',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Federated search across docs.xen-orchestra.com, docs.vates.tech
    // and docs.xcp-ng.org. Results group by product; hits from the two
    // sibling sites keep their absolute URL (externalUrlRegex).
    // The API key is search-only and public by design.
    // Local dev against a local Typesense (prod only allows CORS from
    // the three doc domains):
    //   TYPESENSE_HOST=localhost TYPESENSE_PORT=8108 \
    //   TYPESENSE_PROTOCOL=http TYPESENSE_SEARCH_KEY=<key> yarn start
    typesense: {
      typesenseCollectionName: 'vates_federated',
      externalUrlRegex: 'docs\\.vates\\.tech|docs\\.xcp-ng\\.org',
      typesenseServerConfig: {
        nodes: [
          {
            host: process.env.TYPESENSE_HOST ?? 'typesense.vates.tech',
            port: Number(process.env.TYPESENSE_PORT ?? 443),
            protocol: process.env.TYPESENSE_PROTOCOL ?? 'https',
          },
        ],
        apiKey: process.env.TYPESENSE_SEARCH_KEY ?? 'b2806f42e60429ceecb3808a2c6bb31cc9ca955cb1e4290c',
      },
      typesenseSearchParameters: {},
      contextualSearch: false,
    },
    // Replace with your project's social card
    image: 'img/vates-xo-logo-smol-new-baseline.png',
    navbar: {
      title: 'Xen Orchestra Documentation',
      logo: { alt: 'Xen Orchestra logo', src: 'img/logo.png', href: '/' },
      items: [
        { to: 'https://docs.vates.tech/', label: 'Vates VMS', position: 'right', target: '_self' },
        { to: 'https://docs.xcp-ng.org/', label: 'XCP-ng', position: 'right', target: '_self' },
        { href: '/', label: 'Xen Orchestra', position: 'right' },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Learn',
          items: [
            {
              label: 'About Xen Orchestra',
              href: 'https://xen-orchestra.com/#!/xo-home',
            },
            {
              label: 'Introduction',
              href: '/',
            },
            {
              label: 'Installation',
              href: '/getting-started/installation',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'Forum',
              href: 'https://xcp-ng.org/forum',
            },
            {
              label: 'Discord',
              href: 'https://discord.gg/Hr98F6wRvx',
            },
          ],
        },
        {
          title: 'Pro Support',
          items: [
            {
              label: 'Vates Stack',
              href: 'https://vates.tech',
            },
            {
              label: 'Contact us',
              href: 'https://vates.tech/contact',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'News',
              href: 'https://xen-orchestra.com/blog/',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/vatesfr/xen-orchestra',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} XCP-ng Project, Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['toml', 'ini', 'nginx', 'apacheconf'],
    },
  } satisfies Preset.ThemeConfig,

  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },
}
