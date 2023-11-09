const express = require('express');

// const { urlForLiveEvents, optionsForLiveEvents } = require('../config/apiConnection');
const router = express.Router();

const { getLiveEvents, getSelectedMatchInfo, getMatchLineups, getMatchStatistics, getMatchComments , getCom} = require('../controllers/matchController');


router.get('/', getLiveEvents);

router.get('/match/:matchId', getSelectedMatchInfo);

router.get('/match/:matchId/lineups', getMatchLineups);

router.get('/match/:matchId/statistics', getMatchStatistics);

router.get('/match/:matchId/comments', getMatchComments) //commentary

router.post('/match/getcom', getCom ); //user comments on matches


module.exports = router; 