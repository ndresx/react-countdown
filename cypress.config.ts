import { defineConfig } from 'cypress';

export default defineConfig({
  screenshotOnRunFailure: false,
  video: false,
  // The suite does not use Cypress.env(); opt out of the legacy env bridge
  // (deprecated and warned about in Cypress 15, removed in a future major).
  allowCypressEnv: false,
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents(on, config) {
      return require('./cypress/plugins/index.js')(on, config);
    },
    baseUrl: 'http://localhost:1234',
  },
});
