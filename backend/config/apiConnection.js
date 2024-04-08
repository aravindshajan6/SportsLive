/* eslint-disable no-mixed-spaces-and-tabs */

// LIVESCORE SPORTS API && LIVESCORE6 API

//LiveScore sports
const optionsRapid = {
	method: 'GET',
	headers: {
		'X-RapidAPI-Key': '4ea814db73msh0f3cacd702dd95dp100828jsn1527211b69e7',
		'X-RapidAPI-Host': 'livescore-sports.p.rapidapi.com'
	}
};

//Events Live List (score cards) - HomeScreen

const urlForLiveEvents = 'https://livescore-sports.p.rapidapi.com/v1/events/live?sport=soccer&timezone=0&locale=EN';

const optionsForLiveEvents = {
	method: 'GET',
	headers: {
		'X-RapidAPI-Key': '4ea814db73msh0f3cacd702dd95dp100828jsn1527211b69e7',
		'X-RapidAPI-Host': 'livescore-sports.p.rapidapi.com'
	}
};

//event statistics

const url3 = 'https://livescore-sports.p.rapidapi.com/v1/events/statistics?locale=EN&sport=soccer&event_id=702080';


//event comments 
const url4 = 'https://livescore-sports.p.rapidapi.com/v1/events/comments?locale=EN&sport=soccer&event_id=702080';


//news
// category-football : id : '2021020913320920836'

 const urlForNews = 'https://livescore6.p.rapidapi.com/news/v2/list-by-sport?category=2021020913320920836&page=1';

 const optionsNews = {
	method: 'GET',
	headers: {
		'X-RapidAPI-Key': '4ea814db73msh0f3cacd702dd95dp100828jsn1527211b69e7',
		'X-RapidAPI-Host': 'livescore6.p.rapidapi.com'
	}
};

module.exports = {urlForLiveEvents, optionsForLiveEvents, urlForNews, optionsRapid, optionsNews };