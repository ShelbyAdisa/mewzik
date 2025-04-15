// import { useState, useEffect, useRef } from 'react';
// import { db, storage } from '../firebase/firebaseConfig';
// import { collection, query, getDocs, doc, updateDoc, arrayUnion, arrayRemove, setDoc, getDoc } from 'firebase/firestore';
// import { getAuth, updateProfile } from 'firebase/auth';
// import { ref, uploadBytes, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

// export default function ListenerDashboard() {
//   const [songs, setSongs] = useState([]);
//   const [currentSong, setCurrentSong] = useState(null);
//   const [isPlaying, setIsPlaying] = useState(false);
//   const [currentTime, setCurrentTime] = useState(0);
//   const [duration, setDuration] = useState(0);
//   const [activeTab, setActiveTab] = useState("library");
//   const [userFavorites, setUserFavorites] = useState([]);
//   const [userPlaylists, setUserPlaylists] = useState([]);
//   const [newPlaylistName, setNewPlaylistName] = useState("");
//   const [selectedPlaylist, setSelectedPlaylist] = useState(null);
//   const [profileEditMode, setProfileEditMode] = useState(false);
//   const [profileData, setProfileData] = useState({
//     displayName: "",
//     photoURL: "",
//     bio: ""
//   });
//   const [profileImageFile, setProfileImageFile] = useState(null);
//   const [isUploading, setIsUploading] = useState(false);
//   const [uploadProgress, setUploadProgress] = useState(0);
//   const fileInputRef = useRef(null);
  
//   const audioRef = useRef(null);
//   const auth = getAuth();
//   const currentUser = auth.currentUser;

//   useEffect(() => {
//     const fetchSongs = async () => {
//       try {
//         const q = query(collection(db, 'songs'));
//         const querySnapshot = await getDocs(q);
//         setSongs(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
//       } catch (error) {
//         console.error('Error fetching songs:', error);
//       }
//     };
//     fetchSongs();
//   }, []);

//   useEffect(() => {
//     const fetchUserData = async () => {
//       if (!currentUser) return;
      
//       try {
//         // Fetch user document
//         const userDocRef = doc(db, 'users', currentUser.uid);
//         const userDocSnapshot = await getDoc(userDocRef);
//         const userData = userDocSnapshot.exists() ? userDocSnapshot.data() : {};        
//         // Set user favorites
//         setUserFavorites(userData.favorites || []);        
//         // Set profile data
//         setProfileData({
//           displayName: currentUser.displayName || "",
//           photoURL: currentUser.photoURL || "",
//           bio: userData.bio || ""
//         });        
//         // Fetch user playlists
//         const playlistsRef = collection(db, 'users', currentUser.uid, 'playlists');
//         const playlistsSnapshot = await getDocs(query(playlistsRef));
//         const playlists = playlistsSnapshot.docs.map(doc => ({
//           id: doc.id,
//           ...doc.data()
//         }));
//         setUserPlaylists(playlists);
//       } catch (error) {
//         console.error('Error fetching user data:', error);
//       }
//     };    
//     fetchUserData();
//   }, [currentUser]);
//   useEffect(() => {
//     // Reset audio element when changing songs
//     if (currentSong && audioRef.current) {
//       audioRef.current.load();
//       handlePlay();
//     }
//   }, [currentSong]);
//   // Handle file selection
//   const handleFileSelect = (e) => {
//     const file = e.target.files[0];    
//     // Check if file is an image
//     if (file && file.type.match('image.*')) {
//       setProfileImageFile(file);      
//       // Create a preview URL
//       const reader = new FileReader();
//       reader.onload = (e) => {
//         setProfileData(prev => ({
//           ...prev,
//           photoURL: e.target.result // Temporary preview URL
//         }));
//       };
//       reader.readAsDataURL(file);
//     } else if (file) {
//       alert('Please select an image file (JPEG, PNG, etc.)');
//     }
//   };
//   // Upload image to Firebase Storage with progress tracking
//   const uploadProfileImage = async () => {
//     if (!profileImageFile || !currentUser) return null;    
//     setIsUploading(true);
//     setUploadProgress(0);    
//     try {
//       // Create a reference to the storage location
//       const storageRef = ref(storage, `profile_images/${currentUser.uid}/${Date.now()}_${profileImageFile.name}`);      
//       // Create an upload task with proper progress tracking
//       const uploadTask = uploadBytesResumable(storageRef, profileImageFile);      
//       // Set up progress tracking
//       return new Promise((resolve, reject) => {
//         uploadTask.on('state_changed', 
//           (snapshot) => {
//             const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
//             setUploadProgress(Math.round(progress));
//           },
//           (error) => {
//             console.error('Upload error:', error);
//             setIsUploading(false);
//             reject(error);
//           },
//           async () => {
//             // Upload completed successfully, get the download URL
//             try {
//               const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
//               setUploadProgress(100);
//               resolve(downloadURL);
//             } catch (error) {
//               reject(error);
//             }
//           }
//         );
//       });
//     } catch (error) {
//       console.error('Error uploading profile image:', error);
//       setIsUploading(false);
//       alert('Failed to upload profile image.');
//       return null;
//     }
//   };
//   const updateUserProfile = async () => {
//     if (!currentUser) return;    
//     try {
//       // First check if there's a file to upload
//       let photoURL = profileData.photoURL;      
//       if (profileImageFile) {
//         // Upload the file and get the URL
//         try {
//           const uploadedPhotoURL = await uploadProfileImage();
//           if (uploadedPhotoURL) {
//             photoURL = uploadedPhotoURL;
//           }
//         } catch (error) {
//           console.error('Upload failed:', error);
//           alert('Failed to upload image: ' + error.message);
//           setIsUploading(false);
//           return; // Stop if upload failed
//         }
//       }      
//       // Update auth profile
//       await updateProfile(currentUser, {
//         displayName: profileData.displayName,
//         photoURL: photoURL
//       });      
//       // Make sure we have a user document in Firestore
//       const userRef = doc(db, 'users', currentUser.uid);      
//       // Update user document in Firestore
//       await setDoc(userRef, {
//         bio: profileData.bio,
//         photoURL: photoURL,
//         displayName: profileData.displayName,
//         updatedAt: new Date()
//       }, { merge: true }); // Use merge to avoid overwriting other fields      
//       // Update local state with the final URL
//       setProfileData(prev => ({
//         ...prev,
//         photoURL: photoURL
//       }));      
//       setProfileImageFile(null); // Clear the file
//       setProfileEditMode(false);
//       setIsUploading(false);
//       alert('Profile updated successfully!');
//     } catch (error) {
//       console.error('Error updating profile:', error);
//       setIsUploading(false);
//       alert('Failed to update profile: ' + error.message);
//     }
//   };
//   const addToFavorites = async (songId) => {
//     if (!currentUser) {
//       alert('User not authenticated.');
//       return;
//     }    
//     try {
//       const userRef = doc(db, 'users', currentUser.uid);
      
//       // Check if song is already in favorites
//       if (userFavorites.includes(songId)) {
//         // Remove from favorites
//         await updateDoc(userRef, {
//           favorites: arrayRemove(songId)
//         });
//         setUserFavorites(prev => prev.filter(id => id !== songId));
//         alert('Song removed from favorites!');
//       } else {
//         // Add to favorites
//         await updateDoc(userRef, {
//           favorites: arrayUnion(songId)
//         });
//         setUserFavorites(prev => [...prev, songId]);
//         alert('Song added to favorites!');
//       }
//     } catch (error) {
//       console.error('Error updating favorites:', error);
//       alert('Failed to update favorites.');
//     }
//   };
//   const addToPlaylist = async (songId, playlistId) => {
//     if (!currentUser) {
//       alert('User not authenticated.');
//       return;
//     }    
//     try {
//       const playlistRef = doc(db, 'users', currentUser.uid, 'playlists', playlistId);
//       await updateDoc(playlistRef, {
//         songs: arrayUnion(songId)
//       });      
//       // Update local state
//       setUserPlaylists(prev => 
//         prev.map(playlist => 
//           playlist.id === playlistId 
//             ? { ...playlist, songs: [...(playlist.songs || []), songId] }
//             : playlist
//         )
//       );      
//       alert('Song added to playlist!');
//     } catch (error) {
//       console.error('Error adding song to playlist:', error);
//       alert('Failed to add song to playlist.');
//     }
//   };
//   const createPlaylist = async () => {
//     if (!currentUser || !newPlaylistName.trim()) {
//       alert('Please enter a playlist name.');
//       return;
//     }    
//     try {
//       const playlistsRef = collection(db, 'users', currentUser.uid, 'playlists');
//       const newPlaylistRef = doc(playlistsRef);
//       const newPlaylist = {
//         name: newPlaylistName.trim(),
//         createdAt: new Date(),
//         songs: []
//       };      
//       await setDoc(newPlaylistRef, newPlaylist);      
//       // Update local state
//       setUserPlaylists(prev => [...prev, { id: newPlaylistRef.id, ...newPlaylist }]);
//       setNewPlaylistName("");      
//       alert('Playlist created successfully!');
//     } catch (error) {
//       console.error('Error creating playlist:', error);
//       alert('Failed to create playlist.');
//     }
//   };
//   const playSong = (song) => {
//     setCurrentSong(song);
//   };
//   const handlePlay = () => {
//     if (audioRef.current) {
//       if (isPlaying) {
//         audioRef.current.pause();
//       } else {
//         audioRef.current.play();
//       }
//       setIsPlaying(!isPlaying);
//     }
//   };
//   const handleTimeUpdate = () => {
//     if (audioRef.current) {
//       setCurrentTime(audioRef.current.currentTime);
//       setDuration(audioRef.current.duration || 0);
//     }
//   };
//   const handleSeek = (e) => {
//     if (audioRef.current) {
//       const seekTime = parseFloat(e.target.value);
//       audioRef.current.currentTime = seekTime;
//       setCurrentTime(seekTime);
//     }
//   };
//   const formatTime = (time) => {
//     if (isNaN(time)) return "0:00";
//     const minutes = Math.floor(time / 60);
//     const seconds = Math.floor(time % 60).toString().padStart(2, '0');
//     return `${minutes}:${seconds}`;
//   };
//   const handlePrevSong = () => {
//     if (!currentSong || songs.length === 0) return;
    
