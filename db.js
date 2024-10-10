const mongoose=require('mongoose');
require('dotenv').config();

// saving mongodb connection URL in string
// const mongoUrl=process.env.MONGODB_URL_LOCAL;

const mongoUrl=process.env.MONGODB_URL;

// set up mongodb connection using mongoose
mongoose.connect(mongoUrl,{
        useNewUrlParser:true,
        useUnifiedTopology:true
    }
)

const db=mongoose.connection;   //mongoose connection object representing mongoDB connection

// defining event listeners
db.on('connected',()=>{
    console.log('Connected to MongoDb server')
});

db.on('disconnected',()=>{
    console.log('Successfully Disconnected')
});
db.on('error',(err)=>{
    console.log('MongoDb error:',err);
});

module.exports=db;  //export db object to use it as a part of nodejs



