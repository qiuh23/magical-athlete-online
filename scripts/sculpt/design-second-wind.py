# New Second Wind sculpts from retrieved registered card images.
# Reuses surface tools, not a shared recoloured body mesh.
def sw_blunderdog():
 for x in [-.09,.09]:sole(x,color='blue');loft('blue',[(x,.04,0,.055,.06),(x,.20,0,.05,.05)],'hero-boot',16)
 loft('red',[(0,.16,0,.12,.085),(0,.28,0,.16,.11),(0,.44,0,.15,.10),(0,.52,0,.095,.07)],'superdog-suit',24)
 h=loft('yellow',[(0,.48,0,.075,.06),(0,.55,0,.13,.10),(0,.68,0,.15,.11),(0,.75,0,.09,.075)],'superdog-head',24);sn=O('yellow',(.01,.59,.12),(.11,.05,.08),'dog-muzzle');h=union([h,sn],'superdog-muzzle-cheeks',.009,.35)
 for d in [-1,1]:
  loft('yellow',[(d*.11,.68,0,.05,.035),(d*.17,.78,-.01,.045,.025),(d*.15,.83,-.015,.005,.005)],'dog-ear',12)
  L('yellow',[(d*.12,.46,0),(d*.20,.59,.02),(d*.22,.72,.06)],.032,'raised-arm');O('yellow',(d*.22,.73,.065),(.045,.045,.04),'hero-fist')
  z=front_at(h,d*.05,.68);O('blue',(d*.05,.68,z+.002),(.055,.04,.01),'mask-lobe');eye(d*.05,.68,z+.014,.025)
 O('pink',(0,.605,.205),(.038,.028,.022),'pink-nose');star('blue',(0,.35,.115),.115,'chest-star')
 loft('blue',[(0,.16,-.11,.16,.014),(0,.39,-.12,.16,.016),(0,.50,-.07,.10,.012)],'thick-cape',20)
 return 'Registered card image viewed: yellow masked superdog, red suit, blue chest star/boots/cape and raised fists. Sculpted back cape and complete limbs inferred.'
def sw_cheatah():
 for x in [-.085,.085]:sole(x,color='orange')
 body=loft('green',[(0,.07,0,.14,.10),(0,.22,0,.18,.12),(0,.42,-.01,.15,.10),(0,.50,0,.10,.07)],'spotted-knit-sweater',24)
 h=loft('orange',[(0,.47,0,.075,.06),(0,.55,0,.13,.10),(0,.67,0,.145,.11),(0,.74,0,.09,.07)],'cheetah-head',24);sn=O('orange',(.025,.58,.12),(.10,.05,.075),'muzzle');h=union([h,sn],'cheetah-head-muzzle',.009,.35);eyes_on(h,.68,.05,.025)
 O('ink',(.04,.604,.19),(.031,.022,.02),'cat-nose')
 for d in [-1,1]:
  O('orange',(d*.12,.73,0),(.055,.062,.035),'round-ear');O('brown',(d*.13,.74,.028),(.025,.03,.008),'ear-inner')
  L('green',[(d*.12,.43,0),(d*.21,.35,.025),(d*.19,.32,.14)],.034,'sweater-sleeve');O('orange',(d*.19,.32,.15),(.037,.035,.028),'paw')
  for x,y in [(d*.08,.20),(d*.11,.30),(d*.08,.40)]:O('ink',(x,y,front_at(body,x,y)+.003),(.023,.025,.005),'front-spot');O('ink',(x,y,-.105),(.023,.025,.005),'back-spot')
 B('paper',(-.20,.39,.16),(.07,.07,.07),'held-die');O('ink',(-.20,.39,.199),(.008,.008,.003),'die-pip')
 L('orange',[(0,.18,-.09),(.12,.15,-.21),(.20,.26,-.20)],.025,'curled-cheetah-tail',taper=[1.2,.9,.08])
 return 'Registered card image viewed: orange spotted cheetah, green spotted sweater and held die. Integrated muzzle, actual paw grip, rear spots and tail volume reconstructed.'
def sw_critic():
 for x in [-.09,.09]:sole(x,color='aqua')
 O('violet',(0,.40,-.12),(.22,.30,.12),'turtle-shell')
 for x in [-.10,0,.10]:L('ink',[(x,.17,-.18),(x*.8,.4,-.25),(x*.5,.64,-.20)],.006,'rear-shell-seam')
 loft('olive',[(0,.08,0,.14,.10),(0,.22,0,.18,.12),(0,.44,0,.16,.10),(0,.49,0,.10,.07)],'critic-jacket',24)
 h=loft('aqua',[(0,.44,.02,.075,.06),(0,.52,.035,.13,.09),(0,.63,.025,.16,.11),(0,.71,0,.10,.075)],'turtle-head',24);sn=O('aqua',(.03,.57,.13),(.14,.05,.08),'turtle-beak');h=union([h,sn],'turtle-cranium-beak',.009,.34);eyes_on(h,.655,.055,.024)
 L('olive',[(-.12,.43,0),(-.22,.34,.03),(-.10,.48,.15)],.034,'chin-rest-sleeve');O('aqua',(-.09,.49,.16),(.04,.04,.027),'chin-hand')
 L('olive',[(.12,.41,0),(.20,.33,.04),(.20,.31,.15)],.034,'cup-sleeve');O('aqua',(.20,.31,.16),(.035,.035,.028),'cup-hand')
 loft('paper',[(.20,.33,.16,.038,.033),(.20,.43,.16,.044,.038)],'held-cup',16)
 return 'Registered card image viewed: blue turtle, purple shell, olive jacket, hand under chin and cup. Shell has complete rear seams and independent depth.'
def sw_diva():
 h=loft('olive',[(0,0,0,.13,.10),(0,.12,0,.22,.16),(0,.32,0,.24,.17),(0,.52,0,.20,.15),(0,.66,-.01,.12,.09),(0,.70,-.015,.04,.04)],'broad-diva-body',28)
 for d in [-1,1]:
  L('pink',[(d*.13,.59,.01),(d*.23,.46,.04),(d*.20,.25,.06),(d*.13,.10,.08)],.055,'feather-boa',taper=[1,1.25,1.2,.5])
  for j in range(6):L('pink',[(d*.21,.22+j*.055,.085),(d*.27,.24+j*.055,.11),(d*.24,.26+j*.055,.12)],.015,'boa-plume',taper=[1,1,.03])
  z=front_at(h,d*.06,.55);O('ink',(d*.06,.55,z+.004),(.055,.025,.012),'sunglass-lens')
 L('ink',[(-.02,.55,.147),(.02,.55,.147)],.005,'glasses-bridge');O('red',(0,.45,.165),(.055,.023,.012),'diva-lips')
 L('olive',[(.17,.36,0),(.25,.39,.04),(.25,.48,.12)],.03,'mirror-arm');L('pink',[(.25,.44,.12),(.25,.64,.12)],.012,'mirror-handle');O('grey',(.25,.65,.12),(.055,.075,.012),'hand-mirror')
 return 'Registered card image viewed: broad olive diva, pink feather boa, black sunglasses, red lips and mirror. Full closed body and boa backside reconstructed.'
