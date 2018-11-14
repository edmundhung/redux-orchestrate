const pkg = require('./package.json');

module.exports = {
  collectCoverageFrom: ['src/**'],
  projects: pkg.workspaces,
};
