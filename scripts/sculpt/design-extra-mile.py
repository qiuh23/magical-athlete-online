# Extra Mile: authored from the actually viewed ExtraMile.pdf card fronts.
def extruded_outline(color,points,depth,tag,z=0):
 n=len(points);vs=[(x,y,z+side*depth/2)for side in [-1,1]for x,y in points];fs=[tuple(reversed(range(n))),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n)for i in range(n)];m=bpy.data.meshes.new(tag);m.from_pydata(vs,[],fs);m.update();o=bpy.data.objects.new(tag,m);scene.collection.objects.link(o);o=add(o,color,tag);mod=o.modifiers.new('Soft sculpt edge','BEVEL');mod.width=.006;mod.segments=2;return o
def em_clock():
 for x in [-.09,.09]:sole(x,color='brown');L('brown',[(x,.05,0),(x,.19,0)],.027,'clock-leg')
 pts=[]
 for i in range(48):a=i*2*math.pi/48;r=.235*(.78 if .45<a<1.0 else 1);pts.append((math.cos(a)*r,.43+math.sin(a)*r))
 extruded_outline('yellow',pts,.12,'broken-clock-body')
 for i in range(12):a=i*math.pi/6;L('brown',[(math.cos(a)*.19,.43+math.sin(a)*.19,.067),(math.cos(a)*.21,.43+math.sin(a)*.21,.067)],.005,'dial-mark')
 for x in [-.06,.06]:eye(x,.49,.067,.029,pupilx=.005)
 L('ink',[(0,.40,.069),(.055,.51,.069)],.009,'clock-hand');L('ink',[(0,.40,.07),(-.08,.36,.07)],.009,'clock-hand')
 for d in [-1,1]:L('ink',[(d*.015,.39,.078),(d*.065,.405,.08),(d*.10,.375,.075)],.013,'clock-moustache',taper=[1,1,.1])
 loft('ink',[(-.08,.64,0,.13,.095),(-.08,.67,0,.14,.10),(-.08,.74,-.005,.09,.065),(-.08,.76,-.005,.055,.04)],'black-bowler',20)
 return 'ExtraMile.pdf viewed: cracked gold clock, black bowler, moustache, dial and brown feet. Not a person with a clock texture; the notched clock is the thick 3D body.'
def em_cletus():
 for x in [-.09,.09]:sole(x,color='brown');loft('blue',[(x,.04,0,.05,.055),(x,.23,0,.055,.06)],'hunter-trouser',16)
 loft('red',[(0,.19,0,.15,.10),(0,.34,0,.17,.12),(0,.49,0,.13,.09),(0,.53,0,.09,.06)],'hunter-shirt',24)
 h=loft('pink',[(0,.49,0,.065,.05),(0,.56,0,.12,.09),(0,.67,0,.13,.10),(0,.73,-.01,.08,.065)],'pink-hunter-head',24);O('pink',(0,.60,.11),(.045,.035,.05),'hunter-nose');eyes_on(h,.665,.048,.021)
 for d in [-1,1]:L('ink',[(d*.01,.56,.113),(d*.05,.575,.125),(d*.08,.55,.11)],.012,'hunter-moustache',taper=[1,1,.2]);L('red',[(d*.11,.45,0),(d*.19,.37,.025),(d*.14,.44 if d>0 else .36,.14)],.032,'hunter-sleeve');O('pink',(d*.14,.44 if d>0 else .36,.15),(.033,.034,.027),'rifle-grip')
 loft('brown',[(0,.70,0,.17,.13),(0,.74,0,.18,.14),(-.025,.92,-.01,.11,.09),(-.035,1.0,-.015,.07,.065)],'tall-hunter-hat',22)
 B('brown',(-.13,.30,.15),(.17,.075,.045),'held-toy-rifle-stock',rot=(0,0,.25))
 for z in [.14,.18]:L('grey',[(-.06,.34,z),(.25,.50,z)],.009,'held-toy-double-barrel')
 return 'ExtraMile.pdf viewed: pink cartoon hunter, tall brown hat, red shirt, blue trousers and stylized double-barrel toy rifle. Prop is nonfunctional, simplified and held in both hands.'
def em_paradox():
 for x in [-.07,.07]:sole(x,color='brown')
 loft('paper',[(0,.08,.025,.13,.09),(0,.22,.025,.15,.10),(0,.41,.025,.12,.09),(0,.49,.02,.08,.06)],'scientist-coat',22)
 h=loft('aqua',[(0,.46,.02,.065,.05),(0,.54,.025,.11,.08),(0,.65,.015,.12,.09),(0,.72,0,.08,.06)],'time-scientist-head',22);O('aqua',(.02,.585,.12),(.04,.035,.055),'scientist-nose');eyes_on(h,.65,.043,.021)
 for x in [-.043,.043]:
  z=front_at(h,x,.65)+.009;L('ink',[(x+math.cos(i*math.pi/8)*.032,.65+math.sin(i*math.pi/8)*.035,z)for i in range(17)],.005,'scientist-spectacle')
 for i in range(6):L('paper',[(-.08+i*.03,.71,-.015),(-.13+i*.035,.84,-.03),(-.04+i*.025,.80,-.025)],.024,'swept-white-hair',taper=[1,1.1,.1])
 L('green',[(math.cos(i*math.pi/24)*.23,.43+math.sin(i*math.pi/24)*.42,-.07)for i in range(49)],.032,'upright-portal-rim')
 for d in [-1,1]:L('paper',[(d*.10,.41,.025),(d*.18,.32,.06),(d*.17,.39,.14)],.027,'coat-sleeve');O('aqua',(d*.17,.39,.15),(.029,.03,.025),'hand')
 B('brown',(.16,.42,.18),(.10,.17,.035),'held-time-notebook')
 return 'ExtraMile.pdf viewed: blue scientist with swept white hair/glasses emerging through an upright green portal. Portal has a real open hole and thick 3D rim, not a billboard.'
def em_doctordice():
 for d in [-1,1]:sole(d*.10,color='blue',w=.055,length=.08);L('blue',[(d*.1,.06,0),(d*.09,.22,0)],.027,'doctor-leg')
 B('paper',(0,.42,0),(.36,.39,.27),'die-doctor-body')
 for x,y in [(-.13,.56),(.13,.56),(-.13,.29),(.13,.29)]:O('ink',(x,y,.142),(.025,.025,.006),'die-pip')
 for x in [-.06,.06]:eye(x,.44,.145,.027)
 L('ink',[(-.06,.36,.143),(0,.345,.145),(.06,.36,.143)],.004,'doctor-smile')
 for d in [-1,1]:L('blue',[(d*.17,.46,0),(d*.24,.36,.025),(d*.25,.44,.11)],.025,'doctor-arm');O('paper',(d*.25,.45,.12),(.031,.035,.025),'doctor-glove')
 L('grey',[(-.12,.55,.14),(-.15,.40,.16),(-.09,.27,.16),(0,.29,.16)],.008,'stethoscope-tube');O('grey',(0,.29,.164),(.028,.028,.008),'stethoscope-bell')
 L('grey',[(-.14,.62,0),(.14,.62,0)],.012,'head-mirror-band');O('grey',(.07,.70,.045),(.065,.075,.012),'doctor-head-mirror')
 return 'ExtraMile.pdf viewed: white die doctor, black pips, blue limbs, silver head mirror and stethoscope. Distinct hard body and softly bevelled corners; pips are not extra eyes.'
