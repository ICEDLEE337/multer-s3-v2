"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.collect = void 0;
const run_parallel_1 = __importDefault(require("run-parallel"));
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
    ], function (err, [bucket, key, acl, metadata, cacheControl, contentDisposition, storageClass, serverSideEncryption, sseKmsKeyId]) {
        if (err)
            return cb(err);
        storage.getContentType(req, file, function (err, contentType, replacementStream) {
            if (err)
                return cb(err);
            // really should be IS3StorageOptions
            const uploadParams = {
                bucket,
                key,
                acl,
                metadata,
                cacheControl,
                contentDisposition,
                storageClass,
                contentType,
                replacementStream,
                serverSideEncryption,
                sseKmsKeyId,
            };
            cb.call(storage, null, uploadParams);
        });
    });
}
exports.collect = collect;