def sw_doppelgangster():
 for k,d in enumerate([-1,1]):
  x=d*.14;dy=.035*k
  for dx in [-.04,.04]:sole(x+dx,color='ink',w=.032,length=.055)
  body=loft('violet',[(x,.05,0,.08,.06),(x,.20,0,.105,.075),(x,.37+dy,0,.085,.065),(x,.43+dy,0,.055,.045)],'individual-pinstripe-suit',18)
  head=loft('orange',[(x,.40+dy,0,.05,.04),(x,.46+dy,0,.085,.063),(x,.57+dy,0,.09,.07),(x,.63+dy,0,.06,.045)],'gangster-face',18)
  O('orange',(x+.01,.49+dy,.08),(.034,.045,.035),'long-gangster-nose');eyes_on(head,.565+dy,.033,.019,cx=x)
  for offset in [-.055,0,.055]:
   coords=[(x+offset*(1-.15*t/6),.12+(.22+dy)*t/6)for t in range(7)]
   L('paper',[(px,py,front_at(body,px,py)+.0015)for px,py in coords],.0025,'fine-suit-pinstripe')
  for dd in [-1,1]:L('violet',[(x+dd*.055,.40+dy,.04),(x+dd*.026,.33+dy,.075)],.011,'rolled-lapel')
  L('red',[(x,.39+dy,.069),(x,.26+dy,.078)],.011,'red-tie')
  loft('violet',[(x,.60+dy,0,.12,.09),(x,.63+dy,0,.12,.09),(x,.70+dy,0,.075,.055),(x,.73+dy,0,.065,.05)],'fedora',18)
  L('red',[(x-.07,.66+dy,.03),(x,.66+dy,.06),(x+.07,.66+dy,.03)],.008,'fedora-band')
  O('red',(x+d*.045,.34+dy,.07),(.016,.018,.007),'lapel-rose');L('violet',[(x+d*.07,.32,0),(x+d*.115,.23,.025)],.021,'outer-arm');O('orange',(x+d*.115,.22,.035),(.025,.028,.022),'hand')
 return 'Registered image viewed: two orange long-nosed gangsters in purple pinstripe suits/fedoras, red ties and roses. Separate staggered bodies, hands and full suit backs.'
def sw_gloth():
 for x in [-.08,.08]:sole(x,color='ink')
 loft('ink',[(0,.06,0,.16,.12),(0,.23,0,.19,.13),(0,.43,-.01,.14,.10),(0,.51,0,.095,.075)],'black-goth-robe',24)
 O('ink',(0,.64,-.035),(.18,.19,.13),'black-hair-volume');head=loft('paper',[(0,.49,.035,.065,.05),(0,.56,.04,.12,.09),(0,.68,.025,.13,.10),(0,.74,.015,.08,.06)],'pale-sloth-face',24)
 for d in [-1,1]:
  z=front_at(head,d*.045,.66);O('ink',(d*.045,.66,z+.003),(.045,.026,.008),'goth-eye-patch');eye(d*.045,.66,z+.011,.018)
  L('ink',[(d*.11,.44,0),(d*.22,.52,.015),(d*.22,.67,.05)],.027,'long-raised-arm')
  for i in range(3):L('violet',[(d*(.19+i*.026),.67,.06),(d*(.19+i*.026),.85,.05)],.010,'long-purple-claw',taper=[1,.1])
 O('violet',(0,.60,.14),(.025,.018,.012),'purple-nose');O('ink',(0,.55,.12),(.03,.012,.006),'goth-mouth')
 for d in [-1,1]:K('violet',(d*.07,.45,.10),.045,0,.095,'spiked-collar',rot=(0,0,d*.4))
 return 'Registered card viewed: pale gothic sloth/panda face, black hair and robe, purple nose/collar and very long raised purple claws. Body and hidden hair back rebuilt.'
def sw_hopfrog():
 h=loft('red',[(0,.07,0,.11,.09),(0,.20,0,.21,.13),(0,.35,0,.24,.15),(0,.43,0,.20,.12),(0,.47,0,.10,.07)],'broad-spring-frog',28)
 for d in [-1,1]:
  tower=O('red',(d*.14,.51,0),(.085,.145,.08),'eye-stalk');O('paper',(d*.14,.55,.07),(.060,.10,.022),'long-white-eye');O('ink',(d*.14,.56,.093),(.022,.065,.006),'pupil')
  L('red',[(d*.15,.19,0),(d*.25,.12,-.05),(d*.17,.035,.08)],.037,'folded-jump-leg')
  for dx in [-.045,0,.045]:L('red',[(d*.17,.025,.08),(d*.17+dx,0,.15)],.014,'webbed-toe',taper=[1,.1])
  L('red',[(d*.19,.31,0),(d*.28,.39,.02),(d*.24,.49,.09)],.024,'raised-frog-arm')
 L('ink',[(x,.29+abs(x)*.15,front_at(h,x,.29+abs(x)*.15)+.003)for x in [-.16,-.08,0,.08,.16]],.004,'wide-frog-smile')
 return 'Registered card viewed: red frog, broad grinning face, tall paired eye stalks and spring-like legs. Distinct full body and webbed extremities rebuilt.'
def sw_hotel():
 for x in [-.10,.10]:sole(x,color='brown',w=.06,length=.08)
 B('red',(0,.33,0),(.43,.45,.30),'hotel-walls');B('orange',(0,.60,0),(.47,.12,.35),'roof-eaves')
 vs=[(-.25,.60,-.18),(.25,.60,-.18),(.25,.60,.18),(-.25,.60,.18),(0,.79,-.18),(0,.79,.18)];m=bpy.data.meshes.new('hotel-roof');m.from_pydata(vs,[],[(0,1,2,3),(0,4,5,3),(4,1,2,5),(0,1,4),(3,5,2)]);m.update();o=bpy.data.objects.new('hotel-roof',m);scene.collection.objects.link(o);add(o,'red','pitched-roof')
 B('red',(.11,.78,-.08),(.075,.17,.075),'chimney')
 for x in [-.065,.065]:eye(x,.46,.158,.030)
 O('orange',(0,.385,.172),(.055,.045,.025),'hotel-nose');O('ink',(0,.27,.155),(.15,.055,.012),'hotel-grin')
 for x in [-.10,-.05,0,.05,.10]:B('paper',(x,.29,.17),(.042,.025,.012),'hotel-tooth')
 for d in [-1,1]:
  for y in [.23,.40]:B('aqua',(d*.22,y,-.04),(.014,.075,.08),'side-window')
 for x in [-.10,.10]:B('aqua',(x,.34,-.157),(.075,.10,.015),'rear-window')
 return 'Registered card viewed: red gable-roofed walking hotel, round nose, white grin and chimney. Real roof/wall volume, side/back windows and support feet rebuilt.'
