import Post from "../models/post.js";
import User from "../models/user.js";
import TryCatch from "../utils/TryCatch.js";



export const getUsersdetail=TryCatch(async(req,res)=>{

    const user=await User.find();
    const post=await Post.find().populate({path:"owner",select:"username image"});
    
    if(!user)return res.status(400).json({success:false,message:"user not found"});
    if(!post)return res.status(400).json({success:false,message:"post not found"});

    const maleuser=await Promise.all(user.filter((u)=>u.gender === 'male'));
    const femaleuser=await Promise.all(user.filter((u)=>u.gender === 'female'));

    const adminusers=await User.find({role:"admin"}).limit(3);
    if(!adminusers){
        return res.status(400).json({success:false,message:"user not found"});
    }

    const usercreatedbymonth=await User.aggregate([
        {
            $group:{
                _id:{$month:"$createdAt"},
                count:{$sum:1}
            },
        },
        {$sort:{_id:1}}
    ]);

    const postcreatedbymonth=await Post.aggregate([
        {
            $group:{
                _id:{$month:"$createdAt"},
                count:{$sum:1}
            }
        },
        {$sort:{id:1}}
    ])

    

    const alldata={
        user,
        post,
        maleuser,
        femaleuser,
        usercreatedbymonth,
        postcreatedbymonth,
        adminusers,
        
    }

    return res.status(200).json({
        success:true,
        message:"user and post detail",
        alldata
    })
});

export const rolechange=TryCatch(async(req,res)=>{
    const {id}=req.params;
    const {role}=req.body;
    if(!role){
        return res.status(400).json({success:false,message:"provide role please"})
    }
    
    const user=await User.findById(id);
    if(!user){
        return res.status(400).json({success:false,message:"user not found"})

    }

    user.role=role;
    await user.save();
    return res.status(200).json({
        success:true,
        message:"Role updated"
    })
})