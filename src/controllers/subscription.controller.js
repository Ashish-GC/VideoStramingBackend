import mongoose, { isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"



const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription
    const subscriber = (req.user._id).toString();
    
        if(subscriber === channelId){
            throw new ApiError("404","cannot subscribe to your own channel");
        }
    

    const isSubscribed = await Subscription.find({subscriber:subscriber , channel:channelId})
      
    if(isSubscribed.length>0){
      const unsubscribe= await Subscription.findOneAndDelete({subscriber:subscriber , channel:channelId})
  
      if(!unsubscribe){ 
        throw new ApiError(500 , "unable to subscribe");
     }
      return res.status(200).json(new ApiResponse(200,{status:"Subscribe" , id:channelId},"unsubscribed successfully"))
    }

    const newSubscriber = await Subscription.create({subscriber:subscriber , channel:channelId})
  
    if(!newSubscriber){
         throw new ApiError(500 , "unable to subscribe");
    }
 
   return res.status(200).json(new ApiResponse(200,{status:"Subscribed" , id:channelId},"Subscribed successfully"));
    

})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {

    const {channelId} = req.params

    const subscribersList = await Subscription.find({channel:channelId},{subscriber:1});
  
    if(subscribersList.length===0){
          return res.status(200)
                    .json(new ApiResponse(200,{},"no subscribers"));
    }
    if(!subscribersList){
            throw new ApiError(404,"channel dosent exist") ;
    }

     return res.status(200).json(new ApiResponse(200,subscribersList,"subscribers list"));

})
// use aggregate pipeline  to get more subscribers info 

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    // const channelList = await Subscription.find({subscriber:subscriberId},{channel:1});

    const channelList = await Subscription.aggregate(
        [
            {
              $match: {
                subscriber:new mongoose.Types.ObjectId(subscriberId)
              }
            },
            {
              $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channel_details"
              },
            },
            {
              $addFields: {
                 channel_details:{
                   $arrayElemAt:["$channel_details",0]
                 }
              }
            },
             {
              $project: {
                channel_details: 1
              }
            },
            {
              $project: {
                "channel_details.password": 0,
                 "channel_details.watchHistory":0,
                 "channel_details.email":0,
              }
            }
          ]
    )

    if(channelList.length===0){
        return res.status(200).json(new ApiResponse(200,channelList,"not subscribed to anyone "))
    }
    if(!channelList){
        throw new Error(404 , "wrong subscriber id")
    }
    return res.status(200).json(new ApiResponse(200,channelList,"channel list fetched"))

})

const getSubscribeStatus = asyncHandler(async(req,res)=>{
  try {
      const {channelId} = req.params;
      const user = req.user;

      const isSubscribed = await Subscription.find({channel:new mongoose.Types.ObjectId(channelId) , subscriber:user._id })
       
      if(!isSubscribed){
        throw new Error(404 , "not subscribed")
    }
    return res.status(200).json(new ApiResponse(200,isSubscribed,"subscribe status fetched"))

  } catch (error) {
    throw new Error("cannot get subscription status")
  }
})



export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels,
    getSubscribeStatus
}