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
            to: '/xo5/manage_infrastructure#vms',
            from: '/administration',
          },
          {
            to: '/xo5/advanced',
            from: '/advanced',
          },
          {
            to: '/xo5/advanced#alerts',
            from: '/alerts',
          },
          {
            to: '/xo5/users#acls',
            from: '/acls',
          },
          {
            from: '/xo5/architecture',
            to: '/architecture',
          },
          {
            to: '/architecture#plugins',
            from: '/plugins',
          },
          {
            to: '/xo5/backup_howto',
            from: '/backup_howto',
          },
          {
            to: '/xo5/backup_reports',
            from: '/backup_reports',
          },
          {
            to: '/xo5/backup_troubleshooting',
            from: '/backup_troubleshooting',
          },
          {
            to: '/xo5/backups',
            from: '/backups',
          },
          {
            to: '/xo6/community',
            from: '/community',
          },
          {
            from: '/xo5/configuration',
            to: '/configuration',
          },
          {
            to: '/xo5/credential-encryption',
            from: '/credential-encryption',
          },
          {
            to: '/xo5/full_backups',
            from: '/full_backups',
          },
          {
            to: '/xo5/full_replication',
            from: '/full_replication',
          },
          {
            to: '/xo5/immutability',
            from: '/immutability',
          },
          {
            to: '/xo5/incremental_backups',
            from: '/incremental_backups',
          },
          {
            to: '/xo5/incremental_replication',
            from: '/incremental_replication',
          },
          {
            from: '/xo5/installation',
            to: '/installation',
          },
          {
            to: '/xo6/support',
            from: '/support',
          },
          {
            to: '/xo5/backup',
            from: '/backup',
          },
          {
            to: '/xo5/license_management',
            from: '/license_management',
          },
          {
            to: '/xo5/load_balancing',
            from: '/load_balancing',
          },
          {
            from: ['/manage', '/xo5/manage'],
            to: '/xo5/manage_infrastructure',
          },
          {
            to: '/xo5/manage_infrastructure',
            from: '/manage_infrastructure',
          },
          {
            to: '/xo5/mcp',
            from: '/mcp',
          },
          {
            to: '/xo5/metadata_backup',
            from: '/metadata_backup',
          },
          {
            from: '/xo5/migrate_to_new_xoa',
            to: '/migrate_to_new_xoa',
          },
          {
            to: '/xo5/mirror_backup',
            from: '/mirror_backup',
          },
          {
            to: '/xo5/object-storage-support',
            from: '/object-storage-support',
          },
          {
            to: '/xo5/proxy',
            from: '/proxy',
          },
          {
            to: '/xo6/purchase',
            from: '/purchase',
          },
          {
            from: '/xo5/releases',
            to: '/releases',
          },
          {
            to: '/xo5/restapi',
            from: '/restapi',
          },
          {
            to: '/xo5/rolling_snapshots',
            from: '/rolling_snapshots',
          },
          {
            to: '/xo5/sdn_controller',
            from: '/sdn_controller',
          },
          {
            from: '/xo5/supported_hosts',
            to: '/supported_hosts',
          },
          {
            from: ['/general-troubleshooting', '/xo5/troubleshooting'],
            to: '/troubleshooting',
          },
          {
            from: '/xo5/updater',
            to: '/updater',
          },
          {
            to: '/xo5/users',
            from: '/users',
          },
          {
            to: '/xo5/v2v-migration-guide',
            from: '/v2v-migration-guide',
          },
          {
            to: '/xo5/vm-templates',
            from: '/vm-templates',
          },
          {
            to: '/installation',
            from: ['/xoa', '/xo5/xoa'],
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
              href: '/installation',
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
