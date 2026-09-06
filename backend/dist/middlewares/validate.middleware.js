import { ZodError } from "zod";
export const validateSchema = (schema) => {
    return async (req, res, next) => {
        try {
            const parsed = await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            if (parsed.body)
                req.body = parsed.body;
            if (parsed.query)
                req.query = parsed.query;
            if (parsed.params)
                req.params = parsed.params;
            return next();
        }
        catch (error) {
            if (error instanceof ZodError || error?.name === "ZodError") {
                const formattedErrors = (error.issues || []).map((err) => ({
                    field: err.path && err.path.length > 1
                        ? err.path.slice(1).join(".")
                        : (err.path && err.path[0] ? String(err.path[0]) : "field"),
                    message: err.message,
                }));
                return res.status(400).json({
                    success: false,
                    message: formattedErrors[0]?.message || "Validation error",
                    errors: formattedErrors,
                });
            }
            return next(error);
        }
    };
};