BUILDERS.update({'blunderdog':sw_blunderdog,'cheatah':sw_cheatah,'critic':sw_critic,'diva':sw_diva,'doppelgangster':sw_doppelgangster,'gloth':sw_gloth,'hopfrog':sw_hopfrog,'hotel':sw_hotel})
def sw_icarus():
 for x in [-.09,.09]:sole(x,color='brown')
 loft('pink',[(0,.07,0,.14,.11),(0,.24,0,.18,.12),(0,.45,0,.14,.10),(0,.52,0,.09,.07)],'aviator-coat',24)
 h=loft('yellow',[(0,.47,0,.065,.05),(0,.54,0,.11,.085),(0,.65,0,.12,.09),(0,.71,-.01,.08,.065)],'aviator-head',20)
 for x in [-.045,.045]:
  z=front_at(h,x,.64);O('violet',(x,.64,z+.003),(.04,.043,.012),'goggle-rim');eye(x,.64,z+.014,.024)
 loft('pink',[(0,.67,0,.125,.10),(0,.73,-.01,.13,.11),(0,.80,-.015,.095,.08),(0,.82,-.02,.035,.04)],'leather-flight-helmet',20)
 for d in [-1,1]:
  # Green wings have ribbed, thick closed sections, not alpha cards.
  loft('green',[(d*.15,.20,-.10,.05,.035),(d*.23,.45,-.11,.095,.035),(d*.23,.72,-.09,.09,.04),(d*.20,.90,-.07,.05,.035),(d*.16,.96,-.05,.008,.01)],'green-wing',20)
  for j in range(3):L('olive',[(d*(.17+j*.035),.30,-.065),(d*(.18+j*.03),.72,-.045),(d*.18,.91,-.03)],.006,'wing-rib')
  L('pink',[(d*.11,.44,0),(d*.18,.35,.025),(d*.20,.42,.10)],.029,'aviator-sleeve');O('yellow',(d*.20,.42,.11),(.029,.032,.025),'pole-grip');L('brown',[(d*.20,.20,.11),(d*.20,.77,.10)],.008,'held-wing-pole')
 for y in [.24,.33,.42]:O('violet',(.035,y,.12),(.01,.01,.005),'coat-button')
 return 'Registered card viewed: yellow aviator in pink coat/helmet, large upright green ribbed wings and held wing poles. Complete back harness and volumetric wings reconstructed.'
def sw_kingtripper():
 for x in [-.09,.09]:sole(x,color='red')
 loft('violet',[(0,.07,0,.16,.11),(0,.24,0,.17,.12),(0,.44,0,.14,.10),(0,.51,0,.10,.07)],'royal-coat',24)
 head=loft('green',[(0,.47,0,.07,.055),(0,.55,0,.13,.09),(0,.67,0,.15,.11),(0,.73,-.01,.09,.07)],'lizard-king-head',24);sn=O('green',(.02,.58,.13),(.14,.055,.09),'royal-snout');head=union([head,sn],'lizard-royal-cheeks',.009,.35);eyes_on(head,.685,.05,.025)
 L('ink',[(x,.54,front_at(head,x,.54)+.002)for x in [-.10,-.05,0,.05,.10]],.004,'king-grin')
 for x in [-.06,-.02,.02,.06]:B('paper',(x,.545,front_at(head,x,.545)+.006),(.025,.018,.008),'royal-tooth')
 for d in [-1,1]:L('red',[(0,.735,0),(d*.12,.83,-.015),(d*.21,.78,.01)],.037,'jester-crown-point',taper=[1.2,1,.05]);O('yellow',(d*.21,.78,.01),(.027,.027,.027),'crown-bell')
 L('red',[(0,.73,0),(0,.88,-.01)],.037,'central-crown-point',taper=[1,.03]);O('yellow',(0,.88,-.01),.026,'top-bell')
 for d in [-1,1]:L('violet',[(d*.11,.43,0),(d*.19,.34,.025),(d*.21,.40,.11)],.032,'royal-sleeve');O('green',(d*.21,.40,.12),(.03,.032,.026),'hand')
 L('yellow',[(.23,.06,.12),(.23,.65,.12)],.012,'held-sceptre');O('red',(.23,.68,.12),(.04,.045,.04),'sceptre-jewel')
 return 'Registered card viewed: green grinning lizard king, red/yellow jester crown, purple coat and golden sceptre. Side/back coat and grasp reconstructed.'
def sw_saboteur():
 for x in [-.09,.09]:sole(x,color='ink')
 body=loft('paper',[(0,.07,0,.14,.10),(0,.22,0,.18,.12),(0,.42,0,.15,.10),(0,.50,0,.10,.07)],'striped-croc-shirt',24)
 for y in [.15,.23,.31,.39]:L('ink',[(x,y,front_at(body,x,y)+.002)for x in [-.11,-.055,0,.055,.11]],.015,'shirt-stripe')
 h=loft('green',[(0,.47,0,.07,.055),(0,.54,0,.14,.10),(0,.66,0,.16,.12),(0,.73,-.01,.095,.07)],'saboteur-head',24);sn=O('green',(.025,.585,.13),(.15,.055,.11),'large-croc-snout');h=union([h,sn],'croc-head-snout',.009,.35);eyes_on(h,.685,.05,.025)
 for x in [-.08,-.04,0,.04,.08]:O('paper',(x,.55,front_at(h,x,.55)+.005),(.013,.011,.006),'grin-tooth')
 O('ink',(-.02,.745,0),(.15,.035,.11),'small-beret')
 for d in [-1,1]:L('paper',[(d*.12,.43,0),(d*.20,.35,.025),(d*.22,.44,.11)],.033,'striped-sleeve');O('yellow',(d*.22,.45,.12),(.037,.045,.03),'yellow-glove')
 L('green',[(0,.19,-.08),(.11,.14,-.19),(.16,.22,-.17)],.027,'croc-tail',taper=[1.2,.8,.04])
 return 'Registered card viewed: green crocodile, black/white striped shirt, black beret and yellow gloves. Full tail, jaw and clothes reconstructed.'
def sw_magical():
 for x in [-.08,.08]:sole(x,color='brown')
 loft('blue',[(0,.07,0,.18,.13),(0,.24,0,.19,.13),(0,.44,0,.14,.10),(0,.52,0,.09,.07)],'star-wizard-robe',24)
 h=loft('orange',[(0,.47,0,.065,.05),(0,.55,0,.11,.085),(0,.65,0,.12,.09),(0,.72,-.01,.08,.06)],'wizard-athlete-head',20);O('orange',(.02,.59,.11),(.045,.035,.07),'wizard-nose');eyes_on(h,.665,.043,.023)
 loft('blue',[(0,.69,0,.17,.13),(0,.73,0,.18,.14),(-.02,.82,-.01,.12,.09),(-.05,.98,-.02,.07,.055),(-.03,1.06,-.015,.003,.003)],'tall-pointed-hat',20)
 for x,y,z,size in [(-.07,.30,.13,.045),(.07,.42,.10,.04),(.03,.80,.09,.035),(-.04,.93,.05,.025)]:star('yellow',(x,y,z),size,'gold-star')
 for d in [-1,1]:L('blue',[(d*.11,.44,0),(d*.20,.40,.025),(d*.22,.55,.10)],.034,'raised-robe-sleeve');O('orange',(d*.22,.56,.11),(.033,.035,.03),'hand')
 L('violet',[(-.23,.11,.12),(-.23,.91,.12)],.012,'held-wizard-staff')
 return 'Registered card viewed: orange wizard athlete, blue pointed hat and star-covered robe, violet staff. Tailored body/back and rigid grip reconstructed.'
def sw_mole():
 body=loft('orange',[(0,.04,0,.15,.12),(0,.16,0,.23,.17),(0,.36,0,.24,.18),(0,.54,0,.19,.145),(0,.66,-.01,.10,.08)],'shaggy-mole-body',28)
 for d in [-1,1]:
  O('pink',(d*.14,.06,.10),(.075,.055,.08),'digging-paw');eyes_on(body,.51,.06,.024) if d==-1 else None
  L('orange',[(d*.16,.36,0),(d*.23,.23,.04),(d*.17,.12,.10)],.038,'digging-arm')
  for j in range(4):L('brown',[(d*.06,.40,.16),(d*(.14+j*.025),.36+j*.02,.15),(d*(.20+j*.025),.29+j*.02,.12)],.004,'mole-whisker')
 O('pink',(0,.42,.19),(.045,.035,.025),'pink-mole-nose')
 for x in [-.023,.023]:B('paper',(x,.335,.18),(.036,.072,.023),'big-bucktooth')
 for x,z in [(-.11,-.11),(.10,-.12),(0,-.17)]:O('brown',(x,.36,z),(.04,.05,.023),'earth-clod')
 return 'Registered card viewed: shaggy orange mole, pink nose/paws, two buckteeth and long whiskers. Back dirt clods and real foreleg transitions reconstructed.'
