import { createRequire } from 'module';
import typescript from '@rollup/plugin-typescript';
import nodeResolve from '@rollup/plugin-node-resolve';
import dts from 'rollup-plugin-dts';

const require = createRequire(import.meta.url);
const pkg = require('./package.json');

const input = {
  index: './src/index.ts',
  component: './src/component.ts',
  hook: './src/hook.ts',
};

// Keep peer deps (react, react-dom) out of the bundle.
const external = [...Object.keys(pkg.peerDependencies || {}), ...Object.keys(pkg.dependencies || {})];

const preserve = {
  preserveModules: true,
  preserveModulesRoot: 'src',
  exports: 'named',
};

// One file per source module (CountdownJs/utils shared, not duplicated).
// ESM and CJS coexist in dist/ via the .mjs/.js extension split.
const js = (format, ext) => ({
  input,
  external,
  output: { dir: 'dist', format, entryFileNames: `[name].${ext}`, ...preserve },
  plugins: [
    nodeResolve({ extensions: ['.ts', '.tsx'] }),
    typescript({
      tsconfig: './tsconfig.json',
      // Declarations are emitted separately by the dts pass below.
      declaration: false,
      outDir: 'dist',
      exclude: ['**/*.test.ts', '**/*.test.tsx'],
    }),
  ],
});

export default [
  js('es', 'mjs'),
  js('cjs', 'js'),
  // Types — one bundled .d.ts per public entry.
  {
    input,
    external,
    output: { dir: 'dist', format: 'es' },
    plugins: [dts()],
  },
];
