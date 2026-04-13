const ImageKit = require('@imagekit/nodejs');
const requireEnv = require('../utils/requireEnv.util');

const imagekit = new ImageKit({
    publicKey: requireEnv('IMAGEKIT_PUBLIC_KEY'),
    privateKey: requireEnv('IMAGEKIT_PRIVATE_KEY'),
    urlEndpoint: requireEnv('IMAGEKIT_URL_ENDPOINT'),
});

module.exports = imagekit;
