/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {

  userManualSidebar: [
    {
      type: 'category',
      label: 'User Manual',
      link: { type: 'doc', id: 'user-manual/index' },
      collapsible: false,
      items: [
        'user-manual/prerequisites',
        'user-manual/account-setup',
        'user-manual/two-factor-auth',
        'user-manual/cloud-storage',
        'user-manual/uploading-files',
        'user-manual/downloading-files',
        'user-manual/folders-and-explorer',
        'user-manual/sharing-files',
        'user-manual/analytics',
        'user-manual/profile',
        'user-manual/troubleshooting',
        'user-manual/faq',
        'user-manual/glossary',
      ],
    },
  ],

  technicalSidebar: [
    {
      type: 'category',
      label: 'Technical Report',
      link: { type: 'doc', id: 'technical-report/index' },
      collapsible: false,
      items: [
        'technical-report/architecture',
        'technical-report/frontend-design',
        'technical-report/backend-design',
        'technical-report/database-design',
        'technical-report/security-design',
        'technical-report/api-reference',
        'technical-report/algorithms',
        'technical-report/testing',
        'technical-report/known-limitations',
        'technical-report/future-improvements',
      ],
    },
  ],

  deploymentSidebar: [
    {
      type: 'category',
      label: 'Installation & Deployment',
      link: { type: 'doc', id: 'deployment/index' },
      collapsible: false,
      items: [
        'deployment/backend-setup',
        'deployment/frontend-setup',
        'deployment/cloud-connectors',
        'deployment/database-setup',
        'deployment/running-locally',
        'deployment/production-deployment',
        'deployment/production-checklist',
        'deployment/troubleshooting',
      ],
    },
  ],

};

module.exports = sidebars;
