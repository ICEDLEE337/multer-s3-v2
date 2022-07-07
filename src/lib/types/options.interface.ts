import { S3, ServerSideEncryption } from '@aws-sdk/client-s3';

export interface IS3StorageOptions {
  bucket: any
  key: string;
  acl: string;
  contentType: string;
  metadata: string;
  cacheControl: string;
  contentDisposition: string;
  storageClass: string;
  serverSideEncryption: ServerSideEncryption;
  sseKmsKeyId: string;
  throwMimeTypeConflictErrorIf: Function;
  transforms: string;
  s3: S3;
};