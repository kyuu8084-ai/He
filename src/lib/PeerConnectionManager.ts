import Peer, { MediaConnection, DataConnection } from 'peerjs';

export interface PeerUser {
  peerId: string;
  userName: string;
  stream?: MediaStream;
  connection?: DataConnection;
}

export function createSilentAudioTrack(): MediaStreamTrack {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const dest = ctx.createMediaStreamDestination();
    const osc = ctx.createOscillator();
    osc.connect(dest);
    osc.start();
    const track = dest.stream.getAudioTracks()[0];
    track.enabled = false;
    return track;
  } catch (e) {
    console.warn("Could not create AudioContext silent track", e);
    const canvas = document.createElement('canvas');
    const stream = (canvas as any).captureStream ? (canvas as any).captureStream(0) : new MediaStream();
    return stream.getAudioTracks()[0] || null;
  }
}

export function createBlankVideoTrack(width = 640, height = 360): MediaStreamTrack {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#18181b';
    ctx.fillRect(0, 0, width, height);
  }
  const stream = (canvas as any).captureStream ? (canvas as any).captureStream(5) : null;
  if (stream && stream.getVideoTracks().length > 0) {
    const track = stream.getVideoTracks()[0];
    track.enabled = true;
    return track;
  }
  throw new Error("captureStream not supported");
}

export type StreamQuality = 'high' | 'medium' | 'low';

export interface QualityConstraints {
  maxBitrate?: number; // bps
  scaleResolutionDownBy?: number;
  maxFramerate?: number;
  label: { en: string; vi: string };
  badge: string;
  description: { en: string; vi: string };
}

export const QUALITY_CONFIGS: Record<StreamQuality, QualityConstraints> = {
  high: {
    maxBitrate: 1500000, // 1.5 Mbps
    scaleResolutionDownBy: 1.0,
    maxFramerate: 30,
    label: { en: 'High', vi: 'Cao' },
    badge: 'HD',
    description: { en: '720p • 30fps (Best fidelity)', vi: '720p • 30fps (Độ nét cao)' }
  },
  medium: {
    maxBitrate: 500000, // 500 kbps
    scaleResolutionDownBy: 2.0, // 360p
    maxFramerate: 20,
    label: { en: 'Medium', vi: 'Trung bình' },
    badge: 'SD',
    description: { en: '360p • 20fps (Balanced performance)', vi: '360p • 20fps (Cân bằng & mượt)' }
  },
  low: {
    maxBitrate: 150000, // 150 kbps
    scaleResolutionDownBy: 3.5, // ~200p / 240p
    maxFramerate: 12,
    label: { en: 'Low', vi: 'Tiết kiệm' },
    badge: 'ECO',
    description: { en: '240p • 12fps (Anti-lag & Eco)', vi: '240p • 12fps (Chống lag, tiết kiệm)' }
  }
};

export const CAMERA_QUALITY_CONSTRAINTS: Record<StreamQuality, MediaTrackConstraints> = {
  high: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30, max: 30 }
  },
  medium: {
    width: { ideal: 640 },
    height: { ideal: 360 },
    frameRate: { ideal: 20, max: 20 }
  },
  low: {
    width: { ideal: 320 },
    height: { ideal: 240 },
    frameRate: { ideal: 12, max: 15 }
  }
};

export class PeerConnectionManager {
  private peer: Peer;
  private calls: Map<string, MediaConnection> = new Map();
  private dataConnections: Map<string, DataConnection> = new Map();
  private onStreamCallback?: (peerId: string, stream: MediaStream, userName: string) => void;
  private onUserLeftCallback?: (peerId: string) => void;
  private localStream: MediaStream;
  private userName: string;
  private currentQuality: StreamQuality = 'medium';

