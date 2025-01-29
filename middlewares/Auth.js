import User from "../models/user.js";
import jwt from "jsonwebtoken";
import TryCatch from "../utils/TryCatch.js";

export const isAuthenticate=TryCatch(async(req,res,next)=>{
    const {token}=req.cookies;
    if(!token){
        return res.status(400).json({
            success:false,
            message:"invalid token or has been expired"
        })
    }

    const decoded=jwt.verify(token,process.env.Token);
     req.user=await User.findById(decoded._id);
     next();
})