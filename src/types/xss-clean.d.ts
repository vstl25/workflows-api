declare module 'xss-clean' {
  import { Request, Response, NextFunction } from 'express';
  
  function xssClean(): (req: Request, res: Response, next: NextFunction) => void;
  
  export = xssClean;
}
