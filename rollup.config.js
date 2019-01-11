const pkg = require('./package.json');
const babel = require('rollup-plugin-babel');
const typescript = require('rollup-plugin-typescript2');

module.exports = {
  input: './src/index.ts',
  output: [
    {
      file: pkg.main,
      format: 'cjs',
      exports: 'named',
    },
    {
      file: pkg.module,
      format: 'es',
      exports: 'named',
    },
  ],
  external: [...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.peerDependencies || {})],
  plugins: [
    typescript({
      typescript: require('typescript'),
      exclude: ['**/*.test.ts?(x)'],
      clean: true,
    }),
    babel({
      exclude: 'node_modules/**',
    }),
  ],
};
