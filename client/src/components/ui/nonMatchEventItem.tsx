import React from "react";
import {  NonMatchEvent } from "../../dojo/hooks/useNonMatchEvents";
import { useNavigate } from "react-router-dom";


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
  

type props = {
    event_id: number;
    title: string;
}



const NonMatchEventItem = ( { event_id, title }: props ) => {
    const navigate = useNavigate();
    
    const handleClick = () => {
        navigate(`/non-match-result/${event_id}`);
    }

    return (
        <div onClick={handleClick} className="w-full h-full bg-contain bg-no-repeat bg-center" style={{ backgroundImage: "url('/nonMatchEvent/Event Item.png')" }}>
            <img src={getEventImage(event_id)} alt={title} />
        </div>  
    )
}
    
export default NonMatchEventItem