import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card as PaperCard } from 'react-native-paper';

export const Card = ({
  children,
  style,
  variant,
}: {
  children: React.ReactNode;
  style?: any;
  variant?: 'default' | 'alert' | 'info' | 'success' | 'gradient';
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const getVariantStyle = () => {
    switch (variant) {
      case 'alert':
        return { 
          borderColor: colors.warning, 
          backgroundColor: colors.tintSoft,
          borderWidth: 2,
        };
      case 'info':
        return { 
          borderColor: colors.info, 
          backgroundColor: colors.surfaceMuted,
          borderWidth: 1,
        };
      case 'success':
        return { 
          borderColor: colors.success, 
          backgroundColor: colors.tintSoft,
          borderWidth: 1,
        };
      case 'gradient':
        return {
          backgroundColor: colors.card,
          borderWidth: 0,
        };
      default:
        return null;
    }
  };

  return (
    <View 
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          boxShadow: colorScheme === 'dark' 
            ? '0 4px 12px rgba(0, 0, 0, 0.3)' 
            : '0 4px 12px rgba(15, 23, 42, 0.1)',
        },
        getVariantStyle(),
        style,
      ]}
    >
      <PaperCard.Content style={styles.content}>{children}</PaperCard.Content>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    marginBottom: 16,
    elevation: 3,
    borderWidth: 1,
  },
  content: {
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  pressable: {
    cursor: 'pointer',
  },
  alert: {
    borderLeftWidth: 4,
  },
  info: {},
});

export default Card;