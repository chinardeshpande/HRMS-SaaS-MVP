import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ModernLayout } from '../components/layout/ModernLayout';
import VideoCall from '../components/VideoCall';
import chatService, { ChatMessage } from '../services/chatService';
import socketService from '../services/socketService';
import {
  PaperAirplaneIcon,
  PaperClipIcon,
  PhotoIcon,
  XMarkIcon,
  ArrowLeftIcon,
  EllipsisVerticalIcon,
  PhoneIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline';

export default function ChatConversation() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [conversation, setConversation] = useState<any>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [callType, setCallType] = useState<'audio' | 'video' | null>(null);
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [remoteSocketId, setRemoteSocketId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteSocketIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!conversationId) return;

    // Initialize WebSocket connection
    const tokens = localStorage.getItem('tokens');
    if (tokens) {
      const { token } = JSON.parse(tokens);
      socketService.connect(token);

      // Join conversation
      socketService.joinConversation(conversationId);

      // Listen for new messages
      socketService.onNewMessage((message: ChatMessage) => {
        console.log('📨 New message received:', message);
        if (message.conversationId === conversationId) {
          // Avoid duplicates by checking if message already exists
          setMessages(prev => {
            const exists = prev.some(m => m.messageId === message.messageId);
            if (exists) {
              console.log('⚠️ Message already exists, skipping:', message.messageId);
              return prev;
            }
            return [...prev, message];
          });
          scrollToBottom();
        }
      });

      // Listen for typing indicators
      socketService.onUserTyping((data) => {
        if (data.conversationId === conversationId) {
          setIsTyping(true);
          setTimeout(() => setIsTyping(false), 3000);
        }
      });

      socketService.onUserStoppedTyping((data) => {
        if (data.conversationId === conversationId) {
          setIsTyping(false);
        }
      });

      // WebRTC Call Listeners
      const socket = socketService.getSocket();
      if (socket) {
        socket.on('incoming_call', (data: any) => {
          console.log('📞 Incoming call:', data);
          setIncomingCall(data);
        });

        socket.on('call_answered', async (data: any) => {
          console.log('📞 Call answered:', data);

          // Set remote socket ID
          setRemoteSocketId(data.socketId);
          remoteSocketIdRef.current = data.socketId;

          console.log('🔗 Creating peer connection for caller...');
          const pc = createPeerConnection();
          peerConnectionRef.current = pc;

          if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => {
              console.log(`➕ Adding ${track.kind} track to peer connection`);
              pc.addTrack(track, localStreamRef.current!);
            });
          } else {
            console.error('❌ No local stream available!');
            return;
          }

          console.log('📤 Creating and sending WebRTC offer...');
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          console.log('✅ Local description set:', offer.type);

          socket.emit('webrtc_offer', {
            targetSocketId: data.socketId,
            offer: pc.localDescription,
          });
          console.log('✅ Offer sent to', data.socketId);
        });

        socket.on('call_rejected', () => {
          console.log('📞 Call rejected');
          alert('Call was rejected');
          endCall();
        });

        socket.on('call_ended', () => {
          console.log('📞 Call ended');
          endCall();
        });

        socket.on('webrtc_offer', async (data: any) => {
          console.log('📥 Received WebRTC offer from', data.senderSocketId);
          if (peerConnectionRef.current) {
            try {
              console.log('🔗 Setting remote description (offer)...');
              await peerConnectionRef.current.setRemoteDescription(
                new RTCSessionDescription(data.offer)
              );
              console.log('✅ Remote description set');

              console.log('📤 Creating answer...');
              const answer = await peerConnectionRef.current.createAnswer();
              await peerConnectionRef.current.setLocalDescription(answer);
              console.log('✅ Local description set (answer)');

              socket.emit('webrtc_answer', {
                targetSocketId: data.senderSocketId,
                answer: peerConnectionRef.current.localDescription,
              });
              console.log('✅ Answer sent to', data.senderSocketId);
            } catch (error) {
              console.error('❌ Error handling WebRTC offer:', error);
            }
          } else {
            console.error('❌ No peer connection available to handle offer!');
          }
        });

        socket.on('webrtc_answer', async (data: any) => {
          console.log('📥 Received WebRTC answer from', data.senderSocketId);
          if (peerConnectionRef.current) {
            try {
              console.log('🔗 Setting remote description (answer)...');
              await peerConnectionRef.current.setRemoteDescription(
                new RTCSessionDescription(data.answer)
              );
              console.log('✅ Remote description set. WebRTC connection should be established.');
            } catch (error) {
              console.error('❌ Error handling WebRTC answer:', error);
            }
          } else {
            console.error('❌ No peer connection available to handle answer!');
          }
        });

        socket.on('webrtc_ice_candidate', async (data: any) => {
          console.log('🧊 Received ICE candidate from', data.senderSocketId);
          if (peerConnectionRef.current && data.candidate) {
            try {
              await peerConnectionRef.current.addIceCandidate(
                new RTCIceCandidate(data.candidate)
              );
              console.log('✅ ICE candidate added');
            } catch (error) {
              console.error('❌ Error adding ICE candidate:', error);
            }
          } else if (!peerConnectionRef.current) {
            console.error('❌ No peer connection available to add ICE candidate!');
          }
        });
      }
    }

    // Load conversation and messages
    loadConversation();
    loadMessages();

    return () => {
      if (conversationId) {
        socketService.leaveConversation(conversationId);
      }

      const socket = socketService.getSocket();
      if (socket) {
        socket.off('incoming_call');
        socket.off('call_answered');
        socket.off('call_rejected');
        socket.off('call_ended');
        socket.off('webrtc_offer');
        socket.off('webrtc_answer');
        socket.off('webrtc_ice_candidate');
      }

      endCall();
    };
  }, [conversationId]);

  // Monitor video element streams
  useEffect(() => {
    if (localVideoRef.current) {
      console.log('📹 Local video ref stream:', localVideoRef.current.srcObject);
    }
    if (remoteVideoRef.current) {
      console.log('📹 Remote video ref stream:', remoteVideoRef.current.srcObject);
    }
  }, [isCallActive, localStreamRef.current]);

  const loadConversation = async () => {
    if (!conversationId) return;
    try {
      const data = await chatService.getConversationById(conversationId);
      setConversation(data);
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  const loadMessages = async () => {
    if (!conversationId) return;
    setLoading(true);
    try {
      const data = await chatService.getMessages(conversationId);
      setMessages(data);
      scrollToBottom();

      // Mark messages as read
      await chatService.markAsRead(conversationId);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleTyping = () => {
    if (!conversationId) return;

    socketService.startTyping(conversationId);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socketService.stopTyping(conversationId);
    }, 2000);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!conversationId || (!messageInput.trim() && !selectedFile)) return;

    const content = messageInput.trim();
    setSending(true);

    try {
      if (selectedFile) {
        // Upload file using FormData
        const formData = new FormData();
        formData.append('file', selectedFile);
        if (content) {
          formData.append('caption', content);
        }

        const tokens = localStorage.getItem('tokens');
        if (!tokens) throw new Error('No authentication token');

        const { token } = JSON.parse(tokens);
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

        console.log('📤 Uploading file to:', `${apiUrl}/chat/conversations/${conversationId}/upload`);

        const response = await fetch(`${apiUrl}/chat/conversations/${conversationId}/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });

        console.log('📥 Upload response status:', response.status);

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          console.error('❌ Upload error response:', errorData);
          throw new Error(errorData?.error?.message || `File upload failed with status ${response.status}`);
        }

        const result = await response.json();
        console.log('✅ File uploaded successfully:', result);

        // Message will be broadcast via WebSocket and deduplicated in the listener
      } else {
        // For text messages, use WebSocket for real-time delivery
        socketService.sendMessage({
          conversationId,
          content,
        });
      }

      setMessageInput('');
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      scrollToBottom();
    } catch (error) {
      console.error('❌ Error sending message:', error);
      alert(`Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSending(false);
    }
  };

  const createPeerConnection = () => {
    const config: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    };

    console.log('🔗 Creating RTCPeerConnection with config:', config);
    const pc = new RTCPeerConnection(config);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('🧊 ICE candidate generated');
        if (remoteSocketIdRef.current) {
          socketService.getSocket()?.emit('webrtc_ice_candidate', {
            targetSocketId: remoteSocketIdRef.current,
            candidate: event.candidate,
          });
        } else {
          console.warn('⚠️ No remote socket ID available for ICE candidate');
        }
      } else {
        console.log('✅ ICE gathering complete');
      }
    };

    pc.ontrack = (event) => {
      console.log('📥 Remote track received:', event.track.kind, event.streams[0]);
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
        console.log('✅ Remote stream set to video element');

        // Ensure video plays (handle autoplay policy)
        remoteVideoRef.current.play().catch(err => {
          console.error('Error playing remote video:', err);
          // Try playing with muted attribute
          remoteVideoRef.current!.muted = true;
          remoteVideoRef.current!.play().catch(e => console.error('Still failed:', e));
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('🔌 ICE connection state:', pc.iceConnectionState);
    };

    pc.onconnectionstatechange = () => {
      console.log('🔌 Connection state:', pc.connectionState);
      if (pc.connectionState === 'failed') {
        console.error('❌ WebRTC connection failed');
        alert('Connection failed. Please try again.');
        endCall();
      }
    };

    return pc;
  };

  const startCall = async (type: 'audio' | 'video') => {
    try {
      console.log(`🎥 Starting ${type} call...`);
      setCallType(type);

      // Get target participant (for direct chat, get the other person)
      if (!conversation) {
        console.error('No conversation found');
        return;
      }

      const targetParticipant = conversation.participants?.find(
        (p: any) => p.employeeId !== currentUserId
      );

      if (!targetParticipant) {
        alert('No participant found to call');
        return;
      }

      // Request permissions first with specific constraints
      const constraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: type === 'video' ? {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 60 },
          facingMode: 'user',
        } : false,
      };

      console.log('📹 Requesting media access with constraints:', constraints);

      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log('✅ Media access granted. Tracks:', stream.getTracks().map(t => ({
          kind: t.kind,
          enabled: t.enabled,
          label: t.label,
          readyState: t.readyState,
          settings: t.getSettings(),
        })));

        localStreamRef.current = stream;

        // Initiate call via signaling server
        console.log('📞 Sending call_initiate to:', targetParticipant.employeeId);
        socketService.getSocket()?.emit('call_initiate', {
          conversationId,
          targetEmployeeId: targetParticipant.employeeId,
          callType: type,
        });

        setIsCallActive(true);
      } catch (mediaError: any) {
        console.error('❌ Media access error:', mediaError);

        if (mediaError.name === 'NotAllowedError') {
          alert('Camera/microphone access denied.\n\nPlease:\n1. Click the camera icon in your browser address bar\n2. Allow camera and microphone access\n3. Refresh the page and try again');
        } else if (mediaError.name === 'NotFoundError') {
          alert('No camera or microphone found.\n\nPlease:\n1. Connect a webcam and microphone\n2. Check that they are not being used by another application\n3. Try again');
        } else if (mediaError.name === 'NotReadableError') {
          alert('Camera or microphone is already in use by another application.\n\nPlease close other apps using your camera/mic and try again.');
        } else if (mediaError.name === 'OverconstrainedError') {
          alert('Your camera/microphone does not meet the requirements.\n\nTrying with relaxed settings...');

          // Fallback to basic constraints
          try {
            const fallbackStream = await navigator.mediaDevices.getUserMedia({
              audio: true,
              video: type === 'video',
            });
            localStreamRef.current = fallbackStream;

            socketService.getSocket()?.emit('call_initiate', {
              conversationId,
              targetEmployeeId: targetParticipant.employeeId,
              callType: type,
            });

            setIsCallActive(true);
            return;
          } catch (fallbackError) {
            console.error('Fallback also failed:', fallbackError);
            throw mediaError;
          }
        } else {
          alert(`Failed to access camera/microphone: ${mediaError.message}`);
        }

        setCallType(null);
        setIsCallActive(false);
        return;
      }
    } catch (error: any) {
      console.error('❌ Error starting call:', error);
      alert(`Failed to start call: ${error.message}`);
      setCallType(null);
      setIsCallActive(false);
    }
  };

  const startAudioCall = () => startCall('audio');
  const startVideoCall = () => startCall('video');

  const answerCall = async () => {
    if (!incomingCall) return;

    try {
      console.log('📞 Answering call:', incomingCall);
      setCallType(incomingCall.callType);
      setRemoteSocketId(incomingCall.socketId);
      remoteSocketIdRef.current = incomingCall.socketId;

      const constraints = {
        audio: true,
        video: incomingCall.callType === 'video' ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        } : false,
      };

      console.log('📹 Requesting media access:', constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('✅ Media access granted:', stream.getTracks().map(t => t.kind));

      localStreamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        console.log('✅ Local video element updated');

        // Play local video
        if (incomingCall.callType === 'video') {
          try {
            await localVideoRef.current.play();
            console.log('✅ Local video playing');
          } catch (err) {
            console.error('Error playing local video:', err);
          }
        }
      }

      console.log('🔗 Creating peer connection...');
      const pc = createPeerConnection();
      peerConnectionRef.current = pc;

      stream.getTracks().forEach((track) => {
        console.log(`➕ Adding ${track.kind} track to peer connection`);
        pc.addTrack(track, stream);
      });

      console.log('📤 Sending call_answer');
      socketService.getSocket()?.emit('call_answer', {
        callerId: incomingCall.callerId,
        callerSocketId: incomingCall.socketId,
      });

      setIsCallActive(true);
      setIncomingCall(null);
    } catch (error: any) {
      console.error('❌ Error answering call:', error);
      if (error.name === 'NotAllowedError') {
        alert('Camera/microphone access denied. Please allow permissions in your browser settings.');
      } else if (error.name === 'NotFoundError') {
        alert('No camera or microphone found. Please connect a device.');
      } else {
        alert(`Failed to answer call: ${error.message}`);
      }
      setIncomingCall(null);
    }
  };

  const rejectCall = () => {
    if (!incomingCall) return;

    socketService.getSocket()?.emit('call_reject', {
      callerId: incomingCall.callerId,
      callerSocketId: incomingCall.socketId,
    });

    setIncomingCall(null);
  };

  const endCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (remoteSocketId) {
      socketService.getSocket()?.emit('call_end', {
        targetSocketId: remoteSocketId,
        conversationId,
      });
    }

    setCallType(null);
    setIsCallActive(false);
    setRemoteSocketId(null);
    remoteSocketIdRef.current = null;
  };

  const getRelativeTime = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return time.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const currentUser = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null;
  const currentUserId = currentUser?.employeeId;

  return (
    <ModernLayout>
      <div className="h-[calc(100vh-120px)] flex flex-col bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Chat Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-pink-50 to-rose-50">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/hr-connect?tab=chat')}
              className="p-2 hover:bg-white rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
            </button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white font-semibold shadow-md">
              {conversation?.name?.charAt(0) || '?'}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{conversation?.name || 'Loading...'}</h2>
              <p className="text-sm text-gray-500">
                {conversation?.type === 'group'
                  ? `${conversation?.participants?.length || 0} participants`
                  : 'Direct message'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={startAudioCall}
              className="p-2 hover:bg-white rounded-lg transition-colors group"
              title="Start audio call"
            >
              <PhoneIcon className="h-5 w-5 text-gray-600 group-hover:text-green-600" />
            </button>
            <button
              onClick={startVideoCall}
              className="p-2 hover:bg-white rounded-lg transition-colors group"
              title="Start video call"
            >
              <VideoCameraIcon className="h-5 w-5 text-gray-600 group-hover:text-blue-600" />
            </button>
            <button className="p-2 hover:bg-white rounded-lg transition-colors">
              <EllipsisVerticalIcon className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-pink-600"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <svg className="w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-lg">No messages yet</p>
              <p className="text-sm">Start the conversation!</p>
            </div>
          ) : (
            <>
              {messages.map((message, index) => {
                const isOwnMessage = message.senderId === currentUserId;
                const showAvatar = index === 0 || messages[index - 1].senderId !== message.senderId;

                return (
                  <div
                    key={message.messageId}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} items-end space-x-2`}
                  >
                    {!isOwnMessage && (
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-semibold ${showAvatar ? '' : 'invisible'}`}>
                        {message.senderName.charAt(0)}
                      </div>
                    )}
                    <div className={`flex flex-col max-w-md ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                      {showAvatar && !isOwnMessage && (
                        <span className="text-xs text-gray-500 mb-1 ml-2">{message.senderName}</span>
                      )}
                      <div
                        className={`px-4 py-2 rounded-2xl shadow-sm ${
                          isOwnMessage
                            ? 'bg-gradient-to-br from-pink-500 to-rose-600 text-white'
                            : 'bg-white text-gray-900 border border-gray-200'
                        }`}
                      >
                        {/* Image attachment */}
                        {message.messageType === 'image' && message.attachments && message.attachments.length > 0 && (
                          <div className="mb-2">
                            <a
                              href={`${import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:3000'}${message.attachments[0].fileUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block"
                            >
                              <img
                                src={`${import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:3000'}${message.attachments[0].fileUrl}`}
                                alt={message.attachments[0].fileName}
                                className="max-w-xs max-h-64 rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
                              />
                            </a>
                          </div>
                        )}
                        {/* File attachment */}
                        {message.messageType === 'file' && message.attachments && message.attachments.length > 0 && (
                          <a
                            href={`${import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:3000'}${message.attachments[0].fileUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            download={message.attachments[0].fileName}
                            className={`mb-2 flex items-center space-x-2 p-2 rounded-lg ${isOwnMessage ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-100 hover:bg-gray-200'} transition-colors cursor-pointer`}
                          >
                            <PaperClipIcon className="h-5 w-5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{message.attachments[0].fileName}</p>
                              <p className="text-xs opacity-75">{message.attachments[0].fileSize ? `${(Number(message.attachments[0].fileSize) / 1024).toFixed(1)} KB` : 'Download'}</p>
                            </div>
                          </a>
                        )}
                        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                      </div>
                      <span className={`text-xs text-gray-400 mt-1 ${isOwnMessage ? 'mr-2' : 'ml-2'}`}>
                        {getRelativeTime(message.createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })}
              {isTyping && (
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm">
                    ...
                  </div>
                  <div className="bg-white px-4 py-2 rounded-2xl border border-gray-200">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Message Input */}
        <form onSubmit={sendMessage} className="p-4 bg-white border-t border-gray-200">
          {selectedFile && (
            <div className="mb-3 flex items-center justify-between bg-pink-50 p-3 rounded-lg border border-pink-200">
              <div className="flex items-center space-x-2">
                <PaperClipIcon className="h-5 w-5 text-pink-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                </div>
              </div>
              <button
                type="button"
                onClick={removeSelectedFile}
                className="p-1 hover:bg-pink-100 rounded transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          )}
          <div className="flex items-end space-x-2">
            <div className="flex space-x-2">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                accept="image/*,.pdf,.doc,.docx,.txt"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-gray-400 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors"
                title="Attach file"
              >
                <PhotoIcon className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-gray-400 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors"
                title="Attach document"
              >
                <PaperClipIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="flex-1 flex items-end space-x-2">
              <textarea
                value={messageInput}
                onChange={(e) => {
                  setMessageInput(e.target.value);
                  handleTyping();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(e);
                  }
                }}
                placeholder="Type a message..."
                rows={1}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none max-h-32"
              />
              <button
                type="submit"
                disabled={sending || (!messageInput.trim() && !selectedFile)}
                className="p-3 bg-gradient-to-br from-pink-500 to-rose-600 text-white rounded-xl hover:from-pink-600 hover:to-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
              >
                {sending ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                ) : (
                  <PaperAirplaneIcon className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">Press Enter to send, Shift+Enter for new line</p>
        </form>
      </div>

      {/* Incoming Call Modal */}
      {incomingCall && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                {incomingCall.callType === 'video' ? (
                  <VideoCameraIcon className="h-12 w-12 text-white" />
                ) : (
                  <PhoneIcon className="h-12 w-12 text-white" />
                )}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Incoming {incomingCall.callType} call</h3>
              <p className="text-gray-600 mb-8">{incomingCall.callerName || 'Unknown'}</p>
              <div className="flex space-x-4">
                <button
                  onClick={rejectCall}
                  className="flex-1 bg-red-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-red-600 transition-colors"
                >
                  Decline
                </button>
                <button
                  onClick={answerCall}
                  className="flex-1 bg-green-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-green-600 transition-colors"
                >
                  Accept
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Call UI - Using VideoCall Component */}
      {isCallActive && callType && (
        <VideoCall
          conversationId={conversationId!}
          conversationName={conversation?.name || 'Call in progress'}
          callType={callType}
          isInitiator={true}
          remoteSocketId={remoteSocketId}
          onEndCall={endCall}
          peerConnection={peerConnectionRef.current}
          localStream={localStreamRef.current}
        />
      )}
    </ModernLayout>
  );
}
