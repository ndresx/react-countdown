module.exports = function(api) {
  api.cache(true);
  return {
    comments: false,
    presets: [
      ['@babel/env', { targets: { browsers: 'last 2 versions' } }],
      '@babel/react',
      '@babel/typescript',
    ],
  };
};
