# Wurstii pixel-art card crops recovered from the user's handoff and actually viewed.
def wurst_ref(s):return 'User-provided Wurstii reference card crop actually viewed: '+s+'. Pixel-art silhouette/colours guide the design; rounded volumes, unseen back and small sculpt details are project interpretations.'
def wurst_mario():
 for d in [-1,1]:sole(d*.09,color='brown',w=.06,length=.085);loft('blue',[(d*.09,.055,0,.055,.06),(d*.09,.24,0,.07,.075)],'overall-leg',16)
 body=loft('blue',[(0,.18,0,.13,.10),(0,.34,0,.15,.12),(0,.43,0,.11,.08)],'round-overall-body',24)
 loft('red',[(0,.34,-.005,.13,.09),(0,.46,0,.14,.09),(0,.51,0,.075,.055)],'red-shirt',22)
 for d in [-1,1]:L('blue',[(d*.075,.32,.11),(d*.075,.47,.065)],.016,'overall-strap');O('yellow',(d*.075,.36,.12),(.015,.015,.008),'overall-button');L('red',[(d*.12,.44,0),(d*.19,.36,.035),(d*.20,.30,.08)],.034,'red-sleeve');O('paper',(d*.20,.29,.08),(.044,.043,.035),'white-glove')
 h=loft('cream',[(0,.48,0,.075,.055),(0,.55,0,.13,.10),(0,.67,0,.14,.10),(0,.74,-.01,.09,.065)],'mario-head',26);eyes_on(h,.65,.05,.024)
 O('cream',(0,.59,.125),(.06,.047,.055),'mario-round-nose')
 for x,y in [(-.075,.56),(-.04,.545),(0,.54),(.04,.545),(.075,.56)]:O('brown',(x,y,.102),(.027,.021,.02),'mario-moustache-lobe')
 for d in [-1,1]:O('cream',(d*.13,.60,0),(.03,.04,.027),'round-ear');L('brown',[(d*.11,.67,.005),(d*.12,.57,.015)],.019,'brown-sideburn')
 loft('red',[(0,.70,0,.145,.11),(0,.76,0,.15,.12),(0,.82,-.01,.11,.085),(0,.85,-.01,.035,.03)],'red-cap',26);O('red',(0,.72,.10),(.15,.018,.095),'cap-visor')
 O('paper',(0,.785,.102),(.043,.035,.007),'cap-white-badge');L('red',[(-.025,.77,.113),(-.02,.80,.113),(0,.78,.113),(.02,.80,.113),(.025,.77,.113)],.0045,'cap-m-emblem')
 return wurst_ref('Mario: red cap/shirt, blue overalls, yellow fasteners, brown moustache/shoes, white gloves')
def puffin(cx,y,z,s,main=False):
 # Every bird is a complete volume, with its own feet, belly, wings, head and bill.
 O('violet',(cx,y+.15*s,z),(.13*s,.16*s,.10*s),'puffin-body');O('yellow',(cx,y+.12*s,z+.085*s),(.10*s,.10*s,.023*s),'yellow-puffin-belly')
 h=O('paper',(cx,y+.30*s,z),(.11*s,.115*s,.085*s),'white-puffin-head')
 for d in [-1,1]:
  O('paper',(cx+d*.11*s,y+.15*s,z),(.035*s,.09*s,.06*s),'puffin-wing');O('orange',(cx+d*.055*s,y+.025*s,z+.025*s),(.04*s,.025*s,.055*s),'puffin-foot');eye(cx+d*.035*s,y+.33*s,z+.078*s,.015*s)
 O('orange',(cx+.025*s,y+.275*s,z+.10*s),(.055*s,.022*s,.045*s),'orange-puffin-bill')
def wurst_puffins():
 puffin(.10,0,-.045,1.0,True)
 for x,z in [(-.18,-.04),(-.12,.16),(.15,.18)]:puffin(x,0,z,.50)
 return wurst_ref('Fluffin/Huffin Puffins bird group: one larger white-headed bird with yellow belly and three complete small companions; never reduced to one generic bird')
def wurst_bullet():
 union([K('ink',(0,.16,-.05),.14,.14,.34,'bullet-cylinder',rot=(math.pi/2,0,0)),O('ink',(0,.16,.12),(.14,.15,.13),'bullet-rounded-nose')],'continuous-bullet-casing',.007,.32)
 K('grey',(0,.16,-.23),.125,.125,.028,'rear-metal-rim',rot=(math.pi/2,0,0));K('ink',(0,.16,-.25),.09,.09,.012,'rear-recess',rot=(math.pi/2,0,0))
 for d in [-1,1]:
  O('paper',(d*.105,.22,.15),(.018,.035,.055),'bullet-side-eye');O('ink',(d*.12,.22,.165),(.007,.018,.023),'bullet-pupil');L('ink',[(d*.11,.14,.01),(d*.20,.13,.035)],.028,'bullet-arm');O('paper',(d*.20,.13,.045),(.05,.045,.045),'bullet-fist')
 return wurst_ref('Bullet Bill: black horizontal rounded cannon shell, white angry eyes and gloves, recessed rear rim. No legs, person body or game base added')