def em_domgary():
 for x in [-.15,-.05]:sole(x,color='orange',w=.044,length=.07)
 loft('orange',[(-.1,.07,0,.09,.07),(-.1,.23,0,.13,.09),(-.1,.40,0,.11,.08),(-.1,.46,0,.075,.06)],'dom-cat-body',22)
 h=loft('orange',[(-.1,.43,0,.065,.05),(-.1,.51,0,.12,.085),(-.1,.63,0,.13,.095),(-.1,.70,-.01,.08,.065)],'dom-cat-head',22)
 for d in [-1,1]:
  loft('orange',[(-.1+d*.09,.64,0,.045,.03),(-.1+d*.14,.77,-.01,.005,.004)],'dom-ear',12);eye(-.1+d*.044,.61,front_at(h,-.1+d*.044,.61)+.002,.025)
 O('cream',(-.1,.545,.082),(.075,.035,.03),'cat-muzzle');O('ink',(-.1,.57,.11),(.023,.018,.009),'cat-nose')
 L('orange',[(-.1,.17,-.07),(-.22,.20,-.17),(-.24,.39,-.14)],.023,'cat-curled-tail',taper=[1.1,1,.05])
 L('orange',[(0,.36,0),(.10,.43,.04),(.18,.45,.075)],.032,'mouse-holding-arm');O('orange',(.18,.45,.075),(.04,.033,.03),'cat-holding-paw')
 # Gary is a separate complete mouse held in the cat's paw, not a stray floating mesh.
 loft('grey',[(.19,.27,.08,.035,.028),(.19,.39,.08,.055,.04),(.19,.48,.08,.04,.03)],'gary-mouse-body',16);mh=O('grey',(.19,.54,.08),(.065,.065,.047),'gary-head')
 for d in [-1,1]:
  O('grey',(.19+d*.055,.585,.07),(.04,.04,.016),'mouse-ear');eye(.19+d*.025,.55,.125,.016)
  L('grey',[(.19+d*.04,.43,.08),(.19+d*.10,.50,.09)],.012,'mouse-raised-arm');L('grey',[(.19+d*.02,.29,.08),(.19+d*.04,.22,.10)],.013,'mouse-leg')
 L('grey',[(.19,.31,.045),(.28,.32,.01),(.29,.44,.015)],.008,'mouse-tail',taper=[1,.7,.05])
 return 'ExtraMile.pdf viewed: Dom orange cat and Gary small grey mouse. Both have full independent heads, bodies, limbs and tails; Gary is intentionally held by the cat, not an omitted companion.'
def em_echo():
 L('brown',[(.23,0,-.02),(.23,.87,-.02)],.035,'tree-trunk');L('brown',[(-.23,.81,-.02),(.25,.81,-.02)],.025,'hanging-branch')
 body=loft('ink',[(0,.25,0,.065,.05),(0,.39,0,.13,.08),(0,.61,0,.10,.065),(0,.74,0,.035,.027)],'folded-bat-body',24)
 h=O('ink',(0,.27,.02),(.09,.075,.065),'inverted-bat-head')
 for d in [-1,1]:
  loft('ink',[(d*.055,.25,.01,.035,.025),(d*.075,.14,.015,.005,.005)],'downward-bat-ear',12)
  eye(d*.032,.265,.08,.019);L('grey',[(d*.025,.72,-.01),(d*.025,.82,-.01),(d*.045,.83,-.035)],.010,'hanging-claw')
  L('grey',[(d*.035,.34,.055),(d*.095,.49,.065),(d*.045,.67,.035)],.004,'folded-wing-seam')
 O('pink',(0,.302,.082),(.016,.012,.006),'upside-down-nose')
 return 'ExtraMile.pdf viewed: dark bat hanging upside down from a brown branch/tree, folded wings and downward ears. Branch/tree are true support volumes, not a background card.'
def em_gingy():
 parts=[loft('orange',[(0,.11,0,.12,.06),(0,.27,0,.15,.07),(0,.40,0,.12,.065),(0,.45,0,.08,.05)],'cookie-torso',22),O('orange',(0,.59,0),(.16,.17,.07),'cookie-head')]
 for d in [-1,1]:
  parts.append(L('orange',[(d*.10,.36,0),(d*.21,.42,.01)],.044,'cookie-arm'));parts.append(L('orange',[(d*.08,.16,0),(d*.13,.04,.02)],.045,'cookie-leg'))
 body=union(parts,'solid-gingerbread-person',.009,.30)
 for x,y in [(-.13,.73),(-.16,.68),(-.17,.62)]:
  cut=O('orange',(x,y,0),(.05,.045,.12),'bite-cutter');bpy.context.view_layer.objects.active=body;mod=body.modifiers.new('Cookie bite','BOOLEAN');mod.object=cut;mod.operation='DIFFERENCE';mod.solver='EXACT';bpy.ops.object.modifier_apply(modifier=mod.name);bpy.data.objects.remove(cut,do_unlink=True)
 eyes_on(body,.61,.055,.025);O('red',(0,.535,front_at(body,0,.535)+.005),(.045,.025,.009),'cookie-mouth')
 for d in [-1,1]:O('blue',(d*.031,.405,.073),(.032,.024,.012),'blue-bow')
 for y in [.31,.235]:O('blue',(0,y,.075),(.018,.022,.009),'blue-button')
 L('paper',[(-.11,.18,.047),(0,.165,.075),(.11,.18,.047)],.008,'white-waist-icing')
 O('orange',(.22,.42,.055),(.034,.033,.03),'cookie-cane-grip')
 L('paper',[(.23,.14,.07),(.23,.62,.07),(.22,.71,.07),(.17,.74,.07),(.13,.69,.07)],.017,'held-candy-cane')
 for y in [.22,.32,.42,.52,.62]:K('red',(.23,y,.07),.018,.018,.022,'held-candy-stripe')
 return 'ExtraMile.pdf viewed: bitten gingerbread head/body, white icing, blue bow/buttons and striped candy cane. Cookie is a thick unified sculpture with real bitten edge, not a painted card.'
def em_gluebert():
 body=loft('paper',[(0,.15,0,.12,.07),(0,.23,0,.16,.085),(0,.49,0,.16,.085),(0,.57,0,.11,.065),(0,.60,0,.07,.05)],'rounded-glue-bottle',24)
 B('blue',(0,.37,.082),(.26,.28,.016),'blue-label-border');B('orange',(0,.37,.096),(.22,.24,.013),'orange-glue-label')
 for x in [-.05,.05]:eye(x,.41,.11,.023)
 L('ink',[(-.04,.33,.112),(0,.315,.113),(.04,.33,.112)],.004,'glue-label-smile')
 K('orange',(0,.63,0),.075,.065,.07,'ribbed-cap');K('orange',(0,.73,0),.045,.012,.14,'glue-nozzle')
 for d in [-1,1]:
  L('paper',[(d*.10,.20,0),(d*.12,.08,.02),(d*.18,.015,.08)],.032,'flowing-glue-leg');O('paper',(d*.17,.015,.08),(.075,.015,.055),'glue-puddle-foot')
  L('paper',[(d*.14,.38,0),(d*.23,.30,.035),(d*.19,.26,.08)],.022,'flowing-glue-arm')
 return 'ExtraMile.pdf viewed: white glue bottle, orange nozzle and orange/blue face label, flowing white glue limbs. Entire bottle/limbs have volume and the puddle forms the character, not a game base.'
