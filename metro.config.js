const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts = [
  ...new Set([...config.resolver.assetExts, 'glb']),
];

// Skip Three.js's Node-only CommonJS warning wrapper on native platforms.
const threeModulePath = path.join(
  path.dirname(require.resolve('three')),
  'three.module.js'
);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'three' && (platform === 'ios' || platform === 'android')) {
    return { type: 'sourceFile', filePath: threeModulePath };
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
