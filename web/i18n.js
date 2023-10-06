module.exports = {
  locales: ['en', 'fr'],
  defaultLocale: 'en',
  defaultNS: 'common',
  // Import different namespaces per page.
  pages: {
    '*': ['common'],
  },
}