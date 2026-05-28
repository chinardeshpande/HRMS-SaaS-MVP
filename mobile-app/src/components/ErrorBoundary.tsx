import React, { Component, ErrorInfo, ReactNode } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { deleteSecurely } from '../utils/secureStore';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('⚠️ [ErrorBoundary] Critical Rendering Crash Captured:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    });
  };

  private handleWipeAndReset = async () => {
    try {
      console.log('🧹 Purging local storage and keychain caches to restore clean state...');
      await AsyncStorage.clear();
      await deleteSecurely('tokens');
      await deleteSecurely('biometrics_enabled');
      
      // Reload application
      this.handleReset();
      
      // Force reload react native tree if global refresh triggers exist
      // Since this is inside boundary, resetting state will unmount and remount AppNavigator
    } catch (e) {
      console.error('❌ Failed to wipe local caches:', e);
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <View style={styles.glassCard}>
            {/* Header Icon */}
            <View style={styles.iconWrapper}>
              <MaterialCommunityIcons name="shield-alert-outline" size={48} color="#ef4444" />
            </View>

            {/* Error Message */}
            <Text style={styles.title}>System Recovered</Text>
            <Text style={styles.subtitle}>
              AuroraHR captured an unexpected view layout conflict. We have securely isolated the error to keep your data safe.
            </Text>

            {/* Actions */}
            <View style={styles.actionContainer}>
              <TouchableOpacity 
                style={[styles.button, styles.primaryButton]} 
                onPress={this.handleReset}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="refresh" size={18} color="#ffffff" style={styles.btnIcon} />
                <Text style={styles.primaryButtonText}>Try Reloading View</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.button, styles.secondaryButton]} 
                onPress={this.handleWipeAndReset}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="trash-can-outline" size={18} color="#4b5563" style={styles.btnIcon} />
                <Text style={styles.secondaryButtonText}>Reset Cache & Log Out</Text>
              </TouchableOpacity>
            </View>

            {/* Debug Details */}
            <TouchableOpacity 
              style={styles.detailsHeader} 
              onPress={() => this.setState(prev => ({ showDetails: !prev.showDetails }))}
              activeOpacity={0.7}
            >
              <Text style={styles.detailsHeaderText}>Technical Diagnostic Details</Text>
              <MaterialCommunityIcons 
                name={this.state.showDetails ? 'chevron-up' : 'chevron-down'} 
                size={16} 
                color="#6b7280" 
              />
            </TouchableOpacity>

            {this.state.showDetails && (
              <ScrollView style={styles.detailsContent} contentContainerStyle={styles.detailsScrollContent}>
                <Text style={styles.errorText}>
                  Error: {this.state.error?.toString() || 'Unknown Error'}
                </Text>
                {this.state.errorInfo && (
                  <Text style={styles.stackText}>
                    Component Stack: {this.state.errorInfo.componentStack}
                  </Text>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  glassCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.8)',
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 5,
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#4b5563',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
  actionContainer: {
    width: '100%',
    gap: 12,
    marginBottom: 20,
  },
  button: {
    flexDirection: 'row',
    width: '100%',
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  btnIcon: {
    marginRight: 8,
  },
  primaryButton: {
    backgroundColor: '#0A66C2',
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  secondaryButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4b5563',
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    marginTop: 8,
  },
  detailsHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4b5563',
  },
  detailsContent: {
    width: '100%',
    maxHeight: 180,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 12,
    marginTop: 8,
  },
  detailsScrollContent: {
    paddingBottom: 8,
  },
  errorText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ef4444',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 6,
  },
  stackText: {
    fontSize: 10,
    color: '#4b5563',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 14,
  },
});
