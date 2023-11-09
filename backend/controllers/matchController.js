const { urlForLiveEvents, optionsForLiveEvents, optionsRapid } = require("../config/apiConnection");
const commentModel = require("../models/commentModel");

//for getting live evens list from api
exports.getLiveEvents = async (req, res) => {
    
    console.log('get events called');
    try {
        console.log("inside fetch for live events");
        const response = await fetch(urlForLiveEvents, optionsForLiveEvents);
        // console.log(response);
        if (response.ok) {            
            const jsonResponse = await response.json(); 
            // console.log(jsonResponse);
            res.json({jsonResponse}); 
        } else {
            console.error('Request failed with status: ', response.status);
        }    
    } catch (error) {
        console.log(error.message);
    }
    
}

//for getting Selected match info
exports.getSelectedMatchInfo = async (req, res) => {
    matchId = req.params.matchId;
    console.log("match ID : ", matchId);

    if(matchId){
        const urlForEventScoreboard = `https://livescore-sports.p.rapidapi.com/v1/events/scoreboard?event_id=${matchId}&sport=soccer&locale=EN`;
        try {
            console.log("inside fetch for event scoreboard");
            const response = await fetch(urlForEventScoreboard, optionsRapid);
            console.log("Response after API call for Selected event info : ", response.ok);
            if(response.ok) {
                const jsonResponse = await response.json(); 
                res.json({jsonResponse});
             } else {
                res.status(404).json({error: 'match not found'});
             }
        } catch (error) {
            console.log(error.message)
        }
        
    }
    
}

//for getting selected math Lineups
exports.getMatchLineups = async (req, res) => {
    matchId = req.params.matchId;
    console.log("match ID : ", matchId);

    if(matchId){
        const urlforLineups = `https://livescore-sports.p.rapidapi.com/v1/events/lineups?event_id=${matchId}&sport=soccer&locale=EN`;
        try {
            console.log("inside fetch for event Lineups");
            const response = await fetch(urlforLineups, optionsRapid);
            console.log("Response after API call for event lineups : ", response.ok);
            if(response.ok) {
                const jsonResponse = await response.json(); 
                res.json({jsonResponse});
             } else {
                res.status(404).json({error: 'match not found'});
             }
        } catch (error) {
            console.log(error.message)
        }
        
    }
    
}

//for getting selected math Statistics
exports.getMatchStatistics = async (req, res) => {
    matchId = req.params.matchId;
    console.log("match ID : ", matchId);

    if(matchId){

        const urlforStatistics = `https://livescore-sports.p.rapidapi.com/v1/events/statistics?locale=EN&sport=soccer&event_id=${matchId}`;
        try {
            console.log("inside fetch for match Statistics");
            const response = await fetch(urlforStatistics, optionsRapid);
            console.log("Response after API call for event statistics: ", response.ok);
            if(response.ok) {
                const jsonResponse = await response.json(); 
                console.log("jsonresponse: ", jsonResponse)
                res.json({jsonResponse});
             } else {
                res.status(404).json({error: 'match not found'});
             }
        } catch (error) {
            console.log(error.message);
        }
        
    }
    
}

//for getting match commentary
exports.getMatchComments = async (req, res) => {
    matchId = req.params.matchId;
    // matchId = 702080;
    console.log("matchId : ", matchId);

    if(matchId) {
        const urlForGettingComments = `https://livescore-sports.p.rapidapi.com/v1/events/comments?locale=EN&sport=soccer&event_id=${matchId}`;
        try {
            const response = await fetch(urlForGettingComments, optionsRapid);
            console.log("response after api call for comments : ", response.ok);
            if(response.ok) {
                const jsonResponse = await response.json();
                // console.log("jsonResponse :" , jsonResponse);
                res.json(jsonResponse);
            }
        } catch (error) {
            res.status(404).json({error: 'match not found'});
        }
    }
}

//getting user comments on matches
exports.getCom = async (req, res) => {
        console.log('inside get comments route');
        const {matchId} = req.body;
        try {
            const usersComments = await commentModel.find({matchId});
            res.json({usersComments});
        } catch (error) {
            console.log(error.message);
        }
    }



    
