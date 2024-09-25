import * as Minio from 'minio';
import { minioClient } from '../server.js';
import { Readable, PassThrough } from 'stream';
import {
  BucketItemFromList,
  UploadedObjectInfo,
} from 'minio';
import { BucketsNames } from './model.js';

export default class MinioRepository {
  static async putObjectPromise(
    bucketName: BucketsNames,
    objectName: string,
    fileStream: NodeJS.ReadableStream,
    size: number,
    metadata?: any
  ): Promise<UploadedObjectInfo | null> {
    try {
      return new Promise<UploadedObjectInfo>((resolve, reject) => {
        // Convert the PassThrough stream to Buffer
        const chunks: Buffer[] = [];
        fileStream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        fileStream.on('end', () => {
          const buffer = Buffer.concat(chunks);
          console.log(
            'repository - upload - metadata',
            metadata,
            metadata ? JSON.stringify(metadata) : '{}'
          );
          minioClient.putObject(
            bucketName,
            objectName,
            buffer,
            size,
            metadata ? metadata : {},
            function (err, objInfo) {
              if (err) {
                console.error('putObjectPromise - error', err);
                reject(`File upload failed: ${err.message}`);
              } else {
                console.log(`File uploaded successfully ${objInfo}`);
                resolve(objInfo);
              }
            }
          );
        });
      });
    } catch (error: any) {
      console.error('Repository Error:', error.message);
      return null;
    }
  }

  static async uploadFile(
    bucketName: BucketsNames,
    recipeId: string,
    file: Express.Multer.File,
    metadata?: any,
  ): Promise<UploadedObjectInfo | null> {
    try {
      // Handle single file
      const fileStream = new PassThrough();
      fileStream.end(file.buffer);
      const fileName = `${recipeId}/${file.originalname}`;

      const res = await MinioRepository.putObjectPromise(
        bucketName,
        fileName,
        fileStream,
        file.size as number,
        metadata
      );

      // Wait for all uploads to complete

      console.log('repo - upload - success', res);
      return res;
    } catch (error: any) {
      console.error('Repository uploading Error:', error.message);
      return null;
    }
  }

  static async getFileByName(
    bucketName: BucketsNames,
    fileName: string
  ): Promise<{ stream: Readable; metadata: any }> {
    try {
      const stream = await minioClient.getObject(bucketName, fileName);
      const statPromise = await minioClient.statObject(bucketName, fileName);
      console.log('getFileByName', bucketName, '/', fileName);
      const metadata = statPromise.metaData;
      return { stream: stream, metadata: metadata };
    } catch (error: any) {
      console.error('Repository Error (getFileByName):', error.message);
      throw new Error(`repo - getFileByName: ${error}`);
    }
  }

  static async getFileMetadataByName(
    bucketName: BucketsNames,
    fileName: string
  ): Promise<any> {
    try {
      const statPromise = await minioClient.statObject(bucketName, fileName);
      console.log('getFileMetadataByName', bucketName, '/', fileName);
      const metadata = statPromise.metaData;
      return metadata;
    } catch (error: any) {
      console.error('Repository Error (getFileMetadataByName):', error.message);
      throw new Error(`repo - getFileMetadataByName: ${error}`);
    }
  }

  static async isFileExisted(
    bucketName: BucketsNames,
    fileName: string
  ): Promise<boolean> {
    try {
      const fileStream = await minioClient.getObject(bucketName, fileName);
      return !!fileStream;
    } catch (error: any) {
      if (error.code === 'NoSuchKey') {
        console.log(
          'Repository Error isFileExisted - not found:',
          error.message
        );
        return false;
      } else {
        console.error('Repository Error isFileExisted:', error.message);
        throw new Error(`repo - isFileExisted: ${error}`);
      }
    }
  }

