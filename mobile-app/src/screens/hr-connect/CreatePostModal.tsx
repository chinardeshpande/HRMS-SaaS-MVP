import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TextInput,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Group } from '../../types';
import { CommonButton } from '../../components/CommonButton';

interface CreatePostModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (postData: {
    title: string;
    content: string;
    postType: 'announcement' | 'general' | 'event' | 'poll' | 'document' | 'discussion' | 'question';
    visibility: 'public' | 'department' | 'group' | 'hr_only' | 'group_only';
    groupId?: string;
  }) => Promise<boolean>;
  groups: Group[];
}

const POST_TYPES = [
  { id: 'announcement', label: 'Announcement', icon: 'bullhorn-outline', color: '#ef4444' },
  { id: 'discussion', label: 'Discussion', icon: 'message-text-outline', color: '#0A66C2' },
  { id: 'event', label: 'Event', icon: 'calendar-star', color: '#22c55e' },
  { id: 'question', label: 'Question', icon: 'help-circle-outline', color: '#9333ea' }
] as const;

const VISIBILITY_TYPES = [
  { id: 'public', label: 'Public', icon: 'earth', desc: 'All employees' },
  { id: 'department', label: 'Department', icon: 'office-building', desc: 'My department' },
  { id: 'group', label: 'Group Only', icon: 'account-group', desc: 'Select a group' }
] as const;

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  visible,
  onClose,
  onSubmit,
  groups
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState<typeof POST_TYPES[number]['id']>('discussion');
  const [visibility, setVisibility] = useState<typeof VISIBILITY_TYPES[number]['id']>('public');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) {
      Alert.alert('Validation Error', 'Please write some content for your post.');
      return;
    }

    if (visibility === 'group' && !selectedGroupId) {
      Alert.alert('Validation Error', 'Please select a group for this post.');
      return;
    }

    setLoading(true);
    try {
      const success = await onSubmit({
        title: title.trim(),
        content: content.trim(),
        postType,
        visibility: visibility === 'group' ? 'group_only' : (visibility as any),
        groupId: visibility === 'group' ? selectedGroupId : undefined
      });

      if (success) {
        // Reset form
        setTitle('');
        setContent('');
        setPostType('discussion');
        setVisibility('public');
        setSelectedGroupId('');
        onClose();
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to share post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Create Post</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <MaterialCommunityIcons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.scrollContainer}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              {/* Post Title */}
              <Text style={styles.fieldLabel}>Title (Optional)</Text>
              <TextInput
                style={styles.titleInput}
                placeholder="Give your post a title..."
                placeholderTextColor="#9ca3af"
                value={title}
                onChangeText={setTitle}
                maxLength={100}
              />

              {/* Post Content */}
              <Text style={styles.fieldLabel}>What's on your mind? *</Text>
              <TextInput
                style={styles.contentInput}
                placeholder="Share an update, question, or announcement..."
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={6}
                value={content}
                onChangeText={setContent}
                textAlignVertical="top"
              />

              {/* Post Type Selector */}
              <Text style={styles.fieldLabel}>Post Type</Text>
              <View style={styles.typeGrid}>
                {POST_TYPES.map((type) => {
                  const isSelected = postType === type.id;
                  return (
                    <TouchableOpacity
                      key={type.id}
                      style={[
                        styles.typeCard,
                        isSelected && { borderColor: type.color, backgroundColor: `${type.color}08` }
                      ]}
                      onPress={() => setPostType(type.id)}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons
                        name={type.icon}
                        size={20}
                        color={isSelected ? type.color : '#6b7280'}
                      />
                      <Text style={[styles.typeText, isSelected && { color: type.color, fontWeight: '700' }]}>
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Visibility Selector */}
              <Text style={styles.fieldLabel}>Visibility</Text>
              <View style={styles.visibilityContainer}>
                {VISIBILITY_TYPES.map((type) => {
                  const isSelected = visibility === type.id;
                  return (
                    <TouchableOpacity
                      key={type.id}
                      style={[
                        styles.visibilityItem,
                        isSelected && styles.visibilityItemActive
                      ]}
                      onPress={() => setVisibility(type.id)}
                      activeOpacity={0.75}
                    >
                      <MaterialCommunityIcons
                        name={type.icon}
                        size={20}
                        color={isSelected ? '#0A66C2' : '#6b7280'}
                        style={styles.visibilityIcon}
                      />
                      <View style={styles.visibilityTextContainer}>
                        <Text style={[styles.visibilityLabel, isSelected && styles.visibilityLabelActive]}>
                          {type.label}
                        </Text>
                        <Text style={styles.visibilityDesc}>{type.desc}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Group Selector Dropdown / Grid (Visible only if group is selected) */}
              {visibility === 'group' && (
                <View style={styles.groupSelectionArea}>
                  <Text style={styles.fieldLabel}>Select Target Group *</Text>
                  {groups.length === 0 ? (
                    <Text style={styles.noGroupsText}>No custom groups available to post in.</Text>
                  ) : (
                    <View style={styles.groupChipsGrid}>
                      {groups.map((group) => {
                        const isSelected = selectedGroupId === group.groupId;
                        return (
                          <TouchableOpacity
                            key={group.groupId}
                            style={[
                              styles.groupChip,
                              isSelected && styles.groupChipActive
                            ]}
                            onPress={() => setSelectedGroupId(group.groupId)}
                          >
                            <Text style={[styles.groupChipText, isSelected && styles.groupChipTextActive]}>
                              #{group.name}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>
              )}
            </ScrollView>

            {/* Bottom Actions */}
            <View style={styles.footer}>
              <TouchableOpacity
                onPress={onClose}
                style={styles.cancelButton}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <CommonButton
                title="Post Now"
                onPress={handleSubmit}
                loading={loading}
                style={styles.submitButton}
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '85%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.3,
  },
  closeButton: {
    padding: 4,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  titleInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#f9fafb',
  },
  contentInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#f9fafb',
    height: 120,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4b5563',
  },
  visibilityContainer: {
    gap: 8,
  },
  visibilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#f9fafb',
  },
  visibilityItemActive: {
    borderColor: 'rgba(10, 102, 194, 0.4)',
    backgroundColor: '#f6fbfd',
  },
  visibilityIcon: {
    marginRight: 12,
  },
  visibilityTextContainer: {
    flex: 1,
  },
  visibilityLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
  visibilityLabelActive: {
    color: '#0A66C2',
  },
  visibilityDesc: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  groupSelectionArea: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 16,
  },
  noGroupsText: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  groupChipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  groupChip: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 9999,
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: '#ffffff',
  },
  groupChipActive: {
    backgroundColor: '#0A66C2',
    borderColor: '#0A66C2',
  },
  groupChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4b5563',
  },
  groupChipTextActive: {
    color: '#ffffff',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    alignItems: 'center',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4b5563',
  },
  submitButton: {
    flex: 2,
  },
});