def sw_diceguy():
 for x in [-.08,.08]:sole(x,color='blue')
 loft('blue',[(0,.07,0,.15,.11),(0,.23,0,.17,.12),(0,.43,0,.14,.10),(0,.50,0,.095,.07)],'dice-magician-suit',24)
 h=loft('olive',[(0,.47,0,.07,.055),(0,.54,0,.12,.09),(0,.65,0,.13,.10),(0,.72,-.01,.08,.06)],'olive-magician-face',20);eyes_on(h,.655,.047,.025);O('olive',(0,.59,.105),(.035,.03,.04),'round-nose')
 loft('violet',[(0,.695,0,.16,.12),(0,.73,0,.17,.13),(0,.84,0,.11,.09),(0,.87,0,.12,.095)],'dice-top-hat',20)
 for d in [-1,1]:O('red',(d*.034,.47,.085),(.035,.023,.012),'red-bow');L('blue',[(d*.11,.42,0),(d*.20,.37,.03),(d*.24,.50,.09)],.030,'juggling-sleeve');O('olive',(d*.24,.51,.10),(.032,.035,.027),'juggling-hand')
 for i,(x,y,z)in enumerate([(-.22,.63,.07),(.23,.68,.08),(-.18,.85,-.02),(.17,.91,-.02)]):
  B(['yellow','red','green','paper'][i],(x,y,z),(.074,.074,.074),'floating-die')
  for dx,dy in [(-.015,-.015),(.015,.015)]:O('ink',(x+dx,y+dy,z+.041),(.006,.006,.002),'floating-die-pip')
 return 'Registered card viewed: olive dice magician, purple top hat, blue suit/red bow and four floating coloured dice. Levitation is intentional static artwork; no game random logic is added.'
def sw_mush():
 parts=[O('aqua',(0,.26,0),(.24,.23,.18),'blob-core'),O('aqua',(-.15,.46,.01),(.13,.17,.12),'left-face-mass'),O('aqua',(.13,.42,.025),(.15,.16,.13),'right-face-mass'),O('aqua',(0,.38,-.13),(.14,.16,.12),'rear-face-mass')]
 body=union(parts,'continuous-multi-faced-mush',.01,.30)
 for cx,cy,gap,size in [(-.14,.49,.04,.025),(.12,.45,.045,.025),(0,.24,.045,.022)]:
  for d in [-1,1]:x=cx+d*gap;eye(x,cy,front_at(body,x,cy)+.002,size,pupilx=d*.004)
  mid=cy-(.055 if cx<0 else .09)
  if cx==0:O('ink',(cx,cy-.07,front_at(body,cx,cy-.07)+.003),(.018,.026,.005),'surprised-expression')
  else:L('ink',[(cx-.04,cy-.075,front_at(body,cx-.04,cy-.075)+.002),(cx,mid,front_at(body,cx,mid)+.002),(cx+.04,cy-.075,front_at(body,cx+.04,cy-.075)+.002)],.004,'individual-expression')
 # A fourth expression belongs to the back lobe, visible in reverse view.
 for x in [-.04,.04]:O('paper',(x,.41,-.238),(.025,.028,.009),'rear-eye');O('ink',(x,.41,-.247),(.008,.013,.004),'rear-pupil')
 return 'Registered card and registered four-expression interpretation: asymmetric blue multi-face blob. Unified connected body, independent front expressions and rear face volume rebuilt.'
def sw_nemesis():
 for x in [-.07,.07]:sole(x,color='paper',w=.05,length=.075)
 loft('paper',[(0,.07,0,.16,.11),(0,.23,0,.17,.12),(-.015,.42,0,.13,.095),(0,.55,0,.11,.08)],'draped-statue-body',24)
 head=loft('paper',[(0,.51,0,.055,.05),(0,.59,0,.10,.075),(0,.69,0,.10,.08),(0,.75,-.01,.065,.05)],'statue-face',20);eyes_on(head,.67,.035,.019);O('paper',(0,.625,.085),(.02,.028,.025),'classical-nose');O('ink',(0,.58,.083),(.021,.015,.004),'open-statue-mouth')
 for i in range(9):a=i*math.pi*2/9;L('paper',[(math.cos(a)*.10,.72+math.sin(a)*.05,-.025),(math.cos(a)*.13,.77+math.sin(a)*.04,-.02),(math.cos(a)*.11,.79+math.sin(a)*.04,-.01)],.018,'sculpted-hair-curl',taper=[1,1,.4])
 for x in [-.10,-.05,.02,.08]:L('grey',[(x,.15,.09),(x*.7,.30,.12),(x*.5,.45,.09)],.004,'front-drapery-fold');L('grey',[(x,.15,-.085),(x*.7,.30,-.11),(x*.5,.45,-.08)],.004,'rear-drapery-fold')
 for d in [-1,1]:L('paper',[(d*.09,.47,0),(d*.18,.40,.025),(d*.21,.48,.10)],.028,'statue-arm');O('paper',(d*.21,.49,.11),(.03,.032,.025),'statue-hand')
 L('grey',[(.23,.20,.11),(.23,.87,.11)],.013,'held-sword');L('grey',[(.18,.53,.11),(.28,.53,.11)],.012,'sword-guard')
 return 'Registered card viewed: pale classical statue, curled hair, folded toga, upright sword and open expression. Complete rear drapery and held blade reconstructed.'
BUILDERS.update({'icarus':sw_icarus,'kingtripper':sw_kingtripper,'le-saboteur':sw_saboteur,'magical-athlete':sw_magical,'mole':sw_mole,'mr-dice-guy':sw_diceguy,'mush':sw_mush,'nemesis':sw_nemesis})
def sw_nepobaby():
 for x in [-.085,.085]:sole(x,color='blue')
 loft('blue',[(0,.07,0,.15,.11),(0,.22,0,.19,.14),(0,.43,0,.16,.11),(0,.50,0,.10,.07)],'baby-formal-suit',24)
 h=loft('pink',[(0,.46,0,.08,.07),(0,.53,0,.17,.13),(0,.67,0,.18,.14),(0,.75,-.01,.12,.09)],'round-baby-head',24);eyes_on(h,.65,.06,.023)
 O('orange',(0,.55,.137),(.05,.035,.018),'orange-pacifier');L('blue',[(math.cos(i*math.pi/8)*.021,.55+math.sin(i*math.pi/8)*.021,.16)for i in range(17)],.006,'pacifier-ring')
 loft('blue',[(0,.72,0,.21,.16),(0,.76,0,.22,.17),(0,.97,0,.14,.11),(0,1.0,0,.15,.12)],'oversized-blue-top-hat',24)
 L('orange',[(-.14,.80,.05),(0,.80,.12),(.14,.80,.05)],.014,'hat-ribbon')
 for d in [-1,1]:L('blue',[(d*.12,.41,0),(d*.21,.33,.03),(d*.20,.38,.13)],.032,'suit-sleeve');O('pink',(d*.20,.38,.14),(.034,.034,.028),'hand');L('paper',[(d*.07,.49,.06),(d*.04,.42,.10)],.015,'lapel')
 L('orange',[(0,.47,.09),(0,.33,.125)],.016,'orange-tie');L('grey',[(.20,.38,.15),(.20,.60,.15)],.01,'held-rattle');O('grey',(.20,.63,.15),(.035,.045,.035),'rattle-head')
 return 'Registered Second Wind card viewed: round pink baby, oversized blue formal top hat/suit, orange pacifier/tie and silver rattle. Kept distinct from Leaf Nepo Baby.'
