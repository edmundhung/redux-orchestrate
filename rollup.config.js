import path from 'path';
import babel from 'rollup-plugin-babel';
import resolve from 'rollup-plugin-node-resolve';
import replace from 'rollup-plugin-replace';
import { terser } from 'rollup-plugin-terser';
import corePackage from './packages/core/package.json';
import reactReduxPackage from './packages/react-redux/package.json';

function getBuildConfigs(name, meta) {
  const basePath = meta.name.replace('@redux-orchestrate', 'packages');
  const externalPackages = [
    ...Object.keys(meta.dependencies || {}),
    ...Object.keys(meta.peerDependencies || {}),
  ];

  const cjs = {
    input: path.join(basePath, 'src/index.js'),
    output: {
      file: path.join(basePath, meta.main),
      format: 'cjs',
      indent: false,
    },
    external: externalPackages,
    plugins: [babel()],
  };

  const es = {
    input: path.join(basePath, 'src/index.js'),
    output: {
      file: path.join(basePath, meta.module),
      format: 'es',
      indent: false,
    },
    external: externalPackages,
    plugins: [babel()],
  };

  const umd = {
    input: path.join(basePath, 'src/index.js'),
    output: {
      file: path.join(basePath, meta.unpkg),
      format: 'umd',
      name: name,
      indent: false,
      globals: {
        react: 'React',
        redux: 'Redux',
        'react-redux': 'ReactRedux',
        '@redux-orchestrate/core': 'ReduxOrchestrate',
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

  return [cjs, es, umd];
}

const core = getBuildConfigs('ReduxOrchestrate', corePackage);
const reactRedux = getBuildConfigs('ReduxOrchestrateReactRedux', reactReduxPackage);

export default [].concat(core, reactRedux);
