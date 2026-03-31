const User = require('../models/user');

function getSigninPage(req, res) {
  return res.render('signin');
}

function getSignupPage(req, res) {
  return res.render('signup');
}

async function getProfilePage(req, res) {
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
}

async function signin(req, res) {
  const { email, password } = req.body;
  try {
    const token = await User.matchpasswordandgeneratetoken(email, password);
    return res.cookie('token', token).redirect('/');
  } catch (error) {
    return res.render('signin', {
      error: 'Incorrect email or password',
    });
  }
}

async function signup(req, res) {
  const { fullName, email, password } = req.body;
  await User.create({
    fullName,
    email,
    password,
  });
  return res.redirect('/');
}

function logout(req, res) {
  return res.clearCookie('token').redirect('/');
}

module.exports = {
  getSigninPage,
  getSignupPage,
  getProfilePage,
  signin,
  signup,
  logout,
};
