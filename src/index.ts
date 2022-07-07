import { autoContentType } from './lib/auto-content-type.function';
import {S3Storage} from './s3-storage';
import {defaultContentType} from './lib/defaults.constant';
import { IOptions } from './lib/types/options.interface';

export default function (opts: IOptions) {
  return new S3Storage(opts)
}

export const AUTO_CONTENT_TYPE = autoContentType
export const DEFAULT_CONTENT_TYPE = defaultContentType
