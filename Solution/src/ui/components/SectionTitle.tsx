import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {colors} from '../theme/colors';

export function SectionTitle({title, subtitle}: {title: string; subtitle: string}) {
  return (
    <View style={styles.sectionTitle}>
      <Text style={styles.sectionHeading}>{title}</Text>
      <Text style={styles.sectionSubtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {marginBottom: 14},
  sectionHeading: {color: colors.text, fontSize: 20, fontWeight: '800'},
  sectionSubtitle: {color: '#627d98', fontSize: 14, lineHeight: 20, marginTop: 4},
});
