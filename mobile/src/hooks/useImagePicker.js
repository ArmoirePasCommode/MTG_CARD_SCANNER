import { useCallback, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as Camera from 'expo-camera';

const useImagePicker = () => {
  const [imageUri, setImageUri] = useState(null);
  const [permissionPrompted, setPermissionPrompted] = useState(false);

  const requestPermissions = useCallback(async () => {
    if (permissionPrompted) return true;
    const { status: cameraStatus } = await Camera.Camera.requestCameraPermissionsAsync();
    const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    setPermissionPrompted(true);
    return cameraStatus === 'granted' && mediaStatus === 'granted';
  }, [permissionPrompted]);

  const pickFromLibrary = useCallback(async () => {
    const granted = await requestPermissions();
    if (!granted) {
      throw new Error('Camera or gallery access denied');
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      quality: 0.7,
      base64: false
    });
    if (!result.canceled) {
      const uri = result.assets?.[0]?.uri;
      setImageUri(uri);
      return uri;
    }
    return null;
  }, [requestPermissions]);

  const takePhoto = useCallback(async () => {
    const granted = await requestPermissions();
    if (!granted) {
      throw new Error('Camera access denied');
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.7
    });
    if (!result.canceled) {
      const uri = result.assets?.[0]?.uri;
      setImageUri(uri);
      return uri;
    }
    return null;
  }, [requestPermissions]);

  const reset = useCallback(() => setImageUri(null), []);

  return {
    imageUri,
    pickFromLibrary,
    takePhoto,
    reset
  };
};

export default useImagePicker;

