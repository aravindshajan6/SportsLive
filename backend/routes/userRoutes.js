const express = require('express');

 const { checkLoginDetails, postSignupDetails, addUserComment, updateUser, getUserProfile } = require('../controllers/userControllers');




const router = express.Router();

//check email already in DB if not add used data to db
router.post('/signup', postSignupDetails )

//check user data in db and return existing user
router.post('/login', checkLoginDetails )

//get user profile
router.post('/profile', getUserProfile);

//add user comment to DB
router.post('/addcomment', addUserComment);

//update user details
router.post('/update', updateUser)

module.exports = router;