//     const currentIndex = songs.findIndex(song => song.id === currentSong.id);
//     const prevIndex = currentIndex === 0 ? songs.length - 1 : currentIndex - 1;
//     setCurrentSong(songs[prevIndex]);
//   };
//   const handleNextSong = () => {
//     if (!currentSong || songs.length === 0) return;
    
//     const currentIndex = songs.findIndex(song => song.id === currentSong.id);
//     const nextIndex = currentIndex === songs.length - 1 ? 0 : currentIndex + 1;
//     setCurrentSong(songs[nextIndex]);
//   };
//   // Render the main content based on active tab
//   const renderMainContent = () => {
//     switch (activeTab) {
//       case "profile":
//         return (
//           <div className="bg-gray-800 rounded-lg p-6">
//             <h2 className="text-2xl font-bold mb-6 text-pink-300">Your Profile</h2>            
//             {profileEditMode ? (
//               <div className="space-y-4">
//                 <div>
//                   <label className="block text-sm font-medium mb-1">Display Name</label>
//                   <input 
//                     type="text" 
//                     value={profileData.displayName} 
//                     onChange={(e) => setProfileData({...profileData, displayName: e.target.value})}
//                     className="w-full bg-gray-700 rounded-md px-3 py-2 text-white"
//                   />
//                 </div>                
//                 <div>
//                   <label className="block text-sm font-medium mb-1">Profile Picture</label>
//                   <div className="flex items-center space-x-4">
//                     <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-700">
//                       {profileData.photoURL ? (
//                         <img 
//                           src={profileData.photoURL} 
//                           alt="Profile" 
//                           className="w-full h-full object-cover"
//                         />
//                       ) : (
//                         <div className="w-full h-full flex items-center justify-center">
//                           <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
//                             <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
//                             <circle cx="12" cy="7" r="4"></circle>
//                           </svg>
//                         </div>
//                       )}
//                     </div>                    
//                     <div className="flex-1">
//                       <div className="flex flex-col space-y-2">
//                         <button 
//                           onClick={() => fileInputRef.current.click()}
//                           className="bg-pink-600 px-4 py-2 rounded-md hover:bg-pink-700 text-sm"
//                         >
//                           Choose File
//                         </button>                        
//                         <input
//                           type="file"
//                           ref={fileInputRef}
//                           onChange={handleFileSelect}
//                           accept="image/*"
//                           className="hidden"
//                         />
                        
//                         {profileImageFile && (
//                           <p className="text-xs text-gray-400">
//                             Selected: {profileImageFile.name}
//                           </p>
//                         )}
                        
//                         {/* Add option to use external URL */}
//                         <div className="mt-2">
//                           <label className="block text-xs font-medium mb-1">Or use image URL</label>
//                           <input 
//                             type="text" 
//                             value={profileData.photoURL} 
//                             onChange={(e) => {
//                               setProfileData({...profileData, photoURL: e.target.value});
//                               setProfileImageFile(null); // Clear file selection when URL is entered
//                             }}
//                             placeholder="https://example.com/profile.jpg"
//                             className="w-full bg-gray-700 rounded-md px-3 py-2 text-white text-sm"
//                           />
//                         </div>
//                       </div>
//                     </div>
//                   </div>                  
//                   {/* Upload progress indicator */}
//                   {isUploading && (
//                     <div className="mt-2">
//                       <div className="w-full bg-gray-700 rounded-full h-2.5">
//                         <div 
//                           className="bg-pink-600 h-2.5 rounded-full" 
//                           style={{ width: `${uploadProgress}%` }}
//                         ></div>
//                       </div>
//                       <p className="text-xs text-gray-400 mt-1">Uploading: {uploadProgress}%</p>
//                     </div>
//                   )}
//                 </div>                
//                 <div>
//                   <label className="block text-sm font-medium mb-1">Bio</label>
//                   <textarea 
//                     value={profileData.bio} 
//                     onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
//                     className="w-full bg-gray-700 rounded-md px-3 py-2 text-white h-24"
//                   />
//                 </div>                
//                 <div className="flex space-x-3">
//                   <button 
//                     onClick={updateUserProfile}
//                     disabled={isUploading}
//                     className={`${isUploading ? 'bg-gray-600' : 'bg-pink-600 hover:bg-pink-700'} px-4 py-2 rounded-md`}
//                   >
//                     {isUploading ? 'Uploading...' : 'Save Changes'}
//                   </button>
//                   <button 
//                     onClick={() => {
//                       setProfileEditMode(false);
//                       setProfileImageFile(null);
//                     }}
//                     disabled={isUploading}
//                     className="bg-gray-600 px-4 py-2 rounded-md hover:bg-gray-700"
//                   >
//                     Cancel
//                   </button>
//                 </div>
//               </div>
//             ) : (
//               <div>
//                 <div className="flex items-center mb-6">
//                   <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-700">
//                     {profileData.photoURL ? (
//                       <img 
//                         src={profileData.photoURL} 
//                         alt="Profile" 
//                         className="w-full h-full object-cover"
//                       />
//                     ) : (
//                       <div className="w-full h-full flex items-center justify-center">
//                         <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
//                           <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
//                           <circle cx="12" cy="7" r="4"></circle>
//                         </svg>
//                       </div>
//                     )}
//                   </div>
//                   <div className="ml-6">
//                     <h3 className="text-xl font-bold">{profileData.displayName || "User"}</h3>
//                     <p className="text-gray-400 mt-1">{currentUser?.email}</p>
//                   </div>
//                 </div>               
//                 <div className="mb-6">
//                   <h4 className="text-lg font-semibold mb-2">Bio</h4>
//                   <p className="text-gray-300">{profileData.bio || "No bio yet."}</p>
//                 </div>                
//                 <button 
//                   onClick={() => setProfileEditMode(true)}
//                   className="bg-pink-600 px-4 py-2 rounded-md hover:bg-pink-700"
//                 >
//                   Edit Profile
//                 </button>
//               </div>
//             )}
//           </div>
//         );        
//       case "favorites":
//         const favoriteSongs = songs.filter(song => userFavorites.includes(song.id));
//         return (
//           <div>
//             <h2 className="text-2xl font-bold mb-6 text-pink-300">Your Favorites</h2>
            
//             {favoriteSongs.length === 0 ? (
//               <div className="text-center py-12 bg-gray-800 rounded-lg">
//                 <p className="text-xl">You haven't added any favorites yet.</p>
//               </div>
//             ) : (
//               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
//                 {favoriteSongs.map(song => (
//                   <div key={song.id} className="bg-gray-800 rounded-lg overflow-hidden">
//                     <img 
//                       src={song.cover} 
//                       alt={song.title} 
//                       className="w-full h-48 object-cover cursor-pointer" 
//                       onClick={() => playSong(song)}
//                     />
//                     <div className="p-4">
//                       <h3 className="text-xl font-bold">{song.title}</h3>
//                       <p className="text-gray-400">{song.artistName}</p>
//                       <div className="flex justify-between mt-4">
//                         <button
//                           onClick={() => playSong(song)}
//                           className="text-pink-500 hover:text-pink-400"
//                         >
//                           ▶ Play
//                         </button>
//                         <button
//                           onClick={() => addToFavorites(song.id)}
//                           className="text-pink-500 hover:text-pink-400"
//                         >
//                           ❤️ Remove
//                         </button>
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>
//         );        
//       case "playlists":
//         return (
//           <div>
//             <h2 className="text-2xl font-bold mb-6 text-pink-300">Your Playlists</h2>            
//             {/* Create new playlist */}
//             <div className="bg-gray-800 rounded-lg p-4 mb-6">
//               <h3 className="text-lg font-semibold mb-3">Create New Playlist</h3>
//               <div className="flex space-x-2">
//                 <input 
//                   type="text" 
//                   value={newPlaylistName}
//                   onChange={(e) => setNewPlaylistName(e.target.value)}
//                   placeholder="Playlist name"
//                   className="flex-1 bg-gray-700 rounded-md px-3 py-2 text-white"
//                 />
//                 <button 
//                   onClick={createPlaylist}
//                   className="bg-pink-600 px-4 py-2 rounded-md hover:bg-pink-700"
//                 >
//                   Create
//                 </button>
//               </div>
//             </div>            
//             {/* Playlists list */}
//             {userPlaylists.length === 0 ? (
//               <div className="text-center py-12 bg-gray-800 rounded-lg">
//                 <p className="text-xl">You haven't created any playlists yet.</p>
//               </div>
//             ) : (
//               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//                 {userPlaylists.map(playlist => (
//                   <div 
//                     key={playlist.id} 
//                     className="bg-gray-800 rounded-lg p-4 cursor-pointer hover:bg-gray-700"
//                     onClick={() => setSelectedPlaylist(playlist)}
//                   >
//                     <h3 className="text-xl font-bold">{playlist.name}</h3>
//                     <p className="text-gray-400 mt-1">
//                       {playlist.songs?.length || 0} songs
//                     </p>
//                   </div>
//                 ))}
//               </div>
//             )}            
//             {/* Selected playlist view */}
//             {selectedPlaylist && (
//               <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
//                 <div className="bg-gray-800 rounded-lg w-full max-w-3xl max-h-[80vh] overflow-y-auto">
//                   <div className="p-6">
//                     <div className="flex justify-between items-center mb-6">
//                       <h2 className="text-2xl font-bold text-pink-300">{selectedPlaylist.name}</h2>
//                       <button 
//                         onClick={() => setSelectedPlaylist(null)}
//                         className="text-gray-400 hover:text-white"
//                       >
//                         <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                           <line x1="18" y1="6" x2="6" y2="18"></line>
//                           <line x1="6" y1="6" x2="18" y2="18"></line>
//                         </svg>
//                       </button>
//                     </div>                    
//                     {/* Song list in playlist */}
//                     {(selectedPlaylist.songs?.length === 0 || !selectedPlaylist.songs) ? (
//                       <p className="text-center py-6">This playlist is empty.</p>
//                     ) : (
//                       <div className="space-y-2">
//                         {songs
//                           .filter(song => selectedPlaylist.songs?.includes(song.id))
//                           .map(song => (
//                             <div 
//                               key={song.id}
//                               className="flex items-center p-2 hover:bg-gray-700 rounded-md"
//                             >
//                               <img 
//                                 src={song.cover} 
//                                 alt={song.title}
//                                 className="w-12 h-12 object-cover rounded mr-3"
//                               />
//                               <div className="flex-1">
//                                 <h4 className="font-medium">{song.title}</h4>
//                                 <p className="text-sm text-gray-400">{song.artistName}</p>
//                               </div>
//                               <button
//                                 onClick={() => playSong(song)}
//                                 className="text-white hover:text-pink-400 p-2"
//                               >
//                                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                                   <polygon points="5 3 19 12 5 21 5 3"></polygon>
//                                 </svg>
//                               </button>
//                             </div>
//                           ))}
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               </div>
//             )}
//           </div>
//         );        
//       case "library":
//       default:
//         return (
//           <div>
//             <h2 className="text-2xl font-bold mb-6 text-pink-300">Music Library</h2>
            
