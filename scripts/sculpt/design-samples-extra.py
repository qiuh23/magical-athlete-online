# Per-character authored designs. Uses the construction helpers from build-samples.py.
def kraken():
 mantle=loft('pink',[(0,.08,0,.11,.09),(0,.17,0,.18,.14),(0,.32,-.01,.18,.15),(0,.49,-.03,.14,.13),(0,.66,-.06,.075,.075),(0,.76,-.08,.008,.012)],'tapered-squid-mantle',24)
 # Eight different curled arms: broad roots merge at the mantle, tapered tips curl independently.
 for i in range(8):
  a=i*math.pi/4+math.pi/8;dx,dz=math.cos(a),math.sin(a);height=.28+(i%3)*.07
  pts=[(dx*.11,.15,dz*.09),(dx*.25,.045,dz*.19),(dx*.32,.16,dz*.25),(dx*.31,height,dz*.23),(dx*.23,height+.045,dz*.18),(dx*.21,height-.015,dz*.15)]
  L('pink',pts,.035,'curl-arm-'+str(i),taper=[1.6,1.4,1,.65,.40,.05])
  for j in [1,2,3]:
   x,y,z=pts[j];O('violet',(x,y+.014,z),(.018,.009,.018),'suction-'+str(i)+'-'+str(j))
 for x in [-.065,.065]:eye(x,.22,.135,.040,pupilx=-.008 if x>0 else .008)
 for d in [-1,1]:L('pink',[(d*.025,.272,.144),(d*.065,.285,.138),(d*.10,.26,.12)],.020,'mantle-brow')
 return 'Retrieved and viewed registered Kraken card image: pink tapered mantle, eight curled arms, low-set expressive eyes. Cream shape in background is not a body horn. Back/underside and poses inferred.'
def hog():
 body=loft('green',[(0,.08,-.04,.10,.16),(0,.16,-.04,.14,.22),(0,.26,-.05,.15,.23),(0,.35,-.05,.12,.20),(0,.38,-.05,.08,.12)],'boar-body',24)
 head=loft('green',[(0,.26,.10,.12,.09),(0,.34,.11,.19,.14),(0,.48,.10,.19,.14),(0,.62,.08,.135,.10),(0,.65,.07,.06,.06)],'boar-head',24)
 snout=O('green',(0,.385,.25),(.13,.085,.10),'snout');union([body,head,snout],'continuous-boar-sculpt',.01,.28)
 for d in [-1,1]:
  for z in [-.18,.10]:
   loft('green',[(d*.15,.02,z,.055,.065),(d*.15,.10,z,.065,.068),(d*.14,.23,z,.08,.08)],'boar-leg',16)
   B('ink',(d*.15,.025,z+.008),(.10,.05,.12),'cloven-hoof')
  loft('green',[(d*.13,.56,.04,.07,.045),(d*.20,.68,.025,.065,.035),(d*.22,.79,0,.03,.023),(d*.19,.83,-.005,.003,.003)],'curled-boar-ear',16)
  L('olive',[(d*.145,.62,.077),(d*.19,.71,.06),(d*.195,.78,.02)],.012,'ear-ridge')
  eye(d*.083,.54,.214,.036)
  O('ink',(d*.048,.408,.343),(.014,.020,.006),'nostril')
  L('paper',[(d*.12,.30,.254),(d*.15,.35,.29),(d*.13,.405,.30)],.025,'curved-tusk',taper=[1.2,.8,.04])
 O('red',(0,.30,.258),(.08,.033,.02),'open-boar-mouth')
 L('green',[(0,.34,-.25),(.10,.33,-.30),(.11,.40,-.31),(.045,.42,-.30),(.028,.37,-.30)],.017,'curled-tail')
 # Saddle top fits runtime rider offset; straps hug the real barrel rather than float.
 O('brown',(0,.365,-.06),(.10,.025,.14),'curved-saddle');L('brown',[(-.19,.37,-.07),(-.22,.25,-.07),(0,.17,-.07),(.22,.25,-.07),(.19,.37,-.07)],.018,'girth-strap')
 return 'Viewed registered Hog Knight art: green broad-nosed boar, large pointed ears, tusks and four legs. Separate mount and saddle/underside inferred for runtime riding.'
