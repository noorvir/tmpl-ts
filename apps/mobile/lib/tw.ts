import { useColorScheme } from 'react-native';
import { create, useDeviceContext, useAppColorScheme } from 'twrnc';

// Create the tw instance with your config
const tw = create(require('../tailwind.config.js'));

/**
 * Hook to initialize twrnc with device context (dark mode, screen size)
 * Call this once at the root of your app
 */
export function useTailwind() {
  useDeviceContext(tw);
  return tw;
}

/**
 * Hook to get/set the color scheme for twrnc
 */
export function useTwColorScheme() {
  return useAppColorScheme(tw);
}

export default tw;
