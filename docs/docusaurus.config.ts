import { themes as prismThemes } from 'prism-react-renderer'
import type { Config } from '@docusaurus/types'
import type * as Preset from '@docusaurus/preset-classic'

const config: Config = {
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
  onBrokenMarkdownLinks: 'warn',

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
            to: '/incremental_replication',
            from: '/continuous_replication',
          },
          {
            to: '/architecture#plugins',
            from: '/plugins',
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
              href: 'https://github.com/facebook/docusaurus',
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
}

export default config
