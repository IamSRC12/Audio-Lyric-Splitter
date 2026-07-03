# 🎵 AI Audio Lyric Splitter

An intelligent web application that automatically splits audio files into individual segments based on lyric lines. Perfect for creating karaoke tracks, studying song structure, or isolating specific parts of a song.

## ✨ Features

- **🎧 Smart Audio Upload**: Drag & drop or click to upload audio files (MP3, WAV, M4A, OGG)
- **📝 Manual Lyrics Input**: Paste your lyrics line by line
- **🤖 Automatic Timing Detection**: AI-powered analysis detects natural pauses and segment boundaries
- **✂️ Precise Audio Splitting**: Uses FFmpeg.wasm for accurate, client-side audio processing
- **▶️ Preview Segments**: Listen to each segment before downloading
- **💾 Batch Download**: Download all segments at once
- **🎨 Premium UI**: Modern, dark-themed interface with smooth animations

## 🚀 How to Use

1. **Upload Audio File**
   - Click the upload area or drag & drop your audio file
   - Supports files up to 100MB

2. **Input Lyrics**
   - Paste your lyrics into the text area
   - Each line will become a separate segment
   - Example:
     ```
     First line of the song
     Second line of the song
     Third line of the song
     ```

3. **Analyze & Process**
   - Click "Analyze & Detect Timing"
   - The app will automatically detect where to split the audio
   - Processing happens entirely in your browser (no uploads!)

4. **Preview & Download**
   - Preview each segment by clicking the Play button
   - Download individual segments or all at once
   - Files are named automatically based on lyrics

## 🛠️ Technical Details

### Technologies Used
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Audio Processing**: FFmpeg.wasm (client-side)
- **Audio Analysis**: Web Audio API
- **Design**: Custom CSS with glassmorphism and gradient effects

### How It Works

1. **Audio Loading**: The Web Audio API decodes the uploaded audio file into an AudioBuffer
2. **Silence Detection**: Analyzes the waveform to detect silence points between lyric lines
3. **Energy Analysis**: Detects significant energy drops as potential segment boundaries
4. **Timestamp Generation**: Maps detected boundaries to lyric lines
5. **Audio Splitting**: FFmpeg.wasm splits the audio at precise timestamps
6. **File Generation**: Creates individual MP3 files for each segment

### Browser Compatibility
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Edge 90+
- ✅ Safari 14+

**Note**: Requires a modern browser with Web Audio API and WebAssembly support.

## 📁 Project Structure

```
Audio-Lyric-Splitter/
├── index.html              # Main HTML structure
├── styles.css              # Premium UI styles
├── app.js                  # Main application logic
├── lyrics-analyzer.js      # Lyrics parsing & timing detection
├── audio-processor.js      # FFmpeg.wasm integration
└── README.md              # This file
```

## 🎯 Use Cases

- **Karaoke Creation**: Split songs into individual lines for karaoke practice
- **Music Education**: Analyze song structure and timing
- **Content Creation**: Extract specific parts of songs for videos or remixes
- **Language Learning**: Study lyrics pronunciation line by line
- **Audio Editing**: Quickly isolate specific sections of audio

## 🔒 Privacy

All processing happens **100% client-side** in your browser. Your audio files are never uploaded to any server. FFmpeg.wasm runs entirely in your browser using WebAssembly.

## 🐛 Troubleshooting

**Issue**: FFmpeg fails to load
- **Solution**: Ensure you have a stable internet connection for the initial FFmpeg download
- **Solution**: Try using a different browser

**Issue**: Segments are not aligned correctly
- **Solution**: The automatic detection works best with clear pauses between lines
- **Solution**: Try songs with distinct vocal breaks

**Issue**: Processing is slow
- **Solution**: Large files (>50MB) may take longer to process
- **Solution**: Close other browser tabs to free up memory

## 📝 License

This project is open source and available for personal and commercial use.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 💡 Future Enhancements

- [ ] Manual timestamp adjustment interface
- [ ] Integration with lyrics APIs (Genius, Musixmatch)
- [ ] Support for more audio formats
- [ ] Real ZIP file creation for batch downloads
- [ ] Waveform visualization
- [ ] Export to different audio formats

---

**Made with ❤️ for music lovers and creators**
