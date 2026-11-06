const transientStatus = status => status === 429 || status >= 500 && status <= 599;
export const transientFailure = text => /(?:\b(?:429|500|502|503|504|520|521|522|523|524)\b|fetch failed|ECONNRESET|ETIMEDOUT|no healthy upstream|upstream connect error|network connection lost)/i.test(text);
export async function retryCloudflare(operation,{attempts=4,sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms)),beforeAttempt=async()=>{},onRetry=()=>{}}={}) {
  for(let attempt=0;attempt<attempts;attempt++){
    await beforeAttempt(attempt);
    let result;
    try{result=await operation();}catch(error){
      if(attempt===attempts-1||!(error instanceof TypeError||error?.name==='TimeoutError'||transientFailure(String(error?.message))))throw error;
      onRetry(attempt+1);await sleep(Math.min(30000,2000*2**attempt));continue;
    }
    if(!result||!transientStatus(result.status)||attempt===attempts-1)return result;
    const retryAfter=result.headers?.get('retry-after');
    const delay=retryAfter?(Number.isFinite(Number(retryAfter))?Number(retryAfter)*1000:Date.parse(retryAfter)-Date.now()):2000*2**attempt;
    await result.body?.cancel();onRetry(attempt+1);await sleep(Math.max(0,Math.min(30000,delay||2000*2**attempt)));
  }
}
