import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { useSpawnPlayer } from '../../dojo/hooks/useSpawnPlayer';
import { useStarknetConnect } from '../../dojo/hooks/useStarknetConnect';
import { Loader2, Zap, Target, Users, ArrowLeft } from 'lucide-react';

interface CharacterType {
  id: string;
  name: string;
  description: string;
  stats: {
    shoot: number;
    dribble: number;
    charisma: number;
    energy: number;
    stamina: number;
  };
  icon: React.ElementType;
  color: string;
  bgGradient: string;
  borderColor: string;
}

const characterTypes: CharacterType[] = [
  {
    id: 'striker',
    name: 'STRIKER',
    description: 'Powerful finisher focused on scoring goals. High shooting accuracy with moderate skills.',
    stats: { shoot: 60, dribble: 20, charisma: 25, energy: 50, stamina: 45 },
    icon: Target,
    color: 'text-red-300',
    bgGradient: 'from-red-500/20 to-orange-500/20',
    borderColor: 'border-red-400/50'
  },
  {
    id: 'dribbler',
    name: 'DRIBBLER',
    description: 'Flashy show-boat winger with exceptional dribbling and charisma. Loves the spotlight.',
    stats: { shoot: 20, dribble: 50, charisma: 50, energy: 40, stamina: 40 },
    icon: Zap,
    color: 'text-cyan-300',
    bgGradient: 'from-cyan-500/20 to-blue-500/20',
    borderColor: 'border-cyan-400/50'
  },
  {
    id: 'playmaker',
    name: 'PLAYMAKER',
    description: 'Team-oriented chance creator with balanced skills. High energy and stamina for the long game.',
    stats: { shoot: 30, dribble: 30, charisma: 40, energy: 50, stamina: 50 },
    icon: Users,
    color: 'text-purple-300',
    bgGradient: 'from-purple-500/20 to-pink-500/20',
    borderColor: 'border-purple-400/50'
  }
];

