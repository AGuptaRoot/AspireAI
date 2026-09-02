import multer from "multer";
import path from "path";
import type { Request, Response, NextFunction } from "express";

// Configure memory storage
const storage = multer.memoryStorage();

// Multer upload instance
const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB file size limit
        files: 1, // Only 1 file per request
    },
    fileFilter: (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const isPdfExt = ext === ".pdf";
        const isPdfMime = file.mimetype === "application/pdf";

        if (isPdfExt || isPdfMime) {
            cb(null, true);
        } else {
            cb(new Error("Invalid file type. Only PDF documents are allowed (.pdf)"));
        }
    },
});

/**
 * Middleware wrapper for upload.single('document' or 'resume')
 * Supports either field name "document" or "resume" for frontend flexibility
 */
export const uploadResumeFile = (req: Request, res: Response, next: NextFunction) => {
    // Check if the upload is under 'document' or 'resume' or 'file'
    const uploadHandler = upload.fields([
        { name: "document", maxCount: 1 },
        { name: "resume", maxCount: 1 },
        { name: "file", maxCount: 1 },
    ]);

    uploadHandler(req, res, (err: any) => {
        if (err instanceof multer.MulterError) {
            if (err.code === "LIMIT_FILE_SIZE") {
                return res.status(400).json({
                    success: false,
                    message: "File is too large. Maximum allowed size is 5MB.",
                });
            }
            return res.status(400).json({
                success: false,
                message: `File upload error: ${err.message}`,
            });
        } else if (err) {
            return res.status(400).json({
                success: false,
                message: err.message || "Failed to upload file",
            });
        }

        // Attach the found file to req.file for standard handler access
        const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
        if (files) {
            if (files["document"] && files["document"].length > 0) {
                req.file = files["document"][0];
            } else if (files["resume"] && files["resume"].length > 0) {
                req.file = files["resume"][0];
            } else if (files["file"] && files["file"].length > 0) {
                req.file = files["file"][0];
            }
        }

        next();
    });
};