def wurst_plant():
 loft('green',[(0,.01,0,.12,.11),(0,.18,0,.12,.11),(0,.20,0,.16,.14),(0,.29,0,.16,.14),(0,.30,0,.12,.10)],'green-pipe',28)
 L('green',[(0,.25,0),(-.02,.46,0),(0,.56,0)],.026,'plant-stem')
 for d in [-1,1]:fin('green',[(0,.37,0),(d*.16,.47,.01),(d*.13,.38,.02),(0,.34,0)],'plant-leaf',.018)
 # A single connected head with a true V-shaped open jaw, not two floating pods.
 head=O('red',(0,.65,0),(.14,.17,.115),'connected-piranha-head')
 cut=extruded_outline('red',[(-.075,.85),(.075,.85),(0,.56)],.40,'jaw-cutter')
 bm=bmesh.new();bm.from_mesh(cut.data);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(cut.data);bm.free();cut.data.update()
 bpy.context.view_layer.objects.active=head;mod=head.modifiers.new('Open V jaw','BOOLEAN');mod.operation='DIFFERENCE';mod.object=cut;mod.solver='EXACT';bpy.ops.object.modifier_apply(modifier=mod.name);bpy.data.objects.remove(cut,do_unlink=True)
 from mathutils.bvhtree import BVHTree
 bpy.context.view_layer.update();assert BVHTree.FromObject(head,bpy.context.evaluated_depsgraph_get()).ray_cast(Vector((0,-1,.70)),Vector((0,1,0)))[0] is None,'Piranha jaw must be an actual open gap'
 for d in [-1,1]:
  lip=[]
  for y in [.58,.64,.71,.77]:
   x=d*((y-.56)/.29*.075+.007);lip.append((x,y,front_at(head,x,y)+.004))
  L('paper',lip,.012,'white-jaw-lip')
  for y in [.625,.685,.745]:
   x=d*((y-.56)/.29*.075+.008);z=front_at(head,x,y)+.004;fin('paper',[(x,y-.012,z),(x,y+.012,z),(x-d*.027,y,z)],'plant-tooth',.018)
  for x,y in [(d*.10,.60),(d*.10,.69),(d*.08,.75)]:O('paper',(x,y,front_at(head,x,y)+.002),(.015,.018,.006),'plant-white-spot')
  for x,y in [(d*.08,.61),(d*.07,.72)]:
   z=-.115*math.sqrt(max(0,1-(x/.14)**2-((y-.65)/.17)**2));O('paper',(x,y,z-.001),(.014,.016,.006),'rear-plant-spot')
 return wurst_ref('Piranha Plant: red spotted open jaws with white lips/teeth, green stem/leaves emerging from green pipe. Pipe is integral reference prop, not a separate game base')
def wurst_tails():
 for d in [-1,1]:sole(d*.08,color='red',w=.05,length=.085);L('orange',[(d*.08,.06,0),(d*.07,.23,0)],.025,'fox-leg');O('paper',(d*.08,.07,.04),(.05,.015,.04),'shoe-white-band')
 loft('orange',[(0,.19,0,.10,.075),(0,.35,0,.12,.09),(0,.43,0,.075,.055)],'tails-torso',22);O('paper',(0,.32,.08),(.075,.08,.024),'white-chest')
 h=O('orange',(0,.56,0),(.14,.135,.095),'tails-head');O('paper',(0,.49,.085),(.11,.04,.045),'white-fox-muzzle');O('ink',(0,.52,.13),(.028,.02,.018),'fox-black-nose')
 for d in [-1,1]:
  loft('orange',[(d*.085,.64,0,.045,.03),(d*.13,.80,-.01,.003,.003)],'tails-pointed-ear',14);eye(d*.052,.58,front_at(h,d*.052,.58)+.002,.029)
  L('orange',[(d*.09,.40,0),(d*.16,.32,.04),(d*.16,.28,.10)],.024,'tails-arm');O('paper',(d*.16,.28,.10),(.035,.036,.029),'white-glove')
  L('orange',[(d*.045,.22,-.055),(d*.16,.22,-.18),(d*.20,.42,-.23)],.055,'distinct-tail-'+str(d),taper=[.65,1.5,.7]);L('paper',[(d*.20,.39,-.23),(d*.22,.55,-.24),(d*.16,.59,-.22)],.042,'white-tail-tip-'+str(d),taper=[1,.7,.03])
 return wurst_ref('Tails: orange fox, white muzzle/chest/gloves, red-white shoes and TWO large independently sculpted white-tipped tails')
def wurst_burt():
 body=loft('blue',[(0,.05,0,.11,.08),(0,.16,0,.20,.13),(0,.31,0,.20,.13),(0,.38,0,.17,.11)],'round-striped-trousers',28)
 for x in [-.13,-.065,0,.065,.13]:L('paper',[(x,y,front_at(body,x,y)+.006)for y in [.10,.18,.26,.34]],.018,'white-trouser-stripe')
 h=loft('cream',[(0,.34,0,.16,.10),(0,.47,0,.19,.12),(0,.60,0,.14,.10),(0,.66,0,.07,.055)],'burt-head',26);eyes_on(h,.56,.045,.02)
 O('brown',(.04,.50,.135),(.12,.03,.045),'burt-long-nose');O('pink',(-.10,.48,.09),(.04,.035,.012),'pink-cheek')
 for d in [-1,1]:sole(d*.09,color='blue',w=.065,length=.08);O('paper',(d*.09,.035,.07),(.05,.012,.02),'white-shoe-front')
 for x in [-.08,0,.08]:L('ink',[(x,.63,0),(x-.02,.70,0),(x-.06,.71,.01)],.009,'black-hair-tuft')
 return wurst_ref('Burt: rounded tan creature with black tuft, elongated brown nose, pink cheek and blue-white vertically striped trousers; explicitly not Sesame Street Bert')
