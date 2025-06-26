import { useNavigate } from "react-router-dom";
import {
  Home,
  Star,
  Zap,
  Dumbbell,
  Brain,
  PartyPopper,
  Target,
  Mic,
  Smartphone,
  Heart,
  Play,
  Gamepad2,
} from "lucide-react";
import {
  useNonMatchEvents,
  NonMatchEvent,
} from "../../dojo/hooks/useNonMatchEvents";
import { useExecuteNonMatchEventAction } from "../../dojo/hooks/useExecuteNonMatchEventAction";
import NonMatchEventItem from "../ui/nonMatchEventItem";
// Icon mapping for each event

export default function NonMatchEventSelector() {
  const navigate = useNavigate();
  const { nonMatchEvents, loading, error: eventsError } = useNonMatchEvents();
  const {
    execute,
    state: executionState,
    error: executionError,
  } = useExecuteNonMatchEventAction();

  const handleEventSelect = (eventId: number) => {
    execute(eventId);
  };

  const errorMessage = eventsError?.message || executionError;

  if (errorMessage) {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-6 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-400 mb-4">Error</h2>
          <p className="text-gray-400 mb-4">{errorMessage}</p>
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
    <div
      className="min-h-screen flex flex-col items-center justify-center p-8 bg-cover bg-center relative overflow-hidden"
      style={{ backgroundImage: "url('/Screens/login/BackGround.png')" }}
    >
      {executionState === "executing" && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-50">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-cyan-400"></div>
          <p className="text-white text-xl mt-4">Executing on-chain...</p>
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-center mb-8 w-full max-w-6xl text-center">
        <h1 className="text-3xl font-bold text-cyan-400 text-center">
          Choose Your Action
        </h1>
        {/* <button
          onClick={() => navigate("/main")}
          className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
        >
          <Home size={20} />
          Back to Main
        </button> */}
      </div>

      <div className="flex flex-row space-x-4  mb-10 items-center justify-center">
        <img src="/nonMatchEvent/Npc.png" alt="Npc" className="w-1/3 h-1/3" />
        <img
          src="/nonMatchEvent/text-buble.png"
          alt="Text Buble"
          className="w-1/2 h-1/2"
        />
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
              return (
                <NonMatchEventItem
                  key={event.event_id}
                  event_id={event.event_id}
                  title={event.name}
                  onClick={() => handleEventSelect(event.event_id)}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* No Events State */}
      {!loading && (!nonMatchEvents || nonMatchEvents.length === 0) && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-4">No events available</div>
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
