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
import { Feather } from '@expo/vector-icons';

// Components
import ThemeSelector from '../components/ThemeSelector';
import SunsetCanvas from '../components/SunsetCanvas';
import EclipseCanvas from '../components/EclipseCanvas';

// Hooks
import { useTimerEngine } from '../hooks/useTimerEngine';
import { useAudioManager } from '../hooks/useAudioManager';

/**
 * ActiveSession Component
 */
const ActiveSession = ({ hours, minutes, seconds, activeTheme, onExit }) => {
  const { progress, isCompleted } = useTimerEngine(
    hours, 
    minutes, 
    seconds, 
    true, 
    () => { console.log("Session completed."); }
  );

  // Audio engine now mounts ONLY when the timer is active
  useAudioManager(progress);

  // Local UI state for toggles 
  // (You will need to pass these to your audio/timer hooks to actually pause things later)
  const [isMuted, setIsMuted] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  const renderActiveCanvas = () => {
    switch(activeTheme) {
      case 'lunar':
        return <EclipseCanvas progress={progress} isCompleted={isCompleted} />;
      case 'sunset':
      default:
        return <SunsetCanvas progress={progress} isCompleted={isCompleted} />;
    }
  };

  return (
    <View style={[styles.container, styles.activeCanvas]}>
      <StatusBar hidden />
      
      {renderActiveCanvas()}
      
      {/* Bottom Right Controls */}
      <View style={styles.controlsWrapper}>
        <TouchableOpacity 
          style={styles.iconButton} 
          onPress={() => setIsMuted(!isMuted)}
          activeOpacity={0.6}
        >
          <Feather name={isMuted ? "volume-x" : "volume-2"} size={18} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.iconButton} 
          onPress={() => setIsPaused(!isPaused)}
          activeOpacity={0.6}
        >
          <Feather name={isPaused ? "play" : "pause"} size={18} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.exitButton} 
          onPress={onExit}
          activeOpacity={0.6}
        >
          <Text style={styles.exitButtonText}>END SESSION</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

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

  // 2. INPUT UTILITY OPERATIONS
  const handleTextChange = (text, setter, max) => {
    const cleanNum = text.replace(/[^0-9]/g, '');
    if (cleanNum.length <= 2) {
      if (cleanNum !== '' && parseInt(cleanNum, 10) > max) {
        setter(String(max));
      } else {
        setter(cleanNum);
      }
    }
  };

  const handleBlur = (value, setter, max) => {
    if (!value || value.trim() === '') {
      setter('00');
    } else {
      const clamped = Math.min(parseInt(value, 10), max);
      setter(String(clamped).padStart(2, '0'));
    }
  };

  const totalSeconds = (parseInt(hours || '0', 10) * 3600) + 
                       (parseInt(minutes || '0', 10) * 60) + 
                       parseInt(seconds || '0', 10);

  const isTimeValid = totalSeconds > 0;

  // 3. SCREEN ROUTING
  
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
      <ActiveSession 
        hours={hours} 
        minutes={minutes} 
        seconds={seconds} 
        activeTheme={activeTheme} 
        onExit={() => setCurrentStep('input')} 
      />
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
              onChangeText={(txt) => handleTextChange(txt, setHours, 23)}
              onBlur={() => handleBlur(hours, setHours, 23)}
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
              onChangeText={(txt) => handleTextChange(txt, setMinutes, 59)}
              onBlur={() => handleBlur(minutes, setMinutes, 59)}
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
              onChangeText={(txt) => handleTextChange(txt, setSeconds, 59)}
              onBlur={() => handleBlur(seconds, setSeconds, 59)}
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
  controlsWrapper: {
    position: 'absolute',
    bottom: 16,
    right: 24,
    zIndex: 99,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    opacity: 0.35,
    padding: 10,
    marginRight: 8,
  },
  exitButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 6,
    marginLeft: 8,
  },
  exitButtonText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 11,
    letterSpacing: 1,
  },
});

export default AmbientScreen;