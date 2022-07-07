import { PassThrough } from 'stream'
import { fromBuffer } from 'file-type'
import isSvg from 'is-svg'

export function autoContentType (_req: Express.Request, file: Express.Multer.File, cb: Function) {
    file.stream.once('data', async function (firstChunk) {
      var type = await fromBuffer(firstChunk)
      var mime

      if (type) {
        mime = type.mime
      } else if (isSvg(firstChunk)) {
        mime = 'image/svg+xml'
      } else {
        mime = 'application/octet-stream'
      }

      var outStream = new PassThrough()

      outStream.write(firstChunk)
      file.stream.pipe(outStream)

      cb(null, mime, outStream)
    })
  }