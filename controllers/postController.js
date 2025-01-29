import Comment from "../models/comment.js";
import Post from "../models/post.js";
import User from "../models/user.js";
import { getReceiverid, io } from "../socket/socket.js";
import cloudinary from "../utils/cloudinary.js";
import TryCatch from "../utils/TryCatch.js";
import sharp from "sharp";

export const addNewPost = TryCatch(async (req, res) => {
  const { caption } = req.body;
  const image = req.file;
  let user = await User.findById(req.user._id);

  if (!image)
    return res.status(400).json({ success: false, message: "image required" });

  const optimizedimage = await sharp(image.buffer)
    .resize({
      width: 800,
      height: 800,
      fit: "inside",
    })
    .toFormat("jpeg", { quality: 80 })
    .toBuffer();

  const fileUri = `data:image/jpeg;base64,${optimizedimage.toString("base64")}`;

  const cloudresponse = await cloudinary.uploader.upload(fileUri);

  const post = await Post.create({
    caption,
    url: cloudresponse.secure_url,
    owner: user._id,
  });

  user.posts.push(post._id);
  await user.save();

  await post.populate({ path: "owner", select: "-password" });

  return res.status(201).json({
    success: true,
    message: "post created",
    post,
  });
});

export const allPosts = TryCatch(async (req, res) => {
  const post = await Post.find()
    .sort({ createdAt: -1 })
    .populate({ path: "owner", select: "username image" })
    .populate({
      path: "comments",
      sort: { createdAt: -1 },
      populate: {
        path: "author",
        select: "username image",
      },
    });

  return res.status(200).json({
    success: true,
    post,
  });
});

export const getUserPost = TryCatch(async (req, res) => {
  let post = await Post.find({ author: req.user._id })
    .sort({ createdAt: -1 })
    .populate({ path: "owner", select: "username image" })
    .populate({
      path: "comments",
      sort: { createdAt: -1 },
      populate: {
        path: "owner",
        select: "username image",
      },
    });

  return res.status(200).json({
    success: true,
    post,
  });
});

export const likeandunlike = TryCatch(async (req, res) => {
  let post = await Post.findById(req.params.id);
  if (!post)
    return res.status(400).json({ success: false, message: "post not found" });

  const user=await User.findById(req.user._id).select("username image");
  const postownerId=post.owner.toString();
  const postownersocketId=getReceiverid(postownerId);

  if (post.likes.includes(req.user._id)) {
    const userId = post.likes.indexOf(req.user._id);
    post.likes.splice(userId, 1);
    await post.save();


    if(post.owner.toString() !== req.user._id.toString()){

      const notification={
        type:"dislike",
        userId:req.user._id,
        userDetails:user,
        post,
        message:"your post was liked"
      }
      //socket io message
      io.to(postownersocketId).emit("notification",notification);
    }

    return res.status(200).json({
      success: true,
      message: "post unliked",
    });
    //unlike post
  } else {
    //like post
    post.likes.push(req.user._id);
    await post.save();

    //real time with socket io message
    if(post.owner.toString() !== req.user._id.toString()){

      const notification={
        type:"like",
        userId:req.user._id,
        userDetails:user,
        post,
        message:"your post was disliked"
      }
      //socket io message
      io.to(postownersocketId).emit("notification",notification);
    }

    return res.status(200).json({
      success: true,
      message: "post liked",
    });
  }
});

export const addComments = TryCatch(async (req, res) => {
  let post = await Post.findById(req.params.id);
  const { text } = req.body;
  if (!text) {
    return res
      .status(400)
      .json({ success: false, message: "text is required" });
  }
  if (!post) {
    return res.status(400).json({ success: false, message: "post not found" });
  }

  const comment = await Comment.create({
    text,
    author: req.user._id,
    post: post._id,
  });

  post.comments.push(comment._id);
  await post.save();
  await comment.populate({ path: "author", select: "username image" });

  //socket io comment method

  return res.status(201).json({
    success: true,
    message: "commented",
    comment,
  });
});

export const getPostComments = TryCatch(async (req, res) => {
  let comment = await Comment.findById(req.params.id).populate(
    "author",
    "username image"
  );

  if (!comment)
    return res
      .status(400)
      .json({ success: false, message: "No Comment found" });

  return res.status(200).json({
    success: true,
    message: "all comments",
    comment,
  });
});

export const deleteComment = TryCatch(async (req, res) => {
  let comment = await Comment.findById(req.params.id);
  if (!comment)
    return res.status(400).json({ success: false, message: "no comment" });

  if (comment.author.toString() !== req.user._id.toString()) {
    return res
      .status(401)
      .json({ success: false, message: "Unauthorized User" });
  } else {
    await comment.deleteOne();
    return res.status(200).json({ success: true, message: "comment deleted" });
  }
});

export const updateComment = TryCatch(async (req, res) => {
  const { text } = req.body;
  if (!text)
    return res.status(400).json({ success: false, message: "text required" });
  let comment = await Comment.findById(req.params.id);
  if (!comment)
    return res.status(400).json({ success: false, message: "not found" });

  comment.text = text;
  await comment.save();

  return res.status(200).json({
    success: true,
    message: "comment updated",
    comment,
  });
});

export const deletePost = TryCatch(async (req, res) => {
  const postId=req.params.id;
  let post = await Post.findById(req.params.id);
  let user=await User.findById(req.user._id);

  if(!user)
    return res.status(400).json({ success: false, message: "user not found " });
  if (!post)
    return res.status(400).json({ success: false, message: "not found post" });

  if (post.owner.toString() !== req.user._id.toString()) 
    return res.status(401).json({ success: false, message: "Unauthorized User" });
  
    
  await post.deleteOne();
  user.posts=user.posts.filter(id=>id.toString() !== postId.toString());
  await user.save();
  await Comment.deleteMany({post:postId});
  

  return res.status(200).json({
    success:true,
    message:'post deleted'
  });

  
});

export const updatePost = TryCatch(async (req, res) => {
  const { caption } = req.body;
  if (!caption)
    return res
      .status(400)
      .json({ success: false, message: "caption is required" });
  let post = await Post.findById(req.params.id);
  if (!post)
    return res.status(400).json({ success: false, message: "post not found" });
  post.caption = caption;
  await post.save();
  return res.status(200).json({
    success: true,
    message: "post updated",
    post,
  });
});

export const BookMarkpost=TryCatch(async(req,res)=>{

  let postId=req.params.id;
  let user=await User.findById(req.user._id);
  let post=await Post.findById({_id:postId});

  if(!user)return res.status(400).json({success:false,message:"user not found"});
  if(!post)return res.status(400).json({success:false,message:"post not found"});

  if(user.bookmark.includes(post._id)){
    
    let bookmarkpost=user.bookmark.indexOf(postId);
    user.bookmark.splice(bookmarkpost,1);
    await user.save();
    return res.status(200).json({success:true,message:"post unsave"});

  }else{

    user.bookmark.push(post._id);
    await user.save();
    return res.status(200).json({
      success:true,
      message:"post saved"
    });

  }

})


