const fs = require("fs").promises;
const path = require("path");
const cloudinary = require("cloudinary").v2;
const Blog = require("../models/blog");
const Comment = require("../models/comment");

const PUBLIC = path.join(__dirname, "..", "public");

function extractPublicId(url) {
  if (!url || !url.includes("cloudinary")) return null;
  const parts = url.split("/");
  const uploadIndex = parts.indexOf("upload");
  if (uploadIndex === -1) return null;
  const publicIdWithVersion = parts.slice(uploadIndex + 2).join("/");
  return publicIdWithVersion.split(".")[0]; // remove extension
}

function canManageBlog(user, blog) {
  if (!user || !blog) return false;
  if (user.role === "ADMIN") return true;
  const authorId =
    blog.createdBy && blog.createdBy._id ? blog.createdBy._id : blog.createdBy;
  if (!authorId) return false;
  return String(authorId) === String(user._id);
}

function isCloudinaryConfigured() {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
    process.env;
  return (
    CLOUDINARY_CLOUD_NAME &&
    CLOUDINARY_API_KEY &&
    CLOUDINARY_API_SECRET &&
    !CLOUDINARY_CLOUD_NAME.includes("your_") &&
    !CLOUDINARY_API_KEY.includes("your_") &&
    !CLOUDINARY_API_SECRET.includes("your_")
  );
}

function getAddNewPage(req, res) {
  return res.render("addblog", {
    user: req.user,
  });
}

async function createBlog(req, res) {
  const { title, body } = req.body;
  if (!isCloudinaryConfigured()) {
    console.error(
      "Cloudinary credentials are missing or placeholders are still set",
    );
    return res
      .status(500)
      .send(
        "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in .env.",
      );
  }
  let coverImageURL = "";
  if (req.file) {
    try {
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: "blog-covers" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          },
        );
        uploadStream.end(req.file.buffer);
      });
      coverImageURL = result.secure_url;
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      return res.status(500).send("Error uploading image: " + error.message);
    }
  }
  const blog = await Blog.create({
    body,
    title,
    createdBy: req.user._id,
    coverImageURL,
  });
  return res.redirect(`/blog/${blog._id}`);
}

async function getEditPage(req, res) {
  if (!req.user) return res.redirect("/user/signin");
  let blog;
  try {
    blog = await Blog.findById(req.params.id).populate("createdBy");
  } catch {
    return res
      .status(404)
      .render("not-found", { user: req.user, path: req.path });
  }
  if (!blog) return res.redirect("/");
  if (!canManageBlog(req.user, blog)) {
    return res
      .status(403)
      .send("You do not have permission to edit this post.");
  }
  return res.render("editblog", {
    user: req.user,
    blog,
  });
}

async function updateBlog(req, res) {
  if (!req.user) return res.redirect("/user/signin");
  let blog;
  try {
    blog = await Blog.findById(req.params.id).populate("createdBy");
  } catch {
    return res
      .status(404)
      .render("not-found", { user: req.user, path: req.path });
  }
  if (!blog) return res.redirect("/");
  if (!canManageBlog(req.user, blog)) {
    return res
      .status(403)
      .send("You do not have permission to edit this post.");
  }

  const { title, body } = req.body;
  if (title) blog.title = title.trim();
  if (body !== undefined) blog.body = body;

  if (req.file) {
    // Delete old image if it's from Cloudinary
    if (blog.coverImageURL && blog.coverImageURL.includes("cloudinary")) {
      const publicId = extractPublicId(blog.coverImageURL);
      if (publicId) {
        try {
          await cloudinary.uploader.destroy(publicId);
        } catch (error) {
          console.error("Error deleting old image from Cloudinary:", error);
        }
      }
    } else if (
      blog.coverImageURL &&
      blog.coverImageURL.startsWith("/uploads/")
    ) {
      // Delete local file if still local
      const oldPath = path.join(PUBLIC, blog.coverImageURL.replace(/^\//, ""));
      try {
        await fs.unlink(oldPath);
      } catch (err) {
        console.error("Error deleting local file:", err);
      }
    }

    if (!isCloudinaryConfigured()) {
      console.error(
        "Cloudinary credentials are missing or placeholders are still set",
      );
      return res
        .status(500)
        .send(
          "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in .env.",
        );
    }

    // Upload new image to Cloudinary
    try {
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: "blog-covers" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          },
        );
        uploadStream.end(req.file.buffer);
      });
      blog.coverImageURL = result.secure_url;
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      return res.status(500).send("Error uploading image: " + error.message);
    }
  }

  await blog.save();
  return res.redirect(303, `/blog/${blog._id}`);
}

async function deleteBlog(req, res) {
  if (!req.user) return res.redirect("/user/signin");
  let blog;
  try {
    blog = await Blog.findById(req.params.id).populate("createdBy");
  } catch {
    return res
      .status(404)
      .render("not-found", { user: req.user, path: req.path });
  }
  if (!blog) return res.redirect(303, "/");
  if (!canManageBlog(req.user, blog)) {
    return res
      .status(403)
      .send("You do not have permission to delete this post.");
  }

  await Comment.deleteMany({ blogId: blog._id });

  // Delete image
  if (blog.coverImageURL) {
    if (blog.coverImageURL.includes("cloudinary")) {
      const publicId = extractPublicId(blog.coverImageURL);
      if (publicId) {
        try {
          await cloudinary.uploader.destroy(publicId);
        } catch (error) {
          console.error("Error deleting image from Cloudinary:", error);
        }
      }
    } else if (blog.coverImageURL.startsWith("/uploads/")) {
      const filePath = path.join(PUBLIC, blog.coverImageURL.replace(/^\//, ""));
      try {
        await fs.unlink(filePath);
      } catch (err) {
        console.error("Error deleting local file:", err);
      }
    }
  }

  await Blog.findByIdAndDelete(blog._id);
  return res.redirect(303, "/");
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
    blog = await Blog.findById(req.params.id).populate("createdBy");
  } catch {
    return res
      .status(404)
      .render("not-found", { user: req.user, path: req.path });
  }
  if (!blog) {
    return res
      .status(404)
      .render("not-found", { user: req.user, path: req.path });
  }
  const comments = await Comment.find({ blogId: req.params.id }).populate(
    "createdBy",
  );
  const canManage = canManageBlog(req.user, blog);
  return res.render("blog", {
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
