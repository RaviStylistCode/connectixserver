import mongoose from "mongoose";

const conversationSchema=new mongoose.Schema({
    participants:[
        {
            type:mongoose.Schema.ObjectId,
            ref:'user',
            required:true
        }
    ],

    messages:[
        {
            type:mongoose.Schema.ObjectId,
            ref:"message",
            required:true
        }
    ]
},{timestamps:true});

const Conversation =mongoose.model('conversation',conversationSchema);
export default Conversation;

