// Single-operator tool; the independent secret is read only from the environment.
// Never pass it as an argument, URL query, browser storage, or room identity.
const [origin,room,action,...args]=process.argv.slice(2),secret=process.env.SECURITY_ADMIN_TOKEN;
try{
  if(!origin||!room||!action||!secret||!/^[A-Za-z0-9_-]{32,256}$/.test(secret))throw Error('Usage: SECURITY_ADMIN_TOKEN=<private environment> node scripts/stationmaster.mjs <https-origin|localhost-tunnel> <room-code|logs|evidence|hold|release-hold> <action|id|after> [target] [reason]');
  const base=new URL(origin);if(base.username||base.password||base.search||base.hash||base.pathname!=='/'||!['https:','http:'].includes(base.protocol)||(base.protocol==='http:'&&!['127.0.0.1','localhost','[::1]'].includes(base.hostname)))throw Error('Use an HTTPS origin or a local SSH tunnel; never send the secret to public HTTP.');
  let path,body;
  if(room==='logs'){if(!/^\d+$/.test(action))throw Error('Log cursor must be a nonnegative integer.');path='/api/stationmaster/logs?after='+action;}
  else if(room==='evidence'){if(!/^\d+$/.test(action))throw Error('Evidence ID required.');path='/api/stationmaster/evidence/'+action;}
  else if(room==='hold'||room==='release-hold'){if(!/^\d+$/.test(action)||!args[0])throw Error('Record ID and reason required.');path='/api/stationmaster/logs/'+action+'/hold';body={held:room==='hold',reason:args.join(' ')};}
  else {
    if(!/^[A-Z2-9]{6}$/.test(room))throw Error('Use the backend-local six-character room code.');path='/api/stationmaster/rooms/'+room;
    if(action==='inspect')body={action};
    else if(action==='hide-chat'){if(!/^\d+$/.test(args[0]??''))throw Error('Message number required.');body={action,seq:Number(args[0]),reason:args.slice(1).join(' ')};}
    else if(action==='restrict-member'||action==='reset-name')body={action,memberId:args[0],reason:args.slice(1).join(' ')};
    else if(action==='close-room')body={action,reason:args.join(' ')};
    else throw Error('Unknown action.');
    if(action!=='inspect'&&!body.reason)throw Error('A reason is required.');
  }
  const response=await fetch(new URL(path,base),{method:body?'POST':'GET',headers:{Authorization:'Bearer '+secret,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),redirect:'error',signal:AbortSignal.timeout(15000)});
  const result=await response.json();if(!response.ok)throw Error(result.error??'Stationmaster operation failed: '+response.status);
  console.log(JSON.stringify(result,null,2));
}catch(error){console.error(error instanceof Error?error.message:'Stationmaster operation failed.');process.exitCode=1;}
