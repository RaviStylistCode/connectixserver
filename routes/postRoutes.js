import express from "express";
import {
  addComments,
  addNewPost,
  allPosts,
  BookMarkpost,
  deleteComment,
  deletePost,
  getPostComments,
  getUserPost,
  likeandunlike,
  updateComment,
  updatePost,
} from "../controllers/postController.js";
import { isAuthenticate } from "../middlewares/Auth.js";
import upload from "../middlewares/multer.js";

const router = express.Router();

router.route("/add").post(isAuthenticate, upload.single("image"), addNewPost);
router.route("/allpost").get(isAuthenticate, allPosts);
router.route("/likeandunlike/:id").get(isAuthenticate, likeandunlike);
router.route("/myposts").get(isAuthenticate, getUserPost);
router.route("/delete/:id").delete(isAuthenticate, deletePost);
router.route("/update/:id").patch(isAuthenticate, updatePost);
router.route("/bookmark/:id").get(isAuthenticate,BookMarkpost);

router
  .route("/comment/:id")
  .post(isAuthenticate, addComments)
  .get(isAuthenticate, getPostComments)
  .patch(isAuthenticate, updateComment)
  .delete(isAuthenticate, deleteComment);

export default router;
