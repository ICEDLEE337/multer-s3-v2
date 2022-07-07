
import {S3} from '@aws-sdk/client-s3';
import { IOptions } from './lib/types/options.interface'
import { StorageEngine } from 'multer'

import {staticValue} from './lib/static-value.function';
import { defaultKey} from './lib/default-key.function';
import { collect } from './lib/collect.function';

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
  constructor(opts: IOptions) {
  switch (typeof opts.s3) {
    case 'object': this.s3 = opts.s3; break
    default: throw new TypeError('Expected opts.s3 to be object')
  }

  switch (typeof opts.bucket) {
    case 'function': this.getBucket = opts.bucket; break
    case 'string': this.getBucket = staticValue(opts.bucket); break
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
    case 'string': this.getAcl = staticValue(opts.acl); break
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
    case 'string': this.getCacheControl = staticValue(opts.cacheControl); break
    case 'undefined': this.getCacheControl = defaultCacheControl; break
    default: throw new TypeError('Expected opts.cacheControl to be undefined, string or function')
  }

  switch (typeof opts.contentDisposition) {
    case 'function': this.getContentDisposition = opts.contentDisposition; break
    case 'string': this.getContentDisposition = staticValue(opts.contentDisposition); break
    case 'undefined': this.getContentDisposition = defaultContentDisposition; break
    default: throw new TypeError('Expected opts.contentDisposition to be undefined, string or function')
  }

  switch (typeof opts.storageClass) {
    case 'function': this.getStorageClass = opts.storageClass; break
    case 'string': this.getStorageClass = staticValue(opts.storageClass); break
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


_handleFile (req: Express.Request, file: Express.Multer.File, cb) {
  collect(this, req, file, (err, opts) => this.collectCb(err, opts, file, cb))
}

async collectCb (err, opts, file: Express.Multer.File, cb) {
  if (err) return cb(err)
  if (typeof this.throwMimeTypeConflictErrorIf === 'function' && this.throwMimeTypeConflictErrorIf(opts.contentType, file.mimetype, file)) {
    return cb(new Error(`MIMETYPE_MISMATCH: auto-detected content-type "${opts.contentType}" and client-specified mimetype "${file.mimetype}" failed configured validation for "${file.originalname}"`))
  }

  var currentSize = 0

  var transform = !this.transforms ? null : typeof this.transforms === 'function' ? this.transforms() : this.transforms[file.fieldname]()

  var fileStream = opts.replacementStream || file.stream
  if (transform) {
    fileStream = fileStream.pipe(transform)
  }

  var params = {
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

  var upload = await this.s3.putObject(params)

  // upload.on('httpUploadProgress', function (ev) {
  //   if (ev.total) currentSize = ev.total
  // })



  // upload.send(function (err, result) {
  //   if (err) return cb(err)

  //   cb(null, {
  //     size: currentSize,
  //     bucket: opts.bucket,
  //     key: opts.key,
  //     acl: opts.acl,
  //     contentType: opts.contentType,
  //     contentDisposition: opts.contentDisposition,
  //     storageClass: opts.storageClass,
  //     serverSideEncryption: opts.serverSideEncryption,
  //     metadata: opts.metadata,
  //     location: result.Location,
  //     etag: result.ETag,
  //     versionId: result.VersionId
  //   })
  // })
}

_removeFile (_req: Express.Request, file: Express.Multer.File, cb) {
  this.s3.deleteObject({ Bucket: file.bucket, Key: file.key }, cb)
}
}
