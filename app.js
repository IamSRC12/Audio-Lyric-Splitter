// Main Application Logic
// Coordinates UI interactions, audio processing, and lyrics analysis

// Global state
const state = {
    audioFile: null,
    audioBuffer: null,
    audioContext: null,
    lyrics: [],
    segments: [],
    processedSegments: []
};

// Initialize modules
const audioProcessor = new AudioProcessor();
let lyricsAnalyzer = null;
let groqService = null;

// DOM Elements
const uploadArea = document.getElementById('uploadArea');
const audioFileInput = document.getElementById('audioFile');
const audioInfo = document.getElementById('audioInfo');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const fileDuration = document.getElementById('fileDuration');

const lyricsSection = document.getElementById('lyricsSection');
const lyricsInput = document.getElementById('lyricsInput');
const apiKeyInput = document.getElementById('apiKeyInput');
const languageSelect = document.getElementById('languageSelect');
const analyzeLyricsBtn = document.getElementById('analyzeLyrics');
const clearLyricsBtn = document.getElementById('clearLyrics');

const analysisProgress = document.getElementById('analysisProgress');
const analysisStatus = document.getElementById('analysisStatus');
const analysisPercent = document.getElementById('analysisPercent');
const analysisProgressFill = document.getElementById('analysisProgressFill');

const segmentsSection = document.getElementById('segmentsSection');
const segmentsGrid = document.getElementById('segmentsGrid');
const downloadAllBtn = document.getElementById('downloadAll');

const processingCard = document.getElementById('processingCard');
const processingStatus = document.getElementById('processingStatus');
const processingPercent = document.getElementById('processingPercent');
const processingProgressFill = document.getElementById('processingProgressFill');

// Event Listeners
uploadArea.addEventListener('click', () => audioFileInput.click());
uploadArea.addEventListener('dragover', handleDragOver);
uploadArea.addEventListener('dragleave', handleDragLeave);
uploadArea.addEventListener('drop', handleDrop);
audioFileInput.addEventListener('change', handleFileSelect);

analyzeLyricsBtn.addEventListener('click', handleAnalyzeLyrics);
clearLyricsBtn.addEventListener('click', handleClearLyrics);
downloadAllBtn.addEventListener('click', handleDownloadAll);

// File Upload Handlers
function handleDragOver(e) {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');

    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
}

function handleFileSelect(e) {
    const files = e.target.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
}

async function handleFile(file) {
    // Validate file
    if (!file.type.startsWith('audio/')) {
        alert('Please upload an audio file');
        return;
    }

    // Warning for large files if using API
    const maxSize = 500 * 1024 * 1024;
    if (file.size > maxSize) {
        alert('File size must be less than 500MB');
        return;
    }

    if (file.size > 25 * 1024 * 1024) {
        alert('Note: Files larger than 25MB might fail with the AI API. Please try a smaller file if you encounter errors.');
    }

    state.audioFile = file;

    // Update UI
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);
    audioInfo.classList.add('active');

    // Load audio for analysis
    try {
        processingCard.style.display = 'block';
        updateProcessingProgress(0, 'Loading audio file...');

        await loadAudioFile(file);

        processingCard.style.display = 'none';
        lyricsSection.classList.add('active');
    } catch (error) {
        console.error('Error loading audio:', error);
        alert('Failed to load audio file. Please try another file.');
        processingCard.style.display = 'none';
    }
}

async function loadAudioFile(file) {
    // Create audio context
    state.audioContext = new (window.AudioContext || window.webkitAudioContext)();

    // Read file as array buffer
    const arrayBuffer = await file.arrayBuffer();

    updateProcessingProgress(50, 'Decoding audio...');

    // Decode audio data
    state.audioBuffer = await state.audioContext.decodeAudioData(arrayBuffer);

    // Update duration
    fileDuration.textContent = LyricsAnalyzer.formatTime(state.audioBuffer.duration);

    // Create lyrics analyzer (Old Legacy)
    lyricsAnalyzer = new LyricsAnalyzer(state.audioBuffer, state.audioContext);

    updateProcessingProgress(100, 'Audio Loaded!');
}

