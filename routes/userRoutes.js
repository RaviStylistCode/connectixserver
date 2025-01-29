import express from "express";
import {
  deletemyaccount,
  editProfile,
  followandUnfollow,
  forgetPassword,
  getFollowerprofile,
  getSuggestUser,
  getUser,
  loggedInUserupdatepassword,
  login,
  logout,
  myProfile,
  register,
  resetPassword,
  updatePassword,
} from "../controllers/userController.js";
import { isAuthenticate } from "../middlewares/Auth.js";
import upload from "../middlewares/multer.js";
import { getUsersdetail, rolechange } from "../controllers/adminController.js";

const router = express.Router();

router.route("/register").post(register);
router.route("/login").post(login);
router.route("/logout").get(logout);
router.route("/me").get(isAuthenticate, myProfile);
router.route("/:id").get(isAuthenticate, getFollowerprofile);
router.route("/suggest/user").get(isAuthenticate, getSuggestUser);
router.route("/profile/me").put(isAuthenticate, upload.single("image"), editProfile);
router.route("/follow/:id").get(isAuthenticate, followandUnfollow);
router.route("/delete/me").delete(isAuthenticate,deletemyaccount);
router.route("/search/:q").get(isAuthenticate,getUser);

router.route("/forget/password").post(forgetPassword);
router.route("/reset/password").post(resetPassword);
router.route("/reset/password/update").post(updatePassword);
router.route("/update/password").post(isAuthenticate,loggedInUserupdatepassword);


router.route("/admin/userdetail").get(isAuthenticate,getUsersdetail);
router.route("/admin/role/:id").patch(isAuthenticate,rolechange);


export default router;
