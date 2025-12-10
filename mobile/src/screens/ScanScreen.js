import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';

import PrimaryButton from '../components/PrimaryButton';
import { useCollection } from '../context/CollectionContext';
import useImagePicker from '../hooks/useImagePicker';

const ScanScreen = ({ navigation }) => {
  const { imageUri, pickFromLibrary, takePhoto, reset } = useImagePicker();
  const { recognizeAndSaveCard } = useCollection();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleRecognition = async () => {
    if (!imageUri) return;
    setLoading(true);
    setError(null);
    try {
      const saved = await recognizeAndSaveCard({ imageUri });
      setResult(saved);
      navigation.navigate('CardDetails', { card: saved });
      reset();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Scan or upload a card</Text>
      <View style={styles.preview}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} />
        ) : (
          <Text style={styles.placeholder}>No image selected</Text>
        )}
      </View>
      <PrimaryButton title="Take Photo" onPress={takePhoto} />
      <PrimaryButton title="Upload from Library" onPress={pickFromLibrary} />
      <PrimaryButton
        title="Recognize & Save"
        onPress={handleRecognition}
        loading={loading}
        disabled={!imageUri}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {result ? (
        <View style={styles.result}>
          <Text style={styles.resultTitle}>Last saved card</Text>
          <Text style={styles.resultText}>{result.name}</Text>
          <Text style={styles.resultText}>{result.setName}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fefefe'
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12
  },
  preview: {
    height: 220,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb'
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 16
  },
  placeholder: {
    color: '#9ca3af'
  },
  error: {
    color: '#dc2626',
    marginTop: 12
  },
  result: {
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#ecfeff'
  },
  resultTitle: {
    fontWeight: '700',
    marginBottom: 4
  },
  resultText: {
    color: '#0369a1'
  }
});

export default ScanScreen;

