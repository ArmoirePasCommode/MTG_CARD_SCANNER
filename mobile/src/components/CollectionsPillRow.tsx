import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCollection } from '../context/CollectionContext';
import { tagColor } from './TagPicker';
import { colors, radius } from '../theme';
import type { TagInfo } from '../types/api';

/**
 * Horizontal scrollable pill row for switching the active collection (tag).
 * Renders above CollectionToolbar on HomeScreen.
 */
const CollectionsPillRow = (): React.JSX.Element => {
  const { cards, tagsList, activeTag, setActiveTag, renameTagEverywhere, deleteTagEverywhere } =
    useCollection();

  const [renameModalTag, setRenameModalTag] = useState<string | null>(null);
  const [renameText, setRenameText] = useState('');

  const totalCards = cards.length;
  const activeCount =
    activeTag === null
      ? totalCards
      : cards.filter((c) => Array.isArray(c.tags) && c.tags.includes(activeTag)).length;

  const handleLongPress = (tag: TagInfo): void => {
    Alert.alert(`"${tag.name}"`, 'What would you like to do with this collection?', [
      {
        text: 'Rename',
        onPress: () => {
          setRenameText(tag.name);
          setRenameModalTag(tag.name);
        },
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          Alert.alert(
            'Delete collection?',
            `This removes the tag "${tag.name}" from all ${tag.count} card${tag.count === 1 ? '' : 's'}. Cards are not deleted.`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: () => {
                  void deleteTagEverywhere(tag.name);
                },
              },
            ]
          );
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleRename = async (): Promise<void> => {
    const to = renameText.trim().toLowerCase();
    if (!to || to === renameModalTag) {
      setRenameModalTag(null);
      return;
    }
    if (renameModalTag) {
      await renameTagEverywhere(renameModalTag, to);
    }
    setRenameModalTag(null);
    setRenameText('');
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <Pressable
          onPress={() => setActiveTag(null)}
          style={({ pressed }) => [
            styles.pill,
            activeTag === null && styles.pillActive,
            pressed && styles.pillPressed,
          ]}
        >
          <Text style={[styles.pillText, activeTag === null && styles.pillTextActive]}>All</Text>
          <View style={[styles.badge, activeTag === null && styles.badgeActive]}>
            <Text style={[styles.badgeText, activeTag === null && styles.badgeTextActive]}>
              {totalCards}
            </Text>
          </View>
        </Pressable>

        {tagsList.map((tag) => {
          const isActive = activeTag === tag.name;
          const c = tagColor(tag.name);
          return (
            <Pressable
              key={tag.name}
              onPress={() => setActiveTag(isActive ? null : tag.name)}
              onLongPress={() => handleLongPress(tag)}
              delayLongPress={400}
              style={({ pressed }) => [
                styles.pill,
                isActive && { backgroundColor: c.bg, borderColor: c.border },
                pressed && styles.pillPressed,
              ]}
            >
              <Text
                style={[styles.pillText, isActive && { color: c.fg, fontWeight: '700' as const }]}
                numberOfLines={1}
              >
                {tag.name}
              </Text>
              <View style={[styles.badge, isActive && { backgroundColor: c.border }]}>
                <Text style={[styles.badgeText, isActive && { color: c.fg }]}>{tag.count}</Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {activeTag !== null ? (
        <View style={styles.activeHint}>
          <Ionicons name="funnel" size={11} color={colors.primaryAccent} />
          <Text style={styles.activeHintText}>
            Showing {activeCount} of {totalCards} card{totalCards !== 1 ? 's' : ''}
          </Text>
          <Pressable onPress={() => setActiveTag(null)} hitSlop={8}>
            <Ionicons name="close-circle" size={14} color={colors.textMuted} />
          </Pressable>
        </View>
      ) : null}

      <Modal
        visible={renameModalTag !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setRenameModalTag(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalKav}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setRenameModalTag(null)}>
            <Pressable style={styles.modalBox} onPress={() => {}}>
              <Text style={styles.modalTitle}>Rename collection</Text>
              <TextInput
                style={styles.modalInput}
                value={renameText}
                onChangeText={setRenameText}
                autoFocus
                autoCapitalize="none"
                autoCorrect={false}
                onSubmitEditing={() => {
                  void handleRename();
                }}
                returnKeyType="done"
                placeholderTextColor={colors.textSubtle}
              />
              <View style={styles.modalActions}>
                <Pressable
                  onPress={() => setRenameModalTag(null)}
                  style={[styles.modalBtn, styles.modalBtnCancel]}
                >
                  <Text style={styles.modalBtnCancelText}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    void handleRename();
                  }}
                  style={[styles.modalBtn, styles.modalBtnConfirm]}
                >
                  <Text style={styles.modalBtnConfirmText}>Rename</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

export default CollectionsPillRow;

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundCardSolid,
  },
  pillActive: {
    borderColor: 'rgba(167,139,250,0.5)',
    backgroundColor: colors.primarySoft,
  },
  pillPressed: {
    opacity: 0.8,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textMuted,
  },
  pillTextActive: {
    color: colors.primaryAccent,
    fontWeight: '700',
  },
  badge: {
    minWidth: 20,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeActive: {
    backgroundColor: 'rgba(167,139,250,0.25)',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },
  badgeTextActive: {
    color: colors.primaryAccent,
  },
  activeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
  activeHintText: {
    flex: 1,
    fontSize: 12,
    color: colors.textMuted,
  },
  modalKav: {
    flex: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBox: {
    width: '82%',
    backgroundColor: colors.backgroundElevated,
    borderRadius: radius.xl,
    padding: 20,
    gap: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  modalInput: {
    backgroundColor: colors.backgroundCardSolid,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: colors.text,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  modalBtnCancel: {
    backgroundColor: colors.backgroundCardSolid,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalBtnCancelText: {
    color: colors.textMuted,
    fontWeight: '600',
    fontSize: 14,
  },
  modalBtnConfirm: {
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.35)',
  },
  modalBtnConfirmText: {
    color: colors.primaryAccent,
    fontWeight: '700',
    fontSize: 14,
  },
});
