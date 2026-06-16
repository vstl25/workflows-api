declare module 'hpp' {
  import { RequestHandler } from 'express';

  function hpp(options?: {
    checkBody?: boolean;
    checkQuery?: boolean;
    checkParams?: boolean;
    whitelist?: string[];
    logger?: (message: string) => void;
  }): RequestHandler;

  export default hpp;
}
