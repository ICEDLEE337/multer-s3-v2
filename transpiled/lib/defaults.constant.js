"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultSSEKMS = exports.defaultSSE = exports.defaultStorageClass = exports.defaultContentDisposition = exports.defaultCacheControl = exports.defaultMetadata = exports.defaultContentType = exports.defaultAcl = void 0;
const static_value_function_1 = require("./static-value.function");
exports.defaultAcl = (0, static_value_function_1.staticValue)('private');
exports.defaultContentType = (0, static_value_function_1.staticValue)('application/octet-stream');
exports.defaultMetadata = (0, static_value_function_1.staticValue)(null);
exports.defaultCacheControl = (0, static_value_function_1.staticValue)(null);
exports.defaultContentDisposition = (0, static_value_function_1.staticValue)(null);
exports.defaultStorageClass = (0, static_value_function_1.staticValue)('STANDARD');
exports.defaultSSE = (0, static_value_function_1.staticValue)(null);
exports.defaultSSEKMS = (0, static_value_function_1.staticValue)(null);