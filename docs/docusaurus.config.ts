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
  plugins: [
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
            to: '/xo5/architecture',
            from: '/architecture',
          },
          {
            to: '/xo5/architecture#plugins',
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
            to: '/xo5/configuration',
            from: '/configuration',
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
            to: '/xo5/installation',
            from: '/installation',
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
            to: '/xo5/manage',
            from: '/manage',
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
            to: '/xo5/migrate_to_new_xoa',
            from: '/migrate_to_new_xoa',
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
            to: '/xo5/releases',
            from: '/releases',
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
            to: '/xo5/supported_hosts',
            from: '/supported_hosts',
          }, 
          {
            to: '/xo5/troubleshooting',
            from: ['/general-troubleshooting', '/troubleshooting']
          },
          {
            to: '/xo5/updater',
            from: '/updater',
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
            to: '/xo5/xoa',
            from: '/xoa',
          }, 
        ],
      },
    ],
  ],
  scripts: [
    {
      src: '/js/matomo.js',
      async: true,
    },
  ],
  presets: [
    [
      'classic',
      {
        docs: {
          routeBasePath: '/',
          sidebarPath: './sidebars.ts',
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
    // Replace with your project's social card
    image: 'img/vates-xo-logo-smol-new-baseline.png',
    navbar: {
      title: 'Xen Orchestra Documentation',
      logo: { alt: 'Xen Orchestra logo', src: 'img/logo.png', href: '/' },
      items: [
        { href: 'https://xen-orchestra.com', label: 'Home', position: 'right' },
        { href: 'https://xen-orchestra.com/blog/', label: 'Blog', position: 'right' },
        { href: '/', label: 'Documentation', position: 'right' },
        { href: 'https://github.com/vatesfr/xen-orchestra', label: 'GitHub', position: 'right' },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Learn',
          items: [
            {
              label: 'Introduction',
              href: '/',
            },
            {
              label: 'Installation',
              href: '/xo5/installation',
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
    },
  } satisfies Preset.ThemeConfig,

  markdown:{
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },
}
