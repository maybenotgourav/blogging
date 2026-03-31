const { Router } = require("express");
const router = Router();
const multer = require('multer');
const fsSync = require('fs');
const path = require('path');
const blogController = require('../controllers/blogController');

const UPLOADS = path.join(__dirname, '..', 'public', 'uploads');
if (!fsSync.existsSync(UPLOADS)) {
  fsSync.mkdirSync(UPLOADS, { recursive: true });
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

router.get('/add-new', blogController.getAddNewPage);
router.post('/', upload.single('CoverImage'), blogController.createBlog);
router.get('/edit/:id', blogController.getEditPage);
router.post('/edit/:id', upload.single('CoverImage'), blogController.updateBlog);
router.post('/delete/:id', blogController.deleteBlog);
router.post('/comment/:blogId', blogController.addComment);
router.get('/:id', blogController.getBlogById);
module.exports = router;
