import {createHash, timingSafeEqual} from 'node:crypto';
import type {Request, Response, NextFunction} from 'express';

/**
 * P0 release gate: no browser-bundled API keys or bypass on unconfigured servers.
 *
 * This is only a service-to-service boundary. It does NOT replace a signed
 * user session, tenant-scoped authorization, consent log, or RBAC policy.
 * Do not describe a successful token check as full compliance certification.
 */
export function isValidAdminApiToken(presentedHeader: string | undefined, secret: string | undefined): boolean {
  if (typeof secret !== 'string' || secret.length < 32 || secret.length > 512) return false;
  if (!presentedHeader || !/^Bearer [A-Za-z0-9_\-.~+/=]{32,512}$/.test(presentedHeader)) return false;
  const presented=presentedHeader.slice('Bearer '.length);
  const lhs=createHash('sha256').update(presented,'utf8').digest();
  const rhs=createHash('sha256').update(secret,'utf8').digest();
  return timingSafeEqual(lhs,rhs);
}

export function adminApiGate(req: Request,res:Response,next:NextFunction):void {
  res.setHeader('Cache-Control','no-store');
  res.setHeader('Pragma','no-cache');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','no-referrer');
  const key=process.env.HRGEN_ADMIN_API_TOKEN;
  if (!key || key.length<32 || key.length>512) {
    res.status(503).json({success:false,code:'PRIVATE_API_NOT_CONFIGURED',message:'Private API authentication is not configured.'});
    return;
  }
  if(!isValidAdminApiToken(req.get('authorization'),key)){
    res.setHeader('WWW-Authenticate','Bearer realm="HRGen Private API"');
    res.status(401).json({success:false,code:'ADMIN_AUTH_REQUIRED',message:'Authorized server-side access is required.'});
    return;
  }
  next();
}
