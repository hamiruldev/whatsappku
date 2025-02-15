import os
import json
from flask import current_app
from werkzeug.utils import secure_filename

ALLOWED_EXTENSIONS = {
    'image': {'png', 'jpg', 'jpeg', 'gif'},
    'video': {'mp4', 'webm', 'avi'},
    'audio': {'mp3', 'wav', 'ogg'}
}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in \
           {ext for types in ALLOWED_EXTENSIONS.values() for ext in types}

def get_media_type(filename):
    ext = filename.rsplit('.', 1)[1].lower()
    for media_type, extensions in ALLOWED_EXTENSIONS.items():
        if ext in extensions:
            return media_type
    return 'unknown'

def get_media_tags(media_id):
    """Get tags for a media file from tags.json"""
    tags_file = os.path.join(current_app.root_path, 'static', 'media', 'tags.json')
    if os.path.exists(tags_file):
        with open(tags_file, 'r') as f:
            tags_data = json.load(f)
            return tags_data.get(media_id, [])
    return []

def save_media_tags(media_id, tags):
    """Save tags for a media file to tags.json"""
    tags_file = os.path.join(current_app.root_path, 'static', 'media', 'tags.json')
    tags_data = {}
    
    if os.path.exists(tags_file):
        with open(tags_file, 'r') as f:
            tags_data = json.load(f)
            
    tags_data[media_id] = tags
    
    with open(tags_file, 'w') as f:
        json.dump(tags_data, f) 