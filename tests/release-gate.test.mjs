import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {evaluateRelease,required} from '../scripts/release-gate.mjs';
const sha='a'.repeat(40);
function fixture(){return {schema:1,candidateSha:sha,billingEnabled:false,productionAuthorized:true,mergeAuthorized:true,stagingAuthorized:true,gates:required.map(id=>({id,status:'PASS',sha,evidence:'synthetic test fixture'}))};}
test('complete structure still requires human review',()=>assert.equal(evaluateRelease(fixture(),sha).status,'STRUCTURE_COMPLETE_REVIEW_REQUIRED'));
test('stale SHA blocks',()=>assert.equal(evaluateRelease(fixture(),'b'.repeat(40)).status,'INVALID'));
test('missing gate blocks',()=>{const m=fixture();m.gates.pop();assert.equal(evaluateRelease(m,sha).status,'INVALID');});
test('duplicate gate blocks',()=>{const m=fixture();m.gates.push(m.gates[0]);assert.equal(evaluateRelease(m,sha).status,'INVALID');});
test('stale evidence blocks',()=>{const m=fixture();m.gates[0].sha='b'.repeat(40);assert.equal(evaluateRelease(m,sha).status,'INVALID');});
test('missing evidence blocks',()=>{const m=fixture();m.gates[0].evidence='';assert.equal(evaluateRelease(m,sha).status,'INVALID');});
test('not run, no approval and unknown billing block',()=>{const m=fixture();m.gates[0].status='NOT_RUN';m.productionAuthorized=false;m.billingEnabled=null;const r=evaluateRelease(m,sha);assert.equal(r.status,'BLOCKED');assert.ok(r.blocked.includes('ci'));assert.ok(r.blocked.includes('production-not-authorized'));assert.ok(r.blocked.includes('billing-not-confirmed-disabled'));});
test('real repository release manifest deliberately remains blocked',()=>{const m=JSON.parse(readFileSync('docs/rfb/RELEASE-MANIFEST.json','utf8'));assert.equal(evaluateRelease(m,m.candidateSha).status,'BLOCKED');});
