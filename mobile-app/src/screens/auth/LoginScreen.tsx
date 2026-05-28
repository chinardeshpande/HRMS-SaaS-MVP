import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert, Animated, Image } from 'react-native';
import { useAuthStore } from '../../context/useAuthStore';
import { CommonButton } from '../../components/CommonButton';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';

export const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));
  
  const { login, isLoading, error, clearError, user, hasCachedSession, biometricsEnabled, unlockSession, logout } = useAuthStore();

  useEffect(() => {
    checkBiometrics();
  }, []);

  useEffect(() => {
    // If biometrics are enabled and we have a cached session, auto-trigger biometric prompt on mount
    if (hasCachedSession && biometricsEnabled && isBiometricSupported && !showManualForm) {
      triggerBiometricAuth();
    }
  }, [hasCachedSession, biometricsEnabled, isBiometricSupported, showManualForm]);

  useEffect(() => {
    if (hasCachedSession && !showManualForm) {
      // Start a pulsing animation for the biometric ring
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [hasCachedSession, showManualForm]);

  const checkBiometrics = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      setIsBiometricSupported(hasHardware && isEnrolled);
    } catch (e) {
      console.warn('⚠️ Biometrics check error:', e);
      setIsBiometricSupported(false);
    }
  };

  const triggerBiometricAuth = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Sign in to AuroraHR',
        fallbackLabel: 'Use password',
        cancelLabel: 'Cancel',
      });

      if (result.success) {
        unlockSession();
        console.log('✅ Biometric authentication successful');
      }
    } catch (e) {
      console.warn('⚠️ Biometric authentication failed:', e);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Required Fields', 'Please enter your email and password.');
      return;
    }

    try {
      await login({ email, password });
      console.log('✅ Mobile login successful');
    } catch (e: any) {
      console.warn('⚠️ Mobile login failed:', e);
    }
  };

  const handleUseDemo = () => {
    clearError();
    setEmail('sarah.johnson@acme.com');
    setPassword('password123');
    setShowManualForm(true);
  };

  const handleClearSession = async () => {
    Alert.alert(
      'Switch Account',
      'Are you sure you want to sign in with a different account? This will clear your secure biometric cache.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Switch Account',
          style: 'destructive',
          onPress: async () => {
            await logout();
            setShowManualForm(true);
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        {/* Upper Brand Section */}
        <View style={styles.brandSection}>
          <Image
            source={require('../../assets/AuroraHR-logo-with-tagline.png')}
            style={styles.loginLogoImage}
            resizeMode="contain"
          />
        </View>

        {/* Biometric Portal Card (If session cached & not in manual form) */}
        {hasCachedSession && !showManualForm ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Welcome Back</Text>
            <Text style={styles.cardSubtitle}>Unlock your dashboard using biometrics</Text>

            <View style={styles.bioUserBadge}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitial}>
                  {user?.fullName ? user.fullName.charAt(0) : 'U'}
                </Text>
              </View>
              <View style={styles.bioUserDetails}>
                <Text style={styles.bioUserName}>{user?.fullName || 'Active Employee'}</Text>
                <Text style={styles.bioUserRole}>{user?.role || 'Employee'}</Text>
              </View>
            </View>

            {/* Glowing Pulsing Fingerprint Trigger */}
            <View style={styles.bioAlignContainer}>
              <TouchableOpacity onPress={triggerBiometricAuth} activeOpacity={0.85}>
                <Animated.View style={[styles.bioPulseRing, { transform: [{ scale: pulseAnim }] }]} />
                <View style={styles.bioInnerButton}>
                  <MaterialCommunityIcons name="fingerprint" size={54} color="#0A66C2" />
                </View>
              </TouchableOpacity>
              <Text style={styles.bioPromptText}>Tap to authenticate with FaceID / TouchID</Text>
            </View>

            {/* Option buttons */}
            <View style={styles.bioOptionsRow}>
              <TouchableOpacity style={styles.bioOptionButton} onPress={() => setShowManualForm(true)}>
                <MaterialCommunityIcons name="lock-outline" size={16} color="#6b7280" />
                <Text style={styles.bioOptionText}>Use Password</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.bioOptionButton} onPress={handleClearSession}>
                <MaterialCommunityIcons name="account-switch-outline" size={16} color="#ef4444" />
                <Text style={[styles.bioOptionText, { color: '#ef4444' }]}>Switch Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* Login Form Container (Normal credentials or manual fallback) */
          <View style={styles.card}>
            <View style={styles.loginFormHeader}>
              <Text style={styles.cardTitle}>Sign In</Text>
              {hasCachedSession && (
                <TouchableOpacity 
                  style={styles.bioBackLink} 
                  onPress={() => setShowManualForm(false)}
                >
                  <MaterialCommunityIcons name="fingerprint" size={18} color="#0A66C2" />
                  <Text style={styles.bioBackLinkText}>Use Biometrics</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.cardSubtitle}>Sign in to access your HR dashboard</Text>

            {error && (
              <View style={styles.errorAlert}>
                <MaterialCommunityIcons name="alert-circle" size={20} color="#ef4444" style={styles.errorIcon} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Email input */}
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="email-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="you@company.com"
                value={email}
                onChangeText={(text) => {
                  clearError();
                  setEmail(text);
                }}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
            </View>

            {/* Password input */}
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="lock-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { paddingRight: 40 }]}
                placeholder="Enter your password"
                value={password}
                onChangeText={(text) => {
                  clearError();
                  setPassword(text);
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                <MaterialCommunityIcons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#9ca3af"
                />
              </TouchableOpacity>
            </View>

            {/* Forgot Password */}
            <TouchableOpacity style={styles.forgotBtn} activeOpacity={0.7}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            {/* Row with Sign In Button and Quick Biometric Trigger */}
            <View style={styles.submitRow}>
              <CommonButton
                title="Sign In"
                onPress={handleLogin}
                loading={isLoading}
                style={styles.submitBtnWithBio}
              />
              {isBiometricSupported && hasCachedSession && (
                <TouchableOpacity 
                  style={styles.quickBioBtn} 
                  onPress={triggerBiometricAuth}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="fingerprint" size={28} color="#0A66C2" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Demo Credentials Helper */}
        <TouchableOpacity style={styles.demoCard} onPress={handleUseDemo} activeOpacity={0.85}>
          <View style={styles.demoHeader}>
            <MaterialCommunityIcons name="lightbulb-on" size={18} color="#0A66C2" style={styles.demoHeaderIcon} />
            <Text style={styles.demoTitle}>Use Demo Credentials (Tap to fill)</Text>
          </View>
          <Text style={styles.demoCreds}>
            <Text style={{ fontWeight: '700' }}>Email:</Text> sarah.johnson@acme.com{'\n'}
            <Text style={{ fontWeight: '700' }}>Password:</Text> password123
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6', // gray-100
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: 32,
    width: '100%',
  },
  loginLogoImage: {
    width: '100%',
    maxWidth: 280,
    height: 80,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#1f2937',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.5)',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 24,
  },
  loginFormHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bioBackLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f4f8',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  bioBackLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0A66C2',
    marginLeft: 4,
  },
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorIcon: {
    marginRight: 8,
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#111827',
    fontSize: 14,
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0A66C2',
  },
  submitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnWithBio: {
    flex: 1,
  },
  quickBioBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#e8f4f8',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    borderWidth: 1,
    borderColor: 'rgba(10, 102, 194, 0.15)',
  },
  bioUserBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0A66C2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  bioUserDetails: {
    marginLeft: 12,
    flex: 1,
  },
  bioUserName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  bioUserRole: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  bioAlignContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  bioPulseRing: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(10, 102, 194, 0.1)',
    top: -8,
    left: -8,
  },
  bioInnerButton: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: '#e8f4f8',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(10, 102, 194, 0.25)',
    shadowColor: '#0A66C2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  bioPromptText: {
    fontSize: 13,
    color: '#4b5563',
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 16,
    textAlign: 'center',
  },
  bioOptionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderColor: '#f3f4f6',
    paddingTop: 16,
    marginTop: 12,
  },
  bioOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  bioOptionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4b5563',
    marginLeft: 6,
  },
  demoCard: {
    backgroundColor: '#e8f4f8', // primary-50 translucent
    borderColor: 'rgba(10, 102, 194, 0.15)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginTop: 24,
  },
  demoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  demoHeaderIcon: {
    marginRight: 6,
  },
  demoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0A66C2',
  },
  demoCreds: {
    fontSize: 12,
    color: '#063e74',
    lineHeight: 18,
  },
});
