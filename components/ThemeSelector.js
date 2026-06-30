import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';

const THEMES = [
  { id: 'sunset', icon: '🌅', name: 'Sunset', subtitle: 'Slow Burn' },
  { id: 'lunar', icon: '🌑', name: 'Lunar', subtitle: 'Moon Phases' },
  { id: 'candle', icon: '🕯️', name: 'Candlelight', subtitle: 'Dark Academia' },
  { id: 'stars', icon: '✨', name: 'Starlight', subtitle: 'Deep Space' },
  { id: 'rain', icon: '🌧️', name: 'Heavy Rain', subtitle: 'Lofi Window' },
];

export default function ThemeSelector({ onBack, onLaunch }) {
  const [selectedTheme, setSelectedTheme] = useState('sunset');

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← BACK</Text>
        </TouchableOpacity>
        <Text style={styles.titleText}>ENVIRONMENT</Text>
        <View style={styles.placeholderSpace} />
      </View>

      {/* Theme List */}
      <ScrollView 
        style={styles.listContainer} 
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {THEMES.map((theme) => {
          const isActive = selectedTheme === theme.id;
          return (
            <TouchableOpacity
              key={theme.id}
              style={[styles.themeCard, isActive && styles.activeCard]}
              onPress={() => setSelectedTheme(theme.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.themeIcon}>{theme.icon}</Text>
              <View style={styles.textStack}>
                <Text style={[styles.themeName, isActive && styles.activeText]}>{theme.name}</Text>
                <Text style={styles.themeSubtitle}>{theme.subtitle}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Footer Action */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.glassyLaunchButton} onPress={() => onLaunch(selectedTheme)}>
          <Text style={styles.glassyButtonText}>LAUNCH WORKSPACE ↗</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 30,
  },
  backButton: {
    paddingVertical: 8,
    paddingRight: 16,
  },
  backButtonText: {
    color: '#666666',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
  },
  titleText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '300',
    letterSpacing: 6,
  },
  placeholderSpace: {
    width: 60, // Balances the header alignment with the back button
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  listContent: {
    paddingBottom: 40,
  },
  themeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A0A0A',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1A1A1A',
    marginBottom: 16,
  },
  activeCard: {
    borderColor: '#FFFFFF',
    backgroundColor: '#121212',
  },
  themeIcon: {
    fontSize: 28,
    marginRight: 20,
  },
  textStack: {
    flex: 1,
  },
  themeName: {
    color: '#888888',
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 1,
    marginBottom: 4,
  },
  activeText: {
    color: '#FFFFFF',
  },
  themeSubtitle: {
    color: '#555555',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 50,
    paddingTop: 20,
  },
  glassyLaunchButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 3,
  },
  glassyButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 2,
  },
});