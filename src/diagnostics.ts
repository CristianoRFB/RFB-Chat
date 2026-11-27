// Contadores efêmeros: nunca armazenar mensagens, stack, URLs, UID ou tokens.
export const DIAGNOSTIC_CODES=['permission','network','auth','quota','unexpected'] as const;
export type DiagnosticCode=typeof DIAGNOSTIC_CODES[number];
export type DiagnosticCounts=Record<DiagnosticCode,number>;
export function categorizeError(error:unknown):DiagnosticCode{
 const code=typeof error==='object'&&error!==null&&'code' in error?String(error.code):'';
 if(code==='permission-denied'||code==='firestore/permission-denied')return 'permission';
 if(code==='unavailable'||code==='firestore/unavailable'||code==='auth/network-request-failed')return 'network';
 if(code==='resource-exhausted'||code==='firestore/resource-exhausted'||code==='auth/too-many-requests')return 'quota';
 if(code.startsWith('auth/'))return 'auth';
 return 'unexpected';
}
export function emptyDiagnostics():DiagnosticCounts{return {permission:0,network:0,auth:0,quota:0,unexpected:0};}
export function incrementDiagnostic(counts:DiagnosticCounts,error:unknown):DiagnosticCounts{
 const key=categorizeError(error);return {...counts,[key]:Math.min(999999,counts[key]+1)};
}
