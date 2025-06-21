import { useEffect, useState } from "react";
import { usePlayer } from "../../dojo/hooks/usePlayer";
import { useStarknetConnect } from "../../dojo/hooks/useStarknetConnect";

export default function MainScreen() {
    const [playerStats, setPlayerStats] = useState({
        stamina: 0,
        energy: 0,
        charisma: 0,
        dribble: 0,
        fame: 0,
    });
        const { player, isLoading: playerLoading } = usePlayer();   
    const { handleDisconnect } = useStarknetConnect();

  useEffect(() => {
    console.log("🎯 MainScreen rendered");
    if(playerLoading === false && player !== null){
        setPlayerStats({
            stamina: player.stamina,
            energy: player.energy,
            charisma: player.charisma,
            dribble: player.dribble,
            fame: player.fame,
        });
    }
  }, [playerLoading, player]);

  return <div>
   
    <div>
      <h1>Stamina: {playerStats.stamina} </h1>
      <h1>Energy: {playerStats.energy} </h1>
      <h1>Charisma: {playerStats.charisma} </h1>
      <h1>Dribble: {playerStats.dribble} </h1>
      <h1>Fame: {playerStats.fame} </h1>
    </div>


  <button onClick={() => {
    handleDisconnect();
  }}>Disconnect</button>
  </div>;
}   