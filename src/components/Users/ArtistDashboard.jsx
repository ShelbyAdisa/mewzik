import { useState, useEffect } from 'react';
import { db } from '../firebase/firebaseConfig';
import { collection, addDoc, getDocs, query, where, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { getAuth, updateProfile, signOut } from 'firebase/auth';
import { Music, Upload, User, List, Home, Edit, Trash2, X, Camera, Save, CheckCircle, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ArtistDashboard() {
  const [title, setTitle] = useState('');
  const [songFile, setSongFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [songUrl, setSongUrl] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [songs, setSongs] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [currentSongId, setCurrentSongId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [songToDelete, setSongToDelete] = useState(null);
  const [activeSection, setActiveSection] = useState('tracks'); // 'profile', 'tracks', 'upload'
  const [editingProfile, setEditingProfile] = useState(false);
  const [artistName, setArtistName] = useState('');
  const [artistBio, setArtistBio] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [profileImageUrl, setProfileImageUrl] = useState(null);
  const [profileUpdateSuccess, setProfileUpdateSuccess] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const auth = getAuth();
  const currentUser = auth.currentUser;
  const navigate = useNavigate();
  const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dcvnqtz70/upload";
  const UPLOAD_PRESET = "audiofiles";

  useEffect(() => {
    const fetchSongs = async () => {
      if (!currentUser) return;
      try {
        const songsQuery = query(collection(db, 'songs'), where('artistId', '==', currentUser.uid));
        const querySnapshot = await getDocs(songsQuery);
        const songsList = [];
        querySnapshot.forEach((doc) => {
          songsList.push({
            id: doc.id,
            ...doc.data()
          });
        });
        setSongs(songsList);
      } catch (error) {
        console.error("Error fetching songs:", error);
      }
    };
    
    fetchSongs();
    
    // Initialize profile data
    if (currentUser) {
      setArtistName(currentUser.displayName || '');
      setProfileImageUrl(currentUser.photoURL || null);
      
      // Fetch artist bio from Firestore if you store it there
      const fetchUserProfile = async () => {
        try {
          const userDoc = await getDocs(query(
            collection(db, 'userProfiles'), 
            where('userId', '==', currentUser.uid)
          ));
          
          if (!userDoc.empty) {
            const userData = userDoc.docs[0].data();
            setArtistBio(userData.bio || '');
          }
        } catch (err) {
          console.error("Error fetching user profile:", err);
        }
      };
      
      fetchUserProfile();
    }
  }, [currentUser]);

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

  const resetForm = () => {
    setTitle('');
    setSongFile(null);
    setCoverFile(null);
    setSongUrl('');
    setCoverUrl('');
    setEditMode(false);
    setCurrentSongId(null);
    setError('');
  };

  const handleUpload = async () => {
    if (!title || (!songFile && !songUrl) || !coverFile) {
      setError("Please provide a title, audio file or URL, and cover image.");
      return;
    }
    if (!currentUser) {
      setError("User not authenticated.");
      return;
    }
    setIsUploading(true);
    setError('');
    try {
      let audioUrl = songUrl;
      if (songFile) {
        audioUrl = await uploadToCloudinary(songFile);
      }
      const coverImageUrl = await uploadToCloudinary(coverFile);
      const songData = {
        title,
        artistId: currentUser.uid,
        artistName: currentUser.displayName || 'Unknown Artist',
        audioUrl,
        cover: coverImageUrl,
        createdAt: new Date(),
        lastUpdated: new Date()
      };
      if (editMode && currentSongId) {
        await updateDoc(doc(db, 'songs', currentSongId), {
          ...songData,
          createdAt: songs.find(song => song.id === currentSongId).createdAt
        });
        setSongs(songs.map(song => (song.id === currentSongId ? { ...song, ...songData } : song)));
        alert("Song updated successfully!");
      } else {
        const docRef = await addDoc(collection(db, 'songs'), songData);
        setSongs([...songs, { id: docRef.id, ...songData }]);
        alert("Upload successful!");
      }
      resetForm();
      setActiveSection('tracks');
    } catch (error) {
      console.error("Error uploading song data:", error);
      setError(`Failed to upload: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleEdit = (song) => {
    setTitle(song.title);
    setSongUrl(song.audioUrl);
    setCoverUrl(song.cover);
    setCurrentSongId(song.id);
    setEditMode(true);
    setActiveSection('upload');
  };

  const handleDelete = async () => {
    if (!songToDelete) return;
    try {
      await deleteDoc(doc(db, 'songs', songToDelete.id));
      setSongs(songs.filter(song => song.id !== songToDelete.id));
      alert("Track deleted successfully!");
      setShowDeleteModal(false);
      setSongToDelete(null);
    } catch (error) {
      console.error("Error deleting song:", error);
      alert(`Failed to delete: ${error.message}`);
      setShowDeleteModal(false);
    }
  };
  
  const updateArtistProfile = async () => {
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
        displayName: artistName,
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
          bio: artistBio,
          createdAt: new Date()
        });
      } else {
        // Update existing profile document
        const docRef = doc(db, 'userProfiles', querySnapshot.docs[0].id);
        await updateDoc(docRef, {
          bio: artistBio,
          updatedAt: new Date()
        });
      }
      
      // Also update all songs with new artist name
      const songsToUpdate = query(
        collection(db, 'songs'),
        where('artistId', '==', currentUser.uid)
      );
      
      const songsSnapshot = await getDocs(songsToUpdate);
      const updatePromises = [];
      
      songsSnapshot.forEach((doc) => {
        updatePromises.push(
          updateDoc(doc.ref, {
            artistName: artistName
          })
        );
      });
      
      await Promise.all(updatePromises);
      
      // Set success message
      setProfileUpdateSuccess(true);
      setTimeout(() => setProfileUpdateSuccess(false), 3000);
      
      // Exit edit mode
      setEditingProfile(false);
      
      // Update profile image in state
      if (photoURL) {
        setProfileImageUrl(photoURL);
      }
      
      // Refresh songs list to reflect artist name changes
      const refreshedSongsQuery = query(collection(db, 'songs'), where('artistId', '==', currentUser.uid));
      const refreshedQuerySnapshot = await getDocs(refreshedSongsQuery);
      const refreshedSongsList = [];
      refreshedQuerySnapshot.forEach((doc) => {
        refreshedSongsList.push({
          id: doc.id,
          ...doc.data()
        });
      });
      setSongs(refreshedSongsList);
      
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

  return (
    <div className="flex bg-black text-white h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 flex flex-col border-r border-gray-800">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-pink-400 flex items-center">
            <Music className="mr-2" /> Artist Studio
          </h1>
        </div>
        
        <div className="flex-1">
          <nav className="px-4 py-2">
            <ul>
              <li>
                <button 
                  onClick={() => setActiveSection('profile')}
                  className={`flex items-center w-full text-left px-4 py-3 rounded-lg mb-1 ${activeSection === 'profile' ? 'bg-pink-600' : 'hover:bg-gray-800'}`}
                >
                  <User className="mr-3" size={18} />
                  <span>My Profile</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setActiveSection('tracks')}
                  className={`flex items-center w-full text-left px-4 py-3 rounded-lg mb-1 ${activeSection === 'tracks' ? 'bg-pink-600' : 'hover:bg-gray-800'}`}
                >
                  <List className="mr-3" size={18} />
                  <span>My Tracks</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => {resetForm(); setActiveSection('upload')}}
                  className={`flex items-center w-full text-left px-4 py-3 rounded-lg mb-1 ${activeSection === 'upload' ? 'bg-pink-600' : 'hover:bg-gray-800'}`}
                >
                  <Upload className="mr-3" size={18} />
                  <span>Upload Music</span>
                </button>
              </li>
            </ul>
          </nav>
        </div>
        
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-pink-500 flex items-center justify-center mr-3 overflow-hidden">
              {profileImageUrl ? (
                <img src={profileImageUrl} alt="Artist" className="w-full h-full object-cover" />
              ) : (
                <span>{artistName ? artistName.charAt(0).toUpperCase() : "A"}</span>
              )}
            </div>
            <div>
              <div className="font-medium">{artistName || 'Artist'}</div>
              <div className="text-sm text-gray-400">Creator</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-900 to-black">
        {/* Profile Section */}
        {activeSection === 'profile' && (
          <div className="p-8 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-pink-300">Artist Profile</h2>
              {!editingProfile && (
                <div className="flex space-x-3">
                  <button 
                    onClick={() => setEditingProfile(true)}
                    className="px-4 py-2 bg-pink-600 rounded-lg hover:bg-pink-500 flex items-center"
                  >
                    <Edit size={16} className="mr-2" />
                    Edit Profile
                  </button>
                  <button 
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 flex items-center"
                  >
                    <LogOut size={16} className="mr-2" />
                    {isLoggingOut ? 'Logging Out...' : 'Logout'}
                  </button>
                </div>
              )}
            </div>
            
            <div className="bg-gray-900 bg-opacity-60 backdrop-blur-lg rounded-xl p-8 shadow-lg">
              {profileUpdateSuccess && (
                <div className="mb-6 p-4 bg-green-900 bg-opacity-30 border border-green-500 rounded-lg flex items-center">
                  <CheckCircle className="text-green-400 mr-2" size={20} />
                  <p className="text-green-400">Profile updated successfully!</p>
                </div>
              )}
              
              {!editingProfile ? (
                // Profile View Mode
                <div>
                  <div className="flex items-center mb-8">
                    <div className="w-24 h-24 rounded-full bg-pink-500 flex items-center justify-center text-3xl font-bold mr-6 overflow-hidden">
                      {profileImageUrl ? (
                        <img src={profileImageUrl} alt="Artist" className="w-full h-full object-cover" />
                      ) : (
                        <span>{artistName ? artistName.charAt(0).toUpperCase() : "A"}</span>
                      )}
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold">{artistName || 'Artist Name'}</h2>
                      <p className="text-pink-400">Music Creator</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6 mb-8">
                    <div className="bg-gray-800 p-6 rounded-xl">
                      <h3 className="text-xl font-semibold mb-2">Tracks</h3>
                      <p className="text-3xl font-bold text-pink-400">{songs.length}</p>
                    </div>
                    <div className="bg-gray-800 p-6 rounded-xl">
                      <h3 className="text-xl font-semibold mb-2">Joined</h3>
                      <p className="text-lg text-gray-300">
                        {currentUser && currentUser.metadata && currentUser.metadata.creationTime 
                          ? new Date(currentUser.metadata.creationTime).toLocaleDateString() 
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-800 p-6 rounded-xl">
                    <h3 className="text-xl font-semibold mb-4">Bio</h3>
                    <p className="text-gray-300">
                      {artistBio || `${artistName || 'Artist'} is a music creator sharing original tracks.`}
                    </p>
                  </div>
                </div>
              ) : (
                // Profile Edit Mode
                <div>
                  <div className="mb-8">
                    <div className="flex items-center mb-6">
                      <div className="relative">
                        <div className="w-24 h-24 rounded-full bg-pink-500 flex items-center justify-center text-3xl font-bold overflow-hidden">
                          {profileImage ? (
                            <img 
                              src={URL.createObjectURL(profileImage)} 
                              alt="Profile Preview" 
                              className="w-full h-full object-cover"
                            />
                          ) : profileImageUrl ? (
                            <img 
                              src={profileImageUrl} 
                              alt="Artist" 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>{artistName ? artistName.charAt(0).toUpperCase() : "A"}</span>
                          )}
                        </div>
                        <label 
                          htmlFor="profile-upload" 
                          className="absolute bottom-0 right-0 w-8 h-8 bg-pink-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-pink-500"
                        >
                          <Camera size={16} />
                        </label>
                        <input 
                          type="file" 
                          id="profile-upload" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => setProfileImage(e.target.files[0])}
                        />
                      </div>
                      <div className="ml-6">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Artist Name</label>
                        <input
                          type="text"
                          value={artistName}
                          onChange={(e) => setArtistName(e.target.value)}
                          placeholder="Enter your artist name"
                          className="bg-gray-800 text-white w-full p-3 rounded-lg focus:ring-2 focus:ring-pink-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-8">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Artist Bio</label>
                    <textarea
                      value={artistBio}
                      onChange={(e) => setArtistBio(e.target.value)}
                      placeholder="Tell your fans about yourself"
                      className="bg-gray-800 text-white w-full p-3 rounded-lg h-32 focus:ring-2 focus:ring-pink-500 focus:outline-none"
                    />
                  </div>
                  
                  {error && (
                    <div className="mb-6 p-4 bg-red-900 bg-opacity-30 border border-red-500 rounded-lg">
                      <p className="text-red-400">{error}</p>
                    </div>
                  )}
                  
                  <div className="flex space-x-4">
                    <button
                      onClick={updateArtistProfile}
                      disabled={updateLoading}
                      className="flex-1 py-3 bg-pink-600 text-white rounded-full hover:bg-pink-500 font-medium transition-colors flex items-center justify-center"
                    >
                      {updateLoading ? (
                        <>Saving...</>
                      ) : (
                        <>
                          <Save size={18} className="mr-2" />
                          Save Profile
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={() => setEditingProfile(false)}
                      className="px-6 py-3 bg-gray-700 text-white rounded-full hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Tracks Section */}
        {activeSection === 'tracks' && (
          <div className="p-8 max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-pink-300">Your Tracks</h2>
            
            {songs.length === 0 ? (
              <div className="bg-gray-900 bg-opacity-60 backdrop-blur-lg rounded-xl p-12 text-center">
                <Music size={48} className="mx-auto mb-4 text-pink-400" />
                <h3 className="text-xl font-semibold mb-2">No tracks yet</h3>
                <p className="text-gray-400 mb-6">Upload your first track to get started</p>
                <button 
                  onClick={() => setActiveSection('upload')}
                  className="px-6 py-3 bg-pink-600 rounded-full hover:bg-pink-500 transition-colors"
                >
                  Upload Your First Track
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {songs.map((song) => (
                  <div key={song.id} className="bg-gray-900 bg-opacity-60 backdrop-blur-lg rounded-xl overflow-hidden shadow-lg transform transition hover:scale-105">
                    <div className="relative pb-3/4">
                      <img 
                        src={song.cover || "/api/placeholder/400/320"} 
                        alt={song.title} 
                        className="w-full h-48 object-cover"
                      />
                    </div>
                    <div className="p-5">
                      <h4 className="text-xl font-bold text-white mb-2">{song.title}</h4>
                      <p className="text-sm text-gray-400 mb-4">
                        {new Date(song.createdAt?.toDate?.() || song.createdAt).toLocaleDateString()}
                      </p>
                      
                      <div className="mb-4">
                        <audio controls className="w-full">
                          <source src={song.audioUrl} type="audio/mp3" />
                          Your browser does not support the audio tag.
                        </audio>
                      </div>
                      
                      <div className="flex justify-between">
                        <button
                          onClick={() => handleEdit(song)}
                          className="flex items-center px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-full"
                        >
                          <Edit size={16} className="mr-2" />
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setSongToDelete(song);
                            setShowDeleteModal(true);
                          }}
                          className="flex items-center px-4 py-2 bg-gray-800 hover:bg-red-700 text-red-400 rounded-full"
                        >
                          <Trash2 size={16} className="mr-2" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Upload Section */}
        {activeSection === 'upload' && (
          <div className="p-8 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-pink-300">
              {editMode ? 'Edit Track' : 'Upload New Track'}
            </h2>
            
            <div className="bg-gray-900 bg-opacity-60 backdrop-blur-lg rounded-xl p-8 shadow-lg">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">Track Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-gray-800 text-white w-full p-3 rounded-lg focus:ring-2 focus:ring-pink-500 focus:outline-none"
                  placeholder="Enter the title of your track"
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">Audio File</label>
                <div className="bg-gray-800 p-4 rounded-lg border border-dashed border-gray-600">
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => setSongFile(e.target.files[0])}
                    className="text-sm text-gray-300 w-full"
                  />
                  <p className="text-center text-sm text-gray-500 my-2">or</p>
                  <input
                    type="url"
                    placeholder="Paste an audio URL"
                    value={songUrl}
                    onChange={(e) => setSongUrl(e.target.value)}
                    className="bg-gray-700 text-white w-full p-3 rounded-lg focus:ring-2 focus:ring-pink-500 focus:outline-none"
                  />
                </div>
              </div>
              
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-300 mb-2">Cover Image</label>
                <div className="bg-gray-800 p-4 rounded-lg border border-dashed border-gray-600">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setCoverFile(e.target.files[0])}
                    className="text-sm text-gray-300 w-full"
                  />
                  {coverUrl && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-400 mb-2">Current cover:</p>
                      <img src={coverUrl} alt="Current cover" className="w-32 h-32 object-cover rounded" />
                    </div>
                  )}
                </div>
              </div>
              
              {error && (
                <div className="mb-6 p-4 bg-red-900 bg-opacity-30 border border-red-500 rounded-lg">
                  <p className="text-red-400">{error}</p>
                </div>
              )}
              
              <div className="flex space-x-4">
                <button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="flex-1 py-3 bg-pink-600 text-white rounded-full hover:bg-pink-500 font-medium transition-colors flex items-center justify-center"
                >
                  {isUploading ? 'Uploading...' : editMode ? 'Save Changes' : 'Upload Track'}
                </button>
                
                {editMode && (
                  <button
                    onClick={resetForm}
                    className="px-6 py-3 bg-gray-700 text-white rounded-full hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl p-8 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Delete Track</h3>
              <button onClick={() => setShowDeleteModal(false)} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            
            <p className="text-gray-300 mb-8">
              Are you sure you want to delete "{songToDelete?.title}"? This action cannot be undone.
            </p>
            
            <div className="flex space-x-4">
              <button
                onClick={handleDelete}
                className="flex-1 py-3 bg-red-600 text-white rounded-full hover:bg-red-500"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-3 bg-gray-700 text-white rounded-full hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}