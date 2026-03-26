import { useState, useEffect, useRef } from 'react';
import {
  MicrophoneIcon,
  VideoCameraIcon,
  PhoneXMarkIcon,
  ComputerDesktopIcon,
  SpeakerWaveIcon,
  Cog6ToothIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import {
  MicrophoneIcon as MicrophoneSolidIcon,
  VideoCameraIcon as VideoCameraSolidIcon,
  VideoCameraSlashIcon,
} from '@heroicons/react/24/solid';

interface VideoCallProps {
  conversationId: string;
  conversationName: string;
  callType: 'audio' | 'video';
  isInitiator: boolean;
  remoteSocketId: string | null;
  onEndCall: () => void;
  peerConnection: RTCPeerConnection | null;
  localStream: MediaStream | null;
}

export default function VideoCall({
  conversationId,
  conversationName,
  callType,
  isInitiator,
  remoteSocketId,
  onEndCall,
  peerConnection,
  localStream,
}: VideoCallProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [connectionState, setConnectionState] = useState<string>('connecting');
  const [showSettings, setShowSettings] = useState(false);
  const [volume, setVolume] = useState(100);
  const [selectedMicrophone, setSelectedMicrophone] = useState<string>('');
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [selectedSpeaker, setSelectedSpeaker] = useState<string>('');
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const screenShareRef = useRef<MediaStream | null>(null);
  const callStartTime = useRef<Date>(new Date());

  // Update local video when stream changes
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      console.log('✅ Local video stream updated');

      // Try to play video
      localVideoRef.current.play().catch(err => {
        console.error('Error playing local video:', err);
      });
    }
  }, [localStream]);

  // Monitor peer connection state
  useEffect(() => {
    if (!peerConnection) return;

    const handleConnectionStateChange = () => {
      const state = peerConnection.connectionState;
      console.log('🔌 Connection state changed:', state);
      setConnectionState(state);

      if (state === 'failed' || state === 'disconnected') {
        console.error('❌ Connection failed or disconnected');
      }
    };

    const handleIceConnectionStateChange = () => {
      console.log('🧊 ICE connection state:', peerConnection.iceConnectionState);
    };

    const handleTrack = (event: RTCTrackEvent) => {
      console.log('📥 Remote track received:', event.track.kind);
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
        console.log('✅ Remote stream set to video element');

        // Auto-play remote video
        remoteVideoRef.current.play().catch(err => {
          console.error('Error playing remote video:', err);
          // Try with muted
          remoteVideoRef.current!.muted = true;
          remoteVideoRef.current!.play().catch(e => console.error('Still failed:', e));
        });
      }
    };

    peerConnection.addEventListener('connectionstatechange', handleConnectionStateChange);
    peerConnection.addEventListener('iceconnectionstatechange', handleIceConnectionStateChange);
    peerConnection.addEventListener('track', handleTrack);

    return () => {
      peerConnection.removeEventListener('connectionstatechange', handleConnectionStateChange);
      peerConnection.removeEventListener('iceconnectionstatechange', handleIceConnectionStateChange);
      peerConnection.removeEventListener('track', handleTrack);
    };
  }, [peerConnection]);

  // Call duration timer
  useEffect(() => {
    const interval = setInterval(() => {
      const duration = Math.floor((new Date().getTime() - callStartTime.current.getTime()) / 1000);
      setCallDuration(duration);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Get available devices
  useEffect(() => {
    const getDevices = async () => {
      try {
        const deviceList = await navigator.mediaDevices.enumerateDevices();
        setDevices(deviceList);
        console.log('🎤 Available devices:', deviceList);

        // Set defaults
        const defaultMic = deviceList.find(d => d.kind === 'audioinput' && d.deviceId !== 'default');
        const defaultCam = deviceList.find(d => d.kind === 'videoinput');
        const defaultSpk = deviceList.find(d => d.kind === 'audiooutput' && d.deviceId !== 'default');

        if (defaultMic) setSelectedMicrophone(defaultMic.deviceId);
        if (defaultCam) setSelectedCamera(defaultCam.deviceId);
        if (defaultSpk) setSelectedSpeaker(defaultSpk.deviceId);
      } catch (error) {
        console.error('Error enumerating devices:', error);
      }
    };

    getDevices();
  }, []);

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
        console.log(`🎤 Microphone ${audioTrack.enabled ? 'unmuted' : 'muted'}`);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream && callType === 'video') {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
        console.log(`📹 Camera ${videoTrack.enabled ? 'on' : 'off'}`);
      }
    }
  };

  const toggleScreenShare = async () => {
    if (isSharingScreen) {
      // Stop screen sharing
      if (screenShareRef.current) {
        screenShareRef.current.getTracks().forEach(track => track.stop());
        screenShareRef.current = null;
      }

      // Replace with camera video
      if (peerConnection && localStream) {
        const videoTrack = localStream.getVideoTracks()[0];
        const sender = peerConnection.getSenders().find(s => s.track?.kind === 'video');
        if (sender && videoTrack) {
          await sender.replaceTrack(videoTrack);
        }
      }

      setIsSharingScreen(false);
      console.log('🖥️ Screen sharing stopped');
    } else {
      try {
        // Start screen sharing
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            cursor: 'always',
          },
          audio: false,
        });

        screenShareRef.current = screenStream;

        // Replace camera with screen
        if (peerConnection) {
          const screenTrack = screenStream.getVideoTracks()[0];
          const sender = peerConnection.getSenders().find(s => s.track?.kind === 'video');
          if (sender && screenTrack) {
            await sender.replaceTrack(screenTrack);
          }

          // Update local video
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = screenStream;
          }

          // Stop screen share when user clicks "stop sharing" in browser UI
          screenTrack.onended = () => {
            toggleScreenShare();
          };
        }

        setIsSharingScreen(true);
        console.log('🖥️ Screen sharing started');
      } catch (error) {
        console.error('Error starting screen share:', error);
        alert('Failed to start screen sharing. Please grant permission.');
      }
    }
  };

  const changeMicrophone = async (deviceId: string) => {
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: deviceId } },
        video: false,
      });

      const newAudioTrack = newStream.getAudioTracks()[0];

      if (peerConnection) {
        const sender = peerConnection.getSenders().find(s => s.track?.kind === 'audio');
        if (sender) {
          await sender.replaceTrack(newAudioTrack);
        }
      }

      // Replace in local stream
      if (localStream) {
        const oldTrack = localStream.getAudioTracks()[0];
        oldTrack?.stop();
        localStream.removeTrack(oldTrack);
        localStream.addTrack(newAudioTrack);
      }

      setSelectedMicrophone(deviceId);
      console.log('🎤 Microphone changed to:', deviceId);
    } catch (error) {
      console.error('Error changing microphone:', error);
      alert('Failed to change microphone');
    }
  };

  const changeCamera = async (deviceId: string) => {
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } },
        audio: false,
      });

      const newVideoTrack = newStream.getVideoTracks()[0];

      if (peerConnection && !isSharingScreen) {
        const sender = peerConnection.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          await sender.replaceTrack(newVideoTrack);
        }
      }

      // Replace in local stream
      if (localStream) {
        const oldTrack = localStream.getVideoTracks()[0];
        oldTrack?.stop();
        localStream.removeTrack(oldTrack);
        localStream.addTrack(newVideoTrack);
      }

      // Update local video element
      if (localVideoRef.current && !isSharingScreen) {
        localVideoRef.current.srcObject = localStream;
      }

      setSelectedCamera(deviceId);
      console.log('📹 Camera changed to:', deviceId);
    } catch (error) {
      console.error('Error changing camera:', error);
      alert('Failed to change camera');
    }
  };

  const changeSpeaker = async (deviceId: string) => {
    try {
      if (remoteVideoRef.current && 'sinkId' in HTMLMediaElement.prototype) {
        await (remoteVideoRef.current as any).setSinkId(deviceId);
        setSelectedSpeaker(deviceId);
        console.log('🔊 Speaker changed to:', deviceId);
      }
    } catch (error) {
      console.error('Error changing speaker:', error);
      alert('Failed to change speaker. Your browser may not support this feature.');
    }
  };

  const formatDuration = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getConnectionStateColor = () => {
    switch (connectionState) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-yellow-500';
      case 'failed':
      case 'disconnected':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getConnectionStateText = () => {
    switch (connectionState) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'failed':
        return 'Connection Failed';
      case 'disconnected':
        return 'Disconnected';
      default:
        return connectionState;
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h2 className="text-white text-lg font-semibold">{conversationName}</h2>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${getConnectionStateColor()}`} />
              <p className="text-gray-400 text-sm">{getConnectionStateText()}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-white font-mono text-lg">{formatDuration(callDuration)}</div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Cog6ToothIcon className="h-6 w-6 text-white" />
          </button>
        </div>
      </div>

      {/* Video Container */}
      <div className="flex-1 relative bg-black">
        {/* Remote Video (main) */}
        {callType === 'video' ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center animate-pulse">
                <span className="text-white text-5xl font-bold">
                  {conversationName.charAt(0)}
                </span>
              </div>
              <h2 className="text-white text-2xl font-bold mb-2">{conversationName}</h2>
              <p className="text-gray-400">Audio Call - {formatDuration(callDuration)}</p>
            </div>
          </div>
        )}

        {/* Local Video (picture-in-picture) */}
        {callType === 'video' && (
          <div className="absolute top-4 right-4 w-64 h-48 bg-gray-800 rounded-lg overflow-hidden shadow-2xl border-2 border-gray-700">
            {isVideoOff && !isSharingScreen ? (
              <div className="w-full h-full flex items-center justify-center bg-gray-800">
                <VideoCameraSlashIcon className="h-16 w-16 text-gray-500" />
              </div>
            ) : (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ transform: isSharingScreen ? 'none' : 'scaleX(-1)' }}
              />
            )}
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded text-white text-xs">
              {isSharingScreen ? 'Your Screen' : 'You'}
            </div>
          </div>
        )}

        {/* Connection status overlay */}
        {connectionState !== 'connected' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mx-auto mb-4" />
              <p className="text-white text-xl">{getConnectionStateText()}</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-800 px-6 py-4">
        <div className="flex items-center justify-center space-x-4">
          {/* Microphone */}
          <button
            onClick={toggleMute}
            className={`p-4 rounded-full transition-all ${
              isMuted
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <MicrophoneSolidIcon className="h-6 w-6 text-white" />
            ) : (
              <MicrophoneIcon className="h-6 w-6 text-white" />
            )}
          </button>

          {/* Camera (video only) */}
          {callType === 'video' && (
            <button
              onClick={toggleVideo}
              className={`p-4 rounded-full transition-all ${
                isVideoOff
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
              title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
            >
              {isVideoOff ? (
                <VideoCameraSolidIcon className="h-6 w-6 text-white" />
              ) : (
                <VideoCameraIcon className="h-6 w-6 text-white" />
              )}
            </button>
          )}

          {/* Screen Share (video only) */}
          {callType === 'video' && (
            <button
              onClick={toggleScreenShare}
              className={`p-4 rounded-full transition-all ${
                isSharingScreen
                  ? 'bg-blue-500 hover:bg-blue-600'
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
              title={isSharingScreen ? 'Stop sharing' : 'Share screen'}
            >
              <ComputerDesktopIcon className="h-6 w-6 text-white" />
            </button>
          )}

          {/* End Call */}
          <button
            onClick={onEndCall}
            className="p-5 bg-red-500 hover:bg-red-600 rounded-full transition-all shadow-lg"
            title="End call"
          >
            <PhoneXMarkIcon className="h-7 w-7 text-white" />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute right-4 bottom-20 w-80 bg-white rounded-lg shadow-2xl overflow-hidden">
          <div className="bg-gray-100 px-4 py-3 flex items-center justify-between border-b">
            <h3 className="font-semibold text-gray-900">Call Settings</h3>
            <button
              onClick={() => setShowSettings(false)}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
            {/* Microphone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MicrophoneIcon className="h-4 w-4 inline mr-1" />
                Microphone
              </label>
              <select
                value={selectedMicrophone}
                onChange={(e) => changeMicrophone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {devices.filter(d => d.kind === 'audioinput').map(device => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Microphone ${device.deviceId.slice(0, 5)}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Camera */}
            {callType === 'video' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <VideoCameraIcon className="h-4 w-4 inline mr-1" />
                  Camera
                </label>
                <select
                  value={selectedCamera}
                  onChange={(e) => changeCamera(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {devices.filter(d => d.kind === 'videoinput').map(device => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `Camera ${device.deviceId.slice(0, 5)}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Speaker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <SpeakerWaveIcon className="h-4 w-4 inline mr-1" />
                Speaker
              </label>
              <select
                value={selectedSpeaker}
                onChange={(e) => changeSpeaker(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {devices.filter(d => d.kind === 'audiooutput').map(device => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Speaker ${device.deviceId.slice(0, 5)}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Volume */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Volume: {volume}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => {
                  const newVolume = parseInt(e.target.value);
                  setVolume(newVolume);
                  if (remoteVideoRef.current) {
                    remoteVideoRef.current.volume = newVolume / 100;
                  }
                }}
                className="w-full"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
