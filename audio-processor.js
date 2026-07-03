// Audio Processor Module
// Handles audio splitting using native Web Audio API (No FFmpeg required)
// Exports as WAV for maximum compatibility

class AudioProcessor {
    constructor() {
        this.audioContext = null;
    }

    /**
     * Initialize - no external libraries needed now
     */
    async initialize(onProgress) {
        if (onProgress) onProgress(100);
        return true;
    }

    /**
     * Split audio file into segments based on timestamps
     * Uses the already decoded AudioBuffer for speed and reliability
     */
    async splitAudio(audioBuffer, segments, onProgress) {
        const processedSegments = [];
        const totalSegments = segments.length;

        try {
            // Process each segment
            for (let i = 0; i < segments.length; i++) {
                const segment = segments[i];

                if (onProgress) {
                    const progress = Math.round((i / totalSegments) * 100);
                    onProgress(progress, `Processing segment ${i + 1} of ${totalSegments}...`);
                }

                // Calculate start and end samples
                const startSample = Math.floor(segment.startTime * audioBuffer.sampleRate);
                const endSample = Math.floor(segment.endTime * audioBuffer.sampleRate);
                const length = endSample - startSample;

                if (length <= 0) continue;

                // Create new AudioBuffer for the segment
                const segmentBuffer = new AudioBuffer({
                    length: length,
                    numberOfChannels: audioBuffer.numberOfChannels,
                    sampleRate: audioBuffer.sampleRate
                });

                // Copy data for each channel
                for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
                    const channelData = audioBuffer.getChannelData(channel);
                    const segmentData = segmentBuffer.getChannelData(channel);

                    // Copy the slice
                    for (let j = 0; j < length; j++) {
                        segmentData[j] = channelData[startSample + j];
                    }
                }

                // Convert to WAV Blob
                const blob = this.bufferToWav(segmentBuffer);
                const url = URL.createObjectURL(blob);

                processedSegments.push({
                    ...segment,
                    blob,
                    url,
                    fileName: this.generateFileName(segment.lyrics, i + 1)
                });

                // Small yield to keep UI responsive
                await new Promise(r => setTimeout(r, 10));
            }

            if (onProgress) {
                onProgress(100, 'All segments processed!');
            }

            return processedSegments;

        } catch (error) {
            console.error('Error splitting audio:', error);
            throw new Error('Failed to split audio: ' + error.message);
        }
    }

    /**
     * Generate a clean filename for the segment
     */
    generateFileName(lyrics, segmentNumber) {
        const cleanLyrics = lyrics
            .substring(0, 30) // Max 30 chars
            .replace(/[^a-z0-9]/gi, '_') // Replace special chars
            .replace(/_+/g, '_') // Remove duplicate underscores
            .replace(/^_|_$/g, ''); // Remove leading/trailing underscores

        return `segment_${segmentNumber}_${cleanLyrics}.wav`; // Using .wav
    }

    /**
     * Convert AudioBuffer to WAV Blob
     * Based on standard RIFF WAV spec
     */
    bufferToWav(abuffer) {
        const numOfChan = abuffer.numberOfChannels;
        const length = abuffer.length * numOfChan * 2 + 44;
        const buffer = new ArrayBuffer(length);
        const view = new DataView(buffer);
        const channels = [];
        let i;
        let sample;
        let offset = 0;
        let pos = 0;

        // Write WAV Header
        setUint32(0x46464952); // "RIFF"
        setUint32(length - 8); // file length - 8
        setUint32(0x45564157); // "WAVE"

        setUint32(0x20746d66); // "fmt " chunk
        setUint32(16); // length = 16
        setUint16(1); // PCM (uncompressed)
        setUint16(numOfChan);
        setUint32(abuffer.sampleRate);
        setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
        setUint16(numOfChan * 2); // block-align
        setUint16(16); // 16-bit (hardcoded in this writing logic)

        setUint32(0x61746164); // "data" - chunk
        setUint32(length - pos - 4); // chunk length

        // Write interleaved data
        for (i = 0; i < abuffer.numberOfChannels; i++)
            channels.push(abuffer.getChannelData(i));

        while (pos < abuffer.length) {
            for (i = 0; i < numOfChan; i++) {
                // clamp
                sample = Math.max(-1, Math.min(1, channels[i][pos]));
                // scale to 16-bit signed int
                sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
                view.setInt16(44 + offset, sample, true);
                offset += 2;
            }
            pos++;
        }

        return new Blob([buffer], { type: "audio/wav" });

        function setUint16(data) {
            view.setUint16(pos, data, true);
            pos += 2;
        }

        function setUint32(data) {
            view.setUint32(pos, data, true);
            pos += 4;
        }
    }

    /**
     * Download a single segment
     */
    downloadSegment(segment) {
        const a = document.createElement('a');
        a.href = segment.url;
        a.download = segment.fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    /**
     * Download all segments
     */
    async downloadAllSegments(segments) {
        for (let i = 0; i < segments.length; i++) {
            this.downloadSegment(segments[i]);
            await new Promise(r => setTimeout(r, 500));
        }
    }

    /**
     * Clean up blob URLs
     */
    cleanup(segments) {
        segments.forEach(segment => {
            if (segment.url) {
                URL.revokeObjectURL(segment.url);
            }
        });
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AudioProcessor;
}
