import { randomBytes } from "crypto"

export function defaultKey (_req: Express.Request, _file: Express.Multer.File, cb: Function) {
    randomBytes(16, function (err, raw) {
      cb(err, err ? undefined : raw.toString('hex'))
    })
  }