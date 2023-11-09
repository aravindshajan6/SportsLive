import { useState } from "react";
import SelectedMatchContext from "./SelectedMatchContext";

// eslint-disable-next-line react/prop-types
const SelectedMatchContextProvider = ({children}) => {
    const [eventList, setEventList] = useState([]);
    const [matchDetails, setMatchDetails] = useState([]);
    const [matchId, setMatchId] = useState(702080);
    const [user, setUser ] = useState(null);
    const [newsId, setNewsId] = useState('2023102811333151732');
    const [newsContext, setNewsContext ] = useState();


    return (
        <SelectedMatchContext.Provider value={{matchId, setMatchId, eventList, setEventList, matchDetails, setMatchDetails, user, setUser, newsContext, setNewsContext, newsId, setNewsId}}>
            {children}
        </SelectedMatchContext.Provider>
    )
};

export default SelectedMatchContextProvider; 