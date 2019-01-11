module.exports = function(api) {
  api.cache(true);
  return {
    comments: false,
    presets: [['@babel/env', { targets: { node: '4.0.0' } }], '@babel/react', '@babel/typescript'],
  };
};
