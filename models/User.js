const mongoose=require('mongoose');
const bcrypt=require('bcrypt');

const UserSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        unique:true
    },
    password:{
        type: String,
        required:true
    }
});

// Hashing of password(similar to middleware)
UserSchema.pre('save',async function(next){
    const person=this;

    // if no change in password
    if(!this.isModified('password')){
        return next();
    }

    try {
        
        // Generating salt for mixing
        const salt=await bcrypt.genSalt(10);

        // Generating hashed password mixing salt with our password
        const hashed_password=await bcrypt.hash(person.password,salt);

        // Now make the password encrypted
        person.password=hashed_password;
        next();
    } 
    catch (err) {
        next(err);
    }

})

// checking password entered by user 
UserSchema.methods.comparePassword=async function(Password){
    try {
        const is_matching=await bcrypt.compare(Password,this.password);
        return is_matching;
    } 
    catch (err) {
        throw err;
    }
}

const User=mongoose.model('User',UserSchema);
module.exports=User;