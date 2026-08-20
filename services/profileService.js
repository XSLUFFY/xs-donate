const Profile = require("../models/Profile");

async function getProfile(userId) {
    return await Profile.getProfile(userId);
}

async function createProfile(userId) {
    const existing = await Profile.getProfile(userId);

    if (existing) return existing;

    return await Profile.createProfile(userId);
}

async function updateProfile(userId, data) {
    return await Profile.updateProfile(userId, data);
}

module.exports = {
    getProfile,
    createProfile,
    updateProfile
};
