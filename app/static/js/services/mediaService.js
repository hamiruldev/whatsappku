class MediaService {
    static async uploadFile(file, directory = 'uploads') {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('directory', directory);
            
            const response = await fetch('/api/media/upload', {
                method: 'POST',
                body: formData
            });
            
            return await response.json();
        } catch (error) {
            console.error('Error uploading file:', error);
            throw error;
        }
    }
    
    static async deleteFile(filename, directory = 'uploads') {
        try {
            const response = await fetch(`/api/media/delete/${filename}?directory=${directory}`, {
                method: 'DELETE'
            });
            
            return await response.json();
        } catch (error) {
            console.error('Error deleting file:', error);
            throw error;
        }
    }
    
    static async getFileInfo(filename, directory = 'uploads') {
        try {
            const response = await fetch(`/api/media/info/${filename}?directory=${directory}`);
            return await response.json();
        } catch (error) {
            console.error('Error getting file info:', error);
            throw error;
        }
    }
    
    static async getFileContent(filename, directory = 'uploads') {
        try {
            const response = await fetch(`/api/media/content/${filename}?directory=${directory}`);
            return await response.json();
        } catch (error) {
            console.error('Error getting file content:', error);
            throw error;
        }
    }
    
    static getFileUrl(filename, directory = 'uploads') {
        return `/api/media/${directory}/${filename}`;
    }
}

export default MediaService; 