BUILDERS.update({'wurstii-mario':wurst_mario,'wurstii-fluffin-puffins':wurst_puffins,'wurstii-bullet-bill':wurst_bullet,'wurstii-piranha-plant':wurst_plant,'wurstii-tails':wurst_tails,'wurstii-burt':wurst_burt})
def wurst_bart():
 for d in [-1,1]:sole(d*.07,color='blue');L('yellow',[(d*.07,.05,0),(d*.07,.20,0)],.022,'yellow-leg');loft('blue',[(d*.07,.16,0,.05,.05),(d*.07,.28,0,.055,.055)],'blue-short',16)
 loft('orange',[(0,.24,0,.13,.09),(0,.40,0,.12,.085),(0,.47,0,.075,.05)],'orange-t-shirt',22)
 h=loft('yellow',[(0,.44,0,.065,.05),(0,.51,0,.10,.075),(0,.66,0,.105,.08),(0,.73,0,.10,.07)],'bart-long-head',24)
 for i in range(7):x=-.095+i*.032;loft('yellow',[(x,.70,0,.022,.065),(x,.80+(i%2)*.012,0,.003,.02)],'bart-spiky-hair',10)
 for d in [-1,1]:eye(d*.042,.62,front_at(h,d*.042,.62)+.002,.027);O('yellow',(d*.10,.55,0),(.028,.032,.02),'bart-ear');L('yellow',[(d*.10,.42,0),(d*.17,.33,.03),(d*.15,.27,.07)],.021,'bart-arm');O('yellow',(d*.15,.27,.07),(.028,.03,.023),'bart-hand')
 O('yellow',(.025,.56,.10),(.04,.028,.04),'bart-nose');L('ink',[(-.04,.50,.077),(0,.49,.09),(.06,.51,.067)],.004,'bart-smirk')
 return wurst_ref('Bart Simpson: yellow spiked head, orange T-shirt, blue shorts/shoes and narrow limbs')
def wurst_bucky():
 for d in [-1,1]:sole(d*.08,color='orange',w=.055,length=.08);loft('violet',[(d*.08,.05,0,.05,.055),(d*.08,.25,0,.055,.06)],'space-trouser',16)
 loft('violet',[(0,.22,0,.12,.09),(0,.42,0,.14,.10),(0,.48,0,.09,.06)],'space-tunic',22)
 h=O('green',(0,.59,0),(.13,.13,.095),'bucky-rabbit-head');O('cream',(0,.53,.09),(.085,.035,.035),'rabbit-muzzle');eyes_on(h,.62,.048,.027)
 O('pink',(0,.55,.12),(.023,.017,.014),'rabbit-nose')
 for d in [-1,1]:
  loft('green',[(d*.07,.68,0,.04,.03),(d*.09,.88,0,.035,.025),(d*.10,.94,0,.003,.003)],'long-green-rabbit-ear',14);L('pink',[(d*.075,.73,.025),(d*.09,.87,.025)],.012,'pink-ear-inner')
  L('violet',[(d*.11,.42,0),(d*.18,.35,.03),(d*.19,.42,.11)],.028,'space-sleeve');O('orange',(d*.19,.42,.11),(.035,.035,.028),'orange-glove')
  B('yellow',(d*.12,.43,.025),(.07,.045,.09),'shoulder-trim')
 L('yellow',[(-.11,.27,.04),(0,.26,.095),(.11,.27,.04)],.012,'gold-belt');L('yellow',[(0,.28,.105),(0,.45,.085)],.006,'uniform-piping')
 return wurst_ref('Bucky O Hare: green rabbit with long ears, purple-magenta space uniform, gold trim and orange gloves/boots')
def chipmunk(cx,z,s,chip):
 for d in [-1,1]:O('brown',(cx+d*.045*s,.025*s,z+.02*s),(.035*s,.025*s,.06*s),'chipmunk-foot')
 body=loft('brown',[(cx,.04*s,z,.065*s,.055*s),(cx,.18*s,z,.10*s,.075*s),(cx,.30*s,z,.07*s,.055*s)],'chipmunk-body',18)
 O('cream',(cx,.18*s,z+.065*s),(.065*s,.09*s,.02*s),'cream-chipmunk-belly')
 h=O('brown',(cx,.37*s,z),(.10*s,.105*s,.075*s),'chipmunk-head');O('cream',(cx,.33*s,z+.065*s),(.08*s,.032*s,.03*s),'chipmunk-muzzle')
 for d in [-1,1]:
  O('brown',(cx+d*.075*s,.44*s,z),(.035*s,.04*s,.025*s),'round-chipmunk-ear');eye(cx+d*.033*s,.39*s,z+.07*s,.021*s);L('brown',[(cx+d*.07*s,.26*s,z),(cx+d*.13*s,.19*s,z+.035*s)],.018*s,'chipmunk-arm')
 O('ink'if chip else'red',(cx,.35*s,z+.095*s),(.022*s,.016*s,.015*s),'distinct-chipmunk-nose')
 for dx in ([-.012,.012] if not chip else[0]):B('paper',(cx+dx*s,.30*s,z+.085*s),(.014*s,.027*s,.008*s),'chipmunk-tooth')
 L('brown',[(cx,.10*s,z-.05*s),(cx+.06*s,.21*s,z-.13*s),(cx+.04*s,.29*s,z-.12*s)],.027*s,'chipmunk-tail',taper=[1,1.1,.1])
 if chip:
  loft('brown',[(cx,.43*s,z,.13*s,.10*s),(cx,.46*s,z,.13*s,.10*s),(cx,.54*s,z,.085*s,.065*s)],'chip-fedora',18);L('ink',[(cx-.08*s,.48*s,z+.02*s),(cx,.48*s,z+.066*s),(cx+.08*s,.48*s,z+.02*s)],.009*s,'fedora-band')
 else:
  for dx in [-.03,0,.03]:L('brown',[(cx+dx*s,.45*s,z),(cx+(dx-.02)*s,.51*s,z)],.014*s,'dale-hair',taper=[1,.05])
def wurst_chipdale():
 chipmunk(-.14,-.015,1.05,True);chipmunk(.14,.035,.95,False)
 return wurst_ref('Chip and Dale both present: two brown/cream chipmunks, Chip wearing fedora and black nose, Dale with red nose and separated teeth. Both have complete limbs and tails')
