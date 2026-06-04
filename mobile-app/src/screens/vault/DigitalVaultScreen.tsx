import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Animated,
  TextInput,
  Modal,
  RefreshControl,
} from 'react-native';
import { useAuthStore } from '../../context/useAuthStore';
import { endpoints } from '../../api/endpoints';
import { API_BASE_URL } from '../../api/client';
import * as WebBrowser from 'expo-web-browser';
import { CommonCard } from '../../components/CommonCard';
import { StatusBadge } from '../../components/StatusBadge';
import { formatDate } from '../../utils/format';
import { DigitalLibraryItem, GeneratedDocument } from '../../types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { getSecurely } from '../../utils/secureStore';
import { themeColors } from '../../utils/theme';

export const DigitalVaultScreen: React.FC = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'payslips' | 'contracts' | 'policies'>('payslips');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isMockData, setIsMockData] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  // Data lists
  const [libraryItems, setLibraryItems] = useState<DigitalLibraryItem[]>([]);
  const [issuedDocs, setIssuedDocs] = useState<GeneratedDocument[]>([]);
  
  // Authentication states
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);

  // Password fallback verification states
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [verifyingPassword, setVerifyingPassword] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    action: 'view' | 'download';
    fileName: string;
    fileUrl: string;
  } | null>(null);

  // Concentric Rings Animations
  const ring1Scale = useRef(new Animated.Value(1)).current;
  const ring2Scale = useRef(new Animated.Value(1)).current;
  const ringOpac = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    checkBiometrics();
    loadVaultData();
  }, [user, activeTab]);

  useEffect(() => {
    let anim: Animated.CompositeAnimation | null = null;
    if (authenticating) {
      ring1Scale.setValue(1);
      ring2Scale.setValue(1);
      ringOpac.setValue(1);

      anim = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(ring1Scale, {
              toValue: 1.4,
              duration: 1200,
              useNativeDriver: true,
            }),
            Animated.timing(ring1Scale, {
              toValue: 1.0,
              duration: 1200,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(ring2Scale, {
              toValue: 1.7,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(ring2Scale, {
              toValue: 1.0,
              duration: 1500,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(ringOpac, {
              toValue: 0.4,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(ringOpac, {
              toValue: 1.0,
              duration: 1000,
              useNativeDriver: true,
            }),
          ]),
        ])
      );
      anim.start();
    }
    return () => {
      if (anim) anim.stop();
    };
  }, [authenticating]);

  const checkBiometrics = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    setBiometricAvailable(hasHardware && isEnrolled);
  };

  const loadVaultData = async () => {
    setLoading(true);
    setIsMockData(false);
    setHasError(false);
    try {
      if (activeTab === 'payslips' || activeTab === 'policies') {
        const category = activeTab === 'payslips' ? 'payslip' : 'policy';
        const res = await endpoints.vault.getLibrary({ category });
        if (res?.success && res.data) {
          const rawData = res.data as any;
          const items = Array.isArray(rawData) 
            ? rawData 
            : (rawData.items && Array.isArray(rawData.items)) 
              ? rawData.items 
              : [];
          setLibraryItems(items);
          if ((res as any).isMock) {
            setIsMockData(true);
          }
        } else {
          setHasError(true);
        }
      } else if (activeTab === 'contracts') {
        const empId = user?.employeeId || 'e-current';
        const res = await endpoints.vault.getIssuedDocuments(empId);
        if (res?.success && res.data) {
          const rawData = res.data as any;
          const docs = Array.isArray(rawData)
            ? rawData
            : (rawData.documents && Array.isArray(rawData.documents))
              ? rawData.documents
              : [];
          setIssuedDocs(docs);
          if ((res as any).isMock) {
            setIsMockData(true);
          }
        } else {
          setHasError(true);
        }
      }
    } catch (err) {
      console.warn('⚠️ Vault fetch error:', err);
      setHasError(true);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadVaultData();
    } catch (err) {
      console.warn('⚠️ Vault refresh error:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleVerifyPassword = async () => {
    if (!user?.email || !passwordInput.trim() || !pendingAction) return;

    setVerifyingPassword(true);
    try {
      const res = await endpoints.auth.login({
        email: user.email,
        password: passwordInput,
      });

      setVerifyingPassword(false);
      
      if (res.success) {
        setPasswordVisible(false);
        setPasswordInput('');
        const actionToExecute = pendingAction;
        setPendingAction(null);
        executeAction(actionToExecute.action, actionToExecute.fileName, actionToExecute.fileUrl);
      } else {
        Alert.alert('Authentication Failed', res.error?.message || 'Invalid password. Access remains locked.');
      }
    } catch (err: any) {
      setVerifyingPassword(false);
      console.warn('⚠️ Password verification exception:', err);
      Alert.alert('Verification Failed', err.message || 'Could not verify credentials. Access remains locked.');
    }
  };

  // Securely gate document operations behind biometrics
  const handleDocumentAction = async (action: 'view' | 'download', fileName: string, fileUrl: string) => {
    if (biometricAvailable) {
      setAuthenticating(true);
      try {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: `Verify biometric keys to unlock ${fileName}`,
          fallbackLabel: 'Enter Passcode',
          disableDeviceFallback: false,
        });

        setAuthenticating(false);

        if (!result.success) {
          Alert.alert('Access Denied', 'Authentication failed. Sensitive documents remain locked.');
          return;
        }
      } catch (err) {
        setAuthenticating(false);
        console.warn('⚠️ Biometrics exception:', err);
        return;
      }
    } else {
      // Fallback if biometrics aren't configured/available
      setPendingAction({ action, fileName, fileUrl });
      setPasswordVisible(true);
      return;
    }

    executeAction(action, fileName, fileUrl);
  };

  const executeAction = async (action: 'view' | 'download', fileName: string, fileUrl: string) => {
    if (action === 'view') {
      await triggerFileView(fileUrl);
    } else {
      await triggerFileOpen(fileName, fileUrl);
    }
  };

  const triggerFileView = async (fileUrl: string) => {
    setLoading(true);
    try {
      // Resolve relative URLs and correct any API path discrepancies
      let targetUrl = fileUrl || '';
      
      if (targetUrl.startsWith('/')) {
        // Extract protocol + host from API_BASE_URL (e.g. 'https://aurorahr.in' or 'http://localhost:5000')
        const match = API_BASE_URL.match(/^(https?:\/\/[^/]+)/);
        const host = match ? match[1] : 'https://aurorahr.in';
        
        // Correct path mismatch: `/api/documents/...` -> `/api/v1/documents/...`
        let relativePath = targetUrl;
        if (relativePath.startsWith('/api/') && !relativePath.startsWith('/api/v1/')) {
          relativePath = relativePath.replace(/^\/api\//, '/api/v1/');
        }
        
        targetUrl = `${host}${relativePath}`;
      } else {
        // If it's an absolute URL, check if it has the outdated path `/api/documents/`
        if (targetUrl.includes('/api/documents/')) {
          targetUrl = targetUrl.replace('/api/documents/', '/api/v1/documents/');
        }
      }

      // Retrieve authentication tokens from state store to append ?token=<jwt>
      const { tokens } = useAuthStore.getState();
      let jwtToken = tokens?.token;

      // Fallback: If token not in state store, load from secureStore directly
      if (!jwtToken) {
        try {
          const tokensStr = await getSecurely('tokens');
          if (tokensStr) {
            const parsed = JSON.parse(tokensStr);
            jwtToken = parsed?.token;
            console.log('🔑 Retrieved JWT Token from secureStore fallback for view');
          }
        } catch (err) {
          console.warn('⚠️ SecureStore fallback fetch error for view:', err);
        }
      }

      if (jwtToken) {
        const separator = targetUrl.includes('?') ? '&' : '?';
        targetUrl = `${targetUrl}${separator}token=${encodeURIComponent(jwtToken)}`;
      }

      console.log(`👁️ [Vault View] Opening in-app system browser for: ${targetUrl}`);
      setLoading(false);
      
      await WebBrowser.openBrowserAsync(targetUrl, {
        readerMode: false,
        enableBarCollapsing: true,
        dismissButtonStyle: 'close',
        toolbarColor: themeColors.primary,
        controlsColor: '#ffffff',
      });
    } catch (err: any) {
      setLoading(false);
      console.warn('⚠️ Vault Document view error:', err);
      Alert.alert(
        'View Failed',
        'Could not load the document viewer. Please check your internet connection or download the file.'
      );
    }
  };

  const triggerFileOpen = async (fileName: string, fileUrl: string) => {
    setLoading(true);
    try {
      // Resolve relative URLs and correct any API path discrepancies
      let targetUrl = fileUrl || '';
      
      if (targetUrl.startsWith('/')) {
        // Extract protocol + host from API_BASE_URL (e.g. 'https://aurorahr.in' or 'http://localhost:5000')
        const match = API_BASE_URL.match(/^(https?:\/\/[^/]+)/);
        const host = match ? match[1] : 'https://aurorahr.in';
        
        // Correct path mismatch: `/api/documents/...` -> `/api/v1/documents/...`
        let relativePath = targetUrl;
        if (relativePath.startsWith('/api/') && !relativePath.startsWith('/api/v1/')) {
          relativePath = relativePath.replace(/^\/api\//, '/api/v1/');
        }
        
        targetUrl = `${host}${relativePath}`;
      } else {
        // If it's an absolute URL, check if it has the outdated path `/api/documents/`
        if (targetUrl.includes('/api/documents/')) {
          targetUrl = targetUrl.replace('/api/documents/', '/api/v1/documents/');
        }
      }

      // Clean file name to prevent local filesystem encoding glitches
      const safeName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
      const localUri = FileSystem.documentDirectory + safeName;

      // Retrieve authentication tokens from state store
      const { tokens } = useAuthStore.getState();
      let jwtToken = tokens?.token;

      // Fallback: If token not in state store, load from secureStore directly
      if (!jwtToken) {
        try {
          const tokensStr = await getSecurely('tokens');
          if (tokensStr) {
            const parsed = JSON.parse(tokensStr);
            jwtToken = parsed?.token;
            console.log('🔑 Retrieved JWT Token from secureStore fallback for download');
          }
        } catch (err) {
          console.warn('⚠️ SecureStore fallback fetch error for download:', err);
        }
      }

      if (jwtToken) {
        const separator = targetUrl.includes('?') ? '&' : '?';
        targetUrl = `${targetUrl}${separator}token=${encodeURIComponent(jwtToken)}`;
      }

      // Configure authorization header so the Node.js backend authorizes the stream
      const headers: Record<string, string> = jwtToken ? { Authorization: `Bearer ${jwtToken}` } : {};

      console.log(`📥 [Vault Download] Downloading private asset: ${targetUrl} -> ${localUri}`);
      const downloadResult = await FileSystem.downloadAsync(
        targetUrl,
        localUri,
        { headers }
      );

      if (downloadResult.status !== 200) {
        let errorMessage = 'Security authorization failed or file not found.';
        try {
          const content = await FileSystem.readAsStringAsync(downloadResult.uri);
          const parsed = JSON.parse(content);
          errorMessage = parsed.error?.message || errorMessage;
        } catch (_) {
          // Ignore parse errors and retain default security authorization error message
        }
        
        // Clean up the invalid file
        await FileSystem.deleteAsync(downloadResult.uri, { idempotent: true });
        
        setLoading(false);
        Alert.alert('Download Failed', errorMessage);
        return;
      }

      console.log(`✅ [Vault Download] Successfully saved locally at: ${downloadResult.uri}`);
      setLoading(false);

      // Launch native preview/sharing controller
      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (isSharingAvailable) {
        await Sharing.shareAsync(downloadResult.uri, {
          mimeType: 'application/pdf',
          dialogTitle: fileName,
          UTI: 'com.adobe.pdf'
        });
      } else {
        Alert.alert('Download Success', `File saved: ${safeName}`);
      }
    } catch (err: any) {
      setLoading(false);
      console.warn('⚠️ Vault Document download error:', err);
      Alert.alert(
        'Download Failed',
        'Could not fetch the secure document. Please verify your connection or check with HR.'
      );
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Map system documentTypes to human-readable strings
  const getDocumentLabel = (type: string) => {
    return type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Exquisite Top Segment Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'payslips' && styles.tabButtonActive]}
          onPress={() => setActiveTab('payslips')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="cash-register"
            size={18}
            color={activeTab === 'payslips' ? themeColors.primary : themeColors.textSecondary}
            style={styles.tabIcon}
          />
          <Text style={[styles.tabText, activeTab === 'payslips' && styles.tabTextActive]}>Payslips</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'contracts' && styles.tabButtonActive]}
          onPress={() => setActiveTab('contracts')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="file-sign"
            size={18}
            color={activeTab === 'contracts' ? themeColors.primary : themeColors.textSecondary}
            style={styles.tabIcon}
          />
          <Text style={[styles.tabText, activeTab === 'contracts' && styles.tabTextActive]}>Issued Docs</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'policies' && styles.tabButtonActive]}
          onPress={() => setActiveTab('policies')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="book-open-page-variant-outline"
            size={18}
            color={activeTab === 'policies' ? themeColors.primary : themeColors.textSecondary}
            style={styles.tabIcon}
          />
          <Text style={[styles.tabText, activeTab === 'policies' && styles.tabTextActive]}>Policies</Text>
        </TouchableOpacity>
      </View>

      {/* Developer warning banner in sandboxes */}
      {isMockData && (
        <View style={styles.warningBanner}>
          <MaterialCommunityIcons name="xml" size={16} color="#ca8a04" style={{ marginRight: 6 }} />
          <Text style={styles.warningBannerText}>
            Developer Sandbox: Displaying mock vault library items.
          </Text>
        </View>
      )}

      {/* Screen body */}
      {hasError ? (
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#ef4444" style={{ marginBottom: 12 }} />
          <Text style={styles.errorText}>Failed to load Digital Vault registry</Text>
          <Text style={styles.errorSubtitle}>Please verify your connection and try again</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadVaultData}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : loading && !authenticating && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={themeColors.primary} />
          <Text style={styles.infoText}>Querying Digital Vault Registry...</Text>
        </View>
      ) : activeTab === 'payslips' ? (
        /* 1. PAYSLIPS & SALARY LIST */
        <FlatList
          data={libraryItems.filter(item => item.category === 'payslip')}
          keyExtractor={(item) => item.libraryId}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[themeColors.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="currency-usd-off" size={48} color={themeColors.textMuted} />
              <Text style={styles.emptyText}>No payslips found in your vault registry.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <CommonCard variant="glass" style={styles.rowCard}>
              <View style={styles.rowHeader}>
                <View style={styles.iconCircle}>
                  <MaterialCommunityIcons name="file-pdf-box" size={24} color="#ef4444" />
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.fileName} numberOfLines={1}>{item.fileName}</Text>
                  <View style={styles.metaRow}>
                    <View style={styles.docTypeBadge}>
                      <Text style={styles.docTypeText}>PDF</Text>
                    </View>
                    <Text style={styles.metaText}>{formatBytes(item.fileSize)}</Text>
                    <Text style={styles.bulletSeparator}>•</Text>
                    <Text style={styles.metaText}>{formatDate(item.createdAt, 'MMM dd, yyyy')}</Text>
                  </View>
                </View>
                <StatusBadge status="processed" style={styles.badge} />
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.rowActions}>
                <View style={styles.secureBadge}>
                  <MaterialCommunityIcons name="shield-key-outline" size={14} color={themeColors.success} />
                  <Text style={styles.secureText}>Secured</Text>
                </View>
                <View style={styles.btnGroup}>
                  <TouchableOpacity
                    style={styles.actionBtnOutline}
                    onPress={() => handleDocumentAction('view', item.fileName, `/api/v1/digital-library/${item.libraryId}/view`)}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons name="eye-outline" size={14} color={themeColors.primary} style={{ marginRight: 4 }} />
                    <Text style={styles.actionBtnTextOutline}>View</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleDocumentAction('download', item.fileName, `/api/v1/digital-library/${item.libraryId}/view`)}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons name="share-variant" size={14} color="#ffffff" style={{ marginRight: 4 }} />
                    <Text style={styles.actionBtnText}>Share</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </CommonCard>
          )}
        />
      ) : activeTab === 'contracts' ? (
        /* 2. ISSUED EMPLOYMENT LIFECYCLE DOCUMENTS */
        <FlatList
          data={issuedDocs}
          keyExtractor={(item) => item.documentId}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[themeColors.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="file-cancel-outline" size={48} color={themeColors.textMuted} />
              <Text style={styles.emptyText}>No system-issued contract agreements found.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <CommonCard variant="glass" style={styles.rowCard}>
              <View style={styles.rowHeader}>
                <View style={styles.iconCircleBlue}>
                  <MaterialCommunityIcons name="file-document-outline" size={24} color={themeColors.primary} />
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.fileName} numberOfLines={1}>
                    {getDocumentLabel(item.documentType)}
                  </Text>
                  <View style={styles.metaRow}>
                    <View style={styles.docTypeBadgeContract}>
                      <Text style={styles.docTypeTextContract}>OFFER</Text>
                    </View>
                    <Text style={styles.metaText}>Issued: {formatDate(item.createdAt, 'MMM dd, yyyy')}</Text>
                  </View>
                </View>
                <StatusBadge status="issued" style={styles.badge} />
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.rowActions}>
                <View style={styles.secureBadge}>
                  <MaterialCommunityIcons name="shield-lock" size={14} color={themeColors.success} />
                  <Text style={styles.secureText}>Encrypted</Text>
                </View>
                <View style={styles.btnGroup}>
                  <TouchableOpacity
                    style={styles.actionBtnOutline}
                    onPress={() => handleDocumentAction('view', item.documentName, item.fileUrl || `/api/v1/documents/${item.documentId}/download`)}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons name="eye-outline" size={14} color={themeColors.primary} style={{ marginRight: 4 }} />
                    <Text style={styles.actionBtnTextOutline}>View</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleDocumentAction('download', item.documentName, item.fileUrl || `/api/v1/documents/${item.documentId}/download`)}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons name="share-variant" size={14} color="#ffffff" style={{ marginRight: 4 }} />
                    <Text style={styles.actionBtnText}>Share</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </CommonCard>
          )}
        />
      ) : (
        /* 3. CORPORATE REFERENCE POLICIES */
        <FlatList
          data={libraryItems.filter(item => item.category === 'policy')}
          keyExtractor={(item) => item.libraryId}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[themeColors.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="book-remove-outline" size={48} color={themeColors.textMuted} />
              <Text style={styles.emptyText}>No corporate policy documents published.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <CommonCard variant="glass" style={styles.rowCard}>
              <View style={styles.rowHeader}>
                <View style={styles.iconCircleAmber}>
                  <MaterialCommunityIcons name="book-open-outline" size={24} color={themeColors.warning} />
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.fileName} numberOfLines={1}>{item.fileName}</Text>
                  <View style={styles.metaRow}>
                    <View style={styles.docTypeBadgePolicy}>
                      <Text style={styles.docTypeTextPolicy}>POLICY</Text>
                    </View>
                    <Text style={styles.metaText}>{formatBytes(item.fileSize)}</Text>
                    <Text style={styles.bulletSeparator}>•</Text>
                    <Text style={styles.metaText}>Updated: {formatDate(item.createdAt, 'MMM yyyy')}</Text>
                  </View>
                </View>
                <StatusBadge status="public" style={styles.badge} />
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.rowActions}>
                <View style={styles.secureBadgeInfo}>
                  <MaterialCommunityIcons name="earth" size={14} color={themeColors.textSecondary} />
                  <Text style={styles.secureTextInfo}>Public</Text>
                </View>
                <View style={styles.btnGroup}>
                  <TouchableOpacity
                    style={styles.actionBtnOutline}
                    onPress={() => triggerFileView(`/api/v1/digital-library/${item.libraryId}/view`)}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons name="eye-outline" size={14} color={themeColors.primary} style={{ marginRight: 4 }} />
                    <Text style={styles.actionBtnTextOutline}>View</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionBtnInfo}
                    onPress={() => triggerFileOpen(item.fileName, `/api/v1/digital-library/${item.libraryId}/view`)}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons name="share-variant-outline" size={14} color={themeColors.primary} style={{ marginRight: 4 }} />
                    <Text style={styles.actionBtnTextInfo}>Share</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </CommonCard>
          )}
        />
      )}

      {/* Password verification dialog fallback when biometrics are unconfigured */}
      <Modal
        visible={passwordVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setPasswordVisible(false);
          setPendingAction(null);
          setPasswordInput('');
        }}
      >
        <View style={styles.modalBg}>
          <View style={styles.passwordContainer}>
            <MaterialCommunityIcons name="shield-lock-outline" size={40} color={themeColors.primary} style={{ marginBottom: 12 }} />
            <Text style={styles.passwordTitle}>Verify Identity</Text>
            <Text style={styles.passwordSubtitle}>
              Please enter your AuroraHR account password to access this secure document.
            </Text>
            <TextInput
              style={styles.passwordInput}
              placeholder="Password"
              placeholderTextColor="#9ca3af"
              secureTextEntry={true}
              value={passwordInput}
              onChangeText={setPasswordInput}
              autoCapitalize="none"
              autoComplete="password"
            />
            <View style={styles.passwordBtnGroup}>
              <TouchableOpacity
                style={styles.passwordCancelBtn}
                onPress={() => {
                  setPasswordVisible(false);
                  setPendingAction(null);
                  setPasswordInput('');
                }}
              >
                <Text style={styles.passwordCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.passwordConfirmBtn}
                onPress={handleVerifyPassword}
                disabled={verifyingPassword}
              >
                {verifyingPassword ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.passwordConfirmText}>Verify</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* High-Fidelity Biometric Authenticating Pulse overlay */}
      {authenticating && (
        <View style={styles.authOverlay}>
          <View style={styles.authContainer}>
            <Animated.View style={[styles.ring, { transform: [{ scale: ring2Scale }], opacity: ringOpac.interpolate({ inputRange: [0.4, 1], outputRange: [0.08, 0.22] }) }]} />
            <Animated.View style={[styles.ring, { transform: [{ scale: ring1Scale }], opacity: ringOpac.interpolate({ inputRange: [0.4, 1], outputRange: [0.15, 0.4] }), width: 120, height: 120, borderRadius: 60 }]} />
            <View style={styles.authCircle}>
              <MaterialCommunityIcons name="fingerprint" size={56} color={themeColors.primary} />
            </View>
            <Text style={styles.authTitle}>Secure Biometric Gateway</Text>
            <Text style={styles.authSubtitle}>Decrypting digital ledger keys...</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    height: 48,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: themeColors.primary,
  },
  tabIcon: {
    marginRight: 6,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: themeColors.textSecondary,
  },
  tabTextActive: {
    color: themeColors.primary,
    fontWeight: '700',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoText: {
    marginTop: 12,
    fontSize: 13,
    color: themeColors.textSecondary,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 120,
    gap: 12,
  },
  emptyText: {
    fontSize: 13,
    color: themeColors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 18,
  },
  rowCard: {
    marginBottom: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleBlue: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e8f4f8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleAmber: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '800',
    color: themeColors.textPrimary,
    letterSpacing: -0.1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  metaText: {
    fontSize: 11,
    color: themeColors.textSecondary,
    fontWeight: '500',
  },
  bulletSeparator: {
    fontSize: 11,
    color: themeColors.textMuted,
    marginHorizontal: 6,
  },
  docTypeBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    marginRight: 6,
  },
  docTypeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#ef4444',
  },
  docTypeBadgeContract: {
    backgroundColor: 'rgba(10, 102, 194, 0.08)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    marginRight: 6,
  },
  docTypeTextContract: {
    fontSize: 9,
    fontWeight: '800',
    color: themeColors.primary,
  },
  docTypeBadgePolicy: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    marginRight: 6,
  },
  docTypeTextPolicy: {
    fontSize: 9,
    fontWeight: '800',
    color: themeColors.warning,
  },
  badge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    marginVertical: 12,
  },
  rowActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  secureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    gap: 4,
  },
  secureText: {
    fontSize: 10,
    fontWeight: '700',
    color: themeColors.success,
  },
  secureBadgeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    gap: 4,
  },
  secureTextInfo: {
    fontSize: 10,
    fontWeight: '700',
    color: themeColors.textSecondary,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: themeColors.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    shadowColor: themeColors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  actionBtnInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(10, 102, 194, 0.25)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  actionBtnTextInfo: {
    fontSize: 12,
    fontWeight: '700',
    color: themeColors.primary,
  },
  btnGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  actionBtnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(10, 102, 194, 0.3)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  actionBtnTextOutline: {
    fontSize: 12,
    fontWeight: '700',
    color: themeColors.primary,
  },
  authOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  authContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1.5,
    borderRadius: 24,
    padding: 30,
    width: 280,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  ring: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 2,
    borderColor: themeColors.primary,
    backgroundColor: 'rgba(10, 102, 194, 0.02)',
  },
  authCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#f0f7fc',
    borderWidth: 2,
    borderColor: 'rgba(10, 102, 194, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: themeColors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  authTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: themeColors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  authSubtitle: {
    fontSize: 11,
    color: themeColors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    fontWeight: '500',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef9c3',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#fef08a',
  },
  warningBannerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#854d0e',
    marginLeft: 2,
  },
  errorText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  errorSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: themeColors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  passwordContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  passwordTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  passwordSubtitle: {
    fontSize: 12,
    color: '#4b5563',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 16,
  },
  passwordInput: {
    width: '100%',
    height: 44,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#111827',
    marginBottom: 20,
    backgroundColor: '#f9fafb',
  },
  passwordBtnGroup: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  passwordCancelBtn: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  passwordCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  passwordConfirmBtn: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: themeColors.primary,
  },
  passwordConfirmText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
});
