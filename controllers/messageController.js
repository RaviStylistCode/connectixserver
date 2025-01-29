
import Conversation from "../models/conversation.js";
import Message from "../models/message.js";
import { getReceiverid, io } from "../socket/socket.js";
import TryCatch from "../utils/TryCatch.js";

export const sendMessage=TryCatch(async(req,res)=>{

    const senderId=req.user._id;
    const receiverId=req.params.id;
    const {text}=req.body;

    let getConversation=await Conversation.findOne({
        participants:{$all:[senderId,receiverId]}
    });

    if(!getConversation){
        getConversation=await Conversation.create({
            participants:[senderId,receiverId]
        });
    }

    const newMessage=await Message.create({
        senderId,
        receiverId,
        text
    });

    if(newMessage) getConversation.messages.push(newMessage._id);
    await Promise.all([getConversation.save(),newMessage.save()]);

    const receiveruserId=getReceiverid(receiverId);
    if(receiveruserId){
        io.to(receiveruserId).emit("newMessage",newMessage);
    }
    //socket.io real time message

    return res.status(201).json({success:true,message:"message sent",newMessage});
});

export const getMessage=TryCatch(async(req,res)=>{

    const senderId=req.user._id;
    const receiverId=req.params.id;

    let conversation=await Conversation.findOne({
        participants:{$all:[senderId,receiverId]}
    }).populate("messages");

    if(!conversation) return res.status(400).json({success:true,messsages:[]});

    return res.status(200).json({
        success:true,
        message:conversation?.messages
    });

});