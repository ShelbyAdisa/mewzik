import { useState } from 'react';
// import { storage, db } from '../firebase/firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export default function ArtistDashboard() {
  const [songFile, setSongFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const auth = getAuth();
  const currentUser = auth.currentUser;

  const handleUpload = async () => {
    if (!songFile || !videoFile) {
      alert("Please select both an audio file and a video file.");
      return;
    }

    if (!currentUser) {
      alert("User not authenticated.");
      return;
    }

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

      // Update the user's document with the new song info
      await updateDoc(doc(db, 'songs', currentUser.uid), {
        songs: arrayUnion({
          title: songFile.name,
          url: songUrl,
          videoUrl,
          createdAt: new Date()
        })
      });

      alert("Upload successful!");
    } catch (error) {
      console.error("Error uploading files:", error);
      alert("Failed to upload files.");
    }
  };

  return (
    <div className="bg-black min-h-screen text-pink-100 p-8">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold mb-6">Upload New Track</h2>
        <input 
          type="file" 
          accept="audio/mp3" 
          onChange={(e) => setSongFile(e.target.files[0])}
          className="mb-4"
        />
        <input 
          type="file" 
          accept="video/mp4" 
          onChange={(e) => setVideoFile(e.target.files[0])}
          className="mb-4"
        />
        <button 
          onClick={handleUpload}
          className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-2 rounded"
        >
          Upload
        </button>
      </div>
    </div>
  );
}
