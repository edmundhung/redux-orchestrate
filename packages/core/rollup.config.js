import babel from 'rollup-plugin-babel';
import resolve from 'rollup-plugin-node-resolve';
import replace from 'rollup-plugin-replace';
import { terser } from 'rollup-plugin-terser';
import pkg from './package.json';

const externalPackages = [
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.peerDependencies || {}),
];

const cjs = {
  input: 'src/index.js',
  output: {
    file: 'lib/redux-orchestrate.js',
    format: 'cjs',
    indent: false,
  },
  external: externalPackages,
  plugins: [babel()],
};

const es = {
  input: 'src/index.js',
  output: {
    file: `es/redux-orchestrate.js`,
    format: 'es',
    indent: false,
  },
  external: externalPackages,
  plugins: [babel()],
};

const umd = {
  input: 'src/index.js',
  output: {
    file: 'dist/redux-orchestrate.min.js',
    format: 'umd',
    name: 'ReduxOrchestrate',
    indent: false,
    globals: {
      react: 'React',
      redux: 'Redux',
    },
  },
  external: externalPackages,
  plugins: [
    resolve({
      jsnext: true,
    }),
    babel({
      exclude: '**/node_modules/**',
      runtimeHelpers: true,
    }),
    replace({
      'process.env.NODE_ENV': JSON.stringify('production'),
    }),
    terser({
      compress: {
        pure_getters: true,
        unsafe: true,
        unsafe_comps: true,
        warnings: false,
      },
    }),
  ],
};

export default [cjs, es, umd];
