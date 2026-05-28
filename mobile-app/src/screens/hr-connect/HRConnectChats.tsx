import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../../context/useAuthStore';
import { sendLocalNotification } from '../../utils/notifications';

export interface ChatMessage {
  messageId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string; // ISO string
  status: 'sent' | 'delivered' | 'read';
}

export interface ChatSession {
  chatId: string;
  userId: string;
  fullName: string;
  designation: string;
  avatarUrl?: string;
  unreadCount: number;
  lastMessageText: string;
  lastMessageTime: string;
  messages: ChatMessage[];
  isOnline?: boolean;
}

const SEED_CHATS: ChatSession[] = [
  {
    chatId: 'chat_1',
    userId: 'emp_sarah',
    fullName: 'Sarah Johnson',
    designation: 'HR Manager',
    unreadCount: 2,
    lastMessageText: 'Hey! Did you submit your leave forms?',
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    isOnline: true,
    messages: [
      { messageId: 'm1', senderId: 'emp_sarah', senderName: 'Sarah Johnson', text: 'Hi there! Just wanted to check on the Q2 performance cycle documents.', timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), status: 'read' },
      { messageId: 'm2', senderId: 'current_user', senderName: 'Sarah Johnson', text: 'Yes, Sarah! I have uploaded my goals and requested approval.', timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), status: 'read' },
      { messageId: 'm3', senderId: 'emp_sarah', senderName: 'Sarah Johnson', text: 'Excellent. I saw them in my dashboard.', timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), status: 'read' },
      { messageId: 'm4', senderId: 'emp_sarah', senderName: 'Sarah Johnson', text: 'Hey! Did you submit your leave forms?', timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(), status: 'delivered' }
    ]
  },
  {
    chatId: 'chat_2',
    userId: 'emp_david',
    fullName: 'David Lee',
    designation: 'Technical Lead',
    unreadCount: 0,
    lastMessageText: 'Phase 8 compilation checks passed perfectly!',
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    isOnline: true,
    messages: [
      { messageId: 'm5', senderId: 'current_user', senderName: 'Sarah Johnson', text: 'Hey David, how is the mobile native integration going?', timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(), status: 'read' },
      { messageId: 'm6', senderId: 'emp_david', senderName: 'David Lee', text: 'Going great! Secure storage and biometric sensors work. Let me check the type-safety checks.', timestamp: new Date(Date.now() - 1000 * 60 * 150).toISOString(), status: 'read' },
      { messageId: 'm7', senderId: 'emp_david', senderName: 'David Lee', text: 'Phase 8 compilation checks passed perfectly!', timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), status: 'read' }
    ]
  },
  {
    chatId: 'chat_3',
    userId: 'emp_john',
    fullName: 'John Doe',
    designation: 'Operations Director',
    unreadCount: 0,
    lastMessageText: 'Welcome aboard! Let me know if you need anything.',
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 600).toISOString(),
    isOnline: false,
    messages: [
      { messageId: 'm8', senderId: 'emp_john', senderName: 'John Doe', text: 'Welcome aboard! Let me know if you need anything.', timestamp: new Date(Date.now() - 1000 * 60 * 600).toISOString(), status: 'read' }
    ]
  }
];

const DIRECTORY_EMPLOYEES = [
  { userId: 'emp_emily', fullName: 'Emily Davis', designation: 'Marketing Specialist', initials: 'ED', color: '#8b5cf6' },
  { userId: 'emp_michael', fullName: 'Michael Chang', designation: 'Finance Associate', initials: 'MC', color: '#10b981' },
  { userId: 'emp_jessica', fullName: 'Jessica Taylor', designation: 'Support Engineer', initials: 'JT', color: '#f59e0b' }
];