def knight():
 for x in [-.23,.23]:
  sole(x,color='grey',w=.055,length=.09);L('grey',[(x*.45,.22,0),(x*.80,.13,.01),(x,.06,.015)],.049,'bowed-rider-leg')
 loft('grey',[(0,.09,0,.12,.09),(0,.2,0,.15,.11),(0,.36,0,.16,.11),(0,.47,0,.135,.095),(0,.5,0,.09,.065)],'rounded-breastplate',24)
 for d in [-1,1]:
  L('grey',[(d*.115,.43,0),(d*.21,.36,.025),(d*.19,.29,.10)],.045,'bent-armour-arm')
  O('grey',(d*.145,.43,0),(.075,.055,.07),'shaped-pauldron');O('grey',(d*.19,.29,.11),(.055,.045,.035),'gauntlet')
  L('grey',[(d*.165,.33,.117),(d*.19,.338,.14),(d*.218,.33,.11)],.010,'raised-gauntlet-cuff')
 helmet=loft('grey',[(0,.47,0,.10,.075),(0,.52,0,.16,.11),(0,.64,-.01,.17,.13),(0,.75,-.025,.13,.11),(0,.8,-.03,.04,.045)],'rolled-rim-helmet',24)
 O('pink',(0,.631,.112),(.118,.135,.025),'inset-face')
 eye(-.042,.667,.137,.024,pupilx=-.004);eye(.042,.667,.137,.024,pupilx=-.004)
 O('pink',(0,.632,.144),(.02,.022,.015),'nose');O('ink',(0,.579,.137),(.032,.038,.008),'surprised-mouth');O('red',(0,.559,.145),(.02,.012,.005),'tongue')
 for d in [-1,1]:O('red',(d*.07,.611,.132),(.014,.014,.005),'cheek')
 L('grey',[(-.13,.71,.08),(-.14,.56,.11),(0,.50,.11),(.14,.56,.11),(.13,.71,.08)],.018,'helmet-face-rim')
 for y in [.18,.22]:L('grey',[(-.12,y,.087),(0,y-.006,.116),(.12,y,.087)],.008,'plate-overlap')
 return 'Viewed registered Hog Knight card: rounded grey plate armour and pink surprised face. Complete standing legs, rear plate joints and hand pose inferred; rider remains separate from hog.'
def bite():
 for x in [-.09,.09]:
  sole(x,color='violet');loft('violet',[(x,.055,0,.045,.045),(x,.16,0,.05,.05)],'trouser-leg',12)
 loft('paper',[(0,.11,0,.13,.09),(0,.24,0,.17,.11),(0,.43,-.015,.16,.105),(0,.51,0,.12,.075)],'ringer-shirt',24)
 L('violet',[(-.09,.5,.04),(0,.46,.085),(.09,.5,.04)],.018,'shirt-neck-rib')
 mane=loft('violet',[(0,.46,-.055,.16,.10),(0,.64,-.055,.22,.145),(0,.8,-.05,.22,.14),(0,.86,-.04,.14,.10),(0,.88,-.03,.05,.05)],'full-bouffant-mane',24)
 head=loft('brown',[(0,.48,.02,.07,.06),(0,.54,.025,.12,.09),(0,.66,.03,.16,.115),(0,.76,.015,.145,.10),(0,.79,0,.09,.07)],'angular-were-cheeks',24)
 nose=L('brown',[(.005,.73,.10),(.015,.66,.15),(.04,.62,.16)],.028,'long-nose',taper=[.7,1.1,1]);head=union([head,nose],'integrated-bite-face',.008,.35)
 for d in [-1,1]:
  loft('brown',[(d*.13,.64,.015,.05,.035),(d*.21,.72,0,.045,.027),(d*.23,.80,-.02,.003,.003)],'pointed-ear',12)
  L('violet',[(d*.13,.81,.065),(d*.19,.69,.06),(d*.16,.53,.04)],.032,'sideburn',taper=[1.2,1,.3])
  L('brown',[(d*.13,.42,0),(d*.23,.38,.025),(d*.15,.34,.12)],.035,'hunched-arm');O('brown',(d*.15,.34,.13),(.05,.038,.025),'hand')
  for i in range(3):L('brown',[(d*(.12+i*.025),.35,.14),(d*(.12+i*.025),.39,.155),(d*(.11+i*.025),.395,.17)],.010,'clawed-finger',taper=[1,.9,.3])
 for x in [-.054,.054]:
  z=front_at(head,x,.719);O('yellow',(x,.719,z+.003),(.037,.023,.012),'yellow-eye');O('ink',(x+.008,.71,z+.015),(.010,.013,.005),'worried-pupil')
 L('violet',[(-.14,.805,.07),(-.04,.83,.12),(.08,.80,.11),(.15,.81,.04)],.045,'swept-fringe')
 O('ink',(0,.566,.112),(.055,.023,.009),'uneasy-mouth');O('red',(.025,.557,.122),(.023,.009,.004),'tongue')
 for x,y in [(-.08,.63),(-.10,.61),(.10,.62)]:O('ink',(x,y,.113),.0035,'freckle')
 return 'Viewed registered Bite Mark art: ochre-olive skin, purple bouffant/sideburns, pointed ears, long nose, yellow worried eyes and off-white purple-trim shirt. Back hair, shoes and stance inferred.'
