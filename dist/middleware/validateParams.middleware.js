const validateParams = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.params);
        if (error) {
            res.status(400).json({ success: false, message: error.details[0].message });
            return;
        }
        next();
    };
};
export default validateParams;
