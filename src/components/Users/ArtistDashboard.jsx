import { useState } from 'react';
import { storage, db } from '../firebase/firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, arrayUnion } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export default function ArtistDashboard() {
  const [songFile, setSongFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const auth = getAuth();
  const currentUser = auth.currentUser;

  const handleUpload = async () => {
    if (!songFile || !videoFile) {
      setError("Please select both an audio file and a video file.");
      return;
    }

    if (!currentUser) {
      setError("User not authenticated.");
      return;
    }

    setIsUploading(true);
    setError('');
    
    try {
      const songRef = ref(storage, `songs/${Date.now()}_${songFile.name}`);
      const videoRef = ref(storage, `videos/${Date.now()}_${videoFile.name}`);
      
      // Upload both files in parallel
      const [songSnapshot, videoSnapshot] = await Promise.all([
        uploadBytes(songRef, songFile),
        uploadBytes(videoRef, videoFile)
      ]);

      // Get the download URLs
      const [songUrl, videoUrl] = await Promise.all([
        getDownloadURL(songSnapshot.ref),
        getDownloadURL(videoSnapshot.ref)
      ]);

      // Create/update the user's document with the new song info
      await setDoc(doc(db, 'songs', currentUser.uid), {
        songs: arrayUnion({
          title: songFile.name,
          url: songUrl,
          videoUrl,
          createdAt: new Date()
        })
      }, { merge: true }); // This will create the document if it doesn't exist

      alert("Upload successful!");
      setSongFile(null);
      setVideoFile(null);
    } catch (error) {
      console.error("Error uploading files:", error);
      setError(`Failed to upload files: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-gray-900 min-h-screen text-white p-8">
      <div className="max-w-2xl mx-auto bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-3xl font-bold mb-6 text-pink-300">Artist Dashboard</h2>
        
        <div className="mb-8">
          <h3 className="text-2xl font-semibold mb-4 text-pink-200">Upload New Track</h3>
          
          <div className="mb-4">
            <label className="block text-pink-100 mb-2">Audio File:</label>
            <input 
              type="file" 
              accept="audio/*" 
              onChange={(e) => setSongFile(e.target.files[0])}
              className="bg-gray-700 text-white p-2 w-full rounded"
            />
            {songFile && <p className="text-green-400 mt-1">Selected: {songFile.name}</p>}
          </div>
          
          <div className="mb-6">
            <label className="block text-pink-100 mb-2">Video File:</label>
            <input 
              type="file" 
              accept="video/*" 
              onChange={(e) => setVideoFile(e.target.files[0])}
              className="bg-gray-700 text-white p-2 w-full rounded"
            />
            {videoFile && <p className="text-green-400 mt-1">Selected: {videoFile.name}</p>}
          </div>
          
          {error && <p className="text-red-500 mb-4">{error}</p>}
          
          <button 
            onClick={handleUpload}
            disabled={isUploading}
            className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed w-full"
          >
            {isUploading ? 'Uploading...' : 'Upload Track'}
          </button>
        </div>
      </div>
    </div>
  );
}