const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200,
        },
        description: {
            type: String,
            required: true,
            trim: true,
            maxlength: 2000,
        },
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 255,
        },
        url: {
            type: String,
            required: true,
            trim: true,
        },
        thumbnail: {
            type: String,
            required: true,
            trim: true,
        },
        imageKitFileId: {
            type: String,
            required: true,
            trim: true,
            unique: true,
        },
        imageKitThumbnailFileId: {
            type: String,
            trim: true,
        },
        artistId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            index: true,
        },
        isInAlbum: {
            type: Boolean,
            default: false,
            index: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Media', mediaSchema);
