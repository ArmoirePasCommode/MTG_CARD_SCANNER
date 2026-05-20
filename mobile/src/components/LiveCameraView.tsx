import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';

import { processCardRecognition } from '../services/scryfallService';
import { colors, radius } from '../theme';
import type { NewCard } from '../types/api';

const SCAN_INTERVAL_MS = 2500;
const COOLDOWN_MS = 3000;
const FLASH_VISIBLE_MS = 1200;

const FRAME_WIDTH = 230;
const FRAME_HEIGHT = Math.round(FRAME_WIDTH * (88 / 63));
const CORNER_SIZE = 24;
const CORNER_THICKNESS = 3;
const CORNER_RADIUS = 4;

interface LiveCameraViewProps {
  onCardRecognized?: (card: NewCard) => void;
  mode?: 'single' | 'bulk';
  isActive?: boolean;
  style?: StyleProp<ViewStyle>;
}

const LiveCameraView = ({
  onCardRecognized,
  mode = 'single',
  isActive = true,
  style,
}: LiveCameraViewProps): React.JSX.Element => {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [recognizedName, setRecognizedName] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cameraRef = useRef<CameraView>(null);
  const isProcessingRef = useRef(false);
  const lastRecognizedIdRef = useRef<string | null>(null);
  const cooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const captureMaskOpacity = useRef(new Animated.Value(0)).current;
  const scanAnim = useRef(new Animated.Value(0)).current;
  const scanLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const flashOpacity = useRef(new Animated.Value(0)).current;
  const flashAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  const startScanLine = useCallback((): void => {
    scanAnim.setValue(0);
    scanLoopRef.current = Animated.loop(
      Animated.timing(scanAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    );
    scanLoopRef.current.start();
  }, [scanAnim]);

  const stopScanLine = useCallback((): void => {
    scanLoopRef.current?.stop();
  }, []);

  useEffect(() => {
    if (isActive && permission?.granted) {
      startScanLine();
    } else {
      stopScanLine();
    }
    return stopScanLine;
  }, [isActive, permission?.granted, startScanLine, stopScanLine]);

  const triggerRecognitionFlash = useCallback(
    (cardName: string): void => {
      setRecognizedName(cardName);
      flashAnimRef.current?.stop();
      flashOpacity.setValue(0);
      flashAnimRef.current = Animated.sequence([
        Animated.timing(flashOpacity, {
          toValue: 0.5,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.delay(FLASH_VISIBLE_MS - 300),
        Animated.timing(flashOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]);
      flashAnimRef.current.start(() => setRecognizedName(null));
    },
    [flashOpacity]
  );

  useEffect(() => {
    if (!isActive || !permission?.granted) return;

    const interval = setInterval(() => {
      void (async () => {
        if (isProcessingRef.current || !cameraRef.current) return;
        isProcessingRef.current = true;
        setIsScanning(true);
        try {
          Animated.timing(captureMaskOpacity, {
            toValue: 0.4,
            duration: 60,
            useNativeDriver: true,
          }).start();

          const photo = await cameraRef.current.takePictureAsync({
            quality: 0.25,
            skipProcessing: true,
            exif: false,
          });

          Animated.timing(captureMaskOpacity, {
            toValue: 0,
            duration: 180,
            useNativeDriver: true,
          }).start();
          if (!photo?.uri) return;

          const card = await processCardRecognition({ imageUri: photo.uri });
          if (!card) return;

          const cardKey = card.scryfallId ?? card.name ?? null;
          if (cardKey && cardKey === lastRecognizedIdRef.current) return;

          lastRecognizedIdRef.current = cardKey;
          setScanError(null);
          if (card.name) triggerRecognitionFlash(card.name);
          onCardRecognized?.(card);

          if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
          cooldownTimerRef.current = setTimeout(() => {
            lastRecognizedIdRef.current = null;
          }, COOLDOWN_MS);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Scan failed';
          setScanError(msg);
          if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
          errorTimerRef.current = setTimeout(() => setScanError(null), 4000);
        } finally {
          Animated.timing(captureMaskOpacity, {
            toValue: 0,
            duration: 180,
            useNativeDriver: true,
          }).start();
          setIsScanning(false);
          isProcessingRef.current = false;
        }
      })();
    }, SCAN_INTERVAL_MS);

    return () => {
      clearInterval(interval);
      if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    };
  }, [
    isActive,
    permission?.granted,
    onCardRecognized,
    triggerRecognitionFlash,
    captureMaskOpacity,
  ]);

  if (!permission) {
    return (
      <View style={[styles.container, styles.centered, style]}>
        <Ionicons name="camera-outline" size={40} color={colors.textMuted} />
        <Text style={styles.permText}>Requesting camera access…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.centered, style]}>
        <Ionicons name="camera-off-outline" size={40} color={colors.textMuted} />
        <Text style={styles.permText}>Camera access is required to scan cards.</Text>
        <Pressable
          style={styles.permBtn}
          onPress={() => {
            void requestPermission();
          }}
        >
          <Text style={styles.permBtnText}>Grant permission</Text>
        </Pressable>
      </View>
    );
  }

  const statusText = !isActive
    ? 'Camera paused'
    : isScanning
      ? 'Recognizing…'
      : mode === 'bulk'
        ? 'Hold card inside frame — auto-scanning'
        : 'Hold card steady — auto-scanning…';

  return (
    <View style={[styles.container, style]}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing={facing} flash="off" />

      <View style={styles.frame} pointerEvents="none">
        <View style={[styles.corner, styles.cornerTL]} />
        <View style={[styles.corner, styles.cornerTR]} />
        <View style={[styles.corner, styles.cornerBL]} />
        <View style={[styles.corner, styles.cornerBR]} />

        <Animated.View
          style={[
            styles.scanLine,
            {
              transform: [
                {
                  translateY: scanAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, FRAME_HEIGHT - 2],
                  }),
                },
              ],
            },
          ]}
        />
      </View>

      <Animated.View
        style={[styles.captureMask, { opacity: captureMaskOpacity }]}
        pointerEvents="none"
      />

      <Animated.View
        style={[styles.flashOverlay, { opacity: flashOpacity }]}
        pointerEvents="none"
      />

      {recognizedName ? (
        <View style={styles.recognizedBanner} pointerEvents="none">
          <Ionicons name="checkmark-circle" size={16} color="#fff" />
          <Text style={styles.recognizedText} numberOfLines={1}>
            {recognizedName}
          </Text>
        </View>
      ) : null}

      {scanError ? (
        <View style={styles.errorBanner} pointerEvents="none">
          <Ionicons name="alert-circle" size={13} color="#fca5a5" />
          <Text style={styles.errorText} numberOfLines={2}>
            {scanError}
          </Text>
        </View>
      ) : null}

      <View style={styles.statusBar} pointerEvents="none">
        <Text style={[styles.statusText, isScanning && styles.statusTextScanning]}>
          {statusText}
        </Text>
      </View>

      <Pressable
        style={({ pressed }) => [styles.flipBtn, pressed && styles.flipBtnPressed]}
        onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
        hitSlop={8}
      >
        <Ionicons name="camera-reverse-outline" size={22} color="#fff" />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#000',
    borderRadius: radius.xl,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  frame: {
    position: 'absolute',
    alignSelf: 'center',
    top: '50%',
    marginTop: -(FRAME_HEIGHT / 2),
    width: FRAME_WIDTH,
    height: FRAME_HEIGHT,
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderColor: colors.primaryAccent,
    borderTopLeftRadius: CORNER_RADIUS,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderColor: colors.primaryAccent,
    borderTopRightRadius: CORNER_RADIUS,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderColor: colors.primaryAccent,
    borderBottomLeftRadius: CORNER_RADIUS,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderColor: colors.primaryAccent,
    borderBottomRightRadius: CORNER_RADIUS,
  },
  scanLine: {
    position: 'absolute',
    top: 0,
    left: CORNER_SIZE / 2,
    right: CORNER_SIZE / 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.primaryAccent,
    shadowColor: colors.primaryAccent,
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 6,
    elevation: 4,
  },
  captureMask: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.success,
  },
  recognizedBanner: {
    position: 'absolute',
    bottom: 44,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16,185,129,0.9)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    maxWidth: '85%',
  },
  recognizedText: { color: '#fff', fontWeight: '700', fontSize: 13, flexShrink: 1 },
  errorBanner: {
    position: 'absolute',
    bottom: 30,
    left: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(127,29,29,0.88)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  errorText: { color: '#fca5a5', fontSize: 11, fontWeight: '500', flex: 1 },
  statusBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 7,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
  },
  statusText: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '500' },
  statusTextScanning: { color: '#a5b4fc' },
  flipBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flipBtnPressed: { opacity: 0.65 },
  permText: { color: colors.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  permBtn: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  permBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});

export default LiveCameraView;