BUILDERS.update({'kraken':kraken,'hog-knight-hog':hog,'hog-knight':knight,'bite-mark':bite})
def were():
 for x in [-.11,.11]:sole(x,color='brown',w=.075,length=.11)
 loft('brown',[(0,.07,0,.13,.09),(0,.21,0,.19,.12),(0,.4,-.03,.22,.14),(0,.55,-.025,.20,.13)],'were-shoulders',24)
 loft('violet',[(0,.40,-.06,.19,.13),(0,.58,-.07,.27,.17),(0,.78,-.06,.26,.16),(0,.88,-.06,.15,.11),(0,.93,-.04,.04,.04)],'monster-mane',24)
 h=loft('brown',[(0,.40,.05,.10,.09),(0,.47,.08,.19,.12),(0,.6,.075,.24,.15),(0,.76,.04,.22,.13),(0,.82,.015,.14,.08)],'were-cheek-jaw',24)
 cut=O('brown',(0,.565,.218),(.19,.105,.125),'mouth-cavity-cutter')
 bpy.context.view_layer.objects.active=h;mod=h.modifiers.new('Real open mouth cavity','BOOLEAN');mod.operation='DIFFERENCE';mod.object=cut;mod.solver='EXACT';bpy.ops.object.modifier_apply(modifier=mod.name);bpy.data.objects.remove(cut,do_unlink=True)
 O('ink',(0,.565,.185),(.18,.10,.012),'wide-open-maw')
 L('brown',[(-.18,.59,.19),(-.11,.66,.21),(0,.665,.23),(.11,.66,.21),(.18,.59,.19)],.027,'upper-lip')
 L('brown',[(-.18,.58,.19),(-.12,.48,.20),(0,.465,.22),(.12,.48,.20),(.18,.58,.19)],.027,'lower-jaw')
 for d in [-1,1]:
  loft('brown',[(d*.18,.74,.01,.06,.035),(d*.26,.87,-.01,.055,.03),(d*.26,.98,-.02,.003,.003)],'were-ear',12)
  L('brown',[(d*.18,.42,0),(d*.30,.35,.05),(d*.25,.43,.16)],.047,'were-bent-arm');O('brown',(d*.25,.44,.17),(.055,.05,.04),'were-hand')
  for i in range(3):L('paper',[(d*(.21+i*.028),.45,.19),(d*(.21+i*.028),.49,.20)],.008,'were-claw',taper=[1,.05])
  z=front_at(h,d*.085,.74);O('yellow',(d*.085,.74,z+.003),(.05,.025,.013),'were-eye');O('ink',(d*.085,.732,z+.018),(.012,.016,.005),'were-pupil')
 for x in [-.13,-.08,-.03,.03,.08,.13]:
  K('paper',(x,.622,.234),.019,0,.06,'upper-fang',rot=(0,0,math.pi));K('paper',(x,.502,.234),.016,0,.045,'lower-fang')
 O('red',(0,.495,.23),(.058,.016,.012),'were-tongue')
 return 'Transformation design based on viewed Bite Mark skin/mane and documented W.E.R.E.M.O.U.T.H.; enlarged jaw, teeth, hands and reverse views are explicitly project-designed, not an original transformed illustration.'