def sw_null():
 body=loft('dark',[(0,0,0,.13,.11),(0,.10,0,.20,.15),(0,.30,0,.22,.17),(0,.52,0,.19,.15),(0,.70,0,.12,.09),(0,.76,0,.005,.01)],'closed-void-volume',28)
 for x in [-.027,.027]:
  z=front_at(body,x,.43);O('paper',(x,.43,z+.002),(.012,.016,.005),'tiny-void-eye');O('dark',(x,.43,z+.007),(.006,.008,.002),'void-pupil')
 for x,y in [(-.09,.20),(.08,.27),(-.12,.50),(.06,.62),(.13,.40),(-.04,.64),(.02,.15),(-.15,.34)]:O('grey',(x,y,front_at(body,x,y)+.001),(.0025,.0025,.0015),'fixed-star-speck')
 return 'Registered card viewed: dark closed void with tiny paired eyes and subtle star-like surface specks. No invented humanoid limbs; all specks are fixed geometry, not random effects.'
def sw_overtaker():
 for x in [-.09,.09]:sole(x,color='brown')
 loft('brown',[(0,.07,0,.15,.11),(0,.24,0,.18,.12),(0,.44,0,.15,.105),(0,.51,0,.10,.07)],'gravedigger-coat',24)
 h=loft('aqua',[(0,.47,0,.075,.06),(0,.55,0,.13,.10),(0,.67,0,.14,.11),(0,.73,-.01,.09,.07)],'blue-gravedigger-head',24);sn=O('aqua',(.02,.59,.13),(.10,.045,.07),'blue-snout');h=union([h,sn],'gravedigger-face-snout',.009,.35);eyes_on(h,.68,.05,.025)
 loft('cream',[(0,.70,0,.15,.12),(0,.75,0,.15,.12),(0,.81,-.015,.10,.085),(0,.83,-.02,.04,.04)],'wrapped-cap',24)
 for y in [.735,.765]:L('brown',[(-.12,y,.035),(0,y,.12),(.12,y,.035)],.004,'cap-wrap-seam')
 for d in [-1,1]:L('brown',[(d*.11,.43,0),(d*.20,.36,.025),(d*.23,.46,.10)],.032,'coat-sleeve');O('aqua',(d*.23,.47,.11),(.03,.035,.026),'tool-hand')
 L('brown',[(.24,.04,.12),(.24,.83,.12)],.011,'held-shovel-shaft');B('grey',(.24,.085,.12),(.10,.14,.025),'shovel-blade')
 L('brown',[(-.24,.08,.12),(-.24,.78,.12)],.010,'held-skull-staff');O('paper',(-.24,.81,.12),(.05,.055,.035),'staff-skull')
 for x in [-.26,-.22]:O('ink',(x,.82,.15),(.010,.014,.004),'skull-eye')
 return 'Registered card viewed: blue gravedigger with cream wrapped cap, brown coat, shovel and skull-topped staff. Full grip, cap seams and tool depth reconstructed.'
def sw_partypooper():
 for x in [-.09,.09]:sole(x,color='pink')
 body=loft('pink',[(0,.07,0,.15,.11),(0,.23,0,.18,.12),(0,.43,0,.14,.10),(0,.50,0,.10,.07)],'striped-pajamas',24)
 for offset in [-.085,0,.085]:L('green',[(offset,y,front_at(body,offset,y)+.002)for y in [.13,.22,.31,.40]],.012,'pajama-stripe')
 h=loft('yellow',[(0,.47,0,.075,.06),(0,.55,0,.14,.105),(0,.68,0,.15,.11),(0,.75,-.01,.09,.07)],'grumpy-cat-head',24);sn=O('yellow',(0,.58,.12),(.10,.04,.065),'cat-muzzle');h=union([h,sn],'grumpy-cat-cheeks',.009,.35);eyes_on(h,.68,.05,.025)
 O('blue',(0,.61,.18),(.029,.024,.016),'blue-cat-nose');brow_on(h,-.05,.715,.03,'yellow',-.007);brow_on(h,.05,.715,.03,'yellow',.007)
 for d in [-1,1]:
  loft('yellow',[(d*.12,.68,0,.05,.03),(d*.16,.80,-.01,.035,.023),(d*.14,.85,-.02,.003,.003)],'pointed-cat-ear',12)
  L('pink',[(d*.11,.43,0),(d*.20,.34,.03),(d*.21,.44,.10)],.032,'pajama-arm');O('yellow',(d*.21,.45,.11),(.03,.033,.025),'hand')
 loft('green',[(0,.73,-.015,.14,.11),(0,.79,-.02,.13,.10),(.06,.87,-.04,.08,.06),(.14,.86,-.06,.045,.035),(.18,.77,-.08,.005,.01)],'drooping-nightcap',20)
 L('pink',[(-.11,.76,.04),(0,.755,.10),(.11,.76,.04)],.015,'nightcap-ribbon')
 L('paper',[(-.23,.28,.12),(-.23,.68,.12)],.018,'held-candle');O('orange',(-.23,.715,.12),(.018,.04,.018),'small-static-flame')
 return 'Registered card viewed: grumpy yellow cat in pink/green pajamas and drooping nightcap holding a tall candle. Static flame has no new gameplay or random effect.'
def sw_penguin():
 for x in [-.09,.09]:sole(x,color='orange',w=.065,length=.10)
 body=loft('violet',[(0,.05,0,.11,.09),(0,.18,0,.20,.15),(0,.40,0,.20,.15),(0,.57,-.01,.14,.11),(0,.68,-.01,.09,.07)],'penguin-body',28)
 O('paper',(0,.27,.10),(.145,.20,.045),'white-shirt-belly')
 for y in [.17,.25,.33]:O('ink',(.025,y,.15),(.009,.009,.004),'shirt-button')
 for d in [-1,1]:
  loft('violet',[(d*.13,.35,0,.055,.04),(d*.23,.50,-.005,.08,.04),(d*.27,.70,-.01,.055,.03),(d*.25,.82,-.02,.005,.008)],'upraised-flipper',20)
  eye(d*.042,.58,front_at(body,d*.042,.58)+.003,.023)
 O('orange',(0,.51,.13),(.095,.029,.075),'flat-penguin-beak')
 loft('brown',[(0,.65,-.01,.12,.095),(0,.68,-.01,.13,.10),(0,.73,-.015,.07,.055),(0,.75,-.015,.075,.06)],'little-brown-hat',16)
 return 'Registered card viewed: purple penguin, orange flat beak/feet, white buttoned belly and raised long flippers with small brown hat. Closed wing thickness and rear body rebuilt.'