BUILDERS.update({'extra-mile-broken-clock':em_clock,'extra-mile-cletus':em_cletus,'extra-mile-doc-paradox':em_paradox,'extra-mile-doctor-dice':em_doctordice,'extra-mile-dom-and-gary':em_domgary,'extra-mile-echo':em_echo,'extra-mile-gingy':em_gingy,'extra-mile-gluebert':em_gluebert})
def em_heads():
 # Coin lies horizontally, while the eyes rise from its rim, as on the card.
 K('orange',(0,.37,0),.23,.23,.05,'coin-body')
 L('yellow',[(math.cos(i*math.pi/24)*.22,.399,math.sin(i*math.pi/24)*.22)for i in range(49)],.009,'coin-rim')
 for d in [-1,1]:
  L('paper',[(d*.12,.35,0),(d*.13,.08,.015)],.017,'coin-leg');sole(d*.13,color='paper',w=.045,length=.075)
  O('paper',(d*.075,.49,-.01),(.055,.12,.025),'raised-coin-eye');O('ink',(d*.075,.50,.016),(.018,.045,.008),'coin-pupil')
  L('paper',[(d*.20,.37,0),(d*.27,.40,.02),(d*.26,.53,.025)],.013,'coin-arm');O('paper',(d*.26,.54,.025),(.03,.035,.02),'coin-glove')
 # Engraved-looking relief portrait is attached to the top, not a texture billboard.
 O('brown',(0,.403,.015),(.07,.007,.085),'coin-relief-head');L('brown',[(-.10,.405,.10),(0,.405,.13),(.10,.405,.1)],.008,'coin-relief-shoulder')
 return 'ExtraMile.pdf viewed: horizontal copper coin with tall eyes, white limbs and embossed face. Coin rim and relief remain thick editable geometry; no floating tossed coin included.'
def em_honey():
 pot=loft('blue',[(0,.02,0,.12,.1),(0,.08,0,.20,.14),(0,.24,0,.20,.14),(0,.29,0,.17,.12)],'blue-honey-pot',28)
 L('yellow',[(math.cos(i*math.pi/20)*.18,.29,math.sin(i*math.pi/20)*.13)for i in range(41)],.024,'honey-rim')
 for x,y in [(-.13,.14),(-.04,.21),(.06,.16),(.14,.22)]:L('yellow',[(x,.29,.12),(x+.01,y,.135)],.018,'thick-honey-drip',taper=[1.2,.7])
 h=loft('yellow',[(0,.26,0,.07,.06),(-.02,.36,0,.12,.09),(0,.49,0,.11,.085),(0,.59,0,.08,.065),(0,.65,0,.035,.03)],'bee-body',24)
 for y,w in [(.34,.11),(.43,.12),(.52,.095)]:L('ink',[(-w,y,.035),(0,y-.012,front_at(h,0,y)+.006),(w,y,.035)],.016,'bee-stripe')
 eyes_on(h,.59,.041,.025);O('ink',(.035,.55,.09),(.05,.02,.035),'bee-muzzle');B('paper',(.015,.51,.105),(.025,.04,.014),'bee-tooth')
 for d in [-1,1]:
  O('paper',(d*.12,.49,-.075),(.085,.14,.018),'bee-wing');L('grey',[(d*.08,.40,-.095),(d*.13,.53,-.095),(d*.13,.59,-.09)],.004,'wing-vein')
  L('ink',[(d*.035,.64,0),(d*.06,.74,0),(d*.09,.76,.01)],.005,'bee-antenna')
 L('brown',[(.11,.26,.16),(.20,.62,.13)],.012,'held-honey-dipper');O('yellow',(.15,.40,.15),(.035,.04,.026),'dipper-grip')
 for y in [.27,.30,.33]:K('yellow',(.12,y,.16),.036,.036,.018,'held-dipper-ridge')
 return 'ExtraMile.pdf viewed: yellow/black bee emerging from blue honey pot, white wings, antennae and held honey dipper. Honey drips are modeled onto the pot; pot belongs to the character, not a player base.'
def em_kingpete():
 for x in [-.07,.07]:sole(x,color='ink');loft('violet',[(x,.035,0,.045,.05),(x,.23,0,.05,.055)],'royal-trouser',16)
 loft('red',[(0,.20,0,.13,.08),(0,.39,0,.13,.09),(0,.47,0,.09,.06)],'red-sports-jersey',22)
 h=loft('aqua',[(0,.43,0,.055,.05),(0,.50,0,.09,.07),(0,.62,0,.095,.075),(0,.68,-.01,.06,.05)],'king-pete-face',24);eyes_on(h,.60,.033,.02);O('aqua',(.025,.55,.085),(.035,.03,.04),'royal-nose')
 for x in [-.07,-.025,.025,.07]:L('brown',[(x,.67,0),(x-.025,.70,.03),(x-.06,.64,.055)],.018,'messy-brown-hair',taper=[1,1,.1])
 K('yellow',(0,.72,0),.105,.11,.07,'crown-band')
 for i in range(7):a=i*2*math.pi/7;loft('yellow',[(math.cos(a)*.09,.74,math.sin(a)*.075,.025,.022),(math.cos(a)*.13,.92,math.sin(a)*.10,.003,.003)],'tall-crown-point',10);O('yellow',(math.cos(a)*.13,.92,math.sin(a)*.10),(.014,.014,.014),'crown-tip')
 for d in [-1,1]:L('aqua',[(d*.10,.40,0),(d*.17,.31,.03),(d*.15,.45,.075)],.024,'blue-arm')
 L('cream',[(-.22,.71,-.03),(.20,.40,.07)],.024,'held-baseball-bat',taper=[1.7,.55]);O('aqua',(.14,.45,.06),(.032,.035,.027),'bat-grip')
 # Shirt numerals are relief, not a separate floating label.
 L('paper',[(-.04,.37,.09),(-.04,.26,.087)],.009,'jersey-one');L('paper',[(.015,.37,.091),(.065,.37,.082),(.025,.26,.093)],.009,'jersey-seven')
 return 'ExtraMile.pdf viewed: blue young king, red 17 jersey, purple trousers, very tall gold crown and baseball bat. Crown/back clothing completed in project design.'
def em_lazy():
 # Recliner is character equipment shown in reference, not a game pedestal.
 B('red',(0,.12,-.025),(.36,.12,.27),'recliner-seat');B('red',(0,.42,-.14),(.34,.43,.12),'recliner-back',rot=(.22,0,0))
 for d in [-1,1]:B('red',(d*.19,.25,.015),(.09,.25,.39),'recliner-armrest')
 B('red',(0,.045,.23),(.32,.07,.22),'recliner-footrest')
 for d in [-1,1]:L('grey',[(d*.10,.10,.07),(d*.10,.06,.20)],.012,'recliner-footrest-hinge')
 L('paper',[(0,.23,.01),(0,.47,-.085)],.014,'skeleton-spine')
 for y in [.30,.35,.40,.45]:
  for d in [-1,1]:L('paper',[(0,y,-.01), (d*.09,y+.02,.015),(d*.10,y-.02,.045),(d*.02,y-.035,.065)],.009,'curved-rib')
 O('paper',(0,.23,.045),(.09,.035,.06),'pelvis')
 for d in [-1,1]:
  L('paper',[(d*.06,.25,.08),(d*.08,.23,.19),(d*.08,.14,.32)],.014,'skeleton-leg');O('paper',(d*.08,.12,.35),(.038,.025,.065),'bony-foot')
  L('paper',[(d*.09,.44,-.05),(d*.16,.35,.02),(d*.20,.40 if d<0 else .25,.08)],.013,'skeleton-arm')
 skull=union([O('paper',(0,.56,-.08),(.105,.11,.075),'skull-cranium'),O('paper',(0,.49,-.035),(.065,.045,.055),'skull-jaw')],'rounded-skull',.007,.25)
 for d in [-1,1]:O('ink',(d*.041,.565,-.007),(.029,.036,.006),'skull-socket')
 O('ink',(0,.52,.013),(.016,.019,.006),'nasal-socket')
 for x in [-.035,0,.035]:L('grey',[(x,.49,.02),(x,.47,.018)],.003,'jaw-tooth-seam')
 K('blue',(-.20,.47,.08),.025,.02,.13,'held-drink-bottle');K('blue',(-.20,.55,.08),.012,.012,.04,'bottle-neck')
 return 'ExtraMile.pdf viewed: full white skeleton reclining in red armchair, holding blue bottle. Chair, ribs, pelvis and bony limbs are three-dimensional; chair must remain rigid during character animations.'
