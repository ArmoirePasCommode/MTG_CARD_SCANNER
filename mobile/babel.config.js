module.exports = function babelConfig(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        '@babel/plugin-transform-typescript',
        { allowDeclareFields: true, isTSX: true, allExtensions: true }
      ],
      ['@babel/plugin-transform-private-methods', { loose: true }],
      [
        'module-resolver',
        {
          alias: {
            '@components': './src/components',
            '@screens': './src/screens',
            '@hooks': './src/hooks',
            '@services': './src/services',
            '@context': './src/context'
          }
        }
      ],
      'react-native-reanimated/plugin'
    ]
  };
};

