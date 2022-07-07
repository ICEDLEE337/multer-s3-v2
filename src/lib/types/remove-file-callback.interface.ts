
export interface IRemoveFileCallback {
    (error?: any, info?: Partial<Express.Multer.File>): void
};