//             {/* Song Grid */}
//             {songs.length === 0 ? (
//               <div className="text-center py-12 bg-gray-800 rounded-lg">
//                 <p className="text-xl">No songs found in the library yet.</p>
//               </div>
//             ) : (
//               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
//                 {songs.map(song => (
//                   <div key={song.id} className="bg-gray-800 rounded-lg overflow-hidden">
//                     <img 
//                       src={song.cover} 
//                       alt={song.title} 
//                       className="w-full h-48 object-cover cursor-pointer" 
//                       onClick={() => playSong(song)}
//                     />
//                     <div className="p-4">
//                       <h3 className="text-xl font-bold">{song.title}</h3>
//                       <p className="text-gray-400">{song.artistName}</p>
//                       <div className="flex justify-between mt-4">
//                         <button
//                           onClick={() => playSong(song)}
//                           className="text-pink-500 hover:text-pink-400"
//                         >
//                           ▶ Play
//                         </button>
//                         <div className="relative group">
//                           <button
//                             className="text-pink-500 hover:text-pink-400"
//                           >
//                             ⋯ More
//                           </button>
//                           <div className="absolute right-0 mt-2 w-48 bg-gray-900 rounded-md shadow-lg py-1 z-10 hidden group-hover:block">
//                             <button
//                               onClick={() => addToFavorites(song.id)}
//                               className="block w-full text-left px-4 py-2 hover:bg-gray-800"
//                             >
//                               {userFavorites.includes(song.id) ? '❤️ Remove from Favorites' : '♡ Add to Favorites'}
//                             </button>
//                             <div className="border-t border-gray-700 my-1"></div>
//                             <div className="px-4 py-1 text-xs text-gray-400">Add to playlist:</div>
//                             {userPlaylists.map(playlist => (
//                               <button
//                                 key={playlist.id}
//                                 onClick={(e) => {
//                                   e.stopPropagation();
//                                   addToPlaylist(song.id, playlist.id);
//                                 }}
//                                 className="block w-full text-left px-4 py-2 hover:bg-gray-800 truncate"
//                               >
//                                 {playlist.name}
//                               </button>
//                             ))}
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>
//         );
//     }
//   };
//   return (
//     <div className="bg-gray-900 min-h-screen text-white flex">
//       {/* Sidebar */}
//       <div className="w-64 bg-gray-800 border-r border-gray-700 p-6 hidden md:block">
//         <div className="mb-8">
//           <h1 className="text-2xl font-bold text-pink-300">Harmony</h1>
//         </div>        
//         {/* User info mini */}
//         {currentUser && (
//           <div className="flex items-center mb-8 p-2 rounded-lg bg-gray-900">
//             <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-700">
//               {profileData.photoURL ? (
//                 <img 
//                   src={profileData.photoURL} 
//                   alt="Profile" 
//                   className="w-full h-full object-cover"
//                 />
//               ) : (
                
//                   <div className="w-full h-full flex items-center justify-center">
//                   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
//                     <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
//                     <circle cx="12" cy="7" r="4"></circle>
//                   </svg>
//                 </div>
//               )}
//             </div>
//             <div className="ml-3">
//               <p className="font-medium truncate">{profileData.displayName || "User"}</p>
//               <p className="text-xs text-gray-400 truncate">{currentUser?.email}</p>
//             </div>
//           </div>
//         )}        
//         {/* Navigation */}
//         <nav className="space-y-2">
//           <button 
//             onClick={() => setActiveTab("library")}
//             className={`w-full flex items-center px-3 py-2 rounded-md transition ${activeTab === "library" ? "bg-pink-600" : "hover:bg-gray-700"}`}
//           >
//             <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3">
//               <circle cx="12" cy="12" r="10"></circle>
//               <circle cx="12" cy="12" r="3"></circle>
//             </svg>
//             Library
//           </button>
          
//           <button 
//             onClick={() => setActiveTab("favorites")}
//             className={`w-full flex items-center px-3 py-2 rounded-md transition ${activeTab === "favorites" ? "bg-pink-600" : "hover:bg-gray-700"}`}
//           >
//             <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3">
//               <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
//             </svg>
//             Favorites
//           </button>
          
//           <button 
//             onClick={() => setActiveTab("playlists")}
//             className={`w-full flex items-center px-3 py-2 rounded-md transition ${activeTab === "playlists" ? "bg-pink-600" : "hover:bg-gray-700"}`}
//           >
//             <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3">
//               <line x1="8" y1="6" x2="21" y2="6"></line>
//               <line x1="8" y1="12" x2="21" y2="12"></line>
//               <line x1="8" y1="18" x2="21" y2="18"></line>
//               <line x1="3" y1="6" x2="3.01" y2="6"></line>
//               <line x1="3" y1="12" x2="3.01" y2="12"></line>
//               <line x1="3" y1="18" x2="3.01" y2="18"></line>
//             </svg>
//             Playlists
//           </button>          
//           <button 
//             onClick={() => setActiveTab("profile")}
//             className={`w-full flex items-center px-3 py-2 rounded-md transition ${activeTab === "profile" ? "bg-pink-600" : "hover:bg-gray-700"}`}
//           >
//             <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3">
//               <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
//               <circle cx="12" cy="7" r="4"></circle>
//             </svg>
//             Profile
//           </button>
//         </nav>
//       </div>
      
//       {/* Mobile top bar - only visible on small screens */}
//       <div className="md:hidden fixed top-0 inset-x-0 bg-gray-800 border-b border-gray-700 p-4">
//         <div className="flex justify-between items-center">
//           <h1 className="text-xl font-bold text-pink-300">Harmony</h1>
//           <button
//             className="text-gray-400 hover:text-white"
//           >
//             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//               <line x1="3" y1="12" x2="21" y2="12"></line>
//               <line x1="3" y1="6" x2="21" y2="6"></line>
//               <line x1="3" y1="18" x2="21" y2="18"></line>
//             </svg>
//           </button>
//         </div>
//       </div>
      
//       {/* Mobile navigation - bottom tabs */}
//       <div className="md:hidden fixed bottom-0 inset-x-0 bg-gray-800 border-t border-gray-700 flex justify-around">
//         <button
//           onClick={() => setActiveTab("library")}
//           className={`flex-1 flex flex-col items-center py-3 ${activeTab === "library" ? "text-pink-500" : "text-gray-400"}`}
//         >
//           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//             <circle cx="12" cy="12" r="10"></circle>
//             <circle cx="12" cy="12" r="3"></circle>
//           </svg>
//           <span className="text-xs mt-1">Library</span>
//         </button>
        
//         <button
//           onClick={() => setActiveTab("favorites")}
//           className={`flex-1 flex flex-col items-center py-3 ${activeTab === "favorites" ? "text-pink-500" : "text-gray-400"}`}
//         >
//           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//             <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
//           </svg>
//           <span className="text-xs mt-1">Favorites</span>
//         </button>
        
//         <button
//           onClick={() => setActiveTab("playlists")}
//           className={`flex-1 flex flex-col items-center py-3 ${activeTab === "playlists" ? "text-pink-500" : "text-gray-400"}`}
//         >
//           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//             <line x1="8" y1="6" x2="21" y2="6"></line>
//             <line x1="8" y1="12" x2="21" y2="12"></line>
//             <line x1="8" y1="18" x2="21" y2="18"></line>
//             <line x1="3" y1="6" x2="3.01" y2="6"></line>
//             <line x1="3" y1="12" x2="3.01" y2="12"></line>
//             <line x1="3" y1="18" x2="3.01" y2="18"></line>
//           </svg>
//           <span className="text-xs mt-1">Playlists</span>
//         </button>
        
//         <button
//           onClick={() => setActiveTab("profile")}
//           className={`flex-1 flex flex-col items-center py-3 ${activeTab === "profile" ? "text-pink-500" : "text-gray-400"}`}
//         >
//           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//             <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
//             <circle cx="12" cy="7" r="4"></circle>
//           </svg>
//           <span className="text-xs mt-1">Profile</span>
//         </button>
//       </div>
      
//       {/* Main content area */}
//       <div className="flex-1 p-6 md:p-8 overflow-y-auto mb-16 md:mb-24 mt-14 md:mt-0">
//         {renderMainContent()}
//       </div>
      
//       {/* Audio player - fixed to bottom */}
//       <div className={`fixed bottom-16 md:bottom-0 inset-x-0 bg-gray-800 border-t border-gray-700 p-4 ${currentSong ? 'block' : 'hidden'}`}>
//         <div className="container mx-auto">
//           <div className="flex flex-col md:flex-row items-center">
//             {/* Song info */}
//             <div className="flex items-center mb-4 md:mb-0">
//               {currentSong && (
//                 <>
//                   <img 
//                     src={currentSong.cover} 
//                     alt={currentSong.title} 
//                     className="w-12 h-12 object-cover rounded mr-3"
//                   />
//                   <div>
//                     <h3 className="font-bold">{currentSong.title}</h3>
//                     <p className="text-sm text-gray-400">{currentSong.artistName}</p>
//                   </div>
//                 </>
//               )}
//             </div>
            
