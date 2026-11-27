import {describe,it,expect} from 'vitest';
import {categorizeError,emptyDiagnostics,incrementDiagnostic} from '../src/diagnostics';
describe('diagnóstico local sem dados pessoais',()=>{
 it('classifica códigos sem reter conteúdo de erro',()=>{
  expect(categorizeError({code:'permission-denied',message:'conteúdo privado'})).toBe('permission');
  expect(categorizeError({code:'auth/network-request-failed'})).toBe('network');
  expect(categorizeError({code:'resource-exhausted'})).toBe('quota');
  expect(categorizeError({code:'auth/invalid-credential'})).toBe('auth');
  const counts=incrementDiagnostic(emptyDiagnostics(),new Error('segredo sintético'));
  expect(counts.unexpected).toBe(1);expect(JSON.stringify(counts)).not.toContain('segredo');
 });
 it('limita contadores e não modifica a entrada',()=>{
  const before={...emptyDiagnostics(),unexpected:999999};
  expect(incrementDiagnostic(before,null)).toEqual(before);
  expect(incrementDiagnostic(before,{code:'unavailable'}).network).toBe(1);
  expect(before.network).toBe(0);
 });
});
