const { Router } = require("express");
const router = Router();
const multer = require('multer');
const fs = require('fs').promises;
const fsSync = require('fs');
const Blog = require('../models/blog');
const path = require('path');
const Comment = require('../models/comment');

const PUBLIC = path.join(__dirname, '..', 'public');
const UPLOADS = path.join(PUBLIC, 'uploads');
if (!fsSync.existsSync(UPLOADS)) {
  fsSync.mkdirSync(UPLOADS, { recursive: true });
}

function canManageBlog(user, blog) {
  if (!user || !blog) return false;
  if (user.role === 'ADMIN') return true;
  const authorId = blog.createdBy && blog.createdBy._id ? blog.createdBy._id : blog.createdBy;
  if (!authorId) return false;
  return String(authorId) === String(user._id);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS);
  },
  filename: function (req, file, cb) {
    const fileName = `${Date.now()}-${file.originalname}`;
    cb(null, fileName);
  },
});

const upload = multer({ storage: storage });

/* ——— Register specific paths before GET /:id ——— */

router.get('/add-new', (req, res) => {
  return res.render('addblog', {
    user: req.user,
  });
});

router.post('/', upload.single('CoverImage'), async (req, res) => {
  const { title, body } = req.body;
  const blog = await Blog.create({
    body,
    title,
    createdBy: req.user._id,
    coverImageURL: `/uploads/${req.file.filename}`,
  });
  return res.redirect(`/blog/${blog._id}`);
});

/** GET /blog/edit/:id — also registered on `app` in index.js so it always matches */
async function getEditPage(req, res) {
  if (!req.user) {
    return res.redirect('/user/signin');
  }
  let blog;
  try {
    blog = await Blog.findById(req.params.id).populate('createdBy');
  } catch {
    return res.status(404).render('not-found', { user: req.user, path: req.path });
  }
  if (!blog) {
    return res.redirect('/');
  }
  if (!canManageBlog(req.user, blog)) {
    return res.status(403).send('You do not have permission to edit this post.');
  }
  return res.render('editblog', {
    user: req.user,
    blog,
  });
}

router.post('/edit/:id', upload.single('CoverImage'), async (req, res) => {
  if (!req.user) {
    return res.redirect('/user/signin');
  }
  let blog;
  try {
    blog = await Blog.findById(req.params.id).populate('createdBy');
  } catch {
    return res.status(404).render('not-found', { user: req.user, path: req.path });
  }
  if (!blog) {
    return res.redirect('/');
  }
  if (!canManageBlog(req.user, blog)) {
    return res.status(403).send('You do not have permission to edit this post.');
  }
  const { title, body } = req.body;
  if (title) blog.title = title.trim();
  if (body !== undefined) blog.body = body;
  if (req.file) {
    if (blog.coverImageURL && blog.coverImageURL.startsWith('/uploads/')) {
      const oldPath = path.join(PUBLIC, blog.coverImageURL.replace(/^\//, ''));
      try {
        await fs.unlink(oldPath);
      } catch {
        /* ignore */
      }
    }
    blog.coverImageURL = `/uploads/${req.file.filename}`;
  }
  await blog.save();
  return res.redirect(303, `/blog/${blog._id}`);
});

router.post('/delete/:id', async (req, res) => {
  if (!req.user) {
    return res.redirect('/user/signin');
  }
  let blog;
  try {
    blog = await Blog.findById(req.params.id).populate('createdBy');
  } catch {
    return res.status(404).render('not-found', { user: req.user, path: req.path });
  }
  if (!blog) {
    return res.redirect(303, '/');
  }
  if (!canManageBlog(req.user, blog)) {
    return res.status(403).send('You do not have permission to delete this post.');
  }
  await Comment.deleteMany({ blogId: blog._id });
  if (blog.coverImageURL && blog.coverImageURL.startsWith('/uploads/')) {
    const filePath = path.join(PUBLIC, blog.coverImageURL.replace(/^\//, ''));
    try {
      await fs.unlink(filePath);
    } catch {
      /* file missing */
    }
  }
  await Blog.findByIdAndDelete(blog._id);
  return res.redirect(303, '/');
});

router.post('/comment/:blogId', async (req, res) => {
  await Comment.create({
    content: req.body.content,
    blogId: req.params.blogId,
    createdBy: req.user._id,
  });
  return res.redirect(`/blog/${req.params.blogId}`);
});

router.get('/:id', async (req, res) => {
  let blog;
  try {
    blog = await Blog.findById(req.params.id).populate('createdBy');
  } catch {
    return res.status(404).render('not-found', { user: req.user, path: req.path });
  }
  if (!blog) {
    return res.status(404).render('not-found', { user: req.user, path: req.path });
  }
  const comments = await Comment.find({ blogId: req.params.id }).populate('createdBy');
  const canManage = canManageBlog(req.user, blog);
  return res.render('blog', {
    user: req.user,
    blog,
    comments,
    canDelete: canManage,
    canEdit: canManage,
  });
});

router.getEditPage = getEditPage;
module.exports = router;
