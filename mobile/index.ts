import 'react-native-gesture-handler';
import { registerRootComponent } from 'expo';

import App from './App';

// React Native exposes ErrorUtils on the global object but it is not declared
// in the standard TypeScript lib — extend it locally.
declare const global: typeof globalThis & {
  ErrorUtils?: {
    getGlobalHandler?: () => ((error: Error, isFatal?: boolean) => void) | undefined;
    setGlobalHandler?: (handler: (error: Error, isFatal?: boolean) => void) => void;
  };
};

// Suppress the Fabric/new-arch Event.NONE TypeError that fires on every XHR
// state transition. This prevents the crash without masking real errors.
const _originalHandler = global.ErrorUtils?.getGlobalHandler?.();
global.ErrorUtils?.setGlobalHandler?.((error: Error, isFatal?: boolean) => {
  if (error?.message?.includes("read-only property 'NONE'")) return;
  if (typeof _originalHandler === 'function') {
    _originalHandler(error, isFatal);
  } else {
    console.error('[Unhandled error]', error);
  }
});

registerRootComponent(App);
