import 'react-native-gesture-handler';
import { registerRootComponent } from 'expo';

import App from './App';

// Suppress the Fabric/new-arch Event.NONE TypeError that fires on every XHR
// state transition. This prevents the crash without masking real errors.
const _originalHandler = global.ErrorUtils?.getGlobalHandler?.();
global.ErrorUtils?.setGlobalHandler?.((error, isFatal) => {
  if (error?.message?.includes("read-only property 'NONE'")) return;
  if (typeof _originalHandler === 'function') {
    _originalHandler(error, isFatal);
  } else {
    console.error('[Unhandled error]', error);
  }
});

registerRootComponent(App);
