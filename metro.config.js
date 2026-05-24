const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Transform packages that use modern JS (private class fields, etc.)
config.transformer.transformIgnorePatterns = [
  'node_modules/(?!(react-native|@react-native|@react-native-community|expo|@expo|@unimodules|unimodules|axios|react-native-paper|react-native-vector-icons|zustand)/)',
];

module.exports = config;
