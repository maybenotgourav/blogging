const Blog = require('../models/blog');

async function getHomePage(req, res) {
  const allblogs = await Blog.find({}).sort('createdAt');
  return res.render('home', {
    user: req.user,
    blogs: allblogs,
  });
}

module.exports = {
  getHomePage,
};
