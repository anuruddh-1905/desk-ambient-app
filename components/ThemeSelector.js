import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Modal } from 'react-native';

const THEMES = [
  { id: 'sunset', icon: '🌅', name: 'Sunset', subtitle: 'Slow Burn' },
  { id: 'lunar', icon: '🌑', name: 'Lunar', subtitle: 'Moon Phases' },
  /*{ id: 'digital', icon: '⏱️', name: 'Digital Glow', subtitle: 'Neon Focus' },
  { id: 'stars', icon: '✨', name: 'Starlight', subtitle: 'Deep Space' },
  { id: 'rain', icon: '🌧️', name: 'Heavy Rain', subtitle: 'Lofi Window' },*/
];

// Split into three parts so VERSION 1.0 and the Email line can carry their
// own distinct typography — the rest of the paragraphs share one body style.
const NOTE_VERSION_LINE = 'VERSION 1.0';

const NOTE_BODY = `Thank you for trying the first version of this app.

I hope it brings a little more calm to your workspace and earns a small place on your desk.

This is just the beginning. I'll keep adding new environments, refining the experience, and improving the little details over time.

If something feels off, if you have an idea you'd love to see, or even if you simply enjoyed using it, I'd genuinely love to hear from you. I read every email myself, and every message helps shape where this project goes next.`;

const NOTE_EMAIL_LABEL = 'Email: ';
const NOTE_EMAIL_ADDRESS = 'anuruddhpratap67@gmail.com';

const NOTE_CLOSING = 'Thank you for giving this little project a place on your desk.';

export default function ThemeSelector({ onBack, onLaunch }) {
  const [selectedTheme, setSelectedTheme] = useState('sunset');
  const [isNoteVisible, setIsNoteVisible] = useState(false); // NEW: modal toggle state

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerSideLeft} onPress={onBack}>
          <Text style={styles.backButtonText}>← BACK</Text>
        </TouchableOpacity>

        <Text style={styles.titleText}>ENVIRONMENT</Text>

        <View style={styles.headerSideRight}>
          <TouchableOpacity
            style={styles.infoButton}
            onPress={() => setIsNoteVisible(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.infoButtonText}>i</Text>
          </TouchableOpacity>
        </View>
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

      {/* NEW: Developer Note modal overlay */}
      <Modal
        visible={isNoteVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsNoteVisible(false)}
        statusBarTranslucent
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>D E V E L O P E R{'   '}N O T E</Text>

            <ScrollView
              style={styles.modalScroll}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.modalVersion}>{NOTE_VERSION_LINE}</Text>
              <Text style={styles.modalMessage}>{'\n' + NOTE_BODY}</Text>
              <Text style={styles.modalMessage}>
                {'\n\n'}
                <Text style={styles.modalEmailLabel}>{NOTE_EMAIL_LABEL}</Text>
                {NOTE_EMAIL_ADDRESS}
              </Text>
              <Text style={styles.modalMessage}>{'\n\n' + NOTE_CLOSING}</Text>
            </ScrollView>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setIsNoteVisible(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.glassyButtonText}>CLOSE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    paddingTop: 68,
    paddingBottom: 30,
  },
  // NEW: equal-width flex containers on both sides guarantee the title
  // stays visually centered no matter how wide "← BACK" or the info
  // button end up being — fixes the title drifting off-center.
  headerSideLeft: {
    flex: 1,
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  headerSideRight: {
    flex: 1,
    alignItems: 'flex-end',
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
    textAlign: 'center',
  },
  // NEW: replaces placeholderSpace (was: { width: 60 })
  infoButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoButtonText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    fontWeight: '600',
    fontStyle: 'italic',
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

  // NEW: Developer Note modal styles — matches the app's dark, glassy,
  // spaced-out typographic language.
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    maxHeight: '78%',
    backgroundColor: '#0A0A0A',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2C2C2E',
    paddingTop: 28,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 3,
    fontSize: 17,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalScroll: {
    marginBottom: 20,
  },
  modalVersion: {
    color: '#C7C7CC',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  modalMessage: {
    color: '#F2F2F7',
    fontSize: 14,
    lineHeight: 22,
    letterSpacing: 0.3,
    fontWeight: '400',
  },
  modalEmailLabel: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  modalCloseButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
});