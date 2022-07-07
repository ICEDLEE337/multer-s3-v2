"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3Storage = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const lib_storage_1 = require("@aws-sdk/lib-storage");
const static_value_function_1 = require("./lib/static-value.function");
const default_key_function_1 = require("./lib/default-key.function");
const collect_function_1 = require("./lib/collect.function");
const defaults_constant_1 = require("./lib/defaults.constant");
const stream_1 = require("stream");
function defaultS3PutObjectRequest(Bucket) {
    return {
        ACL: 'private',
        Bucket,
        CacheControl: 'no-cache, no-store, must-revalidate, proxy-revalidate, max-age=0',
        ServerSideEncryption: 'AES256',
    };
}
class S3Storage {
    constructor(opts) {
        switch (typeof opts.s3) {
            case 'object':
                this.s3 = opts.s3;
                break;
            default: throw new TypeError('Expected opts.s3 to be object');
        }
        switch (typeof opts.bucket) {
            case 'function':
                this.getBucket = opts.bucket;
                break;
            case 'string':
                this.getBucket = (0, static_value_function_1.staticValue)(opts.bucket);
                break;
            case 'undefined': throw new Error('bucket is required');
            default: throw new TypeError('Expected opts.bucket to be undefined, string or function');
        }
        switch (typeof opts.key) {
            case 'function':
                this.getKey = opts.key;
                break;
            case 'undefined':
                this.getKey = default_key_function_1.defaultKey;
                break;
            default: throw new TypeError('Expected opts.key to be undefined or function');
        }
        switch (typeof opts.acl) {
            case 'function':
                this.getAcl = opts.acl;
                break;
            case 'string':
                this.getAcl = (0, static_value_function_1.staticValue)(opts.acl);
                break;
            case 'undefined':
                this.getAcl = defaults_constant_1.defaultAcl;
                break;
            default: throw new TypeError('Expected opts.acl to be undefined, string or function');
        }
        switch (typeof opts.contentType) {
            case 'function':
                this.getContentType = opts.contentType;
                break;
            case 'undefined':
                this.getContentType = defaults_constant_1.defaultContentType;
                break;
            default: throw new TypeError('Expected opts.contentType to be undefined or function');
        }
        switch (typeof opts.metadata) {
            case 'function':
                this.getMetadata = opts.metadata;
                break;
            case 'undefined':
                this.getMetadata = defaults_constant_1.defaultMetadata;
                break;
            default: throw new TypeError('Expected opts.metadata to be undefined or function');
        }
        switch (typeof opts.cacheControl) {
            case 'function':
                this.getCacheControl = opts.cacheControl;
                break;
            case 'string':
                this.getCacheControl = (0, static_value_function_1.staticValue)(opts.cacheControl);
                break;
            case 'undefined':
                this.getCacheControl = defaults_constant_1.defaultCacheControl;
                break;
            default: throw new TypeError('Expected opts.cacheControl to be undefined, string or function');
        }
        switch (typeof opts.contentDisposition) {
            case 'function':
                this.getContentDisposition = opts.contentDisposition;
                break;
            case 'string':
                this.getContentDisposition = (0, static_value_function_1.staticValue)(opts.contentDisposition);
                break;
            case 'undefined':
                this.getContentDisposition = defaults_constant_1.defaultContentDisposition;
                break;
            default: throw new TypeError('Expected opts.contentDisposition to be undefined, string or function');
        }
        switch (typeof opts.storageClass) {
            case 'function':
                this.getStorageClass = opts.storageClass;
                break;
            case 'string':
                this.getStorageClass = (0, static_value_function_1.staticValue)(opts.storageClass);
                break;
            case 'undefined':
                this.getStorageClass = defaults_constant_1.defaultStorageClass;
                break;
            default: throw new TypeError('Expected opts.storageClass to be undefined, string or function');
        }
        switch (typeof opts.serverSideEncryption) {
            case 'function':
                this.getSSE = opts.serverSideEncryption;
                break;
            case 'string':
                this.getSSE = (0, static_value_function_1.staticValue)(opts.serverSideEncryption);
                break;
            case 'undefined':
                this.getSSE = defaults_constant_1.defaultSSE;
                break;
            default: throw new TypeError('Expected opts.serverSideEncryption to be undefined, string or function');
        }
        switch (typeof opts.sseKmsKeyId) {
            case 'function':
                this.getSSEKMS = opts.sseKmsKeyId;
                break;
            case 'string':
                this.getSSEKMS = (0, static_value_function_1.staticValue)(opts.sseKmsKeyId);
                break;
            case 'undefined':
                this.getSSEKMS = defaults_constant_1.defaultSSEKMS;
                break;
            default: throw new TypeError('Expected opts.sseKmsKeyId to be undefined, string, or function');
        }
        this.throwMimeTypeConflictErrorIf = opts.throwMimeTypeConflictErrorIf;
        this.transforms = opts.transforms;
    }
    _handleFile(req, file, cb) {
        (0, collect_function_1.collect)(this, req, file, (err, opts) => this.processUpload(err, opts, file, cb));
    }
    _removeFile(_req, file, cb) {
        this.delete(file.key, file.bucket).then(result => cb(null, result)).catch(cb);
    }
    processUpload(err, opts, file, cb) {
        return __awaiter(this, void 0, void 0, function* () {
            if (err)
                return cb(err);
            if (typeof this.throwMimeTypeConflictErrorIf === 'function' && this.throwMimeTypeConflictErrorIf(opts.contentType, file.mimetype, file)) {
                return cb(new Error(`MIMETYPE_MISMATCH: auto-detected content-type "${opts.contentType}" and client-specified mimetype "${file.mimetype}" failed configured validation for "${file.originalname}"`));
            }
            let currentSize = 0;
            const transform = !this.transforms ? null : typeof this.transforms === 'function' ? this.transforms() : this.transforms[file.fieldname]();
            let fileStream = opts.replacementStream || file.stream;
            if (transform) {
                fileStream = fileStream.pipe(transform);
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
            };
            if (opts.contentDisposition) {
                params.ContentDisposition = opts.contentDisposition;
            }
            const outputStream = new stream_1.PassThrough();
            const upload = this.uploadStream(params.ContentType, params.Key, outputStream, opts.bucket, params);
            fileStream.pipe(outputStream);
            upload.on('httpUploadProgress', function (ev) {
                if (ev.total)
                    currentSize = ev.total;
            });
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
                    location: null,
                    etag: null,
                    versionId: null //result.VersionId
                });
            }).catch(err => cb(err));
        });
    }
    uploadStream(ContentType, Key, stream, bucket, params) {
        const upload = new lib_storage_1.Upload({
            client: this.s3,
            params: Object.assign(Object.assign(Object.assign({}, params), defaultS3PutObjectRequest(bucket)), { Body: stream, ContentType, Key }),
        });
        return upload;
    }
    delete(key, Bucket) {
        if (Array.isArray(key)) {
            const Objects = key.map((Key) => ({ Key }));
            const deleteObjectsCommand = new client_s3_1.DeleteObjectsCommand({ Bucket, Delete: { Objects } });
            return this.s3.send(deleteObjectsCommand);
        }
        const deleteObjectCommand = new client_s3_1.DeleteObjectCommand({ Bucket, Key: key });
        return this.s3.send(deleteObjectCommand);
    }
}
exports.S3Storage = S3Storage;