  static async deleteFile(
    mainId: string,
    fileName: string
  ): Promise<boolean> {
    try {
      await minioClient
        .removeObject(mainId, fileName)
        .then(() => {
          return true;
        })
        .catch((err) => {
          console.log(err);
          throw err;
        });
      console.log('deleted');
      return true;
    } catch (error: any) {
      console.error('Repository Error - deleteFile:', error.message);
      // throw new Error(`repo - deleteFile: ${error}`);
      return false;
    }
  }

  static async updateMetadata(
    mainId: string,
    fileName: string,
    newMetadata: any
  ): Promise<UploadedObjectInfo | null> {
    try {
      const objectInfo = await minioClient.statObject(mainId, fileName);
      const existingMetadata = objectInfo.metaData;

      const updatedMetadata = {
        ...existingMetadata,
        ...newMetadata,
      };
      console.log('existingMetadata', existingMetadata);
      console.log('newMetadata', newMetadata);
      console.log('updatedMetadata', updatedMetadata);

      const getObjectStream = minioClient.getObject(mainId, fileName);

      const chunks: Buffer[] = [];

      (await getObjectStream).on('data', (chunk) =>
        chunks.push(Buffer.from(chunk))
      );

      // eslint-disable-next-line no-async-promise-executor
      await new Promise<void>(async (resolve, reject) => {
        (await getObjectStream).on('end', () => {
          resolve();
        });
        (await getObjectStream).on('error', (err) => reject(err));
      });

      const buffer = Buffer.concat(chunks);

      const putObjectInfo = await new Promise<UploadedObjectInfo>(
        (resolve, reject) => {
          minioClient.putObject(
            mainId,
            fileName,
            buffer,
            buffer.length,
            updatedMetadata,
            (err, objInfo) => {
              if (err) {
                console.error('putObject - error', err);
                reject(`Metadata update failed: ${err.message}`);
              } else {
                console.log(
                  `Metadata updated successfully: ${objInfo} ${updatedMetadata}`
                );
                resolve(objInfo);
              }
            }
          );
        }
      );

      return putObjectInfo;
    } catch (error: any) {
      if (error.code === 'NoSuchKey') {
        console.error(
          'Repository Error updateMetadata - not found:',
          error.message
        );
        return null;
      } else {
        console.error('Repository Error updateMetadata:', error.message);
        throw new Error(`updateMetadata: ${error}`);
      }
    }
  }

  static async createBucket(bucketName: BucketsNames): Promise<string> {
    try {
      return new Promise((resolve, reject) => {
        minioClient.makeBucket(bucketName, function (err) {
          if (err) {
            console.log(err);
            reject('File upload failed: ' + err);
          } else {
            console.log('bucket created successfully');
            resolve('bucket created successfully');
          }
        });
      });
    } catch (error: any) {
      console.error('Repository Error:', error.message);
      throw new Error(`repo - createBucket: ${error}`);
    }
  }

  static async getBucketsList(): Promise<BucketItemFromList[]> {
    try {
      const buckets = await minioClient.listBuckets();
      return buckets;
    } catch (error: any) {
      console.error('Repository Error:', error.message);
      throw new Error(`repo - getBucketsList: ${error}`);
    }
  }

  static async renameObject(
    bucketName: BucketsNames,
    oldObjectName: string,
    newObjectName: string
  ): Promise<boolean> {
    try {
      // Copy the object to the same bucket with the new name
      const conds = new Minio.CopyConditions();
      const stat = await minioClient.statObject(bucketName, oldObjectName);
      conds.setMatchETag(stat.etag);
      minioClient.copyObject(
        bucketName,
        newObjectName,
        `/${bucketName}/${oldObjectName}`,
        conds,
        function (e, data) {
          if (e) {
            return console.log(e);
          }
          console.log('Successfully copied the object:');
          console.log(
            'etag = ' + data.etag + ', lastModified = ' + data.lastModified
          );
        }
      );

      // Remove the old object
      await minioClient.removeObject(bucketName, oldObjectName);

      console.log(
        `Object "${oldObjectName}" renamed to "${newObjectName}" successfully.`
      );
      return true;
    } catch (error) {
      console.error('Error renaming object:', error);
      return false;
    }
  }
}
