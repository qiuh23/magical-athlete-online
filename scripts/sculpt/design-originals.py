# Original-box designs from actually viewed publisher card sheets, pp22–25.
# Each recipe has its own body construction; helpers only generate surfaces.
def eyes_on(host,y,gap=.05,size=.025,cx=0):
 for d in [-1,1]:
  x=cx+d*gap;eye(x,y,front_at(host,x,y)+.002,size,pupilx=.003)
def brow_on(host,x,y,width,color='ink',slant=0):
 coords=[(x-width,y+slant),(x,y),(x+width,y-slant)]
 return L(color,[(px,py,front_at(host,px,py)+.006)for px,py in coords],.006,'fitted-expression-brow')
def beard(color,pts,r=.04):return L(color,pts,r,'sculpted-lock',taper=[1,.9,.03])
def alchemist():
 for x in [-.09,.09]:sole(x,color='ink')
 loft('green',[(0,.07,0,.16,.12),(0,.20,0,.18,.13),(0,.39,0,.15,.11),(0,.51,0,.12,.09)],'wizard-robe',24)
 head=loft('pink',[(0,.45,.02,.06,.06),(0,.51,.025,.10,.08),(0,.62,0,.11,.09),(0,.68,0,.075,.06)],'wizard-face',20)
 O('pink',(.02,.56,.115),(.045,.045,.07),'bulbous-nose');eyes_on(head,.615,.038,.021)
 for x in [-.075,-.025,.025,.075]:beard('orange',[(x,.535,.095),(x*.9,.41,.11),(x*.4,.34,.07)],.035)
 loft('green',[(0,.64,0,.16,.13),(0,.68,0,.18,.145),(-.02,.74,0,.13,.10),(-.06,.84,-.015,.10,.075),(-.14,.91,-.02,.05,.045),(-.20,.88,-.01,.003,.005)],'folded-wizard-hat',24)
 L('green',[(-.15,.65,.06),(0,.64,.15),(.15,.66,.05)],.022,'heavy-hat-brim')
 for d in [-1,1]:L('green',[(d*.12,.43,0),(d*.20,.35,.05),(d*.19,.40,.16)],.046,'robe-sleeve');O('pink',(d*.19,.40,.17),(.035,.035,.03),'hand')
 # A thick small cauldron/flask is held, not used as a fake game base.
 loft('violet',[(0,.09,.21,.05,.04),(0,.14,.21,.10,.065),(0,.24,.21,.11,.07),(0,.28,.21,.095,.06)],'cauldron',20)
 L('violet',[(-.095,.28,.21),(0,.28,.28),(.095,.28,.21),(0,.28,.15),(-.095,.28,.21)],.014,'cauldron-rim')
 for d in [-1,1]:L('violet',[(d*.09,.24,.21),(d*.16,.29,.20),(d*.19,.38,.17),(d*.13,.33,.18),(d*.095,.28,.21)],.014,'held-cauldron-handle')
 L('orange',[(.19,.39,.17),(.19,.70,.15)],.018,'stirring-rod')
 return 'Publisher card p22: green bent hat/robe, orange beard, purple/pink hands and cauldron. Complete robe back and held cauldron depth inferred.'
def baba():
 # Tiny slanted hut on very long bent bird legs, never a generic human.
 for d in [-1,1]:
  L('yellow',[(d*.12,.48,0),(d*.19,.27,-.03),(d*.15,.06,.055)],.023,'long-chicken-leg')
  for dx in [-.06,0,.06]:L('yellow',[(d*.15,.045,.04),(d*.15+dx,.018,.14)],.015,'chicken-toe',taper=[1,.2])
 B('paper',(0,.61,0),(.37,.30,.27),'hut-wall')
 # Roof is a solid pitched mesh, angled ridge and orange shingles.
 vs=[(-.23,.75,-.18),(.23,.75,-.18),(.23,.75,.18),(-.23,.75,.18),(0,.91,-.18),(0,.91,.18)]
 mesh=bpy.data.meshes.new('roof');mesh.from_pydata(vs,[],[(0,1,2,3),(0,4,5,3),(4,1,2,5),(0,1,4),(3,5,2)]);mesh.update();o=bpy.data.objects.new('roof',mesh);scene.collection.objects.link(o);add(o,'orange','pitched-roof')
 for x in [-.10,.10]:B('aqua',(x,.63,.143),(.08,.10,.016),'window');L('ink',[(x-.04,.63,.156),(x+.04,.63,.156)],.004,'window-bar')
 B('brown',(0,.51,.144),(.07,.12,.02),'door');K('brown',(.12,.88,-.07),.03,.03,.16,'chimney')
 for y in [.54,.59,.69]:L('grey',[(-.18,y,.14),(.18,y,.14)],.004,'wall-cladding')
 return 'Publisher card p22: small orange-roofed hut on extremely long yellow chicken legs. Window, rear wall and roof thickness completed in project design.'
def banana():
 # Broad curved peel, side profile recognizable from all views; no cylindrical body template.
 body=loft('yellow',[(-.17,.10,0,.025,.055),(-.15,.18,0,.075,.10),(-.055,.30,0,.11,.105),(.045,.45,0,.11,.10),(.11,.63,0,.095,.085),(.12,.79,0,.06,.065),(.08,.88,0,.025,.04)],'curved-banana-peel',24)
 L('brown',[(.08,.87,0),(.065,.93,0)],.026,'stem')
 L('orange',[(-.18,.12,.03),(-.12,.26,.085),(0,.43,.105),(.075,.64,.08)],.006,'peel-seam')
 for x,attachment in [(-.10,.23),(.03,.32)]:
  L('orange',[(x,attachment,0),(x,.025,.01)],.018,'bird-ankle')
  for dx in [-.04,0,.04]:L('orange',[(x,.025,.015),(x+dx,0,.10)],.012,'banana-toe',taper=[1,.1])
 for x in [.045,.10]:
  z=front_at(body,x,.66);eye(x,.66,z+.002,.023,pupilx=.004)
 nose=O('yellow',(.13,.57,.07),(.038,.035,.06),'banana-nose')
 L('ink',[(x,y,front_at(body,x,y)+.005)for x,y in [(.005,.49),(.06,.475),(.11,.50)]],.004,'banana-smile')
 return 'Publisher card p22: curved yellow banana, dark stem, orange birdlike feet and side-set face. Peel thickness and reverse seam are project interpretation.'
def blimp():
 # Full silver dirigible, not the old pink spherical head with basket.
 O('grey',(0,.43,0),(.29,.15,.14),'silver-envelope')
 for z in [-.075,0,.075]:L('paper',[(-.27,.43,z*.25),(-.13,.53,z),(.12,.53,z),(.27,.43,z*.25)],.004,'envelope-rib')
 for d in [-1,1]:fin('grey',[(d*.02,.43,-.08),(d*.02,.60,-.19),(d*.02,.43,-.22)],'tail-fin',.04)
 O('grey',(-.22,.40,.10),(.045,.04,.03),'nose-cheek')
 for x in [-.245,-.195]:eye(x,.45,.105,.017)
 O('red',(-.22,.365,.12),(.025,.012,.008),'small-gasp')
 # Tiny undercarriage feet are sculpt supports, not a separate pedestal.
 for x in [-.10,.10]:B('grey',(x,.265,0),(.055,.065,.045),'undercarriage')
 return 'Publisher card p22: silver ribbed dirigible with small face near the nose. Full tail fins and compact undercarriage inferred; explosion omitted from the static pawn.'