def monkey(dixie):
 col='pink'if dixie else'red'
 for d in [-1,1]:sole(d*.075,color='cream',w=.04,length=.075);L('brown',[(d*.07,.06,0),(d*.07,.24,0)],.025,'monkey-leg')
 loft('brown',[(0,.19,0,.09,.07),(0,.34,0,.11,.085),(0,.42,0,.07,.05)],'monkey-body',22)
 loft(col,[(0,.27,0,.12,.09),(0,.39,0,.135,.10),(0,.43,0,.085,.065)],'monkey-shirt',20)
 h=O('brown',(0,.55,0),(.125,.12,.09),'monkey-head');O('cream',(0,.51,.09),(.10,.04,.05),'monkey-muzzle')
 for d in [-1,1]:O('cream',(d*.045,.58,.075),(.037,.045,.012),'monkey-eye-patch');eye(d*.045,.58,.09,.021);O('brown',(d*.12,.55,0),(.04,.045,.025),'monkey-ear');L('brown',[(d*.10,.37,0),(d*.17,.26,.03),(d*.16,.17,.09)],.023,'long-monkey-arm');O('cream',(d*.16,.16,.09),(.032,.025,.035),'monkey-hand')
 L('brown',[(0,.23,-.06),(-.14,.25,-.18),(-.17,.51,-.16),(-.12,.60,-.15)],.016,'long-monkey-tail',taper=[1.2,1,.7,.05])
 loft(col,[(0,.63,0,.13,.10),(0,.68,0,.13,.10),(0,.73,-.01,.07,.055)],'dixie-beret'if dixie else'diddy-cap',22)
 O(col,(0,.65,.085),(.13,.013,.07),'cap-brim')
 if dixie:L('yellow',[(0,.70,-.055),(.10,.80,-.10),(.19,.67,-.13),(.18,.43,-.16)],.041,'long-blonde-ponytail',taper=[.7,1.2,1,.06])
 else:
  for x in [-.04,.04]:O('yellow',(x,.34,.088),(.02,.02,.005),'shirt-yellow-emblem')
 return wurst_ref('Dixie Kong: brown monkey, pink beret/top and long blonde ponytail'if dixie else'Diddy Kong: brown monkey, red cap/shirt and long curled tail')
def wurst_wily():
 for d in [-1,1]:sole(d*.085,color='ink');loft('ink',[(d*.085,.04,0,.055,.055),(d*.085,.22,0,.06,.065)],'scientist-trouser',16)
 loft('paper',[(0,.18,0,.15,.11),(0,.35,0,.16,.12),(0,.49,0,.12,.08),(0,.52,0,.08,.055)],'white-lab-coat',24)
 h=loft('cream',[(0,.48,0,.06,.05),(0,.55,0,.115,.08),(0,.68,0,.13,.09),(0,.77,0,.07,.05)],'wily-bald-head',24);eyes_on(h,.64,.046,.022);O('cream',(0,.58,.11),(.048,.035,.05),'scientist-nose')
 for d in [-1,1]:
  for i in range(4):L('paper',[(d*.11,.62+i*.035,0),(d*(.19+.015*(i%2)),.65+i*.04,-.01)],.025,'wild-white-side-hair',taper=[1,.05])
  L('paper',[(d*.02,.55,.10),(d*.08,.54,.10),(d*.12,.57,.07)],.018,'white-moustache',taper=[1,1,.05]);L('paper',[(d*.12,.44,0),(d*.19,.34,.03),(d*.19,.28,.09)],.03,'coat-arm');O('cream',(d*.19,.28,.09),(.034,.035,.026),'wily-hand')
 L('ink',[(0,.48,.085),(0,.35,.12)],.012,'dark-tie')
 return wurst_ref('Dr Wily: bald tan head, wild white side hair/moustache, white lab coat, dark tie/trousers and black shoes')
def wurst_drybones():
 for d in [-1,1]:sole(d*.075,color='grey');L('paper',[(d*.075,.06,0),(d*.075,.23,0)],.018,'bone-leg');O('paper',(d*.075,.16,0),(.028,.026,.025),'bone-knee')
 O('grey',(0,.32,-.045),(.14,.17,.11),'turtle-shell');O('paper',(0,.31,.065),(.10,.13,.028),'ribbed-plastron')
 for y in [.24,.29,.34,.39]:L('grey',[(-.075,y,.08),(0,y,.10),(.075,y,.08)],.004,'plastron-rib')
 h=union([O('paper',(0,.52,0),(.105,.12,.08),'turtle-skull'),O('paper',(0,.46,.09),(.09,.045,.07),'skull-muzzle')],'dry-bones-skull',.008,.3)
 for d in [-1,1]:O('ink',(d*.045,.54,front_at(h,d*.045,.54)+.002),(.028,.037,.006),'dark-skull-eye');L('paper',[(d*.12,.39,0),(d*.18,.31,.04),(d*.17,.29,.12)],.017,'bone-arm');O('paper',(d*.17,.29,.12),(.027,.024,.025),'bone-hand')
 for x in [-.035,0,.035]:L('grey',[(x,.45,.15),(x,.43,.15)],.003,'skull-tooth-seam')
 for y in [.24,.33,.42]:L('paper',[(-.1,y,-.10),(0,y,-.16),(.1,y,-.10)],.006,'rear-shell-rib')
 return wurst_ref('Dry Bones: complete white turtle skeleton, dark eye sockets, grey shell/shoes and ribbed pale plastron')
