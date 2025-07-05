import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSpawnPlayer } from "../../dojo/hooks/useSpawnPlayer";
import { useStarknetConnect } from "../../dojo/hooks/useStarknetConnect";
import { Loader2 } from "lucide-react";
import CharacterStatItem from "../ui/characterSelection/CharacterStatItem";
import gsap from "gsap";
import CyberBorder from "../ui/CyberBorder";
interface CharacterType {
  id: string;
  name: string;
  description: string;
  stats: {
    shooting: number;
    dribbling: number;
    passing: number;
    energy: number;
    charisma: number;
  };
  characterImage: string;
}

const characterTypes: CharacterType[] = [
  {
    id: "striker",
    name: "STRIKER",
    description:
      "Powerful finisher focused on scoring goals. High shooting accuracy with moderate skills.",
    stats: {
      shooting: 60,
      dribbling: 20,
      passing: 30,
      energy: 50,
      charisma: 25,
    },
    characterImage: "/playerTypes/9.png",
  },
  {
    id: "dribbler",
    name: "DRIBBLER",
    description:
      "Flashy show-boat winger with exceptional dribbling and charisma. Loves the spotlight.",
    stats: {
      shooting: 20,
      dribbling: 50,
      passing: 40,
      energy: 40,
      charisma: 50,
    },
    characterImage: "/playerTypes/11.png",
  },
  {
    id: "playmaker",
    name: "PLAYMAKER",
    description:
      "Team-oriented chance creator with balanced skills. High energy and stamina for the long game.",
    stats: {
      shooting: 30,
      dribbling: 30,
      passing: 60,
      energy: 50,
      charisma: 40,
    },
    characterImage: "/playerTypes/10.png",
  },
];