def revolutionary():
 for x in [-.095,.095]:sole(x,color='ink',w=.066,length=.11);loft('ink',[(x,.05,0,.05,.06),(x,.21,-.02,.045,.046)],'boot-shaft',16)
 loft('violet',[(0,.16,0,.18,.12),(0,.22,-.005,.19,.13),(0,.36,-.01,.15,.11),(0,.47,-.015,.14,.095),(0,.54,-.005,.15,.09),(0,.57,0,.09,.065)],'tailored-coat',24)
 for d in [-1,1]:L('violet',[(d*.08,.54,.07),(d*.05,.47,.10),(d*.01,.37,.11)],.014,'rolled-lapel')
 L('ink',[(0,.36,.115),(0,.18,.13)],.003,'coat-seam')
 for y in [.28,.34]:O('yellow',(.03,y,.12),(.01,.01,.005),'button')
 head=loft('pink',[(0,.54,.01,.07,.06),(0,.60,.01,.13,.10),(0,.70,0,.15,.12),(0,.78,0,.12,.10),(0,.81,0,.06,.06)],'cheek-cranium',24)
 nose=O('pink',(.005,.658,.12),(.039,.032,.045),'nose');head=union([head,nose],'unified-face',.008,.35)
 for x in [-.055,.055]:
  z=front_at(head,x,.721);eye(x,.721,z+.003,.026,pupilx=.004)
 pts=[(x,.61+abs(x)*.13,front_at(head,x,.61+abs(x)*.13)+.003)for x in [-.045,-.022,0,.022,.045]];L('ink',pts,.004,'seated-smile')
 loft('violet',[(0,.78,0,.14,.12),(0,.82,0,.15,.13),(-.01,.89,-.01,.12,.10),(.025,.95,-.02,.09,.08),(.11,.97,-.02,.065,.06),(.19,.94,-.02,.04,.04),(.225,.87,-.01,.016,.02),(.21,.85,0,.003,.003)],'soft-folded-cap',24)
 for d in [-1,1]:
  pts=[(d*.12,.50,0),(d*.19,.43,.01),(d*.17,.33,.065)]if d<0 else[(d*.12,.50,0),(.19,.45,.05),(.25,.50,.10)]
  L('violet',pts,.047,'shaped-sleeve');x,y,z=pts[-1];O('pink',(x,y,z+.01),(.037,.04,.034),'hand');L('violet',[(x-.03,y+.025,z+.013),(x,y+.035,z+.033),(x+.03,y+.025,z+.013)],.008,'rolled-cuff')
 L('brown',[(.265,.01,.12),(.265,.49,.12),(.265,.65,.12),(.29,.68,.12),(.32,.66,.12)],.013,'crook-staff')
 O('pink',(.26,.51,.14),(.018,.02,.014),'gripping-thumb')
 return 'Repository SVG and registered pink character / purple coat / soft drooping cap / black boots / staff; original Leaf author image not obtained. Refined face, tailoring and back are project interpretations.'
def fin(color,points,tag,thickness=.018):
 # Closed, bevelled real volume, not a single plane.
 n=len(points);normal=(Vector(points[1])-Vector(points[0])).cross(Vector(points[2])-Vector(points[0])).normalized();vs=[tuple(Vector(p)+normal*(side*thickness/2)) for side in [-1,1] for p in points]
 fs=[tuple(reversed(range(n))),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n)for i in range(n)]
 m=bpy.data.meshes.new(tag);m.from_pydata(vs,[],fs);m.update();o=bpy.data.objects.new(tag,m);scene.collection.objects.link(o);o=add(o,color,tag);mod=o.modifiers.new('Soft fin rim','BEVEL');mod.width=.006;mod.segments=2;return o
def magikarp():
 body=O('orange',(0,.27,0),(.18,.22,.26),'fish-body')
 fin('paper',[(0,.34,-.18),(0,.55,-.10),(0,.50,-.02),(0,.57,.05),(0,.40,.14)],'crown-dorsal-fin',.035)
 fin('yellow',[(0,.34,-.16),(0,.51,-.10),(0,.46,-.02),(0,.53,.05),(0,.40,.11)],'dorsal-inner',.039)
 fin('paper',[(0,.25,-.20),(0,.41,-.42),(0,.27,-.39),(0,.08,-.44),(0,.16,-.20)],'forked-tail',.04)
 fin('yellow',[(0,.25,-.23),(0,.37,-.40),(0,.27,-.35),(0,.12,-.41),(0,.17,-.23)],'tail-inner',.045)
 for d in [-1,1]:
  O('paper',(d*.164,.34,.10),(.014,.051,.055),'side-eye-white');O('ink',(d*.179,.34,.105),(.006,.022,.025),'side-pupil')
  fin('paper',[(d*.14,.22,.05),(d*.26,.12,-.04),(d*.22,.25,-.10),(d*.14,.30,-.04)],'pectoral-fin',.024)
  L('yellow',[(d*.055,.24,.26),(d*.11,.22,.29),(d*.23,.17,.25),(d*.25,.22,.20)],.012,'curved-whisker',taper=[1,.9,.6,.06])
  L('red',[(d*.16,.34,0),(d*.18,.27,-.035),(d*.15,.19,-.015)],.006,'gill-crease')
 O('paper',(0,.25,.25),(.065,.077,.025),'thick-mouth-lip');O('red',(0,.25,.274),(.043,.054,.006),'open-mouth')
 # Two low ventral fins touch the shared ground pivot, no game base included.
 for d in [-1,1]:fin('paper',[(d*.06,.15,.08),(d*.08,.015,.07),(d*.10,.07,-.06),(d*.07,.19,-.04)],'ventral-fin',.028)
 return 'Existing repository Magikarp SVG / registered recognizable orange fish, white-yellow fins, whiskers and open mouth. Full body, underside and tail thickness interpreted in 3D; no new original-author-image claim.'
BUILDERS.update({'bite-mark-were':were,'leaf-revolutionary':revolutionary,'wurstii-magikarp':magikarp})
