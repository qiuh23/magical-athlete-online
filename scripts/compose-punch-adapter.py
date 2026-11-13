"""Keep validated adapter geometry and copy the original joint/morph clip bytes.
Neither input is modified. No mesh/working-head/animation values are edited.
"""
import copy,hashlib,json,struct,argparse
from pathlib import Path
root=Path(__file__).resolve().parents[1]/'public/models/mechanisms'
def load(p):
 b=p.read_bytes();size=struct.unpack_from('<I',b,12)[0];j=json.loads(b[20:20+size]);pos=20+size;n=struct.unpack_from('<I',b,pos)[0];return j,b[pos+8:pos+8+n]
parser=argparse.ArgumentParser();parser.add_argument('--adapter',required=True,type=Path);parser.add_argument('--clip',required=True,type=Path);args=parser.parse_args();adapter=args.adapter;original=args.clip
a,b=load(adapter);s,old=load(original);data=bytearray(b);a.setdefault('accessors',[]);a.setdefault('bufferViews',[])
node_names={n['name']:i for i,n in enumerate(a['nodes'])};accessors={}
for animation in s['animations']:
 result=copy.deepcopy(animation)
 for sampler in result['samplers']:
  for field in ['input','output']:
   idx=sampler[field]
   if idx not in accessors:
    acc=copy.deepcopy(s['accessors'][idx]);view=copy.deepcopy(s['bufferViews'][acc['bufferView']]);start=view.get('byteOffset',0);chunk=old[start:start+view['byteLength']]
    while len(data)%4:data.append(0)
    view['byteOffset']=len(data);view['buffer']=0;data.extend(chunk);acc['bufferView']=len(a['bufferViews']);a['bufferViews'].append(view);accessors[idx]=len(a['accessors']);a['accessors'].append(acc)
   sampler[field]=accessors[idx]
 for channel in result['channels']:channel['target']['node']=node_names[s['nodes'][channel['target']['node']]['name']]
 a.setdefault('animations',[]).append(result)
while len(data)%4:data.append(0)
a['buffers']=[{'byteLength':len(data)}]
a.setdefault('extras',{})['motionComposition']={'geometrySHA256':hashlib.sha256(adapter.read_bytes()).hexdigest(),'clipSHA256':hashlib.sha256(original.read_bytes()).hexdigest(),'method':'Original named-node joint and morph sampler bytes; no edited animation values.'}
j=json.dumps(a,separators=(',',':')).encode();j+=b' '*((-len(j))%4)
out=struct.pack('<III',0x46546c67,2,12+8+len(j)+8+len(data))+struct.pack('<II',len(j),0x4e4f534a)+j+struct.pack('<II',len(data),0x004e4942)+data
p=root/'punch_outboard_joint.glb';p.write_bytes(out);print(p.name,len(out),hashlib.sha256(out).hexdigest())
