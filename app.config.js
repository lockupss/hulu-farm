// Replace app.json with this app.config.js file in your project root.
// It reads EXPO_PUBLIC_API_BASE from your .env and passes it into the app
// via Constants.expoConfig.extra — which works reliably on physical devices.

module.exports = ({ config }) => ({
  ...config,
  name: 'hulu-farm',
  slug: 'hulu-farm',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'hulufarm',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
  },
  android: {
    usesCleartextTraffic: true,
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
  },
  web: {
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        image: './assets/images/splash-icon.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#ffffff',
        dark: { backgroundColor: '#000000' },
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission: 'Allow HuluFarm to set your profile photo.',
        cameraPermission: 'Allow HuluFarm to take a profile photo.',
      },
    ],
    [
      'expo-contacts',
      {
        contactsPermission:
          'Allow HuluFarm to match hashed phone numbers so we can suggest people you may know.',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    // This is what makes the API base URL available on physical devices.
    // Set EXPO_PUBLIC_API_BASE=http://YOUR_PC_IP:8000 in your .env file.
    apiBase: process.env.EXPO_PUBLIC_API_BASE || '',
  },
})