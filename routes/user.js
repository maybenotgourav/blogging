const { Router } = require("express");
const router = Router();
const userController = require('../controllers/userController');

router.get('/signin', userController.getSigninPage);
router.get('/signup', userController.getSignupPage);
router.get('/profile', userController.getProfilePage);
router.post('/signin', userController.signin);
router.post('/signup', userController.signup);
router.get('/logout', userController.logout);

module.exports = router;