import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard } from 'react-native';

/**
 * Pairs with ScrollView / FlatList / SectionList: extra bottom padding when the keyboard
 * is open, plus optional scrollToEnd on focus (used from TextInput onFocus).
 * Same pattern as ScanScreen — see app.json `android.softwareKeyboardLayoutMode: "resize"`.
 */
export function useKeyboardScrollPadding({ baseBottomPadding = 32 } = {}) {
  const [keyboardInset, setKeyboardInset] = useState(0);
  const scrollRef = useRef(null);

  useEffect(() => {
    const onShow = (e) => setKeyboardInset(e.endCoordinates?.height ?? 0);
    const onHide = () => setKeyboardInset(0);
    const s = Keyboard.addListener('keyboardDidShow', onShow);
    const h = Keyboard.addListener('keyboardDidHide', onHide);
    return () => {
      s.remove();
      h.remove();
    };
  }, []);

  const contentPadding = useMemo(
    () => ({ paddingBottom: baseBottomPadding + keyboardInset }),
    [baseBottomPadding, keyboardInset]
  );

  const scrollToEnd = useCallback((delay = 80) => {
    requestAnimationFrame(() => {
      setTimeout(() => {
        const node = scrollRef.current;
        if (node && typeof node.scrollToEnd === 'function') {
          node.scrollToEnd({ animated: true });
        }
      }, delay);
    });
  }, []);

  return { scrollRef, keyboardInset, contentPadding, scrollToEnd };
}
