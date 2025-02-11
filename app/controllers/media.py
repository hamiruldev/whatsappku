from flask import Blueprint, request, jsonify, send_from_directory, current_app
from app.services.media_service import MediaService
import os

media_bp = Blueprint('media', __name__)

@media_bp.route('/upload', methods=['POST'])
def upload_file():
    """Handle file upload"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
        
    file = request.files['file']
    directory = request.form.get('directory', 'uploads')
    
    success, result = MediaService.upload_file(file, directory)
    
    if success:
        return jsonify(result), 200
    return jsonify(result), 400

@media_bp.route('/delete/<filename>', methods=['DELETE'])
def delete_file(filename):
    """Delete a file"""
    directory = request.args.get('directory', 'uploads')
    success, result = MediaService.delete_file(filename, directory)
    
    if success:
        return jsonify(result), 200
    return jsonify(result), 404

@media_bp.route('/info/<filename>', methods=['GET'])
def get_file_info(filename):
    """Get file information"""
    directory = request.args.get('directory', 'uploads')
    success, result = MediaService.get_file_info(filename, directory)
    
    if success:
        return jsonify(result), 200
    return jsonify(result), 404

@media_bp.route('/content/<filename>', methods=['GET'])
def get_file_content(filename):
    """Get file content in base64"""
    directory = request.args.get('directory', 'uploads')
    success, result = MediaService.get_base64_content(filename, directory)
    
    if success:
        return jsonify(result), 200
    return jsonify(result), 404

@media_bp.route('/<directory>/<filename>', methods=['GET'])
def serve_file(directory, filename):
    """Serve the file directly"""
    return send_from_directory(
        os.path.join(current_app.config['UPLOAD_FOLDER'], directory),
        filename
    ) 