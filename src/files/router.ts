import { Router } from 'express';
import multer from 'multer';
import MinioController from './controller.js';

const filesRouter = Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

filesRouter
  .get(
    '/getFileByName/:bucketName/:recipeId/:objectName',
    MinioController.getFileByName
  )
  .get(
    '/getFileMetadataByName/:bucketName/:recipeId/:objectName',
    MinioController.getFileMetadataByName
  )

  .get('/buckets-list', MinioController.getBucketsList);

filesRouter
  // .post(
  //   '/uploadFilesArray',
  //   upload.array('files', 10),
  //   MinioController.uploadFilesArray
  // )
  .post('/uploadFile', upload.single('file'), MinioController.uploadFile)
  .post('/create-bucket', MinioController.createBucket);

filesRouter
  .put('/updateMetadata/:bucketName/:recipeId', MinioController.updateMetadata)
  .put('/renameObject', MinioController.renameObject);

filesRouter.delete(
  '/deleteFile/:bucketName/:recipeId/:objectName',
  MinioController.deleteFile
);

export default filesRouter;
