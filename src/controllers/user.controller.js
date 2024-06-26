import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateRefreshAndAccessToken = async (userId) => {
  try {
    const user = await User.findById(userId);

    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();
    //add it to user data
    user.refreshToken = refreshToken;
    //save to db
    await user.save({ ValidateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (err) {
    throw new ApiError(500, "failed to generate Token");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // 1 get user details from frontend
  const { username, email, fullName, password } = req.body;
  //  2 validation
  if (
    [username, email, fullName, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }
    
  // 3 check if user already exists

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "user with this email or username already exists");
  }

  //4 check for images,check for avatar
  const avatarLocalPath = req.files?.avatar[0]?.path;
  //   const coverImageLocalPath= req.files?.coverImage[0]?.path;
  let coverImageLocalPath = "";
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) { 
    coverImageLocalPath = req.files.coverImage[0].path;
  }
  if (!avatarLocalPath) {
    throw new ApiError(400, "avatar is a required field");
  }
  // 5 upload them to cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!avatar) {
    throw new ApiError(400, "avatar file is required");
  }
  // 6 create user object -create entry in db
  const user = await User.create({
    fullName,
    username: username.toLowerCase(),
    email,
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
  });
 
  // 7 remove password and refresh token field from response
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  // 8 check for user creation
  if (!createdUser) {
    throw new ApiError(500, "user registration failed");
  }

  //9 return response
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "user registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // 1) req body -> data from user
  const { username, email, password } = req.body;
  if (!(username || email)) {
    throw new ApiError(400, "username or email missing");
  }
  // 2) username or email

  const user = await User.findOne({ $or: [{ username }, { email }] });

  //3) find the user

  if (!user) {
    throw new ApiError(400, "user does not exist");
  }

  //4) password check

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(400, "password is Invalid");
  }

  //5) generate refreshTOken and accessTOken

  const { refreshToken, accessToken } = await generateRefreshAndAccessToken(
    user._id
  );

  //6) take the logged In user details

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  //7) store token in cookies

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User logged In successfully"
      )
    );
});

const logOutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1, //this remove the field from document 
      },
    },
    { new: true }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "user logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingrefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingrefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingrefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?.id);
    if (!user) {
      throw new ApiError(401, "invalid refresh Token");
    }

    if (incomingrefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "refresh token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };
    const { accessToken, newrefreshToken } =
      await generateRefreshAndAccessToken(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newrefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, newrefreshToken },
          "accessToken refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error.message || "invalid refresh Token");
  }
});

const changeCurrentPassword = asyncHandler(async(req,res)=>{
           const {oldPassword,newPassword} = req.body;

         const user =await User.findById(req.user?._id) ;
        
       const isPasswordCorrect=await user.isPasswordCorrect(oldPassword);
          
       if(!isPasswordCorrect){throw new ApiError(400,"Invalid old password")}

       user.password = newPassword;
       await user.save({validateBeforeSave:false})

       return res.status(200).json(new ApiResponse(200,{},"Password Changed Successfully"))
})

const getCurrentUser = asyncHandler(async(req,res)=>{
  return res.status(200).json( new ApiResponse(200,req.user,"current user fetched successfully"))
})

const updateAccountDetails=asyncHandler(async(req,res)=>{
   const {username,fullName,email,description}= req.body;
          // if(!username || !fullName || !email || !description){
          //           throw new ApiError(400,"All feilds are required");
          //    }

   const user = await User.findByIdAndUpdate(req.user?._id,{
          $set:{
             fullName,
             email,
             description,
             username
          } 
   },{
    new:true
   }).select("-password")
 
   return res.status(200).json(new ApiResponse(200,user,"user details updated Successfully"))
    
})