def em_marksman():
 for d in [-1,1]:
  L('yellow',[(d*.07,.25,0),(d*.07,.022,.02)],.014,'bird-leg')
  for dx in [-.035,0,.035]:L('yellow',[(d*.07,.025,.02),(d*.07+dx,.01,.10)],.009,'bird-toe')
 h=loft('paper',[(0,.21,0,.10,.08),(0,.38,0,.14,.10),(0,.50,0,.08,.07),(0,.62,0,.065,.06),(0,.72,0,.09,.07),(0,.78,0,.05,.04)],'long-neck-archer-bird',24)
 for d in [-1,1]:eye(d*.042,.72,front_at(h,d*.042,.72)+.002,.022)
 loft('yellow',[(.02,.68,.07,.07,.02),(.07,.65,.16,.06,.02),(.15,.63,.27,.003,.003)],'long-pointed-beak',18)
 for i in range(3):L('paper',[(-.01,.77,0),(-.07+i*.025,.88,-.01),(-.10+i*.035,.9,-.01)],.013,'crest-feather',taper=[1,.6,.02])
 for d in [-1,1]:L('paper',[(d*.10,.45,0),(d*.18,.37,.04),(.26 if d>0 else -.12,.42,.15)],.027,'bow-holding-wing')
 for i in range(4):L('paper',[(-.07+i*.045,.25,-.04),(-.14+i*.07,.17,-.17)],.024,'splayed-tail-feather',taper=[1,.15])
 L('brown',[(.20,.20,.15),(.27,.42,.15),(.20,.67,.15)],.012,'held-bow');L('grey',[(.20,.20,.15),(.12,.42,.18),(.20,.67,.15)],.0025,'held-bowstring');L('grey',[(-.14,.42,.18),(.30,.42,.18)],.005,'held-arrow')
 fin('grey',[(.30,.42,.18),(.26,.44,.18),(.26,.40,.18)],'arrow-head',.014)
 return 'ExtraMile.pdf viewed: white long-beaked bird archer, yellow legs and beak, white crest and tail, wooden bow and arrow. Nonfunctional miniature prop is held across two folded wings.'
def em_moneybags():
 for x in [-.07,.07]:sole(x,color='green');loft('green',[(x,.04,0,.05,.055),(x,.24,0,.06,.065)],'money-trouser',16)
 body=loft('pink',[(0,.19,0,.12,.08),(0,.33,0,.15,.10),(0,.48,0,.13,.08),(0,.54,0,.08,.06)],'pig-gentleman-body',24)
 h=loft('pink',[(0,.50,0,.055,.045),(0,.58,0,.105,.08),(0,.69,0,.11,.085),(0,.75,-.01,.07,.055)],'pig-head',24);eyes_on(h,.67,.038,.02)
 O('pink',(.025,.61,.12),(.085,.047,.075),'pig-snout')
 for x in [-.005,.05]:O('ink',(x,.615,.19),(.008,.015,.004),'pig-nostril')
 for d in [-1,1]:loft('pink',[(d*.075,.70,0,.035,.025),(d*.13,.80,-.01,.004,.004)],'pig-pointed-ear',12);L('pink',[(d*.11,.45,0),(d*.19,.34,0),(d*.16,.28,.09)],.026,'pig-arm')
 loft('ink',[(0,.74,0,.16,.12),(0,.77,0,.16,.12),(0,.78,0,.095,.075),(0,.94,0,.10,.08)],'gentleman-top-hat',24)
 L('pink',[(-.10,.22,-.04),(-.20,.25,-.07),(-.21,.31,-.06),(-.16,.32,-.05),(-.16,.28,-.04)],.009,'curly-pig-tail')
 for x in [-.095,.095]:L('ink',[(x,.23,.06),(x,.47,.04)],.014,'black-suspender')
 for d in [-1,1]:O('red',(d*.026,.48,.078),(.032,.022,.012),'red-bowtie')
 return 'ExtraMile.pdf viewed: pink pig gentleman, black top hat/suspenders, green trousers, red bow tie and curly tail. Snout has modeled nostrils and is integrated into a complete head.'
def em_mrfox():
 for x in [-.07,.07]:sole(x,color='ink');loft('violet',[(x,.04,0,.045,.05),(x,.25,0,.055,.055)],'fox-suit-trouser',16)
 loft('violet',[(0,.21,0,.13,.085),(0,.40,0,.14,.09),(0,.48,0,.09,.065)],'fox-jacket',22)
 fin('paper',[(-.06,.47,.078),(.06,.47,.078),(0,.31,.103)],'shirt-front',.012);L('ink',[(0,.45,.08),(0,.34,.11)],.014,'black-tie')
 h=loft('orange',[(0,.47,0,.06,.05),(0,.55,0,.11,.08),(0,.65,0,.10,.075),(0,.70,0,.06,.045)],'fox-head',24)
 for d in [-1,1]:loft('orange',[(d*.07,.64,0,.04,.025),(d*.10,.84,-.005,.004,.003)],'fox-tall-ear',12);eye(d*.043,.63,front_at(h,d*.043,.63)+.001,.019)
 O('cream',(0,.55,.09),(.105,.032,.07),'fox-muzzle');O('ink',(.06,.565,.15),(.026,.025,.023),'fox-nose')
 for d in [-1,1]:L('violet',[(d*.11,.43,0),(d*.18,.33,.03),(d*.20,.39 if d>0 else .24,.08)],.029,'suit-arm');O('orange',(d*.20,.39 if d>0 else .24,.08),(.028,.029,.024),'fox-hand')
 B('brown',(-.20,.16,.08),(.16,.16,.06),'held-briefcase');L('brown',[(-.24,.24,.08),(-.24,.27,.08),(-.16,.27,.08),(-.16,.24,.08)],.007,'held-case-handle')
 L('brown',[(.20,.39,.08),(.20,.67,.08)],.009,'held-scales-stem');L('brown',[(.08,.64,.08),(.31,.64,.08)],.008,'held-scales-beam')
 for x in [.09,.30]:
  for dx in [-.035,.035]:L('grey',[(x,.64,.08),(x+dx,.50,.08)],.0025,'held-scales-string')
  loft('brown',[(x,.47,.08,.018,.018),(x,.50,.08,.05,.035)],'held-scale-pan',16)
 return 'ExtraMile.pdf viewed: orange fox lawyer, violet suit, white shirt, black tie, brown briefcase and miniature balance scales. Both carried props have complete side/back volume and joined handles.'
def em_oddball():
 body=O('paper',(0,.27,0),(.25,.26,.22),'baseball-body')
 for d in [-1,1]:
  coords=[]
  for i in range(11):y=.07+i*.039;x=d*(.10+.04*math.cos(i*math.pi/10));coords.append((x,y,front_at(body,x,y)+.004))
  L('red',coords,.004,'baseball-seam')
  for x,y,z in coords:L('red',[(x-.012,y-.009,z),(x+.012,y+.009,z)],.003,'baseball-stitch')
  x=d*.07;eye(x,.31,front_at(body,x,.31)+.003,.044)
  z=front_at(body,x,.31)+.03;L('ink',[(x+math.cos(i*math.pi/10)*.06,.31+math.sin(i*math.pi/10)*.059,z)for i in range(21)],.006,'round-spectacles')
 L('ink',[(-.015,.33,.24),(.015,.33,.24)],.005,'spectacle-bridge')
 L('ink',[(-.1,.19,front_at(body,-.1,.19)+.004),(0,.17,front_at(body,0,.17)+.005),(.1,.20,front_at(body,.1,.20)+.004)],.004,'baseball-smile')
 for x in [-.037,.037]:B('paper',(x,.145,front_at(body,x,.145)+.005),(.04,.05,.012),'buck-tooth')
 return 'ExtraMile.pdf viewed: white baseball with red stitches, round black spectacles, cheeky grin and buck teeth. No artificial humanoid torso or legs added; sphere is the complete rolling body.'
