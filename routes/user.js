const { Router } = require("express");
const User = require("../models/user")
const router = Router();

router.get('/signin' , (req,res) => {
    res.render("signin");
})
router.get('/signup' , (req,res) => {
    res.render("signup");
})

router.get('/profile', async (req, res) => {
    if (!req.user) {
        return res.redirect('/user/signin');
    }
    const profileUser = await User.findById(req.user._id);
    if (!profileUser) {
        return res.redirect('/user/signin');
    }
    return res.render('profile', {
        user: req.user,
        profileUser,
    });
})

router.post('/signin' , async(req,res)=>{
    const {email,password} = req.body;
    try{
        const token = await User.matchpasswordandgeneratetoken(email,password);
        return res.cookie("token",token).redirect("/");
    }
    catch(error){
        return res.render('signin',{
            error : 'Incorrect email or password',
        })
    }
})
router.post('/signup', async(req,res)=>{
    const {fullName,email,password} = req.body;
    await User.create({
        fullName,
        email,
        password,
    });
    return res.redirect("/")
})

router.get("/logout" , (req,res) => {
    res.clearCookie("token").redirect("/");
})

module.exports = router;