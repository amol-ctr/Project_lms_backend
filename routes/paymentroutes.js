const express=require('express');
const router=express.Router();
require('dotenv').config();
const stripe=require('stripe')(process.env.STRIPE_SECRET_KEY);  // IMPORTING MODULE STRIPE USING ITS SECRET KEY

router.post('/',async(req,res)=>{
    try {
        const { amount }=req.body;
        const paymentIntent=await stripe.paymentIntents.create(
            {
                amount:amount,
                currency:'INR',
            }
        );
        res.json({ clientSecret:paymentIntent.client_secret});
    } 
    catch (err) {
        res.status(500).json({error:err});
    }
});

module.exports=router;