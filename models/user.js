const { Schema,model } = require('mongoose');
const { createHmac, randomBytes } = require('crypto');
const { createtokenfromuser } = require('../services/authentication');

const userSchema = new Schema({
    fullName : {
        type : String,
        required : true,
    },
    email : {
        type : String,
        required : true,
        unique : true
    },
    salt : {
        type : String,
    },
    password : {
        type : String,
        required : true,
    },
    profilePicture : {
        type : String,
        default : "/images/download.png",
    },
    role : {
        type : String,
        enum : ["ADMIN","USER"],
        default : "USER"
   }
},{ timestamps : true}
);

userSchema.statics.matchpasswordandgeneratetoken = async function (email,password) { 
    const user = await this.findOne({email});
    if(!user) throw new Error('User not found!');  
    
    const salt = user.salt;
    const hashpassword = user.password;
    const userProvidedhash = createHmac('sha256' , salt)
    .update(password)
    .digest("hex");
    if(hashpassword!==userProvidedhash)  throw new Error('User not found!');  
    const token = createtokenfromuser(user);
    return token;
}

userSchema.pre('save', function(next) {
    const user = this;
    if(!user.isModified("password")) return;
    const salt = randomBytes(16).toString();
    const hashedPass = createHmac('sha256' , salt)
    .update(user.password)
    .digest("hex");
    this.salt = salt;
    this.password = hashedPass;
    next();
});

const User = model("user",userSchema); 
module.exports =User