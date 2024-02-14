import imageUploader from '../middlewares/s3.Middleware.js';
import express from 'express';

const router = express.Router();

router.post('/test/image', imageUploader.single('image'), (req,res)=>{
    console.log(req.file);
    res.send('good!')
})

export default router;