
import mongoose from "mongoose";
import bcrypt from 'bcrypt';
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema({
    
      username:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        index:true,
        trim:true
      },
      email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true
      },
      fullName:{
        type:String,
        required:true,
        lowercase:true,
        trim:true
      },
      description:{
        type:String
      },
      avatar:{
        type:String, //cloudinary url
        required:true
      },
      coverImage:{
        type:String,
      },
      password:{
        type:String,
        required:[true,"Password is required"]
      },
      refreshToken:{
        type:String,
      },

      watchHistory:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Video"
      }
      ]

},{timestamps:true})

userSchema.pre("save", async function (next){
   if(this.isModified("password")){
    this.password=await bcrypt.hash(this.password,10)
   }
    next();
})

userSchema.methods.isPasswordCorrect = async function(password){
  
  return await bcrypt.compare(password,this.password);
}

//jwt
   userSchema.methods.generateAccessToken = function(){
   return jwt.sign({
         _id:this._id , email:this.email , username: this.username , fullName : this.fullName
    },process.env.ACCESS_TOKEN_SECRET ,{ expiresIn : process.env.ACCESS_TOKEN_EXPIRY})
   } 
      
   userSchema.methods.generateRefreshToken = function(){
   return jwt.sign({
      id: this._id
    },process.env.REFRESH_TOKEN_SECRET ,{ expiresIn : process.env.REFRESH_TOKEN_EXPIRY})
   } 


export const User = mongoose.model("User",userSchema)