BUILDERS.update({'extra-mile-heads':em_heads,'extra-mile-honey-pot':em_honey,'extra-mile-king-pete':em_kingpete,'extra-mile-lazy-bones':em_lazy,'extra-mile-marksman':em_marksman,'extra-mile-moneybags':em_moneybags,'extra-mile-mr-fox':em_mrfox,'extra-mile-oddball':em_oddball})
def em_pooh():
 body=loft('cream',[(0,.07,0,.10,.08),(0,.20,-.015,.17,.12),(0,.39,-.02,.15,.11),(0,.48,0,.085,.06)],'round-bear-body',24)
 h=union([O('cream',(0,.54,0),(.12,.12,.09),'bear-head'),O('cream',(.035,.51,.085),(.075,.045,.055),'bear-muzzle')],'soft-bear-head',.008,.3)
 for d in [-1,1]:O('cream',(d*.085,.63,0),(.035,.04,.027),'round-bear-ear');sole(d*.10,color='cream',w=.045,length=.075)
 eyes_on(h,.56,.035,.015);O('ink',(.045,.54,.13),(.018,.013,.013),'bear-nose')
 loft('brown',[(.05,.08,.14,.065,.05),(.05,.17,.14,.09,.06),(.05,.24,.14,.075,.055)],'held-honey-jar',20)
 for d in [-1,1]:L('cream',[(d*.12,.36,0),(d*.17,.29,.07),(.05+d*.065,.23,.16)],.033,'jar-hugging-arm')
 L('brown',[(-.15,.30,.03),(-.20,.72,.02)],.0025,'held-balloon-string')
 for x,y,z in [(-.18,.82,.02),(-.08,.90,-.02),(-.27,.91,-.025)]:
  O('red',(x,y,z),(.065,.09,.05),'red-balloon');L('brown',[(x,y-.09,z),(-.20,.72,.02)],.002,'held-balloon-string')
 return 'ExtraMile.pdf viewed: pale yellow bear hugging brown honey jar and holding red balloons, no red shirt in this specific artwork. Balloon strings physically connect to the hand; no background effects.'
def em_robin():
 for x in [-.07,.07]:sole(x,color='brown');loft('green',[(x,.04,0,.045,.05),(x,.23,0,.05,.055)],'archer-trouser',16)
 loft('green',[(0,.19,0,.15,.09),(0,.28,0,.13,.085),(0,.45,0,.13,.08),(0,.49,0,.08,.055)],'robin-tunic',22)
 L('brown',[(-.13,.26,.025),(0,.25,.09),(.13,.26,.025)],.017,'tunic-belt')
 h=loft('grey',[(0,.46,0,.055,.045),(0,.54,0,.09,.075),(0,.65,0,.10,.08),(0,.70,0,.065,.05)],'robin-face',22);eyes_on(h,.63,.034,.019);O('grey',(.025,.57,.09),(.035,.03,.05),'robin-nose')
 for d in [-1,1]:L('ink',[(d*.01,.54,.10),(d*.06,.535,.10),(d*.08,.57,.08)],.012,'robin-moustache',taper=[1,1,.1])
 loft('green',[(0,.68,0,.16,.12),(0,.71,0,.17,.12),(-.06,.79,-.02,.08,.05),(-.13,.83,-.03,.003,.003)],'folded-archer-hat',20)
 L('paper',[(-.06,.74,-.04),(-.20,.86,-.04),(-.22,.95,-.035)],.021,'white-hat-feather',taper=[.8,1,.05])
 for d in [-1,1]:L('green',[(d*.10,.44,0),(d*.17,.37,.03),(.29 if d>0 else -.16,.44,.13)],.027,'archer-sleeve');O('grey',(.29 if d>0 else -.16,.44,.13),(.025,.028,.025),'archer-hand')
 L('brown',[(.23,.13,.12),(.31,.44,.12),(.23,.76,.12)],.013,'held-longbow');L('grey',[(.23,.13,.12),(-.16,.44,.14),(.23,.76,.12)],.0025,'held-drawn-string');L('grey',[(-.20,.44,.15),(.33,.44,.15)],.005,'held-arrow');fin('grey',[(.33,.44,.15),(.28,.465,.15),(.28,.415,.15)],'held-arrowhead',.014)
 loft('brown',[(-.12,.22,-.09,.04,.03),(-.12,.49,-.11,.045,.035)],'back-quiver',16)
 for x in [-.15,-.12,-.09]:L('brown',[(x,.35,-.11),(x,.61,-.11)],.004,'quiver-arrow');O('red',(x,.59,-.11),(.009,.03,.009),'arrow-fletching')
 return 'ExtraMile.pdf viewed: grey-faced Robin Hood, green tunic/hat, white feather, black moustache, drawn bow and rear quiver. Accessories are nonfunctional sculpted props.'
def em_nick():
 for x in [-.07,.07]:sole(x,color='ink');loft('red',[(x,.04,0,.05,.055),(x,.20,0,.06,.06)],'saint-trouser',16)
 loft('red',[(0,.16,0,.16,.11),(0,.31,0,.18,.12),(0,.48,0,.14,.09),(0,.52,0,.09,.06)],'saint-red-coat',24)
 for x in [-.015,.015]:L('paper',[(x,.19,.11),(x,.48,.085)],.014,'white-coat-front')
 h=loft('pink',[(0,.48,0,.06,.05),(0,.56,0,.10,.075),(0,.66,0,.10,.08),(0,.71,0,.065,.05)],'saint-face',22);eyes_on(h,.63,.039,.019);O('pink',(0,.575,.105),(.045,.035,.045),'saint-nose')
 for x in [-.065,-.025,.025,.065]:L('paper',[(x,.56,.07),(x*.7,.45,.11),(x*.15,.37,.10)],.032,'white-beard',taper=[1,1,.1])
 loft('red',[(0,.69,0,.115,.075),(0,.77,0,.12,.07),(0,.90,0,.075,.055),(0,1.0,0,.003,.003)],'tall-saint-mitre',22)
 L('yellow',[(0,.70,.08),(0,.98,.012)],.009,'mitre-cross-vertical');L('yellow',[(-.10,.79,.04),(0,.79,.075),(.10,.79,.04)],.008,'mitre-cross-bar')
 for d in [-1,1]:L('red',[(d*.12,.44,0),(d*.19,.34,.03),(d*.20,.45,.09)],.032,'saint-sleeve');O('green',(d*.20,.45,.09),(.032,.036,.028),'green-mitten')
 L('yellow',[(.24,.02,.09),(.24,.85,.09),(.29,.94,.09),(.34,.90,.09),(.32,.84,.09),(.28,.86,.09)],.012,'held-crozier')
 O('cream',(-.16,.41,-.10),(.14,.22,.12),'gift-sack');L('brown',[(-.19,.55,.02),(-.20,.46,.09)],.009,'sack-tie')
 return 'ExtraMile.pdf viewed: Saint Nick in red bishop mitre/coat, gold cross/crozier, white beard, green gloves and tan sack. This follows the supplied card rather than substituting a generic Santa cap.'
