import { registerRootComponent } from 'expo';

import App from './App';

// Suppress a non-fatal dev-mode error from react-native-gesture-handler's
// HoverEffect enum initialization in Fabric/New Arch mode.
const _originalHandler = global.ErrorUtils?.getGlobalHandler?.();
global.ErrorUtils?.setGlobalHandler?.((error, isFatal) => {
  if (error?.message?.includes("read-only property 'NONE'")) return;
  if (typeof _originalHandler === 'function') {
    _originalHandler(error, isFatal);
  } else {
    // Fallback: ensure the error is never silently swallowed if no
    // original handler was registered at startup time.
    console.error('[Unhandled error]', error);
  }
});

registerRootComponent(App);

