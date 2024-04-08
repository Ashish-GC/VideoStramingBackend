import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const skip = (page - 1) * limit;

  const getComments = await Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $skip: skip,
    },
    {
      $limit: limit,
    },
  ]);

  if (!getComments) {
    throw new ApiError(500, "unable to fetch comments");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        getComments,
        "fetched all the comments for the video"
      )
    );
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video

  const { videoId } = req.params;
  const { content } = req.body;
  const { _id } = req.user;

  const comment = await Comment.create({
    content,
    video: videoId,
    owner: _id,
  });

  if (!comment) {
    throw new ApiError(400, "Error while commenting");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, comment, "your comment has been added"));
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment

  const { commentId } = req.params;
  const { content } = req.body;

  if(!content){throw new ApiError(400,"no content to update")}

  const update=await Comment.findByIdAndUpdate(
    commentId,
    {
      $set: {
        content,
      },
    },
    { new: true }
  );

  if (!update) {
    throw new ApiError(400,"cannot update comment");
  }
  return res.status(200).json(new ApiResponse(200,update,"comment updated"))
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
  const {commentId} = req.params;

  const  deleteComment = await Comment.findByIdAndDelete(commentId);

  if(!deleteComment){
   throw new ApiError(400,"failed to delete comment");
  }

  return res.status(200).json(new ApiResponse(200,deleteComment,"comment deleted"))


});

export { getVideoComments, addComment, updateComment, deleteComment };
