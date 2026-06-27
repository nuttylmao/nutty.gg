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
        manager = await SMTC.request_async()
        if not manager:
            return {"current_session_id": None, "sessions": []}

        current_focused = manager.get_current_session()
        current_session_id = current_focused.source_app_user_model_id if current_focused else None

        all_sessions = manager.get_sessions()
        sessions_list = []

        for session in all_sessions:
            app_id = session.source_app_user_model_id
            raw_playback = session.get_playback_info()
            raw_timeline = session.get_timeline_properties()
            raw_media = await session.try_get_media_properties_async()

            playback_data = {
                "PlaybackStatus": raw_playback.playback_status.value if (raw_playback and raw_playback.playback_status) else 0,
                "PlaybackType": raw_playback.playback_type.value if (raw_playback and raw_playback.playback_type) else 0,
            }

            timeline_data = {
                "Position": int(raw_timeline.position.total_seconds() * 1000) if raw_timeline.position else 0,
                "EndTime": int(raw_timeline.end_time.total_seconds() * 1000) if raw_timeline.end_time else 0,
                "LastUpdatedTime": str(raw_timeline.last_updated_time) if raw_timeline.last_updated_time else None
            }

            title = raw_media.title if raw_media else "Unknown"
            artist = raw_media.artist if raw_media else "Unknown"
            track_key = f"{title} - {artist}"

            media_data = {"Title": title, "Artist": artist, "Base64Image": None}

            if app_id in ARTWORK_CACHE and ARTWORK_CACHE[app_id]["track_key"] == track_key:
                media_data["Base64Image"] = ARTWORK_CACHE[app_id]["base64"]
            
            elif raw_media and raw_media.thumbnail:
                try:
                    stream_ref = raw_media.thumbnail
                    stream = await stream_ref.open_read_async()
                    reader = DataReader(stream.get_input_stream_at(0))
                    await reader.load_async(stream.size)
                    buffer = bytearray(stream.size)
                    reader.read_bytes(buffer)
                    
                    img = Image.open(io.BytesIO(buffer))
                    base64_art = f"data:image/png;base64,{base64.b64encode(buffer).decode('utf-8')}"
                    
                    ARTWORK_CACHE[app_id] = {"track_key": track_key, "base64": base64_art}
                    media_data["Base64Image"] = base64_art
                except Exception:
                    pass

            sessions_list.append({
                "source_app_id": app_id,
                "playback_info": playback_data,
                "timeline_properties": timeline_data,
                "media_properties": media_data
            })

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