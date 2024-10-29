const express=require('express');

const router=express.Router();

const User=require('../models/User.js');
const { generatetoken, jwtMiddleware } = require('../jwt.js');

// Signup route
router.post('/signup',async(req,res)=>{
    try {
        const data=req.body;
    
        const new_User=new User(data);      // creates new user model 

        const result=await new_User.save();     //Saves the new user to database
        console.log('Data saved Successfully!');

        const payload={
            id:result.id,
            email:result.email,
            name:result.name
        }

        // Generate token from payload
        const token=generatetoken(payload);
        console.log('Token generated successfully');
        res.status(200).json({response:result,token:token});
        
    } 
    catch (err) {
        console.log(err);
        res.status(500).json({error:'Internal Server Error'});
    }
});

// Login route
router.post('/login',async(req,res)=>{
    try {
        
        const {email,password}=req.body;    // taking email and password from user
    
        // Finding the user with aadhar number
        const user=await User.findOne({email:email});

        // console.log(user);
    
        // if user does not exist or password is incorrect
        
        if(!user || !(await user.comparePassword(password))){
            return res.status(400).json({error:'Invalid Username or password'});
        }

        // if all the conditions are checked, create a payload using user data
        const payload={
            id:user.id,
            email:user.email,
            name:user.name
        }

        // Generate token from payload
        const token=generatetoken(payload);
        res.status(200).json({response:user,token:token});

    } 
    catch (err) {
        console.log(err);
        res.status(500).json({error:'Internal server error'});
    }

});

// Profile route
router.get('/profile',jwtMiddleware,async (req,res)=>{

    try {
        
        const data=req.user;    // during jwt verification, data is stored in req.user
    
        const user=await User.findById(data.id);
        console.log('Data fetched successfully!');
        res.status(200).json(data);
    } 
    catch (err) {
        console.log(err);
        res.status(500).json({err:'Internal Server Error'});
    }
})

// Update password
router.put('/password',jwtMiddleware,async (req,res)=>{

    try {
        
        // during jwt verification, data is stored in req.user
        // const data=req.user;

        const user=await User.findById(req.user.id);
    
        const new_password=req.body;    //only require updated password in body

        user.password=new_password.password;
        await user.save();
    
        // const new_user=await User.findByIdAndUpdate(data.id,new_password,{
        //     new:true,
        //     runValidators:true
        // });

        console.log('Password Saved successfully!');
        res.status(200).json({msg:'Password saved successfully'});
    } 
    catch (err) {
        console.log(err);
        res.status(500).json({err:'Internal Server Error'});
    }
})

module.exports=router;

// Update password route
