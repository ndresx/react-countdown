module.exports = function() {
  return {
    comments: false,
    presets: [['env', { targets: { node: '4.0.0' } }], 'react', 'typescript'],
  };
};
