/** Export-only sparse pose pass through the same mounted component harness.
 * Full-cycle evidence is supplied by verify-trip-sweep-geometry.cjs, not this
 * illustration. No runtime source or original asset is changed.
 * node --import tsx scripts/recovery/export-trip-sweep-crowds.cjs /tmp/trip-crowd-preview
 */
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
process.argv.push('--problem-only','--export');
const filename=path.join(process.cwd(),'scripts/recovery/verify-trip-sweep-geometry.cjs');
let source=fs.readFileSync(filename,'utf8');
source=source.replace("if(problemOnly)for(const anchor of ['wild:5','wild:17'])for(const configuration of ['bystanders','eight-crowded'])await scenario(anchor,'banana',false,false,configuration);", "if(problemOnly)for(const anchor of ['wild:5'])for(const configuration of ['bystanders','eight-crowded'])await scenario(anchor,'banana',false,false,configuration,{sparse:true});");
source=source.replace("[0,...(plannedFirst===undefined", "[0,.45,...(plannedFirst===undefined");
const original="if(exporting&&options.speed===undefined&&configuration==='single'&&!compact&&!lowQuality&&((anchor==='wild:5'&&actor==='banana')||(anchor==='wild:17'&&actor==='hotel'))&&frame%10===0)";
if(!source.includes(original))throw Error('Export hook changed; inspect the component harness before adapting it.');
source=source.replace(original,"if(exporting&&t===.45)");
source=source.replace("`${anchor.replace(':','-')}-${actor}-${String(frame).padStart(3,'0')}.glb`", "`${anchor.replace(':','-')}-${configuration}-mid.glb`");
source=source.replace("scenario:`${anchor}-${actor}`", "scenario:`${anchor}-${configuration}`");
source=source.replace("actorPoint:boardPoint(f.scenario.node,compact,f.room.track)", "actorPoints:racers.map(r=>boardPoint(r.position,compact,f.room.track)),actorPoint:boardPoint(f.scenario.node,compact,f.room.track)");
source=source.replace("const sourceHashes=()=>", "sourcePaths.push('scripts/recovery/export-trip-sweep-crowds.cjs');const sourceHashes=()=>");
source=source.replace("scope:'Independent original", "scope:'Export-only sparse illustration; not the full-cycle matrix. Independent original");
const compiled=new Module(filename,module);compiled.filename=filename;compiled.paths=Module._nodeModulePaths(path.dirname(filename));compiled._compile(source,filename);