BUILDERS.update({'wurstii-bart-simpson':wurst_bart,'wurstii-bucky-ohare':wurst_bucky,'wurstii-chip-n-dale':wurst_chipdale,'wurstii-diddy-kong':lambda:monkey(False),'wurstii-dixie-kong':lambda:monkey(True),'wurstii-dr-wily':wurst_wily,'wurstii-dry-bones':wurst_drybones})
def viking(olaf):
 # Both Lost Vikings designs use the actual supplied pixel art, not namesakes.
 col='green'if olaf else'blue';skin='cream'
 for d in [-1,1]:sole(d*.085,color='grey'if olaf else'red',w=.06,length=.085);loft(col,[(d*.085,.05,0,.055,.06),(d*.085,.24,0,.065,.07)],'viking-trouser',16)
 loft(col,[(0,.20,0,.14,.10),(0,.36,0,.18 if olaf else .14,.12),(0,.49,0,.12,.085),(0,.53,0,.08,.055)],'viking-tunic',24)
 h=loft(skin,[(0,.48,0,.06,.05),(0,.56,0,.12,.085),(0,.69,0,.12,.085),(0,.74,0,.08,.055)],'viking-head',22);eyes_on(h,.65,.043,.022);O(skin,(0,.59,.11),(.048,.035,.045),'viking-nose')
 for x in [-.08,-.04,0,.04,.08]:L('yellow'if olaf else'red',[(x,.57,.09),(x*.8,.43,.13),(x*.15,.32 if olaf else .28,.10)],.029,'long-viking-beard',taper=[1,1,.05])
 loft('grey',[(0,.70,0,.13,.10),(0,.76,0,.13,.10),(0,.81,0,.08,.06)],'metal-viking-helmet',22)
 for d in [-1,1]:
  L('yellow'if olaf else'paper',[(d*.11,.76,0),(d*.19,.80,0),(d*.18,.91,0)],.025,'helmet-horn',taper=[1,.8,.02]);L(skin,[(d*.12,.45,0),(d*.20,.34,.025),(d*.19,.29,.095)],.032,'viking-arm');O(skin,(d*.19,.29,.095),(.038,.036,.03),'viking-hand')
 if olaf:
  B('brown',(.20,.36,.14),(.16,.43,.07),'held-wooden-shield');B('grey',(.13,.36,.18),(.022,.42,.015),'held-shield-rim');B('grey',(.27,.36,.18),(.022,.42,.015),'held-shield-rim');B('grey',(.20,.16,.18),(.16,.022,.015),'held-shield-rim');B('grey',(.20,.56,.18),(.16,.022,.015),'held-shield-rim')
  for y in [.24,.37,.49]:L('ink',[(.15,y,.18),(.25,y,.18)],.003,'shield-plank-seam')
 return wurst_ref('Olaf of The Lost Vikings: green tunic, yellow beard, grey horned helmet and brown rectangular shield, not Frozen snowman'if olaf else'Eric of The Lost Vikings: red hair/long beard, grey white-horned helmet, blue trousers and red boots')
def wurst_falco():
 for d in [-1,1]:sole(d*.08,color='brown');loft('ink',[(d*.08,.04,0,.05,.055),(d*.08,.25,0,.06,.06)],'flight-trouser',16)
 loft('paper',[(0,.22,0,.13,.09),(0,.40,0,.14,.10),(0,.48,0,.09,.06)],'pilot-white-jacket',22);L('red',[(0,.28,.105),(0,.47,.075)],.018,'red-shirt-front')
 h=O('blue',(0,.59,0),(.12,.12,.09),'falco-head');O('yellow',(0,.53,.115),(.09,.035,.08),'falco-beak')
 for d in [-1,1]:eye(d*.048,.61,front_at(h,d*.048,.61)+.002,.022);L('orange',[(d*.02,.65,.08),(d*.085,.66,.055)],.009,'orange-brow');L('blue',[(d*.11,.43,0),(d*.18,.34,.03),(d*.18,.28,.09)],.027,'blue-bird-arm')
 for x in [-.06,0,.06]:L('blue',[(x,.67,0),(x-.035,.80,-.03)],.024,'blue-crest-feather',taper=[1,.05])
 return wurst_ref('Falco Lombardi: blue bird with swept crest, orange brows, yellow beak, white flight jacket, red shirt and dark trousers')
def wurst_frog():
 body=O('green',(0,.13,0),(.16,.10,.17),'frog-low-body');O('yellow',(0,.19,.02),(.10,.035,.12),'yellow-dorsal-stripe')
 for d in [-1,1]:
  O('green',(d*.10,.23,.10),(.055,.065,.055),'raised-eye-turret');eye(d*.10,.245,.15,.025)
  L('green',[(d*.12,.12,.10),(d*.23,.07,.17),(d*.23,.025,.23)],.022,'frog-front-leg')
  L('green',[(d*.12,.12,-.10),(d*.24,.08,-.15),(d*.17,.025,-.22)],.032,'folded-frog-haunch')
  for z,xx in [(.23,d*.23),(-.22,d*.17)]:
   for dx in [-.025,0,.025]:L('green',[(xx,.025,z),(xx+dx,.01,z+.035)],.009,'frog-webbed-toe')
 L('ink',[(-.07,.12,.155),(0,.105,.17),(.07,.12,.155)],.003,'frog-mouth')
 return wurst_ref('Frogger: low green four-legged frog, yellow dorsal stripe, raised eyes and splayed toes; not upright humanoid')
def wurst_hoagie():
 for d in [-1,1]:sole(d*.10,color='paper',w=.065,length=.085);loft('blue',[(d*.10,.05,0,.065,.07),(d*.10,.26,0,.08,.085)],'baggy-jeans',18)
 body=loft('ink',[(0,.20,0,.17,.12),(0,.37,0,.22,.15),(0,.52,0,.18,.12),(0,.57,0,.11,.075)],'round-black-shirt',28)
 h=loft('cream',[(0,.53,0,.07,.05),(0,.59,0,.12,.08),(0,.68,0,.12,.085),(0,.72,0,.08,.055)],'hoagie-face',22);eyes_on(h,.65,.044,.02)
 for d in [-1,1]:L('ink',[(d*.10,.68,0),(d*.15,.57,0),(d*.17,.48,-.02)],.038,'long-black-hair',taper=[1,1.1,.4]);L('cream',[(d*.18,.47,0),(d*.23,.34,.03),(d*.17,.27,.10)],.033,'bare-arm')
 loft('blue',[(0,.69,0,.12,.09),(0,.73,0,.12,.09),(0,.77,0,.06,.04)],'blue-cap',20)
 O('paper',(0,.40,front_at(body,0,.40)+.005),(.045,.045,.008),'shirt-skull')
 for x in [-.017,.017]:O('ink',(x,.41,.16),(.009,.012,.003),'skull-eye')
 for d in [-1,1]:L('orange',[(d*.035,.37,.15),(d*.11,.38,.13),(d*.13,.43,.11)],.01,'shirt-flame-emblem',taper=[1,1,.05])
 return wurst_ref('Hoagie: broad heavy figure, long black hair, blue cap/jeans, black skull-and-orange-flame shirt, white shoes')
