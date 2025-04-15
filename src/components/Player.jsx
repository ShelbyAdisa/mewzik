import { useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase/firebaseConfig';

const Player = ({ currentUser }) => {
  const [currentSong, setCurrentSong] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [audio] = useState(new Audio());

  const fetchSongs = async () => {
    const q = query(collection(db, 'songs'), where('isPublic', '==', true));
    const querySnapshot = await getDocs(q);
    // Process songs
  };

  const togglePlay = () => {
    if (currentSong) {
      setPlaying(!playing);
      if (!playing) {
        audio.play();
      } else {
        audio.pause();
      }
    }
  };

  // return (
  //   <div className="bg-black-dark text-white p-4 rounded-lg">
  //     <div className="flex items-center gap-4">
  //       <img 
  //         src={currentSong?.coverUrl} 
  //         alt="Album cover" 
  //         className="w-16 h-16 rounded" 
  //       />
  //       <div>
  //         <h3 className="font-semibold">{currentSong?.title}</h3>
  //         <p className="text-sm text-gray-400">{currentSong?.artist}</p>
  //       </div>
  //       <div className="ml-auto">
  //         <button onClick={togglePlay}>
  //           {playing ? '❚❚' : '▶'}
  //         </button>
  //       </div>
  //     </div>
  //   </div>
  // );
};

export default Player;