export const HRConnectChats: React.FC = () => {
  const { user } = useAuthStore();
  const [sessions, setSessions] = useState<ChatSession[]>(SEED_CHATS);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [typedMessage, setTypedMessage] = useState('');
  const [searchText, setSearchText] = useState('');
  const [showNewChatSheet, setShowNewChatSheet] = useState(false);

  const flatListRef = useRef<FlatList>(null);

  const activeChat = sessions.find((s) => s.chatId === activeChatId);

  // Mark active chat messages as read when opened
  useEffect(() => {
    if (activeChatId) {
      setSessions((prev) =>
        prev.map((s) => {
          if (s.chatId === activeChatId) {
            return {
              ...s,
              unreadCount: 0,
              messages: s.messages.map((m) => ({ ...m, status: 'read' }))
            };
          }
          return s;
        })
      );
      
      // Auto-scroll to bottom of chat
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [activeChatId]);

  const handleSendMessage = () => {
    if (!typedMessage.trim() || !activeChatId || !user) return;

    const newMessage: ChatMessage = {
      messageId: `msg_${Date.now()}`,
      senderId: 'current_user',
      senderName: user.fullName,
      text: typedMessage.trim(),
      timestamp: new Date().toISOString(),
      status: 'sent'
    };

    // Update session locally
    setSessions((prev) =>
      prev.map((s) => {
        if (s.chatId === activeChatId) {
          return {
            ...s,
            lastMessageText: newMessage.text,
            lastMessageTime: newMessage.timestamp,
            messages: [...s.messages, newMessage]
          };
        }
        return s;
      })
    );

    const promptText = typedMessage.trim();
    setTypedMessage('');

    // Scroll down
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 50);

    // Mock replies for natural conversation
    setTimeout(() => {
      triggerSimulatedReply(activeChatId, promptText);
    }, 1500);
  };

  const triggerSimulatedReply = (chatId: string, userMsg: string) => {
    const session = sessions.find((s) => s.chatId === chatId);
    if (!session) return;

    let replyText = "Hey! Thanks for messaging. I will get back to you shortly.";
    const lowerMsg = userMsg.toLowerCase();

    if (session.userId === 'emp_sarah') {
      if (lowerMsg.includes('leave') || lowerMsg.includes('vacation')) {
        replyText = "I will check your leave balances in the HR panel right away! You can submit the request in the app.";
      } else if (lowerMsg.includes('hey') || lowerMsg.includes('hi') || lowerMsg.includes('hello')) {
        replyText = "Hello! Did you submit your May attendance yet? Remember to be within the geofence to punch.";
      } else {
        replyText = "Let me look into that on my system. I'll message you once it is updated.";
      }
    } else if (session.userId === 'emp_david') {
      if (lowerMsg.includes('phase 8') || lowerMsg.includes('native') || lowerMsg.includes('build')) {
        replyText = "Everything looks extremely solid. LocalAuthentication and GPS are wired up, and `npx tsc` compiles flawlessly.";
      } else {
        replyText = "Copy that. Let's sync during the tech standup or direct message here.";
      }
    } else if (session.userId === 'emp_john') {
      replyText = "Acknowledged. Let's touch base during our operational review tomorrow morning.";
    }

    const mockReply: ChatMessage = {
      messageId: `msg_${Date.now()}`,
      senderId: session.userId,
      senderName: session.fullName,
      text: replyText,
      timestamp: new Date().toISOString(),
      status: 'delivered'
    };

    setSessions((prev) =>
      prev.map((s) => {
        if (s.chatId === chatId) {
          const isCurrentlyActive = activeChatId === chatId;
          return {
            ...s,
            lastMessageText: mockReply.text,
            lastMessageTime: mockReply.timestamp,
            unreadCount: isCurrentlyActive ? 0 : s.unreadCount + 1,
            messages: [...s.messages, { ...mockReply, status: isCurrentlyActive ? 'read' : 'delivered' }]
          };
        }
        return s;
      })
    );

    // Scroll to bottom if this chat is currently open
    if (activeChatId === chatId) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 50);
    } else {
      // If chat is in the background, send a local push notification alert!
      sendLocalNotification(
        `New Message from ${session.fullName}`,
        `💬 "${replyText.substring(0, 45)}${replyText.length > 45 ? '...' : ''}"`
      );
    }
  };

  const handleStartNewChat = (emp: typeof DIRECTORY_EMPLOYEES[0]) => {
    setShowNewChatSheet(false);

    // Check if chat session already exists
    const existing = sessions.find((s) => s.userId === emp.userId);
    if (existing) {
      setActiveChatId(existing.chatId);
      return;
    }

    const newChatSession: ChatSession = {
      chatId: `chat_${Date.now()}`,
      userId: emp.userId,
      fullName: emp.fullName,
      designation: emp.designation,
      unreadCount: 0,
      lastMessageText: 'Chat started',
      lastMessageTime: new Date().toISOString(),
      isOnline: true,
      messages: [
        {
          messageId: `m_init_${Date.now()}`,
          senderId: emp.userId,
          senderName: emp.fullName,
          text: `Hi! 👋 Glad to connect with you. Let me know if you need anything in ${emp.designation.split(' ')[0]}.`,
          timestamp: new Date().toISOString(),
          status: 'read'
        }
      ]
    };

    setSessions((prev) => [newChatSession, ...prev]);
    setActiveChatId(newChatSession.chatId);
  };

  const filteredSessions = sessions.filter((s) =>
    s.fullName.toLowerCase().includes(searchText.toLowerCase())
  );

  const formatMessageTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <View style={styles.container}>
      {/* 1. Chats Inbox Screen */}
      {!activeChatId ? (
        <View style={styles.inboxWrapper}>
          {/* Search bar */}
          <View style={styles.searchContainer}>
            <MaterialCommunityIcons name="magnify" size={20} color="#9ca3af" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search chat or contact..."
              placeholderTextColor="#9ca3af"
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>

          {/* Inbox List */}
          {filteredSessions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="chat-question-outline" size={50} color="#9ca3af" />
              <Text style={styles.emptyText}>No chats found. Tap message icon to start chatting!</Text>
            </View>
          ) : (
            <FlatList
              data={filteredSessions}
              keyExtractor={(item) => item.chatId}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => {
                const initials = item.fullName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .substring(0, 2);

                return (
                  <TouchableOpacity
                    style={styles.chatRow}
                    onPress={() => setActiveChatId(item.chatId)}
                    activeOpacity={0.7}
                  >
                    {/* Avatar with initials & online ring */}
                    <View style={styles.avatarWrapper}>
                      <View style={styles.avatarCircle}>
                        <Text style={styles.avatarInitials}>{initials}</Text>
                      </View>
                      {item.isOnline && <View style={styles.onlineIndicator} />}
                    </View>

                    {/* Chat details */}
                    <View style={styles.chatInfo}>
                      <View style={styles.chatHeaderRow}>
                        <Text style={styles.chatName}>{item.fullName}</Text>
                        <Text style={styles.chatTime}>{formatMessageTime(item.lastMessageTime)}</Text>
                      </View>
                      
                      <Text style={styles.chatRole}>{item.designation}</Text>
                      
                      <View style={styles.lastMessageRow}>
                        <Text style={styles.lastMessageText} numberOfLines={1}>
                          {item.lastMessageText}
                        </Text>
                        {item.unreadCount > 0 && (
                          <View style={styles.unreadBadge}>
                            <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          )}

          {/* Start New Chat FAB */}
          <TouchableOpacity
            style={styles.fab}
            onPress={() => setShowNewChatSheet(true)}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="message-plus-outline" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>
      ) : (
        /* 2. Chat Conversation View */
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
          style={styles.chatWindowWrapper}
        >
          {/* Header */}
          <View style={styles.windowHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setActiveChatId(null)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color="#111827" />
            </TouchableOpacity>

            <View style={styles.headerAvatar}>
              <Text style={styles.headerAvatarInitials}>
                {activeChat?.fullName.split(' ').map((n) => n[0]).join('').substring(0, 2)}
              </Text>
              {activeChat?.isOnline && <View style={styles.headerOnlineIndicator} />}
            </View>

            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerName}>{activeChat?.fullName}</Text>
              <Text style={styles.headerStatus}>
                {activeChat?.isOnline ? 'Online' : 'Away'}
              </Text>
            </View>

            {/* Decorative Call Icons for high-end look */}
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.headerActionBtn} onPress={() => Alert.alert('Voice Call', `Initiating encrypted voice call with ${activeChat?.fullName}...`)}>
                <MaterialCommunityIcons name="phone-outline" size={22} color="#0A66C2" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerActionBtn} onPress={() => Alert.alert('Video Call', `Initiating HD video conference with ${activeChat?.fullName}...`)}>
                <MaterialCommunityIcons name="video-outline" size={22} color="#0A66C2" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Chat Background image simulator (nice light grey WhatsApp bubble pattern) */}
          <View style={styles.chatBackgroundContainer}>
            {/* Messages Stream */}
            <FlatList
              ref={flatListRef}
              data={activeChat?.messages || []}
              keyExtractor={(item) => item.messageId}
              contentContainerStyle={styles.messageListContent}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
              renderItem={({ item }) => {
                const isMe = item.senderId === 'current_user';
                return (
                  <View style={[styles.messageBubbleContainer, isMe ? styles.bubbleMeContainer : styles.bubbleOtherContainer]}>
                    <View style={[styles.messageBubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
                      <Text style={[styles.messageText, isMe ? styles.messageTextMe : styles.messageTextOther]}>
                        {item.text}
                      </Text>
                      
                      <View style={styles.bubbleStatusRow}>
                        <Text style={[styles.messageTime, isMe ? styles.messageTimeMe : styles.messageTimeOther]}>
                          {formatMessageTime(item.timestamp)}
                        </Text>
                        
                        {isMe && (
                          <MaterialCommunityIcons
                            name={item.status === 'read' ? 'check-all' : 'check'}
                            size={14}
                            color={item.status === 'read' ? '#3b82f6' : '#9ca3af'}
                            style={styles.checkmarkIcon}
                          />
                        )}
                      </View>
                    </View>
                  </View>
                );
              }}
            />
          </View>

          {/* Bottom input area */}
          <View style={styles.inputAreaRow}>
            <View style={styles.inputCard}>
              <TouchableOpacity style={styles.inputActionIcon}>
                <MaterialCommunityIcons name="emoticon-happy-outline" size={22} color="#6b7280" />
              </TouchableOpacity>
              
              <TextInput
                style={styles.messageTextInput}
                placeholder="Type a message..."
                placeholderTextColor="#9ca3af"
                value={typedMessage}
                onChangeText={setTypedMessage}
                multiline
                maxLength={400}
              />
              
              <TouchableOpacity 
                style={styles.inputActionIcon}
                onPress={() => Alert.alert('Attachment', 'Attach images, documents, or contact cards in premium chat.')}
              >
                <MaterialCommunityIcons name="paperclip" size={22} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.sendButton,
                typedMessage.trim().length === 0 ? styles.micButton : styles.realSendButton
              ]}
              onPress={typedMessage.trim().length === 0 ? () => Alert.alert('Voice Memo', 'Recording audio message... (tap to stop)') : handleSendMessage}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name={typedMessage.trim().length === 0 ? 'microphone' : 'send'}
                size={20}
                color="#ffffff"
              />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}

      {/* 3. New Chat Modal Sheet */}
      {showNewChatSheet && (
        <View style={styles.sheetOverlay}>
          <TouchableOpacity 
            style={styles.sheetDismissArea} 
            onPress={() => setShowNewChatSheet(false)} 
          />
          <View style={styles.sheetContent}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Start New Direct Chat</Text>
              <TouchableOpacity onPress={() => setShowNewChatSheet(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.sheetSubtitle}>Choose a team member to direct message:</Text>

            <ScrollView contentContainerStyle={styles.sheetEmployeeList}>
              {DIRECTORY_EMPLOYEES.map((emp) => (
                <TouchableOpacity
                  key={emp.userId}
                  style={styles.sheetEmployeeRow}
                  onPress={() => handleStartNewChat(emp)}
                >
                  <View style={[styles.sheetAvatar, { backgroundColor: emp.color }]}>
                    <Text style={styles.sheetAvatarText}>{emp.initials}</Text>
                  </View>
                  <View style={styles.sheetEmpDetails}>
                    <Text style={styles.sheetEmpName}>{emp.fullName}</Text>
                    <Text style={styles.sheetEmpRole}>{emp.designation}</Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={20} color="#9ca3af" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  inboxWrapper: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    margin: 16,
    paddingHorizontal: 12,
    height: 44,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#111827',
    fontSize: 13,
  },
  listContent: {
    paddingBottom: 80,
  },
  chatRow: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e8f4f8',
    borderColor: 'rgba(10, 102, 194, 0.15)',
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0A66C2',
  },
  onlineIndicator: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  chatInfo: {
    flex: 1,
    marginLeft: 14,
  },
  chatHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  chatTime: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '600',
  },
  chatRole: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '600',
    marginTop: 2,
  },
  lastMessageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  lastMessageText: {
    fontSize: 13,
    color: '#4b5563',
    flex: 1,
    marginRight: 10,
  },
  unreadBadge: {
    backgroundColor: '#22c55e',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#0A66C2',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0A66C2',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
    paddingHorizontal: 32,
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 13,
    marginTop: 12,
    textAlign: 'center',
  },
  chatWindowWrapper: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  windowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
  },
  backButton: {
    padding: 4,
  },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#e8f4f8',
    borderColor: 'rgba(10, 102, 194, 0.1)',
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    position: 'relative',
  },
  headerAvatarInitials: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0A66C2',
  },
  headerOnlineIndicator: {
    position: 'absolute',
    right: -1,
    bottom: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22c55e',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  headerTitleContainer: {
    marginLeft: 10,
    flex: 1,
  },
  headerName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  headerStatus: {
    fontSize: 10,
    color: '#22c55e',
    fontWeight: '700',
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerActionBtn: {
    padding: 6,
    marginLeft: 8,
  },
  chatBackgroundContainer: {
    flex: 1,
    backgroundColor: '#e2e8f0',
  },
  messageListContent: {
    padding: 16,
    paddingBottom: 24,
  },
  messageBubbleContainer: {
    width: '100%',
    marginVertical: 4,
    flexDirection: 'row',
  },
  bubbleMeContainer: {
    justifyContent: 'flex-end',
  },
  bubbleOtherContainer: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 1,
  },
  bubbleMe: {
    backgroundColor: '#d9fdd3', // Classic WhatsApp green bubble color
    borderTopRightRadius: 2,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.1)',
  },
  bubbleOther: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 2,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 18,
  },
  messageTextMe: {
    color: '#111827',
  },
  messageTextOther: {
    color: '#111827',
  },
  bubbleStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 2,
  },
  messageTime: {
    fontSize: 9,
    fontWeight: '600',
  },
  messageTimeMe: {
    color: '#5b6b5c',
  },
  messageTimeOther: {
    color: '#94a3b8',
  },
  checkmarkIcon: {
    marginLeft: 4,
  },
  inputAreaRow: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  inputCard: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingHorizontal: 10,
    alignItems: 'center',
    minHeight: 40,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  messageTextInput: {
    flex: 1,
    color: '#111827',
    fontSize: 14,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  inputActionIcon: {
    padding: 4,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  realSendButton: {
    backgroundColor: '#0a66c2',
  },
  micButton: {
    backgroundColor: '#22c55e',
  },
  sheetOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  sheetDismissArea: {
    flex: 1,
  },
  sheetContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '70%',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  sheetSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
    marginBottom: 16,
  },
  sheetEmployeeList: {
    paddingBottom: 20,
  },
  sheetEmployeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  sheetAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetAvatarText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  sheetEmpDetails: {
    flex: 1,
    marginLeft: 12,
  },
  sheetEmpName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  sheetEmpRole: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '600',
    marginTop: 2,
  },
});
