import * as profileService from '../services/profile.service.js';
import { successResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getMyProfile = asyncHandler(async (req, res) => {
  const profile = await profileService.getMyProfile(req.user._id);
  return successResponse(res, 'Profile retrieved successfully', profile);
});

export const updateMyProfile = asyncHandler(async (req, res) => {
  const profileData = req.body;
  if (req.file) {
    profileData.profilePicture = req.file.path.replace(/\\/g, '/');
  }
  const profile = await profileService.updateMyProfile(req.user, profileData);
  return successResponse(res, 'Profile updated successfully', profile);
});
