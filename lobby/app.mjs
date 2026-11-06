import { gameInfo, validateConfig, readInvitation, entryURL, currentLobby } from './routing.mjs';
const status = document.querySelector('#status');
const links = [...document.querySelectorAll('[data-game]')];
const foreign = '此邀请不属于当前站点，请向房主确认原始邀请链接。';
let config, invitation, current;
function render() {
  document.querySelector('#current-server').textContent=config.siteEdition==='cn'?'国内站':'海外站';
  for(const link of links){
    const game=link.dataset.game;
    const href=entryURL(config,game,current,invitation);
    const action=invitation?(invitation.watch?'观战':'加入房间'):'进入';
    if(href){link.href=href;link.removeAttribute('aria-disabled');link.querySelector('.action-label').textContent=action;link.setAttribute('aria-label',`${gameInfo[game].name}，${action}`);}
    else{link.removeAttribute('href');link.setAttribute('aria-disabled','true');link.querySelector('.action-label').textContent='其他游戏';link.setAttribute('aria-label',`${gameInfo[game].name}，邀请属于另一款游戏`);}
  }
}
document.querySelector('#clear-invite').addEventListener('click',()=>{invitation=null;history.replaceState(null,'',location.pathname);document.querySelector('#invitation').hidden=true;status.textContent='';render();});
document.querySelector('#retry').addEventListener('click',()=>location.reload());
try{
  const response=await fetch(new URL('./config.json',import.meta.url),{cache:'no-store',credentials:'same-origin',redirect:'error',signal:AbortSignal.timeout(8000)});
  if(!response.ok)throw Error('暂时无法读取游戏入口，请刷新重试。');
  config=validateConfig(await response.json());current=currentLobby(config,location.href);
  if(!current)throw Error('当前网址不在本站大厅配置中。');
  invitation=readInvitation(location.search);
  if(invitation&&invitation.server!==current)throw Error(foreign);
  if(invitation){document.querySelector('#invitation').hidden=false;document.querySelector('#invite-details').textContent=`${gameInfo[invitation.game].name} · ${invitation.room}`;}
  render();status.textContent='';document.querySelector('#choices').removeAttribute('aria-busy');
}catch(error){status.textContent=error instanceof Error?error.message:'游戏入口暂不可用，请刷新重试。';status.setAttribute('role','alert');document.querySelector('#choices').removeAttribute('aria-busy');document.querySelector('#retry').hidden=false;}
