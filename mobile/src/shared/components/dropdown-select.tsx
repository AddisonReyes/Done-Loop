import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type DropdownOption<T extends string> = {
  label: string;
  value: T;
};

type DropdownSelectProps<T extends string> = {
  label: string;
  options: DropdownOption<T>[];
  value: T;
  onChange: (value: T) => void;
};

export function DropdownSelect<T extends string>({
  label,
  onChange,
  options,
  value,
}: DropdownSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const selectedOption = options.find((option) => option.value === value) ?? options[0];

  const handleChange = (nextValue: T) => {
    onChange(nextValue);
    setIsOpen(false);
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={() => setIsOpen(true)}
        style={({ pressed }) => [
          styles.trigger,
          {
            backgroundColor: theme.surfaceSoft,
            borderColor: theme.border,
          },
          pressed && styles.pressed,
        ]}>
        <View>
          <ThemedText type="smallBold">{selectedOption.label}</ThemedText>
        </View>
        <MaterialCommunityIcons name="chevron-down" size={20} color={theme.textSecondary} />
      </Pressable>

      <Modal animationType="fade" transparent visible={isOpen} onRequestClose={() => setIsOpen(false)}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.backdrop} onPress={() => setIsOpen(false)} />
          <View
            style={[
              styles.sheet,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: theme.border,
                paddingBottom: insets.bottom + Spacing.three,
                shadowColor: theme.glow,
              },
            ]}>
            <ThemedText type="smallBold">{label}</ThemedText>
            <View style={styles.options}>
              {options.map((option) => {
                const selected = option.value === value;

                return (
                  <Pressable
                    key={option.value}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => handleChange(option.value)}
                    style={({ pressed }) => [
                      styles.option,
                      {
                        backgroundColor: selected ? theme.accentSoft : theme.backgroundSelected,
                        borderColor: selected ? theme.borderStrong : theme.border,
                      },
                      pressed && styles.pressed,
                    ]}>
                    <ThemedText type="smallBold" themeColor={selected ? 'accentStrong' : 'text'}>
                      {option.label}
                    </ThemedText>
                    {selected ? (
                      <MaterialCommunityIcons name="check" size={20} color={theme.accentStrong} />
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
    minHeight: 58,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.52)',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    gap: Spacing.three,
    padding: Spacing.three,
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  options: {
    gap: Spacing.two,
  },
  option: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 52,
    paddingHorizontal: Spacing.three,
  },
  pressed: {
    opacity: 0.72,
  },
});
