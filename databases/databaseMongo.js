import mongoose from "mongoose";

const connectDB=async()=>{
    try {
        const {connection}=await mongoose.connect(process.env.Mongo_uri,{
            dbName:'social'
        });
        console.log(`database connected with ${connection.host}`);
        
    } catch (error) {
        console.log(error);
    }
}

export default connectDB;