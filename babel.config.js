const pkg = require('./package.json');

module.exports = {
  babelrcRoots: pkg.workspaces,
  presets: [
    '@babel/preset-react',
    [
      '@babel/env',
      {
        targets: {
          browsers: ['ie >= 11'],
        },
        exclude: ['transform-async-to-generator', 'transform-regenerator'],
        modules: process.env.NODE_ENV === 'test' ? 'commonjs' : false,
        loose: true,
      },
    ],
  ],
};
