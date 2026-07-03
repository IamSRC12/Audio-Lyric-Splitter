// Lyrics Analyzer Module
// Handles lyrics parsing and automatic timing detection

class LyricsAnalyzer {
    constructor(audioBuffer, audioContext) {
        this.audioBuffer = audioBuffer;
        this.audioContext = audioContext;
        this.sampleRate = audioBuffer.sampleRate;
        this.duration = audioBuffer.duration;
    }

    /**
     * Parse lyrics text into individual lines
     */
    parseLines(lyricsText) {
        return lyricsText
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);
    }

    /**
     * Detect silence points in the audio to determine segment boundaries
     */
    async detectSilencePoints(threshold = 0.01, minSilenceDuration = 0.3) {
        const channelData = this.audioBuffer.getChannelData(0);
        const silencePoints = [];

        let silenceStart = null;
        const samplesPerCheck = Math.floor(this.sampleRate * 0.01); // Check every 10ms

        for (let i = 0; i < channelData.length; i += samplesPerCheck) {
            const slice = channelData.slice(i, i + samplesPerCheck);
            const rms = this.calculateRMS(slice);

            if (rms < threshold) {
                // Silence detected
                if (silenceStart === null) {
                    silenceStart = i / this.sampleRate;
                }
            } else {
                // Sound detected
                if (silenceStart !== null) {
                    const silenceEnd = i / this.sampleRate;
                    const silenceDuration = silenceEnd - silenceStart;

                    if (silenceDuration >= minSilenceDuration) {
                        // Store the midpoint of the silence
                        silencePoints.push(silenceStart + silenceDuration / 2);
                    }
                    silenceStart = null;
                }
            }
        }

        return silencePoints;
    }

    /**
     * Calculate Root Mean Square (RMS) for audio amplitude
     */
    calculateRMS(audioData) {
        let sum = 0;
        for (let i = 0; i < audioData.length; i++) {
            sum += audioData[i] * audioData[i];
        }
        return Math.sqrt(sum / audioData.length);
    }

    /**
     * Detect energy changes in audio (alternative to silence detection)
     */
    async detectEnergyChanges() {
        const channelData = this.audioBuffer.getChannelData(0);
        const windowSize = Math.floor(this.sampleRate * 0.1); // 100ms windows
        const energyPoints = [];

        let prevEnergy = 0;

        for (let i = 0; i < channelData.length; i += windowSize) {
            const slice = channelData.slice(i, i + windowSize);
            const energy = this.calculateRMS(slice);

            // Detect significant energy drops (potential segment boundaries)
            if (prevEnergy > 0 && energy < prevEnergy * 0.5) {
                energyPoints.push(i / this.sampleRate);
            }

            prevEnergy = energy;
        }

        return energyPoints;
    }

    /**
     * Generate timestamps for lyric lines based on detected silence/energy changes
     */
    async generateTimestamps(lyricLines, onProgress) {
        const segments = [];

        // Update progress
        if (onProgress) onProgress(10, 'Analyzing audio patterns...');

        // Detect silence points
        const silencePoints = await this.detectSilencePoints();

        if (onProgress) onProgress(40, 'Detecting segment boundaries...');

        // If we don't have enough silence points, use energy changes
        let breakPoints = silencePoints;
        if (breakPoints.length < lyricLines.length - 1) {
            const energyPoints = await this.detectEnergyChanges();
            breakPoints = [...silencePoints, ...energyPoints].sort((a, b) => a - b);
        }

        if (onProgress) onProgress(70, 'Mapping lyrics to timestamps...');

        // If still not enough break points, distribute evenly
        if (breakPoints.length < lyricLines.length - 1) {
            breakPoints = this.distributeEvenly(lyricLines.length);
        }

        // Create segments
        let startTime = 0;

        for (let i = 0; i < lyricLines.length; i++) {
            const endTime = i < lyricLines.length - 1
                ? breakPoints[i]
                : this.duration;

            segments.push({
                index: i,
                lyrics: lyricLines[i],
                startTime: Math.max(0, startTime),
                endTime: Math.min(this.duration, endTime),
                duration: endTime - startTime
            });

            startTime = endTime;
        }

        if (onProgress) onProgress(100, 'Analysis complete!');

        return segments;
    }

    /**
     * Distribute timestamps evenly across the audio duration
     */
    distributeEvenly(lineCount) {
        const segmentDuration = this.duration / lineCount;
        const breakPoints = [];

        for (let i = 1; i < lineCount; i++) {
            breakPoints.push(i * segmentDuration);
        }

        return breakPoints;
    }

    /**
     * Format time in MM:SS format
     */
    static formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * Format time range
     */
    static formatTimeRange(start, end) {
        return `${this.formatTime(start)} - ${this.formatTime(end)}`;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LyricsAnalyzer;
}
