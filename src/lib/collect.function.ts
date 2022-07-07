import parallel from 'run-parallel'
import { S3Storage } from '../s3-storage'
import { IS3StorageOptions } from './types/options.interface'

export function collect(storage: S3Storage, req: Express.Request, file: Express.Multer.File, cb) {
    parallel([
        storage.getBucket.bind(storage, req, file),
        storage.getKey.bind(storage, req, file),
        storage.getAcl.bind(storage, req, file),
        storage.getMetadata.bind(storage, req, file),
        storage.getCacheControl.bind(storage, req, file),
        storage.getContentDisposition.bind(storage, req, file),
        storage.getStorageClass.bind(storage, req, file),
        storage.getSSE.bind(storage, req, file),
        storage.getSSEKMS.bind(storage, req, file)
    ], function (err, [bucket
        , key
        , acl
        , metadata
        , cacheControl
        , contentDisposition
        , storageClass
        , serverSideEncryption
        , sseKmsKeyId
    ]) {
        if (err) return cb(err)

        storage.getContentType(req, file, function (err, contentType, replacementStream) {
            if (err) return cb(err);

            // really should be IS3StorageOptions
            const uploadParams: any = {
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

            cb.call(storage, null, uploadParams)
        })
    })
}