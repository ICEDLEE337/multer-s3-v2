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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("crypto");
const stream_1 = require("stream");
const file_type_1 = require("file-type");
const is_svg_1 = __importDefault(require("is-svg"));
const run_parallel_1 = __importDefault(require("run-parallel"));
function staticValue(value) {
    return function (_req, _file, cb) {
        cb(null, value);
    };
}
var defaultAcl = staticValue('private');
var defaultContentType = staticValue('application/octet-stream');
var defaultMetadata = staticValue(null);
var defaultCacheControl = staticValue(null);
var defaultContentDisposition = staticValue(null);
var defaultStorageClass = staticValue('STANDARD');
var defaultSSE = staticValue(null);
var defaultSSEKMS = staticValue(null);
function defaultKey(_req, _file, cb) {
    (0, crypto_1.randomBytes)(16, function (err, raw) {
        cb(err, err ? undefined : raw.toString('hex'));
    });
}
function autoContentType(_req, file, cb) {
    file.stream.once('data', function (firstChunk) {
        return __awaiter(this, void 0, void 0, function* () {
            var type = yield (0, file_type_1.fromBuffer)(firstChunk);
            var mime;
            if (type) {
                mime = type.mime;
            }
            else if ((0, is_svg_1.default)(firstChunk)) {
                mime = 'image/svg+xml';
            }
            else {
                mime = 'application/octet-stream';
            }
            var outStream = new stream_1.PassThrough();
            outStream.write(firstChunk);
            file.stream.pipe(outStream);
            cb(null, mime, outStream);
        });
    });
}
function collect(storage, req, file, cb) {
    (0, run_parallel_1.default)([
        storage.getBucket.bind(storage, req, file),
        storage.getKey.bind(storage, req, file),
        storage.getAcl.bind(storage, req, file),
        storage.getMetadata.bind(storage, req, file),
        storage.getCacheControl.bind(storage, req, file),
        storage.getContentDisposition.bind(storage, req, file),
        storage.getStorageClass.bind(storage, req, file),
        storage.getSSE.bind(storage, req, file),
        storage.getSSEKMS.bind(storage, req, file)
    ], function (err, values) {
        if (err)
            return cb(err);
        storage.getContentType(req, file, function (err, contentType, replacementStream) {
            if (err)
                return cb(err);
            cb.call(storage, null, {
                bucket: values[0],
                key: values[1],
                acl: values[2],
                metadata: values[3],
                cacheControl: values[4],
                contentDisposition: values[5],
                storageClass: values[6],
                contentType: contentType,
                replacementStream: replacementStream,
                serverSideEncryption: values[7],
                sseKmsKeyId: values[8]
            });
        });
    });
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
                this.getBucket = staticValue(opts.bucket);
                break;
            case 'undefined': throw new Error('bucket is required');
            default: throw new TypeError('Expected opts.bucket to be undefined, string or function');
        }
        switch (typeof opts.key) {
            case 'function':
                this.getKey = opts.key;
                break;
            case 'undefined':
                this.getKey = defaultKey;
                break;
            default: throw new TypeError('Expected opts.key to be undefined or function');
        }
        switch (typeof opts.acl) {
            case 'function':
                this.getAcl = opts.acl;
                break;
            case 'string':
                this.getAcl = staticValue(opts.acl);
                break;
            case 'undefined':
                this.getAcl = defaultAcl;
                break;
            default: throw new TypeError('Expected opts.acl to be undefined, string or function');
        }
        switch (typeof opts.contentType) {
            case 'function':
                this.getContentType = opts.contentType;
                break;
            case 'undefined':
                this.getContentType = defaultContentType;
                break;
            default: throw new TypeError('Expected opts.contentType to be undefined or function');
        }
        switch (typeof opts.metadata) {
            case 'function':
                this.getMetadata = opts.metadata;
                break;
            case 'undefined':
                this.getMetadata = defaultMetadata;
                break;
            default: throw new TypeError('Expected opts.metadata to be undefined or function');
        }
        switch (typeof opts.cacheControl) {
            case 'function':
                this.getCacheControl = opts.cacheControl;
                break;
            case 'string':
                this.getCacheControl = staticValue(opts.cacheControl);
                break;
            case 'undefined':
                this.getCacheControl = defaultCacheControl;
                break;
            default: throw new TypeError('Expected opts.cacheControl to be undefined, string or function');
        }
        switch (typeof opts.contentDisposition) {
            case 'function':
                this.getContentDisposition = opts.contentDisposition;
                break;
            case 'string':
                this.getContentDisposition = staticValue(opts.contentDisposition);
                break;
            case 'undefined':
                this.getContentDisposition = defaultContentDisposition;
                break;
            default: throw new TypeError('Expected opts.contentDisposition to be undefined, string or function');
        }
        switch (typeof opts.storageClass) {
            case 'function':
                this.getStorageClass = opts.storageClass;
                break;
            case 'string':
                this.getStorageClass = staticValue(opts.storageClass);
                break;
            case 'undefined':
                this.getStorageClass = defaultStorageClass;
                break;
            default: throw new TypeError('Expected opts.storageClass to be undefined, string or function');
        }
        switch (typeof opts.serverSideEncryption) {
            case 'function':
                this.getSSE = opts.serverSideEncryption;
                break;
            case 'string':
                this.getSSE = staticValue(opts.serverSideEncryption);
                break;
            case 'undefined':
                this.getSSE = defaultSSE;
                break;
            default: throw new TypeError('Expected opts.serverSideEncryption to be undefined, string or function');
        }
        switch (typeof opts.sseKmsKeyId) {
            case 'function':
                this.getSSEKMS = opts.sseKmsKeyId;
                break;
            case 'string':
                this.getSSEKMS = staticValue(opts.sseKmsKeyId);
                break;
            case 'undefined':
                this.getSSEKMS = defaultSSEKMS;
                break;
            default: throw new TypeError('Expected opts.sseKmsKeyId to be undefined, string, or function');
        }
        this.throwMimeTypeConflictErrorIf = opts.throwMimeTypeConflictErrorIf;
        this.transforms = opts.transforms;
    }
    _handleFile(req, file, cb) {
        collect(this, req, file, (err, opts) => this.collectCb(err, opts, file, cb));
    }
    collectCb(err, opts, file, cb) {
        return __awaiter(this, void 0, void 0, function* () {
            if (err)
                return cb(err);
            if (typeof this.throwMimeTypeConflictErrorIf === 'function' && this.throwMimeTypeConflictErrorIf(opts.contentType, file.mimetype, file)) {
                return cb(new Error(`MIMETYPE_MISMATCH: auto-detected content-type "${opts.contentType}" and client-specified mimetype "${file.mimetype}" failed configured validation for "${file.originalname}"`));
            }
            var currentSize = 0;
            var transform = !this.transforms ? null : typeof this.transforms === 'function' ? this.transforms() : this.transforms[file.fieldname]();
            var fileStream = opts.replacementStream || file.stream;
            if (transform) {
                fileStream = fileStream.pipe(transform);
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
            };
            if (opts.contentDisposition) {
                params.ContentDisposition = opts.contentDisposition;
            }
            var upload = yield this.s3.putObject(params);
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
        });
    }
    _removeFile(req, file, cb) {
        this.s3.deleteObject({ Bucket: file.bucket, Key: file.key }, cb);
    }
}
module.exports = function (opts) {
    return new S3Storage(opts);
};
module.exports.AUTO_CONTENT_TYPE = autoContentType;
module.exports.DEFAULT_CONTENT_TYPE = defaultContentType;