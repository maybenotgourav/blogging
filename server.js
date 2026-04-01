const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const cookieparser = require("cookie-parser");
const cloudinary = require("cloudinary").v2;
require("dotenv").config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const checkCloudinaryReady = () => {
  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET ||
    process.env.CLOUDINARY_CLOUD_NAME.includes("your_") ||
    process.env.CLOUDINARY_API_KEY.includes("your_") ||
    process.env.CLOUDINARY_API_SECRET.includes("your_")
  ) {
    console.warn(
      "Warning: Cloudinary is not fully configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in .env."
    );
  } else {
    console.log("Cloudinary configured:", process.env.CLOUDINARY_CLOUD_NAME);
  }
};

checkCloudinaryReady();

const userRoute = require("./routes/user");
const blogRoute = require("./routes/blog");
const homeController = require("./controllers/homeController");
const {
  checkForAuthenticationCookie,
} = require("./middlewares/authentication");

const app = express();
const PORT = process.env.PORT || 8000;
const ROOT = __dirname;

app.use(express.urlencoded({ extended: true }));
app.use(cookieparser());
app.use(checkForAuthenticationCookie("token"));

app.set("view engine", "ejs");
app.set("views", path.join(ROOT, "views"));

mongoose
  .connect(process.env.MONGO_URI)
  .then((e) => console.log("mongodb connected"));

app.get("/", homeController.getHomePage);
app.use("/user", userRoute);
app.use("/blog", blogRoute);

app.use(express.static(path.join(ROOT, "public")));

app.use((req, res) => {
  res.status(404).render("not-found", {
    user: req.user,
    path: req.path,
  });
});

app.listen(PORT, () => console.log("server started at port : " + PORT));
