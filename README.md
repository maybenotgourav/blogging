
# Blogify

A full-stack blogging app built with **Node.js**, **Express**, **MongoDB**, and **EJS**.
Users can sign up, sign in, create posts with cover images, edit/delete their own posts, and comment on articles.

## Features

- User authentication with JWT stored in cookies
- Create, view, edit, and delete blog posts
- Upload post cover images using `multer`
- Comment system for logged-in users
- Role-aware post management (`ADMIN` or post owner)
- Profile page for signed-in users
- Styled frontend pages with Bootstrap + custom CSS
- Custom 404 page

## Tech Stack

- **Backend:** Node.js, Express 5
- **Database:** MongoDB Atlas (Mongoose)
- **Templating:** EJS
- **Auth:** JSON Web Token (`jsonwebtoken`) + cookie-parser
- **File Upload:** Multer
- **Config:** dotenv

## Project Structure

Blogs/
│
├── controllers/        
│   ├── userController.js
│   ├── blogController.js
│   └── commentController.js
│
├── models/
│   ├── user.js
│   ├── blog.js
│   └── comment.js
│
├── routes/
│   ├── user.routes.js
│   └── blog.routes.js
│
├── middlewares/
│   └── authentication.js
│
├── services/          
│   └── auth.service.js
│
├── public/
│   ├── css/
│   └── uploads/
│
├── views/
│   ├── partials/
│   └── *.ejs
│
│
├── .env
├── server.js
└── package.json```


## Main Routes
### Public / Home
- `GET /` - Home page (all posts)

### User Routes

- `GET /user/signup` - Sign up page
- `POST /user/signup` - Register user
- `GET /user/signin` - Sign in page
- `POST /user/signin` - Login user
- `GET /user/logout` - Logout user
- `GET /user/profile` - Profile page (auth required)

### Blog Routes

- `GET /blog/add-new` - New post form
- `POST /blog/` - Create post
- `GET /blog/:id` - View single post
- `GET /blog/edit/:id` - Edit post page (owner/admin)
- `POST /blog/edit/:id` - Update post (owner/admin)
- `POST /blog/delete/:id` - Delete post (owner/admin)
- `POST /blog/comment/:blogId` - Add comment

## Authorization Rules
- Must be logged in to create/edit/delete/comment.
- Only the post owner or `ADMIN` can edit/delete a post.

## Notes
- Uploaded images are saved in `public/uploads`.
- Deleting a post also deletes:
  - all comments linked to that post
  - the uploaded cover image file (if present)
