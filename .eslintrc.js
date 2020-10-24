const OFF = 0;
const WARN = 1;
const ERROR = 2;

module.exports = {
  env: {
    browser: true,
    node: true,
  },
  extends: [
    'airbnb',
    'airbnb/hooks',
    'plugin:prettier/recommended',
    'plugin:react/recommended',
    'plugin:jest/recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  rules: {
    'consistent-return': OFF,
    'class-methods-use-this': OFF,
    'func-names': OFF,
    'lines-between-class-members': OFF,
    'import/extensions': OFF,
    'import/first': OFF,
    'import/newline-after-import': OFF,
    'import/no-extraneous-dependencies': OFF,
    'import/no-unresolved': OFF,
    'jest/expect-expect': OFF,
    'no-plusplus': OFF,
    'no-prototype-builtins': OFF,
    'no-return-assign': OFF,
    'no-self-compare': OFF,
    'no-shadow': OFF,
    'no-unused-expressions': [ERROR, { allowShortCircuit: true }],
    'no-use-before-define': OFF,
    'react/jsx-boolean-value': OFF,
    'react/jsx-filename-extension': [WARN, { extensions: ['.tsx'] }],
    'react/jsx-one-expression-per-line': OFF,
    'react/jsx-props-no-spreading': OFF,
    'react/destructuring-assignment': OFF,
    'react/no-unused-prop-types': OFF,
    'react/require-default-props': OFF,
    'react/state-in-constructor': OFF,
    'react/static-property-placement': OFF,
    '@typescript-eslint/explicit-function-return-type': OFF,
    '@typescript-eslint/no-empty-interface': OFF,
    '@typescript-eslint/no-inferrable-types': OFF,
    '@typescript-eslint/no-non-null-assertion': OFF,
    '@typescript-eslint/no-shadow': ERROR,
    '@typescript-eslint/no-use-before-define': ERROR,
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};
