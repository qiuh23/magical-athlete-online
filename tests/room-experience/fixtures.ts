import { test as base, expect } from '@playwright/test';
import { createApplication } from '../../src/server/index.js';

type Application = ReturnType<typeof createApplication>;
export const test = base.extend<{}, { application:Application; address:string }>({
  application:[async ({},use) => { const app=createApplication(':memory:');await new Promise<void>(r=>app.http.listen(0,'127.0.0.1',r));try{await use(app);}finally{await app.close();} },{scope:'worker'}],
  address:[async ({application},use)=>{const address=application.http.address();if(!address||typeof address==='string')throw Error('No local address');await use(`http://127.0.0.1:${address.port}`);},{scope:'worker'}],
  baseURL:async({address},use)=>use(address),
});
export { expect };
