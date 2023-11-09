const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const dbConnection = require('./config/dbConnection');
const cors = require('cors');
const cookieParser = require('cookie-parser');

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); // Allow all origins for development, but be more restrictive in production.
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
  });

const app = express();
dotenv.config({path: './config/.env'});
app.use(cors());
app.use(cookieParser());
dbConnection(); //db connection

const matchRoutes = require('./routes/matchRoutes');
const userRoutes = require('./routes/userRoutes');
const newsRoutes = require('./routes/newsRoutes');
const contactModel = require('./models/contactModel');

const port = process.env.PORT || 4000;

// const _dirname = path.dirname("")
// const buildPath = path.join(_dirname  , "../frontend/dist");

// app.use(express.static(buildPath))

// app.get("/*", function(req, res){

//     res.sendFile(
//         path.join(__dirname, "../frontend/dist/index.html"),
//         function (err) {
//           if (err) {
//             res.status(500).send(err);
//           }
//         }
//       );

// })


//data parse
app.use(express.urlencoded({extended: true}));
app.use(express.json());

//routes for events (matches)
app.use('/', matchRoutes );

//routes for user
app.use('/user', userRoutes);

//routes for news
app.use('/news', newsRoutes );

app.post('/contact', async (req, res) => {
    console.log('inside contact route');
    const {name, email, message } = req.body;
    console.log(name, email, message);
    try {
        let newMessage = await contactModel.create(req.body);
        await newMessage.save();
        res.json({newMessage});

    } catch (error) {
        console.log(error.message);
    }
})


app.listen(port, () => {
    console.log(`server running on port ${port}`);
})