def sw_rerunner():
 for x in [-.075,.075]:sole(x,color='yellow',w=.055,length=.09)
 loft('pink',[(0,.07,0,.12,.09),(0,.22,0,.15,.10),(0,.39,0,.13,.09),(0,.47,0,.09,.065)],'veteran-tracksuit',24)
 h=loft('orange',[(0,.44,0,.06,.05),(0,.52,0,.11,.08),(0,.64,0,.12,.09),(0,.71,-.01,.08,.06)],'veteran-runner-face',20);O('orange',(.015,.57,.105),(.042,.035,.055),'runner-nose');eyes_on(h,.64,.043,.022)
 loft('grey',[(0,.67,0,.12,.09),(0,.73,-.01,.13,.10),(0,.79,-.015,.08,.065)],'curly-grey-hair-cap',20)
 for x in [-.08,-.04,0,.04,.08]:L('paper',[(x,.72,.075),(x-.012,.76,.08),(x+.012,.78,.06)],.008,'hair-curl')
 L('violet',[(-.11,.69,.025),(0,.69,.10),(.11,.69,.025)],.013,'purple-sweatband')
 for d in [-1,1]:
  L('pink',[(d*.10,.39,0),(d*.20,.31,.025),(d*.17,.43,.13)],.029,'bent-running-arm');O('orange',(d*.17,.44,.14),(.03,.032,.026),'running-fist')
  L('yellow',[(d*.09,.13,.055),(d*.10,.35,.065)],.010,'yellow-tracksuit-stripe')
 return 'Registered card viewed: veteran runner with grey curly hair, purple sweatband, pink/yellow tracksuit and orange skin. One actual runner sculpt; illustrated motion echoes are not extra racers.'
def sw_showoff():
 for d in [-1,1]:
  B('pink',(d*.09,.055,.035),(.13,.075,.17),'roller-skate')
  for z in [-.015,.085]:O('green',(d*.09,.023,z),(.075,.023,.023),'green-skate-wheel')
 loft('violet',[(0,.10,0,.12,.09),(0,.24,0,.16,.11),(0,.43,0,.13,.095),(0,.50,0,.09,.07)],'elephant-body',24)
 head=loft('violet',[(0,.47,0,.07,.06),(0,.54,0,.12,.09),(0,.65,0,.13,.10),(0,.72,-.01,.085,.065)],'circus-elephant-head',24)
 for d in [-1,1]:O('violet',(d*.13,.60,0),(.09,.115,.033),'elephant-ear');L('violet',[(d*.11,.40,0),(d*.20,.32,.035),(d*.22,.40,.10)],.026,'elephant-arm')
 eyes_on(head,.64,.045,.024);L('violet',[(0,.58,.10),(0,.47,.16),(.04,.40,.19),(.10,.46,.19)],.031,'curled-trunk',taper=[1.1,1,.7,.4])
 loft('pink',[(0,.69,0,.14,.10),(0,.73,0,.15,.11),(0,.82,-.01,.085,.065),(0,.85,-.01,.09,.07)],'circus-top-hat',18)
 # Complete cyan chair behind, with actual legs/seat/back, not a background image.
 for x in [-.15,.15]:L('yellow',[(x,0,-.16),(x,.88,-.16)],.016,'chair-upright')
 B('aqua',(0,.75,-.17),(.29,.25,.035),'chair-back');B('aqua',(0,.21,-.15),(.30,.035,.17),'chair-seat')
 return 'Registered card viewed: violet circus elephant, pink skates/hat, green skate wheels and tall cyan/yellow chair. Full chair back/legs and elephant grip/body depth reconstructed.'
def sw_soulmate():
 for x in [-.085,.085]:sole(x,color='yellow')
 body=loft('yellow',[(0,.07,0,.13,.10),(0,.22,0,.17,.12),(0,.43,0,.15,.11),(0,.51,0,.10,.07)],'lovestruck-body',24)
 h=loft('yellow',[(0,.47,0,.08,.06),(0,.55,0,.15,.11),(0,.69,0,.17,.12),(0,.77,-.01,.11,.08)],'lovestruck-head',24)
 for d in [-1,1]:
  z=front_at(h,d*.067,.66);O('paper',(d*.067,.66,z+.004),(.058,.068,.018),'huge-love-eye')
  for dx in [-.010,.010]:O('red',(d*.067+dx,.67,z+.024),(.017,.018,.006),'heart-pupil-lobe')
  K('red',(d*.067,.648,z+.024),.022,0,.032,'heart-pupil-point',rot=(0,0,math.pi))
  L('yellow',[(d*.11,.41,0),(d*.20,.35,.025),(d*.18,.29,.12)],.03,'love-arm')
 O('pink',(0,.585,.14),(.05,.04,.04),'big-pink-nose');z=front_at(h,0,.53);O('ink',(0,.53,z+.008),(.075,.04,.012),'open-love-smile');O('pink',(.025,.51,z+.020),(.034,.012,.006),'smile-tongue')
 L('yellow',[(0,.19,-.09),(.13,.13,-.22),(.20,.25,-.20),(.13,.31,-.16)],.025,'long-curled-tail',taper=[1.2,1,.7,.04])
 return 'Registered card viewed: yellow lovestruck creature with very large heart pupils, pink nose, tongue smile and curled tail. Entire closed side/back and sculpted heart pupils reconstructed.'
BUILDERS.update({'nepo-baby':sw_nepobaby,'null':sw_null,'overtaker':sw_overtaker,'party-pooper':sw_partypooper,'penguin':sw_penguin,'re-runner':sw_rerunner,'show-off':sw_showoff,'soulmate':sw_soulmate})
def ruff(center=(0,.48,0),inner=.07,outer=.145):
 cx,cy,cz=center;count=48;vs=[]
 for layer in [-1,1]:
  for radius in [inner,outer]:
   for i in range(count):a=i*2*math.pi/count;vs.append((cx+math.cos(a)*radius,cy+layer*.009+math.sin(a*12)*.008,cz+math.sin(a)*radius*.65))
 fs=[]
 for i in range(count):
  j=(i+1)%count;fs.extend([(i,j,count+j,count+i),(2*count+i,3*count+i,3*count+j,2*count+j),(i,2*count+i,2*count+j,j),(count+i,count+j,3*count+j,3*count+i)])
 m=bpy.data.meshes.new('pleated-ruff');m.from_pydata(vs,[],fs);m.update();o=bpy.data.objects.new('pleated-ruff',m);scene.collection.objects.link(o);return add(o,'paper','continuous-pleated-ruff')
