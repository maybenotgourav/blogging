const fs = require('fs').promises;
const path = require('path');
const Blog = require('../models/blog');
const Comment = require('../models/comment');

const PUBLIC = path.join(__dirname, '..', 'public');

function canManageBlog(user, blog) {
  if (!user || !blog) return false;
  if (user.role === 'ADMIN') return true;
  const authorId = blog.createdBy && blog.createdBy._id ? blog.createdBy._id : blog.createdBy;
  if (!authorId) return false;
  return String(authorId) === String(user._id);
}

function getAddNewPage(req, res) {
  return res.render('addblog', {
    user: req.user,
  });
}

async function createBlog(req, res) {
  const { title, body } = req.body;
  const blog = await Blog.create({
    body,
    title,
    createdBy: req.user._id,
    coverImageURL: `/uploads/${req.file.filename}`,
  });
  return res.redirect(`/blog/${blog._id}`);
}

async function getEditPage(req, res) {
  if (!req.user) return res.redirect('/user/signin');
  let blog;
  try {
    blog = await Blog.findById(req.params.id).populate('createdBy');
  } catch {
    return res.status(404).render('not-found', { user: req.user, path: req.path });
  }
  if (!blog) return res.redirect('/');
  if (!canManageBlog(req.user, blog)) {
    return res.status(403).send('You do not have permission to edit this post.');
  }
  return res.render('editblog', {
    user: req.user,
    blog,
  });
}

async function updateBlog(req, res) {
  if (!req.user) return res.redirect('/user/signin');
  let blog;
  try {
    blog = await Blog.findById(req.params.id).populate('createdBy');
  } catch {
    return res.status(404).render('not-found', { user: req.user, path: req.path });
  }
  if (!blog) return res.redirect('/');
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
      } catch (err) {
        console.error('Error deleting file:', err);
      }
    }
    blog.coverImageURL = `/uploads/${req.file.filename}`;
  }

  await blog.save();
  return res.redirect(303, `/blog/${blog._id}`);
}

async function deleteBlog(req, res) {
  if (!req.user) return res.redirect('/user/signin');
  let blog;
  try {
    blog = await Blog.findById(req.params.id).populate('createdBy');
  } catch {
    return res.status(404).render('not-found', { user: req.user, path: req.path });
  }
  if (!blog) return res.redirect(303, '/');
  if (!canManageBlog(req.user, blog)) {
    return res.status(403).send('You do not have permission to delete this post.');
  }

  await Comment.deleteMany({ blogId: blog._id });
  if (blog.coverImageURL && blog.coverImageURL.startsWith('/uploads/')) {
    const filePath = path.join(PUBLIC, blog.coverImageURL.replace(/^\//, ''));
    try {
      await fs.unlink(filePath);
    } catch (err) {
      console.error('Error deleting file:', err);
    }
  }
  await Blog.findByIdAndDelete(blog._id);
  return res.redirect(303, '/');
}

async function addComment(req, res) {
  await Comment.create({
    content: req.body.content,
    blogId: req.params.blogId,
    createdBy: req.user._id,
  });
  return res.redirect(`/blog/${req.params.blogId}`);
}

async function getBlogById(req, res) {
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
}

module.exports = {
  getAddNewPage,
  createBlog,
  getEditPage,
  updateBlog,
  deleteBlog,
  addComment,
  getBlogById,
};
