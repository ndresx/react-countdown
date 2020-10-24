const pkg = require('./package.json');
const babel = require('rollup-plugin-babel');
const typescript = require('rollup-plugin-typescript2');

const createConfig = ({ name, ext }) => ({
  input: `./src/${name}.${ext}`,
  output: [
    {
      file: pkg.main.replace('index', name),
      format: 'cjs',
      exports: 'named',
    },
    {
      file: pkg.module.replace('index', name),
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
      extensions: ['.ts', '.tsx'],
    }),
  ],
});

module.exports = [{ name: 'index', ext: 'ts' }].map(createConfig);
