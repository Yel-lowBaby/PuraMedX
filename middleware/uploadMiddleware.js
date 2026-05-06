const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../configs/cloudinary');

const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'PuraMedX-Reports',
        resource_type: 'auto',
        type: 'authenticated',
        allowed_formats: ['jpg', 'png', 'pdf']
    }
});

const upload = multer({ storage });

module.exports = upload;