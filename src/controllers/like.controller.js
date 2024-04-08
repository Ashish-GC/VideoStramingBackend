import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: toggle like on video
  const { _id } = req.user;

  const checkLike = await Like.find({
    $and: [{ video: videoId }, { likedBy: _id }],
  });

  if (checkLike.length>0) {
   
   const removeLike= await Like.findOneAndDelete({
      $and: [{ video: videoId }, { likedBy: _id }],
    });
    
      if(!removeLike){
        throw new ApiError(400,"error while removing like")
      }
   
      return res.status(200).json(new ApiResponse(200,"like removed from the video"));

  }


  const addLike = await Like.create({
   video:videoId,
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
  const likedVideos = await Like.find({likedBy:req.user._id , video: { $exists: true }});

  if(!likedVideos){
   throw new ApiError(400,"cannot fetch liked videos")
  }
  return res.status(200).json(new ApiResponse(200, likedVideos ,"fetched all the liked videos"))
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
