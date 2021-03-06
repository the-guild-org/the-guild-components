import { join } from 'node:path';
import fs from 'node:fs';
import babel from '@rollup/plugin-babel';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import autoExternal from 'rollup-plugin-auto-external';
import image from '@rollup/plugin-image';
import bundleSize from 'rollup-plugin-bundle-size';
import copy from 'rollup-plugin-copy';
import glob from 'glob';

const CWD = process.cwd();

const packageDirs = glob.sync('packages/*', {
  cwd: CWD,
  absolute: false,
});

function bundle(packageDir) {
  const tsxFile = `${packageDir}/src/index.tsx`;
  const tsFile = `${packageDir}/src/index.ts`;
  const isTsx = fs.existsSync(join(CWD, tsxFile));

  return {
    input: isTsx ? tsxFile : tsFile,
    output: [
      {
        file: join(CWD, packageDir, 'dist/index.mjs'),
        format: 'es',
        sourcemap: true,
      },
      // Components must to be bundled to cjs as on mesh website with next 12.2.3
      // I Got error while running `next build`
      // > Build error occurred
      // Error [ERR_MODULE_NOT_FOUND]: Cannot find package '/Users/dimitri/Desktop/GUILD/graphql-mesh/node_modules/@theguild/components/'
      // imported from /Users/dimitri/Desktop/GUILD/graphql-mesh/node_modules/guild-docs/esm/mermaid.js
      packageDir.includes('packages/components') && {
        file: join(__dirname, packageDir, 'dist/index.js'),
        format: 'cjs',
        sourcemap: true,
      },
    ].filter(Boolean),
    external: ['react-player/lazy', 'algoliasearch/lite', 'classnames', 'react/jsx-runtime'],
    plugins: [
      nodeResolve({ extensions: ['.ts', '.tsx'] }),
      autoExternal({
        packagePath: join(packageDir, 'package.json'),
        builtins: true,
        dependencies: true,
        peerDependencies: true,
      }),
      babel({
        babelHelpers: 'bundled',
        extensions: ['.tsx', '.ts'],
        configFile: join(CWD, '.babelrc'),
      }),
      image(),
      copy({
        targets: [
          {
            src: `./dist/${packageDir}/src/*`,
            dest: `./${packageDir}/dist`,
          },
          {
            src: join(CWD, packageDir, 'src/static/css/*'),
            dest: `./${packageDir}/dist`,
          },
        ],
      }),
      bundleSize(),
    ],
  };
}

export default packageDirs.map(bundle);
