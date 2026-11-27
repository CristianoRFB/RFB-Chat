import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
export const required=['ci','performance','visual-accessibility','security-review','privacy','antiabuse','media-retention','push','staging','backup-restore','quota-billing','rollback','owner-review','merge-approval','deploy-approval'];
const sha=/^[0-9a-f]{40}$/;
export function evaluateRelease(m,expectedSha){
 const errors=[],blocked=[];
 if(!sha.test(expectedSha??'')||!sha.test(m?.candidateSha??'')||m.candidateSha!==expectedSha)errors.push('candidate SHA missing or mismatched');
 if(m?.schema!==1)errors.push('schema');
 if(!Array.isArray(m?.gates))errors.push('gates');
 else {
  const seen=new Set();
  for(const g of m.gates){
   if(!g||!required.includes(g.id)||seen.has(g.id)){errors.push('unknown or duplicate gate');continue;}
   seen.add(g.id);
   if(!['PASS','BLOCKED','NOT_RUN','FAIL'].includes(g.status)){errors.push('invalid status '+g.id);continue;}
   if(typeof g.evidence!=='string'||!g.evidence.trim()){errors.push('missing evidence/reason '+g.id);continue;}
   if(g.status!=='PASS')blocked.push(g.id);
   else if(g.sha!==expectedSha)errors.push('stale evidence '+g.id);
  }
  for(const id of required)if(!seen.has(id))errors.push('missing gate '+id);
 }
 // Structural checks only: independently verify actual evidence and owner authorization.
 if(m?.billingEnabled!==false)blocked.push('billing-not-confirmed-disabled');
 if(m?.productionAuthorized!==true)blocked.push('production-not-authorized');
 if(m?.mergeAuthorized!==true)blocked.push('merge-not-authorized');
 if(m?.stagingAuthorized!==true)blocked.push('staging-not-authorized');
 return {status:errors.length?'INVALID':blocked.length?'BLOCKED':'STRUCTURE_COMPLETE_REVIEW_REQUIRED',errors,blocked};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{
  const [file,expected]=process.argv.slice(2);const result=evaluateRelease(JSON.parse(readFileSync(file,'utf8')),expected);console.log(JSON.stringify(result,null,2));process.exitCode=result.status==='INVALID'?2:result.status==='BLOCKED'?3:0;
 }catch(e){console.error('INVALID release manifest:',e.message);process.exitCode=2;}
}
