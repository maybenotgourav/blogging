const JWT = require('jsonwebtoken');

const secret = "Realshit";

function createtokenfromuser(user){
    const payload = {
        _id : user.id,
        email : user.email,
        fullName : user.fullName,
        profilePicture : user.profilePicture,
        role : user.role,
    };
    const token = JWT.sign(payload , secret);
    return token
}

function validateToken(token){
    const payload = JWT.verify(token,secret);
    console.log(payload);
    return payload;
}

module.exports = {
    createtokenfromuser,
    validateToken,
}