import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";


const getAllVideos = asyncHandler(async (req, res) => {
  let {
    page = 1,
    limit = 1000,
    query,
    sortBy = "views",
    sortType = "desc",
    userId,
  } = req.query;
  //TODO: get all videos based on query, sort, pagination
  limit = parseInt(limit);
  page = parseInt(page);

  let sortdir = -1;
  if (sortType === "asc") {
    sortdir = 1;
  }
  
  const skip = (page - 1) * limit;

  const pipeline = [];

  // if query  and user id
  if (query && userId) {
    const regexPattern = new RegExp(query, "i");
 
    pipeline.push(
      {
        $match: {
          $or: [
            { title: { $regex: regexPattern } },
            { description: { $regex: regexPattern } },
          ],
        },
      },
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
      {
        $match: {
          owner: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $sort: {
          [sortBy]: sortdir,
        },
      },
      {
        $skip: skip,
      },
      {
        $limit: limit,
      }
    );
  }

  // if query
  else if (query && !userId) {
    
    const regexPattern = new RegExp(query, "i");

    pipeline.push(
      {
        $match: {
          $or: [
            { title: { $regex: regexPattern } },
            { description: { $regex: regexPattern } },
          ],
        },
      },
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
      {
        $sort: {
          [sortBy]: sortdir,
        },
      },
      {
        $skip: skip,
      },
      {
        $limit: limit,
      }
    );
  }

  // if userId
  else if (userId && !query) {
    pipeline.push(
      {
        $match: {
          owner: new mongoose.Types.ObjectId(userId),
        },
      },
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
      {
        $sort: {
          [sortBy]: sortdir,
        },
      },
      {
        $skip: skip,
      },
      {
        $limit: limit,
      }
    );
  } else {
    pipeline.push(
      { $match: {} },
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
      {
        $sort: {
          [sortBy]: sortdir,
        },
      },
      {
        $skip: skip,
      },
      {
        $limit: limit,
      }
    );
  }

  const filterVideo = await Video.aggregate(pipeline);

  if (!filterVideo) {
    throw new ApiError(500, "cannot fetch videos");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, filterVideo, "feteched videos by query"));
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // TODO: get video, upload to cloudinary, create video

  //validate title and description

  if (title == "") {
    throw new ApiError(400, "Title is required");
  }

  // validate files
  const videoFilePath = req.files?.videoFile[0]?.path;
  const thumbnailFilePath = req.files?.thumbnail[0]?.path;

  if (!videoFilePath && !thumbnailFilePath) {
    throw new ApiError(400, "video and thumbnail are required field");
  }

  //upload on cloudinary

  const videoFile = await uploadOnCloudinary(videoFilePath);
  const thumbnail = await uploadOnCloudinary(thumbnailFilePath);

  if (!thumbnail && !videoFile) {
    throw new ApiError(500, "error with uploading in cloudinary");
  }

  //store it in video model ->  title,desc , thumbnail , video ,duration

  const uploadVideo = await Video.create({
    title,
    description: description ? description : "",
    videoFile: videoFile.url,
    thumbnail: thumbnail.url,
    duration: videoFile.duration,
    owner: req.user._id,
  });

  if (!uploadVideo) {
    throw new ApiError(500, "video upload failed");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, uploadVideo, "video upload successfull"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id
  const video = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
      },
    },
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

  if (!video) {
    throw new ApiError(400, "wrong id ,no such video exists");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "video fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail

  const { title, description } = req.body;
  const thumbnailFilePath = req.file?.path;

  const thumbnail = await uploadOnCloudinary(thumbnailFilePath);
  if (thumbnailFilePath) {
    if (!thumbnail) {
      throw new ApiError(400, "error while uploading in cloudinary");
    }
  }

  const updateData = {};

  if (title) {
    updateData.title = title;
  }
  if (description) {
    updateData.description = description;
  }
  if (thumbnail?.url) {
    updateData.thumbnail = thumbnail?.url;
  }

  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: updateData,
    },
    {
      new: true,
    }
  );

  if (!updatedVideo) {
    throw new ApiError(500, "error while updating data");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video

  const video = await Video.findByIdAndDelete(videoId);
  if (!video) {
    throw new ApiError(400, "video dosen't exists");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video.title, "video deleted"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(400, "unable to toggle publish status");
  }
  const toggleStatus = video.isPublished;
  video.isPublished = !toggleStatus;

  await video.save();

  return res
    .status(200)
    .json(new ApiResponse(200, video.isPublished, "publish status changed"));
});

const getVideoByChannelId = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  const video = await Video.aggregate([
    {
    $match: {
      owner: new mongoose.Types.ObjectId(channelId),
    }
  },
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
  ])
  if (!video) {
    throw new ApiError(400, "wrong id ,no such video exists");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "video fetched successfully"));
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
  getVideoByChannelId,
};
