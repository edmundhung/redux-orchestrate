const pkg = require('./package.json');

module.exports = {
  babelrcRoots: pkg.workspaces,
};
