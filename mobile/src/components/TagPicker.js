import React, { useMemo, useState } from 'react';
import {
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
import { useKeyboardScrollPadding } from '../hooks/useKeyboardScrollPadding';
import { colors, radius } from '../theme';

/**
 * Deterministic tag color from name — hue derived from char codes.
 */
const tagColor = (name) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) & 0xffffffff;
  const hue = Math.abs(hash) % 360;
  return { bg: `hsla(${hue},55%,30%,0.55)`, fg: `hsl(${hue},80%,80%)`, border: `hsla(${hue},60%,55%,0.4)` };
};

/**
 * TagPicker
 *
 * Props:
 *   tags        string[]          currently selected tags
 *   onChange    (tags: string[]) => void
 *   disabled    boolean
 *   compact     boolean  — if true, renders a smaller row (for review rows)
 */
const TagPicker = ({ tags = [], onChange, disabled = false, compact = false }) => {
  const { tagsList } = useCollection();
  const { contentPadding } = useKeyboardScrollPadding({ baseBottomPadding: 32 });
  const [sheetOpen, setSheetOpen] = useState(false);
  const [newTagText, setNewTagText] = useState('');

  const existing = useMemo(() => tagsList.map((t) => t.name), [tagsList]);

  const removeTag = (tag) => {
    if (disabled) return;
    onChange(tags.filter((t) => t !== tag));
  };

  const toggleTag = (name) => {
    const norm = name.trim().toLowerCase();
    if (!norm) return;
    if (tags.includes(norm)) {
      onChange(tags.filter((t) => t !== norm));
    } else {
      onChange([...tags, norm].slice(0, 20));
    }
  };

  const handleCreateTag = () => {
    const norm = newTagText.trim().toLowerCase();
    if (!norm || norm.length > 32) return;
    toggleTag(norm);
    setNewTagText('');
  };

  const suggestions = useMemo(() => {
    if (!newTagText.trim()) return existing.filter((n) => !tags.includes(n));
    const q = newTagText.trim().toLowerCase();
    return existing.filter((n) => n.includes(q) && !tags.includes(n));
  }, [newTagText, existing, tags]);

  return (
    <View>
      <View style={[styles.row, compact && styles.rowCompact]}>
        {tags.map((tag) => {
          const c = tagColor(tag);
          return (
            <View key={tag} style={[styles.chip, { backgroundColor: c.bg, borderColor: c.border }]}>
              <Text style={[styles.chipText, { color: c.fg }]} numberOfLines={1}>
                {tag}
              </Text>
              {!disabled ? (
                <Pressable onPress={() => removeTag(tag)} hitSlop={6}>
                  <Ionicons name="close" size={11} color={c.fg} />
                </Pressable>
              ) : null}
            </View>
          );
        })}
        {!disabled ? (
          <Pressable
            onPress={() => setSheetOpen(true)}
            style={[styles.addChip, compact && styles.addChipCompact]}
          >
            <Ionicons name="add" size={compact ? 13 : 15} color={colors.primaryAccent} />
            {!compact && tags.length === 0 ? (
              <Text style={styles.addChipText}>Add to collection</Text>
            ) : null}
          </Pressable>
        ) : null}
      </View>

      <Modal
        visible={sheetOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setSheetOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setSheetOpen(false)}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.kav}
          >
            <Pressable style={[styles.sheet, contentPadding]} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Add to collections</Text>

            <View style={styles.inputRow}>
              <View style={styles.inputWrap}>
                <Ionicons name="pricetag-outline" size={16} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="New collection name…"
                  placeholderTextColor={colors.textSubtle}
                  value={newTagText}
                  onChangeText={setNewTagText}
                  onSubmitEditing={handleCreateTag}
                  returnKeyType="done"
                  autoCorrect={false}
                  autoCapitalize="none"
                />
                {newTagText.length > 0 ? (
                  <Pressable onPress={handleCreateTag} style={styles.createBtn}>
                    <Text style={styles.createBtnText}>Create</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>

            <ScrollView
              style={styles.listScroll}
              showsVerticalScrollIndicator={false}
              keyboardDismissMode="on-drag"
            >
              {suggestions.length > 0 ? (
                <>
                  <Text style={styles.listHeader}>
                    {newTagText.trim() ? 'Matching' : 'Your collections'}
                  </Text>
                  {suggestions.map((name) => {
                    const c = tagColor(name);
                    return (
                      <Pressable
                        key={name}
                        onPress={() => toggleTag(name)}
                        style={({ pressed }) => [
                          styles.listItem,
                          pressed && styles.listItemPressed,
                        ]}
                      >
                        <View style={[styles.listDot, { backgroundColor: c.bg, borderColor: c.border }]}>
                          <Text style={[styles.listDotText, { color: c.fg }]}>
                            {name.slice(0, 2).toUpperCase()}
                          </Text>
                        </View>
                        <Text style={styles.listItemText}>{name}</Text>
                        {tags.includes(name) ? (
                          <Ionicons name="checkmark" size={16} color={colors.success} />
                        ) : null}
                      </Pressable>
                    );
                  })}
                </>
              ) : null}

              {tags.length > 0 ? (
                <>
                  <Text style={styles.listHeader}>Selected</Text>
                  {tags.map((name) => {
                    const c = tagColor(name);
                    return (
                      <Pressable
                        key={name}
                        onPress={() => toggleTag(name)}
                        style={({ pressed }) => [
                          styles.listItem,
                          styles.listItemSelected,
                          pressed && styles.listItemPressed,
                        ]}
                      >
                        <View style={[styles.listDot, { backgroundColor: c.bg, borderColor: c.border }]}>
                          <Text style={[styles.listDotText, { color: c.fg }]}>
                            {name.slice(0, 2).toUpperCase()}
                          </Text>
                        </View>
                        <Text style={styles.listItemText}>{name}</Text>
                        <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                      </Pressable>
                    );
                  })}
                </>
              ) : null}

              {suggestions.length === 0 && tags.length === 0 ? (
                <View style={styles.emptyHint}>
                  <Ionicons name="pricetag-outline" size={24} color={colors.textMuted} />
                  <Text style={styles.emptyHintText}>
                    Type a name above to create your first collection.
                  </Text>
                </View>
              ) : null}
            </ScrollView>

            <Pressable
              onPress={() => { setSheetOpen(false); setNewTagText(''); }}
              style={styles.doneBtn}
            >
              <Text style={styles.doneBtnText}>Done</Text>
            </Pressable>
          </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
    </View>
  );
};

export default TagPicker;

export { tagColor };

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  rowCompact: {
    gap: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    maxWidth: 140,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 1,
  },
  addChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.35)',
    backgroundColor: colors.primarySoft,
  },
  addChipCompact: {
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  addChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primaryAccent,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  kav: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.backgroundElevated,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    maxHeight: '75%',
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 14,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  inputRow: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  inputWrap: {
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
    paddingVertical: 11,
    fontSize: 14,
    color: colors.text,
  },
  createBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
  },
  createBtnText: {
    color: colors.primaryAccent,
    fontSize: 12,
    fontWeight: '700',
  },
  listScroll: {
    maxHeight: 280,
    paddingHorizontal: 16,
  },
  listHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 4,
    marginBottom: 6,
    marginLeft: 4,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: radius.md,
    marginBottom: 2,
  },
  listItemSelected: {
    backgroundColor: colors.primarySoft,
  },
  listItemPressed: {
    backgroundColor: colors.primarySoft,
  },
  listDot: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listDotText: {
    fontSize: 11,
    fontWeight: '800',
  },
  listItemText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  emptyHint: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 28,
  },
  emptyHintText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
  },
  doneBtn: {
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.3)',
    paddingVertical: 13,
    alignItems: 'center',
  },
  doneBtnText: {
    color: colors.primaryAccent,
    fontSize: 15,
    fontWeight: '700',
  },
});
