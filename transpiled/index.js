"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_CONTENT_TYPE = exports.AUTO_CONTENT_TYPE = void 0;
const auto_content_type_function_1 = require("./lib/auto-content-type.function");
const s3_storage_1 = require("./s3-storage");
const defaults_constant_1 = require("./lib/defaults.constant");
function default_1(opts) {
    return new s3_storage_1.S3Storage(opts);
}
exports.default = default_1;
exports.AUTO_CONTENT_TYPE = auto_content_type_function_1.autoContentType;
exports.DEFAULT_CONTENT_TYPE = defaults_constant_1.defaultContentType;
