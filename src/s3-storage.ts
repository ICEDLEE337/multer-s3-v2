
import { DeleteObjectCommand, DeleteObjectsCommand, S3 } from '@aws-sdk/client-s3';
import { IS3StorageOptions } from './lib/types/options.interface'
import { StorageEngine } from 'multer'
import { Upload } from '@aws-sdk/lib-storage';

import { staticValue } from './lib/static-value.function';
import { defaultKey } from './lib/default-key.function';
import { collect } from './lib/collect.function';
import { IHandleFileCallback } from './lib/types/handle-file-callback.interface';
import { IRemoveFileCallback } from './lib/types/remove-file-callback.interface';
import { defaultAcl, defaultCacheControl, defaultContentDisposition, defaultContentType, defaultMetadata, defaultSSE, defaultSSEKMS, defaultStorageClass } from './lib/defaults.constant';
import { PutObjectCommand, PutObjectRequest } from "@aws-sdk/client-s3"
import { MimeType } from "file-type"
import { PassThrough, Stream } from "stream"
import core from 'file-type/core';

function defaultS3PutObjectRequest(Bucket: string): Pick<
  PutObjectRequest,
  'ACL' | 'Bucket' | 'CacheControl' | 'ServerSideEncryption'
> {
  return {
    ACL: 'private',
    Bucket,
    CacheControl: 'no-cache, no-store, must-revalidate, proxy-revalidate, max-age=0',
    ServerSideEncryption: 'AES256',
  };
}

export class S3Storage implements StorageEngine {
  s3: S3;
  getBucket: any
  getKey: any
  getAcl: any
  getContentType: any
  getMetadata: any
  getCacheControl: any
  getContentDisposition: any
  getStorageClass: any
  getSSE: any
  getSSEKMS: any
  throwMimeTypeConflictErrorIf: any
  transforms: any

  constructor(opts: IS3StorageOptions) {
    switch (typeof opts.s3) {
      case 'object': this.s3 = opts.s3; break
      default: throw new TypeError('Expected opts.s3 to be object')
    }

    switch (typeof opts.bucket) {
      case 'function': this.getBucket = opts.bucket; break
      case 'string': this.getBucket = staticValue<string>(opts.bucket); break
      case 'undefined': throw new Error('bucket is required')
      default: throw new TypeError('Expected opts.bucket to be undefined, string or function')
    }

    switch (typeof opts.key) {
      case 'function': this.getKey = opts.key; break
      case 'undefined': this.getKey = defaultKey; break
      default: throw new TypeError('Expected opts.key to be undefined or function')
    }

    switch (typeof opts.acl) {
      case 'function': this.getAcl = opts.acl; break
      case 'string': this.getAcl = staticValue<string>(opts.acl); break
      case 'undefined': this.getAcl = defaultAcl; break
      default: throw new TypeError('Expected opts.acl to be undefined, string or function')
    }

    switch (typeof opts.contentType) {
      case 'function': this.getContentType = opts.contentType; break
      case 'undefined': this.getContentType = defaultContentType; break
      default: throw new TypeError('Expected opts.contentType to be undefined or function')
    }

    switch (typeof opts.metadata) {
      case 'function': this.getMetadata = opts.metadata; break
      case 'undefined': this.getMetadata = defaultMetadata; break
      default: throw new TypeError('Expected opts.metadata to be undefined or function')
    }

    switch (typeof opts.cacheControl) {
      case 'function': this.getCacheControl = opts.cacheControl; break
      case 'string': this.getCacheControl = staticValue<string>(opts.cacheControl); break
      case 'undefined': this.getCacheControl = defaultCacheControl; break
      default: throw new TypeError('Expected opts.cacheControl to be undefined, string or function')
    }

    switch (typeof opts.contentDisposition) {
      case 'function': this.getContentDisposition = opts.contentDisposition; break
      case 'string': this.getContentDisposition = staticValue<string>(opts.contentDisposition); break
      case 'undefined': this.getContentDisposition = defaultContentDisposition; break
      default: throw new TypeError('Expected opts.contentDisposition to be undefined, string or function')
    }

    switch (typeof opts.storageClass) {
      case 'function': this.getStorageClass = opts.storageClass; break
      case 'string': this.getStorageClass = staticValue<string>(opts.storageClass); break
      case 'undefined': this.getStorageClass = defaultStorageClass; break
      default: throw new TypeError('Expected opts.storageClass to be undefined, string or function')
    }

    switch (typeof opts.serverSideEncryption) {
      case 'function': this.getSSE = opts.serverSideEncryption; break
      case 'string': this.getSSE = staticValue(opts.serverSideEncryption); break
      case 'undefined': this.getSSE = defaultSSE; break
      default: throw new TypeError('Expected opts.serverSideEncryption to be undefined, string or function')
    }

    switch (typeof opts.sseKmsKeyId) {
      case 'function': this.getSSEKMS = opts.sseKmsKeyId; break
      case 'string': this.getSSEKMS = staticValue(opts.sseKmsKeyId); break
      case 'undefined': this.getSSEKMS = defaultSSEKMS; break
      default: throw new TypeError('Expected opts.sseKmsKeyId to be undefined, string, or function')
    }

    this.throwMimeTypeConflictErrorIf = opts.throwMimeTypeConflictErrorIf
    this.transforms = opts.transforms
  }

