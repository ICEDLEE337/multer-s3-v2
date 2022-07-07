"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultKey = void 0;
const crypto_1 = require("crypto");
function defaultKey(_req, _file, cb) {
    (0, crypto_1.randomBytes)(16, function (err, raw) {
        cb(err, err ? undefined : raw.toString('hex'));
    });
}
exports.defaultKey = defaultKey;
