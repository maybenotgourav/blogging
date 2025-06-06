const { Router } = require("express");
const router = Router();
const multer = require('multer');
const Blog = require('../models/blog')
const path = require('path');
const Comment = require('../models/comment')

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.resolve(`./public/uploads`))
  },
  filename: function (req, file, cb) {
     const fileName = `${Date.now()}-${file.originalname}`;
     cb(null,fileName);
  }
})

const upload = multer({ storage: storage })

router.get('/add-new' , (req,res) => {
    return res.render('addBlog' , {
        user : req.user
    })
})

router.post('/' , upload.single('CoverImage') , async (req,res)=>{  
    const { title , body } = req.body;
    const blog = await Blog.create({
        body,
        title,
        createdBy: req.user._id,
        coverImageURL: `/uploads/${req.file.filename}`
    })
    return res.redirect(`/blog/${blog._id}`);
})


router.get('/:id', async (req,res) => {
  console.log("hereeeeeee");
  const blog = await Blog.findById(req.params.id).populate("createdBy");
  console.log(blog);
  const comments = await Comment.find({ blogId : req.params.id }).populate(
    "createdBy"
  );
  console.log("comments : " , comments);
  return res.render("blog", {
    user : req.user,
    blog,
    comments,
  });
});
router.post("/comment/:blogId", async(req,res) => {
  await Comment.create({
    content : req.body.content,
    blogId : req.params.blogId,
    createdBy : req.user._id,
  });
  return res.redirect(`/blog/${req.params.blogId}`);
});

module.exports = router;