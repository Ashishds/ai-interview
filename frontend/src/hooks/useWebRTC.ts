/**
 * useWebRTC — Custom hook for managing WebRTC connections in the interview room.
 * Handles local camera/mic, peer connection, and media stream setup.
 */
'use client'

import { useRef, useState, useCallback, useEffect } from 'react'

interface WebRTCOptions {
  enableVideo?: boolean
  enableAudio?: boolean
}

interface WebRTCState {
  localStream: MediaStream | null
  isVideoEnabled: boolean
  isAudioEnabled: boolean
  isConnecting: boolean
  error: string | null
}

export function useWebRTC(options: WebRTCOptions = {}) {
  const { enableVideo = true, enableAudio = true } = options

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)

  const [state, setState] = useState<WebRTCState>({
    localStream: null,
    isVideoEnabled: enableVideo,
    isAudioEnabled: enableAudio,
    isConnecting: false,
    error: null,
  })

  /**
   * Request media permissions and initialize local stream.
   */
  const initializeMedia = useCallback(async () => {
    setState(s => ({ ...s, isConnecting: true, error: null }))

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: enableVideo ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        } : false,
        audio: enableAudio ? {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 48000,
        } : false,
      })

      localStreamRef.current = stream

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }

      setState(s => ({
        ...s,
        localStream: stream,
        isConnecting: false,
      }))

      return stream
    } catch (err: unknown) {
      const msg = err instanceof Error
        ? err.name === 'NotAllowedError'
          ? 'Camera/microphone access denied. Please allow permissions.'
          : err.message
        : 'Failed to access media devices.'

      setState(s => ({ ...s, error: msg, isConnecting: false }))
      throw err
    }
  }, [enableVideo, enableAudio])

  /**
   * Toggle camera on/off.
   */
  const toggleVideo = useCallback(() => {
    const stream = localStreamRef.current
    if (!stream) return

    stream.getVideoTracks().forEach(track => {
      track.enabled = !track.enabled
    })

    setState(s => ({ ...s, isVideoEnabled: !s.isVideoEnabled }))
  }, [])

  /**
   * Toggle microphone on/off.
   */
  const toggleAudio = useCallback(() => {
    const stream = localStreamRef.current
    if (!stream) return

    stream.getAudioTracks().forEach(track => {
      track.enabled = !track.enabled
    })

    setState(s => ({ ...s, isAudioEnabled: !s.isAudioEnabled }))
  }, [])

  /**
   * Stop all media tracks and clean up.
   */
  const stopMedia = useCallback(() => {
    localStreamRef.current?.getTracks().forEach(track => track.stop())
    localStreamRef.current = null
    peerConnectionRef.current?.close()
    peerConnectionRef.current = null
    setState(s => ({ ...s, localStream: null }))
  }, [])

  /**
   * Get current audio level (0–100) for visualizer.
   */
  const getAudioLevel = useCallback((): Promise<number> => {
    return new Promise(resolve => {
      const stream = localStreamRef.current
      if (!stream) return resolve(0)

      const audioCtx = new AudioContext()
      const source = audioCtx.createMediaStreamSource(stream)
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)

      const data = new Uint8Array(analyser.frequencyBinCount)
      analyser.getByteFrequencyData(data)
      const avg = data.reduce((a, b) => a + b, 0) / data.length
      audioCtx.close()
      resolve(Math.round((avg / 255) * 100))
    })
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMedia()
    }
  }, [stopMedia])

  return {
    localVideoRef,
    ...state,
    initializeMedia,
    toggleVideo,
    toggleAudio,
    stopMedia,
    getAudioLevel,
  }
}
