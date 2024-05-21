import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
  const { _id } = req.user;

  const totalSubscribers = await Subscription.aggregate([
    {
      $match: {
        channel: _id,
      },
    },
    {
      $count: "totalSubscribers",
    },
  ]);

  if (!totalSubscribers) {
    throw new ApiError(400, "unable to get totalSubscribers");
  }

  const totalViewsandVideos = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(_id),
      },
    },
    {
      $group: {
        _id: null,
        totalViews: {
          $sum: "$views",
        },
        totalVideos: {
          $sum: 1,
        },
      },
    },
  ]);

  if (!totalViewsandVideos) {
    throw new ApiError(400, "unable to get totalViewsandVideos");
  }

  const totalLikes = await Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(_id),
      },
    },
    {
      $count: "totalLikes",
    },
  ]);
  if (!totalLikes) {
    throw new ApiError(400, "unable to get totalLikes");
  }

  const result = {
    userId: _id,
    totalSubscribers: totalSubscribers[0].totalSubscribers,
    totalViews: totalViewsandVideos[0].totalViews,
    totalVideos: totalViewsandVideos[0].totalVideos,
    totalLikes: totalLikes[0].totalLikes,
  };

  return res.status(200).json(new ApiResponse(200, result, "User stats"));
});

const getChannelVideos = asyncHandler(async (req, res) => {
  // TODO: Get all the videos uploaded by the channel

  const channelVideos = await Video.aggregate([
    { $match: { owner: new mongoose.Types.ObjectId(req.user._id) } },
    {
      $lookup: {
        from: "users",
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
      },
    },
  ]);

  if (!channelVideos) {
    throw new ApiError(400, "cannot get channel videos");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, channelVideos, "channel videos fetched successfully")
    );
});

export { getChannelStats, getChannelVideos };
