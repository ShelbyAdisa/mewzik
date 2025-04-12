import { useState, useEffect } from 'react';
import { db } from '../firebase/firebaseConfig';
import { collection, query, getDocs, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export default function ListenerDashboard() {
  const [songs, setSongs] = useState([]);
  const auth = getAuth();
  const currentUser = auth.currentUser; // Ensure this is not null before using

  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const q = query(collection(db, 'songs'));
        const querySnapshot = await getDocs(q);
        setSongs(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error('Error fetching songs:', error);
      }
    };
    fetchSongs();
  }, []);

  const addToFavorites = async (songId) => {
    if (!currentUser) {
      alert('User not authenticated.');
      return;
    }
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        favorites: arrayUnion(songId)
      });
      alert('Song added to favorites!');
    } catch (error) {
      console.error('Error updating favorites:', error);
      alert('Failed to add song to favorites.');
    }
  };

  return (
    <div className="bg-pink-900 min-h-screen text-pink-100 p-8">
      <div className="grid grid-cols-4 gap-4">
        {songs.map(song => (
          <div key={song.id} className="bg-pink-800 p-4 rounded-lg">
            <img src={song.cover} alt={song.title} className="w-full h-48 object-cover rounded" />
            <h3 className="text-xl font-bold mt-2">{song.title}</h3>
            <button 
              onClick={() => addToFavorites(song.id)}
              className="text-pink-400 hover:text-pink-300"
            >
              ♥ Favorite
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
