import parallel from 'run-parallel'
import { S3Storage } from '../s3-storage'

export function collect (storage: S3Storage, req: Express.Request, file: Express.Multer.File, cb) {
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
  ], function (err, values) {
    if (err) return cb(err)

    storage.getContentType(req, file, function (err, contentType, replacementStream) {
      if (err) return cb(err)

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
      })
    })
  })
}