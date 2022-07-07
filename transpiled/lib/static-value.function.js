"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.staticValue = void 0;
function staticValue(value) {
    return function (_req, _file, cb) {
        cb(null, value);
    };
}
exports.staticValue = staticValue;
;
