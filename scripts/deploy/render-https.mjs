import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export function httpsGameDomain(value) {
  const url=new URL(`https://${value}`);
  if(!/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(value)||url.hostname!==value||url.origin!==`https://${value}`)throw Error('Set an exact lowercase DNS hostname.');
  return value;
}
export function renderHttpsSite(domain,tls=true) {
  httpsGameDomain(domain);
  const http=`server {
    listen 80;
    server_name ${domain};
    server_tokens off;
    location ^~ /.well-known/acme-challenge/ { root /var/lib/letsencrypt; }
    location / { return 308 https://${domain}$request_uri; }
}
`;
  if(!tls)return http;
  return http+`server {
    listen 443 ssl;
    server_name ${domain};
    server_tokens off;
    ssl_certificate /etc/letsencrypt/live/${domain}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${domain}/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    client_max_body_size 16k;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $http_host;
        proxy_set_header Origin $http_origin;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 100s;
        proxy_send_timeout 100s;
        proxy_buffering off;
    }
}
`;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href) {
  const entries=JSON.parse(readFileSync(new URL('../../deploy/entries.json',import.meta.url),'utf8'));
  const domain=httpsGameDomain(process.argv[2]);
  const expected=new URL(entries.production.plannedAliyunOrigin??entries.production.aliyunOrigin);
  if(expected.origin!==`https://${domain}`||expected.href!==`https://${domain}/`)throw Error('HTTPS hostname must match the reviewed production target; never replace the lobby or preview.');
  process.stdout.write(renderHttpsSite(domain,!process.argv.includes('--acme-only')));
}
