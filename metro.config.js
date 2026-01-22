const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
	resolver: {
		// Ensure all packages (including nested deps like moti/framer-motion)
		// use the same React instance. Duplicate React installs cause hook errors.
		extraNodeModules: {
			react: path.resolve(__dirname, 'node_modules/react'),
			// Some deps might try to pull react-dom; map it too if present.
			'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
		},
	},
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
