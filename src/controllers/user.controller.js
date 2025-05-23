import {asyncHandler} from "./utils/asyncHandler.js"
import {ApiError} from "./utils/ApiError.js"
import {User} from "./models/userModel.js"
import { uploadOnCloudinary } from "cloudinary.js"
import { ApiResponse } from "../utils/apiResponse.js"
import mongoose from "mongoose"
import { TopologyDescriptionChangedEvent } from "mongodb"

const generateAccessAndRefreshToken = async(userId)=>{
    try {
        const user = await user.findById(userId)
        const accessToken =  user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        user.refreshToken = refreshToken()
        await user.save({validateBeforeSave : false})
        return {accessToken , refreshToken}
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }
}

const registerUser = asyncHandler(async(req,res,)=>{
    // get userDetails from frontend
    // validation - not empty
    // check if user already exist
    // check for images , check for avatar
    // upload them on cloudinary , avatar
    // create user object -> create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res


    const {fullName, userName, email,password} = req.body
    if([fullName,userName,email,password]
        .some((field)=>{
             field?.trim()=== ''
        })
    ){
        throw new ApiError (400,"Please provide all fields")
    }
  const existedUser =   User.findOne({
        $or : [{userName}, {email}]
    })
    if(existedUser){
        throw new ApiError (409,"user with email or username already exist.")
    }
   const avatarLocalPath = req.files?.avatar[0]?.path;
   const coverImageLocalPath = req.files?.coverImage[0]?.path;

   if(!avatar){
    throw new ApiError(400, "Avatar file is required.")
   }
   const avatar =  await uploadOnCloudinary(avatarLocalPath)
   const coverImage = await uploadOnCloudinary(coverImageLocalPath)
   if(!avatar){
    throw new ApiError(400, "Avatar file is required.")
   }
  const User = await User.create({
    fullName,
    avatar : avatar.url,
    coverImage : coverImage?.url || "",
    email,
    password,
    userName : userName.toLowerCase()
   })
   const createdUser = await User.findById(user._id).select("-password, -refreshToken")
   if(!createdUser){
    throw new ApiError(500,"Something went wrong while registering a User")
   }
  new ApiResponse(200, createdUser, "User registered Successfully")
})

    const loginUser = asyncHandler(async(req,res)=>{
            // req body -> data
    // username or email
    //find the user
    //password check
    //access and referesh token
    //send cookie
           const {username, email, password} = req.body  
           if(!username || !email){
            throw new ApiError(400, "userName and email are required")
           }  
         const user = await User.findOne({
        $or: [{username}, {email}]
    })
    if(!user){
        throw new ApiError(401, "Invalid username or email")
    }
    const isPasswordValid = await user.isPasswordValid(password)
    if(!isPasswordValid){
        throw new ApiError(401, " Invalid password")
    }
    })

    const {accessToken,refreshToken} = await generateAccessAndRefreshToken(User._id)
    const loggedInUser = await User.findById(User._id).select("-password, -refreshToken")
    const options = {
        httpOnly : true,
        secure : true
    }

    return res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken", refreshToken, options)
    .json( new ApiResponse(
            200, 
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
    
    )

    const logoutUser = asyncHandler(async(req, res) => {
        await User.findByIdAndUpdate(
            req.user._id,
            {
                $unset: {
                    refreshToken: 1 // this removes the field from document
                }
            },
            {
                new: true
            }
        )
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged Out"))
    })
    



const refreshAccessToken = asyncHandler(async(req,res)=>{
    const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken
    if(!incomingRefreshToken){
        throw new ApiError(401,"Unauthorized Request")
    }
    try {
        const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
        const user = await User.findById(decodedToken?._id)
        if(!user){
            throw new ApiError(401,"Invalid Refresh Token")
        }
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401,"Refresh Token is Expired or Used")
        }
        const options = {
            httpOnly: true,
            secure: true
        }
        const {accessToken,refreshToken} = await generateAccessAndRefreshToken(user._id)
        return res.status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",refreshToken,options)
        .json(
            new ApiResponse(
                200, 
                {accessToken, refreshToken: newRefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401,error.message || "Invalid Refresh Token")
    }
})


const changeCurrentPassword = asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword} =req.body

    const user = await User.findById(req.user?._id)
    const isPasswordValid = await user.isPasswordValid(oldPassword)
    if(!isPasswordValid){
        throw new ApiError(400, "Invalid Password")
    }
    user.password = newPassword
   await user.save({validateBeforeSave: false})
   return res.status(200)
   .json(new ApiResponse(
    200, {},"Password changed successfully" ))
})

const getCurrentUser = asyncHandler(async(req,res)=>{
    return res.status(200)
    .json(200)
    .json(new ApiResponse(
        200,
        req.user,
        "User fetched Successfully"
    ))
})

const updateAccountDetails = asyncHandler(async(req,res)=>{
    const {fullName, email} = req.body
    if(!fullName || !email){
        throw new ApiError(400,"All fields are required")
    }
    const user = await user.findByIdAndUpdate(req.user?._id,{
        $set : {
            fullName, email
        }
    },{new: true}.select("-password"))
     return res.status(200)
     .json(new ApiResponse(
        200, user , "Account details Updated Successfully"
     ))
})

const updateUserAvatar = asyncHandler(async(req,res)=>{
    const avatarLocalPath = req.file?.path
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is missing")
    }
    const avatarUrl = await uploadOnCloudinary(avatarLocalPath)
    if(!avatar.url){
        throw new ApiError(400,"Avatar upload failed")
    }
    const user = await user.findByIdAndUpdate(req.user?._id,{
        $set: {
            avatar: avatar.url
        }
    },{new: true}).select("-password")
    return res.status(200)
    .json(200)
    .json(new ApiResponse(
    200,user,"Avatar Image Updated Successfully"
    ))
})

const updateUserCoverImage = asyncHandler(async(req,res)=>{
    const coverImageLocalPath = req.file?.path
    if(!coverImageLocalPath){
        throw new ApiError(400,"Avatar file is missing")
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if(!coverImage.url){
        throw new ApiError(400,"Cover Image upload failed")
    }
    const user = await user.findByIdAndUpdate(req.user?._id,{
        $set: {
            coverImage: coverImage.url
        }
    },{new: true}).select("-password")
    return res.status(200)
    .json(200)
    .json(new ApiResponse(
    200,user,"Cover Image Updated Successfully"
    ))
})

const getUserChannelProfile = asyncHandler(async(req,res)=>{
    const {username} = req.params
    if(!username?.trim()){
        throw new ApiError(400,"Username is Missing")
    }
    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase(),
            }
        },
        {
            $lookup : {
                from : "subscriptions",
                localField : "_id",
                foreignField : "channel",
                as : "subscribers"
            }
        },
        {
            $lookup : {
                from : "subscriptions",
                localField : "_id",
                foreignField : "user",
                as : "subscribedTo"
            }
        },
        {
            $addFields : {
                subscribersCount : {
                    $size : "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username : 1,
                email : 1,
                subscribersCount : 1,
                channelsSubscribedToCount: 1,
                coverImage: 1,
                isSubscribed: 1,
                avatar: 1
            }
        }
    ])
    if(channel?.length){
        throw new ApiError(400 ,"Channel does not Exist")
    }
    return res.status(200)
    .json(new ApiResponse(
        200, channel[0], "User channel fetched Successfully"
    ))
})




export {registerUser,loginUser,logoutUser,refreshAccessToken,changeCurrentPassword,getCurrentUser,
    updateAccountDetails,updateUserAvatar,updateUserCoverImage,getUserChannelProfile

}