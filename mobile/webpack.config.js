const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
    const config = await createExpoWebpackConfigAsync({
        ...env,
        babel: {
            dangerouslyAddModulePathsToTranspile: [
                '@expo',
                'expo',
                '@react-navigation',
                'react-native-safe-area-context',
                'react-native-screens',
                'react-native-reanimated'
            ],
        },
    }, argv);
    return config;
};