def wurst_jason():
 for d in [-1,1]:sole(d*.075,color='violet');loft('violet',[(d*.075,.04,0,.05,.055),(d*.075,.25,0,.06,.065)],'purple-trouser',16)
 loft('violet',[(0,.22,0,.13,.09),(0,.41,0,.15,.10),(0,.49,0,.09,.065)],'purple-jacket',22)
 O('violet',(0,.60,-.015),(.12,.13,.09),'masked-head');mask=O('aqua',(0,.60,.055),(.105,.12,.045),'cyan-hockey-mask')
 for d in [-1,1]:
  O('ink',(d*.043,.63,.097),(.021,.025,.005),'mask-eye-hole');L('violet',[(d*.12,.43,0),(d*.18,.34,.025),(d*.16,.29,.10)],.029,'purple-sleeve');O('aqua',(d*.16,.29,.10),(.033,.034,.027),'cyan-glove')
 for x,y in [(-.04,.56),(0,.54),(.04,.56),(-.055,.59),(.055,.59),(0,.69)]:O('ink',(x,y,front_at(mask,x,y)+.002),(.007,.008,.003),'mask-vent')
 return wurst_ref('Jason NES sprite: purple outfit, cyan hockey mask and cyan hands. No additional weapon or gore added beyond source')
def wurst_knuckles():
 for d in [-1,1]:sole(d*.09,color='red',w=.06,length=.09);L('red',[(d*.09,.06,0),(d*.07,.23,0)],.025,'red-leg');O('yellow',(d*.09,.065,.05),(.05,.014,.03),'shoe-yellow-band')
 loft('red',[(0,.18,0,.10,.075),(0,.34,0,.12,.09),(0,.43,0,.08,.055)],'knuckles-body',22)
 h=O('red',(0,.56,0),(.13,.13,.095),'echidna-head');O('cream',(0,.50,.09),(.10,.035,.045),'echidna-muzzle');O('ink',(0,.52,.13),(.025,.018,.018),'echidna-nose');eyes_on(h,.59,.047,.026)
 for d in [-1,1]:
  for i in range(3):L('red',[(d*(.07+i*.02),.64,-.005-i*.025),(d*(.15+i*.012),.49,-.02-i*.03),(d*(.16+i*.018),.35,-.04-i*.03)],.026,'dreadlock-spine',taper=[1,1,.1])
  L('red',[(d*.10,.40,0),(d*.18,.35,.04),(d*.20,.42,.12)],.026,'echidna-arm');O('paper',(d*.20,.42,.12),(.055,.052,.045),'spiked-white-glove')
  for dx in [-.018,.018]:loft('paper',[(d*.20+dx,.46,.14,.014,.012),(d*.20+dx,.51,.15,.002,.002)],'glove-knuckle-spike',10)
 L('paper',[(-.065,.38,.074),(0,.35,.095),(.065,.38,.074)],.012,'white-chest-crescent')
 return wurst_ref('Knuckles: red echidna, hanging head spines, cream muzzle, white crescent chest, large white spiked gloves and red/yellow shoes')
def wurst_lakitu():
 cloud=union([O('paper',(x,.11,z),(r,.10,r*.75))for x,z,r in [(-.12,0,.12),(0,0,.15),(.12,0,.12),(0,.07,.12)]],'integrated-cloud',.009,.3)
 for x in [-.045,.045]:eye(x,.13,.15,.016)
 L('green',[(-.045,.075,.14),(0,.06,.16),(.045,.075,.14)],.004,'cloud-smile')
 loft('yellow',[(0,.17,0,.085,.065),(0,.30,0,.10,.075),(0,.39,0,.065,.05)],'lakitu-torso',22)
 h=O('yellow',(0,.45,0),(.10,.105,.075),'lakitu-head')
 for d in [-1,1]:
  O('paper',(d*.043,.47,.07),(.033,.04,.012),'spectacle-white');eye(d*.043,.47,.085,.018);L('ink',[(d*.043+math.cos(i*math.pi/8)*.039,.47+math.sin(i*math.pi/8)*.045,.091)for i in range(17)],.004,'goggle-rim');L('yellow',[(d*.08,.32,0),(d*.13,.24,.05)],.023,'lakitu-arm')
 O('green',(0,.29,-.055),(.10,.11,.055),'green-shell')
 return wurst_ref('Lakitu: yellow turtle in white smiling cloud, green shell and black-rimmed goggles. Cloud is integral character silhouette and grounded without a game base')
