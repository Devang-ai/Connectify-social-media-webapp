import React, { useEffect, useRef, useState } from 'react';
import useMessageStore from '../store/useMessageStore';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff } from 'lucide-react';

const CallModal = ({ incomingCall, callTarget, isVideo, onEnd, currentUser }) => {
  const getSocket = useMessageStore(state => state.getSocket);
  const socket = getSocket();
  const pendingIceCandidates = useMessageStore(state => state.pendingIceCandidates);
  const clearPendingIceCandidates = useMessageStore(state => state.clearPendingIceCandidates);

  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isCalling, setIsCalling] = useState(!!callTarget);
  const [isReceivingCall, setIsReceivingCall] = useState(!!incomingCall);
  const [callAccepted, setCallAccepted] = useState(false);
  const [micMuted, setMicMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(!isVideo);
  const [errorMsg, setErrorMsg] = useState('');

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const peerInitialized = useRef(false);
  const callStartedRef = useRef(false);

  useEffect(() => {
    if (peerInitialized.current) return;
    peerInitialized.current = true;

    try {
      const peer = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:stun3.l.google.com:19302' },
          { urls: 'stun:stun4.l.google.com:19302' }
        ]
      });
      peerConnectionRef.current = peer;

      peer.oniceconnectionstatechange = () => {
        console.log("ICE Connection State changed:", peer.iceConnectionState);
        if (peer.iceConnectionState === 'failed' || peer.iceConnectionState === 'disconnected') {
          setErrorMsg('Connection lost. Please try again.');
        }
      };

      peer.onicecandidate = (event) => {
        if (event.candidate && socket) {
          console.log("SENDING ICE CANDIDATE", event.candidate);
          socket.emit('ice_candidate', {
            to: incomingCall ? incomingCall.from : (callTarget?._id || callTarget?.id),
            candidate: event.candidate
          });
        }
      };

      peer.ontrack = (event) => {
        console.log("RECEIVED REMOTE TRACK", event.streams[0]);
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0]);
        }
      };
    } catch (e) {
      console.error("Peer connection error", e);
      setErrorMsg('Failed to initialize connection.');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup local stream separately to avoid stale closure issues
  useEffect(() => {
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => {
          try { track.stop(); } catch(e){}
        });
      }
    };
  }, [localStream]);

  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play().catch(e => console.log('Video play error:', e));
    }
  }, [remoteStream]);

  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play().catch(e => console.log('Video play error:', e));
    }
  }, [localStream]);

  // Handle Socket Events
  useEffect(() => {
    if (!socket) return;

    const handleCallAccepted = async (signal) => {
      console.log("CALL ACCEPTED RECEIVED", signal);
      try {
        setCallAccepted(true);
        if (peerConnectionRef.current) {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(signal));
          console.log("SET REMOTE DESCRIPTION (Caller) SUCCESS");
          
          const storeState = useMessageStore.getState();
          console.log("PROCESSING PENDING ICE CANDIDATES (Caller):", storeState.pendingIceCandidates.length);
          if (storeState.pendingIceCandidates.length > 0) {
            storeState.pendingIceCandidates.forEach(c => {
              peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(c)).catch(e => console.error(e));
            });
            storeState.clearPendingIceCandidates();
          }
        }
      } catch (e) { console.error("Error in handleCallAccepted:", e); }
    };

    const handleCallEnded = () => {
      handleEndCall(false); // don't emit end_call if we received it
    };

    socket.on('call_accepted', handleCallAccepted);
    socket.on('call_ended', handleCallEnded);

    return () => {
      socket.off('call_accepted', handleCallAccepted);
      socket.off('call_ended', handleCallEnded);
    };
  }, [socket]); // eslint-disable-line react-hooks/exhaustive-deps

  // Process Global ICE Candidates
  useEffect(() => {
    if (peerConnectionRef.current?.remoteDescription && pendingIceCandidates.length > 0) {
      pendingIceCandidates.forEach(candidate => {
        peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate)).catch(e => console.error('Error adding ICE candidate', e));
      });
      clearPendingIceCandidates();
    }
  }, [pendingIceCandidates, callAccepted]); // eslint-disable-line react-hooks/exhaustive-deps

  // Start Call (Caller)
  useEffect(() => {
    if (callTarget && !callStartedRef.current) {
      callStartedRef.current = true;
      startCall();
    }
  }, [callTarget]); // eslint-disable-line react-hooks/exhaustive-deps

  const startCall = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera/Microphone not supported on this browser or connection is not secure (HTTPS).");
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: isVideo, audio: true });
      setLocalStream(stream);
      
      if (peerConnectionRef.current) {
         stream.getTracks().forEach(track => peerConnectionRef.current.addTrack(track, stream));
         const offer = await peerConnectionRef.current.createOffer();
         await peerConnectionRef.current.setLocalDescription(offer);

         if (socket && currentUser) {
           console.log("EMITTING call_user to:", callTarget._id || callTarget.id, "from:", currentUser._id || currentUser.id);
           socket.emit('call_user', {
             userToCall: callTarget._id || callTarget.id,
             signalData: offer,
             from: currentUser._id || currentUser.id, 
             callerName: currentUser.username || 'You', 
             callerImage: currentUser.profilePicture || '',
             isVideo: isVideo
           });
         }
      }
    } catch (err) {
      console.error('Error starting call', err);
      setErrorMsg(err.message || 'Error accessing camera/microphone.');
    }
  };

  const acceptCall = async () => {
    if (callAccepted) return;
    try {
      setCallAccepted(true);
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera/Microphone not supported.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: incomingCall?.isVideo || false, audio: true });
      setLocalStream(stream);
      
      if (peerConnectionRef.current && incomingCall) {
         stream.getTracks().forEach(track => peerConnectionRef.current.addTrack(track, stream));
         await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(incomingCall.signal));
         console.log("SET REMOTE DESCRIPTION (Callee) SUCCESS");
         
         const storeState = useMessageStore.getState();
         console.log("PROCESSING PENDING ICE CANDIDATES (Callee):", storeState.pendingIceCandidates.length);
         if (storeState.pendingIceCandidates.length > 0) {
           storeState.pendingIceCandidates.forEach(c => {
             peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(c)).catch(e => console.error(e));
           });
           storeState.clearPendingIceCandidates();
         }

         const answer = await peerConnectionRef.current.createAnswer();
         await peerConnectionRef.current.setLocalDescription(answer);
         console.log("CREATED AND SET LOCAL DESCRIPTION (Callee)");

         if (socket) {
           console.log("EMITTING answer_call to:", incomingCall.from);
           socket.emit('answer_call', {
             to: incomingCall.from,
             signal: answer
           });
         }
      }
    } catch (err) {
      console.error('Error accepting call', err);
      setErrorMsg(err.message || 'Error accepting call.');
    }
  };

  const handleEndCall = (emitEvent = true) => {
    try {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      if (emitEvent && socket) {
        const target = incomingCall ? incomingCall.from : (callTarget?._id || callTarget?.id);
        if (target) {
            socket.emit('end_call', { to: target });
        }
      }
    } catch(e) { console.error(e); }
    onEnd();
  };

  const toggleMic = () => {
    if (localStream && localStream.getAudioTracks().length > 0) {
      localStream.getAudioTracks()[0].enabled = micMuted;
      setMicMuted(!micMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream && localStream.getVideoTracks().length > 0) {
      localStream.getVideoTracks()[0].enabled = videoOff;
      setVideoOff(!videoOff);
    }
  };

  if (!isCalling && !isReceivingCall) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-4xl h-[80vh] bg-slate-950 rounded-3xl overflow-hidden relative shadow-2xl border border-slate-800 flex flex-col">
        
        {errorMsg ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
            <div className="w-16 h-16 bg-rose-500/20 text-rose-500 rounded-full flex items-center justify-center mb-4">
               <PhoneOff className="w-8 h-8" />
            </div>
            <h2 className="text-white text-xl font-bold mb-2">Call Failed</h2>
            <p className="text-slate-400 mb-6 max-w-md">{errorMsg}</p>
            <button onClick={() => handleEndCall(true)} className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-full transition">Close</button>
          </div>
        ) : (
          <>
            {/* Remote Video Container */}
            <div className="flex-1 relative bg-black flex items-center justify-center">
              {remoteStream ? (
                <video 
                  ref={remoteVideoRef} 
                  autoPlay 
                  playsInline 
                  disablePictureInPicture
                  className="w-full h-full object-contain pointer-events-none"
                />
              ) : (
                <div className="flex flex-col items-center animate-pulse">
                   <div className="w-24 h-24 bg-slate-800 rounded-full mb-4 flex items-center justify-center">
                      <span className="text-4xl">📞</span>
                   </div>
                   <h2 className="text-white text-xl font-bold">
                     {incomingCall && !callAccepted ? `Incoming Call...` : 'Calling...'}
                   </h2>
                </div>
              )}
            </div>

            {/* Local Video Picture-in-Picture */}
            {localStream && (
                <div className="absolute top-4 right-4 w-32 md:w-48 aspect-[3/4] bg-slate-800 rounded-xl overflow-hidden border-2 border-slate-700 shadow-xl z-10" style={{ transform: 'scaleX(-1)' }}>
                    <video 
                        ref={localVideoRef} 
                        autoPlay 
                        playsInline 
                        muted 
                        disablePictureInPicture
                        className="w-full h-full object-cover pointer-events-none"
                    />
                </div>
            )}

            {/* Controls Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent flex justify-center items-end gap-6 h-32">
                {incomingCall && !callAccepted ? (
                    <>
                        <button onClick={acceptCall} className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center hover:bg-emerald-600 transition shadow-lg text-white">
                            <Phone className="w-6 h-6" />
                        </button>
                        <button onClick={() => handleEndCall(true)} className="w-14 h-14 bg-rose-500 rounded-full flex items-center justify-center hover:bg-rose-600 transition shadow-lg text-white">
                            <PhoneOff className="w-6 h-6" />
                        </button>
                    </>
                ) : (
                    <>
                        <button onClick={toggleMic} className={`w-12 h-12 rounded-full flex items-center justify-center transition shadow-lg text-white ${micMuted ? 'bg-rose-500 hover:bg-rose-600' : 'bg-slate-700 hover:bg-slate-600'}`}>
                            {micMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                        </button>
                        <button onClick={() => handleEndCall(true)} className="w-16 h-16 bg-rose-500 rounded-full flex items-center justify-center hover:bg-rose-600 transition shadow-xl text-white transform hover:scale-105">
                            <PhoneOff className="w-7 h-7" />
                        </button>
                        {isVideo && (
                            <button onClick={toggleVideo} className={`w-12 h-12 rounded-full flex items-center justify-center transition shadow-lg text-white ${videoOff ? 'bg-rose-500 hover:bg-rose-600' : 'bg-slate-700 hover:bg-slate-600'}`}>
                                {videoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                            </button>
                        )}
                    </>
                )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CallModal;