def centaur():
 body=O('red',(0,.30,-.06),(.17,.13,.24),'horse-barrel')
 for d in [-1,1]:
  for z in [-.21,.11]:L('red',[(d*.12,.29,z),(d*.13,.14,z+.015),(d*.13,.05,z+.025)],.034,'horse-leg');O('ink',(d*.13,.035,z+.04),(.045,.035,.065),'hoof')
 loft('orange',[(0,.29,.09,.10,.08),(0,.43,.10,.12,.075),(0,.56,.10,.14,.08),(0,.60,.10,.075,.06)],'centaur-torso',20)
 h=loft('orange',[(0,.57,.1,.06,.055),(0,.63,.1,.095,.075),(0,.73,.1,.10,.075),(0,.79,.08,.07,.055)],'centaur-head',20)
 O('orange',(.035,.67,.18),(.06,.043,.06),'centaur-nose');eyes_on(h,.737,.04,.021)
 for d in [-1,1]:L('orange',[(d*.10,.54,.1),(d*.17,.46,.12),(d*.08,.44,.20)],.032,'folded-arm')
 for x in [-.07,0,.07]:beard('paper',[(x,.79,.03),(x*.9,.74,-.02),(x*.7,.60,-.03)],.032)
 L('paper',[(0,.34,-.25),(.08,.41,-.31),(.13,.26,-.32)],.043,'swept-horse-tail',taper=[.7,1.3,.1])
 return 'Publisher card p22: orange human torso, red equine body, long white hair and tail. Four legs, hooves and rear proportions reconstructed.'
def cheerleader():
 for x in [-.095,.095]:sole(x,color='aqua')
 body=loft('red',[(0,.075,0,.1,.08),(0,.18,0,.17,.12),(0,.38,0,.18,.13),(0,.52,0,.17,.12),(0,.61,0,.11,.08)],'furry-cheer-body',24)
 for d in [-1,1]:
  L('red',[(d*.12,.40,0),(d*.20,.52,.025),(d*.22,.64,.015)],.034,'raised-cheer-arm');O('paper',(d*.22,.64,.015),(.05,.06,.045),'white-glove')
  for i in range(7):a=i*math.pi*2/7;L('violet',[(d*.22,.67,.01),(d*.22+math.cos(a)*.09,.73+math.sin(a)*.08,0),(d*.22+math.cos(a)*.08,.79+math.sin(a)*.05,.015)],.027,'pom-tuft',taper=[1,1,.2])
 eyes_on(body,.53,.06,.036);O('violet',(0,.45,.15),(.095,.07,.06),'huge-purple-nose')
 O('ink',(0,.31,.128),(.085,.045,.012),'open-cheer-smile')
 for x in [-.04,0,.04]:B('paper',(x,.332,.142),(.032,.025,.008),'cheer-teeth')
 for x in [-.11,-.055,0,.055,.11]:L('orange',[(x,.29,.116),(x,.23,.119)],.005,'fur-groove')
 return 'Publisher card p22: round red furry cheerleader, huge purple nose, purple pom-poms and white gloves. Back fur and lower stance inferred.'
BUILDERS.update({'alchemist':alchemist,'baba-yaga':baba,'banana':banana,'blimp':blimp,'centaur':centaur,'cheerleader':cheerleader})
def dicemonger():
 for x in [-.1,.1]:sole(x,color='ink')
 loft('red',[(0,.07,0,.17,.11),(0,.23,-.015,.19,.13),(0,.44,-.02,.17,.12),(0,.51,-.015,.14,.08)],'dealer-coat',24)
 h=loft('violet',[(0,.48,0,.07,.06),(0,.56,0,.12,.09),(0,.68,0,.12,.095),(0,.73,0,.07,.06)],'dealer-head',20);O('violet',(.025,.60,.11),(.075,.04,.07),'dealer-long-nose');eyes_on(h,.665,.047,.024)
 brow_on(h,-.047,.694,.025,'ink',.004);brow_on(h,.047,.703,.025,'ink',-.005)
 loft('red',[(0,.7,0,.14,.11),(0,.73,0,.15,.12),(0,.79,-.01,.10,.085),(0,.82,-.01,.065,.06)],'dealer-hat',20)
 L('ink',[(-.07,.55,.085),(0,.537,.10),(.07,.55,.085)],.004,'knowing-smile')
 # Open coat displays a real rack with individually inset small dice.
 B('brown',(0,.30,.115),(.29,.30,.055),'dice-display-rack')
 for row,y in enumerate([.20,.29,.38]):
  for col,x in enumerate([-.09,0,.09]):
   color=['paper','yellow','green'][(col+row)%3];B(color,(x,y,.16),(.065,.065,.045),'display-die')
   for dx,dy in [(-.013,-.013),(.013,.013)]:O('ink',(x+dx,y+dy,.186),(.005,.005,.002),'die-pip')
 for d in [-1,1]:L('red',[(d*.12,.46,0),(d*.23,.38,.04),(d*.20,.31,.12)],.04,'dealer-sleeve');O('violet',(d*.20,.31,.14),(.035,.04,.03),'dealer-hand')
 return 'Publisher card p22: purple dealer, red coat/hat and colorful dice rack inside opened coat. Cabinet depth, sleeves and back tailored in 3D.'
def duelist():
 for x in [-.09,.09]:sole(x,color='brown')
 loft('blue',[(0,.08,0,.18,.13),(0,.20,0,.19,.13),(0,.39,-.01,.14,.10),(0,.53,0,.13,.085)],'flared-duelist-coat',24)
 for d in [-1,1]:L('red',[(d*.065,.49,.07),(d*.04,.34,.115),(d*.045,.17,.13)],.018,'coat-facing')
 h=loft('aqua',[(0,.5,0,.06,.055),(0,.57,0,.10,.085),(0,.69,0,.13,.095),(0,.76,-.01,.08,.07)],'duelist-head',20)
 O('red',(.01,.628,.13),(.045,.033,.07),'long-red-nose');eyes_on(h,.697,.045,.023)
 brow_on(h,-.045,.726,.025,'blue',.007);brow_on(h,.045,.726,.025,'blue',-.007)
 ruff((0,.515,0),.065,.13)
 loft('blue',[(0,.735,0,.17,.13),(0,.77,-.01,.18,.14),(-.03,.85,-.02,.12,.10),(-.08,.91,-.025,.08,.06),(-.14,.89,-.02,.012,.015)],'plumed-duelist-hat',24)
 L('paper',[(.10,.79,-.02),(.13,.94,-.03),(.06,1.00,-.04)],.018,'hat-feather',taper=[1,1.3,.02])
 for d in [-1,1]:L('blue',[(d*.11,.46,0),(d*.19,.38,.04),(d*.22,.49,.10)],.034,'bent-duelist-sleeve');O('aqua',(d*.22,.49,.11),(.033,.036,.027),'sword-hand')
 L('paper',[(.235,.38,.13),(.235,.91,.13)],.009,'rapier');L('yellow',[(.18,.53,.13),(.28,.53,.13)],.012,'cross-guard')
 return 'Publisher card p23: blue feathered hat and coat, pale blue face, long red nose, white neck ruff and rapier. Full garment construction/back inferred.'
