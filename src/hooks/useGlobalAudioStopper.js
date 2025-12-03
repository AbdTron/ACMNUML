import { useEffect } from 'react'

/**
 * NUCLEAR Audio Blocker
 * Completely blocks Web Audio API to prevent Jitsi tones
 */

export const useGlobalAudioStopper = () => {
    useEffect(() => {
        console.log('[NUCLEAR AudioBlocker] Activating complete audio shutdown')

        // Store original functions
        const originalAudioPlay = Audio.prototype.play
        const originalMediaPlay = HTMLMediaElement.prototype.play

        // Block Audio and HTMLMediaElement play
        Audio.prototype.play = function () {
            console.log('[NUCLEAR] Blocked Audio.play()')
            return Promise.resolve()
        }

        HTMLMediaElement.prototype.play = function () {
            console.log('[NUCLEAR] Blocked HTMLMediaElement.play()')
            return Promise.resolve()
        }

        // NUCLEAR OPTION: Override Web Audio API to prevent ANY audio creation
        const AudioContext = window.AudioContext || window.webkitAudioContext

        if (AudioContext) {
            // Save original createOscillator
            const originalCreateOscillator = AudioContext.prototype.createOscillator
            const originalCreateBufferSource = AudioContext.prototype.createBufferSource
            const originalCreateMediaElementSource = AudioContext.prototype.createMediaElementSource
            const originalCreateMediaStreamSource = AudioContext.prototype.createMediaStreamSource

            // Override createOscillator to return a dummy node that does nothing
            AudioContext.prototype.createOscillator = function () {
                console.log('[NUCLEAR] Blocked createOscillator (ringtone source)')
                const dummyNode = {
                    connect: () => { },
                    disconnect: () => { },
                    start: () => { },
                    stop: () => { },
                    frequency: { value: 0 },
                    type: 'sine',
                    addEventListener: () => { },
                    removeEventListener: () => { }
                }
                return dummyNode
            }

            // Override createBufferSource to return dummy node
            AudioContext.prototype.createBufferSource = function () {
                console.log('[NUCLEAR] Blocked createBufferSource (audio file source)')
                const dummyNode = {
                    connect: () => { },
                    disconnect: () => { },
                    start: () => { },
                    stop: () => { },
                    buffer: null,
                    loop: false,
                    addEventListener: () => { },
                    removeEventListener: () => { }
                }
                return dummyNode
            }

            // Store cleanup function
            window._audioBlockerCleanup = () => {
                AudioContext.prototype.createOscillator = originalCreateOscillator
                AudioContext.prototype.createBufferSource = originalCreateBufferSource
                if (originalCreateMediaElementSource) {
                    AudioContext.prototype.createMediaElementSource = originalCreateMediaElementSource
                }
                if (originalCreateMediaStreamSource) {
                    AudioContext.prototype.createMediaStreamSource = originalCreateMediaStreamSource
                }
            }
        }

        // Mute all existing audio
        const muteAllAudio = () => {
            const audioElements = document.querySelectorAll('audio, video')
            audioElements.forEach((el) => {
                el.muted = true
                el.volume = 0
                if (!el.paused) {
                    el.pause()
                }
            })
        }

        muteAllAudio()

        // Mutation observer for dynamic audio
        const observer = new MutationObserver(() => {
            muteAllAudio()
        })

        observer.observe(document.body, {
            childList: true,
            subtree: true
        })

        // Continuous monitoring
        const monitorInterval = setInterval(() => {
            muteAllAudio()

            // Suspend all audio contexts
            try {
                if (window.audioContext) {
                    if (window.audioContext.state === 'running') {
                        window.audioContext.suspend()
                    }
                    // Also try to set destination gain to 0
                    try {
                        if (window.audioContext.destination && window.audioContext.destination.gain) {
                            window.audioContext.destination.gain.value = 0
                        }
                    } catch (e) { }
                }
            } catch (e) { }
        }, 100)

        window.stopAllPageAudio = muteAllAudio

        console.log('[NUCLEAR] Complete audio shutdown active - Web Audio API disabled')

        return () => {
            Audio.prototype.play = originalAudioPlay
            HTMLMediaElement.prototype.play = originalMediaPlay
            if (window._audioBlockerCleanup) {
                window._audioBlockerCleanup()
                delete window._audioBlockerCleanup
            }
            observer.disconnect()
            clearInterval(monitorInterval)
            delete window.stopAllPageAudio
            console.log('[NUCLEAR] Audio blocking disabled')
        }
    }, [])

    return null
}

export default useGlobalAudioStopper
