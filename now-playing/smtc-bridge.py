import sys
import subprocess

# --- SELF-HEALING DEPENDENCY CHECK ---
def check_dependencies():
    required = {'flask': 'flask', 'flask_cors': 'flask_cors', 'winsdk': 'winsdk', 'PIL': 'Pillow'}
    for mod, pkg in required.items():
        try:
            __import__(mod)
        except ImportError:
            print(f"--- Missing dependency: {pkg}. Installing now... ---")
            try:
                subprocess.check_call([sys.executable, "-m", "pip", "install", pkg])
            except subprocess.CalledProcessError:
                print(f"--- Failed to install {pkg}. Please install it manually. ---")
                sys.exit(0)

check_dependencies()

import asyncio
import json
import base64
import io
from PIL import Image
from flask import Flask, jsonify
from flask_cors import CORS
from winsdk.windows.media.control import GlobalSystemMediaTransportControlsSessionManager as SMTC
from winsdk.windows.storage.streams import DataReader

app = Flask(__name__)
CORS(app)

# --- GLOBAL MEMORY CACHE ---
ARTWORK_CACHE = {}

async def get_all_media_info():
    global ARTWORK_CACHE
    import winsdk._winrt
    try:
        winsdk._winrt.init_apartment(1) 
    except Exception:
        pass 
        
    try:
        # Instantiate the SMTC manager -> This allows use to "talk" to the Windows Media API
        manager = await SMTC.request_async()
        
        # If it returns null, then no media is playing, or something fucked up and I have no
        # idea what to do, so just return an empty session list
        if not manager:
            return {"current_session_id": None, "sessions": []}

        # This is the session for the current media player -> Whatever Windows deems is "in focus"
        # will be the current session.
        # We will store the SourceAppUserModelId, which we all add to the final payload.
        # For all available properties/methods/events, see the official docs:
        # https://learn.microsoft.com/en-us/uwp/api/windows.media.control.globalsystemmediatransportcontrolssession?view=winrt-28000
        current_focused = manager.get_current_session()
        current_session_id = current_focused.source_app_user_model_id if current_focused else None

        # We will also get all sessions, not just the current session.
        # This will provide the client with all the necessary info if they want to target just
        # one application.
        all_sessions = manager.get_sessions()
        sessions_list = []

        # We will not iterate over all the sessions, and grab all the available info
        for session in all_sessions:
            # Get all the available info for each session object:
            # For all available properties/methods/events, see the official docs:
            # https://learn.microsoft.com/en-us/uwp/api/windows.media.control.globalsystemmediatransportcontrolssession?view=winrt-28000
            app_id = session.source_app_user_model_id
            raw_playback = session.get_playback_info()
            raw_timeline = session.get_timeline_properties()
            raw_media = await session.try_get_media_properties_async()

            # Playback info
            # https://learn.microsoft.com/en-us/uwp/api/windows.media.control.globalsystemmediatransportcontrolssessionplaybackinfo?view=winrt-28000
            playback_data = {
                # AutoRepeatMode: Specifies the repeat mode of the session.
                "AutoRepeatMode": raw_playback.auto_repeat_mode.value if (raw_playback and raw_playback.auto_repeat_mode) else 0,
                
                # IsShuffleActive: Specifies whether the session is currently playing content in a shuffled order.
                "IsShuffleActive": raw_playback.is_shuffle_active if raw_playback else False,
                
                # PlaybackRate: The rate at which playback is happening (e.g., 1.0 is normal speed).
                "PlaybackRate": raw_playback.playback_rate if raw_playback else 1.0,
                
                # PlaybackStatus: The current playback state of the session (e.g., Playing, Paused).
                "PlaybackStatus": raw_playback.playback_status.value if (raw_playback and raw_playback.playback_status) else 0,
                
                # PlaybackType: Specifies what type of content the session has (e.g., Music, Video).
                "PlaybackType": raw_playback.playback_type.value if (raw_playback and raw_playback.playback_type) else 0
            }

            # Timeline properties
            # https://learn.microsoft.com/en-us/uwp/api/windows.media.control.globalsystemmediatransportcontrolssessiontimelineproperties?view=winrt-28000
            timeline_data = {
                # EndTime: The end timestamp of the current media item.
                "EndTime": int(raw_timeline.end_time.total_seconds() * 1000) if raw_timeline.end_time else 0,
                
                # LastUpdatedTime: The UTC time at which the timeline properties were last updated.
                "LastUpdatedTime": str(raw_timeline.last_updated_time) if raw_timeline.last_updated_time else None,
                
                # MaxSeekTime: The furthest timestamp at which the content can currently seek to.
                "MaxSeekTime": int(raw_timeline.max_seek_time.total_seconds() * 1000) if raw_timeline.max_seek_time else 0,
                
                # MinSeekTime: The earliest timestamp at which the current media item can currently seek to.
                "MinSeekTime": int(raw_timeline.min_seek_time.total_seconds() * 1000) if raw_timeline.min_seek_time else 0,
                
                # Position: The playback position, current as of LastUpdatedTime.
                "Position": int(raw_timeline.position.total_seconds() * 1000) if raw_timeline.position else 0,
                
                # StartTime: The starting timestamp of the current media item.
                "StartTime": int(raw_timeline.start_time.total_seconds() * 1000) if raw_timeline.start_time else 0,
            }

            # Media properties
            # https://learn.microsoft.com/en-us/uwp/api/windows.media.control.globalsystemmediatransportcontrolssessionmediaproperties?view=winrt-28000
            media_data = {
                # Title: The title of the track.
                "Title": raw_media.title if raw_media else "Unknown",
                
                # Artist: The name of the artist.
                "Artist": raw_media.artist if raw_media else "Unknown",
                
                # AlbumTitle: The title of the album.
                "AlbumTitle": raw_media.album_title if raw_media else "Unknown",
                
                # AlbumArtist: The artist associated with the album.
                "AlbumArtist": raw_media.album_artist if raw_media else "Unknown",
                
                # TrackNumber: The track number within the album.
                "TrackNumber": raw_media.track_number if raw_media else 0,
                
                # AlbumTrackCount: The total number of tracks on the album.
                "AlbumTrackCount": raw_media.album_track_count if raw_media else 0,
                
                # Genres: The list of genres associated with the track.
                "Genres": list(raw_media.genres) if raw_media else [],
                
                # Subtitle: Any subtitle information (common in podcasts/videos).
                "Subtitle": raw_media.subtitle if raw_media else "",
                
                # Thumbnail: Our cached thumbnail representation.
                "Thumbnail": None 
            }

            # Add the album art (i.e. "Thumbnail") as a Base64 string.
            # We will cache this so we don't have to read it every single call.
            # Use the track title and artist as the key -> {title} - {artist}
            
            # Build the key
            title = raw_media.title if raw_media else "Unknown"
            artist = raw_media.artist if raw_media else "Unknown"
            track_key = f"{title} - {artist}"
            
            # Check if the album art is cached.
            # If yes:
            #       - Retrieve it from the cache.
            #       - Add it to the payload
            if app_id in ARTWORK_CACHE and ARTWORK_CACHE[app_id]["track_key"] == track_key:
                media_data["Thumbnail"] = ARTWORK_CACHE[app_id]["base64"]
            
            # If not
            #       - Read the Base64 string
            #       - Cache the Base64 string
            #       - Add it to the payload
            elif raw_media and raw_media.thumbnail:
                try:
                    # Read the Base64 string
                    stream_ref = raw_media.thumbnail
                    stream = await stream_ref.open_read_async()
                    reader = DataReader(stream.get_input_stream_at(0))
                    await reader.load_async(stream.size)
                    buffer = bytearray(stream.size)
                    reader.read_bytes(buffer)
                    
                    img = Image.open(io.BytesIO(buffer))
                    base64_art = f"data:image/png;base64,{base64.b64encode(buffer).decode('utf-8')}"
                    
                    # Cache the Base64 string
                    ARTWORK_CACHE[app_id] = {"track_key": track_key, "base64": base64_art}
                    
                    # Add it to the payload
                    media_data["Thumbnail"] = base64_art
                except Exception:
                    pass

            # Finally, assemble all the data into a session object, and add it to the session list
            sessions_list.append({
                "source_app_id": app_id,
                "playback_info": playback_data,
                "timeline_properties": timeline_data,
                "media_properties": media_data
            })
        
        # Build the final payload
        return {"current_session_id": current_session_id, "sessions": sessions_list}
    except Exception as e:
        return {"current_session_id": None, "sessions": [], "error": str(e)}

@app.route('/now-playing')
def now_playing():
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return jsonify(loop.run_until_complete(get_all_media_info()))
    finally:
        loop.close()

@app.route('/sessions', methods=['GET'])
def get_sessions():
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    
    async def fetch():
        manager = await SMTC.request_async()
        if not manager: return []
        return list(set([s.source_app_user_model_id for s in manager.get_sessions()]))
    
    try:
        sessions = loop.run_until_complete(fetch())
        
        # Wrapped in a <body> tag with a dark background and some padding
        html_list = """
        <body style='background-color: #121212; color: white; font-family: sans-serif; padding: 20px;'>
            <h3 style='margin-top: 0;'>Active Audio Sources:</h3>
            <ul>
        """
        
        if not sessions:
            html_list += "<li style='color: #888;'>No active audio sources found.</li>"
        else:
            for s in sessions:
                html_list += f"<li style='margin-bottom: 8px; font-size: 1.1em;'>{s}</li>"
        
        html_list += "</ul></body>"
        return html_list
        
    except Exception as e:
        return f"<body style='background-color: #121212; color: #ff5555;'>Error: {str(e)}</body>"
    finally:
        loop.close()

if __name__ == '__main__':
    app.run(port=5000, threaded=True)