def egg():
 # A nested magician under a huge orange shell-like canopy, as the card shows.
 for x in [-.07,.07]:sole(x,color='blue',w=.04,length=.07)
 loft('blue',[(0,.05,0,.10,.08),(0,.19,0,.12,.09),(0,.30,0,.08,.065)],'inner-robe',20)
 h=O('paper',(0,.29,0),(.09,.10,.075),'inner-face');O('red',(0,.27,.078),(.04,.04,.03),'red-nose');eyes_on(h,.33,.031,.022)
 loft('violet',[(0,.34,0,.15,.11),(0,.37,0,.16,.12),(0,.44,-.01,.09,.07)],'inner-hat',20)
 # Thick rounded conical shell, open edge indicated by inner pale rolled lip.
 loft('orange',[(0,.43,0,.28,.19),(0,.47,0,.29,.20),(0,.61,0,.23,.16),(0,.78,-.01,.15,.10),(0,.89,-.01,.06,.045),(0,.91,-.01,.005,.005)],'orange-egg-shell',24)
 L('paper',[(-.26,.445,.08),(-.13,.435,.17),(0,.435,.195),(.13,.435,.17),(.26,.445,.08)],.015,'shell-rolled-edge')
 for x in [-.025,.025]:eye(x,.59,.166,.020)
 return 'Publisher card p23: immense orange egg/shell canopy concealing a small blue/purple magician, red nose and two eyes on shell. Nested rear volumes inferred, no rule change.'
def flipflop():
 body=loft('violet',[(0,0,0,.14,.12),(0,.06,0,.25,.18),(0,.22,0,.23,.17),(0,.39,-.015,.17,.14),(0,.51,0,.12,.10),(0,.55,0,.05,.05)],'purple-puddle-creature',28)
 eyes_on(body,.43,.05,.026)
 # Long yellow whisker/moustache lobes are dominant, not sandal straps.
 for d in [-1,1]:
  L('yellow',[(d*.025,.365,.145),(d*.11,.30,.17),(d*.15,.17,.19),(d*.18,.11,.16)],.027,'long-moustache',taper=[.7,1.5,.9,.02])
  for i in range(3):L('grey',[(d*.035,.52,-.015),(d*(.065+i*.025),.62-i*.015,-.035),(d*(.12+i*.025),.54,-.05)],.016,'swept-hair',taper=[.6,1,.05])
 O('yellow',(0,.36,.16),(.035,.032,.025),'nose');O('ink',(0,.26,.17),(.045,.02,.007),'puddle-mouth')
 return 'Publisher card p23: purple low soft creature, long yellow drooping moustache, swept grey hair. It is not a literal flip-flop shoe; back and underside inferred.'
def genius():
 for x in [-.09,.09]:sole(x,color='green')
 loft('red',[(0,.07,0,.14,.10),(0,.20,0,.17,.115),(0,.38,0,.15,.10),(0,.48,0,.10,.07)],'genius-vest',24)
 h=loft('pink',[(0,.44,0,.07,.06),(0,.52,0,.13,.10),(0,.66,0,.16,.12),(0,.76,-.01,.11,.08)],'genius-cranium',24)
 sn=O('pink',(.035,.57,.13),(.17,.07,.13),'long-genius-snout');h=union([h,sn],'genius-head-snout',.009,.35)
 eyes_on(h,.705,.055,.027)
 L('ink',[(x,.53+abs(x)*.12,front_at(h,x,.53+abs(x)*.12)+.003)for x in [-.085,-.04,0,.04,.085]],.004,'genius-grin')
 for x in [-.055,.055]:
  z=front_at(h,x,.705)+.01;L('ink',[(x+math.cos(a*math.pi/8)*.037,.705+math.sin(a*math.pi/8)*.038,z)for a in range(17)],.006,'round-spectacle')
 L('ink',[(-.025,.705,.12),(.025,.705,.12)],.005,'spectacle-bridge')
 for d in [-1,1]:
  for i in range(5):L('aqua',[(d*.09,.75,-.015),(d*(.14+i*.018),.82-i*.018,-.04),(d*(.18+i*.014),.74-i*.02,-.03)],.018,'wild-blue-hair',taper=[1,1,.03])
  L('red',[(d*.12,.41,0),(d*.20,.33,.04),(d*.18,.30,.15)],.034,'sleeve');O('pink',(d*.18,.30,.15),(.033,.035,.03),'hand')
 B('blue',(.16,.32,.19),(.10,.15,.027),'calculator')
 for x in [.135,.165,.195]:
  for y in [.29,.32,.35]:O('yellow',(x,y,.207),(.007,.007,.002),'calculator-key')
 for d in [-1,1]:L('paper',[(d*.07,.47,.05),(d*.04,.41,.10)],.02,'shirt-collar')
 return 'Publisher card p23: pink long-snouted genius, blue untidy hair, round spectacles, red vest and calculator. Limbs, back tailoring and hand grip inferred.'
def heckler():
 for x in [-.10,.10]:sole(x,color='pink',w=.07,length=.09)
 body=loft('pink',[(0,.07,0,.13,.10),(0,.20,0,.18,.13),(0,.40,0,.17,.12),(0,.54,0,.12,.09)],'hyena-body',24)
 h=loft('pink',[(0,.48,0,.08,.06),(0,.56,0,.15,.11),(0,.68,0,.17,.12),(0,.76,0,.12,.08)],'hyena-head',24)
 sn=O('pink',(0,.59,.11),(.14,.07,.09),'hyena-muzzle');h=union([h,sn],'hyena-cheek-muzzle',.009,.34)
 eyes_on(h,.707,.065,.026);O('red',(0,.62,.207),(.049,.038,.03),'red-nose')
 z=front_at(h,0,.55);O('ink',(0,.55,z+.006),(.09,.04,.009),'wide-laugh')
 for x in [-.06,-.02,.02,.06]:K('paper',(x,.566,z+.019),.012,0,.035,'laugh-fang',rot=(0,0,math.pi))
 for d in [-1,1]:
  loft('pink',[(d*.12,.69,0,.055,.035),(d*.22,.79,-.01,.06,.025),(d*.25,.83,-.02,.006,.004)],'huge-hyena-ear',16)
  L('pink',[(d*.13,.40,0),(d*.22,.34,.01),(d*.21,.27,.10)],.034,'hyena-arm')
  for x,y in [(d*.11,.32),(d*.14,.23),(d*.08,.40)]:O('ink',(x,y,front_at(body,x,y)+.003),(.02,.024,.004),'coat-spot')
 for i in range(5):L('yellow',[(0,.75,-.02),(.015+i*.015,.84-i*.008,-.035),(.09+i*.015,.76,-.05)],.022,'yellow-mohawk',taper=[1,1,.05])
 L('green',[(-.10,.48,.04),(0,.46,.10),(.10,.48,.04)],.018,'green-collar')
 return 'Publisher card p23: pink spotted hyena, huge ears, red nose, yellow swept mane, green collar and laughing teeth. Rear spots and standing limbs inferred.'
