import mongoose from "mongoose";

const postSchema=new mongoose.Schema({
    caption:{
        type:String,
        default:''
    },

    url:{
        type:String,
        required:true
    },

    owner:{
        type:mongoose.Schema.ObjectId,
        ref:'user',
        required:true
    },

    likes:[
        {
            type:mongoose.Schema.ObjectId,
            ref:'user'
        }
    ],

    comments:[
        {
          type:mongoose.Schema.Types.ObjectId,
          ref:'comment'
        }
    ]
},{timestamps:true});

const Post=mongoose.model('post',postSchema);
export default Post;