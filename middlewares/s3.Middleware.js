import aws from 'aws-sdk';
import multer from 'multer';
import multerS3 from 'multer-s3';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

aws.config.update({
    region: process.env.AWS_S3_REGION,
    accessKeyId: process.env.AWS_S3_ACCESS_KEY,
    secretAccessKey: process.env.AWS_S3_SECRET_KEY
})

const s3 = new aws.S3();

const allowedExtensions = ['.png', '.jpg', '.jpeg', '.bmp']

const imageUploader = multer({
    storage: multerS3({
        s3: s3,
        bucket: process.env.AWS_BUCKET_NAME,
        key: (req, file, callback) => {
            const extension = path.extname(file.originalname)
            if (!allowedExtensions.includes(extension)) {
                return callback(new Error('wrong extension'))
            }
            callback(null, `community/${Date.now()}_${file.originalname}`)
        },
        limits: { fileSize: 5 * 1024 * 1024 },
        acl: 'public-read-write'
    }),
})
export default imageUploader;