//             {/* Controls and progress bar */}
//             <div className="flex-1 mx-0 md:mx-10">
//               <div className="flex justify-center items-center space-x-4 mb-2">
//                 <button 
//                   onClick={handlePrevSong}
//                   className="text-gray-300 hover:text-white"
//                 >
//                   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                     <polygon points="19 20 9 12 19 4 19 20"></polygon>
//                     <line x1="5" y1="19" x2="5" y2="5"></line>
//                   </svg>
//                 </button>
                
//                 <button 
//                   onClick={handlePlay}
//                   className="bg-pink-600 rounded-full p-2 text-white hover:bg-pink-700"
//                 >
//                   {isPlaying ? (
//                     <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                       <rect x="6" y="4" width="4" height="16"></rect>
//                       <rect x="14" y="4" width="4" height="16"></rect>
//                     </svg>
//                   ) : (
//                     <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                       <polygon points="5 3 19 12 5 21 5 3"></polygon>
//                     </svg>
//                   )}
//                 </button>
                
//                 <button 
//                   onClick={handleNextSong}
//                   className="text-gray-300 hover:text-white"
//                 >
//                   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                     <polygon points="5 4 15 12 5 20 5 4"></polygon>
//                     <line x1="19" y1="5" x2="19" y2="19"></line>
//                   </svg>
//                 </button>
//               </div>
              
//               <div className="flex items-center space-x-3">
//                 <span className="text-xs text-gray-400 w-10">{formatTime(currentTime)}</span>
//                 <input 
//                   type="range" 
//                   min="0" 
//                   max={duration || 0} 
//                   value={currentTime}
//                   onChange={handleSeek}
//                   className="flex-1 h-1 bg-gray-700 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-pink-500 cursor-pointer"
//                 />
//                 <span className="text-xs text-gray-400 w-10">{formatTime(duration)}</span>
//               </div>
//             </div>
            
//             {/* Volume control - hidden on mobile */}
//             <div className="hidden md:flex items-center space-x-2">
//               <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                 <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
//                 <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
//                 <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
//               </svg>
//               <input 
//                 type="range" 
//                 min="0" 
//                 max="1" 
//                 step="0.01"
//                 defaultValue="0.7"
//                 onChange={(e) => {
//                   if (audioRef.current) {
//                     audioRef.current.volume = parseFloat(e.target.value);
//                   }
//                 }}
//                 className="w-20 h-1 bg-gray-700 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-pink-500 cursor-pointer"
//               />
//             </div>
//           </div>
//         </div>
        
//         {/* Hidden audio element */}
//         <audio
//           ref={audioRef}
//           src={currentSong?.audioUrl}
//           onTimeUpdate={handleTimeUpdate}
//           onEnded={handleNextSong}
//           onLoadedMetadata={() => {
//             if (audioRef.current) {
//               setDuration(audioRef.current.duration);
//             }
//           }}
//         />
//       </div>
//     </div>
//   );
// }