export default function CharacterSelectionScreen() {
  const navigate = useNavigate();
  const { spawnPlayerWithCharacter, isInitializing, error, txStatus, playerExists } = useSpawnPlayer();
  const { handleDisconnect } = useStarknetConnect();
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  useEffect(() => {
    console.log("🎯 CharacterSelectionScreen rendered");
    console.log("🎯 PlayerExist:", playerExists);
  
    if(playerExists === true){
      navigate("/main", { replace: true });
    }
  }, []);

  const handleCharacterSelect = async (characterType: CharacterType) => {
    try {
      setSelectedCharacter(characterType.id);
      
      console.log(`🎯 Creating ${characterType.name} character...`);
      
      const result = await spawnPlayerWithCharacter(characterType.id);
      
      if (result.success) {
        console.log("🎉 Character created successfully!");
        
        // Wait a bit longer to ensure player data is fully updated in the store
        console.log("⏳ Waiting for player data to be fully updated...");
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log("🚀 Redirecting to game...");
        navigate("/main", { replace: true });
      } else {
        console.error("❌ Failed to create character:", result.error);
        setSelectedCharacter(null);
      }
    } catch (err) {
      console.error("❌ Error creating character:", err);
      setSelectedCharacter(null);
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
      navigate('/login');
    } catch (error) {
      console.error("❌ Error during logout:", error);
      // Navigate anyway in case of error
      navigate('/login');
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center relative overflow-hidden">
      {/* Cyberpunk Grid Background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)`,
          backgroundSize: '30px 30px'
        }}></div>
      </div>

      {/* Ambient Effects */}
      <div className="fixed top-0 left-1/4 w-48 h-48 sm:w-64 sm:h-64 lg:w-96 lg:h-96 bg-cyan-500/15 rounded-full blur-3xl animate-pulse pointer-events-none" />
      <div className="fixed top-1/3 right-1/4 w-32 h-32 sm:w-48 sm:h-48 lg:w-64 lg:h-64 bg-blue-500/15 rounded-full blur-3xl animate-pulse pointer-events-none" />
      <div className="fixed bottom-1/4 left-1/3 w-40 h-40 sm:w-60 sm:h-60 lg:w-80 lg:h-80 bg-purple-500/15 rounded-full blur-3xl animate-pulse pointer-events-none" />

      {/* Floating Holographic Elements */}
      <div className="absolute top-20 left-10 w-8 h-8 border border-cyan-400/30 transform rotate-45 animate-pulse"></div>
      <div className="absolute top-32 right-16 w-6 h-6 border border-blue-400/30 transform rotate-45 animate-pulse delay-300"></div>
      <div className="absolute bottom-32 left-20 w-10 h-10 border border-purple-400/30 transform rotate-45 animate-pulse delay-700"></div>

      {/* Main Container */}
      <div className="container mx-auto px-4 py-6 max-w-6xl relative z-10">
        <div className="text-center mb-8">
          {/* Back Button */}
          <Button
            onClick={handleGoBack}
            variant="outline"
            className="absolute top-0 left-0 bg-slate-800/50 border-slate-600/50 text-slate-300 hover:bg-slate-700/50 mb-4"
            disabled={isInitializing || isDisconnecting}
          >
            {isDisconnecting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Disconnecting...
              </>
            ) : (
              <>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </>
            )}
          </Button>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-400 bg-clip-text text-transparent tracking-wider mb-4">
            SELECT CHARACTER
          </h1>
          <p className="text-lg sm:text-xl text-cyan-200/80 font-light tracking-wide max-w-2xl mx-auto">
            Choose your player archetype to begin your football journey
          </p>
          
          {/* Scanning Line */}
          <div className="w-full h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent mt-6 animate-pulse"></div>
        </div>

        {/* Character Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {characterTypes.map((character) => {
            const Icon = character.icon;
            const isSelected = selectedCharacter === character.id;
            const isDisabled = isInitializing && !isSelected;
            
            return (
              <div
                key={character.id}
                className={`relative transform transition-all duration-300 ${
                  isSelected ? 'scale-105' : 'hover:scale-102'
                } ${isDisabled ? 'opacity-50' : ''}`}
              >
                {/* Character Card */}
                <div className={`relative h-96 bg-gradient-to-br from-slate-800/50 to-slate-900/50 border ${character.borderColor} rounded-2xl backdrop-blur-md shadow-2xl shadow-cyan-500/20 overflow-hidden`}>
                  
                  {/* Holographic Corner Effects */}
                  <div className="absolute top-0 left-0 w-16 h-16 border-l-2 border-t-2 border-cyan-400/50 rounded-tl-2xl">
                    <div className="absolute top-2 left-2 w-3 h-3 border border-cyan-400/70 transform rotate-45"></div>
                  </div>
                  <div className="absolute top-0 right-0 w-16 h-16 border-r-2 border-t-2 border-cyan-400/50 rounded-tr-2xl">
                    <div className="absolute top-2 right-2 w-3 h-3 border border-cyan-400/70 transform rotate-45"></div>
                  </div>

                  {/* Content */}
                  <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-6 relative z-10">
                    
                    {/* Character Icon */}
                    <div className={`w-20 h-20 bg-gradient-to-br ${character.bgGradient} rounded-full flex items-center justify-center shadow-lg relative`}>
                      <Icon className={`w-10 h-10 ${character.color}`} />
                      {/* Rotating ring */}
                      <div className={`absolute inset-0 rounded-full border-2 ${character.borderColor} animate-spin-slow`}></div>
                    </div>

                    {/* Character Info */}
                    <div className="space-y-3">
                      <h3 className={`text-2xl font-bold ${character.color} tracking-wider`}>
                        {character.name}
                      </h3>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        {character.description}
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="w-full space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-400">SHOOT</span>
                        <div className="flex space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <div
                              key={i}
                              className={`w-2 h-2 rounded-full ${
                                i < character.stats.shoot / 20 ? 'bg-red-400' : 'bg-slate-600'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-400">DRIBBLE</span>
                        <div className="flex space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <div
                              key={i}
                              className={`w-2 h-2 rounded-full ${
                                i < character.stats.dribble / 20 ? 'bg-cyan-400' : 'bg-slate-600'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-400">CHARISMA</span>
                        <div className="flex space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <div
                              key={i}
                              className={`w-2 h-2 rounded-full ${
                                i < character.stats.charisma / 20 ? 'bg-purple-400' : 'bg-slate-600'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-400">ENERGY</span>
                        <div className="flex space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <div
                              key={i}
                              className={`w-2 h-2 rounded-full ${
                                i < character.stats.energy / 20 ? 'bg-pink-400' : 'bg-slate-600'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-400">STAMINA</span>
                        <div className="flex space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <div
                              key={i}
                              className={`w-2 h-2 rounded-full ${
                                i < character.stats.stamina / 20 ? 'bg-purple-400' : 'bg-slate-600'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Select Button */}
                    <Button
                      onClick={() => handleCharacterSelect(character)}
                      disabled={isInitializing}
                      className={`w-full py-3 text-base font-bold bg-gradient-to-r ${character.bgGradient} hover:from-${character.color.split('-')[1]}-500/30 hover:to-${character.color.split('-')[1]}-600/30 border ${character.borderColor} hover:border-${character.color.split('-')[1]}-400/80 ${character.color} backdrop-blur-sm transition-all duration-300 hover:shadow-lg disabled:opacity-50 relative overflow-hidden`}
                    >
                      {/* Holographic Scan Effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-1000"></div>
                      
                      {isSelected && isInitializing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          CREATING...
                        </>
                      ) : (
                        <>
                          SELECT {character.name}
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Loading Overlay */}
                  {isSelected && isInitializing && (
                    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center">
                      <div className="text-center space-y-4">
                        <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mx-auto" />
                        <div className="text-cyan-300 font-medium">
                          Creating {character.name}...
                          {txStatus && (
                            <div className="text-xs text-slate-400 mt-2">
                              Status: {txStatus}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Error Display */}
        {error && (
          <div className="text-center">
            <div className="bg-red-500/20 border border-red-400/50 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Status */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 text-xs text-cyan-400/60">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
            <span className="font-mono">CHARACTER SELECTION INTERFACE v2.1</span>
          </div>
        </div>
      </div>
    </div>
  );
}