export default function CharacterSelectionScreen() {
  const navigate = useNavigate();
  const {
    spawnPlayerWithCharacter,
    isInitializing,
    error,
    txStatus,
    playerExists,
  } = useSpawnPlayer();
  const { handleDisconnect } = useStarknetConnect();
  const [currentCharacterIndex, setCurrentCharacterIndex] = useState(0);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const currentCharacter = characterTypes[currentCharacterIndex];

  useEffect(() => {
    console.log("🎯 CharacterSelectionScreen rendered");
    console.log("🎯 PlayerExist:", playerExists);

    const items = gsap.utils.toArray(".stat-item");

    gsap.fromTo(
      items,
      {
        opacity: 0,
        duration: 0.3,
        stagger: 0.2,
        yPercent: -50,
        ease: "power3.out",
      },
      {
        opacity: 1,
        duration: 0.3,
        stagger: 0.2,
        yPercent: 0,
        ease: "power3.out",
      }
    );

    if (playerExists === true) {
      navigate("/main", { replace: true });
    }
  }, []);

  const handleCharacterSelect = async () => {
    try {
      console.log(`🎯 Creating ${currentCharacter.name} character...`);

      const result = await spawnPlayerWithCharacter(currentCharacter.id);
      console.log(result);

      if (result.success) {
        console.log("🎉 Character created successfully!");

        // Wait a bit longer to ensure player data is fully updated in the store
        console.log("⏳ Waiting for player data to be fully updated...");
        await new Promise((resolve) => setTimeout(resolve, 1000));

        console.log("🚀 Redirecting to game...");
        navigate("/select-team", { replace: true });
      } else {
        console.error("❌ Failed to create character:", result.error);
      }
    } catch (err) {
      console.error("❌ Error creating character:", err);
    }
  };

  const handleGoBack = async () => {
    try {
      console.log("🔙 Back to Login clicked - disconnecting...");
      setIsDisconnecting(true);

      // First disconnect the wallet and clear data (same as status-bar)
      await handleDisconnect();

      // Then navigate to login
      console.log("🔄 Navigating to login...");
      navigate("/login");
    } catch (error) {
      console.error("❌ Error during logout:", error);
      // Navigate anyway in case of error
      navigate("/login");
    } finally {
      setIsDisconnecting(false);
    }
  };

  const nextCharacter = () => {
    gsap.fromTo(
      ".character-title",
      { opacity: 0, duration: 0.3, yPercent: 50, ease: "power3.out" },
      {
        opacity: 1,
        duration: 0.3,
        yPercent: 0,
        ease: "power3.out",
      }
    );

    gsap.fromTo(
      ".character-image",
      { opacity: 0, duration: 0.3, ease: "sine.out" },
      {
        opacity: 1,
        duration: 0.3,
        ease: "sine.out",
      }
    );

    gsap.fromTo(
      ".stat-value",
      {
        opacity: 0,
        duration: 0.2,
        stagger: 0.1,
        ease: "power3.out",
      },
      {
        opacity: 1,
        stagger: 0.1,
        duration: 0.2,
        ease: "power3.out",
      }
    );

    setCurrentCharacterIndex((prev) => (prev + 1) % characterTypes.length);
  };

  const prevCharacter = () => {
    gsap.fromTo(
      ".character-title",
      { opacity: 0, duration: 0.3, yPercent: 50, ease: "power3.out" },
      {
        opacity: 1,
        duration: 0.3,
        yPercent: 0,
        ease: "power3.out",
      }
    );

    gsap.fromTo(
      ".character-image",
      { opacity: 0, duration: 0.3, ease: "sine.out" },
      {
        opacity: 1,
        duration: 0.3,
        ease: "sine.out",
      }
    );

    gsap.fromTo(
      ".stat-value",
      {
        opacity: 0,
        duration: 0.2,
        stagger: 0.1,
        ease: "power3.out",
      },
      {
        opacity: 1,
        stagger: 0.1,
        duration: 0.2,
        ease: "power3.out",
      }
    );

    setCurrentCharacterIndex(
      (prev) => (prev - 1 + characterTypes.length) % characterTypes.length
    );
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}

      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/CharacterSelection/Background.png')",
        }}
      />

      {/* Back Button */}

      {/* Main Content Container */}
      <div className="relative z-10 flex flex-col md:flex-row items-start justify-center min-h-screen px-4 py-4 mix-blend-normal backdrop-blur-[2px] bg-black/40">
        {/* Mobile: Character Navigation */}
        <div className="flex md:hidden items-center justify-between w-full mb-auto">
          <button
            onClick={prevCharacter}
            disabled={isInitializing}
            className="transform hover:scale-110 transition-transform duration-200 disabled:opacity-50"
          >
            <img
              src="/CharacterSelection/Left Arrow.png"
              alt="Previous Character"
              className="w-12 h-12 object-contain"
            />
          </button>

          <div className="text-center relative">
            <div className="text-sm text-cyan-400 character-title">
              {currentCharacterIndex + 1} / {characterTypes.length}
            </div>
            <h2 className="text-3xl font-bold text-cyan-300 tracking-wider pb-2 character-title">
              {currentCharacter.name}
            </h2>

            <CyberBorder />
          </div>

          <button
            onClick={nextCharacter}
            disabled={isInitializing}
            className="transform hover:scale-110 transition-transform duration-200 disabled:opacity-50"
          >
            <img
              src="/CharacterSelection/Right Arrow.png"
              alt="Next Character"
              className="w-12 h-12 object-contain"
            />
          </button>
        </div>

        {/* Mobile: Character and Stats */}
        <div className="md:hidden flex flex-col h-full mb-auto items-center justify-center space-y-6 w-full">
          {/* Character Display */}
          <div className="relative">
            <div className="relative w-64 h-80 flex items-end justify-center">
              <img
                src={currentCharacter.characterImage}
                alt={currentCharacter.name}
                className="w-full h-full object-contain character-image drop-shadow-[0px_2px_2px_rgba(0,255,255,0.4)]"
              />

              {/* Loading Overlay */}
              {isInitializing && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center rounded-lg">
                  <div className="text-center space-y-4">
                    <Loader2 className="w-12 h-12 animate-spin text-cyan-400 mx-auto" />
                    <div className="text-cyan-300 font-bold text-lg">
                      Creating {currentCharacter.name}...
                      {txStatus && (
                        <div className="text-sm text-cyan-400 mt-2">
                          Status: {txStatus}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Stats Panel */}
          <div className="relative w-full max-w-sm">
            <div className="stats-container">
              {/* Stats Content */}
              <div className="relative z-10 space-y-2  px-6 w-full">
                {/* Stats List */}
                <div className="space-y-2 pb-4 pt-4 stat-list">
                  <CharacterStatItem
                    statName="SHOOTING"
                    statValue={currentCharacter.stats.shooting}
                  />
                  <CharacterStatItem
                    statName="DRIBBLING"
                    statValue={currentCharacter.stats.dribbling}
                  />
                  <CharacterStatItem
                    statName="PASSING"
                    statValue={currentCharacter.stats.passing}
                  />
                  <CharacterStatItem
                    statName="ENERGY"
                    statValue={currentCharacter.stats.energy}
                  />
                  <CharacterStatItem
                    statName="CHARISMA"
                    statValue={currentCharacter.stats.charisma}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 left-4 md:bottom-8 md:left-8 z-20">
        <button
          onClick={handleGoBack}
          disabled={isInitializing || isDisconnecting}
          className="transform hover:scale-105 transition-transform duration-200"
        >
          <img
            src="/CharacterSelection/Back Button.png"
            alt="Back"
            className="w-32 h-18 md:w-24 md:h-12 object-contain"
          />
        </button>
      </div>

      {/* Next Button */}
      <div className="absolute bottom-4 right-4 md:bottom-8 md:right-8 z-20">
        <button
          onClick={handleCharacterSelect}
          disabled={isInitializing}
          className="transform hover:scale-105 transition-transform duration-200 disabled:opacity-50"
        >
          <img
            src="/CharacterSelection/Next Button.png"
            alt="Next"
            className="w-32 h-18 md:w-32 md:h-16 object-contain"
          />
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-20 px-4">
          <div className="bg-red-500/90 border border-red-400 rounded-lg p-4 max-w-md">
            <p className="text-white text-sm font-medium">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
