
export function staticValue (value?: string | null) {
    return function (_req: Express.Request, _file: Express.Multer.File, cb: Function) {
      cb(null, value)
    }
  };
