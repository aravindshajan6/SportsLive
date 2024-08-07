const mongoose = require('mongoose');

const dbConnection = () => {
    console.log("aaaaaaaaaaa  : ", process.env.AAA);
    mongoose.connect(process.env.mongoAtlasURI, 
    {useUnifiedTopology: true},
    {useNewUrlParser: true})
    .then((data) => console.log(`connected with DB ${data.connection.host}`))
    .catch((error) => console.log(error.message));
}

    module.exports = dbConnection;