  _handleFile(req: Express.Request, file: Express.Multer.File, cb: IHandleFileCallback) {
    collect(this, req, file, (err, opts) => this.processUpload(err, opts, file, cb))
  }

  _removeFile(_req: Express.Request, file: Express.Multer.File & { key: string, bucket: string }, cb: IRemoveFileCallback) {
    this.delete(file.key, file.bucket).then(result => cb(null, result)).catch(cb)
  }

  async processUpload(err, opts: IS3StorageOptions & { replacementStream: Stream }, file: Express.Multer.File, cb) {
    if (err) return cb(err)
    if (typeof this.throwMimeTypeConflictErrorIf === 'function' && this.throwMimeTypeConflictErrorIf(opts.contentType, file.mimetype, file)) {
      return cb(new Error(`MIMETYPE_MISMATCH: auto-detected content-type "${opts.contentType}" and client-specified mimetype "${file.mimetype}" failed configured validation for "${file.originalname}"`))
    }

    let currentSize = 0

    const transform = !this.transforms ? null : typeof this.transforms === 'function' ? this.transforms() : this.transforms[file.fieldname]()

    let fileStream = opts.replacementStream || file.stream;

    if (transform) {
      fileStream = fileStream.pipe(transform)
    }

    const params = {
      Bucket: opts.bucket,
      Key: opts.key,
      ACL: opts.acl,
      CacheControl: opts.cacheControl,
      ContentType: opts.contentType,
      Metadata: opts.metadata,
      StorageClass: opts.storageClass,
      ServerSideEncryption: opts.serverSideEncryption,
      SSEKMSKeyId: opts.sseKmsKeyId,
      Body: fileStream,
      ContentDisposition: null
    }

    if (opts.contentDisposition) {
      params.ContentDisposition = opts.contentDisposition
    }

    const outputStream = new PassThrough();

    const upload = this.uploadStream(params.ContentType as MimeType, params.Key, outputStream, opts.bucket, params)
    fileStream.pipe(outputStream);

    upload.on('httpUploadProgress', function (ev) {
      if (ev.total) currentSize = ev.total
    })

    upload.done().then(result => {
      cb(null, {
        size: currentSize,
        bucket: opts.bucket,
        key: opts.key,
        acl: opts.acl,
        contentType: opts.contentType,
        contentDisposition: opts.contentDisposition,
        storageClass: opts.storageClass,
        serverSideEncryption: opts.serverSideEncryption,
        metadata: opts.metadata,
        location: null, //result.Location,
        etag: null, //result.ETag,
        versionId: null //result.VersionId
      })
    }).catch(err => cb(err));
  }

  uploadStream(ContentType: MimeType, Key: string, stream: PassThrough, bucket: string, params) {
    const upload = new Upload({
      client: this.s3,
      params: { ...params, ...defaultS3PutObjectRequest(bucket), Body: stream, ContentType, Key },
    });

    return upload;
  }

  delete(key: string | string[], Bucket: string) {
    if (Array.isArray(key)) {
      const Objects = key.map((Key) => ({ Key }));
      const deleteObjectsCommand = new DeleteObjectsCommand({ Bucket, Delete: { Objects } });

      return this.s3.send(deleteObjectsCommand);
    }
    const deleteObjectCommand = new DeleteObjectCommand({ Bucket, Key: key });

    return this.s3.send(deleteObjectCommand);
  }
}
