import mongoose from "mongoose";

const messageSchema=new mongoose.Schema({
    senderId:{
        type:mongoose.Schema.ObjectId,
        ref:'user',
        required:true
    },

    receiverId:{
        type:mongoose.Schema.ObjectId,
        ref:'user',
        required:true
    },

    text:{
        type:String
    },

    image:{
        type:String
    },

    video:{
        type:String
    },

    seen:{
        type:Boolean,
        default:false
    }
},{timestamps:true});

const Message=mongoose.model('message',messageSchema);
export default Message;