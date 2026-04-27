import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ModernLayout } from '../components/layout/ModernLayout';
import VideoCall from '../components/VideoCall';
import SaveChoicesModal from '../components/chat/SaveChoicesModal';
import chatService, { ChatMessage } from '../services/chatService';
import socketService from '../services/socketService';
import { digitalLibraryService } from '../services/digitalLibraryService';
import {
  PaperAirplaneIcon,
  PaperClipIcon,
  PhotoIcon,
  XMarkIcon,
  ArrowLeftIcon,
  EllipsisVerticalIcon,
  PhoneIcon,
  VideoCameraIcon,
  ArrowDownTrayIcon,
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
  const [selectedImage, setSelectedImage] = useState<{url: string, fileName: string, senderId?: string} | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [filePermissions, setFilePermissions] = useState<any>(null);
  const [selectedFileForSave, setSelectedFileForSave] = useState<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteSocketIdRef = useRef<string | null>(null);

  // Set up WebSocket listener ONCE on mount
  useEffect(() => {
    if (!conversationId) return;

    console.log('🔧 [MOUNT] Setting up WebSocket for conversation:', conversationId);

    // Initialize WebSocket connection
    const tokens = localStorage.getItem('tokens');
    if (!tokens) return;

    const { token } = JSON.parse(tokens);

    if (!socketService.isConnected()) {
      console.log('🔌 WebSocket not connected, connecting...');
      socketService.connect(token);
    } else {
      console.log('✅ WebSocket already connected');
    }

    // Get socket directly and attach listener
    const socket = socketService.getSocket();
    if (!socket) {
      console.error('❌ No socket available!');
      return;
    }

    // Create message handler
    const handleMessage = (message: ChatMessage) => {
      console.log('📨 [RAW WEBSOCKET] Message received - FULL OBJECT:', message);
      console.log('📨 Message details:', {
        messageId: message.messageId,
        conversationId: message.conversationId,
        content: message.content,
        senderId: message.senderId,
        senderName: message.senderName,
        sender: message.sender,
        createdAt: message.createdAt,
        messageType: message.messageType,
        attachments: message.attachments,
        currentConversation: conversationId
      });

      if (message.attachments && message.attachments.length > 0) {
        console.log('📎 [WEBSOCKET] Message has attachments:', message.attachments);
      }

      // CRITICAL: Check if message is for THIS conversation
      if (message.conversationId !== conversationId) {
        console.log('⚠️ Message is for different conversation, ignoring');
        return;
      }

      console.log('✅ Message is for THIS conversation, updating UI');

      try {
        setMessages(prev => {
          // Check if already exists
          const exists = prev.some(m => m.messageId === message.messageId);
          if (exists) {
            console.log('⚠️ Duplicate message, skipping');
            return prev;
          }

          // Remove optimistic message if exists
          const filtered = prev.filter(m => {
            if (m.messageId?.startsWith('temp-') &&
                m.senderId === message.senderId &&
                m.content === message.content &&
                m.createdAt && message.createdAt &&
                Math.abs(new Date(m.createdAt).getTime() - new Date(message.createdAt).getTime()) < 5000) {
              console.log('🔄 Replacing optimistic message');
              return false;
            }
            return true;
          });

          const updated = [...filtered, message];
          console.log('✅ UI UPDATED! New count:', updated.length);
          console.log('✅ Updated messages array:', updated);
          return updated;
        });

        setTimeout(() => scrollToBottom(), 100);
      } catch (error) {
        console.error('❌ ERROR updating messages state:', error);
        console.error('❌ Problematic message:', message);
      }
    };

    // Attach listener directly to socket
    console.log('📡 Attaching new_message listener to socket');
    socket.on('new_message', handleMessage);

    // Join conversation after a short delay
    setTimeout(() => {
      console.log('📥 Joining conversation room:', conversationId);
      socketService.joinConversation(conversationId);
    }, 500);

    // Typing indicators
    const handleTyping = (data: any) => {
      if (data.conversationId === conversationId) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 3000);
      }
    };

    const handleStoppedTyping = (data: any) => {
      if (data.conversationId === conversationId) {
        setIsTyping(false);
      }
    };

    socket.on('user_typing', handleTyping);
    socket.on('user_stopped_typing', handleStoppedTyping);

    // WebRTC Call Listeners
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


    // Load conversation and messages
    loadConversation();
    loadMessages();

    return () => {
      console.log('🧹 [UNMOUNT] Cleaning up WebSocket listeners');

      if (conversationId) {
        socketService.leaveConversation(conversationId);
      }

      const socket = socketService.getSocket();
      if (socket) {
        socket.off('new_message', handleMessage);
        socket.off('user_typing', handleTyping);
        socket.off('user_stopped_typing', handleStoppedTyping);
        socket.off('incoming_call');
        socket.off('call_answered');
        socket.off('call_rejected');
        socket.off('call_ended');
        socket.off('webrtc_offer');
        socket.off('webrtc_answer');
        socket.off('webrtc_ice_candidate');
        console.log('✅ All listeners removed');
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

  // WebSocket connection monitoring
  useEffect(() => {
    console.log('🔌 WebSocket connected:', socketService.isConnected());

    const interval = setInterval(() => {
      if (!socketService.isConnected()) {
        console.log('⚠️ WebSocket disconnected, reconnecting...');
        const tokens = localStorage.getItem('tokens');
        if (tokens) {
          const { token } = JSON.parse(tokens);
          socketService.connect(token);
          if (conversationId) {
            socketService.joinConversation(conversationId);
          }
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [conversationId]);

  // Escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedImage) {
        setSelectedImage(null);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [selectedImage]);

  const loadConversation = async () => {
    if (!conversationId) {
      console.error('❌ No conversation ID provided');
      return;
    }

    console.log('📂 Loading conversation:', conversationId);
    try {
      const data = await chatService.getConversationById(conversationId);
      console.log('✅ Conversation loaded:', data);
      setConversation(data);
    } catch (error) {
      console.error('❌ Error loading conversation:', error);
      alert('Failed to load conversation. Please try again.');
    }
  };

  const loadMessages = async () => {
    if (!conversationId) {
      console.error('❌ No conversation ID for loading messages');
      return;
    }

    console.log('📨 Loading messages for conversation:', conversationId);
    setLoading(true);
    try {
      const data = await chatService.getMessages(conversationId);
      console.log('✅ Messages loaded:', data.length, 'messages');
      setMessages(data);
      scrollToBottom();

      // Mark messages as read
      await chatService.markAsRead(conversationId);
    } catch (error) {
      console.error('❌ Error loading messages:', error);
      alert('Failed to load messages. Please refresh the page.');
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

    // Create optimistic message for instant UI update
    const optimisticMessage: ChatMessage = {
      messageId: `temp-${Date.now()}`,
      conversationId: conversationId,
      senderId: currentUserId,
      senderName: currentUser?.firstName + ' ' + currentUser?.lastName || 'You',
      content: content || (selectedFile ? 'Uploading...' : ''),
      messageType: selectedFile ? (selectedFile.type.startsWith('image/') ? 'image' : 'file') : 'text',
      createdAt: new Date().toISOString(),
      isEdited: false,
      status: 'sent',
      attachments: [],
    };

    console.log('💬 [OPTIMISTIC] Adding optimistic message:', optimisticMessage.messageId);

    // Add optimistic message immediately
    setMessages(prev => {
      console.log('📊 Messages before optimistic:', prev.length);
      const updated = [...prev, optimisticMessage];
      console.log('📊 Messages after optimistic:', updated.length);
      return updated;
    });
    scrollToBottom();

    // Clear input immediately for better UX
    const messageCopy = messageInput;
    const fileCopy = selectedFile;
    setMessageInput('');
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    try {
      if (fileCopy) {
        // Upload file using FormData
        const formData = new FormData();
        formData.append('file', fileCopy);
        if (content) {
          formData.append('caption', content);
        }

        const tokens = localStorage.getItem('tokens');
        if (!tokens) throw new Error('No authentication token');

        const { token } = JSON.parse(tokens);
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

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
        console.log('📎 [FRONTEND] Received message data:', result.data);
        console.log('📎 [FRONTEND] Attachments in response:', result.data?.attachments);

        // Remove optimistic message and add real one
        setMessages(prev => prev.filter(m => m.messageId !== optimisticMessage.messageId));
        if (result.data) {
          console.log('📥 [FRONTEND] Adding uploaded message to state:', {
            messageId: result.data.messageId,
            messageType: result.data.messageType,
            attachments: result.data.attachments,
          });
          setMessages(prev => {
            const exists = prev.some(m => m.messageId === result.data.messageId);
            if (!exists) {
              return [...prev, result.data];
            }
            return prev;
          });
        } else {
          // Refetch messages to get the latest
          await loadMessages();
        }
      } else {
        // For text messages, use WebSocket for real-time delivery
        console.log('📤 [FRONTEND] Sending message via WebSocket:', {
          conversationId,
          content,
          optimisticMessageId: optimisticMessage.messageId,
        });

        if (!socketService.isConnected()) {
          console.error('❌ WebSocket not connected! Cannot send message.');
          throw new Error('WebSocket not connected');
        }

        socketService.sendMessage({
          conversationId,
          content,
        });
        console.log('✅ Message sent via WebSocket, waiting for confirmation...');

        // The real message will come back via WebSocket and replace the optimistic one
        // If it doesn't come back in 3 seconds, refetch
        const optimisticId = optimisticMessage.messageId;
        setTimeout(async () => {
          setMessages(currentMessages => {
            const stillHasOptimistic = currentMessages.some(m => m.messageId === optimisticId);
            if (stillHasOptimistic) {
              console.log('⚠️ WebSocket message not received in 3 seconds, refetching...');
              loadMessages();
            } else {
              console.log('✅ Optimistic message was replaced by real message');
            }
            return currentMessages;
          });
        }, 3000);
      }

      scrollToBottom();
    } catch (error) {
      console.error('❌ Error sending message:', error);

      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.messageId !== optimisticMessage.messageId));

      // Restore input values
      setMessageInput(messageCopy);
      setSelectedFile(fileCopy);

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

  // Diagnostic test function
  const runWebSocketDiagnostic = () => {
    console.log('=== WEBSOCKET DIAGNOSTIC TEST ===');
    console.log('1. WebSocket connected:', socketService.isConnected());

    const socket = socketService.getSocket();
    console.log('2. Socket ID:', socket?.id);
    console.log('3. Socket connected:', socket?.connected);
    console.log('4. Conversation ID:', conversationId);

    if (!conversationId || !socket) {
      console.error('❌ Cannot run test - missing conversation or socket');
      alert('WebSocket Error: Socket not connected or no conversation ID');
      return;
    }

    console.log('5. Manually joining conversation...');
    socketService.joinConversation(conversationId);

    console.log('6. Setting up one-time test listener...');
    socket.once('new_message', (msg: any) => {
      console.log('✅ ✅ ✅ WEBSOCKET WORKING! Received:', msg);
      alert('✅ WebSocket IS WORKING! Check console for details.');
    });

    console.log('7. Sending diagnostic test message...');
    socketService.sendMessage({
      conversationId,
      content: 'DIAGNOSTIC_TEST_' + Date.now()
    });

    setTimeout(() => {
      console.log('=== DIAGNOSTIC TEST TIMEOUT (3s) ===');
      alert('⚠️ If you didn\'t see success message, WebSocket is NOT working. Check console.');
    }, 3000);
  };

  // Show loading while conversation data is being fetched
  if (loading && !conversation) {
    return (
      <ModernLayout>
        <div className="h-[calc(100vh-120px)] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-pink-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading conversation...</p>
          </div>
        </div>
      </ModernLayout>
    );
  }

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
              {(conversation?.name || 'U').charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{conversation?.name || 'Unknown'}</h2>
              <p className="text-sm text-gray-500">
                {conversation?.type === 'group'
                  ? `${conversation?.participants?.length || 0} participants`
                  : 'Direct message'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {/* Diagnostic Test Button */}
            <button
              onClick={runWebSocketDiagnostic}
              className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-semibold rounded transition-colors"
              title="Test WebSocket Real-Time"
            >
              🔧 Test WS
            </button>
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
                // Skip invalid messages
                if (!message || !message.messageId) {
                  console.error('⚠️ Invalid message object:', message);
                  return null;
                }

                const isOwnMessage = message.senderId === currentUserId;
                const showAvatar = index === 0 || messages[index - 1]?.senderId !== message.senderId;
                const senderName = message.senderName || message.sender?.firstName + ' ' + message.sender?.lastName || 'Unknown';
                const senderInitial = senderName ? senderName.charAt(0).toUpperCase() : 'U';

                return (
                  <div
                    key={message.messageId}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} items-end space-x-2`}
                  >
                    {!isOwnMessage && (
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-semibold ${showAvatar ? '' : 'invisible'}`}>
                        {senderInitial}
                      </div>
                    )}
                    <div className={`flex flex-col max-w-md ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                      {showAvatar && !isOwnMessage && (
                        <span className="text-xs text-gray-500 mb-1 ml-2">{senderName}</span>
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
                          <div
                            className="mb-2 cursor-pointer"
                            onClick={() => {
                              console.log('🖼️ [IMAGE CLICK] Full message:', message);
                              console.log('🖼️ [IMAGE CLICK] Attachment:', message.attachments[0]);
                              console.log('🖼️ [IMAGE CLICK] FileURL:', message.attachments[0].fileUrl);
                              setSelectedImage({
                                url: message.attachments[0].fileUrl,
                                fileName: message.attachments[0].fileName || 'image.png',
                                senderId: message.senderId
                              });
                            }}
                          >
                            <img
                              src={`http://localhost:5000${encodeURI(message.attachments[0].fileUrl)}`}
                              alt={message.attachments[0].fileName}
                              className="max-w-xs max-h-64 rounded-lg object-cover hover:opacity-90 transition-opacity"
                            />
                          </div>
                        )}
                        {/* File attachment */}
                        {message.messageType === 'file' && message.attachments && message.attachments.length > 0 && (
                          <a
                            href={`http://localhost:5000${encodeURI(message.attachments[0].fileUrl)}`}
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
                        <p className="text-sm whitespace-pre-wrap break-words">{message.content || '(no content)'}</p>
                      </div>
                      <span className={`text-xs text-gray-400 mt-1 ${isOwnMessage ? 'mr-2' : 'ml-2'}`}>
                        {message.createdAt ? getRelativeTime(message.createdAt) : 'Just now'}
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

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-7xl max-h-screen" onClick={(e) => e.stopPropagation()}>
            {(() => {
              const baseUrl = 'http://localhost:5000';
              const encodedUrl = encodeURI(selectedImage.url);
              const fullUrl = `${baseUrl}${encodedUrl}`;
              console.log('🖼️ [MODAL] Constructing image URL:');
              console.log('  Base URL:', baseUrl);
              console.log('  Image URL (raw):', selectedImage.url);
              console.log('  Image URL (encoded):', encodedUrl);
              console.log('  Full URL:', fullUrl);
              return null;
            })()}
            <img
              src={`http://localhost:5000${encodeURI(selectedImage.url)}`}
              alt={selectedImage.fileName}
              className="max-w-full max-h-[90vh] object-contain rounded-lg bg-gray-900"
              onError={(e) => {
                console.error('❌ Image failed to load:', selectedImage.url);
                console.error('Full URL tried:', e.currentTarget.src);
                console.error('Actual src attribute:', e.currentTarget.getAttribute('src'));
                e.currentTarget.style.display = 'none';
                const errorDiv = document.createElement('div');
                errorDiv.className = 'text-white text-center p-8';
                errorDiv.innerHTML = `
                  <p class="text-xl mb-2">⚠️ Image failed to load</p>
                  <p class="text-sm text-gray-400">URL: ${selectedImage.url}</p>
                  <button onclick="window.location.reload()" class="mt-4 px-4 py-2 bg-pink-600 rounded">Reload Page</button>
                `;
                e.currentTarget.parentElement?.appendChild(errorDiv);
              }}
              onLoad={() => {
                console.log('✅ Image loaded successfully:', selectedImage.url);
              }}
            />

            {/* Close button */}
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 bg-white text-gray-800 rounded-full p-2 hover:bg-gray-100 transition-colors shadow-lg"
              title="Close (Esc)"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>

            {/* Download/Save button */}
            <button
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();

                console.log('🔘 Save button clicked!');
                console.log('Selected image:', selectedImage);
                console.log('Current user ID:', currentUserId);

                const isOwnedByMe = selectedImage.senderId === currentUserId;
                console.log('Is owned by me:', isOwnedByMe);

                // Prepare file info for modal
                const fileInfo = {
                  fileName: selectedImage.fileName,
                  fileUrl: selectedImage.url,
                  fileType: 'image/png', // Default, will be inferred
                  fileSize: 0, // Will be fetched
                  senderId: selectedImage.senderId,
                };

                setSelectedFileForSave(fileInfo);
                console.log('File info prepared:', fileInfo);

                // Check permissions
                try {
                  console.log('📡 Calling checkDownloadPermission API...');
                  const permissions = await digitalLibraryService.checkDownloadPermission({
                    fileUrl: selectedImage.url,
                    originalOwnerId: selectedImage.senderId,
                    isPaid: false, // Can be extended with actual metadata
                    accessLevel: isOwnedByMe ? 'private' : 'shared',
                  });

                  console.log('✅ Permissions received:', permissions);
                  setFilePermissions(permissions);
                  setShowSaveModal(true);
                  console.log('✅ Modal should now be visible!');
                } catch (error: any) {
                  console.error('❌ Error checking permissions:', error);
                  console.error('❌ Error details:', error.message, error.response?.data);
                  alert(`Failed to check file permissions: ${error.message || 'Unknown error'}`);
                }
              }}
              className="absolute bottom-4 right-4 bg-gradient-to-br from-pink-500 to-rose-600 text-white px-4 py-2 rounded-lg hover:from-pink-600 hover:to-rose-700 flex items-center gap-2 transition-all shadow-lg hover:shadow-xl cursor-pointer z-10"
            >
              <ArrowDownTrayIcon className="w-5 h-5" />
              Save
            </button>

            {/* Image info */}
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white px-4 py-2 rounded-lg text-sm">
              {selectedImage.fileName}
            </div>

            {/* Debug info - remove in production */}
            <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">
              {`${import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:5000'}${selectedImage.url}`.substring(0, 50)}...
            </div>
          </div>
        </div>
      )}

      {/* Save Choices Modal */}
      {showSaveModal && selectedFileForSave && filePermissions && (
        <SaveChoicesModal
          isOpen={showSaveModal}
          onClose={() => {
            setShowSaveModal(false);
            setSelectedFileForSave(null);
            setFilePermissions(null);
          }}
          fileName={selectedFileForSave.fileName}
          fileSize={selectedFileForSave.fileSize || 0}
          fileType={selectedFileForSave.fileType}
          isOwnedByMe={selectedFileForSave.senderId === currentUserId}
          permissions={filePermissions}
          onDownloadLocal={async () => {
            // Download to local machine
            try {
              const response = await fetch(`http://localhost:5000${encodeURI(selectedFileForSave.fileUrl)}`);
              const blob = await response.blob();
              const url = window.URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = selectedFileForSave.fileName;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              window.URL.revokeObjectURL(url);
              console.log('✅ Downloaded to local machine:', selectedFileForSave.fileName);
              alert('File downloaded successfully!');
            } catch (error) {
              console.error('❌ Download failed:', error);
              alert('Failed to download file');
            }
          }}
          onSaveToLibrary={async (options) => {
            // Save to Digital Library
            try {
              // Fetch file size if not available
              let fileSize = selectedFileForSave.fileSize;
              if (!fileSize) {
                const response = await fetch(`http://localhost:5000${encodeURI(selectedFileForSave.fileUrl)}`, { method: 'HEAD' });
                fileSize = parseInt(response.headers.get('Content-Length') || '0');
              }

              await digitalLibraryService.saveToLibrary({
                fileName: selectedFileForSave.fileName,
                fileUrl: selectedFileForSave.fileUrl,
                fileType: selectedFileForSave.fileType,
                fileSize: fileSize || 0,
                originalOwnerId: selectedFileForSave.senderId,
                sourceType: 'chat',
                sourceId: conversationId,
                isPaid: filePermissions.isPaid,
                accessLevel: filePermissions.accessLevel,
                canDownload: filePermissions.canDownloadLocally,
                canShare: true,
                canEdit: false,
                category: options.category,
                tags: options.tags,
                description: options.description,
              });

              console.log('✅ Saved to Digital Library:', selectedFileForSave.fileName);

              // Close modal
              setShowSaveModal(false);
              setSelectedFileForSave(null);
              setFilePermissions(null);

              // Show success message with option to view
              const viewNow = window.confirm('File saved to My HR Documents successfully!\n\nWould you like to view your documents now?');
              if (viewNow) {
                navigate('/my-hr-documents');
              }
            } catch (error) {
              console.error('❌ Save to library failed:', error);
              alert('Failed to save to Digital Library. Please try again.');
            }
          }}
        />
      )}
    </ModernLayout>
  );
}
