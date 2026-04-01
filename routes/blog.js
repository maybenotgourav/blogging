const { Router } = require("express");
const router = Router();
const multer = require("multer");
const blogController = require("../controllers/blogController");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get("/add-new", blogController.getAddNewPage);
router.post("/", upload.single("CoverImage"), blogController.createBlog);
router.get("/edit/:id", blogController.getEditPage);
router.post(
  "/edit/:id",
  upload.single("CoverImage"),
  blogController.updateBlog,
);
router.post("/delete/:id", blogController.deleteBlog);
router.post("/comment/:blogId", blogController.addComment);
router.get("/:id", blogController.getBlogById);
module.exports = router;
