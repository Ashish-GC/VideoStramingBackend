import mongoose from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: toggle like on video
  const { _id } = req.user;

  const checkLike = await Like.find({
    $and: [{ video:new mongoose.Types.ObjectId(videoId) }, { likedBy: _id }],
  });

  if (checkLike.length>0) {
   
   const removeLike= await Like.findOneAndDelete({
      $and: [{ video: new mongoose.Types.ObjectId(videoId)  }, { likedBy: _id }],
    });
    
      if(!removeLike){
        throw new ApiError(400,"error while removing like")
      }
   
      return res.status(200).json(new ApiResponse(200,"like removed from the video"));

  }

  const video =await Video.findById(videoId)
  if(!video){
    throw new ApiError(400,"no video exists")
  }
 
  const addLike = await Like.create({
   video:video,
   likedBy:_id
  });

  if(!addLike){
    throw new ApiError(400,"failed to like the video");
  }

  return res.status(200).json(new ApiResponse(200,addLike,"video liked"))

});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  //TODO: toggle like on tweet
  const { _id } = req.user;

  const checkLike = await Like.find({
    $and: [{comment: commentId}, { likedBy: _id }],
  });

  if (checkLike.length>0) {
   
   const removeLike= await Like.findOneAndDelete({
      $and: [{comment:commentId }, { likedBy: _id }],
    });
    
      if(!removeLike){
        throw new ApiError(400,"error while removing like")
      }
   
      return res.status(200).json(new ApiResponse(200,"like removed from the comment"));

  }


  const addLike = await Like.create({
   comment: commentId,
   likedBy:_id
  });

  if(!addLike){
    throw new ApiError(400,"failed to like the comment");
  }

  return res.status(200).json(new ApiResponse(200,addLike,"comment liked"))
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  //TODO: toggle like on tweet
  const { _id } = req.user;

  const checkLike = await Like.find({
    $and: [{ tweet:tweetId}, { likedBy: _id }],
  });

  if (checkLike.length>0) {
   
   const removeLike= await Like.findOneAndDelete({
      $and: [{tweet: tweetId }, { likedBy: _id }],
    });
    
      if(!removeLike){
        throw new ApiError(400,"error while removing like")
      }
   
      return res.status(200).json(new ApiResponse(200,"like removed from the tweet"));

  }


  const addLike = await Like.create({
   tweet: tweetId,
   likedBy:_id
  });

  if(!addLike){
    throw new ApiError(400,"failed to like the tweet");
  }

  return res.status(200).json(new ApiResponse(200,addLike,"tweet liked"))
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos
  const likedVideos = await Like.aggregate([
    
      {
         $match: {
           likedBy:new mongoose.Types.ObjectId(req.user._id)
         }
       },
       {
         $lookup: {
           from: 'videos',  // Correctly set as a string
           localField: 'video',  // Assuming 'video._id' is the correct field
           foreignField: '_id',
           as: 'video',
           pipeline:[
             {$lookup: {
       from: 'users',
       localField: "owner",
       foreignField: "_id",
       as: "owner_details",
        pipeline: [
             {
               $project: {
                 avatar: 1,
                 fullName: 1,
                 username: 1,
               },
             },
           ],
     }}
           ]
         }
       },
     
   
       
  ]);

  if(!likedVideos){
   throw new ApiError(400,"cannot fetch liked videos")
  }
  return res.status(200).json(new ApiResponse(200, likedVideos ,"fetched all the liked videos"))
});
 const getLikeStatus = asyncHandler(async(req,res)=>{
   const {videoId} = req.params;
  const user = req.user;

   const isLiked = await Like.find({video:new mongoose.Types.ObjectId(videoId) , likedBy:user._id})
  
   if(!isLiked){
    throw new ApiError(400,"cannot fetch liked videos")
   }

   return res.status(200).json(new ApiResponse(200, isLiked ,"fetched all the liked videos"))
})
const getVideoLikeCount = asyncHandler(async(req,res)=>{
  const {videoId} = req.params;
  const user = req.user;

   const likeCount = await Like.aggregate([
    {
      $match: {
        video:new mongoose.Types.ObjectId(videoId)
      }
    },
    {
    $match: {
      likedBy:new mongoose.Types.ObjectId(user._id)
    }
  },
   {
     $count: 'likeCount'
   }
  ])
  
   if(!likeCount){
    throw new ApiError(400,"cannot fetch video like count")
   }

   return res.status(200).json(new ApiResponse(200,likeCount ,"video like count"))
})

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos , getLikeStatus,getVideoLikeCount};