def em_bully():
 for d in [-1,1]:sole(d*.10,color='violet');L('grey',[(d*.10,.06,0),(d*.10,.22,0)],.026,'bully-shin');loft('violet',[(d*.08,.17,0,.065,.06),(d*.08,.32,0,.075,.065)],'bully-short',16)
 loft('grey',[(0,.28,0,.15,.10),(0,.43,0,.18,.12),(0,.55,0,.14,.09),(0,.60,0,.09,.06)],'bully-shirt',24)
 h=loft('grey',[(0,.53,0,.07,.05),(0,.59,0,.12,.085),(0,.71,0,.13,.09),(0,.77,-.01,.08,.06)],'bully-angular-head',24);eyes_on(h,.68,.05,.022)
 for d in [-1,1]:brow_on(h,d*.05,.72,.03,'ink',-d*.012);L('grey',[(d*.13,.50,0),(d*.20,.40,.04),(d*.08,.43,.15)],.035,'knuckle-cracking-arm')
 O('ink',(0,.60,front_at(h,0,.60)+.003),(.065,.034,.009),'bully-grimace')
 for x in [-.035,0,.035]:B('paper',(x,.61,.10),(.025,.026,.011),'gritted-tooth')
 loft('violet',[(0,.73,0,.14,.10),(0,.79,0,.13,.10),(0,.88,0,.075,.06),(0,.90,0,.02,.02)],'backward-baseball-cap',22);O('violet',(-.12,.76,-.055),(.11,.018,.075),'backward-cap-visor')
 L('brown',[(-.15,.26,-.06),(-.19,.43,-.08),(-.24,.49,-.08)],.009,'slingshot-fork');L('brown',[(-.19,.43,-.08),(-.14,.50,-.08)],.009,'slingshot-fork');L('cream',[(-.24,.49,-.08),(-.17,.38,-.10),(-.14,.50,-.08)],.003,'slingshot-band')
 return 'ExtraMile.pdf viewed: stocky grey school bully, dark shorts, backward violet cap and tucked slingshot. Clenched hands and toothy scowl are modeled; prop does not introduce gameplay.'
def em_scout():
 for d in [-1,1]:sole(d*.07,color='ink');L('red',[(d*.07,.05,0),(d*.07,.22,0)],.022,'red-scout-shin');loft('yellow',[(d*.07,.15,0,.05,.055),(d*.07,.29,0,.06,.06)],'scout-short',16)
 body=loft('cream',[(0,.25,0,.12,.08),(0,.43,0,.13,.09),(0,.50,0,.08,.06)],'scout-shirt',22)
 h=loft('red',[(0,.46,0,.055,.045),(0,.54,0,.10,.075),(0,.65,0,.105,.08),(0,.71,0,.06,.05)],'scout-face',22);eyes_on(h,.63,.038,.02);O('red',(.035,.575,.09),(.035,.027,.04),'scout-nose')
 loft('yellow',[(0,.69,0,.19,.13),(0,.72,0,.19,.13),(0,.76,0,.11,.08),(0,.86,0,.065,.05),(0,.88,0,.02,.02)],'wide-scout-hat',24);L('green',[(-.10,.76,.035),(0,.76,.087),(.1,.76,.035)],.012,'green-hat-band')
 L('green',[(-.095,.46,.065),(0,.37,.10),(.09,.28,.065)],.027,'merit-badge-sash')
 for i in range(5):O(['violet','blue','yellow'][i%3],(-.08+i*.035,.445-i*.035,.092),(.012,.013,.005),'merit-badge')
 for d in [-1,1]:L('violet',[(d*.07,.49,.04),(0,.44,.10),(d*.03,.34,.11)],.012,'scout-neckerchief')
 L('red',[(-.10,.45,0),(-.19,.56,.03),(-.08,.69,.07)],.023,'saluting-arm');L('red',[(.10,.44,0),(.18,.36,.03),(.23,.45,.07)],.023,'flag-holding-arm')
 L('brown',[(.23,.01,.07),(.23,.85,.07)],.009,'held-scout-flagpole');fin('green',[(.24,.83,.07),(.40,.72,.07),(.24,.66,.07)],'held-scout-flag',.014)
 return 'ExtraMile.pdf viewed: red scout, tan uniform/wide hat, green sash with badges, violet scarf and green pennant. Pennant is the reference scouting prop, not an invented political flag.'
def em_shuffler():
 # A curved, solid playing card, with a complete back and bevelled perimeter.
 vs=[];nx=8
 for back in [0,1]:
  for j,y in enumerate([.18,.72]):
   for i in range(nx+1):x=-.18+i*.045;vs.append((x,y,.025*math.cos(x*9)+(back-.5)*.018))
 n=2*(nx+1);fs=[]
 for i in range(nx):fs.extend([(i,i+1,nx+2+i,nx+1+i),(n+i,n+nx+1+i,n+nx+2+i,n+i+1)])
 for i in range(nx):fs.extend([(i,n+i,n+i+1,i+1),(nx+1+i,nx+2+i,n+nx+2+i,n+nx+1+i)])
 fs.extend([(0,nx+1,n+nx+1,n),(nx,n+nx,n+2*nx+1,2*nx+1)])
 m=bpy.data.meshes.new('curved-card');m.from_pydata(vs,[],fs);m.update();o=bpy.data.objects.new('curved-card',m);scene.collection.objects.link(o);add(o,'paper','curved-card-body')
 for d in [-1,1]:
  L('blue',[(d*.09,.19,0),(d*.12,.05,.02)],.017,'card-leg');sole(d*.12,color='blue',w=.035,length=.07);eye(d*.07,.62,.045,.035)
  L('blue',[(d*.17,.40,0),(d*.24,.35,.02),(d*.27,.47,.04)],.015,'card-arm');O('blue',(d*.27,.47,.04),(.03,.023,.016),'card-hand')
 # Spade silhouette is a real thin extruded relief on the face.
 extruded_outline('ink',[(-.08,.46),(-.06,.51),(0,.57),(.06,.51),(.08,.46),(.06,.43),(.015,.44),(.025,.39),(-.025,.39),(-.015,.44),(-.06,.43)],.012,'spade-relief',.045)
 L('ink',[(-.08,.29,.04),(0,.27,.052),(.08,.30,.04)],.004,'card-smile')
 for i in range(4):B('red',(.24,.50+i*.027,.025),(.12,.012,.08),'held-card-fan',rot=(0,.10*i,0))
 return 'ExtraMile.pdf viewed: white ace-of-spades card creature, blue limbs and red deck. Body is a thick gently curved editable mesh with full back; the cards form a held fan rather than unattached floating graphics.'
def em_goose():
 for d in [-1,1]:sole(d*.08,color='orange',w=.05,length=.08)
 body=loft('paper',[(0,.05,0,.12,.08),(0,.19,-.04,.18,.14),(0,.32,-.04,.15,.11),(0,.41,.005,.065,.055),(0,.58,.015,.05,.045),(0,.70,.025,.075,.065),(0,.77,.02,.06,.05)],'goose-long-neck-body',26)
 for d in [-1,1]:O('paper',(d*.13,.23,-.025),(.055,.105,.11),'goose-folded-wing');O('ink',(d*.035,.70,.08),(.04,.027,.012),'black-sunglass-lens')
 L('ink',[(-.07,.72,.06),(0,.715,.092),(.07,.72,.06)],.006,'sunglass-frame')
 O('orange',(.015,.645,.11),(.055,.035,.07),'goose-bill')
 for i in range(4):L('paper',[(-.04+i*.03,.23,-.10),(-.09+i*.06,.35,-.23)],.021,'goose-tail-feather',taper=[1,.03])
 loft('yellow',[(0,.75,.02,.09,.07),(0,.80,.02,.075,.06),(0,.85,.02,.02,.02)],'propeller-cap',20)
 for d,col in [(-1,'red'),(1,'green')]:L(col,[(d*.07,.77,.035),(d*.045,.82,.04),(0,.85,.02)],.021,'cap-color-panel')
 L('grey',[(0,.84,.02),(0,.9,.02)],.005,'cap-spindle');O('blue',(0,.90,.02),(.10,.007,.018),'cap-propeller')
 return 'ExtraMile.pdf viewed: white goose with long curved neck, orange beak, black sunglasses and multicolor propeller cap. Folded wings and feathered tail are complete volumes; no generic humanoid body.'
