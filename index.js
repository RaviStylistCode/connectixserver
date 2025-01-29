import express from "express"
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./databases/databaseMongo.js";
import userRouter from "./routes/userRoutes.js";
import postRouter from "./routes/postRoutes.js";
import messageRouter from "./routes/messageRoute.js";


dotenv.config({});
import { app,server } from "./socket/socket.js";

const port=process.env.PORT || 3000;

connectDB();



app.use(express.json());
app.use(cookieParser());
const corsoptions={
    origin:process.env.corsorigin || 'http://localhost:5173',
    credentials:true,
    method:['GET','POST','PUT','DELETE','PATCH']
}
app.use(cors(corsoptions));

app.use('/api/v1/users',userRouter);
app.use('/api/v1/posts',postRouter);
app.use("/api/v1/messages",messageRouter);





server.listen(port,()=>{
    console.log('server running');
})