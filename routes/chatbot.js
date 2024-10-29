const Dialogflow=require('dialogflow');
const uuid=require('uuid');
require('dotenv').config();

const express=require('express');

const router=express.Router();

// Dialogflow configuration
const projectID=process.env.project_id;
const sessionID=uuid.v4();   //Creates a unique session for a user
const sessionClient=new Dialogflow.SessionsClient();    // used for interaction by user

// console.log(process.env.GOOGLE_APPLICATION_CREDENTIALS);

router.post('/',async(req,res)=>{
    const message=req.body.message;

    // Defining dialogflow request
    const sessionpath=sessionClient.sessionPath(projectID,sessionID);   //generating session path using projectID and sessionID
    const request={
        session:sessionpath,
        queryInput:{
            text:{
                text:message,
                languageCode:'en-US',
            },
        },
    };

    try {
        const response=await sessionClient.detectIntent(request);
        const result=response[0].queryResult;
        res.status(200).json({reply:result.fulfillmentText});
    } 
    catch (err) {
        console.log(err);
        res.status(500).json({error:err});
    }

});

module.exports=router;