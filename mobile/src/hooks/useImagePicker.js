import { useCallback, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';

/**
 * Camera and photo-library helpers used by Scan and BulkScan.
 *
 * Permissions are requested through `expo-image-picker` itself
 * (`requestCameraPermissionsAsync` / `requestMediaLibraryPermissionsAsync`),
 * which is the supported API for `launchCameraAsync` and
 * `launchImageLibraryAsync`. The previous `expo-camera` top-level
 * `requestCameraPermissionsAsync` no longer exists in expo-camera v17.
 */
const useImagePicker = () => {
  const [imageUri, setImageUri] = useState(null);

  const ensurePermissions = useCallback(async ({ camera }) => {
    if (camera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Camera access is required to scan a card.');
      }
      return;
    }
    const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (mediaStatus !== 'granted') {
      throw new Error('Photo library access is required.');
    }
  }, []);

  const pickFromLibrary = useCallback(async () => {
    await ensurePermissions({ camera: false });
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.7,
      base64: false,
    });
    if (result.canceled) return null;
    const uri = result.assets?.[0]?.uri ?? null;
    setImageUri(uri);
    return uri;
  }, [ensurePermissions]);

  const takePhoto = useCallback(async () => {
    await ensurePermissions({ camera: true });
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.7,
    });
    if (result.canceled) return null;
    const uri = result.assets?.[0]?.uri ?? null;
    setImageUri(uri);
    return uri;
  }, [ensurePermissions]);

  const reset = useCallback(() => setImageUri(null), []);

  return { imageUri, pickFromLibrary, takePhoto, reset };
};

export default useImagePicker;
