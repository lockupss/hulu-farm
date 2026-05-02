import React from 'react';
import { StyleSheet, View } from 'react-native';

const Card = ({
  children,
  style,
  variant,
}: {
  children: React.ReactNode;
  style?: any;
  variant?: 'default' | 'alert' | 'info';
}) => {
  const variantStyle =
    variant === 'alert'
      ? styles.alert
      : variant === 'info'
      ? styles.info
      : null;

  return <View style={[styles.card, variantStyle, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14, // match button roundness
    padding: 16,
    marginBottom: 14,

    // subtle modern shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,

    // light border for cleaner look
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },

  alert: {
    borderColor: '#fde68a',
    backgroundColor: '#fffbeb',
  },

  info: {
    borderColor: '#bfdbfe',
    backgroundColor: '#eff6ff',
  },
});

export default Card;