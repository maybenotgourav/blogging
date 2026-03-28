const path = require('path');
const express = require("express");
const mongoose = require('mongoose');
const cookieparser = require("cookie-parser");
const Blog = require("./models/blog")

const userRoute = require('./routes/user');
const blogRoute = require('./routes/blog');
const { checkForAuthenticationCookie } = require('./middlewares/authentication');

const app = express();
const PORT = 8000;

const ROOT = __dirname;

app.use(express.urlencoded({extended : true}));
app.use(cookieparser());
app.use(checkForAuthenticationCookie("token"));

app.set('view engine' , 'ejs')
app.set('views' , path.join(ROOT, 'views'))

mongoose
.connect('mongodb://127.0.0.1:27017/blogify')
.then((e)=>console.log("mongodb connected"));


app.get('/', async(req,res) => {
    const allblogs = await Blog.find({}).sort("createdAt");
    res.render('home',{
        user : req.user,
        blogs: allblogs,
    })
})

app.use("/user", userRoute);

/* Edit page: register on app before static + blog router so GET always hits Express */
app.get('/blog/edit/:id', blogRoute.getEditPage);
app.use("/blog", blogRoute);

/* Static files after routes — avoids /blog/* being swallowed by express.static */
app.use(express.static(path.join(ROOT, 'public')));

app.use((req, res) => {
    res.status(404).render('not-found', {
        user: req.user,
        path: req.path,
    });
});

app.listen(PORT , () => console.log("server started at port : " + PORT));
