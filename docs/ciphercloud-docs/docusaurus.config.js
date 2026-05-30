// @ts-check
import { themes as prismThemes } from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Cipher Cloud Docs',
  tagline: 'Zero-Knowledge Encrypted File Storage — CSIT-321',
  favicon: 'img/favicon.ico',

  url: 'https://cipher-cloud.net',
  baseUrl: '/docs/',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  markdown: {
    mermaid: true,
  },

  themes: ['@docusaurus/theme-mermaid'],

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
          routeBasePath: '/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Mermaid theme — matches Cipher Cloud dark/light
      mermaid: {
        theme: { light: 'neutral', dark: 'dark' },
      },

      navbar: {
        title: 'Cipher Cloud',
        logo: {
          alt: 'Cipher Cloud Logo',
          src: 'img/logo.svg',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'marketingSidebar',
            position: 'left',
            label: 'Marketing',
          },
          {
            type: 'docSidebar',
            sidebarId: 'userManualSidebar',
            position: 'left',
            label: 'User Manual',
          },
          {
            type: 'docSidebar',
            sidebarId: 'technicalSidebar',
            position: 'left',
            label: 'Technical Report',
          },
          {
            type: 'docSidebar',
            sidebarId: 'deploymentSidebar',
            position: 'left',
            label: 'Deployment',
          },
          {
            href: 'https://cipher-cloud.net/api-docs',
            label: 'API Docs (Swagger)',
            position: 'right',
          },
        ],
      },

      footer: {
        style: 'dark',
        links: [
          {
            title: 'Marketing',
            items: [
              { label: 'Marketing Audit', to: '/marketing' },
              { label: 'Poster Showcase', to: '/marketing/assets-showcase' },
            ],
          },
          {
            title: 'User Manual',
            items: [
              { label: 'Quick-Start Guide', to: '/user-manual' },
              { label: 'Uploading Files', to: '/user-manual/uploading-files' },
              { label: 'Sharing Files', to: '/user-manual/sharing-files' },
              { label: 'Troubleshooting', to: '/user-manual/troubleshooting' },
            ],
          },
          {
            title: 'Technical Report',
            items: [
              { label: 'Architecture', to: '/technical-report/architecture' },
              { label: 'Security Design', to: '/technical-report/security-design' },
              { label: 'API Reference', to: '/technical-report/api-reference' },
              { label: 'Algorithms', to: '/technical-report/algorithms' },
            ],
          },
          {
            title: 'Deployment',
            items: [
              { label: 'Local Setup', to: '/deployment/running-locally' },
              { label: 'Production', to: '/deployment/production-deployment' },
              { label: 'Checklist', to: '/deployment/production-checklist' },
              { label: 'Troubleshooting', to: '/deployment/troubleshooting' },
            ],
          },
        ],
        copyright: `CSIT-321 Capstone Project — Cipher Cloud. Built with Docusaurus.`,
      },

      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
        additionalLanguages: ['bash', 'json', 'nginx', 'javascript', 'typescript'],
      },

      colorMode: {
        defaultMode: 'light',
        disableSwitch: false,
        respectPrefersColorScheme: true,
      },
    }),
};

export default config;
