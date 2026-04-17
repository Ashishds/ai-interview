/**
 * pcm-processor.js — AudioWorkletProcessor for PCM16 capture
 * Converts float32 mic samples (at whatever rate the AudioContext runs — usually 48 kHz)
 * down to 24 kHz PCM16, which is what OpenAI Realtime expects.
 */
class PCMProcessor extends AudioWorkletProcessor {
    constructor(options) {
        super(options);
        const po = options.processorOptions || {};
        // inputSampleRate is the real AudioContext rate passed from the main thread.
        // Default 48000 covers the most common browser behaviour (Chrome/Edge ignore sampleRate hints).
        this._inRate  = po.inputSampleRate || 48000;
        this._outRate = po.outputRate      || 24000;
        this._buffer  = [];
        // Accumulate until we have ~100 ms at the output rate before sending
        this._chunkSize = Math.floor(this._outRate * 0.1); // 2400 samples @ 24 kHz
    }

    /** Linear interpolation resample from _inRate to _outRate */
    _resample(float32) {
        if (this._inRate === this._outRate) return float32;
        const ratio  = this._inRate / this._outRate;
        const outLen = Math.max(1, Math.floor(float32.length / ratio));
        const out    = new Float32Array(outLen);
        for (let i = 0; i < outLen; i++) {
            const pos = i * ratio;
            const i0  = Math.floor(pos);
            const frac = pos - i0;
            const s0  = float32[i0]     ?? 0;
            const s1  = float32[i0 + 1] ?? s0;
            out[i] = s0 + frac * (s1 - s0);
        }
        return out;
    }

    process(inputs) {
        const ch = inputs[0]?.[0];
        if (!ch) return true;

        const resampled = this._resample(ch);
        for (let i = 0; i < resampled.length; i++) {
            this._buffer.push(resampled[i]);
        }

        while (this._buffer.length >= this._chunkSize) {
            const chunk = this._buffer.splice(0, this._chunkSize);
            const pcm16 = this._toPCM16(chunk);
            this.port.postMessage({ type: 'audio_chunk', audio: pcm16.buffer });
        }
        return true;
    }

    _toPCM16(floats) {
        const out = new Int16Array(floats.length);
        for (let i = 0; i < floats.length; i++) {
            const c = Math.max(-1, Math.min(1, floats[i]));
            out[i] = c < 0 ? c * 0x8000 : c * 0x7fff;
        }
        return out;
    }
}

registerProcessor('pcm-processor', PCMProcessor);
