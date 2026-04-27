import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import PrimaryButton from '../components/PrimaryButton';
import { useCollection } from '../context/CollectionContext';
import { autocompleteCardName } from '../services/scryfallService';
import useImagePicker from '../hooks/useImagePicker';
import { useKeyboardScrollPadding } from '../hooks/useKeyboardScrollPadding';
import { colors, gradients, radius } from '../theme';

const ScanScreen = ({ navigation }) => {
  const { imageUri, pickFromLibrary, takePhoto, reset } = useImagePicker();
  const { recognizeCard } = useCollection();

  const [cardName, setCardName] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState(null);
  const { scrollRef, contentPadding, scrollToEnd } = useKeyboardScrollPadding({
    baseBottomPadding: 32,
  });
  const autocompleteTimer = useRef(null);

  useEffect(() => {
    clearTimeout(autocompleteTimer.current);
    if (cardName.length < 2) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    autocompleteTimer.current = setTimeout(async () => {
      try {
        const results = await autocompleteCardName(cardName);
        if (!cancelled) setSuggestions(results.slice(0, 6));
      } catch {
        if (!cancelled) setSuggestions([]);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(autocompleteTimer.current);
    };
  }, [cardName]);

  const runOcrOnImage = async (uri) => {
    setOcrLoading(true);
    setError(null);
    try {
      const card = await recognizeCard({ imageUri: uri });
      navigation.navigate('CardDetails', { card, fromScan: true });
      reset();
      setCardName('');
    } catch {
      setError('Could not auto-identify card. Please type the name below.');
    } finally {
      setOcrLoading(false);
    }
  };

  const handleTakePhoto = async () => {
    setError(null);
    try {
      const uri = await takePhoto();
      if (uri) await runOcrOnImage(uri);
    } catch (err) {
      setError(err?.message || 'Failed to access camera.');
    }
  };

  const handlePickFromLibrary = async () => {
    setError(null);
    try {
      const uri = await pickFromLibrary();
      if (uri) await runOcrOnImage(uri);
    } catch (err) {
      setError(err?.message || 'Failed to open library.');
    }
  };

  const handleFindByName = async () => {
    if (!cardName.trim()) return;
    setSearchLoading(true);
    setError(null);
    setSuggestions([]);
    try {
      const card = await recognizeCard({ cardName: cardName.trim() });
      navigation.navigate('CardDetails', { card, fromScan: true });
      reset();
      setCardName('');
    } catch (err) {
      setError(err?.message || 'Card not found on Scryfall.');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSuggestionPress = (name) => {
    setCardName(name);
    setSuggestions([]);
  };

  const isLoading = ocrLoading || searchLoading;

  return (
    <LinearGradient colors={gradients.background} style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[styles.scroll, contentPadding]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Scan a Card</Text>
            <Text style={styles.subtitle}>
              Snap a photo, pick from your library, or type a card name to look it up.
            </Text>
          </View>

          <View style={styles.preview}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
            ) : (
              <View style={styles.placeholderInner}>
                <View style={styles.placeholderIconWrap}>
                  <Ionicons name="scan-outline" size={32} color={colors.primaryAccent} />
                </View>
                <Text style={styles.placeholder}>No image yet</Text>
                <Text style={styles.placeholderHint}>Camera or library</Text>
              </View>
            )}
            {ocrLoading ? (
              <View style={styles.ocrOverlay}>
                <ActivityIndicator size="large" color="#fff" />
                <Text style={styles.ocrOverlayText}>Recognizing card…</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.actionRow}>
            <ActionButton
              icon="camera"
              label="Camera"
              onPress={handleTakePhoto}
              disabled={isLoading}
            />
            <ActionButton
              icon="image"
              label="Library"
              onPress={handlePickFromLibrary}
              disabled={isLoading}
            />
          </View>

          <Pressable
            onPress={() => navigation.navigate('BulkScan')}
            disabled={isLoading}
            style={({ pressed }) => [
              styles.bulkBanner,
              isLoading && styles.bulkBannerDisabled,
              pressed && styles.bulkBannerPressed,
            ]}
          >
            <View style={styles.bulkIconWrap}>
              <Ionicons name="layers" size={20} color={colors.primaryAccent} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.bulkTitle}>Bulk scan mode</Text>
              <Text style={styles.bulkSubtitle}>
                Capture many cards in a row, review and save them all at once.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate('AddCards')}
            disabled={isLoading}
            style={({ pressed }) => [
              styles.bulkBanner,
              isLoading && styles.bulkBannerDisabled,
              pressed && styles.bulkBannerPressed,
            ]}
          >
            <View style={styles.bulkIconWrap}>
              <Ionicons name="search" size={20} color={colors.primaryAccent} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.bulkTitle}>Add cards by name</Text>
              <Text style={styles.bulkSubtitle}>
                Search or paste a decklist — no camera needed.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR SEARCH BY NAME</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.inputWrapper}>
            <View style={styles.inputContainer}>
              <Ionicons
                name="search"
                size={18}
                color={colors.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="e.g. Lightning Bolt"
                placeholderTextColor={colors.textSubtle}
                value={cardName}
                onChangeText={setCardName}
                onFocus={scrollToEnd}
                onSubmitEditing={handleFindByName}
                returnKeyType="search"
                editable={!isLoading}
                autoCorrect={false}
              />
              {cardName.length > 0 ? (
                <Pressable
                  hitSlop={8}
                  onPress={() => {
                    setCardName('');
                    setSuggestions([]);
                  }}
                >
                  <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                </Pressable>
              ) : null}
            </View>
            {suggestions.length > 0 ? (
              <View style={styles.suggestions}>
                {suggestions.map((name, idx) => (
                  <Pressable
                    key={name}
                    onPress={() => handleSuggestionPress(name)}
                    style={({ pressed }) => [
                      styles.suggestionItem,
                      idx !== suggestions.length - 1 && styles.suggestionItemDivider,
                      pressed && styles.suggestionItemPressed,
                    ]}
                  >
                    <Ionicons name="search" size={14} color={colors.textMuted} />
                    <Text style={styles.suggestionText}>{name}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>

          <PrimaryButton
            title="Find Card"
            onPress={handleFindByName}
            loading={searchLoading}
            disabled={!cardName.trim() || isLoading}
            iconRight="arrow-forward"
            style={styles.findButton}
          />

          {error ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={16} color="#fca5a5" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const ActionButton = ({ icon, label, onPress, disabled }) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    style={({ pressed }) => [
      actionStyles.btn,
      disabled && actionStyles.disabled,
      pressed && actionStyles.pressed,
    ]}
  >
    <View style={actionStyles.iconWrap}>
      <Ionicons name={icon} size={22} color={colors.primaryAccent} />
    </View>
    <Text style={actionStyles.label}>{label}</Text>
  </Pressable>
);

const actionStyles = StyleSheet.create({
  btn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: colors.backgroundCardSolid,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },
});

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  header: {
    marginBottom: 18,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
  },
  preview: {
    height: 240,
    borderRadius: radius.xl,
    backgroundColor: colors.backgroundCardSolid,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  placeholder: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  placeholderHint: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  ocrOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,10,31,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  ocrOverlayText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  bulkBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.backgroundCardSolid,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.25)',
    padding: 14,
    marginBottom: 22,
  },
  bulkBannerDisabled: {
    opacity: 0.5,
  },
  bulkBannerPressed: {
    opacity: 0.85,
  },
  bulkIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulkTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  bulkSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
    lineHeight: 16,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginHorizontal: 12,
    letterSpacing: 1,
  },
  inputWrapper: {
    position: 'relative',
    marginBottom: 12,
    zIndex: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundCardSolid,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
  },
  suggestions: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    backgroundColor: colors.backgroundElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  suggestionItemDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  suggestionItemPressed: {
    backgroundColor: colors.primarySoft,
  },
  suggestionText: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  findButton: {
    marginTop: 6,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    borderRadius: radius.md,
    padding: 12,
    marginTop: 12,
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 13,
    flex: 1,
  },
});

export default ScanScreen;
