
const commentModel = require('../models/commentModel');
const userModel = require('../models/userModel');
const jwt = require('jsonwebtoken');

const sk = process.env.SECRET_KEY;



 //check email already in DB if not add used data to db
exports.postSignupDetails = async (req, res) => {
    console.log('signup page post .');
    console.log("signup Req BODY : ", req.body);
    const { username, password, email } = req.body;

    try {
        
        //check if email already in DB
        let userExist = await userModel.findOne({email});
        if(userExist){
            res.json({userExist});
        } else {
            //create new user 
            let newUser = await userModel.create(req.body);
            await newUser.save();
            res.json({newUser});
        }
        
    } catch (error) {
        console.log(error.message)
    }

}

//check user data in db and return existing user
exports.checkLoginDetails = async (req, res) => {
    console.log('login page post .');
    console.log("login Req BODY : ", req.body);
    const {username, password} = req.body;
    const userNotExist = {
        message: 'User not found'}
    try {

       const userExist =  await userModel.findOne({username, password}) ;
       if(userExist){

            //create payload for jwt token 
            const data = {
                username: userExist.username,
                date: Date(),
            }

            //create token using sign()
            const token = jwt.sign(data, process.env.SECRET_KEY,
                {expiresIn:"1h" });
                console.log("Token : ", token);

            //send token along with response
            return res.cookie('token', token).status(200).json({userExist, token});

       } else {
            console.log("user not found !!!");
            return res.json({userNotExist})
            
        }
    } catch (error) {
        console.log(error.message);
    }

}

//add user comments to DB with matchID and username
exports.addUserComment = async (req, res) => {
    console.log('add comment route .');
    const {matchId, username, userComment } = req.body;
    console.log("author: ", username, matchId);
    console.log("comment from body: ", userComment);
    try {

        let newComment = await commentModel.create(req.body);
        await newComment.save();
        res.json({newComment});
        console.log("commented added");

    } catch (error) {
        console.log(error.message);
    }
}

//update user profile details
exports.updateUser = async (req, res) => {
    console.log('inside update user');
    const {username, email, password, _id } = req.body;
    console.log('details: ',username,  _id, password, email);
    try {
        const updatedUser = await userModel.findByIdAndUpdate(_id, {
            username, password, email
        })
        if(!updatedUser) {
            console.log("User not found !");
        }else {
            console.log("User Updated Successfully!");
            res.json({updatedUser});
        }
    } catch (error) {
        console.log(error.message);
    }


}

//get user profile
exports.getUserProfile = async (req, res) => {
    console.log("inside profile route");
    const { token, username } = req.body;
    console.log("Token inside profile route : ",username, token)
    try {
        const tokenVerify = jwt.verify(token, sk)
        console.log("verified Token : ", tokenVerify);
  
        //get user details
        const userExist = await userModel.findOne({username: tokenVerify.username});
        if(userExist){
            console.log("user found :", userExist);
            res.json(userExist).status(200);

        } else {
            res.status(404).json("user not found");
            
        }
    } catch (error) {
        console.log("token verification failed : ", error.message);
    }
    
}