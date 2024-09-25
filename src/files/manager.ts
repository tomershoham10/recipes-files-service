// manager.ts
import { BucketItemFromList, UploadedObjectInfo } from 'minio';
import MinioRepository from './repository.js';
import { BucketsNames } from './model.js';
import { Readable } from 'stream';

export default class MinioManager {
  static async uploadFile(
    bucketName: BucketsNames,
    recipeId: string,
    file: Express.Multer.File,
    metadata?: any,
  ): Promise<UploadedObjectInfo | null> {
    try {
      console.log('manager - uploadFile');
      const minioResult = await MinioRepository.uploadFile(
        bucketName,
        recipeId,
        file,
        metadata,
      );
      console.log('manager - uploadFile result', minioResult);
      if (!minioResult) {
        throw new Error('Error uploading file');
      }
      return minioResult;
    } catch (error: any) {
      console.error('Manager Error [uploadFile]:', error.message);
      return null;
    }
  }

  static async getFileByName(
    bucketName: BucketsNames,
    recipeId: string,
    objectName: string,
  ): Promise<{ stream: Readable; metadata: any }> {
    const fileName = `/${recipeId}/${objectName}`;
    const fileObject = await MinioRepository.getFileByName(
      bucketName,
      fileName
    );
    return fileObject;
  }

  static async getFileMetadataByName(
    bucketName: BucketsNames,
    recipeId: string,
    objectName: string,
  ): Promise<any> {
    const fileName = `${recipeId}/${objectName}`;
    const metadata = await MinioRepository.getFileMetadataByName(
      bucketName,
      fileName
    );
    return metadata;
  }


  static async isFileExisted(
    bucketName: BucketsNames,
    fileName: string,
  ): Promise<boolean> {
    try {
      const status = await MinioRepository.isFileExisted(bucketName, fileName);
      return status;
    } catch (error: any) {
      console.error('Manager Error [isFileExisted]:', error.message);
      throw new Error('Error in isFileExisted');
    }
  }

  static async updateMetadata(
    bucketName: BucketsNames,
    recipeId: string,
    objectName: string,
    meatadata: any
  ): Promise<UploadedObjectInfo | null> {
    try {
      const fileName = `${recipeId}/${objectName}`;

      const updatedFile = await MinioRepository.updateMetadata(
        bucketName,
        fileName,
        meatadata
      );
      return updatedFile;
    } catch (error: any) {
      console.error('Manager Error [updateMetadata]:', error.message);
      throw new Error('Error in updateMetadata');
    }
  }

  static async deleteFile(
    bucketName: BucketsNames,
    recipeId: string,
    objectName: string,
  ): Promise<boolean> {
    try {
      const fileName = `${recipeId}/${objectName}`;
      console.log('manager - deleteFile - fileName', fileName);
      const response = await MinioRepository.deleteFile(
        bucketName,
        fileName
      );
      return response;
    } catch (error: any) {
      console.error('Manager Error [deleteFile]:', error.message);
      throw new Error('Error in deleteFile');
    }
  }

  static async createBucket(bucketName: BucketsNames): Promise<string> {
    try {
      return MinioRepository.createBucket(bucketName);
    } catch (error: any) {
      console.error('Manager Error [createBucket]:', error.message);
      throw new Error('Error in createBucket');
    }
  }

  static async getBucketsList(): Promise<BucketItemFromList[]> {
    try {
      return MinioRepository.getBucketsList();
    } catch (error: any) {
      console.error('Manager Error [getBucketsList]:', error.message);
      throw new Error('Error in getBucketsList');
    }
  }

  static async renameObject(
    bucketName: BucketsNames,
    oldObjectName: string,
    newObjectName: string
  ): Promise<boolean> {
    try {
      return MinioRepository.renameObject(
        bucketName,
        oldObjectName,
        newObjectName
      );
    } catch (error: any) {
      console.error('Manager Error [renameObject]:', error.message);
      throw new Error('Error in renameObject');
    }
  }
}