// Lyrics Handlers
async function handleAnalyzeLyrics() {
    const lyricsText = lyricsInput.value.trim();
    const apiKey = apiKeyInput.value.trim();

    if (!apiKey && !lyricsText) {
        alert('Please enter either an API key (for auto-detection) or lyrics');
        return;
    }

    if (!state.audioBuffer) {
        alert('Please upload an audio file first');
        return;
    }

    // Disable button
    analyzeLyricsBtn.disabled = true;
    analysisProgress.classList.add('active');

    try {
        // If using AI, lyrics are optional - AI will auto-detect
        if (apiKey) {
            updateAnalysisProgress(10, 'Initializing AI Service...');
            groqService = new GroqService(apiKey);

            const selectedLanguage = languageSelect.value;
            updateAnalysisProgress(30, 'Transcribing audio with Groq AI...');
            const transcription = await groqService.transcribe(state.audioFile, selectedLanguage, updateAnalysisProgress);

            updateAnalysisProgress(90, 'Creating segments from AI...');

            // Use AI's natural segmentation (ignore user lyrics)
            state.segments = groqService.alignLyrics([], transcription);

        } else {
            // No AI - must have lyrics
            if (!lyricsText) {
                alert('Please enter lyrics or provide an API key');
                return;
            }

            state.lyrics = lyricsAnalyzer.parseLines(lyricsText);
            if (state.lyrics.length === 0) {
                alert('No valid lyrics found');
                return;
            }

            updateAnalysisProgress(10, 'Analyzing audio patterns (Legacy)...');
            state.segments = await lyricsAnalyzer.generateTimestamps(
                state.lyrics,
                updateAnalysisProgress
            );
        }

        // Show segments section
        segmentsSection.classList.add('active');

        // Process audio segments immediately
        await processAudioSegments();

    } catch (error) {
        console.error('Error analyzing lyrics:', error);
        alert('Failed to analyze: ' + error.message);
    } finally {
        analyzeLyricsBtn.disabled = false;
        analysisProgress.classList.remove('active');
    }
}

function handleClearLyrics() {
    lyricsInput.value = '';
    state.lyrics = [];
    state.segments = [];
    state.processedSegments = [];
    segmentsGrid.innerHTML = '';
    segmentsSection.classList.remove('active');
}

function updateAnalysisProgress(percent, status) {
    analysisPercent.textContent = `${Math.round(percent)}%`;
    analysisStatus.textContent = status;
    analysisProgressFill.style.width = `${percent}%`;
}

// Segment Rendering
function renderSegments() {
    segmentsGrid.innerHTML = '';

    state.segments.forEach((segment, index) => {
        const card = createSegmentCard(segment, index);
        segmentsGrid.appendChild(card);
    });
}

function createSegmentCard(segment, index) {
    const isReady = state.processedSegments[index];
    const card = document.createElement('div');
    card.className = 'segment-card';
    card.innerHTML = `
    <div class="segment-header">
      <span class="segment-number">Segment ${index + 1}</span>
      <span class="segment-duration">${LyricsAnalyzer.formatTimeRange(segment.startTime, segment.endTime)}</span>
    </div>
    <div class="segment-lyrics">${segment.lyrics}</div>
    <div class="segment-controls">
      <button class="btn btn-secondary btn-icon" onclick="playSegment(${index})" data-tooltip="Play preview" ${isReady ? '' : 'disabled'}>
        <span>▶️</span>
        <span>Play</span>
      </button>
      <button class="btn btn-secondary btn-icon" onclick="downloadSegment(${index})" data-tooltip="Download this segment" ${isReady ? '' : 'disabled'}>
        <span>💾</span>
        <span>${isReady ? 'Download WAV' : 'Processing...'}</span>
      </button>
    </div>
  `;
    return card;
}