//todo delete old image (add in utils)
const updateUserAvatar = asyncHandler(async(req,res)=>{
   const avatarLocalPath = req.file?.path;
   if(!avatarLocalPath){
          throw new ApiError(400,"Avatar file is missing")
   }
   const avatar = await uploadOnCloudinary(avatarLocalPath)
          if(!avatar){
             throw new ApiError(400,"Error while uploading the avatar")
          }

          const user =await User.findByIdAndUpdate(req.user?._id , {
            $set:{
            avatar : avatar.url
       }
      },{new:true}).select("-password") 
      
      return res.status(200).json(new ApiResponse(200,user,"avatar updated successfully"))
  })

  const updateUserCoverImage = asyncHandler(async(req,res)=>{
    const coverImageLocalPath = req.file?.path;
    
    if(!coverImageLocalPath){
           throw new ApiError(400,"Cover Image file is missing")
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
           if(!coverImage){
              throw new ApiError(400,"Error while uploading the cover Image")
           }
 
           const user =await User.findByIdAndUpdate(req.user?._id , {
             $set:{
             coverImage:coverImage.url
        }
       },{new:true}).select("-password") 
       
       return res.status(200).json(new ApiResponse(200,user,"cover Image updated successfully"))
   })

   const getUserChannelProfile=asyncHandler(async(req,res)=>{
          const {channelId} = req.params;

          // if(!username?.trim()){
          //   throw new ApiError(400,"user is missing");
          // }
          if(!channelId){
            throw new ApiError(400,"user is missing");
          }

          const channel = await User.aggregate([
            {
              $match:{_id:new mongoose.Types.ObjectId(channelId)}
            },
            {
              $lookup:{
                 from:"subscriptions",
                 localField:"_id",
                 foreignField:"channel",
                 as:"subscribers"
              }
            },
            {
              $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"
              }
            },
            {
               $addFields:{
                subscribersCount:{
                  $size:"$subscribers"
                },
                channelsSubscribedToCount:{
                  $size:"$subscribedTo"
                },
                 isSubscribed:{
                  $cond:{
                    if:{$in:[req.user?._id,"$subscribers.subscriber"]},
                     then:true,
                     else:false,
                  }
                 }
               }
            },
            {
                $project:{
                  fullName:1,
                  username:1,
                  subscribersCount:1,
                  channelsSubscribedToCount:1,
                  isSubscribed:1,
                  avatar:1,
                  coverImage:1,
                  email:1
                }
            }

          ])

          if(!channel?.length){
            throw new ApiError(404,"Channel does not exists")
          }

          return res
                .status(200)
                .json(
                  new ApiResponse(200,channel[0],"user channel fetched successfully")
                )
   })

   
   const getWatchHistory = asyncHandler(async(req,res)=>{
           
          const  user = await User.aggregate([
            {
              $match:{
                 _id: new mongoose.Types.ObjectId(req.user._id) 
              },
            },
            {$lookup:{
              from:"videos",
              localField:"watchHistory",
              foreignField:"_id",
              as:"watchHistory",
                  pipeline:[
                    {
                      $lookup:{
                        from:"users",
                        localField:"owner",
                        foreignField:"_id",
                        as:"owner",
                        pipeline:[{
                           $project:{
                            fullName:1,
                            username:1,
                            avatar:1
                           }
                        }]
                      }
                    }
                  ]
          }
        },
        {
          $addFields:{
            owner:{$first:"$owner"}
          }
        }

          ])

          return res 
                  .status(200)
                  .json(new ApiResponse(200,user[0].watchHistory,"Watch History fetched successfully"))
          
   })

   const getUserById = asyncHandler(async(req,res)=>{
               const {channelId} = req.params;

               const user = await User.findById(channelId).select("-password -refreshToken -watchHistory ") ;
               if(!user){
                throw new ApiError(400,"wrong user id") ;
             }
      
             return res.status(200).json(new ApiResponse(200,user,"user fetched successfully"))

   })

export {getUserById, registerUser, loginUser, logOutUser, refreshAccessToken ,changeCurrentPassword , getCurrentUser , updateAccountDetails , updateUserAvatar , updateUserCoverImage , getUserChannelProfile , getWatchHistory};