  constructor(roomId: string, userName: string, initialStream?: MediaStream, initialQuality: StreamQuality = 'medium') {
    this.userName = userName;
    this.currentQuality = initialQuality;
    this.localStream = this.ensureCompleteStream(initialStream);

    this.peer = new Peer(undefined as any, {
      host: window.location.hostname,
      port: window.location.port ? parseInt(window.location.port) : (window.location.protocol === 'https:' ? 443 : 80),
      path: '/peerjs',
      secure: window.location.protocol === 'https:',
      debug: 1,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:stun3.l.google.com:19302' },
          { urls: 'stun:stun4.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' },
          {
            urls: 'turn:relay.metered.ca:80',
            username: 'openrelayproject',
            credential: 'openrelayproject',
          },
          {
            urls: 'turn:relay.metered.ca:443',
            username: 'openrelayproject',
            credential: 'openrelayproject',
          },
          {
            urls: 'turn:relay.metered.ca:443?transport=tcp',
            username: 'openrelayproject',
            credential: 'openrelayproject',
          },
        ],
        sdpSemantics: 'unified-plan'
      }
    });

    this.setupEventListeners();
  }

  private ensureCompleteStream(stream?: MediaStream): MediaStream {
    let audioTrack = stream?.getAudioTracks()[0];
    let videoTrack = stream?.getVideoTracks()[0];

    if (!audioTrack) {
      try {
        audioTrack = createSilentAudioTrack();
      } catch (e) {
        console.warn("Error creating silent audio track:", e);
      }
    }

    if (!videoTrack) {
      try {
        videoTrack = createBlankVideoTrack();
      } catch (e) {
        console.warn("Error creating blank video track:", e);
      }
    }

    const tracks: MediaStreamTrack[] = [];
    if (audioTrack) tracks.push(audioTrack);
    if (videoTrack) tracks.push(videoTrack);
    return new MediaStream(tracks);
  }

  private setupEventListeners() {
    this.peer.on('open', (id) => {
      console.log('[PeerJS] My Peer ID:', id);
    });

    this.peer.on('disconnected', () => {
      console.warn('[PeerJS] signaling connection lost, attempting reconnect...');
      try {
        this.peer.reconnect();
      } catch (e) {
        console.warn('[PeerJS] reconnect failed:', e);
      }
    });

    this.peer.on('error', (err: any) => {
      console.warn('[PeerJS] connection error:', err);
      if (err?.type === 'peer-unavailable') {
        const msg = err.message || '';
        const match = msg.match(/Could not connect to peer ([\w-]+)/);
        const unavailablePeerId = match ? match[1] : null;
        if (unavailablePeerId) {
          this.calls.get(unavailablePeerId)?.close();
          this.calls.delete(unavailablePeerId);
          this.dataConnections.get(unavailablePeerId)?.close();
          this.dataConnections.delete(unavailablePeerId);
        }
      }
    });

    // Handle incoming calls from remote peers
    this.peer.on('call', (call) => {
      console.log('[PeerJS] Incoming call from:', call.peer);
      const prevCall = this.calls.get(call.peer);
      if (prevCall && prevCall !== call) {
        try { prevCall.close(); } catch (e) {}
      }
      this.calls.set(call.peer, call);

      // Answer with our complete stream (audio + video transceivers)
      call.answer(this.localStream);

      setTimeout(() => {
        const pc = call.peerConnection;
        if (pc) {
          const videoSender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
          if (videoSender) {
            this.applyQualityToSender(videoSender, this.currentQuality);
          }
        }
      }, 500);

      call.on('stream', (remoteStream) => {
        console.log('[PeerJS] Remote stream received from:', call.peer, {
          streamId: remoteStream.id,
          active: remoteStream.active,
          tracks: remoteStream.getTracks().map(t => ({
            kind: t.kind,
            id: t.id,
            label: t.label,
            enabled: t.enabled,
            muted: t.muted,
            readyState: t.readyState
          }))
        });

        remoteStream.onaddtrack = (e) => {
          console.log(`[PeerJS:StreamEvent] Track added from peer ${call.peer}:`, e.track.kind, e.track.id, e.track.label);
        };
        remoteStream.onremovetrack = (e) => {
          console.log(`[PeerJS:StreamEvent] Track removed from peer ${call.peer}:`, e.track.kind, e.track.id);
        };
        remoteStream.getTracks().forEach(t => {
          t.onunmute = () => console.log(`[PeerJS:TrackEvent] Track '${t.id}' (${t.kind}) UNMUTED from ${call.peer}`);
          t.onmute = () => console.log(`[PeerJS:TrackEvent] Track '${t.id}' (${t.kind}) MUTED from ${call.peer}`);
          t.onended = () => console.log(`[PeerJS:TrackEvent] Track '${t.id}' (${t.kind}) ENDED from ${call.peer}`);
        });

        const userName = call.metadata?.userName || 'Student';
        this.onStreamCallback?.(call.peer, remoteStream, userName);
      });

      call.on('close', () => {
        console.log('[PeerJS] Call closed with:', call.peer);
        if (this.calls.get(call.peer) === call) {
          this.calls.delete(call.peer);
          this.onUserLeftCallback?.(call.peer);
        }
      });

      call.on('error', (err) => {
        console.warn('[PeerJS] Call error with:', call.peer, err);
        if (this.calls.get(call.peer) === call) {
          this.calls.delete(call.peer);
        }
      });
    });

    // Handle incoming data connections
    this.peer.on('connection', (conn) => {
      console.log('[PeerJS] Incoming data connection from:', conn.peer);
      this.setupDataConnection(conn);
    });
  }

  private setupDataConnection(conn: DataConnection) {
    conn.on('open', () => {
      console.log('[PeerJS] Data connection opened with:', conn.peer);
    });

    conn.on('data', (data) => {
      console.log('[PeerJS] Received data from', conn.peer, ':', data);
    });

    conn.on('close', () => {
      this.dataConnections.delete(conn.peer);
    });

    this.dataConnections.set(conn.peer, conn);
  }

  public callUser(peerId: string, userName: string) {
    console.log('[PeerJS] Calling peer:', userName, '(', peerId, ')');

    const existingCall = this.calls.get(peerId);
    if (existingCall) {
      try { existingCall.close(); } catch (e) {}
      this.calls.delete(peerId);
    }

    const call = this.peer.call(peerId, this.localStream, {
      metadata: { userName: this.userName }
    });

    setTimeout(() => {
      const pc = call.peerConnection;
      if (pc) {
        const videoSender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
        if (videoSender) {
          this.applyQualityToSender(videoSender, this.currentQuality);
        }
      }
    }, 500);

    call.on('stream', (remoteStream) => {
      console.log('[PeerJS] Remote stream received on outgoing call to:', peerId, {
        streamId: remoteStream.id,
        active: remoteStream.active,
        tracks: remoteStream.getTracks().map(t => ({
          kind: t.kind,
          id: t.id,
          label: t.label,
          enabled: t.enabled,
          muted: t.muted,
          readyState: t.readyState
        }))
      });

      remoteStream.onaddtrack = (e) => {
        console.log(`[PeerJS:StreamEvent] Track added on call to ${peerId}:`, e.track.kind, e.track.id, e.track.label);
      };
      remoteStream.onremovetrack = (e) => {
        console.log(`[PeerJS:StreamEvent] Track removed on call to ${peerId}:`, e.track.kind, e.track.id);
      };
      remoteStream.getTracks().forEach(t => {
        t.onunmute = () => console.log(`[PeerJS:TrackEvent] Track '${t.id}' (${t.kind}) UNMUTED on call to ${peerId}`);
        t.onmute = () => console.log(`[PeerJS:TrackEvent] Track '${t.id}' (${t.kind}) MUTED on call to ${peerId}`);
        t.onended = () => console.log(`[PeerJS:TrackEvent] Track '${t.id}' (${t.kind}) ENDED on call to ${peerId}`);
      });

      this.onStreamCallback?.(peerId, remoteStream, userName);
    });

    call.on('close', () => {
      if (this.calls.get(peerId) === call) {
        this.calls.delete(peerId);
        this.onUserLeftCallback?.(peerId);
      }
    });

    call.on('error', (err) => {
      console.warn(`[PeerJS] Call error with peer ${peerId}:`, err);
      if (this.calls.get(peerId) === call) {
        this.calls.delete(peerId);
      }
    });

    this.calls.set(peerId, call);

    // Also establish data connection
    const conn = this.peer.connect(peerId, {
      metadata: { userName: this.userName }
    });
    conn.on('error', (err) => {
      console.warn(`[PeerJS] Data connection error with peer ${peerId}:`, err);
      this.dataConnections.delete(peerId);
    });
    this.setupDataConnection(conn);
  }

  public onStream(callback: (peerId: string, stream: MediaStream, userName: string) => void) {
    this.onStreamCallback = callback;
  }

  /**
   * Replaces outgoing video track on all active calls (camera or screen share)
   * seamlessly using RTCRtpSender.replaceTrack, or re-initiates call if sender missing.
   */
  public replaceVideoTrack(newTrack: MediaStreamTrack) {
    // 1. Update our internal localStream
    const oldTracks = this.localStream.getVideoTracks();
    oldTracks.forEach(t => {
      this.localStream.removeTrack(t);
    });
    this.localStream.addTrack(newTrack);

    // 2. Replace on all active RTCPeerConnections
    this.calls.forEach((call, peerId) => {
      const pc = call.peerConnection;
      if (!pc) {
        console.warn('[PeerJS] No peerConnection yet for', peerId);
        return;
      }

      const senders = pc.getSenders();
      const videoSender = senders.find(s => s.track && s.track.kind === 'video') ||
                          senders.find(s => !s.track);

      if (videoSender) {
        console.log('[PeerJS] Replacing video track for peer:', peerId);
        videoSender.replaceTrack(newTrack).then(() => {
          this.applyQualityToSender(videoSender, this.currentQuality);
        }).catch((err) => {
          console.warn('[PeerJS] sender.replaceTrack failed for peer:', peerId, err);
          this.reCall(peerId);
        });
      } else {
        console.log('[PeerJS] No video sender found for peer:', peerId, '- re-calling with updated stream');
        this.reCall(peerId);
      }
    });
  }

  public async applyQualityToSender(sender: RTCRtpSender, quality: StreamQuality) {
    if (!sender) return;
    try {
      const params = sender.getParameters();
      if (!params) return;
      if (!params.encodings || params.encodings.length === 0) {
        params.encodings = [{}];
      }
      const config = QUALITY_CONFIGS[quality];
      params.encodings[0].maxBitrate = config.maxBitrate;
      params.encodings[0].scaleResolutionDownBy = config.scaleResolutionDownBy;
      params.encodings[0].maxFramerate = config.maxFramerate;
      await sender.setParameters(params);
      console.log(`[PeerJS:Quality] Successfully set '${quality}' constraints on video sender:`, config);
    } catch (err) {
      console.warn(`[PeerJS:Quality] sender.setParameters for '${quality}' failed:`, err);
    }
  }

  public setStreamQuality(quality: StreamQuality) {
    this.currentQuality = quality;
    console.log(`[PeerJS:Quality] Updating stream quality to '${quality}' across ${this.calls.size} active calls`);
    this.calls.forEach((call) => {
      const pc = call.peerConnection;
      if (!pc) return;
      const senders = pc.getSenders();
      const videoSender = senders.find(s => s.track && s.track.kind === 'video');
      if (videoSender) {
        this.applyQualityToSender(videoSender, quality);
      }
    });
  }

  public getStreamQuality(): StreamQuality {
    return this.currentQuality;
  }

  public replaceAudioTrack(newTrack: MediaStreamTrack) {
    const oldTracks = this.localStream.getAudioTracks();
    oldTracks.forEach(t => this.localStream.removeTrack(t));
    this.localStream.addTrack(newTrack);

    this.calls.forEach((call, peerId) => {
      const pc = call.peerConnection;
      if (!pc) return;
      const audioSender = pc.getSenders().find(s => s.track && s.track.kind === 'audio');
      if (audioSender) {
        audioSender.replaceTrack(newTrack).catch(err => {
          console.warn('[PeerJS] audio replaceTrack failed:', err);
        });
      }
    });
  }

  public reCall(peerId: string) {
    console.log('[PeerJS] Re-calling peer with fresh stream:', peerId);
    this.callUser(peerId, this.userName);
  }

  public onUserLeft(callback: (peerId: string) => void) {
    this.onUserLeftCallback = callback;
  }

  public getPeerId() {
    return this.peer.id;
  }

  public onOpen(callback: (id: string) => void) {
    if (this.peer.id) {
      callback(this.peer.id);
    }
    this.peer.on('open', callback);
  }

  public destroy() {
    try {
      this.peer.destroy();
    } catch (e) {}
    this.calls.forEach(call => {
      try { call.close(); } catch (e) {}
    });
    this.calls.clear();
    this.dataConnections.forEach(conn => {
      try { conn.close(); } catch (e) {}
    });
    this.dataConnections.clear();
  }
}
