import { Request, Response } from 'express';
import MinioManager from './manager.js';
import dotenv from 'dotenv';
import { BucketsNames } from './model.js';
dotenv.config();

export default class MinioController {
  static async getFileByName(req: Request, res: Response): Promise<void> {
    try {
      const { bucketName, recipeId, objectName }
        = req.params as {
          bucketName: BucketsNames;
          recipeId: string;
          objectName: string;
        };
      const objectData = await MinioManager.getFileByName(
        bucketName,
        recipeId,
        objectName
      );
      const imageStream = objectData.stream;
      const metaData = objectData.metadata;
      console.log('controller - getimage', imageStream);
      res.setHeader('metaData', JSON.stringify(metaData));

      // Pipe the image stream to the response
      imageStream.pipe(res);
    } catch (error) {
      console.error('Error fetching image (controller):', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async uploadFile(req: Request, res: Response) {
    try {
      console.log(
        'controller - uploadFile',
        req.file,
        'controller - uploadFile body',
        req.body
      );
      const { bucketName, recipeId, metadata } = req.params;
      const metadataObj = JSON.parse(metadata);
      console.log('controller - uploadFile - metadata', metadataObj, metadata);
      const file: Express.Multer.File | undefined = req.file;
      if (!file) {
        return res
          .status(400)
          .json({ success: false, message: 'File was not provided.' });
      }
      const result = await MinioManager.uploadFile(
        bucketName as BucketsNames,
        recipeId,
        file,
        metadataObj,
      );
      console.log(
        'controller - uploadFile - Single file uploaded successfully:',
        result
      );
      if (res === null) {
        throw new Error('error while uploading file');
      } else {
        res.status(200).json({
          success: true,
          message: 'Files uploaded successfully.',
          uploadedData: result,
        });
      }
    } catch (error: any) {
      console.error('Controller uploadFile Error:', error.message);
      res.status(500).json({ error: error.message });
    }
  }

  static async getFileMetadataByName(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { bucketName, recipeId, objectName }
        = req.params as {
          bucketName: BucketsNames;
          recipeId: string;
          objectName: string;
        };
      const metaData = await MinioManager.getFileMetadataByName(
        bucketName, recipeId, objectName
      );
      console.log('controller - getFileMetadataByName', metaData);

      // Pipe the image stream to the response
      res
        .status(200)
        .json({ message: `${objectName} metadata`, metaData: metaData });
    } catch (error) {
      console.error('Error fetching image (controller):', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async updateMetadata(req: Request, res: Response) {
    try {
      const { bucketName, recipeId } = req.params
      const objectName = req.body.objectName;
      const newMeata = req.body.metadata;
      const file = await MinioManager.updateMetadata(
        bucketName as BucketsNames,
        recipeId,
        objectName,
        newMeata
      );
      console.log(
        'files service controller -updateMetadata updated file',
        file
      );
      res.status(200).json({ file });
    } catch (error: any) {
      console.error('Controller updateMetadata Error:', error.message);
      res.status(500).json({ error: error.message });
    }
  }

  static async deleteFile(req: Request, res: Response) {
    try {
      const { bucketName, recipeId, objectName }
        = req.params as {
          bucketName: BucketsNames;
          recipeId: string;
          objectName: string;
        };
      const decodedFileName = decodeURIComponent(objectName);
      console.log('controller - deleteFile - decodedFileName', decodedFileName);
      await MinioManager.deleteFile(bucketName, recipeId, decodedFileName);
      res.status(200).json({ message: 'File deleted successfully' });
    } catch (error: any) {
      console.error('Controller deleteFile Error:', error.message);
      res.status(500).json({ error: error.message });
    }
  }

  static async createBucket(req: Request, res: Response) {
    const bucketName = req.body.bucketName;
    console.log('new bucket request:', req.body, bucketName);
    try {
      await MinioManager.createBucket(bucketName);
      res.status(201).json({ message: 'Bucket created successfully' });
    } catch (error: any) {
      console.error('Controller createBucket Error:', error.message);
      res.status(500).json({ error: error.message });
    }
  }

  static async getBucketsList(_req: Request, res: Response) {
    try {
      const buckets = await MinioManager.getBucketsList();
      res.status(200).json({ buckets });
    } catch (error: any) {
      console.error('Controller getBucketsList Error:', error.message);
      res.status(500).json({ error: error.message });
    }
  }

  static async renameObject(req: Request, res: Response) {
    try {
      const bucketName = req.body.bucketName;
      const oldObjectName = req.body.oldObjectName;
      const newObjectName = req.body.newObjectName;
      const status = await MinioManager.renameObject(
        bucketName,
        oldObjectName,
        newObjectName
      );

      status
        ? res.status(200).json({ message: 'object was renamed successfully.' })
        : res.status(404).json({ message: 'object was not found.' });
    } catch (error: any) {
      console.error('Controller renameObject Error:', error.message);
      res.status(500).json({ error: error.message });
    }
  }
}
