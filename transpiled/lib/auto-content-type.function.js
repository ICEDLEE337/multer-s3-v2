"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.autoContentType = void 0;
const stream_1 = require("stream");
const file_type_1 = require("file-type");
const is_svg_1 = __importDefault(require("is-svg"));
function autoContentType(_req, file, cb) {
    file.stream.once('data', function (firstChunk) {
        return __awaiter(this, void 0, void 0, function* () {
            var type = yield (0, file_type_1.fromBuffer)(firstChunk);
            var mime;
            if (type) {
                mime = type.mime;
            }
            else if ((0, is_svg_1.default)(firstChunk)) {
                mime = 'image/svg+xml';
            }
            else {
                mime = 'application/octet-stream';
            }
            var outStream = new stream_1.PassThrough();
            outStream.write(firstChunk);
            file.stream.pipe(outStream);
            cb(null, mime, outStream);
        });
    });
}
exports.autoContentType = autoContentType;
