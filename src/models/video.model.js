import mongoose from "mongoose";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";


const videoSchema = new mongoose.Schema({

     videoFile:{
        type:String, //cloudinary url
        required:true
     },
     thumbnail:{
        type:String, //cloudinary url
        required:true
     },
     owner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
     },
     title:{
        type:String,
        required:true
     },
     description:{
        type:String,
     },
     duration:{ //cloudinay   
        type:Number,
        required:true
     },
     views:{
        type:Number,
        default:0
     },
     isPublished:{
        type:Boolean,
        default:true
     }

},{timestamps:true})

videoSchema.plugin(aggregatePaginate);

export const Video = mongoose.model("Video",videoSchema)