BUILDERS.update({'extra-mile-pooh':em_pooh,'extra-mile-robin-hood':em_robin,'extra-mile-saint-nick':em_nick,'extra-mile-school-bully':em_bully,'extra-mile-scout':em_scout,'extra-mile-shuffler':em_shuffler,'extra-mile-silly-goose':em_goose})
def em_snakeeyes():
 body=L('green',[(-.14,.055,-.04),(.02,.05,.06),(.15,.10,-.02),(.07,.20,-.08),(-.07,.30,-.02),(-.09,.50,0),(-.07,.68,.01)],.055,'coiled-snake-body',taper=[1,1.3,1.1,1,1,.8,.85])
 for y in [.25,.32,.39,.46,.53,.60]:O('cream',(-.075,y,.055),(.045,.029,.012),'snake-belly-scute')
 O('green',(-.065,.68,.01),(.085,.05,.065),'snake-head')
 for d in [-1,1]:
  x=-.065+d*.052;B('paper',(x,.745,.015),(.075,.075,.07),'dice-eye',rot=(0,0,d*.2));O('ink',(x,.745,.054),(.014,.014,.004),'dice-eye-pip')
 L('red',[(-.04,.66,.065),(.07,.63,.10),(.12,.55,.11)],.009,'snake-fork-tongue',taper=[1,1,.5]);L('red',[(.10,.58,.11),(.15,.56,.11)],.005,'fork-tongue-tip')
 L('green',[(.06,.20,-.06),(.18,.31,.03),(.21,.43,.04)],.028,'card-holding-tail')
 for i in range(4):B('paper',(.19+i*.018,.48,.04+i*.008),(.035,.10,.012),'held-card-fan',rot=(0,0,.1*i))
 return 'ExtraMile.pdf viewed: green coiled snake with ivory belly, actual dice eyes, red forked tongue and a card fan held by tail. No human arms/legs or unsupported floating dice; no gameplay chips baked into pawn.'
def em_snub():
 for d in [-1,1]:sole(d*.09,color='pink');loft('red',[(d*.09,.04,0,.055,.055),(d*.09,.22,0,.065,.07)],'elephant-shorts',16)
 h=loft('pink',[(0,.18,0,.13,.10),(0,.29,0,.20,.13),(0,.49,0,.19,.12),(0,.64,0,.13,.09),(0,.72,0,.06,.05)],'round-elephant-body',28)
 for d in [-1,1]:
  O('pink',(d*.16,.58,-.005),(.085,.145,.025),'large-elephant-ear');L('violet',[(d*.17,.68,.02),(d*.20,.62,.023),(d*.17,.52,.025)],.006,'ear-fold')
  L('pink',[(d*.15,.46,0),(d*.19,.35,.05)],.035,'elephant-arm');eye(d*.06,.60,front_at(h,d*.06,.60)+.003,.026)
 L('pink',[(0,.55,.11),(.01,.43,.16),(.02,.29,.18),(.07,.30,.18)],.035,'long-elephant-trunk',taper=[1.3,1,.75,.5])
 for y in [.34,.40,.46]:L('violet',[(-.01,y,.19),(.025,y-.005,.194)],.0035,'trunk-wrinkle')
 L('paper',[(-.16,.22,.04),(0,.20,.13),(.16,.22,.04)],.012,'shorts-waistband');B('yellow',(0,.66,.095),(.08,.018,.015),'forehead-bandage')
 O('aqua',(-.10,.54,.105),(.009,.025,.007),'single-tear')
 return 'ExtraMile.pdf viewed: sad pink elephant, red shorts, forehead bandage and tear. Wide ears and curved trunk are structural, with complete back and feet; no generic humanoid replacement.'
def em_toddler():
 for d in [-1,1]:sole(d*.08,color='pink',w=.04,length=.055);L('pink',[(d*.07,.07,0),(d*.06,.21,0)],.025,'baby-leg')
 loft('paper',[(0,.16,0,.11,.075),(0,.26,0,.14,.095),(0,.31,0,.12,.085)],'white-diaper',22)
 loft('pink',[(0,.27,0,.11,.08),(0,.39,0,.12,.09),(0,.46,0,.085,.06)],'toddler-torso',24)
 head=O('pink',(0,.57,0),(.17,.15,.105),'crying-baby-head')
 # Recessed mouth cavity, not a dark decal that intersects the head.
 cut=O('ink',(0,.555,.09),(.12,.075,.055),'mouth-cutter');bpy.context.view_layer.objects.active=head;mod=head.modifiers.new('Open crying mouth','BOOLEAN');mod.object=cut;mod.operation='DIFFERENCE';bpy.ops.object.modifier_apply(modifier=mod.name);bpy.data.objects.remove(cut,do_unlink=True)
 O('ink',(0,.555,.075),(.115,.072,.024),'recessed-mouth');O('red',(0,.52,.101),(.055,.024,.009),'crying-tongue')
 for d in [-1,1]:
  O('pink',(d*.16,.60,-.005),(.05,.035,.025),'toddler-ear');L('ink',[(d*.025,.67,.07),(d*.06,.68,.065),(d*.09,.665,.06)],.005,'squeezed-shut-eye')
  L('pink',[(d*.095,.42,0),(d*.20,.46,.02)],.022,'outstretched-baby-arm');O('pink',(d*.21,.46,.02),(.03,.023,.018),'baby-hand')
  B('paper',(d*.034,.60,.114),(.025,.025,.012),'baby-tooth')
 L('pink',[(0,.70,0),(.025,.76,0),(.005,.80,.01)],.013,'single-baby-curl',taper=[1,.8,.05])
 return 'ExtraMile.pdf viewed: pink crying infant in white diaper, huge open mouth, two teeth and outstretched arms. Mouth is a true recess with internal tongue; floating tears omitted from static pawn.'
def em_thief():
 for d in [-1,1]:sole(d*.08,color='ink');loft('grey',[(d*.08,.04,0,.05,.055),(d*.08,.25,0,.06,.06)],'thief-trouser',16)
 body=loft('grey',[(0,.22,0,.13,.09),(0,.40,0,.15,.10),(0,.51,0,.10,.07)],'striped-thief-shirt',24)
 for y in [.27,.34,.41,.48]:L('ink',[(-.12,y,.03),(0,y,front_at(body,0,y)+.004),(.12,y,.03)],.012,'prison-shirt-stripe')
 h=loft('green',[(0,.48,0,.06,.05),(0,.55,0,.10,.08),(0,.67,0,.115,.085),(0,.73,0,.075,.055)],'green-thief-head',22)
 for d in [-1,1]:O('green',(d*.11,.63,0),(.035,.045,.022),'thief-ear');O('ink',(d*.043,.65,front_at(h,d*.043,.65)+.007),(.045,.026,.009),'black-eye-mask');eye(d*.043,.65,front_at(h,d*.043,.65)+.018,.017)
 O('green',(0,.60,.10),(.025,.03,.035),'thief-nose');B('paper',(.03,.535,.085),(.022,.025,.01),'thief-tooth')
 loft('ink',[(0,.70,0,.12,.09),(0,.76,0,.11,.08),(0,.82,0,.06,.05)],'thief-beanie',22)
 O('cream',(-.13,.48,-.11),(.14,.19,.12),'loot-sack');L('cream',[(-.13,.60,-.02),(-.10,.48,.11)],.018,'held-sack-neck')
 for d in [-1,1]:L('grey',[(d*.12,.45,0),(d*.18,.36,.04),(d*.05,.43,.13)],.027,'thief-sleeve');O('green',(d*.05,.43,.13),(.032,.025,.024),'gripping-hand')
 return 'ExtraMile.pdf viewed: green goblin thief, black cap/mask, grey striped clothes and tan loot sack. Sack neck is physically held, ears and full back reconstructed from the card.'
