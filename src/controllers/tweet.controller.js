import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const {content} = req.body;
    const {_id} = req.user;

    const tweetCreated = await Tweet.create(
        {
            content,
            owner:_id
        }
    )
    if(!tweetCreated){
       throw new ApiError(500,"unable to create tweet");
    }

    return res.status(200).json(new ApiResponse(200,tweetCreated,"tweet created"))
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
  const {userId} = req.params;

    const userTweets = await  Tweet.find({owner:userId});

    if(!userTweets){
       throw new ApiError(500,"cannot fetch tweets")
    }

    return res.status(200).json(new ApiResponse(200,userTweets,"fetched all tweets successfully"));
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
     const {tweetId} = req.params; 
      const {content} = req.body;

    const updated = await Tweet.findByIdAndUpdate(tweetId,{
        $set:{
            content
        }
    },{
        new:true
    });

   
    if(!updated){
        throw new ApiError(500,"cannot updated tweets")
     }
 
     return res.status(200).json(new ApiResponse(200,updated,"updated tweet successfully"));

})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetId} = req.params;

    const tweetDeleted =  await Tweet.findByIdAndDelete(tweetId);

    if(!tweetDeleted){
        throw new ApiError(400,"delete unsuccessfull");
    }

    return res.status(200).json(new ApiResponse(200,tweetDeleted,"tweet deleted successfully"));
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
