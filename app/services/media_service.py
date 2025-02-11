import os
from flask import current_app
from werkzeug.utils import secure_filename
import uuid
import mimetypes
import base64
from io import BytesIO
from synology_api import filestation

class MediaService:
    """Service class for handling media file operations with Synology NAS support"""
    
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'mp4', 'pdf', 'doc', 'docx'}
    
    @staticmethod
    def allowed_file(filename):
        """Check if the file extension is allowed"""
        return '.' in filename and \
            filename.rsplit('.', 1)[1].lower() in MediaService.ALLOWED_EXTENSIONS
    
    @staticmethod
    def get_unique_filename(filename):
        """Generate a unique filename while preserving extension"""
        ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
        return f"{uuid.uuid4()}.{ext}"
    
    @staticmethod
    def get_nas_connection():
        """Create Synology FileStation connection"""
        try:
            nas_config = current_app.config['NAS_CONFIG']
            return filestation.FileStation(
                ip_address=nas_config['server_ip'],
                port=nas_config['port'],
                username=nas_config['username'],
                password=nas_config['password'],
                secure=nas_config['use_https'],
                cert_verify=nas_config['verify_ssl'],
                dsm_version=nas_config.get('dsm_version', 7),
                debug=current_app.debug
            )
        except Exception as e:
            current_app.logger.error(f"Error connecting to Synology NAS: {str(e)}")
            raise

    @classmethod
    def upload_file(cls, file, directory='uploads'):
        """Upload a file to either local storage or NAS"""
        try:
            if not file:
                return False, {'error': 'No file provided'}
                
            if not cls.allowed_file(file.filename):
                return False, {'error': 'File type not allowed'}
            
            filename = cls.get_unique_filename(secure_filename(file.filename))
            
            if current_app.config.get('USE_NAS_STORAGE', False):
                return cls._upload_to_nas(file, filename, directory)
            else:
                return cls._upload_to_local(file, filename, directory)
            
        except Exception as e:
            current_app.logger.error(f"Error uploading file: {str(e)}")
            return False, {'error': str(e)}

    @classmethod
    def _upload_to_nas(cls, file, filename, directory):
        """Upload file to Synology NAS using FileStation API"""
        try:
            fs = cls.get_nas_connection()
            
            # Ensure directory exists
            nas_path = f"{directory}/{filename}"
            parent_dir = os.path.dirname(nas_path)
            if parent_dir:
                fs.create_folder(parent_dir)
            
            # Save file temporarily
            temp_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
            file.save(temp_path)
            
            # Upload to NAS
            result = fs.upload_file(
                dest_path=directory,
                file_path=temp_path,
                overwrite=True
            )
            
            # Clean up temp file
            os.remove(temp_path)
            
            if result.get('success'):
                return True, {
                    'filename': filename,
                    'filepath': nas_path,
                    'url': f"/media/{directory}/{filename}",
                    'mime_type': mimetypes.guess_type(filename)[0],
                    'storage': 'nas'
                }
            else:
                raise Exception(f"Failed to upload to NAS: {result.get('error')}")
            
        except Exception as e:
            current_app.logger.error(f"Error uploading to NAS: {str(e)}")
            return False, {'error': str(e)}

    @classmethod
    def _upload_to_local(cls, file, filename, directory):
        """Upload file to local storage"""
        try:
            # Create upload directory if it doesn't exist
            upload_dir = os.path.join(current_app.config['UPLOAD_FOLDER'], directory)
            os.makedirs(upload_dir, exist_ok=True)
            
            filepath = os.path.join(upload_dir, filename)
            file.save(filepath)
            
            file_info = {
                'filename': filename,
                'filepath': filepath,
                'url': f"/media/{directory}/{filename}",
                'mime_type': mimetypes.guess_type(filepath)[0],
                'storage': 'local'
            }
            
            return True, file_info
            
        except Exception as e:
            current_app.logger.error(f"Error uploading to local storage: {str(e)}")
            return False, {'error': str(e)}
    
    @classmethod
    def get_file_content(cls, filename, directory='uploads'):
        """Get file content from either local storage or NAS"""
        try:
            if current_app.config.get('USE_NAS_STORAGE', False):
                return cls._get_content_from_nas(filename, directory)
            else:
                return cls._get_content_from_local(filename, directory)
                
        except Exception as e:
            current_app.logger.error(f"Error getting file content: {str(e)}")
            return False, {'error': str(e)}
    
    @classmethod
    def _get_content_from_nas(cls, filename, directory):
        """Get file content from NAS via FTP"""
        try:
            ftp = cls.get_ftp_connection()
            
            # Change to target directory
            ftp.cwd(directory)
            
            # Create file-like object to store content
            file_obj = BytesIO()
            
            # Retrieve file
            ftp.retrbinary(f'RETR {filename}', file_obj.write)
            
            # Close connection
            ftp.quit()
            
            # Get content as base64
            file_obj.seek(0)
            encoded = base64.b64encode(file_obj.read()).decode('utf-8')
            
            return True, {
                'filename': filename,
                'content': encoded,
                'mime_type': mimetypes.guess_type(filename)[0]
            }
            
        except Exception as e:
            current_app.logger.error(f"Error getting content from NAS: {str(e)}")
            return False, {'error': str(e)}
    
    @classmethod
    def _get_content_from_local(cls, filename, directory):
        """Get file content from local storage"""
        try:
            filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], directory, filename)
            
            if not os.path.exists(filepath):
                return False, {'error': 'File not found'}
            
            with open(filepath, 'rb') as file:
                content = file.read()
                
            return True, {
                'filename': filename,
                'content': base64.b64encode(content).decode('utf-8'),
                'mime_type': mimetypes.guess_type(filepath)[0]
            }
            
        except Exception as e:
            current_app.logger.error(f"Error getting file content: {str(e)}")
            return False, {'error': str(e)}
    
    @classmethod
    def delete_file(cls, filename, directory='uploads'):
        """Delete a file from storage"""
        try:
            if current_app.config.get('USE_NAS_STORAGE', False):
                return cls._delete_from_nas(filename, directory)
            else:
                return cls._delete_from_local(filename, directory)
                
        except Exception as e:
            current_app.logger.error(f"Error deleting file: {str(e)}")
            return False, {'error': str(e)}

    @classmethod
    def _delete_from_nas(cls, filename, directory):
        """Delete file from NAS using FileStation API"""
        try:
            fs = cls.get_nas_connection()
            
            # Delete file
            result = fs.delete_blocking_function(
                path=f"{directory}/{filename}"
            )
            
            if result.get('success'):
                return True, {'message': 'File deleted successfully'}
            else:
                raise Exception(f"Failed to delete from NAS: {result.get('error')}")
            
        except Exception as e:
            current_app.logger.error(f"Error deleting from NAS: {str(e)}")
            return False, {'error': str(e)}

    @classmethod
    def _delete_from_local(cls, filename, directory):
        """Delete file from local storage"""
        try:
            filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], directory, filename)
            
            if not os.path.exists(filepath):
                return False, {'error': 'File not found'}
            
            os.remove(filepath)
            return True, {'message': 'File deleted successfully'}
            
        except Exception as e:
            current_app.logger.error(f"Error deleting from local storage: {str(e)}")
            return False, {'error': str(e)}
    
    @classmethod
    def get_file_info(cls, filename, directory='uploads'):
        """Get information about a file"""
        try:
            if current_app.config.get('USE_NAS_STORAGE', False):
                return cls._get_info_from_nas(filename, directory)
            else:
                return cls._get_info_from_local(filename, directory)
                
        except Exception as e:
            current_app.logger.error(f"Error getting file info: {str(e)}")
            return False, {'error': str(e)}

    @classmethod
    def _get_info_from_nas(cls, filename, directory):
        """Get file info from NAS using FileStation API"""
        try:
            fs = cls.get_nas_connection()
            
            result = fs.get_file_info(
                path=f"{directory}/{filename}"
            )
            
            if result.get('success'):
                file_info = result['data']['files'][0]
                return True, {
                    'filename': filename,
                    'filepath': f"{directory}/{filename}",
                    'url': f"/media/{directory}/{filename}",
                    'mime_type': mimetypes.guess_type(filename)[0],
                    'size': file_info.get('size'),
                    'created': file_info.get('time.ctime'),
                    'modified': file_info.get('time.mtime'),
                    'storage': 'nas'
                }
            else:
                raise Exception(f"Failed to get info from NAS: {result.get('error')}")
            
        except Exception as e:
            current_app.logger.error(f"Error getting info from NAS: {str(e)}")
            return False, {'error': str(e)}

    @classmethod
    def _get_info_from_local(cls, filename, directory):
        """Get file info from local storage"""
        try:
            filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], directory, filename)
            
            if not os.path.exists(filepath):
                return False, {'error': 'File not found'}
            
            file_info = {
                'filename': filename,
                'filepath': filepath,
                'url': f"/media/{directory}/{filename}",
                'mime_type': mimetypes.guess_type(filepath)[0],
                'size': os.path.getsize(filepath),
                'created': os.path.getctime(filepath),
                'modified': os.path.getmtime(filepath),
                'storage': 'local'
            }
            
            return True, file_info
            
        except Exception as e:
            current_app.logger.error(f"Error getting file info: {str(e)}")
            return False, {'error': str(e)}
    
    @classmethod
    def get_base64_content(cls, filename, directory='uploads'):
        """Get base64 encoded content of a file"""
        try:
            filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], directory, filename)
            
            if not os.path.exists(filepath):
                return False, {'error': 'File not found'}
            
            with open(filepath, 'rb') as file:
                encoded = base64.b64encode(file.read()).decode('utf-8')
                
            return True, {
                'filename': filename,
                'content': encoded,
                'mime_type': mimetypes.guess_type(filepath)[0]
            }
            
        except Exception as e:
            current_app.logger.error(f"Error getting file content: {str(e)}")
            return False, {'error': str(e)} 