def sw_speed():
 # A complete motorcycle supports the seated rider; wheels are actual toroidal volumes.
 for z in [-.18,.18]:
  L('ink',[(0,.115+math.sin(i*math.pi/16)*.09,z+math.cos(i*math.pi/16)*.09)for i in range(33)],.024,'motorcycle-tire')
  for i in range(6):a=i*math.pi/3;L('grey',[(0,.115,z),(0,.115+math.sin(a)*.075,z+math.cos(a)*.075)],.006,'motorcycle-spoke')
 L('red',[(0,.12,-.18),(0,.25,-.06),(0,.22,.11),(0,.12,.18)],.025,'bike-frame');O('red',(0,.255,.035),(.075,.055,.12),'fuel-tank');O('ink',(0,.28,-.08),(.085,.025,.075),'bike-seat');O('yellow',(0,.28,.18),(.04,.04,.018),'headlamp')
 loft('blue',[(0,.29,-.04,.085,.065),(0,.42,-.035,.12,.08),(0,.54,-.025,.13,.085),(0,.59,-.015,.08,.055)],'biker-jacket',20)
 h=loft('olive',[(0,.56,-.01,.06,.05),(0,.63,0,.11,.085),(0,.74,0,.12,.09),(0,.80,-.01,.08,.06)],'demon-head',20);O('olive',(.02,.67,.11),(.06,.035,.07),'demon-snout');eyes_on(h,.735,.046,.023)
 for d in [-1,1]:
  L('olive',[(d*.08,.77,0),(d*.12,.88,-.02),(d*.08,.90,-.03)],.023,'demon-horn',taper=[1,.7,.03])
  L('blue',[(d*.1,.49,-.015),(d*.14,.40,.08),(d*.12,.40,.17)],.026,'handlebar-arm');O('olive',(d*.12,.40,.18),(.026,.027,.025),'handlebar-grip')
  L('blue',[(d*.065,.31,-.045),(d*.13,.21,-.01),(d*.12,.15,.07)],.031,'bent-rider-leg');O('ink',(d*.12,.14,.08),(.036,.03,.06),'rider-boot')
 L('grey',[(-.13,.40,.18),(.13,.40,.18)],.010,'held-handlebar')
 L('grey',[(0,.115,.18),(0,.27,.14),(0,.40,.18)],.014,'steering-stem')
 O('grey',(0,.28,.155),(.035,.035,.03),'headlamp-housing')
 L('grey',[(-.13,.11,.07),(.13,.11,.07)],.010,'rider-foot-pegs')
 for i in range(4):L('orange',[(0,.79,-.03),(.015*i,.79-i*.02,-.16),(.025*i,.72-i*.02,-.21)],.017,'streaming-hair',taper=[1,1,.03])
 return 'Registered card viewed: olive horned biker, blue jacket, streaming orange hair, complete red motorcycle and yellow headlamp. Seated legs, wheel spokes and rigid handlebar grip rebuilt.'
def sw_spoilsport():
 for x in [-.09,.09]:sole(x,color='pink')
 parts=[loft('pink',[(0,.07,0,.13,.10),(0,.24,0,.19,.13),(0,.44,0,.15,.11),(0,.53,0,.10,.07)],'pig-body',24),loft('pink',[(0,.48,0,.08,.06),(0,.55,0,.14,.10),(0,.68,0,.16,.12),(0,.76,-.01,.10,.075)],'pig-head',24)]
 h=union(parts,'continuous-sobbing-pig',.009,.30)
 eyes_on(h,.675,.052,.024);O('pink',(0,.59,.13),(.075,.055,.04),'large-pig-snout')
 for d in [-1,1]:
  O('ink',(d*.026,.59,.171),(.010,.018,.004),'nostril')
  loft('pink',[(d*.12,.68,0,.055,.03),(d*.19,.77,-.015,.045,.025),(d*.17,.83,-.02,.004,.004)],'pig-ear',12)
  coords=[(d*.078,y)for y in [.66,.61,.56,.50,.44,.38]];L('aqua',[(x,y,front_at(h,x,y)+.005)for x,y in coords],.010,'solid-tear-stream')
  L('pink',[(d*.12,.39,0),(d*.20,.30,.03),(d*.08,.24,.15)],.03,'sobbing-arm');O('pink',(d*.08,.24,.16),(.035,.033,.026),'hand')
  brow_on(h,d*.052,.715,.03,'pink',d*.006)
 L('pink',[(0,.22,-.10),(.08,.22,-.20),(.09,.30,-.20),(.03,.30,-.18)],.015,'curled-pig-tail')
 return 'Registered card viewed: pink sobbing pig, wide snout, upturned brows, curled tail and physical blue tears. Tears follow the actual sculpt surface, not particles or rule state.'
def foam_finger():
 pts=[(-.30,.40),(-.30,.62),(-.27,.65),(-.27,.82),(-.23,.82),(-.23,.61),(-.19,.66),(-.16,.64),(-.20,.56),(-.20,.40)];n=len(pts);vs=[(x,y,z)for z in [.09,.13]for x,y in pts];fs=[tuple(reversed(range(n))),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n)for i in range(n)];m=bpy.data.meshes.new('foam-finger');m.from_pydata(vs,[],fs);m.update();o=bpy.data.objects.new('foam-finger',m);scene.collection.objects.link(o);o=add(o,'orange','held-foam-finger');mod=o.modifiers.new('Soft foam edges','BEVEL');mod.width=.008;mod.segments=2
 return o
def sw_stepdad():
 for x in [-.09,.09]:sole(x,color='brown')
 h=loft('violet',[(0,.07,0,.14,.11),(0,.22,0,.20,.14),(0,.43,0,.18,.13),(0,.59,0,.17,.12),(0,.73,-.015,.10,.08)],'walrus-body-head',28)
 eyes_on(h,.625,.052,.023);O('violet',(0,.57,.13),(.042,.03,.04),'walrus-nose')
 for d in [-1,1]:
  L('brown',[(d*.015,.54,.15),(d*.07,.535,.16),(d*.13,.50,.13)],.022,'thick-moustache',taper=[1.2,1,.2]);L('paper',[(d*.055,.515,.155),(d*.065,.41,.16),(d*.045,.38,.15)],.016,'walrus-tusk',taper=[1,.8,.03])
  L('red',[(d*.08,.43,.105),(d*.10,.20,.125)],.018,'red-suspender');L('violet',[(d*.13,.39,0),(d*.22,.30,.03),(d*.23,.42,.10)],.03,'walrus-arm')
  O('yellow',(d*.035,.43,.13),(.034,.024,.012),'bow-tie')
 foam_finger();O('violet',(-.23,.41,.115),(.035,.035,.028),'foam-grip')
 return 'Registered card viewed: violet walrus, brown moustache, white tusks, red suspenders, bow tie and orange foam finger. Foam prop has genuine thickness and a connected grip.'
def sw_streaker():
 for x in [-.07,.07]:sole(x,color='cream',w=.045,length=.08)
 h=loft('cream',[(0,.06,0,.10,.08),(0,.25,0,.16,.11),(0,.48,0,.14,.10),(0,.72,-.015,.10,.08),(0,.91,-.02,.045,.045),(.015,1.0,-.02,.003,.004)],'elongated-pointed-streaker',28)
 eyes_on(h,.64,.04,.024);nose=L('cream',[(0,.60,.09),(0,.48,.16),(.035,.43,.17)],.032,'long-hanging-nose',taper=[.7,1.1,.6])
 for d in [-1,1]:L('cream',[(d*.11,.48,0),(d*.19,.30,.02),(d*.18,.12,.07)],.026,'long-hanging-arm',taper=[1.2,.9,.7]);O('cream',(d*.18,.11,.08),(.03,.035,.023),'hand')
 L('cream',[(0,.22,-.08),(-.10,.14,-.20),(-.20,.21,-.22)],.034,'swept-back-tail',taper=[1.4,.9,.03])
 return 'Registered card viewed: pale elongated pointed creature, long nose, hanging arms, narrow feet and swept tail. No invented clothing; full side/back volume reconstructed.'
