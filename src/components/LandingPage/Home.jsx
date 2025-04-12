import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="relative h-screen overflow-hidden">
      <video 
        autoPlay 
        loop 
        muted 
        className="absolute z-0 w-auto min-w-full min-h-full max-w-none"
      >
        <source src="/background.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-gradient-to-t from-pink-900/80 to-black/80 z-10">
        <div className="flex flex-col items-center justify-center h-full space-y-8">
          <h1 className="text-6xl font-bold text-pink-200">Harmony</h1>
          <div className="flex space-x-6">
            <Link to="/signup/listener" className="bg-pink-600 hover:bg-pink-700 text-white px-8 py-3 rounded-full">
              Join as Listener
            </Link>
            <Link to="/signup/artist" className="bg-black hover:bg-gray-900 text-pink-400 px-8 py-3 rounded-full">
              Join as Artist
            </Link>
          </div>
          <Link to="/login" className="text-pink-200 hover:text-pink-300">
            Already have an account? Login
          </Link>
        </div>
      </div>
    </div>
  );
}