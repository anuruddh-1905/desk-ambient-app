import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  Keyboard, 
  TouchableWithoutFeedback, 
  StatusBar 
} from 'react-native';
import { useKeepAwake } from 'expo-keep-awake';

// Components
import ThemeSelector from '../components/ThemeSelector';
import SunsetCanvas from '../components/SunsetCanvas';
import EclipseCanvas from '../components/EclipseCanvas';
import DigitalGlowCanvas from '../components/DigitalGlowCanvas';

// Hooks
import { useTimerEngine } from '../hooks/useTimerEngine';

/**
 * AmbientScreen - Main Entry Point
 */
const AmbientScreen = () => {
  useKeepAwake();

  // 1. STATE INITIALIZATIONS
  const [currentStep, setCurrentStep] = useState('input'); // 'input' | 'theme' | 'active'
  const [hours, setHours] = useState('00');
  const [minutes, setMinutes] = useState('00');
  const [seconds, setSeconds] = useState('00');
  const [activeTheme, setActiveTheme] = useState(null); 

  // 2. TIMER ENGINE
  const isEngineActive = currentStep === 'active';
  const { progress, isCompleted } = useTimerEngine(
    hours, 
    minutes, 
    seconds, 
    isEngineActive, 
    () => { console.log("Session completed."); }
  );

  // 3. INPUT UTILITY OPERATIONS
  const handleTextChange = (text, setter) => {
    const cleanNum = text.replace(/[^0-9]/g, '');
    if (cleanNum.length <= 2) {
      setter(cleanNum);
    }
  };

  const handleBlur = (value, setter) => {
    if (!value || value.trim() === '') {
      setter('00');
    } else {
      setter(value.padStart(2, '0'));
    }
  };

  const totalSeconds = (parseInt(hours || '0', 10) * 3600) + 
                       (parseInt(minutes || '0', 10) * 60) + 
                       parseInt(seconds || '0', 10);

  const isTimeValid = totalSeconds > 0;

  // 4. RENDER HELPERS
  const renderActiveCanvas = () => {
    switch(activeTheme) {
      case 'lunar':
        return <EclipseCanvas progress={progress} isCompleted={isCompleted} />;
      case 'digital':
        return <DigitalGlowCanvas progress={progress} isCompleted={isCompleted} />;
      default:
        return <SunsetCanvas progress={progress} isCompleted={isCompleted} />;
    }
  };

  // 5. SCREEN ROUTING
  
  // THEME SELECTION SCREEN
  if (currentStep === 'theme') {
    return (
      <ThemeSelector 
        onBack={() => setCurrentStep('input')} 
        onLaunch={(selected) => {
          setActiveTheme(selected);
          setCurrentStep('active');
        }} 
      />
    );
  }

  // ACTIVE TIMER SCREEN
  if (currentStep === 'active') {
    return (
      <View style={[styles.container, styles.activeCanvas]}>
        <StatusBar hidden />
        
        {renderActiveCanvas()}
        
        <View style={styles.minimalExitWrapper}>
          <TouchableOpacity 
            style={styles.exitButton} 
            onPress={() => setCurrentStep('input')}
          >
            <Text style={styles.exitButtonText}>END SESSION</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // INPUT SETUP SCREEN (Default)
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#050505" translucent={false} />
        
        <Text style={styles.titleText}>DESK AMBIENT</Text>

        <View style={styles.inputRow}>
          <View style={styles.inputBoxContainer}>
            <TextInput
              style={styles.timeInput}
              keyboardType="number-pad"
              value={hours}
              onChangeText={(txt) => handleTextChange(txt, setHours)}
              onBlur={() => handleBlur(hours, setHours)}
              maxLength={2}
              selectTextOnFocus
            />
            <Text style={styles.inputLabel}>HR</Text>
          </View>

          <Text style={styles.colonDivider}>:</Text>

          <View style={styles.inputBoxContainer}>
            <TextInput
              style={styles.timeInput}
              keyboardType="number-pad"
              value={minutes}
              onChangeText={(txt) => handleTextChange(txt, setMinutes)}
              onBlur={() => handleBlur(minutes, setMinutes)}
              maxLength={2}
              selectTextOnFocus
            />
            <Text style={styles.inputLabel}>MIN</Text>
          </View>

          <Text style={styles.colonDivider}>:</Text>

          <View style={styles.inputBoxContainer}>
            <TextInput
              style={styles.timeInput}
              keyboardType="number-pad"
              value={seconds}
              onChangeText={(txt) => handleTextChange(txt, setSeconds)}
              onBlur={() => handleBlur(seconds, setSeconds)}
              maxLength={2}
              selectTextOnFocus
            />
            <Text style={styles.inputLabel}>SEC</Text>
          </View>
        </View>

        {isTimeValid && (
          <TouchableOpacity 
            style={styles.glassyNextButton} 
            onPress={() => setCurrentStep('theme')}
            activeOpacity={0.7}
          >
            <Text style={styles.glassyButtonText}>NEXT ↗</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  activeCanvas: {
    backgroundColor: '#000000',
  },
  titleText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '300',
    letterSpacing: 6,
    marginBottom: 60,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 50,
  },
  inputBoxContainer: {
    alignItems: 'center',
    width: 85,
  },
  timeInput: {
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#222222',
    borderRadius: 14,
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '300',
    textAlign: 'center',
    width: '100%',
    paddingVertical: 16,
  },
  inputLabel: {
    color: '#444444',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.5,
    marginTop: 10,
  },
  colonDivider: {
    color: '#333333',
    fontSize: 30,
    fontWeight: '300',
    marginHorizontal: 10,
    bottom: 12,
  },
  glassyNextButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 54,
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
  minimalExitWrapper: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    alignItems: 'center',
    zIndex: 99,
  },
  exitButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 6,
  },
  exitButtonText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 11,
    letterSpacing: 1,
  },
});

export default AmbientScreen;