def sw_stunner():
 parts=[]
 for i in range(5):a=i*math.pi*2/5;parts.append(O('orange',(math.cos(a)*.065,.32,math.sin(a)*.055),(.11,.26,.11),'pepper-lobe'))
 body=union(parts,'five-lobed-pepper',.008,.32)
 for x in [-.085,.085]:sole(x,color='pink',w=.05,length=.07)
 eyes_on(body,.43,.052,.025)
 for d in [-1,1]:
  for i in range(3):x=d*.052+d*(i-1)*.012;L('ink',[(x,.452,front_at(body,x,.452)+.01),(x+d*.006,.48,front_at(body,x,.452)+.014)],.003,'pepper-eyelash')
 O('red',(0,.32,front_at(body,0,.32)+.005),(.04,.018,.01),'red-pepper-lips');L('brown',[(0,.56,0),(.025,.70,-.02),(.10,.69,-.025)],.027,'bent-brown-stalk',taper=[1,1,.7])
 L('orange',[(.13,.28,0),(.21,.35,.025),(.16,.40,.12)],.023,'coy-pepper-arm');O('orange',(.16,.40,.13),(.025,.03,.022),'coy-hand')
 return 'Registered card viewed: five-lobed orange bell pepper, bent brown stalk, eyelashes, red lips and pink feet. Lobes are fused into one organic sculpture, not stacked spheres.'
def sw_switcharoo():
 for d in [-1,1]:
  O('yellow',(d*.11,.045,.08),(.065,.045,.145),'long-kangaroo-foot');L('yellow',[(d*.10,.28,-.015),(d*.17,.15,-.01),(d*.11,.055,.07)],.045,'powerful-hind-leg')
 body=loft('yellow',[(0,.12,0,.11,.09),(0,.29,0,.16,.12),(0,.44,0,.13,.10),(0,.52,0,.08,.06)],'kangaroo-torso',24)
 O('cream',(0,.30,.105),(.085,.10,.025),'cream-pouch')
 h=loft('yellow',[(0,.48,0,.065,.05),(0,.56,0,.11,.08),(0,.67,0,.12,.09),(0,.73,-.01,.075,.06)],'kangaroo-head',24);sn=O('yellow',(0,.59,.11),(.09,.04,.07),'symmetric-kangaroo-muzzle');h=union([h,sn],'kangaroo-cheeks-snout',.009,.35)
 mid=(min(v.co.x for v in h.data.vertices)+max(v.co.x for v in h.data.vertices))/2
 for v in h.data.vertices:v.co.x-=mid
 for x in [-.025,.025]:O('brown',(x,.60,front_at(h,x,.60)+.002),(.006,.007,.003),'symmetric-nostril')
 L('brown',[(x,y,front_at(h,x,y)+.003)for x,y in [(-.04,.57),(0,.56),(.04,.57)]],.003,'symmetric-kangaroo-smile')
 for d in [-1,1]:
  loft('yellow',[(d*.065,.70,0,.04,.03),(d*.10,.84,-.01,.05,.027),(d*.14,.97,-.025,.025,.018),(d*.15,1.0,-.03,.003,.003)],'long-kangaroo-ear',16)
  z=front_at(h,d*.046,.66);O('pink',(d*.046,.66,z+.003),(.042,.046,.012),'pink-spectacle-rim');eye(d*.046,.66,z+.015,.025)
  L('yellow',[(d*.095,.43,0),(d*.15,.36,.035),(d*.11,.34,.12)],.025,'tucked-forearm')
 L('pink',[(-.015,.66,.113),(.015,.66,.113)],.005,'glasses-bridge');L('yellow',[(0,.23,-.075),(.12,.10,-.18),(.23,.15,-.18),(.24,.28,-.12)],.038,'long-balanced-tail',taper=[1.6,1.1,.7,.04])
 return 'Registered card viewed: yellow kangaroo with very long ears, feet and tail, pink round glasses, cream pouch and tucked forearms. Symmetric muzzle and surface-seated eyes rebuilt.'
def sw_tail():
 body=L('green',[(-.22,.08,-.02),(-.08,.14,0),(.06,.30,0),(.12,.49,0),(.10,.63,0)],.09,'standalone-dinosaur-tail',taper=[.3,1.8,1.5,1,.55])
 for x,y in [(-.10,.25),(0,.40),(.075,.54)]:K('olive',(x,y,-.055),.055,0,.12,'tail-spike',rot=(.35,0,-.3))
 for x in [.075,.115]:eye(x,.60,front_at(body,x,.60)+.002,.023)
 for x in [-.04,.08]:O('red',(x,.03,.06),(.045,.03,.055),'tiny-tail-foot')
 return 'Registered card viewed: standalone green dinosaur tail, olive triangular back spines and top-mounted eyes. No added torso/head/person; complete curled underside rebuilt.'
def sw_hose():
 for i,cx in enumerate([-.13,0,.13]):
  L('green',[(cx+math.cos(j*math.pi/16)*.115,.22+i*.035+math.sin(j*math.pi/16)*.19,-.04+i*.025)for j in range(33)],.026,'open-garden-hose-loop')
 L('green',[(.20,.23,0),(.22,.43,0),(.19,.64,.01),(.13,.72,.04)],.033,'eyed-hose-neck')
 host=O('green',(.13,.69,.04),(.065,.042,.033),'hose-eye-saddle')
 for x in [.10,.16]:eye(x,.69,front_at(host,x,.69)+.002,.022)
 K('yellow',(.13,.65,.10),.04,.04,.10,'brass-nozzle',rot=(math.pi/2,0,0))
 for dx,dy in [(-.014,0),(.014,0),(0,.018),(0,-.018)]:O('ink',(.13+dx,.65+dy,.154),(.005,.005,.002),'nozzle-hole')
 L('green',[(-.22,.19,-.035),(-.27,.08,.01),(-.20,.025,.06)],.026,'hose-tail')
 return 'Registered card viewed: three open green garden-hose coils, eyed upright neck and brass nozzle. No opaque spray cone; true tube volume and actual nozzle holes represented.'
def sw_understudy():
 for x in [-.08,.08]:sole(x,color='violet')
 loft('yellow',[(0,.07,0,.14,.10),(0,.24,0,.17,.12),(0,.42,0,.14,.10),(0,.50,0,.09,.07)],'elizabethan-tunic',24)
 h=loft('violet',[(0,.48,0,.065,.05),(0,.55,0,.12,.09),(0,.66,0,.13,.10),(0,.73,-.01,.085,.065)],'actor-head',24);sn=O('violet',(.02,.585,.13),(.075,.04,.08),'long-actor-nose');h=union([h,sn],'actor-head-nose',.009,.35);eyes_on(h,.675,.048,.023)
 ruff((0,.49,0),.07,.145)
 loft('green',[(0,.70,0,.16,.12),(0,.74,0,.17,.13),(-.02,.82,-.01,.11,.085),(-.06,.85,-.02,.055,.05)],'actor-cap',20)
 L('orange',[(.08,.77,-.02),(.15,.92,-.035),(.06,.96,-.04)],.018,'long-hat-feather',taper=[1,1.4,.03])
 for d in [-1,1]:L('yellow',[(d*.11,.42,0),(d*.20,.34,.025),(d*.21,.43,.11)],.030,'actor-sleeve');O('violet',(d*.21,.44,.12),(.03,.033,.026),'script-hand')
 B('paper',(-.22,.49,.15),(.12,.21,.02),'held-script')
 for y in [.44,.48,.52,.56]:L('ink',[(-.26,y,.164),(-.18,y,.164)],.0025,'script-line')
 return 'Registered card viewed: purple long-nosed actor, yellow Elizabethan tunic, white pleated ruff, green feathered cap and script. Ruff is a closed pleated surface, not loose beads.'
BUILDERS.update({'speed-demon':sw_speed,'spoilsport':sw_spoilsport,'stepdad':sw_stepdad,'streaker':sw_streaker,'stunner':sw_stunner,'switcharoo':sw_switcharoo,'tail':sw_tail,'the-hose':sw_hose,'understudy':sw_understudy})