import { useState, useEffect, useRef } from 'react';
import { db } from '../firebase/firebaseConfig';
import { collection, getDocs, query, where, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { getAuth, updateProfile, signOut } from 'firebase/auth';
import { 
  Music, 
  User, 
  Search, 
  Home, 
  Library, 
  Heart, 
  ListMusic, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  Clock, 
  PlusCircle, 
  Edit, 
  Trash2, 
  X, 
  Camera, 
  Save, 
  CheckCircle, 
  LogOut, 
  Shuffle,
  Repeat,
  List
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ListenerDashboard() {
  // User state
  const [currentUser, setCurrentUser] = useState(null);
  const [userName, setUserName] = useState('');
  const [userBio, setUserBio] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [profileImageUrl, setProfileImageUrl] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileUpdateSuccess, setProfileUpdateSuccess] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // Dashboard navigation
  const [activeSection, setActiveSection] = useState('home'); // 'home', 'library', 'playlists', 'favorites', 'profile'
  const [activeSidebarItem, setActiveSidebarItem] = useState('home');
  
  // Music library state
  const [allSongs, setAllSongs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredSongs, setFilteredSongs] = useState([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState([]);
  const [favoriteSongs, setFavoriteSongs] = useState([]);
  const [queue, setQueue] = useState([]);
  const [error, setError] = useState('');
  
  // Music player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  
  // Playlist state
  const [playlists, setPlaylists] = useState([]);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteType, setDeleteType] = useState(''); // 'playlist', 'song'
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);
  const [songToAdd, setSongToAdd] = useState(null);
  
  const audioRef = useRef(null);
  const progressRef = useRef(null);
  const auth = getAuth();
  const navigate = useNavigate();
  const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dcvnqtz70/upload";
  const UPLOAD_PRESET = "audiofiles";

  useEffect(() => {
    // Check if user is authenticated
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUser(user);
        setUserName(user.displayName || '');
        setProfileImageUrl(user.photoURL || null);
        
        // Fetch user profile data
        fetchUserProfile(user);
        
        // Fetch songs, playlists, favorites
        fetchAllSongs();
        fetchUserPlaylists(user.uid);
        fetchFavoriteSongs(user.uid);
        fetchRecentlyPlayed(user.uid);
      } else {
        // Redirect to login if not authenticated
        navigate('/login');
      }
    });
    
    return () => unsubscribe();
  }, [auth, navigate]);
  
  // Apply search filter when searchQuery changes
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredSongs(allSongs);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = allSongs.filter(song => 
        song.title.toLowerCase().includes(query) || 
        song.artistName.toLowerCase().includes(query)
      );
      setFilteredSongs(filtered);
    }
  }, [searchQuery, allSongs]);
  
  // Set up audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    
    if (!audio) return;
    
    const updateProgress = () => {
      setCurrentTime(audio.currentTime);
      setDuration(audio.duration);
    };
    
    const songEnded = () => {
      if (repeat) {
        audio.currentTime = 0;
        audio.play();
      } else if (queue.length > 0) {
        playNextSong();
      } else {
        setIsPlaying(false);
      }
    };
    
    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('loadedmetadata', updateProgress);
    audio.addEventListener('ended', songEnded);
    
    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('loadedmetadata', updateProgress);
      audio.removeEventListener('ended', songEnded);
    };
  }, [repeat, queue]);
  
  // Handle play/pause
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(error => {
          console.error("Error playing audio:", error);
          setIsPlaying(false);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentSong]);
  
  // Handle volume change
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);
  
  const fetchUserProfile = async (user) => {
    try {
      const userProfilesRef = collection(db, 'userProfiles');
      const q = query(userProfilesRef, where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        setUserBio(userData.bio || '');
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };
  
  const fetchAllSongs = async () => {
    try {
      const songsQuery = query(collection(db, 'songs'));
      const querySnapshot = await getDocs(songsQuery);
      const songsList = [];
      
      querySnapshot.forEach((doc) => {
        songsList.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setAllSongs(songsList);
      setFilteredSongs(songsList);
    } catch (error) {
      console.error("Error fetching songs:", error);
      setError("Failed to load songs. Please try again later.");
    }
  };
  
  const fetchUserPlaylists = async (userId) => {
    try {
      const playlistsQuery = query(collection(db, 'playlists'), where('userId', '==', userId));
      const querySnapshot = await getDocs(playlistsQuery);
      const playlistsList = [];
      
      querySnapshot.forEach((doc) => {
        playlistsList.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setPlaylists(playlistsList);
    } catch (error) {
      console.error("Error fetching playlists:", error);
    }
  };
  
  const fetchFavoriteSongs = async (userId) => {
    try {
      const favoritesQuery = query(collection(db, 'favorites'), where('userId', '==', userId));
      const querySnapshot = await getDocs(favoritesQuery);
      const favoritesList = [];
      const favoriteIds = [];
      
      querySnapshot.forEach((doc) => {
        favoriteIds.push(doc.data().songId);
        favoritesList.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // Fetch the actual song data for favorites
      const songs = await Promise.all(
        favoriteIds.map(async (songId) => {
          const songDoc = await getDocs(query(collection(db, 'songs'), where('id', '==', songId)));
          if (!songDoc.empty) {
            return {
              id: songId,
              ...songDoc.docs[0].data()
            };
          }
          return null;
        })
      );
      
      setFavoriteSongs(songs.filter(song => song !== null));
    } catch (error) {
      console.error("Error fetching favorites:", error);
    }
  };
  
  const fetchRecentlyPlayed = async (userId) => {
    try {
      const recentPlayedQuery = query(
        collection(db, 'recentlyPlayed'), 
        where('userId', '==', userId)
      );
      const querySnapshot = await getDocs(recentPlayedQuery);
      const recentList = [];
      
      querySnapshot.forEach((doc) => {
        recentList.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // Sort by most recently played
      recentList.sort((a, b) => b.playedAt.toDate() - a.playedAt.toDate());
      
      // Get the song details
      const recentSongs = await Promise.all(
        recentList.slice(0, 10).map(async (item) => {
          const songDoc = await getDocs(query(collection(db, 'songs'), where('id', '==', item.songId)));
          if (!songDoc.empty) {
            return {
              id: item.songId,
              ...songDoc.docs[0].data(),
              lastPlayed: item.playedAt.toDate()
            };
          }
          return null;
        })
      );
      
      setRecentlyPlayed(recentSongs.filter(song => song !== null));
    } catch (error) {
      console.error("Error fetching recently played:", error);
    }
  };
  
  const playSong = async (song) => {
    try {
      // If this is a different song from what's currently playing
      if (!currentSong || currentSong.id !== song.id) {
        setCurrentSong(song);
        
        // Add to recently played
        const recentlyPlayedRef = collection(db, 'recentlyPlayed');
        await addDoc(recentlyPlayedRef, {
          userId: currentUser.uid,
          songId: song.id,
          playedAt: new Date()
        });
        
        // Refresh recently played
        await fetchRecentlyPlayed(currentUser.uid);
      }
      
      setIsPlaying(true);
    } catch (error) {
      console.error("Error playing song:", error);
    }
  };
  
  const togglePlayPause = () => {
    if (currentSong) {
      setIsPlaying(!isPlaying);
    } else if (allSongs.length > 0) {
      // If no song is selected, play the first song
      playSong(allSongs[0]);
    }
  };
  
  const playNextSong = () => {
    if (!currentSong) return;
    
    if (queue.length > 0) {
      // Play from queue
      const nextSong = queue[0];
      const updatedQueue = queue.slice(1);
      setQueue(updatedQueue);
      playSong(nextSong);
    } else {
      // Play next song in the current list
      const currentList = filteredSongs.length > 0 ? filteredSongs : allSongs;
      const currentIndex = currentList.findIndex(song => song.id === currentSong.id);
      
      if (currentIndex >= 0 && currentIndex < currentList.length - 1) {
        playSong(currentList[currentIndex + 1]);
      } else if (currentList.length > 0 && repeat) {
        // If at the end of the list and repeat is on, go back to the first song
        playSong(currentList[0]);
      }
    }
  };
  
  const playPreviousSong = () => {
    if (!currentSong) return;
    
    // If we're more than 3 seconds into the song, restart it instead of going to previous
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      return;
    }
    
    const currentList = filteredSongs.length > 0 ? filteredSongs : allSongs;
    const currentIndex = currentList.findIndex(song => song.id === currentSong.id);
    
    if (currentIndex > 0) {
      playSong(currentList[currentIndex - 1]);
    } else if (currentList.length > 0 && repeat) {
      // If at the beginning of the list and repeat is on, go to the last song
      playSong(currentList[currentList.length - 1]);
    }
  };
  
  const addToQueue = (song) => {
    setQueue([...queue, song]);
  };
  
  const removeFromQueue = (index) => {
    const updatedQueue = [...queue];
    updatedQueue.splice(index, 1);
    setQueue(updatedQueue);
  };
  
  const handleProgressChange = (e) => {
    const newTime = (e.target.value / 100) * duration;
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };
  
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };
  
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };
  
  const toggleShuffle = () => {
    setShuffle(!shuffle);
  };
  
  const toggleRepeat = () => {
    setRepeat(!repeat);
  };
  
  const formatTime = (time) => {
    if (isNaN(time)) return "0:00";
    
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  const toggleFavorite = async (song) => {
    try {
      // Check if song is already in favorites
      const isFavorite = favoriteSongs.some(fav => fav.id === song.id);
      
      if (isFavorite) {
        // Remove from favorites
        const favoriteQuery = query(
          collection(db, 'favorites'),
          where('userId', '==', currentUser.uid),
          where('songId', '==', song.id)
        );
        
        const querySnapshot = await getDocs(favoriteQuery);
        if (!querySnapshot.empty) {
          await deleteDoc(doc(db, 'favorites', querySnapshot.docs[0].id));
          
          // Update state
          setFavoriteSongs(favoriteSongs.filter(fav => fav.id !== song.id));
        }
      } else {
        // Add to favorites
        await addDoc(collection(db, 'favorites'), {
          userId: currentUser.uid,
          songId: song.id,
          addedAt: new Date()
        });
        
        // Update state
        setFavoriteSongs([...favoriteSongs, song]);
      }
    } catch (error) {
      console.error("Error updating favorites:", error);
      setError("Failed to update favorites. Please try again.");
    }
  };
  
  const isFavorite = (songId) => {
    return favoriteSongs.some(song => song.id === songId);
  };
  
  const createNewPlaylist = async () => {
    if (!newPlaylistName.trim()) {
      setError("Please enter a playlist name");
      return;
    }
    
    try {
      const playlistRef = await addDoc(collection(db, 'playlists'), {
        name: newPlaylistName,
        userId: currentUser.uid,
        songs: [],
        createdAt: new Date()
      });
      
      // Add new playlist to state
      const newPlaylist = {
        id: playlistRef.id,
        name: newPlaylistName,
        userId: currentUser.uid,
        songs: [],
        createdAt: new Date()
      };
      
      setPlaylists([...playlists, newPlaylist]);
      setNewPlaylistName('');
      setShowCreatePlaylist(false);
    } catch (error) {
      console.error("Error creating playlist:", error);
      setError("Failed to create playlist. Please try again.");
    }
  };
  
  const deletePlaylist = async () => {
    if (!itemToDelete) return;
    
    try {
      await deleteDoc(doc(db, 'playlists', itemToDelete.id));
      setPlaylists(playlists.filter(playlist => playlist.id !== itemToDelete.id));
      setShowDeleteConfirm(false);
      setItemToDelete(null);
    } catch (error) {
      console.error("Error deleting playlist:", error);
      setError("Failed to delete playlist. Please try again.");
    }
  };
  
  const addSongToPlaylist = async (playlistId) => {
    if (!songToAdd || !playlistId) return;
    
    try {
      const playlistRef = doc(db, 'playlists', playlistId);
      const playlist = playlists.find(p => p.id === playlistId);
      
      if (!playlist) return;
      
      // Add song to playlist's songs array
      const updatedSongs = [...(playlist.songs || []), songToAdd.id];
      
      await updateDoc(playlistRef, {
        songs: updatedSongs
      });
      
      // Update state
      setPlaylists(playlists.map(p => 
        p.id === playlistId 
          ? { ...p, songs: updatedSongs }
          : p
      ));
      
      setShowAddToPlaylist(false);
      setSongToAdd(null);
    } catch (error) {
      console.error("Error adding song to playlist:", error);
      setError("Failed to add song to playlist. Please try again.");
    }
  };
  
  const removeSongFromPlaylist = async (playlistId, songId) => {
    try {
      const playlistRef = doc(db, 'playlists', playlistId);
      const playlist = playlists.find(p => p.id === playlistId);
      
      if (!playlist) return;
      
      // Remove song from playlist's songs array
      const updatedSongs = (playlist.songs || []).filter(id => id !== songId);
      
      await updateDoc(playlistRef, {
        songs: updatedSongs
      });
      
      // Update state
      setPlaylists(playlists.map(p => 
        p.id === playlistId 
          ? { ...p, songs: updatedSongs }
          : p
      ));
    } catch (error) {
      console.error("Error removing song from playlist:", error);
      setError("Failed to remove song from playlist. Please try again.");
    }
  };
  
  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);
    const response = await fetch(CLOUDINARY_URL, {
      method: "POST",
      body: formData
    });
    const data = await response.json();
    return data.secure_url;
  };
  
  const updateUserProfile = async () => {
    if (!currentUser) return;
    
    setUpdateLoading(true);
    try {
      let photoURL = currentUser.photoURL;
      
      // Upload new profile image if selected
      if (profileImage) {
        photoURL = await uploadToCloudinary(profileImage);
      }
      
      // Update Firebase Auth profile
      await updateProfile(currentUser, {
        displayName: userName,
        photoURL: photoURL
      });
      
      // Store additional profile data in Firestore
      const userProfilesRef = collection(db, 'userProfiles');
      const q = query(userProfilesRef, where('userId', '==', currentUser.uid));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        // Create new profile document
        await addDoc(userProfilesRef, {
          userId: currentUser.uid,
          bio: userBio,
          createdAt: new Date()
        });
      } else {
        // Update existing profile document
        const docRef = doc(db, 'userProfiles', querySnapshot.docs[0].id);
        await updateDoc(docRef, {
          bio: userBio,
          updatedAt: new Date()
        });
      }
      
      // Set success message
      setProfileUpdateSuccess(true);
      setTimeout(() => setProfileUpdateSuccess(false), 3000);
      
      // Exit edit mode
      setEditingProfile(false);
      
      // Update profile image in state
      if (photoURL) {
        setProfileImageUrl(photoURL);
      }
      
      // Update current user state
      setCurrentUser({
        ...currentUser,
        displayName: userName,
        photoURL: photoURL
      });
      
    } catch (error) {
      console.error("Error updating profile:", error);
      setError(`Failed to update profile: ${error.message}`);
    } finally {
      setUpdateLoading(false);
    }
  };
  
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await signOut(auth);
      // Redirect to home page
      navigate('/');
    } catch (error) {
      console.error("Error signing out:", error);
      setError("Failed to log out. Please try again.");
      setIsLoggingOut(false);
    }
  };
  
  const viewPlaylist = (playlist) => {
    setSelectedPlaylist(playlist);
    setActiveSection('playlist-detail');
  };
  
  return (
    <div className="flex flex-col h-screen bg-black text-white">
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-pink-400 flex items-center">
              <Music className="mr-2" /> Music App
            </h1>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <nav className="px-4 py-2">
              <ul>
                <li>
                  <button 
                    onClick={() => {setActiveSection('home'); setActiveSidebarItem('home');}}
                    className={`flex items-center w-full text-left px-4 py-3 rounded-lg mb-1 ${activeSidebarItem === 'home' ? 'bg-pink-600' : 'hover:bg-gray-800'}`}
                  >
                    <Home className="mr-3" size={18} />
                    <span>Home</span>
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => {setActiveSection('search'); setActiveSidebarItem('search');}}
                    className={`flex items-center w-full text-left px-4 py-3 rounded-lg mb-1 ${activeSidebarItem === 'search' ? 'bg-pink-600' : 'hover:bg-gray-800'}`}
                  >
                    <Search className="mr-3" size={18} />
                    <span>Search</span>
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => {setActiveSection('library'); setActiveSidebarItem('library');}}
                    className={`flex items-center w-full text-left px-4 py-3 rounded-lg mb-1 ${activeSidebarItem === 'library' ? 'bg-pink-600' : 'hover:bg-gray-800'}`}
                  >
                    <Library className="mr-3" size={18} />
                    <span>Library</span>
                  </button>
                </li>
              </ul>
            </nav>
            
            <div className="px-4 py-2 mt-4">
              <h3 className="px-4 text-sm font-semibold text-gray-400 uppercase mb-2">Your Music</h3>
              <ul>
                <li>
                  <button 
                    onClick={() => {setActiveSection('favorites'); setActiveSidebarItem('favorites');}}
                    className={`flex items-center w-full text-left px-4 py-3 rounded-lg mb-1 ${activeSidebarItem === 'favorites' ? 'bg-pink-600' : 'hover:bg-gray-800'}`}
                  >
                    <Heart className="mr-3" size={18} />
                    <span>Favorites</span>
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => {setActiveSection('playlists'); setActiveSidebarItem('playlists');}}
                    className={`flex items-center w-full text-left px-4 py-3 rounded-lg mb-1 ${activeSidebarItem === 'playlists' ? 'bg-pink-600' : 'hover:bg-gray-800'}`}
                  >
                    <ListMusic className="mr-3" size={18} />
                    <span>Playlists</span>
                  </button>
                </li>
                <button 
                  onClick={() => setShowQueue(!showQueue)}
                  className={`flex items-center w-full text-left px-4 py-3 rounded-lg mb-1 ${showQueue ? 'bg-pink-600' : 'hover:bg-gray-800'}`}
                >
                  <List className="mr-3" size={18} />
                  <span>Queue</span>
                </button>
              </ul>
              
              {/* Playlists List */}
              {playlists.length > 0 && (
                <div className="mt-4">
                  <h3 className="px-4 text-sm font-semibold text-gray-400 uppercase mb-2">Your Playlists</h3>
                  <ul className="max-h-48 overflow-y-auto">
                    {playlists.map((playlist) => (
                      <li key={playlist.id}>
                        <button
                          onClick={() => viewPlaylist(playlist)}
                          className={`flex items-center w-full text-left px-4 py-2 rounded-lg mb-1 text-sm hover:bg-gray-800 truncate`}
                        >
                          {playlist.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Create Playlist Button */}
              <button 
                onClick={() => setShowCreatePlaylist(true)}
                className="flex items-center w-full text-left px-4 py-3 mt-2 text-pink-400 hover:text-pink-300"
              >
                <PlusCircle className="mr-3" size={18} />
                <span>Create Playlist</span>
              </button>
            </div>
          </div>
          
          <div className="p-4 border-t border-gray-800">
            <button 
              onClick={() => {setActiveSection('profile'); setActiveSidebarItem('profile');}}
              className={`flex items-center w-full px-4 py-3 rounded-lg ${activeSidebarItem === 'profile' ? 'bg-gray-800' : 'hover:bg-gray-800'}`}
            >
              <div className="w-10 h-10 rounded-full bg-pink-500 flex items-center justify-center mr-3 overflow-hidden">
                {profileImageUrl ? (
                  <img src={profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span>{userName ? userName.charAt(0).toUpperCase() : "U"}</span>
                )}
              </div>
              <div>
                <div className="font-medium">{userName || 'Listener'}</div>
                <div className="text-sm text-gray-400">View Profile</div>
              </div>
            </button>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-900 to-black">
          {/* Search Header */}
          {activeSection !== 'profile' && (
            <div className="sticky top-0 bg-gray-900 bg-opacity-90 backdrop-blur-lg p-4 z-10">
              <div className="flex items-center">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search for songs, artists..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-gray-800 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                
                
                 {currentUser && (
                  <div className="ml-4 flex items-center">
                    <button 
                      onClick={() => {setActiveSection('profile'), setActiveSidebarItem('profile');}}
                      className="flex items-center"
                    >
                      <div className="w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center overflow-hidden">
                        {profileImageUrl ? (
                          <img src={profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <span>{userName ? userName.charAt(0).toUpperCase() : "U"}</span>
                        )}
                      </div>
                      <span className="ml-2 mr-2">{userName || 'Listener'}</span>
                    </button>
                    <button 
                      onClick={handleLogout}
                      className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-800"
                      disabled={isLoggingOut}
                    >
                      <LogOut size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Content Sections */}
          <div className="p-6">
            {/* Home Section */}
            {activeSection === 'home' && (
              <div>
                <h2 className="text-3xl font-bold mb-6">Welcome Back, {userName || 'Listener'}!</h2>
                
                
                {recentlyPlayed.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-xl font-bold mb-4">Recently Played</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {recentlyPlayed.slice(0, 5).map((song) => (
                        <div key={song.id} className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition duration-300">
                          <div 
                            className="aspect-square bg-gray-700 rounded-md mb-3 relative overflow-hidden cursor-pointer"
                            onClick={() => playSong(song)}
                          >
                            {song.coverUrl ? (
                              <img src={song.coverUrl} alt={song.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Music size={40} className="text-gray-500" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                              <Play className="text-white" size={36} />
                            </div>
                          </div>
                          <h4 className="font-medium truncate">{song.title}</h4>
                          <p className="text-sm text-gray-400 truncate">{song.artistName}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Top Songs */}
                <div className="mb-8">
                  <h3 className="text-xl font-bold mb-4">Top Songs</h3>
                  <div className="bg-gray-800 bg-opacity-60 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="py-3 px-4 text-left">#</th>
                          <th className="py-3 px-4 text-left">Title</th>
                          <th className="py-3 px-4 text-left">Artist</th>
                          <th className="py-3 px-4 text-center"><Clock size={16} /></th>
                          <th className="py-3 px-4 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allSongs.slice(0, 10).map((song, index) => (
                          <tr 
                            key={song.id} 
                            className="border-b border-gray-700 hover:bg-gray-700"
                          >
                            <td className="py-3 px-4">{index + 1}</td>
                            <td className="py-3 px-4 flex items-center">
                              <div className="w-10 h-10 mr-3 bg-gray-700 rounded overflow-hidden">
                                {song.coverUrl ? (
                                  <img src={song.coverUrl} alt={song.title} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Music size={16} className="text-gray-500" />
                                  </div>
                                )}
                              </div>
                              <span>{song.title}</span>
                            </td>
                            <td className="py-3 px-4">{song.artistName}</td>
                            <td className="py-3 px-4 text-center">{formatTime(song.duration || 0)}</td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex justify-center space-x-2">
                                <button
                                  onClick={() => playSong(song)}
                                  className="p-1 text-gray-400 hover:text-white"
                                >
                                  <Play size={16} />
                                </button>
                                <button
                                  onClick={() => toggleFavorite(song)}
                                  className={`p-1 ${isFavorite(song.id) ? 'text-pink-500' : 'text-gray-400 hover:text-pink-500'}`}
                                >
                                  <Heart size={16} />
                                </button>
                                <button
                                  onClick={() => {setSongToAdd(song); setShowAddToPlaylist(true);}}
                                  className="p-1 text-gray-400 hover:text-white"
                                >
                                  <PlusCircle size={16} />
                                </button>
                                <button
                                  onClick={() => addToQueue(song)}
                                  className="p-1 text-gray-400 hover:text-white"
                                >
                                  <ListMusic size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
            
            {/* Search Section */}
            {activeSection === 'search' && (
              <div>
                <h2 className="text-3xl font-bold mb-6">Search Results</h2>
                
                {searchQuery.trim() === '' ? (
                  <div className="text-center text-gray-400 py-16">
                    <Search size={48} className="mx-auto mb-4" />
                    <p className="text-xl">Search for songs, artists, or albums</p>
                  </div>
                ) : filteredSongs.length === 0 ? (
                  <div className="text-center text-gray-400 py-16">
                    <p className="text-xl">No results found for "{searchQuery}"</p>
                  </div>
                ) : (
                  <div className="bg-gray-800 bg-opacity-60 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="py-3 px-4 text-left">#</th>
                          <th className="py-3 px-4 text-left">Title</th>
                          <th className="py-3 px-4 text-left">Artist</th>
                          <th className="py-3 px-4 text-center"><Clock size={16} /></th>
                          <th className="py-3 px-4 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSongs.map((song, index) => (
                          <tr 
                            key={song.id} 
                            className="border-b border-gray-700 hover:bg-gray-700"
                          >
                            <td className="py-3 px-4">{index + 1}</td>
                            <td className="py-3 px-4 flex items-center">
                              <div className="w-10 h-10 mr-3 bg-gray-700 rounded overflow-hidden">
                                {song.coverUrl ? (
                                  <img src={song.coverUrl} alt={song.title} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Music size={16} className="text-gray-500" />
                                  </div>
                                )}
                              </div>
                              <span>{song.title}</span>
                            </td>
                            <td className="py-3 px-4">{song.artistName}</td>
                            <td className="py-3 px-4 text-center">{formatTime(song.duration || 0)}</td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex justify-center space-x-2">
                                <button
                                  onClick={() => playSong(song)}
                                  className="p-1 text-gray-400 hover:text-white"
                                >
                                  <Play size={16} />
                                </button>
                                <button
                                  onClick={() => toggleFavorite(song)}
                                  className={`p-1 ${isFavorite(song.id) ? 'text-pink-500' : 'text-gray-400 hover:text-pink-500'}`}
                                >
                                  <Heart size={16} />
                                </button>
                                <button
                                  onClick={() => {setSongToAdd(song); setShowAddToPlaylist(true);}}
                                  className="p-1 text-gray-400 hover:text-white"
                                >
                                  <PlusCircle size={16} />
                                </button>
                                <button
                                  onClick={() => addToQueue(song)}
                                  className="p-1 text-gray-400 hover:text-white"
                                >
                                  <ListMusic size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
            
            {/* Library Section */}
            {activeSection === 'library' && (
              <div>
                <h2 className="text-3xl font-bold mb-6">Your Library</h2>
                
                <div className="bg-gray-800 bg-opacity-60 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="py-3 px-4 text-left">#</th>
                        <th className="py-3 px-4 text-left">Title</th>
                        <th className="py-3 px-4 text-left">Artist</th>
                        <th className="py-3 px-4 text-center"><Clock size={16} /></th>
                        <th className="py-3 px-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allSongs.map((song, index) => (
                        <tr 
                          key={song.id} 
                          className="border-b border-gray-700 hover:bg-gray-700"
                        >
                          <td className="py-3 px-4">{index + 1}</td>
                          <td className="py-3 px-4 flex items-center">
                            <div className="w-10 h-10 mr-3 bg-gray-700 rounded overflow-hidden">
                              {song.coverUrl ? (
                                <img src={song.coverUrl} alt={song.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Music size={16} className="text-gray-500" />
                                </div>
                              )}
                            </div>
                            <span>{song.title}</span>
                          </td>
                          <td className="py-3 px-4">{song.artistName}</td>
                          <td className="py-3 px-4 text-center">{formatTime(song.duration || 0)}</td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex justify-center space-x-2">
                              <button
                                onClick={() => playSong(song)}
                                className="p-1 text-gray-400 hover:text-white"
                              >
                                <Play size={16} />
                              </button>
                              <button
                                onClick={() => toggleFavorite(song)}
                                className={`p-1 ${isFavorite(song.id) ? 'text-pink-500' : 'text-gray-400 hover:text-pink-500'}`}
                              >
                                <Heart size={16} />
                              </button>
                              <button
                                onClick={() => {setSongToAdd(song); setShowAddToPlaylist(true);}}
                                className="p-1 text-gray-400 hover:text-white"
                              >
                                <PlusCircle size={16} />
                              </button>
                              <button
                                onClick={() => addToQueue(song)}
                                className="p-1 text-gray-400 hover:text-white"
                              >
                                <ListMusic size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {/* Favorites Section */}
            {activeSection === 'favorites' && (
              <div>
                <h2 className="text-3xl font-bold mb-6">Your Favorites</h2>
                
                {favoriteSongs.length === 0 ? (
                  <div className="text-center text-gray-400 py-16">
                    <Heart size={48} className="mx-auto mb-4" />
                    <p className="text-xl">You haven't added any favorites yet</p>
                    <p className="mt-2">Like songs to add them to your favorites</p>
                  </div>
                ) : (
                  <div className="bg-gray-800 bg-opacity-60 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="py-3 px-4 text-left">#</th>
                          <th className="py-3 px-4 text-left">Title</th>
                          <th className="py-3 px-4 text-left">Artist</th>
                          <th className="py-3 px-4 text-center"><Clock size={16} /></th>
                          <th className="py-3 px-4 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {favoriteSongs.map((song, index) => (
                          <tr 
                            key={song.id} 
                            className="border-b border-gray-700 hover:bg-gray-700"
                          >
                            <td className="py-3 px-4">{index + 1}</td>
                            <td className="py-3 px-4 flex items-center">
                              <div className="w-10 h-10 mr-3 bg-gray-700 rounded overflow-hidden">
                                {song.coverUrl ? (
                                  <img src={song.coverUrl} alt={song.title} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Music size={16} className="text-gray-500" />
                                  </div>
                                )}
                              </div>
                              <span>{song.title}</span>
                            </td>
                            <td className="py-3 px-4">{song.artistName}</td>
                            <td className="py-3 px-4 text-center">{formatTime(song.duration || 0)}</td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex justify-center space-x-2">
                                <button
                                  onClick={() => playSong(song)}
                                  className="p-1 text-gray-400 hover:text-white"
                                >
                                  <Play size={16} />
                                </button>
                                <button
                                  onClick={() => toggleFavorite(song)}
                                  className="p-1 text-pink-500"
                                >
                                  <Heart size={16} />
                                </button>
                                <button
                                  onClick={() => {setSongToAdd(song); setShowAddToPlaylist(true);}}
                                  className="p-1 text-gray-400 hover:text-white"
                                >
                                  <PlusCircle size={16} />
                                </button>
                                <button
                                  onClick={() => addToQueue(song)}
                                  className="p-1 text-gray-400 hover:text-white"
                                >
                                  <ListMusic size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
            
            {/* Playlists Section */}
            {activeSection === 'playlists' && (
              <div>
                <h2 className="text-3xl font-bold mb-6">Your Playlists</h2>
                
                {playlists.length === 0 ? (
                  <div className="text-center text-gray-400 py-16">
                    <ListMusic size={48} className="mx-auto mb-4" />
                    <p className="text-xl">You haven't created any playlists yet</p>
                    <button 
                      onClick={() => setShowCreatePlaylist(true)}
                      className="mt-4 bg-pink-600 hover:bg-pink-700 text-white py-2 px-6 rounded-full inline-flex items-center"
                    >
                      <PlusCircle className="mr-2" size={18} />
                      Create Playlist
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {playlists.map((playlist) => (
                      <div key={playlist.id} className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition duration-300">
                        <div 
                          className="aspect-square bg-gray-700 rounded-md mb-3 relative overflow-hidden cursor-pointer"
                          onClick={() => viewPlaylist(playlist)}
                        >
                          <div className="w-full h-full flex items-center justify-center bg-gray-900">
                            <ListMusic size={40} className="text-gray-500" />
                          </div>
                          <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Play className="text-white" size={36} />
                          </div>
                        </div>
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium truncate">{playlist.name}</h4>
                            <p className="text-sm text-gray-400 truncate">{(playlist.songs?.length || 0)} songs</p>
                          </div>
                          <button
                            onClick={() => {
                              setShowDeleteConfirm(true);
                              setItemToDelete(playlist);
                              setDeleteType('playlist');
                            }}
                            className="p-1 text-gray-400 hover:text-red-500"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    {/* Create Playlist Card */}
                    <div 
                      onClick={() => setShowCreatePlaylist(true)}
                      className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition duration-300 cursor-pointer aspect-square flex flex-col items-center justify-center"
                    >
                      <PlusCircle size={40} className="text-pink-500 mb-4" />
                      <p className="text-center font-medium">Create New Playlist</p>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Playlist Detail Section */}
            {activeSection === 'playlist-detail' && selectedPlaylist && (
              <div>
                <div className="flex items-center mb-6">
                  <button 
                    onClick={() => {setActiveSection('playlists'); setSelectedPlaylist(null);}}
                    className="text-gray-400 hover:text-white mr-4"
                  >
                    &larr; Back to Playlists
                  </button>
                  <h2 className="text-3xl font-bold">{selectedPlaylist.name}</h2>
                </div>
                
                {selectedPlaylist.songs?.length === 0 ? (
                  <div className="text-center text-gray-400 py-16">
                    <ListMusic size={48} className="mx-auto mb-4" />
                    <p className="text-xl">This playlist is empty</p>
                    <p className="mt-2">Add songs to your playlist</p>
                  </div>
                ) : (
                  <div className="bg-gray-800 bg-opacity-60 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="py-3 px-4 text-left">#</th>
                          <th className="py-3 px-4 text-left">Title</th>
                          <th className="py-3 px-4 text-left">Artist</th>
                          <th className="py-3 px-4 text-center"><Clock size={16} /></th>
                          <th className="py-3 px-4 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedPlaylist.songs?.map((songId, index) => {
                          const song = allSongs.find(s => s.id === songId);
                          if (!song) return null;
                          
                          return (
                            <tr 
                              key={song.id} 
                              className="border-b border-gray-700 hover:bg-gray-700"
                            >
                              <td className="py-3 px-4">{index + 1}</td>
                              <td className="py-3 px-4 flex items-center">
                                <div className="w-10 h-10 mr-3 bg-gray-700 rounded overflow-hidden">
                                  {song.coverUrl ? (
                                    <img src={song.coverUrl} alt={song.title} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Music size={16} className="text-gray-500" />
                                    </div>
                                  )}
                                </div>
                                <span>{song.title}</span>
                              </td>
                              <td className="py-3 px-4">{song.artistName}</td>
                              <td className="py-3 px-4 text-center">{formatTime(song.duration || 0)}</td>
                              <td className="py-3 px-4 text-center">
                                <div className="flex justify-center space-x-2">
                                  <button
                                    onClick={() => playSong(song)}
                                    className="p-1 text-gray-400 hover:text-white"
                                  >
                                    <Play size={16} />
                                  </button>
                                  <button
                                    onClick={() => toggleFavorite(song)}
                                    className={`p-1 ${isFavorite(song.id) ? 'text-pink-500' : 'text-gray-400 hover:text-pink-500'}`}
                                  >
                                    <Heart size={16} />
                                  </button>
                                  <button
                                    onClick={() => removeSongFromPlaylist(selectedPlaylist.id, song.id)}
                                    className="p-1 text-gray-400 hover:text-red-500"
                                  >
                                    <X size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
            
            {/* Profile Section */}
            {activeSection === 'profile' && (
              <div>
                <h2 className="text-3xl font-bold mb-6">Your Profile</h2>
                
                <div className="bg-gray-800 rounded-lg p-6">
                  <div className="flex flex-col md:flex-row items-center md:items-start">
                    <div className="w-32 h-32 rounded-full bg-pink-500 flex items-center justify-center mb-4 md:mb-0 md:mr-6 overflow-hidden relative">
                      {profileImageUrl ? (
                        <img src={profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-3xl">{userName ? userName.charAt(0).toUpperCase() : "U"}</span>
                      )}
                      
                      {editingProfile && (
                        <label className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center cursor-pointer">
                          <Camera size={24} />
                          <input 
                            type="file" 
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                setProfileImage(e.target.files[0]);
                                setProfileImageUrl(URL.createObjectURL(e.target.files[0]));
                              }
                            }}
                          />
                        </label>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      {editingProfile ? (
                        <div>
                          <div className="mb-4">
                            <label className="block text-gray-400 mb-1">Name</label>
                            <input
                              type="text"
                              value={userName}
                              onChange={(e) => setUserName(e.target.value)}
                              className="w-full md:w-96 bg-gray-700 rounded py-2 px-4 focus:outline-none focus:ring-2 focus:ring-pink-500"
                            />
                          </div>
                          
                          <div className="mb-6">
                            <label className="block text-gray-400 mb-1">Bio</label>
                            <textarea
                              value={userBio}
                              onChange={(e) => setUserBio(e.target.value)}
                              className="w-full md:w-96 bg-gray-700 rounded py-2 px-4 focus:outline-none focus:ring-2 focus:ring-pink-500 h-24"
                              placeholder="Tell us about yourself..."
                            />
                          </div>
                          
                          <div className="flex space-x-3">
                            <button
                              onClick={updateUserProfile}
                              className="bg-pink-600 hover:bg-pink-700 text-white py-2 px-6 rounded-full inline-flex items-center"
                              disabled={updateLoading}
                            >
                              {updateLoading ? (
                                <span>Saving...</span>
                              ) : (
                                <>
                                  <Save className="mr-2" size={18} />
                                  Save Changes
                                </>
                              )}
                            </button>
                            
                            <button
                              onClick={() => {
                                setEditingProfile(false);
                                // Reset form values
                                setUserName(currentUser?.displayName || '');
                                setProfileImageUrl(currentUser?.photoURL || null);
                                setProfileImage(null);
                              }}
                              className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-6 rounded-full"
                              disabled={updateLoading}
                            >
                              Cancel
                            </button>
                          </div>
                          
                          {profileUpdateSuccess && (
                            <div className="mt-4 text-green-500 flex items-center">
                              <CheckCircle className="mr-2" size={18} />
                              Profile updated successfully!
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <h3 className="text-2xl font-bold mb-2">{userName || 'Listener'}</h3>
                          {userBio ? (
                            <p className="text-gray-300 mb-6">{userBio}</p>
                          ) : (
                            <p className="text-gray-400 mb-6 italic">No bio provided</p>
                          )}
                          
                          <button
                            onClick={() => setEditingProfile(true)}
                            className="bg-pink-600 hover:bg-pink-700 text-white py-2 px-6 rounded-full inline-flex items-center"
                          >
                            <Edit className="mr-2" size={18} />
                            Edit Profile
                          </button>
                          
                          <button
                            onClick={handleLogout}
                            className="ml-3 bg-gray-700 hover:bg-gray-600 text-white py-2 px-6 rounded-full inline-flex items-center"
                            disabled={isLoggingOut}
                          >
                            <LogOut className="mr-2" size={18} />
                            {isLoggingOut ? 'Logging out...' : 'Log out'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* User Stats */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-800 rounded-lg p-6">
                    <h3 className="text-xl font-bold mb-2">Favorites</h3>
                    <p className="text-3xl font-bold text-pink-500">{favoriteSongs.length}</p>
                    <p className="text-gray-400">Songs you've liked</p>
                  </div>
                  
                  <div className="bg-gray-800 rounded-lg p-6">
                    <h3 className="text-xl font-bold mb-2">Playlists</h3>
                    <p className="text-3xl font-bold text-pink-500">{playlists.length}</p>
                    <p className="text-gray-400">Created by you</p>
                  </div>
                  
                  <div className="bg-gray-800 rounded-lg p-6">
                    <h3 className="text-xl font-bold mb-2">Recently Played</h3>
                    <p className="text-3xl font-bold text-pink-500">{recentlyPlayed.length}</p>
                    <p className="text-gray-400">In the last 30 days</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Queue Sidebar */}
        {showQueue && (
          <div className="w-72 bg-gray-900 border-l border-gray-800 overflow-y-auto">
            <div className="p-4 border-b border-gray-800 flex justify-between items-center">
              <h3 className="font-bold">Queue</h3>
              <button 
                onClick={() => setShowQueue(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
            
            {queue.length === 0 ? (
              <div className="p-4 text-center text-gray-400">
                <p>Your queue is empty</p>
                <p className="text-sm mt-2">Add songs to your queue</p>
              </div>
            ) : (
              <div className="p-2">
                {queue.map((song, index) => (
                  <div 
                    key={`${song.id}-${index}`} 
                    className="flex items-center p-2 hover:bg-gray-800 rounded-lg"
                  >
                    <div className="w-10 h-10 mr-3 bg-gray-700 rounded overflow-hidden">
                      {song.coverUrl ? (
                        <img src={song.coverUrl} alt={song.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Music size={16} className="text-gray-500" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium">{song.title}</p>
                      <p className="text-sm text-gray-400 truncate">{song.artistName}</p>
                    </div>
                    <button
                      onClick={() => removeFromQueue(index)}
                      className="p-1 text-gray-400 hover:text-red-500"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Player Bar */}
      <div className="h-20 bg-gray-900 border-t border-gray-800 flex items-center px-4">
        {/* Song Info */}
        <div className="flex items-center w-1/4">
          {currentSong ? (
            <>
              <div className="w-12 h-12 mr-3 bg-gray-700 rounded overflow-hidden">
                {currentSong.coverUrl ? (
                  <img src={currentSong.coverUrl} alt={currentSong.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music size={18} className="text-gray-500" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate font-medium">{currentSong.title}</p>
                <p className="text-sm text-gray-400 truncate">{currentSong.artistName}</p>
              </div>
              <button
                onClick={() => toggleFavorite(currentSong)}
                className={`p-2 ${isFavorite(currentSong.id) ? 'text-pink-500' : 'text-gray-400 hover:text-pink-500'}`}
              >
                <Heart size={16} />
              </button>
            </>
          ) : (
            <p className="text-gray-400">No song playing</p>
          )}
        </div>
        
        {/* Player Controls */}
        <div className="flex-1 flex flex-col items-center">
          {/* Control buttons */}
          <div className="flex items-center mb-2">
            <button
              onClick={toggleShuffle}
              className={`p-2 mx-1 ${shuffle ? 'text-pink-500' : 'text-gray-400 hover:text-white'}`}
            >
              <Shuffle size={18} />
            </button>
            <button
              onClick={playPreviousSong}
              className="p-2 mx-1 text-gray-400 hover:text-white"
              disabled={!currentSong}
            >
              <SkipBack size={18} />
            </button>
            <button
              onClick={togglePlayPause}
              className="p-2 mx-2 bg-white text-black rounded-full hover:bg-gray-200 w-8 h-8 flex items-center justify-center"
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <button
              onClick={playNextSong}
              className="p-2 mx-1 text-gray-400 hover:text-white"
              disabled={!currentSong}
            >
              <SkipForward size={18} />
            </button>
            <button
              onClick={toggleRepeat}
              className={`p-2 mx-1 ${repeat ? 'text-pink-500' : 'text-gray-400 hover:text-white'}`}
            >
              <Repeat size={18} />
            </button>
          </div>
          
          {/* Progress bar */}
          <div className="w-full flex items-center">
            <span className="text-xs text-gray-400 w-10">{formatTime(currentTime)}</span>
            <div className="mx-2 flex-1">
              <input
                type="range"
                ref={progressRef}
                min="0"
                max="100"
                value={duration ? (currentTime / duration) * 100 : 0}
                onChange={handleProgressChange}
                className="w-full h-1 bg-gray-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
              />
            </div>
            <span className="text-xs text-gray-400 w-10">{formatTime(duration)}</span>
          </div>
        </div>
        
        {/* Volume Control */}
        <div className="w-1/4 flex justify-end items-center">
          <button
            onClick={toggleMute}
            className="p-2 text-gray-400 hover:text-white"
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            className="w-20 h-1 ml-2 bg-gray-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
          />
          <button
            onClick={() => setShowQueue(!showQueue)}
            className={`p-2 ml-4 ${showQueue ? 'text-pink-500' : 'text-gray-400 hover:text-white'}`}
          >
            <List size={18} />
          </button>
        </div>
      </div>
      
      {/* Hidden audio element */}
      <audio ref={audioRef} src={currentSong?.audioUrl} />
      
      {/* Modals */}
      {/* Create Playlist Modal */}
      {showCreatePlaylist && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-96">
            <h3 className="text-xl font-bold mb-4">Create New Playlist</h3>
            <input
              type="text"
              placeholder="Playlist name"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              className="w-full bg-gray-700 rounded py-2 px-4 mb-4 focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCreatePlaylist(false);
                  setNewPlaylistName('');
                }}
                className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded"
              >
                Cancel
              </button>
              <button
                onClick={createNewPlaylist}
                className="bg-pink-600 hover:bg-pink-700 text-white py-2 px-4 rounded"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-96">
            <h3 className="text-xl font-bold mb-4">Delete {deleteType === 'playlist' ? 'Playlist' : 'Song'}</h3>
            <p className="mb-4">
              Are you sure you want to delete &quot;{itemToDelete?.name || 'this item'}&quot;? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setItemToDelete(null);
                }}
                className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded"
              >
                Cancel
              </button>
              <button
                onClick={deleteType === 'playlist' ? deletePlaylist : undefined}
                className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Add to Playlist Modal */}
      {showAddToPlaylist && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-96">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Add to Playlist</h3>
              <button 
                onClick={() => {setShowAddToPlaylist(false); setSongToAdd(null);}}
                className="text-gray-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
            
            {playlists.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <p>You haven't created any playlists yet</p>
                <button 
                  onClick={() => {
                    setShowAddToPlaylist(false);
                    setShowCreatePlaylist(true);
                  }}
                  className="mt-4 bg-pink-600 hover:bg-pink-700 text-white py-2 px-6 rounded-full inline-flex items-center"
                >
                  <PlusCircle className="mr-2" size={18} />
                  Create Playlist
                </button>
              </div>
            ) : (
              <>
                <p className="mb-4 text-gray-300">
                  Select a playlist to add "{songToAdd?.title}"
                </p>
                <div className="max-h-64 overflow-y-auto">
                  {playlists.map((playlist) => (
                    <button
                      key={playlist.id}
                      onClick={() => addSongToPlaylist(playlist.id)}
                      className="w-full text-left p-3 hover:bg-gray-700 rounded-lg mb-1 flex items-center"
                    >
                      <ListMusic className="mr-3 text-gray-400" size={18} />
                      <span>{playlist.name}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
      
      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-md shadow-lg">
          {error}
          <button 
            onClick={() => setError('')}
            className="ml-3 text-white"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}