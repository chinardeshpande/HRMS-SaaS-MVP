import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ModernLayout } from '../components/layout/ModernLayout';
import chatService, { ChatConversation, ChatMessage } from '../services/chatService';
import {
  PaperAirplaneIcon,
  PaperClipIcon,
  PhotoIcon,
  FaceSmileIcon,
  EllipsisVerticalIcon,
  XMarkIcon,
  ArrowLeftIcon,
  PhoneIcon,
  VideoCameraIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

export default function ChatInterface() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    if (conversationId) {
      fetchConversation();
      fetchMessages();
    }
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversation = async () => {
    try {
      const data = await chatService.getConversationById(conversationId!);
      setConversation(data);
    } catch (error) {
      console.error('Error fetching conversation:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const data = await chatService.getMessages(conversationId!);
      setMessages(data);
      await chatService.markAsRead(conversationId!);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    console.log(`💬 ChatInterface: Sending message to conversation ${conversationId}: "${newMessage}"`);
    try {
      setSending(true);
      const message = await chatService.sendMessage(conversationId!, newMessage);
      console.log('✅ ChatInterface: Message sent successfully:', message);
      setMessages([...messages, message]);
      setNewMessage('');
    } catch (error) {
      console.error('❌ ChatInterface: Error sending message:', error);
      alert(`Error sending message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } else if (isYesterday) {
      return 'Yesterday ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' +
        date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }
  };

  const getOtherParticipant = () => {
    if (!conversation) return null;
    return conversation.participants.find(p => p.userId !== 'current');
  };

  const otherParticipant = getOtherParticipant();

  return (
    <ModernLayout title="Chat">
      <div className="h-[calc(100vh-10rem)] flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Chat Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/hr-connect?tab=chat')}
              className="p-2 hover:bg-white rounded-lg transition-colors"
              title="Back to HR Connect"
            >
              <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
            </button>

            {conversation && (
              <>
                {conversation.type === 'one_on_one' && otherParticipant ? (
                  <>
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        {otherParticipant.userName.charAt(0)}
                      </div>
                      {otherParticipant.isOnline && (
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">{otherParticipant.userName}</h2>
                      <p className="text-sm text-gray-500">
                        {otherParticipant.isOnline ? 'Active now' : `Last seen ${otherParticipant.lastSeen || 'recently'}`}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      {conversation.name.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">{conversation.name}</h2>
                      <p className="text-sm text-gray-500">{conversation.participants.length} members</p>
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              className="p-2 hover:bg-white rounded-lg transition-colors"
              title="Voice call"
            >
              <PhoneIcon className="h-5 w-5 text-gray-600" />
            </button>
            <button
              className="p-2 hover:bg-white rounded-lg transition-colors"
              title="Video call"
            >
              <VideoCameraIcon className="h-5 w-5 text-gray-600" />
            </button>
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="p-2 hover:bg-white rounded-lg transition-colors"
              title="Conversation details"
            >
              <InformationCircleIcon className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mb-4">
                <FaceSmileIcon className="h-10 w-10 text-blue-600" />
              </div>
              <p className="text-gray-500 text-lg">No messages yet</p>
              <p className="text-gray-400 text-sm mt-1">Start the conversation!</p>
            </div>
          ) : (
            <>
              {messages.map((message, index) => {
                const isCurrentUser = message.senderId === 'current';
                const showAvatar = index === 0 || messages[index - 1].senderId !== message.senderId;
                const showTime = index === messages.length - 1 ||
                  messages[index + 1].senderId !== message.senderId ||
                  (new Date(messages[index + 1].createdAt).getTime() - new Date(message.createdAt).getTime() > 300000);

                return (
                  <div
                    key={message.messageId}
                    className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} ${showAvatar ? 'mt-4' : 'mt-1'}`}
                  >
                    <div className={`flex items-end space-x-2 max-w-[70%] ${isCurrentUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      {showAvatar && !isCurrentUser && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                          {message.senderName.charAt(0)}
                        </div>
                      )}
                      {!showAvatar && !isCurrentUser && (
                        <div className="w-8 h-8 flex-shrink-0"></div>
                      )}

                      <div>
                        {showAvatar && !isCurrentUser && (
                          <p className="text-xs text-gray-500 mb-1 ml-1">{message.senderName}</p>
                        )}
                        <div
                          className={`rounded-2xl px-4 py-2 ${
                            isCurrentUser
                              ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                              : 'bg-white text-gray-900 shadow-sm border border-gray-200'
                          }`}
                        >
                          {message.messageType === 'text' && (
                            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                          )}
                          {message.messageType === 'file' && message.attachments && (
                            <div className="space-y-2">
                              <p className="text-sm">{message.content}</p>
                              {message.attachments.map((attachment) => (
                                <div
                                  key={attachment.attachmentId}
                                  className={`flex items-center space-x-2 p-2 rounded-lg ${
                                    isCurrentUser ? 'bg-white/20' : 'bg-gray-50'
                                  }`}
                                >
                                  <PaperClipIcon className="h-4 w-4" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium truncate">{attachment.fileName}</p>
                                    {attachment.fileSize && (
                                      <p className="text-xs opacity-75">{attachment.fileSize}</p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        {showTime && (
                          <p className={`text-xs text-gray-400 mt-1 ${isCurrentUser ? 'text-right mr-1' : 'ml-1'}`}>
                            {formatMessageTime(message.createdAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Message Input */}
        <div className="border-t border-gray-200 p-4 bg-white">
          <form onSubmit={handleSendMessage} className="flex items-end space-x-2">
            <div className="flex-1 bg-gray-100 rounded-2xl px-4 py-2">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                placeholder="Type a message..."
                rows={1}
                className="w-full bg-transparent border-none focus:outline-none resize-none text-sm"
                style={{ maxHeight: '120px' }}
              />
            </div>

            <div className="flex items-center space-x-1">
              <button
                type="button"
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                title="Attach photo"
              >
                <PhotoIcon className="h-5 w-5 text-gray-600" />
              </button>
              <button
                type="button"
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                title="Attach file"
              >
                <PaperClipIcon className="h-5 w-5 text-gray-600" />
              </button>
              <button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className={`p-3 rounded-full transition-all ${
                  newMessage.trim() && !sending
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600 hover:shadow-lg transform hover:scale-105'
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
                title="Send message"
              >
                <PaperAirplaneIcon className="h-5 w-5 text-white" />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Conversation Info Sidebar */}
      {showInfo && conversation && (
        <div className="fixed inset-y-0 right-0 w-80 bg-white border-l border-gray-200 shadow-xl z-50 overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Details</h3>
              <button
                onClick={() => setShowInfo(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            {/* Conversation details */}
            <div className="space-y-6">
              {/* Participants */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                  {conversation.type === 'one_on_one' ? 'Contact' : `Members (${conversation.participants.length})`}
                </h4>
                <div className="space-y-3">
                  {conversation.participants.map((participant) => (
                    <div key={participant.userId} className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                        {participant.userName.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{participant.userName}</p>
                        <p className="text-xs text-gray-500">
                          {participant.isOnline ? 'Active now' : `Last seen ${participant.lastSeen || 'recently'}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </ModernLayout>
  );
}