def huge_baby():
 for x in [-.09,.09]:sole(x,color='pink',w=.065,length=.09)
 O('paper',(0,.17,0),(.17,.12,.13),'cloth-nappy')
 body=loft('pink',[(0,.19,0,.13,.10),(0,.32,0,.20,.14),(0,.46,0,.18,.13),(0,.51,0,.10,.08)],'baby-torso',24)
 head=loft('pink',[(0,.43,0,.12,.10),(0,.52,0,.22,.16),(0,.72,0,.23,.17),(0,.85,0,.19,.14),(0,.90,0,.08,.06)],'large-baby-head',28)
 eyes_on(head,.70,.075,.024)
 for x in [-.075,.075]:brow_on(head,x,.716,.022,'pink',.002)
 for d in [-1,1]:
  O('pink',(d*.22,.64,0),(.035,.055,.04),'ear');L('pink',[(d*.16,.39,0),(d*.23,.31,.02),(d*.19,.26,.11)],.043,'baby-arm');O('pink',(d*.19,.26,.12),(.043,.035,.034),'baby-hand')
 O('pink',(0,.635,.17),(.035,.026,.028),'small-nose');O('orange',(0,.574,.163),(.06,.047,.02),'pacifier-disc');L('blue',[(math.cos(a*math.pi/8)*.025,.574+math.sin(a*math.pi/8)*.025,.19)for a in range(17)],.007,'pacifier-ring')
 return 'Publisher card p23: oversized pink head/body, small drowsy face, orange/blue pacifier and white diaper. Side ears, hands and back folds inferred.'
BUILDERS.update({'dicemonger':dicemonger,'duelist':duelist,'egg':egg,'flip-flop':flipflop,'genius':genius,'heckler':heckler,'huge-baby':huge_baby})
def hypnotist():
 pts=[]
 for i in range(22):a=i/21*math.pi*3.3;r=.20-i/21*.10;pts.append((math.cos(a)*r,.07+i/21*.035,math.sin(a)*r))
 L('green',pts,.06,'coiled-snake-base')
 h=loft('green',[(0,.09,0,.09,.08),(0,.25,0,.10,.08),(0,.42,0,.13,.09),(0,.57,0,.16,.10),(0,.67,-.01,.12,.08),(0,.70,-.02,.04,.04)],'cobra-head-neck',24)
 for d in [-1,1]:
  loft('green',[(d*.09,.22,-.03,.055,.04),(d*.17,.37,-.04,.09,.045),(d*.18,.53,-.04,.09,.055),(d*.14,.62,-.03,.045,.035)],'spread-cobra-hood',20)
  for y in [.30,.39,.48,.57]:L('blue',[(d*.12,y,.005),(d*.21,y+.02,.005)],.02,'hood-stripe')
 for x in [-.055,.055]:
  z=front_at(h,x,.59)+.005;O('paper',(x,.59,z),(.047,.047,.012),'hypnotic-eye')
  L('ink',[(x+math.cos(i/60*math.pi*5)*(.002+i/60*.035),.59+math.sin(i/60*math.pi*5)*(.002+i/60*.035),z+.014)for i in range(61)],.003,'eye-spiral')
 O('red',(0,.47,.10),(.09,.035,.015),'snake-smile')
 for d in [-1,1]:O('red',(d*.055,.29,.09),(.055,.038,.023),'bow-loop')
 O('yellow',(0,.29,.117),(.022,.025,.014),'bow-knot')
 return 'Publisher card p23: green/blue banded cobra, spiral eyes and red bow. Coiled rear and full hood thickness inferred; hypnotic detail is static geometry.'
