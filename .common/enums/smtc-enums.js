// ==========================================
// WINDOWS SMTC API CONSTANTS (IMMUTABLE)
// ==========================================

// Playback Status (session.playback_info.PlaybackStatus)
const PlaybackStatus = Object.freeze({
    CLOSED: 0,   // Engine uninitialized or empty
    OPENED: 1,   // Pipeline loaded but idling
    CHANGING: 2, // Buffering, track skipping, or seeking
    STOPPED: 3,  // Track queued but fully stopped (at 0:00)
    PLAYING: 4,  // Audio actively streaming (Run dead reckoning)
    PAUSED: 5    // Audio frozen (Halt dead reckoning)
});

// Playback Type (session.playback_info.PlaybackType)
const PlaybackType = Object.freeze({
    UNKNOWN: 0, // Generic audio wrapper
    MUSIC: 1,   // Pure audio pipeline (Spotify, iTunes, etc.)
    VIDEO: 2,   // Visual media feed (Chrome/Firefox YouTube/Twitch tabs)
    IMAGE: 3    // Static slideshow presentation hook
});

// Auto Repeat Mode (session.playback_info.AutoRepeatMode)
const AutoRepeatMode = Object.freeze({
    NONE: 0,  // Plays queue through and terminates
    TRACK: 1, // Single active song looping indefinitely
    LIST: 2   // Parent playlist/album looping indefinitely
});