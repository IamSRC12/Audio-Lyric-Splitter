// Groq Service Module - Auto-Split Mode with Multi-Language Support
// Let Whisper decide the splits based on its own segmentation

class GroqService {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://api.groq.com/openai/v1/audio/transcriptions';
    }

    /**
     * Transcribe audio using Groq Whisper model
     */
    async transcribe(audioFile, language, onProgress) {
        if (!this.apiKey) {
            throw new Error('API Key is missing');
        }

        if (audioFile.size > 25 * 1024 * 1024) {
            throw new Error('File too large for AI API (Max 25MB).');
        }

        const formData = new FormData();
        formData.append('file', audioFile);
        formData.append('model', 'whisper-large-v3-turbo');
        formData.append('response_format', 'verbose_json');

        // Add language if not auto-detect
        if (language && language !== 'auto') {
            formData.append('language', language);
        }

        try {
            if (onProgress) onProgress(20, 'Uploading to AI...');

            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || `API Error: ${response.status}`);
            }

            if (onProgress) onProgress(80, 'Processing AI response...');

            const data = await response.json();
            console.log('Whisper found', data.segments?.length || 0, 'segments');
            return data;

        } catch (error) {
            console.error('Groq API Error:', error);
            throw error;
        }
    }

    /**
     * IGNORE user lyrics - just use Whisper's natural segmentation
     * Each Whisper segment becomes one output file
     */
    alignLyrics(userLyricsLines, transcriptionData) {
        const aiSegments = transcriptionData.segments || [];
        const audioDuration = transcriptionData.duration;

        if (aiSegments.length === 0) {
            alert('Whisper found no segments. Using your lyrics as guide.');
            return this.evenDistribution(userLyricsLines, audioDuration);
        }

        // Just use Whisper's segments directly!
        const alignedSegments = aiSegments.map((seg, index) => ({
            index: index,
            lyrics: seg.text.trim(), // Use what Whisper heard
            startTime: Math.max(0, seg.start - 0.1),
            endTime: Math.min(audioDuration, seg.end + 0.1),
            duration: seg.end - seg.start
        }));

        console.log(`Created ${alignedSegments.length} segments from Whisper`);
        return alignedSegments;
    }

    /**
     * Fallback
     */
    evenDistribution(userLyricsLines, audioDuration) {
        const segDuration = audioDuration / userLyricsLines.length;
        return userLyricsLines.map((line, i) => ({
            index: i,
            lyrics: line,
            startTime: i * segDuration,
            endTime: (i + 1) * segDuration,
            duration: segDuration
        }));
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = GroqService;
}