def inchworm():
 pts=[(-.25,.08,0),(-.22,.20,0),(-.13,.34,0),(-.03,.26,0),(.01,.09,0),(.10,.16,0),(.16,.37,0),(.21,.52,.015)]
 # One shared-ring tube: colour bands cannot separate at bend tangents.
 path=[];steps=8;sides=16
 for i in range(len(pts)-1):
  a=Vector(pts[max(0,i-1)]);b=Vector(pts[i]);c=Vector(pts[i+1]);d=Vector(pts[min(len(pts)-1,i+2)])
  for k in range(steps):
   t=k/steps;path.append(.5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t))
 path.append(Vector(pts[-1]));vertices=[]
 for i,p in enumerate(path):
  tangent=(path[min(i+1,len(path)-1)]-path[max(0,i-1)]).normalized();u=Vector((-tangent.y,tangent.x,0)).normalized();v=tangent.cross(u).normalized()
  for k in range(sides):
   angle=k*2*math.pi/sides;vertices.append(tuple(p+(u*math.cos(angle)+v*math.sin(angle))*.061))
 faces=[tuple(reversed(range(sides)))];bands=[0]
 for i in range(len(path)-1):
  for k in range(sides):faces.append((i*sides+k,i*sides+(k+1)%sides,(i+1)*sides+(k+1)%sides,(i+1)*sides+k));bands.append((i//steps)%2)
 faces.append(tuple(range((len(path)-1)*sides,len(path)*sides)));bands.append(0)
 mesh=bpy.data.meshes.new('unbroken-striped-worm');mesh.from_pydata(vertices,[],faces);mesh.update();o=bpy.data.objects.new('unbroken-striped-worm',mesh);scene.collection.objects.link(o);o=add(o,'aqua','continuous-striped-worm');o.data.materials.append(MATS['violet'])
 for polygon,band in zip(o.data.polygons,bands):polygon.material_index=band
 h=O('green',(.21,.54,.025),(.075,.085,.065),'worm-face');eyes_on(h,.565,.025,.019,cx=.21)
 for d in [-1,1]:L('green',[(.21+d*.03,.59,0),(.21+d*.04,.67,0)],.012,'feeler',taper=[1,.2])

 return 'Publisher card p24: looping purple/blue furry inchworm with green face and antennae. Continuous 3D bends and underside inferred; no detached decorative legs.'
def lackey():
 for x in [-.09,.09]:sole(x,color='green',w=.065,length=.09)
 loft('pink',[(0,.07,0,.16,.12),(0,.22,-.035,.20,.16),(0,.42,-.03,.20,.15),(0,.60,-.02,.17,.12),(0,.72,-.01,.11,.09)],'hunched-ragged-cloak',28)
 h=loft('green',[(0,.49,.06,.07,.06),(0,.57,.07,.12,.09),(0,.66,.05,.12,.085),(0,.71,.02,.065,.05)],'lackey-face',20)
 nose=O('green',(.035,.58,.16),(.10,.04,.12),'long-hooked-nose');h=union([h,nose],'hook-nosed-lackey',.008,.35);eyes_on(h,.655,.043,.025)
 for d in [-1,1]:
  L('pink',[(d*.13,.40,0),(d*.19,.30,.02),(d*.10,.28,.15)],.044,'hunched-sleeve');O('green',(d*.09,.28,.17),(.04,.035,.025),'clasping-hand')
  B('aqua',(d*.15,.37,-.09),(.045,.05,.015),'patched-cloak')
 L('ink',[(-.06,.52,.14),(0,.50,.16),(.07,.525,.15)],.004,'happy-grin')
 return 'Publisher card p24: hunched pink patched cloak, green elongated face/nose and green hands. Full back hump, hem and clasped stance inferred.'
def leaptoad():
 body=O('aqua',(0,.23,0),(.16,.18,.12),'frog-body');head=O('aqua',(0,.43,.015),(.23,.13,.14),'broad-frog-head');head=union([body,head],'frog-body-head',.009,.30)
 for d in [-1,1]:
  O('aqua',(d*.14,.54,0),(.09,.12,.09),'eye-tower');O('paper',(d*.14,.56,.075),(.075,.095,.025),'large-frog-eye');O('ink',(d*.14,.57,.101),(.025,.06,.008),'frog-pupil')
  L('aqua',[(d*.12,.22,0),(d*.23,.13,-.025),(d*.16,.06,.09)],.042,'spring-hind-leg')
  for dx in [-.05,0,.05]:L('orange',[(d*.16,.035,.10),(d*.16+dx,.006,.20)],.018,'webbed-toe',taper=[1,.3])
  L('aqua',[(d*.14,.31,.01),(d*.23,.23,.04),(d*.22,.08,.13)],.022,'front-frog-arm')
 L('paper',[(-.14,.41,.13),(0,.385,.159),(.14,.41,.13)],.016,'wide-frog-grin')
 return 'Publisher card p24: bright blue frog, huge white eyes, long jumping limbs and orange webbed feet. Rear and relaxed jumping stance interpreted.'
def legs():
 for d in [-1,1]:
  sole(d*.11,color='red',w=.075,length=.14)
  loft('green',[(d*.11,.05,0,.055,.07),(d*.11,.18,0,.06,.06),(d*.10,.52,0,.06,.055),(d*.09,.72,0,.075,.06)],'very-long-trouser-leg',18)
  L('yellow',[(d*.11,.12,.062),(d*.105,.42,.055),(d*.09,.69,.06)],.005,'trouser-pinstripe')
 loft('violet',[(0,.68,0,.14,.08),(0,.79,0,.13,.075),(0,.85,0,.10,.06)],'tiny-tailcoat',20)
 for d in [-1,1]:L('violet',[(d*.10,.8,0),(d*.18,.74,.01)],.023,'short-sleeve');O('yellow',(d*.18,.72,.02),(.035,.035,.025),'small-hand')
 h=O('yellow',(0,.89,0),(.065,.065,.05),'inferred-small-head');eyes_on(h,.905,.022,.013)
 for d in [-1,1]:O('red',(d*.033,.81,.066),(.033,.022,.012),'bow')
 O('paper',(0,.82,.065),(.014,.018,.01),'shirt-front')
 return 'Publisher card p24 shows dominant long green striped trousers, red shoes, purple coat and red bow; the cropped-off small yellow head is explicitly project completion, not independently visible original art.'
def lovable():
 body=loft('green',[(0,0,.03,.21,.15),(0,.04,.03,.24,.18),(0,.09,.02,.20,.16)],'snail-foot',28)
 shell=O('pink',(0,.29,-.045),(.21,.25,.14),'rounded-shell')
 # Raised spiral on the visible front and back, fully volumetric shell underneath.
 for d in [-1,1]:
  pts=[]
  for i in range(70):a=i/69*math.pi*4.7;r=.012+i/69*.18;pts.append((math.cos(a)*r,.30+math.sin(a)*r,-.045+d*.135))
  L('violet',pts,.008,'shell-spiral')
 h=loft('green',[(.15,.04,.12,.07,.07),(.17,.17,.14,.07,.06),(.17,.32,.15,.06,.05),(.16,.39,.15,.04,.035)],'snail-neck',18)
 for d in [-1,1]:
  L('green',[(.16+d*.026,.35,.15),(.16+d*.04,.46,.16)],.013,'eye-stalk');O('paper',(.16+d*.04,.465,.16),(.025,.027,.025),'eye');O('ink',(.16+d*.04,.465,.182),(.008,.011,.005),'pupil')
 L('green',[(.19,.18,.18),(.26,.26,.20)],.014,'flower-hand');L('green',[(.26,.20,.20),(.26,.36,.20)],.006,'flower-stem')
 for i in range(5):a=i*math.pi*2/5;O('paper',(.26+math.cos(a)*.022,.36+math.sin(a)*.022,.20),(.018,.015,.007),'flower-petal')
 O('yellow',(.26,.36,.208),(.012,.012,.004),'flower-center')
 return 'Publisher card p24: green snail with large pink spiral shell, raised eye stalks and little flower. Shell reverse spiral and underside inferred.'
def magician():
 for x in [-.08,.08]:sole(x,color='ink')
 loft('blue',[(0,.07,0,.16,.105),(0,.21,0,.16,.115),(0,.42,0,.14,.10),(0,.49,0,.10,.07)],'magician-jacket',24)
 loft('orange',[(0,.12,.102,.075,.015),(0,.35,.10,.08,.015),(0,.47,.065,.05,.02)],'orange-waistcoat',14)
 head=loft('violet',[(0,.46,0,.07,.06),(0,.54,0,.12,.09),(0,.67,0,.14,.11),(0,.75,-.01,.10,.075)],'elephant-head',24)
 for d in [-1,1]:
  O('violet',(d*.14,.62,-.015),(.11,.13,.035),'elephant-ear');O('pink',(d*.16,.62,.012),(.06,.085,.008),'ear-inset')
  L('blue',[(d*.115,.40,0),(d*.20,.34,.02),(d*.22,.43,.11)],.035,'bent-sleeve');O('violet',(d*.22,.43,.12),(.033,.034,.03),'hand')
 eyes_on(head,.65,.045,.025);L('violet',[(0,.59,.10),(0,.50,.17),(.025,.42,.20),(.09,.44,.21)],.035,'curled-trunk',taper=[1.2,1,.7,.5])
 for d in [-1,1]:O('paper',(d*.035,.465,.078),(.035,.022,.01),'white-bowtie')
 L('paper',[(-.22,.44,.12),(-.22,.75,.12)],.008,'wand');L('ink',[(-.22,.44,.12),(-.22,.68,.12)],.012,'wand-grip')
 loft('blue',[(.23,.27,.14,.07,.055),(.23,.42,.14,.065,.05),(.23,.44,.14,.095,.07)],'held-magic-hat',18);O('red',(.23,.41,.14),(.072,.015,.055),'hatband')
 B('paper',(.23,.48,.14),(.065,.065,.065),'conjured-die');O('violet',(.23,.48,.175),(.009,.009,.003),'die-pip')
 return 'Publisher card p24: purple elephant, blue jacket, orange waistcoat, white bow, wand and held blue hat/die. Back costume and trunk underside reconstructed.'
BUILDERS.update({'hypnotist':hypnotist,'inchworm':inchworm,'lackey':lackey,'leaptoad':leaptoad,'legs':legs,'lovable-loser':lovable,'magician':magician})
def mastermind():
 loft('green',[(0,0,0,.18,.14),(0,.15,0,.22,.16),(0,.36,-.01,.18,.14),(0,.50,0,.12,.09)],'mastermind-cloak',24)
 head=loft('orange',[(0,.44,.015,.08,.06),(0,.53,.025,.12,.09),(0,.64,0,.12,.10),(0,.69,-.015,.08,.06)],'mastermind-head',20)
 nose=L('orange',[(.025,.59,.09),(.085,.57,.19),(.11,.54,.21)],.038,'large-beak',taper=[1.1,1,.05]);head=union([head,nose],'scheming-head-beak',.008,.35)
 eyes_on(head,.625,.045,.020)
 brow_on(head,-.045,.655,.027,'ink',.009);brow_on(head,.045,.655,.027,'ink',-.009)
 for d in [-1,1]:L('green',[(d*.12,.37,0),(d*.18,.30,.06),(d*.025,.34,.17)],.035,'steepled-arm');O('orange',(d*.025,.35,.17),(.027,.037,.024),'steepled-hand')
 brain=loft('paper',[(0,.65,-.02,.13,.10),(0,.75,-.03,.24,.14),(0,.86,-.04,.25,.15),(0,.94,-.035,.18,.11),(0,.97,-.03,.06,.045)],'large-brain-dome',28)
 for d in [-1,1]:
  for i in range(3):
   x=d*(.04+i*.045);coords=[(x,.76),(x+d*.01,.82),(x-d*.01,.89)]
   L('cream',[(px,py,front_at(brain,px,py)+.003)for px,py in coords],.007,'seated-brain-fold')
 return 'Publisher card p24: huge pale brain above orange long-nosed schemer, green cloak and steepled hands. Full dome and cloak rear sculpted, not the former red crowned cube.'
def mouth():
 for x in [-.12,.12]:sole(x,color='aqua',w=.05,length=.07);L('aqua',[(x,.05,0),(x,.16,0)],.022,'mouth-leg')
 O('ink',(0,.35,0),(.22,.18,.065),'oral-cavity-back')
 L('red',[(math.cos(i*math.pi/24)*.225,.36+math.sin(i*math.pi/24)*.19,.045)for i in range(49)],.041,'continuous-red-lips')
 for x in [-.15,-.09,-.03,.03,.09,.15]:
  B('paper',(x,.475,.075),(.052,.062,.04),'upper-tooth');B('paper',(x,.235,.075),(.052,.055,.04),'lower-tooth')
 O('red',(0,.25,.04),(.08,.035,.028),'tongue')
 for d in [-1,1]:
  L('paper',[(d*.035,.565,.06),(d*.035,.608,.08)],.009,'short-eye-stalk');eye(d*.035,.615,.085,.022);L('aqua',[(d*.21,.35,0),(d*.28,.40,.045)],.022,'blue-arm');O('aqua',(d*.28,.41,.055),(.03,.035,.022),'blue-glove')
 return 'Publisher card p24: red-lipped giant mouth with two tooth rows, tiny eyes, blue arms and legs. Recessed oral volume and reverse surface inferred.'
def partyanimal():
 for x in [-.09,.09]:sole(x,color='yellow',w=.065,length=.095)
 loft('pink',[(0,.075,0,.15,.11),(0,.24,0,.18,.12),(0,.43,0,.14,.10),(0,.50,0,.095,.07)],'party-striped-coat',24)
 for x in [-.09,0,.09]:L('green',[(x,.13,.10),(x*.9,.33,.115),(x*.8,.45,.08)],.016,'party-coat-stripe')
 h=loft('yellow',[(0,.47,0,.07,.055),(0,.53,0,.13,.09),(0,.66,0,.15,.115),(0,.75,-.01,.10,.075)],'party-dog-head',24)
 sn=O('yellow',(.02,.58,.13),(.11,.055,.08),'party-muzzle');h=union([h,sn],'party-head-muzzle',.009,.35);eyes_on(h,.684,.05,.026);O('blue',(0,.60,.207),(.035,.027,.025),'blue-nose')
 for d in [-1,1]:
  loft('yellow',[(d*.11,.67,0,.055,.032),(d*.18,.75,-.02,.04,.024),(d*.17,.81,-.02,.005,.005)],'party-dog-ear',12)
  L('pink',[(d*.11,.42,0),(d*.22,.40,.04),(d*.24,.51,.09)],.035,'party-sleeve');O('yellow',(d*.24,.52,.10),(.034,.04,.03),'party-hand')
 loft('pink',[(0,.735,0,.14,.11),(0,.77,0,.15,.12),(0,.87,-.01,.10,.08),(0,.90,-.01,.11,.085)],'party-top-hat',20);L('green',[(-.1,.83,.03),(0,.83,.09),(.1,.83,.03)],.016,'hat-stripe')
 return 'Publisher card p24: yellow canine party animal, pink/green striped coat and hat, blue nose and raised hands. Rear coat and tail details inferred.'
def rocket_scientist():
 for x in [-.075,.075]:sole(x,color='ink')
 loft('paper',[(-.05,.07,0,.14,.10),(-.05,.23,0,.16,.115),(-.05,.43,0,.13,.095),(-.05,.50,0,.08,.06)],'scientist-labcoat',24)
 h=loft('green',[(-.05,.47,0,.06,.05),(-.05,.54,0,.10,.08),(-.05,.66,0,.11,.085),(-.05,.72,-.01,.07,.055)],'scientist-head',20)
 for x in [-.095,-.015]:
  z=front_at(h,x,.64);O('paper',(x,.64,z+.005),(.043,.05,.018),'oversized-goggle');O('ink',(x,.64,z+.022),(.015,.031,.006),'goggle-pupil')
 for i in range(5):L('yellow',[(-.09,.70,-.015),(-.16-i*.012,.78-i*.012,-.03),(-.21-i*.012,.70-i*.015,-.035)],.013,'swept-scientist-hair',taper=[1,.9,.05])
 # Rocket remains a held prop rather than replacing the scientist's body.
 loft('red',[(.19,.02,.04,.065,.055),(.19,.13,.04,.085,.07),(.19,.51,.04,.075,.065),(.19,.66,.04,.045,.04),(.19,.72,.04,.003,.003)],'red-rocket',20)
 for y in [.45,.49]:L('ink',[(.12,y,.07),(.19,y,.108),(.26,y,.07)],.012,'rocket-check-band')
 for d in [-1,1]:L('paper',[(-.05+d*.11,.42,0),(-.05+d*.16,.33,.04),(.13,.31,.13)],.031,'holding-arm')
 O('green',(.13,.31,.14),(.035,.035,.025),'rocket-grip')
 return 'Publisher card p25: green-faced scientist in white lab coat, huge goggles and swept yellow hair holding a red rocket. Grip and rocket reverse fins are project construction.'
def romantic():
 for x in [-.08,.08]:sole(x,color='pink')
 loft('yellow',[(0,.075,0,.16,.10),(0,.23,0,.18,.12),(0,.44,0,.14,.10),(0,.51,0,.10,.07)],'romantic-jacket',24)
 head=loft('pink',[(0,.48,0,.07,.055),(0,.54,0,.12,.09),(0,.66,0,.14,.10),(0,.73,-.015,.085,.06)],'croc-head',24)
 sn=O('pink',(.025,.585,.13),(.16,.06,.11),'romantic-snout');head=union([head,sn],'romantic-head-snout',.009,.35);eyes_on(head,.68,.045,.025)
 L('ink',[(x,.54+abs(x)*.10,front_at(head,x,.54+abs(x)*.10)+.002)for x in [-.09,-.045,0,.045,.09]],.003,'romantic-grin')
 for x in [-.06,0,.06]:K('paper',(x,.55,front_at(head,x,.55)+.006),.009,0,.023,'croc-tooth',rot=(0,0,math.pi))
 for d in [-1,1]:L('red',[(d*.08,.49,.06),(d*.06,.39,.11)],.021,'red-collar');L('yellow',[(d*.12,.42,0),(d*.19,.32,.03),(d*.13,.29,.17)],.034,'book-holding-sleeve');O('pink',(d*.13,.29,.18),(.035,.033,.027),'hand')
 for d in [-1,1]:B('paper',(d*.075,.29,.20),(.145,.12,.027),'open-book-page',rot=(0,d*.22,0));L('brown',[(d*.14,.24,.20),(d*.015,.23,.22)],.009,'book-binding')
 for i in range(5):a=i*math.pi*2/5;O('paper',(-.08+math.cos(a)*.018,.39+math.sin(a)*.018,.118),(.012,.012,.004),'lapel-flower')
 L('pink',[(0,.22,-.09),(-.09,.13,-.17),(-.15,.17,-.15)],.027,'croc-tail',taper=[1.3,.7,.05])
 return 'Publisher card p25: pink long-snouted romantic, yellow jacket/red collar, open book and lapel flower. Complete limbs, tail and book depth inferred.'
def scoocher():
 # Seated shaggy dog, not a person on a scooter.
 body=loft('brown',[(0,0,0,.15,.13),(0,.10,0,.21,.16),(0,.28,-.015,.20,.14),(0,.42,0,.15,.11),(0,.48,0,.09,.07)],'seated-dog-body',24)
 head=loft('brown',[(0,.36,.02,.10,.08),(0,.43,.025,.17,.115),(0,.55,.01,.18,.12),(0,.62,0,.12,.085)],'shaggy-dog-head',24)
 sn=O('brown',(.015,.445,.14),(.14,.06,.08),'long-dog-muzzle');head=union([head,sn],'dog-muzzle-head',.009,.35);eyes_on(head,.55,.06,.025)
 for d in [-1,1]:
  L('brown',[(d*.12,.56,0),(d*.25,.60,-.01),(d*.30,.51,.01)],.045,'drooping-shaggy-ear',taper=[1,1.2,.25])
  O('brown',(d*.12,.055,.12),(.065,.055,.09),'front-paw')
  L('brown',[(d*.15,.29,.01),(d*.16,.15,.09),(d*.12,.07,.12)],.034,'resting-foreleg')
 O('red',(0,.42,.217),(.034,.03,.02),'dog-nose');L('pink',[(.015,.39,.197),(.025,.31,.20),(.065,.29,.19)],.023,'long-tongue',taper=[.8,1,.4])
 for d in [-1,1]:L('brown',[(d*.03,.574,.11),(d*.06,.565,.13),(d*.095,.574,.10)],.013,'sleepy-lid')
 return 'Publisher card p25: seated shaggy brown dog with spread drooping ears, sleepy lids and long pink tongue. Full back fur and resting paws inferred; no scooter invented.'
def sisyphus():
 for x in [-.095,.095]:sole(x,color='orange')
 body=loft('orange',[(0,.07,0,.11,.09),(0,.19,0,.15,.11),(0,.36,0,.16,.11),(0,.44,0,.10,.07)],'sisyphus-torso',24)
 loft('paper',[(0,.12,.015,.17,.13),(0,.23,.015,.18,.14),(0,.34,0,.17,.13),(0,.42,-.02,.10,.08)],'wrapped-toga',24)
 h=loft('orange',[(0,.40,0,.06,.05),(0,.48,0,.11,.09),(0,.58,0,.12,.10),(0,.66,-.01,.08,.065)],'long-nosed-head',20);O('orange',(.025,.51,.13),(.075,.04,.075),'long-nose');eyes_on(h,.595,.045,.024)
 O('ink',(-.025,.465,front_at(h,-.025,.465)+.004),(.033,.022,.006),'worried-open-mouth')
 for d in [-1,1]:L('orange',[(d*.10,.36,0),(d*.19,.43,.04),(d*.22,.52,.09)],.03,'raised-pushing-arm');O('orange',(d*.22,.52,.10),(.035,.045,.025),'hand')
 for x in [-.045,0,.045]:L('paper',[(x,.65,-.01),(x-.035,.71,-.02),(x-.07,.67,-.03)],.013,'wispy-hair',taper=[.6,1,.05])
 L('paper',[(-.12,.42,.065),(.02,.28,.15),(.12,.16,.09)],.026,'diagonal-toga-sash')
 for y in [.18,.23,.28]:L('grey',[(-.12,y,.075),(0,y-.02,.13),(.12,y+.01,.075)],.004,'toga-fold')
 return 'Publisher card p25: orange figure with long nose, sparse white hair, white wrapped toga and raised arms. Back wrapping and pushing stance inferred; no oversized boulder crowds adjacent pawns.'
def skipper():
 for x in [-.09,.09]:sole(x,color='yellow')
 loft('yellow',[(0,.07,0,.16,.11),(0,.23,0,.18,.12),(0,.43,0,.14,.10),(0,.50,0,.10,.07)],'raincoat',24)
 head=loft('orange',[(0,.47,0,.07,.06),(0,.55,0,.13,.10),(0,.67,0,.14,.105),(0,.74,-.01,.095,.07)],'sailor-head',24);nose=O('orange',(.035,.61,.13),(.11,.04,.085),'long-sailor-nose');head=union([head,nose],'sailor-cheeks-nose',.009,.35);eyes_on(head,.687,.05,.024)
 loft('yellow',[(0,.705,0,.17,.13),(0,.75,0,.16,.125),(-.01,.81,-.01,.11,.085),(-.025,.83,-.015,.05,.04)],'sou-wester',20)
 for d in [-1,1]:L('yellow',[(d*.12,.41,0),(d*.20,.34,.02),(d*.13,.30,.16)],.034,'wheel-holding-sleeve');O('orange',(d*.13,.30,.17),(.035,.035,.025),'wheel-hand')
 L('pink',[(math.cos(i*math.pi/12)*.14,.30+math.sin(i*math.pi/12)*.14,.19)for i in range(25)],.018,'fake-wheel-rim')
 for i in range(6):a=i*math.pi/3;L('pink',[(0,.30,.19),(math.cos(a)*.155,.30+math.sin(a)*.155,.19)],.010,'fake-wheel-spoke')
 return 'Publisher card p25: orange sailor in yellow coat and sou-wester holding a pink fake wheel. Wheel is an attached prop, not a locomotion system; back inferred.'
def stickler():
 pts=[]
 for i in range(19):a=i/18*math.pi*2.8;r=.20-i/18*.1;pts.append((math.cos(a)*r,.07+i/18*.03,math.sin(a)*r))
 L('pink',pts,.055,'coiled-worm-base')
 h=loft('pink',[(0,.08,0,.10,.08),(0,.25,0,.12,.09),(0,.43,0,.14,.10),(0,.56,-.01,.14,.11),(0,.65,-.015,.09,.075)],'worm-reader-head',24)
 O('pink',(.015,.47,.12),(.07,.045,.06),'round-reader-nose');eyes_on(h,.56,.047,.025)
 brow_on(h,-.047,.594,.027,'aqua',.007);brow_on(h,.047,.594,.027,'aqua',-.007)
 O('ink',(0,.405,front_at(h,0,.405)+.005),(.035,.018,.007),'reader-mutter')
 for d in [-1,1]:
  L('pink',[(d*.09,.32,.02),(d*.19,.25,.08),(d*.13,.24,.17)],.024,'reader-arm');O('pink',(d*.13,.24,.18),(.03,.03,.023),'reader-hand')
 B('orange',(0,.25,.19),(.23,.15,.04),'rulebook');B('paper',(0,.25,.213),(.19,.11,.009),'book-page');
 for y in [.22,.25,.28]:L('aqua',[(-.065,y,.221),(.065,y,.221)],.003,'printed-book-line')
 for x in [-.045,0,.045]:L('aqua',[(x,.64,-.01),(x-.025,.70,-.025),(x-.045,.67,-.03)],.010,'reader-hair',taper=[1,1,.1])
 return 'Publisher card p25: pink coiled worm-like rules reader, blue hair, large nose and orange book. Back coils and book thickness inferred, not the former literal ruler.'
def suckerfish():
 O('green',(0,.25,0),(.16,.17,.25),'fish-body')
 for d in [-1,1]:
  O('paper',(d*.147,.32,.07),(.014,.038,.045),'fish-eye');O('violet',(d*.16,.32,.08),(.005,.017,.022),'pupil')
  fin('green',[(d*.12,.25,-.03),(d*.24,.15,-.14),(d*.15,.32,-.16)],'side-fin',.025)
 fin('green',[(0,.27,-.19),(0,.42,-.35),(0,.26,-.29),(0,.10,-.35),(0,.18,-.19)],'fishtail',.035)
 O('orange',(0,.25,.245),(.105,.11,.025),'suction-lips');O('ink',(0,.25,.272),(.069,.074,.005),'suction-opening')
 for d in [-1,1]:fin('green',[(d*.06,.14,.08),(d*.08,0,.06),(d*.09,.06,-.06)],'ground-fin',.022)
 for x in [-.04,0,.04]:L('red',[(x,.40,-.05),(x,.45,-.15),(x,.42,-.19)],.012,'swept-dorsal-ray',taper=[1,.8,.05])
 return 'Publisher card p25: green fish with large orange suction mouth, side eyes and swept dorsal rays. Complete tail and ventral supports inferred; no human legs.'
def thirdwheel():
 # One true circular wheel under a yellow long-nosed rider.
 L('ink',[(math.cos(i*math.pi/16)*.15,.16+math.sin(i*math.pi/16)*.15,0)for i in range(33)],.026,'single-wheel-tire')
 for i in range(8):a=i*math.pi/4;L('grey',[(0,.16,0),(math.cos(a)*.13,.16+math.sin(a)*.13,0)],.008,'wheel-spoke')
 O('grey',(0,.16,0),(.025,.025,.025),'wheel-hub')
 loft('red',[(0,.28,0,.10,.07),(0,.42,0,.14,.09),(0,.53,0,.11,.075)],'striped-shirt',20)
 for y in [.34,.41,.48]:L('pink',[(-.10,y,.045),(0,y,.095),(.10,y,.045)],.012,'shirt-stripe')
 h=loft('yellow',[(0,.5,0,.065,.05),(0,.58,0,.12,.09),(0,.69,0,.13,.10),(0,.75,-.01,.075,.06)],'rat-head',20);O('yellow',(.04,.62,.14),(.11,.045,.10),'long-rat-nose');eyes_on(h,.70,.044,.024)
 for d in [-1,1]:
  O('yellow',(d*.13,.70,0),(.048,.065,.025),'rat-ear');L('yellow',[(d*.10,.46,0),(d*.18,.40,.02),(d*.20,.51,.06)],.027,'raised-rat-arm');O('yellow',(d*.20,.515,.065),(.032,.036,.026),'rat-hand')
 L('yellow',[(0,.31,-.08),(.13,.29,-.17),(.18,.37,-.13)],.012,'rat-tail',taper=[1,.8,.03])
 return 'Publisher card p25: yellow long-nosed rat, red/pink striped shirt and one wheel. Full tire/spokes, rear tail and hands inferred.'
def twin():
 for k,d in enumerate([-1,1]):
  x=d*.14;shirt='paper'if k==0 else'pink'
  for dx in [-.045,.045]:sole(x+dx,color='yellow',w=.035,length=.06)
  loft(shirt,[(x,.05,0,.08,.06),(x,.20,0,.11,.075),(x,.36,0,.09,.065),(x,.42,0,.06,.05)],'individual-shirt',16)
  if k==0:
   for y in [.15,.22,.29,.36]:L('ink',[(x-.07,y,.04),(x,y,.079),(x+.07,y,.04)],.012,'striped-twin-shirt')
  h=loft('yellow',[(x,.40,0,.06,.05),(x,.47,0,.10,.07),(x,.58,0,.11,.08),(x,.64,-.01,.07,.05)],'individual-lizard-head',20)
  O('yellow',(x,.49,.10),(.095,.045,.065),'twin-snout');eyes_on(h,.588,.035,.019,cx=x)
  L('yellow',[(x+d*.07,.31,0),(x+d*.12,.24,.02)],.023,'outer-twin-arm')
  L('yellow',[(x,.15,-.05),(x+d*.07,.10,-.10),(x+d*.09,.20,-.11)],.014,'individual-tail',taper=[1,.8,.05])
 return 'Publisher card p25: two yellow lizard-like twins, one black/white striped shirt and one pink shirt. Distinct bodies, tails and complete reverse views inferred.'
BUILDERS.update({'mastermind':mastermind,'mouth':mouth,'party-animal':partyanimal,'rocket-scientist':rocket_scientist,'romantic':romantic,'scoocher':scoocher,'sisyphus':sisyphus,'skipper':skipper,'stickler':stickler,'suckerfish':suckerfish,'third-wheel':thirdwheel,'twin':twin})
