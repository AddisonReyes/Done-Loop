import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useTranslation } from "@/i18n";

const bottomBarHeight = 52;

type FloatingCreateButtonProps = {
  onPress: () => void;
};

export function FloatingCreateButton({ onPress }: FloatingCreateButtonProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Pressable
      accessibilityLabel={t("common.create")}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: theme.accent,
          borderColor: theme.borderStrong,
          bottom: insets.bottom + bottomBarHeight + Spacing.three,
          shadowColor: theme.glow,
        },
        pressed && styles.pressed,
      ]}
    >
      <MaterialCommunityIcons name="plus" size={28} color="#FFFFFF" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderRadius: 27,
    borderWidth: 1,
    height: 54,
    justifyContent: "center",
    position: "absolute",
    right: Spacing.three,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    width: 54,
    zIndex: 20,
    elevation: 12,
  },
  pressed: {
    opacity: 0.78,
  },
});
