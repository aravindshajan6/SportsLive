import {  useContext, useEffect, useState } from 'react';
import './SelectedMatch.css';
import { useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import Commentary from '../Commentary/Commentary';
import SelectedMatchContext from '../../context/SelectedMatchContext';
import Loader from '../Spinner/Loader';


const SelectedMatch = () => {

  const [teamDetails, setTeamDetails ]  = useState([]);
  const [selectedMatch, setSelectedMatch ] = useState('');
  // let { matchId } = useParams();
  const location = useLocation();
  const {matchId, setMatchId } = useContext(SelectedMatchContext);
  
  // if(matchId !== 0){
  //   setMatchId(matchId); 
  // }
 
  //call API
  useEffect(() => {
     
    // getMatchData(); 
    // getTeamLineups();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  const callApiFn = () => {
    getMatchData(); 
    getTeamLineups();
  }


  //fn for getting match data using matchId
   const getMatchData = async () => {
    window.scrollTo(0, 0);
    try {
      let matchData;
        // eslint-disable-next-line no-unused-vars
        const response = await axios.get(`http://localhost:4000/match/${matchId}`)
                              .then((data) => {
                                console.log('match data from axios req : ', data.data.jsonResponse.DATA);
                                matchData = data.data.jsonResponse.DATA;
                                setSelectedMatch(matchData);
                              })
    } catch (error) {
      console.log(error.message);
    }
  }
 
  //fn for getting team lineups using matchId
  // eslint-disable-next-line no-unused-vars
  const getTeamLineups = async () => {
    window.scrollTo(0, 0);
    try {
      let matchData;
        // eslint-disable-next-line no-unused-vars
        const response = await axios.get(`http://localhost:4000/match/${matchId}/lineups`)
                              .then((data) => {
                                console.log('Lineup data from axios req : ', data.data.jsonResponse.DATA);
                                matchData = data.data.jsonResponse.DATA;
                                setTeamDetails(matchData);
                              })
    } catch (error) {
      console.log(error.message);
    }
  }


  console.log("Selected match Final : ", selectedMatch);
  console.log("Selected match Lineups : ", teamDetails);
  
  
  
  return (
    <>
    
    <div className="top-heading">
    
      { !selectedMatch && 
      <>
        <h2>Match Details</h2>
        <button className="callAPI" onClick={callApiFn}>
         Match Scoreboard
        </button>
      </>
      }
    </div>

      {
        !selectedMatch ? <Loader /> :  
        <div className='selected-container'>
          <h3>League : {selectedMatch.STAGE.STAGE_NAME}</h3>
          <div className="live-div">
                  <h3 className='blink'> <span> LIVE</span> </h3>
                  <button className='football-button'>
                    <div className="football active rotating">
                    </div>
                  </button> 
          </div>
          <div className="main-card">
            
            <div className="top-card ">
              {
                !selectedMatch ? <Loader /> : 
                <div className='selected-header'>
                  <div className="team-scorer">                       
                  </div>
                <div className="team-div home-td">
                    <h2>{selectedMatch.HOME_TEAM[0].NAME}</h2>
                    <div className='team-sub-div'>
                      <img className='team-logo' alt='home_img' src={selectedMatch.HOME_TEAM[0].BADGE_SOURCE}   />
                      <h3>{selectedMatch.HOME_TEAM[0].ABBREVIATION}</h3>
                    </div>
                </div>
                <div className="selected-score">
                    <h1>{ selectedMatch.HOME_SCORE!== 'undefined' ? `${selectedMatch.HOME_SCORE} : ${selectedMatch.AWAY_SCORE}` : '0 : 0' }</h1>
                  
                    <p>{selectedMatch.MATCH_STATUS }</p>
                </div>

                <div className="team-div away-td">
                    <div className='team-sub-div'>
                        <img className='team-logo' alt='away_logo'src={selectedMatch.AWAY_TEAM[0].BADGE_SOURCE} />
                        <h3>{selectedMatch.AWAY_TEAM[0].ABBREVIATION}</h3>
                    </div>
                      <h2>{selectedMatch.AWAY_TEAM[0].NAME}</h2>
                    <div className="team-scorer">
                    </div>
                </div>

                </div>
              }
                
            </div>
            <div className="commentary"> 
              <Commentary />
            </div>
            <div className="lineup-details-container">
              <div className="main-container">
                  <h1>Lineups</h1>
                  <div className="lineup-container">
                      <div className="home-team">
                              <h2>HOME</h2>
                              <table >
                                <thead>
                                    <tr>
                                        <th>Player Name</th>
                                        <th>Position</th>
                                        <th>Number</th>
                                    </tr>
                                </thead>
                                <tbody>
                                  { teamDetails.LINEUPS &&
                                    teamDetails.LINEUPS[0].PLAYERS.map((player, index) => (
                                      <tr className='players-list-tr' key={index}>
                                        <td>{player.PLAYER_FIRST_NAME + " " + player.PLAYER_LAST_NAME}</td>
                                        <td>{player.PLAYER_POSITION_NAME}</td>
                                        <td>{player.PLAYER_NUMBER}</td>
                                      </tr>
                                    ))
                                  }
                                </tbody>
                          
                              </table>
                      </div>
                      <div className="away-team">
                              <h2>AWAY</h2>
                              <table >
                                <thead>
                                    <tr>
                                        <th>Player Name</th>
                                        <th>Position</th>
                                        <th>Number</th>
                                    </tr>
                                </thead>
                                <tbody>
                                  { (teamDetails.LINEUPS && teamDetails.LINEUPS[0] && teamDetails.LINEUPS[1]) && 
                                    teamDetails.LINEUPS[1].PLAYERS.map((player, index) => (
                                      <tr key={index}>
                                        <td>{player.PLAYER_FIRST_NAME + " " + player.PLAYER_LAST_NAME}</td>
                                        <td>{player.PLAYER_POSITION_NAME}</td>
                                        <td>{player.PLAYER_NUMBER}</td>
                                      </tr>
                                    ))
                                  }
                                </tbody>
                          
                              </table>
                      </div>    
                  </div>
              </div>
              
            </div>
          </div>
          
        </div>
      }
    </>
    
   
  )
}

export default SelectedMatch