BUILDERS.update({'wurstii-eric':lambda:viking(False),'wurstii-olaf':lambda:viking(True),'wurstii-falco-lombardi':wurst_falco,'wurstii-frogger':wurst_frog,'wurstii-hoagie':wurst_hoagie,'wurstii-jason-vorhees':wurst_jason,'wurstii-knuckles':wurst_knuckles,'wurstii-lakitu':wurst_lakitu})
def wurst_lizzie():
 for d in [-1,1]:sole(d*.10,color='green',w=.06,length=.09);L('green',[(d*.10,.07,0),(d*.10,.25,0)],.038,'lizard-haunch-leg')
 body=loft('green',[(0,.19,0,.13,.10),(0,.37,-.015,.16,.12),(0,.52,0,.11,.08),(0,.58,0,.075,.055)],'upright-lizard-body',24)
 O('yellow',(0,.34,.095),(.095,.12,.022),'pale-lizard-belly');h=O('green',(0,.65,0),(.12,.13,.09),'lizzie-head');O('green',(0,.59,.11),(.10,.05,.075),'lizard-snout');eyes_on(h,.69,.045,.024)
 for d in [-1,1]:O('ink',(d*.035,.625,.18),(.008,.008,.004),'lizard-nostril');L('green',[(d*.10,.49,0),(d*.18,.41,.03),(d*.18,.44,.12)],.025,'lizard-arm')
 L('green',[(0,.23,-.08),(.13,.12,-.22),(.24,.035,-.25)],.05,'heavy-lizard-tail',taper=[1.4,1,.03])
 for y in [.30,.39,.48,.57,.66,.75]:fin('yellow',[(0,y-.03,-.07),(0,y+.03,-.07),(0,y+.045,-.15)],'dorsal-spine',.025)
 return wurst_ref('Lizzie: green upright reptile with pale yellow belly, heavy tail, dorsal spikes and bent claw arms')
def wurst_gamewatch():
 # Deliberate thick silhouette, still closed geometry, not a flat sprite plane.
 body=loft('ink',[(0,.19,0,.07,.045),(0,.37,0,.09,.055),(0,.45,0,.055,.04)],'silhouette-torso',20)
 union([O('ink',(0,.56,0),(.12,.13,.06),'silhouette-head'),O('ink',(.115,.57,0),(.07,.04,.05),'long-round-nose')],'game-watch-profile',.007,.3)
 for d in [-1,1]:
  L('ink',[(d*.05,.22,0),(d*.13,.11,0),(d*.16,.035,.025)],.023,'silhouette-leg');O('ink',(d*.16,.03,.04),(.06,.03,.055),'silhouette-shoe');L('ink',[(d*.07,.40,0),(d*.16,.34,.01),(d*.21,.44,.01)],.019,'silhouette-arm');O('ink',(d*.21,.45,.01),(.04,.04,.025),'silhouette-hand')
 return wurst_ref('Mr Game and Watch: black profile silhouette with projecting round nose and gloved hands. Kept intentionally monochrome but all parts are closed thick volumes with complete side/back')
def wurst_harry():
 for d in [-1,1]:sole(d*.075,color='blue');loft('aqua',[(d*.075,.04,0,.045,.05),(d*.075,.25,0,.055,.055)],'explorer-trouser',16)
 loft('aqua',[(0,.22,0,.12,.08),(0,.41,0,.13,.085),(0,.49,0,.08,.055)],'explorer-shirt',22)
 h=loft('cream',[(0,.46,0,.055,.045),(0,.54,0,.095,.075),(0,.66,0,.10,.075),(0,.71,0,.06,.045)],'harry-head',22);eyes_on(h,.625,.036,.02);O('cream',(.025,.575,.09),(.035,.026,.04),'harry-nose')
 loft('aqua',[(0,.67,0,.16,.11),(0,.70,0,.16,.11),(0,.73,0,.10,.075),(0,.83,-.01,.07,.05)],'turquoise-explorer-hat',22)
 for d in [-1,1]:L('cream',[(d*.10,.42,0),(d*.17,.34,.03),(d*.14,.29,.09)],.022,'harry-arm');O('cream',(d*.14,.29,.09),(.028,.028,.023),'harry-hand')
 L('brown',[(-.09,.45,.04),(.08,.25,.075)],.012,'explorer-shoulder-strap')
 return wurst_ref('Pitfall Harry card-specific turquoise hat/clothes, blue footwear and pale face/arms. Side/back inferred, no unrelated whip or jungle props added')
def wurst_rockford():
 for d in [-1,1]:sole(d*.075,color='brown');loft('orange',[(d*.075,.04,0,.045,.05),(d*.075,.22,0,.055,.06)],'miner-trouser',16)
 loft('orange',[(0,.19,0,.12,.09),(0,.34,0,.14,.10),(0,.42,0,.08,.055)],'miner-body',22)
 h=loft('cream',[(0,.39,0,.055,.045),(0,.48,0,.12,.085),(0,.62,0,.12,.09),(0,.68,0,.075,.055)],'rockford-round-face',24);eyes_on(h,.56,.048,.025);O('cream',(0,.50,.11),(.04,.027,.035),'miner-nose')
 loft('red',[(0,.62,0,.16,.115),(0,.66,0,.16,.115),(0,.73,0,.12,.09),(0,.78,0,.055,.04)],'red-miner-cap',24)
 for d in [-1,1]:L('cream',[(d*.11,.36,0),(d*.17,.29,.025),(d*.15,.23,.075)],.023,'miner-arm');O('cream',(d*.15,.23,.075),(.03,.028,.026),'miner-hand')
 return wurst_ref('Rockford: squat pale miner face, red helmet/cap and warm orange clothing. Not replaced by a namesake character')
def wurst_guest():
 for d in [-1,1]:sole(d*.07,color='brown');L('cream',[(d*.07,.06,0),(d*.07,.22,0)],.022,'guest-shin');loft('aqua',[(d*.07,.17,0,.045,.05),(d*.07,.30,0,.055,.055)],'guest-short',16)
 loft('green',[(0,.26,0,.12,.08),(0,.43,0,.12,.08),(0,.49,0,.075,.05)],'green-guest-shirt',22)
 h=loft('cream',[(0,.46,0,.055,.045),(0,.53,0,.09,.07),(0,.65,0,.095,.075),(0,.70,0,.055,.045)],'guest-face',22);eyes_on(h,.61,.035,.018)
 for x in [-.07,-.025,.025,.07]:L('brown',[(x,.67,-.015),(x-.02,.74,-.005),(x+.02,.71,.045)],.025,'brown-guest-hair',taper=[1,1,.1])
 for d in [-1,1]:L('cream',[(d*.10,.43,0),(d*.17,.34,.03),(d*.16,.27,.07)],.021,'guest-arm');O('cream',(d*.16,.27,.07),(.026,.028,.022),'guest-hand')
 return wurst_ref('RollerCoaster Tycoon Guest: brown hair, green shirt, turquoise shorts and brown shoes. No balloon or extra theme invented')
