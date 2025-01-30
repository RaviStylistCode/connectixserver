import jwt from "jsonwebtoken";
import User from "../models/user.js";
import Post from "../models/post.js";
import Comment from "../models/comment.js";
import TryCatch from "../utils/TryCatch.js";
import getDataUri from "../utils/datauri.js";
import cloudinary from "../utils/cloudinary.js";
import sendMail from "../utils/sendMail.js";

export const register = TryCatch(async (req, res) => {
  const { username, email, password, gender } = req.body;
  if (!username || !email || !password || !gender) {
    return res.status(400).json({
      success: false,
      message: "all field required",
    });
  }

  let user = await User.findOne({ username });
  if (user) {
    return res.status(400).json({
      success: false,
      message: "user already exist",
    });
  }

  user = await User.create({
    username,
    email,
    password,
    gender,
  });

  return res.status(201).json({
    success: true,
    message: "Registered Successfully",
    user,
  });
});

export const login = TryCatch(async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: "all fields required",
    });
  }

  let user = await User.findOne({ username }).select("+password");
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "invalid username or password",
    });
  }

  const isMatched = await user.comparePassword(password);
  if (!isMatched) {
    return res.status(400).json({
      success: false,
      message: "invalid username or password",
    });
  }

  const token = jwt.sign({ _id: user._id }, process.env.Token, {
    expiresIn: "7d",
  });

  // const populatedpost = await Promise.all(
  //   user.posts.map(async (postId) => {
  //     const post = await Post.findById(postId);
  //     if (post.owner.toString().equals(user._id)) {
  //       return post;
  //     }
  //     return null;
  //   })
  // );

  const mainuser = {
    _id: user._id,
    username: user.username,
    email: user.email,
    gender: user.gender,
    role: user.role,
    bio: user.bio,
    image: user.image,
    follower: user.follower,
    following: user.following,
    // posts: populatedpost,
    bookmark: user.bookmark,
  };

  return res
    .status(200)
    .cookie("token", token, { 
      httpOnly: true,
       maxAge: 7 * 24 * 60 * 60 * 1000,
       secure:true,
       sameSite:'None'
       })
    .json({
      success: true,
      message: `welcome back ${user.username}`,
      user: mainuser,
      token,
    });
});

export const logout = TryCatch((req, res) => {
  res.cookie("token", null, {
    maxAge: new Date(Date.now()),
  });

  return res.status(200).json({
    success: true,
    message: "Logged out Successfully",
  });
});

export const getUser=TryCatch(async(req,res)=>{

  const {q}=req.params || "";
  const user=await User.find({
    $or:[
      {username:{$regex:q, $options:"i"}},
      {bio:{$regex:q, $options:"i"}},
      
    ]
  });

  // console.log(user);

  return res.status(200).json({
    success:true,
    message:"matched users",
    user
  })
})

export const myProfile = TryCatch(async (req, res) => {
  let user = await User.findById(req.user._id);
  if (!user) {
    return res.status(400).json({
      success: false,
      message: "user not found",
    });
  }

  return res.status(200).json({
    success: true,
    user,
  });
});

export const editProfile = TryCatch(async (req, res) => {
  let user = await User.findById(req.user._id);
  const { bio, gender } = req.body;
  const image = req.file;
  let cloudresponse;
  if (!user) {
    return res.status(400).json({
      success: false,
      message: "user not found",
    });
  }

  // if(user.image){
  //   await cloudinary.uploader.destroy(user.image);
  // }

  if (image) {
    const fileUri = getDataUri(image);
    cloudresponse = await cloudinary.uploader.upload(fileUri);
  }

  if (bio) user.bio = bio;
  if (gender) user.gender = gender;
  if (image) user.image = cloudresponse.secure_url;
  await user.save();
  return res.status(200).json({
    success: true,
    message: "profile updated",
    user,
  });
});

export const loggedInUserupdatepassword = TryCatch(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword)
    return res
      .status(400)
      .json({ success: false, message: "all filed required" });

  let user = await User.findById(req.user._id).select("+password");
  if (!user)
    return res
      .status(400)
      .json({ success: false, message: "user doesn't exist" });

  const isMatched = user.comparePassword(oldPassword);
  if (!isMatched)
    return res
      .status(400)
      .json({ success: false, message: "invalid username or password" });

  user.password = newPassword;
  await user.save();

  res.cookie("token", null, { expires: new Date(Date.now()) });

  return res.status(200).json({ success: true, message: "password updated" });
});

export const getFollowerprofile = TryCatch(async (req, res) => {
  const id = req.params.id;
  
  let user = await User.findById(id)
    .populate({ path: "posts", sort: { createdAt: -1 } })
    .populate("bookmark")
    .populate("following")
    .populate("follower");
  return res.status(200).json({
    success: true,
    user,
  });
});

