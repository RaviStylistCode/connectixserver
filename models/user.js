import mongoose from 'mongoose';
import validator from 'validator';
import bcrypt from "bcryptjs";

const userSchema=new mongoose.Schema({
    username:{
        type:String,
        required:[true,'name is required'],
        unique:true,
        trim:true
    },

    email:{
        type:String,
        validate:[validator.isEmail,'enter a valid email'],
        unique:[true,'password must be unique'],
        required:[true,'email is required'],
        trim:true
    },

    password:{
        type:String,
        minLength:[6,'password must be 6 char long'],
        required:[true,'please enter password'],
        select:false
    },

    role:{
        type:String,
        enum:['user','admin'],
        default:'user'
    },

    bio:{
        type:String,
        default:''
    },

    image:{
        type:String,
        default:''
    },

    gender:{
        type:String,
        enum:['male','female'],
        required:[true,'gender is required']
    },

    posts:[
        {
            type:mongoose.Schema.ObjectId,
            ref:'post'
        }
    ],

    follower:[
        {
            type:mongoose.Schema.ObjectId,
            ref:'user'
        }
    ],

    following:[
        {
            type:mongoose.Schema.ObjectId,
            ref:'user'
        }
    ],

    bookmark:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:'post'
        }
    ],

    resetOtp:Number,
    resetOtpExpiry:Date



},{timestamps:true});

userSchema.pre('save',async function(next){
    if(this.isModified("password")){
        const salt=await bcrypt.genSalt(10);
        this.password=await bcrypt.hash(this.password,salt);
    }
    next();
});

userSchema.methods.comparePassword=async function(getpassword){
    return await bcrypt.compare(getpassword,this.password);
}



const User=mongoose.model('user',userSchema);
export default User;