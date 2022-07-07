import { S3 } from '@aws-sdk/client-s3';

export interface IOptions {
    bucket: any
    key: string;
    acl: string;
    contentType: string;
    metadata: string;
    cacheControl: string;
    contentDisposition: string;
    storageClass: string;
    serverSideEncryption: string;
    sseKmsKeyId: string;
    throwMimeTypeConflictErrorIf: Function;
    transforms: string;
    s3: S3;
  };