export const getSuggestUser = TryCatch(async (req, res) => {
  let user = await User.find({ _id: { $ne: req.user._id } }).limit(5);
  if (!user) {
    return res.status(400).json({ success: false, message: "user not found" });
  }

  return res.status(200).json({
    success: true,
    message: "suggested users",
    user,
  });
});

export const followandUnfollow = TryCatch(async (req, res) => {
  let me = await User.findById(req.user._id);
  let usercomingtofollow = await User.findById(req.params.id);

  if (!me || !usercomingtofollow) {
    return res.status(400).json({
      success: false,
      message: "user not found",
    });
  }

  if (me._id.toString() === usercomingtofollow._id.toString()) {
    return res.status(400).json({
      success: false,
      message: "can't follow/unfollow yourself",
    });
  }

  let isFollowing = me.following.includes(usercomingtofollow._id);
  // console.log(isFollowing)
  if (isFollowing) {
    let indexToFollow = me.following.indexOf(usercomingtofollow._id);
    let indexOfFollow = usercomingtofollow.follower.indexOf(me._id);

    me.following.splice(indexToFollow, 1);
    usercomingtofollow.follower.splice(indexOfFollow, 1);

    Promise.all([await me.save(), await usercomingtofollow.save()]);

    return res.status(200).json({
      success: true,
      tofollow: usercomingtofollow._id.toString(),
      message: "unfollowed successfully",
    });
  } else {
    //follow
    me.following.push(usercomingtofollow._id);
    usercomingtofollow.follower.push(me._id);
    Promise.all([await me.save(), await usercomingtofollow.save()]);
    return res.status(200).json({
      success: true,
      tofollow: usercomingtofollow._id.toString(),
      message: "followed successfully",
    });
  }
});

export const forgetPassword = TryCatch(async (req, res) => {
  const { email } = req.body;
  if (!email)
    return res
      .status(400)
      .json({ success: true, message: "please provide your email" });
  let user = await User.findOne({ email });
  if (!user)
    return res
      .status(400)
      .json({ success: false, message: "user doesn't exist" });

  const otp = Math.floor(Math.random() * 1000000);
  user.resetOtp = otp;
  user.resetOtpExpiry = new Date(Date.now() + 5 * 60 * 100);

  await user.save();
  await sendMail(
    user.email,
    "For Resetting password",
    `this is your otp : ${otp} for reset password`
  );

  return res.status(200).json({
    success: true,
    message: `mail sent to ${email} || please check you Email`,
  });
});

export const resetPassword = TryCatch(async (req, res) => {
  const { otp } = req.body;
  if (!otp)
    return res
      .status(400)
      .json({ success: false, message: "please enter otp" });

  let user = await User.findOne({
    resetOtp: otp,
    resetOtpExpiry: { $gt: Date.now() },
  });

  if (!user)
    return res
      .status(200)
      .json({ success: false, message: "invalid otp or has been expired" });

  user.resetOtp = null;
  user.resetOtpExpiry = null;
  await user.save();

  return res
    .status(200)
    .json({
      success: true,
      Email: user.email,
      message: "proceed to change password",
    });
});

export const updatePassword = TryCatch(async (req, res) => {
  const { oldPassword, newPassword, email } = req.body;
  if (!oldPassword || !newPassword || !email)
    return res
      .status(400)
      .json({ success: false, message: "enter all fields" });

  let user = await User.findOne({ email }).select("+password");
  const isMatched = await user.comparePassword(oldPassword);
  if (!isMatched)
    return res
      .status(400)
      .json({ success: true, message: "invalid username or password" });

  user.password = newPassword;
  await user.save();

  return res.status(200).json({ success: true, message: "password updated" });
});

export const deletemyaccount = TryCatch(async (req, res) => {
  let user = await User.findById(req.user._id);
  if (!user)
    return res.status(400).json({ success: false, message: "user not found" });

  let userId = user._id;
  // let posts=user.posts;
  let followers = user.follower;
  let followings = user.following;

  await user.deleteOne();
  res.cookie("token", null, { expires: new Date(Date.now()) });

  // Delete posts by the user
  let posts = await Post.find();
  posts = posts.filter((post) => post.owner.toString() === userId.toString());
  await Promise.all(posts.map((post) => post.deleteOne()));

  // Delete comments by the user
  let comments = await Comment.find();
  comments = comments.filter(
    (comment) => comment.author.toString() === userId.toString()
  );
  await Promise.all(comments.map((comment) => comment.deleteOne()));

  for (let i = 0; i < followers.length; i++) {
    const followUser = await User.findById(followers[i]);
    const index = followUser.following.indexOf(userId);
    followUser.following.splice(index, 1);
    await followUser.save();
  }

  for (let i = 0; i < followings.length; i++) {
    const followingUser = await User.findById(followings[i]);
    const index = followingUser.follower.indexOf(userId);
    followingUser.follower.splice(index, 1);
    await followingUser.save();
  }

  return res.status(200).json({ success: true, message: "Account Deleted" });
});
