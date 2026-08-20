const Profile = require("../models/Profile");

async function getProfile(userId) {
    let profile = await Profile.getProfile(userId);

    if (!profile) {
        profile = await Profile.createProfile(userId);
    }

    return profile;
}

async function updateProfile(userId, data) {
    let profile = await Profile.getProfile(userId);

    if (!profile) {
        await Profile.createProfile(userId);
    }

    profile = await Profile.updateProfile(userId, data);

    return profile;
}

module.exports = {
    getProfile,
    updateProfile
};