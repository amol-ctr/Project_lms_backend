const jwt=require('jsonwebtoken');
require('dotenv').config();

const generatetoken=(userData)=>{
    return jwt.sign(userData,process.env.JWT_SECRET,{expiresIn:3000});
}

// used to create middleware for verifying tokens
const jwtMiddleware=async(req,res,next)=>{
    // First check
    const authorization=req.headers.authorization;  // checks authorization type is bearer token
    if(!authorization){
        return res.status(401).json({error:'Token not found'});
    }
    
    // Extract the tokens from request headers
    const token=authorization.split(' ')[1];
    if(!token){     // if token is not given
        return res.status(401).json({error:'Unauthorized'});
    }
    try {
        // match the token with original token
        const decoded=jwt.verify(token,process.env.JWT_SECRET);

        // Attaches the user info to request
        req.user=decoded;
        next();
    } 
    catch (err) {
        console.log(err);
        return res.status(401).json({error:'Invalid token'});
    }

}

module.exports={jwtMiddleware,generatetoken};