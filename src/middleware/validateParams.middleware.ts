import { Request, Response, NextFunction } from "express";
import { ObjectSchema } from "joi";

const validateParams = (schema: ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.params);

    if (error) {
      res.status(400).json({ success: false, message: error.details[0].message });
      return;
    }

    next();
  };
};

export default validateParams;
