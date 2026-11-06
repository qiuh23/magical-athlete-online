import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const script=fileURLToPath(new URL('../scripts/deploy/upgrade-site-editions.py',import.meta.url));
const python=process.platform==='win32'?'python':'python3';
const prelude=`import importlib.util,json,pathlib
p=pathlib.Path(${JSON.stringify(script)})
spec=importlib.util.spec_from_file_location("upgrade",p)
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
entries=json.loads((p.parents[2]/"deploy/entries.json").read_text())
`;
const run=(code:string)=>{const result=spawnSync(python,['-c',prelude+code],{encoding:'utf8',windowsHide:true,env:{...process.env,PYTHONDONTWRITEBYTECODE:'1'}});assert.equal(result.status,0,result.stderr);};

test('existing production and preview upgrade removes foreign policy while preserving gates, secrets, quota and storage',()=>run(String.raw`
for target,port,data,quota,origin in [("production","3000","/var/lib/magical-athlete","14","https://athlete.magical-athlete-online.cn"),("preview","3001","/var/lib/magical-athlete-preview","1","http://115.29.188.62:8080")]:
 text="\n".join(["NODE_ENV=production","BACKEND_ID=aliyun","HOST=127.0.0.1","PORT="+port,"DATA_DIR="+data,"MULTIPLAYER_ROOM_LIMIT="+quota,"DUAL_BACKEND_ENABLED=true","PUBLIC_ACCESS_ENABLED=true","CONTROLLED_VALIDATION=false","SHARED_PREVIEW_ENABLED=true","PRIVATE_SECRET='fixture value'","PUBLIC_ORIGIN="+origin,"PUBLIC_ORIGINS=https://magical-athlete-preview.qiuh23.workers.dev,http://115.29.188.62","BACKENDS_CONFIG_JSON='{}'"])+"\n"
 upgraded=m.render_environment(text,target,entries);values=m.assignments(upgraded)
 assert values["SITE_EDITION"]=="cn" and values["BACKEND_ID"]=="aliyun"
 for key in ["HOST","PORT","DATA_DIR","MULTIPLAYER_ROOM_LIMIT","DUAL_BACKEND_ENABLED","PUBLIC_ACCESS_ENABLED","CONTROLLED_VALIDATION","SHARED_PREVIEW_ENABLED","PRIVATE_SECRET"]:assert values[key]==m.assignments(text)[key],key
 assert "workers.dev" not in values["PUBLIC_ORIGINS"]
 assert values["PUBLIC_ORIGIN"]==origin
 assert json.loads(values["BACKENDS_CONFIG_JSON"])["siteEdition"]=="cn"
 assert m.render_environment(upgraded,target,entries)==upgraded
`));

test('host upgrade refuses mismatched isolation paths, unbounded quota and ambiguous environment assignments',()=>run(String.raw`
base="HOST=127.0.0.1\nPORT=3000\nDATA_DIR=/var/lib/magical-athlete\nMULTIPLAYER_ROOM_LIMIT=14\nDUAL_BACKEND_ENABLED=true\nPUBLIC_ACCESS_ENABLED=true\nCONTROLLED_VALIDATION=false\n"
for bad in [base.replace("PORT=3000","PORT=3001"),base.replace("DATA_DIR=/var/lib/magical-athlete","DATA_DIR=/var/lib/wizard-friends"),base.replace("MULTIPLAYER_ROOM_LIMIT=14","MULTIPLAYER_ROOM_LIMIT=15"),base+"PORT=3000\n"]:
 try:m.render_environment(bad,"production",entries)
 except ValueError:pass
 else:raise AssertionError("unsafe existing environment was accepted")
`));

test('every application vhost block stops access collection idempotently and keeps fault and realtime directives',()=>run(String.raw`
text="server {\n    listen 80;\n    access_log /var/log/game-network/athlete.log game_network;\n    error_log /dev/null emerg;\n    location / { proxy_set_header Upgrade $http_upgrade; }\n}\nserver {\n    listen 443 ssl;\n    error_log /var/log/nginx/custom-fault.log warn;\n}\n"
upgraded=m.render_vhost(text)
assert upgraded.count("access_log off;")==2
assert "access_log /var/log/game-network" not in upgraded
assert "proxy_set_header Upgrade $http_upgrade;" in upgraded
assert "error_log /var/log/nginx/error.log warn;" in upgraded
assert "error_log /var/log/nginx/custom-fault.log warn;" in upgraded
assert m.render_vhost(upgraded)==upgraded
`));

test('host migration is confined to exact tool/config paths and never restarts game services or removes historical records',()=>{
 const source=readFileSync(script,'utf8');
 assert.match(source,/"magical-athlete-lobby"/);assert.match(source,/"magical-athlete-preview"/);
 assert.doesNotMatch(source,/glob\(|rglob\(|rmtree\(/);
 assert.match(source,/"\/etc\/logrotate\.d\/game-network"/);
 assert.match(source,/"reload", "nginx"/);assert.doesNotMatch(source,/"restart"/);
 assert.match(source,/"magical-athlete-production\.deploy\.lock"/);assert.match(source,/"magical-athlete-preview\.deploy\.lock"/);
 assert.match(source,/private rollback copy/);
});