def wurst_simon():
 for d in [-1,1]:sole(d*.08,color='brown');loft('brown',[(d*.08,.045,0,.05,.055),(d*.08,.20,0,.055,.06)],'tall-adventurer-boot',16);L('cream',[(d*.08,.20,0),(d*.07,.31,0)],.03,'bare-upper-leg')
 loft('brown',[(0,.27,0,.13,.085),(0,.38,0,.12,.08),(0,.48,0,.14,.09),(0,.53,0,.085,.06)],'belmont-leather-tunic',22)
 h=loft('cream',[(0,.50,0,.055,.045),(0,.57,0,.09,.07),(0,.68,0,.095,.075),(0,.74,0,.06,.045)],'belmont-face',22);eyes_on(h,.65,.035,.019);O('cream',(0,.595,.085),(.025,.026,.03),'belmont-nose')
 for d in [-1,1]:
  L('brown',[(d*.06,.72,-.02),(d*.10,.67,-.045),(d*.10,.55,-.05)],.029,'long-brown-hair',taper=[1,1,.2]);L('cream',[(d*.13,.47,0),(d*.19,.37,.03),(d*.18,.32,.10)],.031,'muscular-arm');O('brown',(d*.18,.32,.10),(.034,.035,.027),'brown-glove')
 L('yellow',[(-.12,.32,.03),(0,.31,.09),(.12,.32,.03)],.01,'belt')
 L('brown',[(.18,.32,.10),(.25,.26,.10),(.25,.10,.07),(.16,.06,.10)],.008,'held-coiled-whip',taper=[1,.8,.6,.1])
 return wurst_ref('Simon Belmont: brown leather outfit/boots, pale muscular arms and brown hair; small coiled whip follows canonical equipment, not a new rule effect')
def wurst_spot():
 for d in [-1,1]:sole(d*.09,color='paper',w=.06,length=.085);L('ink',[(d*.09,.05,0),(d*.07,.30,0)],.009,'thin-spot-leg')
 body=O('red',(0,.43,0),(.13,.20,.085),'red-oval-spot')
 for d in [-1,1]:O('ink',(d*.045,.50,.077),(.042,.028,.01),'sunglass-lens');L('ink',[(d*.10,.42,0),(d*.20,.39,.03),(d*.24,.48,.04)],.008,'thin-spot-arm');O('paper',(d*.24,.48,.04),(.036,.025,.025),'white-spot-glove')
 L('ink',[(-.075,.52,.06),(0,.52,.09),(.075,.52,.06)],.006,'sunglass-frame');O('ink',(0,.37,.083),(.025,.035,.006),'spot-open-mouth')
 L('grey',[(.24,.47,.04),(.25,.18,.04)],.0025,'held-yoyo-string');O('red',(.25,.16,.04),(.027,.03,.016),'held-yoyo')
 return wurst_ref('Spot: red oval mascot wearing black sunglasses, thin black limbs, white gloves/shoes and held red yo-yo')
def wurst_yoshi():
 for d in [-1,1]:sole(d*.09,color='orange',w=.065,length=.10);L('green',[(d*.09,.06,0),(d*.08,.25,0)],.032,'yoshi-leg')
 loft('green',[(0,.18,0,.12,.09),(0,.34,0,.15,.11),(0,.48,0,.10,.075),(0,.54,0,.07,.055)],'yoshi-body',24);O('paper',(0,.32,.095),(.105,.12,.025),'white-yoshi-belly')
 h=O('green',(0,.63,0),(.12,.14,.09),'yoshi-head');O('green',(0,.55,.135),(.13,.08,.11),'large-yoshi-snout');O('paper',(0,.49,.105),(.10,.028,.075),'white-lower-jaw')
 for d in [-1,1]:O('paper',(d*.045,.69,.065),(.036,.06,.025),'tall-yoshi-eye');O('ink',(d*.045,.70,.091),(.012,.027,.006),'yoshi-pupil');O('ink',(d*.05,.59,.23),(.007,.009,.003),'snout-nostril');L('green',[(d*.11,.42,0),(d*.18,.35,.03),(d*.17,.29,.11)],.025,'yoshi-arm');O('green',(d*.17,.29,.11),(.032,.03,.026),'yoshi-hand')
 O('red',(0,.38,-.09),(.10,.09,.035),'red-saddle');L('green',[(0,.23,-.075),(.08,.15,-.21),(.12,.10,-.25)],.035,'yoshi-tail',taper=[1.5,1,.02])
 for y in [.55,.62,.69]:fin('orange',[(0,y-.02,-.075),(0,y+.025,-.075),(0,y+.015,-.13)],'orange-neck-spine',.022)
 return wurst_ref('Yoshi: green dinosaur with large snout/tall eyes, white jaw/belly, orange shoes/spines, red saddle and tail')
BUILDERS.update({'wurstii-lizzie':wurst_lizzie,'wurstii-mr-game-and-watch':wurst_gamewatch,'wurstii-pitfall-harry':wurst_harry,'wurstii-rockford':wurst_rockford,'wurstii-rollercoaster-tycoon-guest':wurst_guest,'wurstii-simon-belmont':wurst_simon,'wurstii-spot':wurst_spot,'wurstii-yoshi':wurst_yoshi})
