import assert from 'node:assert/strict';
import test from 'node:test';
import {submitInquiry} from '../lead-form.js';

const input={idempotencyKey:'11111111-1111-4111-8111-111111111111',name:'Локальный тест',phone:'+70000000000'};
test('a stalled inquiry is aborted and becomes retryable without an external request',async()=>{
  let aborted=false;
  const mockFetch=(_url,options)=>new Promise((_resolve,reject)=>{
    if(!options.signal){reject(new Error('Request has no cancellation signal'));return;}
    options.signal.addEventListener('abort',()=>{aborted=true;reject(new DOMException('Stopped','AbortError'));},{once:true});
  });
  await assert.rejects(submitInquiry(input,mockFetch,{timeoutMs:10}),error=>error.code==='timeout');
  assert.equal(aborted,true);
});
test('an inquiry does not report success for malformed acknowledgement or an HTTP error',async()=>{
  for(const response of [{ok:true,json:async()=>{throw new Error('bad JSON');}},
    {ok:false,json:async()=>({ok:false,error:{code:'rate_limited'}})}]){
    await assert.rejects(submitInquiry(input,async()=>response),error=>['request_failed','rate_limited'].includes(error.code));
  }
});