// Audio Processing
async function processAudioSegments() {
    processingCard.style.display = 'block';
    downloadAllBtn.disabled = true;

    // Render initial processing state
    state.processedSegments = new Array(state.segments.length).fill(null);
    renderSegments();

    try {
        // Initialize processor
        await audioProcessor.initialize();

        // Split audio using the buffer directly
        updateProcessingProgress(10, 'Cutting precise segments...');
        const results = await audioProcessor.splitAudio(
            state.audioBuffer,
            state.segments,
            (progress, status) => {
                updateProcessingProgress(progress, status);
            }
        );

        // Assign results
        state.processedSegments = results;

        updateProcessingProgress(100, 'All segments ready!');

        // Enable download buttons
        downloadAllBtn.disabled = false;
        renderSegments();

        // Hide processing card after a delay
        setTimeout(() => {
            processingCard.style.display = 'none';
        }, 1000);

    } catch (error) {
        console.error('Error processing audio:', error);
        alert('Failed to process audio segments: ' + error.message);
        processingCard.style.display = 'none';
    }
}

function updateProcessingProgress(percent, status) {
    processingPercent.textContent = `${Math.round(percent)}%`;
    processingStatus.textContent = status;
    processingProgressFill.style.width = `${percent}%`;
}

// Playback Functions
function playSegment(index) {
    const segment = state.processedSegments[index];
    if (!segment || !segment.url) {
        alert('Segment not ready yet. Please wait for processing to complete.');
        return;
    }

    const audio = new Audio(segment.url);
    audio.play();
}

// Download Functions
function downloadSegment(index) {
    const segment = state.processedSegments[index];
    if (!segment) {
        alert('Segment not ready yet. Please wait for processing to complete.');
        return;
    }

    audioProcessor.downloadSegment(segment);
}

async function handleDownloadAll() {
    const validSegments = state.processedSegments.filter(s => s);
    if (validSegments.length === 0) {
        alert('No segments to download');
        return;
    }

    downloadAllBtn.disabled = true;
    downloadAllBtn.innerHTML = '<span class="spinner"></span><span>Creating ZIP...</span>';

    try {
        // Check if JSZip is loaded
        if (typeof JSZip === 'undefined') {
            throw new Error('JSZip library not loaded. Please reload the page.');
        }

        // Create ZIP file using JSZip
        const zip = new JSZip();
        console.log('Creating ZIP with', validSegments.length, 'segments');

        // Add each segment to the ZIP
        for (let i = 0; i < validSegments.length; i++) {
            const segment = validSegments[i];
            const fileName = segment.fileName;

            // Use the blob directly (already in memory)
            if (!segment.blob) {
                throw new Error(`Segment ${i + 1} missing audio data`);
            }

            // Add to ZIP
            zip.file(fileName, segment.blob);

            // Update progress
            const progress = Math.round(((i + 1) / validSegments.length) * 100);
            downloadAllBtn.innerHTML = `<span class="spinner"></span><span>Adding to ZIP... ${progress}%</span>`;
        }

        // Generate ZIP file
        downloadAllBtn.innerHTML = '<span class="spinner"></span><span>Generating ZIP...</span>';
        const zipBlob = await zip.generateAsync({ type: 'blob' });

        // Download the ZIP
        const originalName = state.audioFile.name.replace(/\.[^/.]+$/, '');
        const zipFileName = `${originalName}_segments.zip`;

        const a = document.createElement('a');
        a.href = URL.createObjectURL(zipBlob);
        a.download = zipFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);

        // Success
        downloadAllBtn.innerHTML = '<span>✅</span><span>Downloaded!</span>';
        setTimeout(() => {
            downloadAllBtn.disabled = false;
            downloadAllBtn.innerHTML = '<span>📦</span><span>Download All as ZIP</span>';
        }, 2000);

    } catch (error) {
        console.error('Error creating ZIP:', error);
        alert('Failed to create ZIP: ' + error.message);
        downloadAllBtn.disabled = false;
        downloadAllBtn.innerHTML = '<span>📦</span><span>Download All as ZIP</span>';
    }
}

// Utility Functions
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (state.processedSegments.length > 0) {
        audioProcessor.cleanup(state.processedSegments.filter(s => s));
    }
});
