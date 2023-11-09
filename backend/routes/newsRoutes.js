const express = require('express');
const { urlForNews, optionsNews } = require('../config/apiConnection');

const router = express.Router();

router.get('/getnews', async (req, res) => {
    console.log("inside getnews route");
    try {
        const response = await fetch(urlForNews, optionsNews)
        if(response.ok) {
            const jsonResponse = await response.json();
            res.json({jsonResponse});
        } else {
            console.log("req failed with status: ", response.status);
        }

    } catch (error) {
        console.log(error.message);
    }
})

module.exports = router;