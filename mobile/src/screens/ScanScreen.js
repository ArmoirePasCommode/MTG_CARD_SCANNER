import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

import PrimaryButton from '../components/PrimaryButton';
import { useCollection } from '../context/CollectionContext';
import { autocompleteCardName } from '../services/scryfallService';
import useImagePicker from '../hooks/useImagePicker';

const ScanScreen = ({ navigation }) => {
  const { imageUri, pickFromLibrary, takePhoto, reset } = useImagePicker();
  const { recognizeCard } = useCollection();

  const [cardName, setCardName] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState(null);
  const autocompleteTimer = useRef(null);

  // When the user edits the name field, fetch Scryfall autocomplete suggestions
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

  const handleTakePhoto = async () => {
    setError(null);
    try {
      const uri = await takePhoto();
      if (uri) await runOcrOnImage(uri);
    } catch (err) {
      setError(err.message);
    }
  };

  const handlePickFromLibrary = async () => {
    setError(null);
    try {
      const uri = await pickFromLibrary();
      if (uri) await runOcrOnImage(uri);
    } catch (err) {
      setError(err.message);
    }
  };

  const runOcrOnImage = async (uri) => {
    setOcrLoading(true);
    setError(null);
    try {
      const card = await recognizeCard({ imageUri: uri });
      // OCR succeeded and Scryfall found a match — skip the review step
      navigation.navigate('CardDetails', { card, fromScan: true });
      reset();
      setCardName('');
    } catch (err) {
      // OCR partial failure: pre-fill what the backend extracted if available
      setError('Could not auto-identify card. Please type the name below.');
    } finally {
      setOcrLoading(false);
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
      setError(err.message || 'Card not found on Scryfall');
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
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Scan a Card</Text>
      <Text style={styles.subtitle}>
        Take a photo or upload an image — we'll read the card name automatically.
        Or type the name directly below.
      </Text>

      {/* Image preview */}
      <View style={styles.preview}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} />
        ) : (
          <Text style={styles.placeholder}>No image selected</Text>
        )}
        {ocrLoading && (
          <View style={styles.ocrOverlay}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.ocrOverlayText}>Recognizing card…</Text>
          </View>
        )}
      </View>

      {/* Camera / library buttons */}
      <View style={styles.row}>
        <TouchableOpacity style={[styles.iconButton, isLoading && styles.disabled]} onPress={handleTakePhoto} disabled={isLoading}>
          <Text style={styles.iconButtonIcon}>📷</Text>
          <Text style={styles.iconButtonLabel}>Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.iconButton, isLoading && styles.disabled]} onPress={handlePickFromLibrary} disabled={isLoading}>
          <Text style={styles.iconButtonIcon}>🖼️</Text>
          <Text style={styles.iconButtonLabel}>Library</Text>
        </TouchableOpacity>
      </View>

      {/* Divider */}
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or search by name</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Manual name input */}
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          placeholder="e.g. Lightning Bolt"
          placeholderTextColor="#9ca3af"
          value={cardName}
          onChangeText={setCardName}
          onSubmitEditing={handleFindByName}
          returnKeyType="search"
          editable={!isLoading}
        />
        {/* Autocomplete dropdown */}
        {suggestions.length > 0 && (
          <View style={styles.suggestions}>
            {suggestions.map((name) => (
              <TouchableOpacity key={name} style={styles.suggestionItem} onPress={() => handleSuggestionPress(name)}>
                <Text style={styles.suggestionText}>{name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <PrimaryButton
        title="Find Card"
        onPress={handleFindByName}
        loading={searchLoading}
        disabled={!cardName.trim() || isLoading}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fefefe'
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 6,
    color: '#111827'
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
    lineHeight: 20
  },
  preview: {
    height: 220,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
    overflow: 'hidden'
  },
  image: {
    width: '100%',
    height: '100%'
  },
  placeholder: {
    color: '#9ca3af',
    fontSize: 14
  },
  ocrOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10
  },
  ocrOverlayText: {
    color: '#fff',
    fontWeight: '600'
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20
  },
  iconButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#f9fafb'
  },
  iconButtonIcon: {
    fontSize: 24,
    marginBottom: 4
  },
  iconButtonLabel: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500'
  },
  disabled: {
    opacity: 0.5
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb'
  },
  dividerText: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500'
  },
  inputWrapper: {
    position: 'relative',
    marginBottom: 12,
    zIndex: 10
  },
  input: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 14,
    fontSize: 15,
    backgroundColor: '#fff',
    color: '#111827'
  },
  suggestions: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 6
  },
  suggestionItem: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6'
  },
  suggestionText: {
    fontSize: 14,
    color: '#111827'
  },
  error: {
    color: '#dc2626',
    marginTop: 12,
    fontSize: 14
  }
});

export default ScanScreen;
