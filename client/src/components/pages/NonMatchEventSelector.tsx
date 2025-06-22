import { useNavigate } from "react-router-dom";
import { Home, Star, Zap, Dumbbell, Brain, PartyPopper, Target, Mic, Smartphone, Heart, Play, Gamepad2 } from "lucide-react";
import { useNonMatchEvents, NonMatchEvent } from "../../dojo/hooks/useNonMatchEvents";
import NonMatchEventItem from "../ui/nonMatchEventItem";
// Icon mapping for each event

const getEventImage = (eventId: number) => {
  switch (eventId) {
    case 11: return "/nonMatchEvent/videogames.png";
    case 10: return "/nonMatchEvent/go-for-a-run.png";
    case 9: return "/nonMatchEvent/visit-your-parents.png";
    case 8: return "/nonMatchEvent/social-media.png";
    case 7: return "/nonMatchEvent/Podcast.png";
    case 6: return "/nonMatchEvent/penalty.png";
    case 5: return "/nonMatchEvent/party.png";
    case 4: return "/nonMatchEvent/meditate.png";
    case 3: return "/nonMatchEvent/go-to-the-gym.png";
    case 2: return "/nonMatchEvent/free-kick.png";
  }
}


const getEventIcon = (eventId: number) => {
  switch (eventId) {
    case 1: return Star; // Look for Sponsor Deals
    case 2: return Target; // Free-Kick Practice
    case 3: return Dumbbell; // Go to the Gym
    case 4: return Brain; // Meditate
    case 5: return PartyPopper; // Party
    case 6: return Target; // Penalty Practice
    case 7: return Mic; // Go to a Podcast
    case 8: return Smartphone; // Work on Social Media
    case 9: return Heart; // Visit Parents' Home
    case 10: return Play; // Go for a Run
    case 11: return Gamepad2; // Play Videogames
    default: return Zap;
  }
};

// Color mapping for each event
const getEventColor = (eventId: number) => {
  switch (eventId) {
    case 1: return "from-yellow-500 to-yellow-600"; // Sponsor Deals
    case 2: return "from-green-500 to-green-600"; // Free-Kick Practice
    case 3: return "from-red-500 to-red-600"; // Gym
    case 4: return "from-purple-500 to-purple-600"; // Meditate
    case 5: return "from-pink-500 to-pink-600"; // Party
    case 6: return "from-blue-500 to-blue-600"; // Penalty Practice
    case 7: return "from-orange-500 to-orange-600"; // Podcast
    case 8: return "from-cyan-500 to-cyan-600"; // Social Media
    case 9: return "from-rose-500 to-rose-600"; // Parents' Home
    case 10: return "from-emerald-500 to-emerald-600"; // Run
    case 11: return "from-indigo-500 to-indigo-600"; // Videogames
    default: return "from-gray-500 to-gray-600";
  }
};

export default function NonMatchEventSelector() {
  const navigate = useNavigate();
  const { nonMatchEvents, loading, error } = useNonMatchEvents();


  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-6 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-400 mb-4">Error Loading Events</h2>
          <p className="text-gray-400 mb-4">{error.message}</p>
          <button
            onClick={() => navigate("/main")}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
          >
            Back to Main
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-cover bg-center relative overflow-hidden"
    style={{ backgroundImage: "url('/Screens/login/BackGround.png')" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-cyan-400">Choose Your Action</h1>
        <button
          onClick={() => navigate("/main")}
          className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
        >
          <Home size={20} />
          Back to Main
        </button>
      </div>

      <div className="flex flex-row space-x-4  mb-10 items-center justify-center">
        <img src="/nonMatchEvent/Npc.png" alt="Npc" className="w-1/3 h-1/3" />
        <img src="/nonMatchEvent/text-buble.png" alt="Text Buble" className="w-1/2 h-1/2" />
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading events...</p>
          </div>
        </div>
      )}

      {/* Events Grid */}
      {!loading && nonMatchEvents && nonMatchEvents.length > 0 && (
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {nonMatchEvents.map((event: NonMatchEvent) => {
                return <NonMatchEventItem event_id={event.event_id} title={event.name} />
            })}
          </div>
        </div>  
      )}

      {/* No Events State */}
      {!loading && (!nonMatchEvents || nonMatchEvents.length === 0) && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-4">
            No events available
          </div>
          <p className="text-sm text-gray-500 mb-6">
            Events may need to be seeded first
          </p>
          <button
            onClick={() => navigate("/main")}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
          >
            Back to Main
          </button>
        </div>
      )}
    </div>
  );
} 