def em_troll():
 for d in [-1,1]:sole(d*.075,color='green');L('green',[(d*.075,.05,0),(d*.075,.22,0)],.025,'troll-leg')
 body=loft('cream',[(0,.18,0,.13,.085),(0,.36,0,.13,.09),(0,.45,0,.09,.055)],'ragged-tan-vest',22)
 for y in [.25,.29,.33]:
  L('brown',[(-.018,y,.09),(.018,y+.025,.09)],.003,'vest-lacing');L('brown',[(.018,y,.09),(-.018,y+.025,.09)],.003,'vest-lacing')
 h=loft('green',[(0,.41,0,.07,.055),(0,.49,0,.15,.10),(0,.64,0,.16,.11),(0,.73,0,.09,.065)],'troll-wide-face',24)
 for d in [-1,1]:
  loft('green',[(d*.14,.59,0,.04,.025),(d*.24,.70,-.01,.003,.003)],'pointed-troll-ear',12);eye(d*.06,.63,front_at(h,d*.06,.63)+.002,.037)
  L('green',[(d*.10,.40,0),(d*.20,.46,.03),(d*.24,.54,.035)],.023,'troll-raised-arm')
  for dx in [-.025,0,.025]:L('green',[(d*.24,.54,.035),(d*.25+dx,.59,.035)],.007,'troll-finger')
 O('green',(0,.55,.12),(.045,.04,.035),'troll-nose');O('ink',(0,.49,.105),(.095,.045,.013),'troll-mouth')
 for x in [-.06,.06]:B('paper',(x,.51,.12),(.025,.025,.012),'troll-tooth')
 for i in range(11):a=(i-5)*.19;x=math.sin(a)*.11;L('brown',[(x,.72,0),(x*1.7,.80+.08*math.cos(a*2),-.01)],.018,'spiky-troll-hair',taper=[1,.02])
 return 'ExtraMile.pdf viewed: green troll with huge eyes/ears, upright brown spiky hair, tan laced rag vest and raised hands. Reference bridge/rail is scenery and deliberately not included as pawn base.'
def em_ref():
 for d in [-1,1]:sole(d*.08,color='ink');loft('ink',[(d*.08,.035,0,.05,.055),(d*.08,.24,0,.065,.06)],'referee-shorts',16)
 body=loft('paper',[(0,.20,0,.15,.09),(0,.37,0,.16,.10),(0,.47,0,.11,.075)],'referee-shirt',24)
 for x in [-.10,-.05,0,.05,.10]:L('ink',[(x,y,front_at(body,x,y)+.004)for y in [.23,.30,.37,.43]],.009,'referee-shirt-stripe')
 h=union([O('grey',(0,.58,0),(.15,.13,.10),'bulldog-head'),O('grey',(-.065,.53,.075),(.075,.08,.06),'left-jowl'),O('grey',(.065,.53,.075),(.075,.08,.06),'right-jowl')],'bulldog-face',.008,.32)
 for d in [-1,1]:O('grey',(d*.14,.65,0),(.05,.025,.025),'bulldog-ear');eye(d*.045,.62,front_at(h,d*.045,.62)+.003,.021)
 O('ink',(0,.565,.14),(.04,.022,.018),'bulldog-black-nose')
 for x in [-.065,.065]:loft('paper',[(x,.49,.12,.012,.008),(x,.535,.12,.002,.002)],'bulldog-fang',10)
 loft('ink',[(0,.69,0,.13,.10),(0,.73,0,.11,.085),(0,.79,0,.065,.05)],'referee-cap',20);O('ink',(0,.70,.075),(.14,.015,.095),'cap-visor')
 for d in [-1,1]:L('grey',[(d*.12,.42,0),(d*.21,.40,.035),(d*.24,.45,.06)],.025,'referee-arm');O('grey',(d*.24,.45,.06),(.032,.025,.02),'referee-hand')
 fin('yellow',[(.23,.45,.06),(.32,.52,.06),(.35,.44,.06),(.30,.39,.06)],'held-penalty-cloth',.018)
 return 'ExtraMile.pdf viewed: grey bulldog referee, black cap, white vertically striped shirt, black shorts and yellow penalty cloth. No floating football or field stripes incorporated into the character.'
def em_whisper():
 body=loft('violet',[(0,.06,0,.13,.09),(0,.22,0,.16,.105),(0,.42,0,.15,.10),(0,.62,0,.11,.08),(0,.73,0,.045,.035)],'shy-ghost-sheet',26)
 for x in [-.10,0,.10]:L('violet',[(x,.14,0),(x*1.15,.015,.02)],.032,'ghost-scalloped-hem',taper=[1,.1])
 eyes_on(body,.59,.043,.024)
 for d in [-1,1]:
  L('violet',[(d*.12,.43,0),(d*.18,.44,.06),(d*.06,.55,.12),(d*.02,.54,.13)],.038,'shy-face-covering-arm',taper=[1,1,.9,.7]);brow_on(body,d*.045,.65,.024,'ink',d*.009)
 return 'ExtraMile.pdf viewed: lavender timid ghost covering its mouth with both hands. Draped ghost form has scalloped hem, integrated limbs and full back; not a transparent planar sprite.'
def em_witch():
 for d in [-1,1]:sole(d*.075,color='red',w=.035,length=.10)
 loft('ink',[(0,.065,0,.14,.10),(0,.19,0,.16,.11),(0,.37,0,.12,.085),(0,.48,0,.075,.055)],'witch-black-dress',24)
 h=loft('green',[(0,.44,0,.055,.045),(0,.51,0,.09,.075),(0,.63,0,.10,.075),(0,.70,0,.055,.045)],'witch-green-head',22)
 eyes_on(h,.615,.034,.019);L('green',[(.02,.59,.075),(.06,.56,.15),(.08,.49,.15)],.025,'hooked-witch-nose',taper=[1,1,.15]);B('paper',(.025,.49,.09),(.02,.024,.012),'witch-tooth')
 loft('ink',[(0,.66,0,.18,.13),(0,.70,0,.19,.14),(-.03,.77,-.01,.11,.085),(-.08,.89,-.02,.065,.05),(-.19,.96,-.025,.005,.004)],'crooked-pointed-witch-hat',24)
 L('paper',[(-.10,.75,.035),(0,.75,.085),(.09,.75,.03)],.012,'white-hat-band')
 for d in [-1,1]:L('ink',[(d*.10,.41,0),(d*.17,.33,.04),(d*.14,.35,.15)],.027,'witch-sleeve');O('green',(d*.14,.35,.15),(.03,.026,.025),'broom-gripping-hand')
 L('brown',[(-.30,.31,.15),(.28,.36,.15)],.014,'held-broomstick')
 for i in range(6):L('yellow',[(-.27,.31,.15),(-.40,.27+i*.015,.13+(i%2)*.03)],.014,'held-broom-straw',taper=[.9,.2])
 return 'ExtraMile.pdf viewed: green witch with hooked nose, black dress/crooked white-banded hat, red shoes and broom. Broom is visibly gripped and body fully modeled; no flying motion added to game rules.'
BUILDERS.update({'extra-mile-snake-eyes':em_snakeeyes,'extra-mile-snub':em_snub,'extra-mile-terrible-toddler':em_toddler,'extra-mile-thief':em_thief,'extra-mile-toll-troll':em_troll,'extra-mile-totally-fair-ref':em_ref,'extra-mile-whisper':em_whisper,'extra-mile-witch-hazel':em_witch})
