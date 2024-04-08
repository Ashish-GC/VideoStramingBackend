import mongoose, {Mongoose, isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body
    const {_id} = req.user;
    //TODO: create playlist
   
     const playlistAlreadyExists = await Playlist.find({
         name ,
         owner:_id 
     });
      if(playlistAlreadyExists.length > 0){
        throw new ApiError(404,"playlist with this name already exists");
      }

    const playlist = await Playlist.create({
         name:name ,
         description:description,
         owner: _id
    })

    if(!playlist){
        throw new ApiError(500,"unable to create playlist");
    }

    return res.status(200).json(new ApiResponse(200,playlist,"playlist created"));
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists

    const getUserPlaylist = await Playlist.find({
        owner:new mongoose.Types.ObjectId(userId)
    });
 
       if(!getUserPlaylist){
        throw new ApiError(400,"no playlist exists")
       }
      
       return res.status(200).json(new ApiResponse(200,getUserPlaylist,"user playlists fetched successfully"))
       
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
    
    const getPlaylist =await Playlist.findById(playlistId);
   
    if(!getPlaylist){
        throw new ApiError(400,"playlist dosent exists");
    }
    
    return res.status(200).json(new ApiResponse(200,getPlaylist,"playlist fetched successfully"))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
            
    const videoAlreadyAdded = await Playlist.find({
        _id:playlistId,
        videos: { $in : [videoId]} 
    })
    
    if(videoAlreadyAdded.length >0){
        throw new ApiError(400,"video is already present in the playlist");
    }

    const addVideo = await Playlist.findByIdAndUpdate(playlistId , {
        $push:{
             videos :[videoId] 
        }
    },{
        new:true
    }
)

    if(!addVideo){
        throw new ApiError(400,"playlist dosen't exist");
    }

    return res.status(200).json(new ApiResponse(200,addVideo , "video added to playlist"));
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
 
     const removeVideoFromPlaylist =  await Playlist.findByIdAndUpdate(playlistId,{
         $pull:{ videos:videoId}
     })
     console.log(removeVideoFromPlaylist)
     if(!removeVideoFromPlaylist){
         throw new ApiError(400,"playlist dosent exists")
     }

     return res.status(200).json(new ApiResponse(200,"video removed from playlist"));
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params;
    // TODO: delete playlist
    const playlistDelete = await Playlist.findByIdAndDelete(playlistId);

    if(!playlistDelete){
      throw new ApiError(400,"playlist dosen't exists");
    }
    return res.status(200).json(new ApiResponse(200,playlistDelete,"playlist deleted"))
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
        const  updateValue ={};

        if(name){
            updateValue.name =name;
        }
        if(description){
            updateValue.description =description;
        }

     const playlistUpdate = await Playlist.findByIdAndUpdate(playlistId,updateValue,{new:true});

     if(!playlistUpdate){
        throw new ApiError(400,"cannot find playlist");
     }

     return res.status(200).json(new ApiResponse(200,playlistUpdate,"playlist value updated"))

})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
