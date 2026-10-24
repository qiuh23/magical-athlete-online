# Leaf designs: repository SVGs actually viewed, plus registered traits.
# Original author's gamepiece PNG archive was unavailable for this rebuild.
def leaf_ref(text):return 'Repository SVG actually viewed; registered traits: '+text+'. Original author PNG not obtained during this rebuild; depth, underside/back and tailoring are project design.'
def leaf_catfish():
 body=union([O('blue',(0,.24,0),(.18,.20,.13)),O('blue',(0,.42,0),(.17,.14,.12))],'rounded-catfish',.008,.3)
 O('paper',(0,.20,.11),(.13,.14,.025),'pale-belly')
 for d in [-1,1]:
  loft('blue',[(d*.11,.48,0,.05,.04),(d*.16,.64,-.01,.003,.003)],'catfish-ear-fin',14);eye(d*.065,.44,front_at(body,d*.065,.44)+.001,.033)
  for y,dy in [(.30,.04),(.26,-.035)]:L('paper',[(d*.045,y,.13),(d*.17,y+dy,.17),(d*.27,y+dy*1.3,.14)],.007,'long-white-whisker',taper=[1,.9,.04])
 O('pink',(0,.34,.14),(.028,.019,.018),'pink-catfish-nose')
 L('blue',[(0,.16,-.10),(.17,.17,-.19),(.20,.38,-.20),(.14,.58,-.15)],.045,'upright-curled-tail',taper=[1.3,1.2,.85,.5])
 fin('blue',[(.14,.54,-.15),(.08,.72,-.14),(.27,.71,-.17),(.20,.60,-.17)],'split-tail-fin',.035)
 for d in [-1,1]:fin('blue',[(d*.07,.12,.01),(d*.15,.015,.065),(d*.04,.025,.11)],'grounded-ventral-fin',.025)
 return leaf_ref('blue catfish with cream belly, catlike head, long white whiskers and upright curled tail')
def leaf_dummy():
 for d in [-1,1]:
  sole(d*.08,color='orange');L('orange',[(d*.08,.06,0),(d*.08,.22,0)],.026,'dummy-shin');O('grey',(d*.08,.22,0),(.035,.035,.035),'knee-joint');L('orange',[(d*.08,.24,0),(d*.08,.34,0)],.033,'dummy-thigh')
 torso=loft('orange',[(0,.31,0,.10,.065),(0,.46,0,.13,.08),(0,.54,0,.11,.065)],'dummy-chest',22)
 L('grey',[(0,.53,0),(0,.60,0)],.022,'dummy-neck')
 h=O('orange',(0,.71,0),(.13,.13,.09),'crash-test-head');eyes_on(h,.735,.05,.026)
 L('ink',[(-.04,.66,.082),(.04,.66,.082)],.005,'dummy-neutral-mouth')
 O('ink',(0,.445,.08),(.073,.073,.01),'calibration-disk')
 for a0 in [0,math.pi]:
  pts=[(0,.445,.092)]+[(math.cos(a0+i*math.pi/16)*.063,.445+math.sin(a0+i*math.pi/16)*.063,.092)for i in range(9)];fin('yellow',pts,'calibration-quadrant',.006)
 for d in [-1,1]:
  O('grey',(d*.13,.51,0),(.034,.034,.034),'shoulder-joint');L('orange',[(d*.14,.50,0),(d*.21,.40,.025)],.024,'upper-arm');O('grey',(d*.21,.40,.025),(.03,.03,.03),'elbow-joint');L('orange',[(d*.21,.39,.025),(d*.19,.30,.07)],.022,'forearm');O('orange',(d*.19,.29,.07),(.03,.034,.025),'dummy-hand')
 return leaf_ref('orange segmented crash dummy with round dark joints and black/yellow calibration target')
def leaf_horse():
 O('blue',(0,.30,-.04),(.15,.13,.22),'horse-barrel')
 for d in [-1,1]:
  for z in [-.17,.10]:L('blue',[(d*.11,.30,z),(d*.12,.14,z),(d*.12,.045,z+.015)],.025,'horse-leg');O('ink',(d*.12,.03,z+.025),(.038,.03,.045),'black-hoof')
 loft('blue',[(0,.32,.10,.09,.07),(0,.50,.11,.095,.075),(0,.66,.12,.075,.065)],'upright-horse-neck',22)
 h=loft('blue',[(0,.49,.14,.08,.07),(0,.60,.15,.11,.10),(0,.73,.13,.10,.08),(0,.77,.12,.06,.05)],'long-horse-head',22)
 O('grey',(0,.515,.22),(.09,.06,.07),'grey-horse-muzzle')
 for d in [-1,1]:
  O('ink',(d*.035,.52,.282),(.01,.018,.005),'horse-nostril');eye(d*.055,.66,front_at(h,d*.055,.66)+.001,.024);loft('blue',[(d*.065,.72,.10,.025,.02),(d*.085,.86,.08,.002,.002)],'horse-ear',12)
 for y in [.42,.48,.54,.60,.66,.72]:L('ink',[(0,y,.045),(0,y+.02,-.025)],.027,'black-mane-lock',taper=[1,.1])
 L('ink',[(0,.35,-.23),(.08,.31,-.30),(.10,.15,-.30)],.035,'horse-tail',taper=[.8,1,.1])
 return leaf_ref('blue four-legged horse, long face, black mane/tail, grey muzzle and dark hooves')
def leaf_filmmaker():
 for d in [-1,1]:sole(d*.08,color='yellow');loft('blue',[(d*.08,.04,0,.045,.05),(d*.08,.26,0,.055,.055)],'jeans-leg',16)
 loft('paper',[(0,.23,0,.13,.09),(0,.43,0,.13,.085),(0,.50,0,.08,.055)],'white-film-shirt',22)
 h=loft('pink',[(0,.47,0,.06,.05),(0,.54,0,.11,.08),(0,.66,0,.12,.085),(0,.72,0,.065,.05)],'filmmaker-head',22);eyes_on(h,.63,.043,.023);O('pink',(0,.575,.095),(.028,.027,.025),'film-nose')
 for i in range(6):x=-.10+i*.04;L('green',[(x,.70,0),(x-.02,.81+.02*(i%2),-.01),(x+.025,.78,.01)],.025,'spiky-green-hair',taper=[1,1,.1])
 for d in [-1,1]:L('paper',[(d*.10,.44,0),(d*.18,.36,.03),(d*.17,.51,.12)],.027,'camera-holding-sleeve');O('pink',(d*.17,.51,.12),(.027,.03,.025),'camera-hand')
 B('grey',(.17,.59,.13),(.18,.17,.10),'held-movie-camera')
 for x in [.115,.225]:O('ink',(x,.71,.13),(.06,.06,.025),'held-camera-reel');O('grey',(x,.71,.157),(.036,.036,.006),'held-reel-center')
 K('ink',(.17,.59,.205),.04,.045,.06,'held-lens',rot=(math.pi/2,0,0))
 return leaf_ref('green-haired pink filmmaker, white shirt/light-blue jeans, yellow boots and volumetric grey twin-reel movie camera')
def leaf_kangaroo():
 body=loft('orange',[(0,.11,0,.11,.09),(0,.28,-.02,.16,.12),(0,.43,0,.12,.09),(0,.56,0,.07,.06)],'kangaroo-torso',24)
 O('cream',(0,.28,.09),(.105,.11,.025),'cream-pouch');L('brown',[(-.08,.32,.112),(0,.30,.13),(.08,.32,.112)],.005,'pouch-opening')
 h=O('orange',(0,.62,0),(.115,.12,.09),'kangaroo-head');O('cream',(0,.565,.09),(.08,.04,.05),'kangaroo-muzzle');O('ink',(0,.59,.13),(.027,.022,.02),'kangaroo-nose');eyes_on(h,.65,.043,.022)
 for d in [-1,1]:
  loft('orange',[(d*.065,.70,0,.035,.027),(d*.10,.92,-.01,.025,.018),(d*.11,.97,-.01,.003,.003)],'long-kangaroo-ear',14);L('cream',[(d*.075,.75,.025),(d*.10,.92,.01)],.01,'pale-inner-ear')
  O('orange',(d*.12,.15,-.015),(.08,.10,.08),'haunch');O('orange',(d*.13,.035,.08),(.055,.035,.14),'long-kangaroo-foot');L('orange',[(d*.10,.44,0),(d*.15,.35,.06),(d*.075,.32,.12)],.022,'short-kangaroo-arm')
 L('orange',[(0,.19,-.08),(.05,.10,-.21),(.17,.025,-.30),(.24,.02,-.28)],.042,'long-support-tail',taper=[1.4,1,.6,.03])
 return leaf_ref('orange kangaroo with long upright ears, cream pouch, powerful haunches, long feet and support tail')
def leaf_shark():
 h=loft('blue',[(0,.02,0,.12,.09),(0,.19,0,.16,.12),(0,.40,0,.18,.13),(0,.60,0,.15,.11),(0,.70,0,.09,.07)],'upright-shark-body',28)
 for d in [-1,1]:
  fin('blue',[(d*.13,.38,0),(d*.28,.46,-.03),(d*.15,.55,0)],'shark-side-fin',.035);eye(d*.06,.59,front_at(h,d*.06,.59)+.002,.027)
 fin('blue',[(0,.30,-.10),(0,.55,-.25),(0,.60,-.08)],'shark-dorsal-fin',.035)
 O('orange',(0,.415,.125),(.145,.105,.018),'orange-grin-lip');O('ink',(0,.42,.146),(.128,.086,.009),'dark-shark-mouth')
 for x in [-.09,-.045,0,.045,.09]:
  fin('paper',[(x-.022,.475,.16),(x+.022,.475,.16),(x,.42,.16)],'upper-shark-tooth',.012);fin('paper',[(x-.022,.365,.16),(x+.022,.365,.16),(x,.415,.16)],'lower-shark-tooth',.012)
 loft('red',[(0,.67,0,.19,.14),(0,.70,0,.19,.14),(0,.72,0,.12,.09),(0,.81,-.01,.115,.085),(0,.83,-.01,.07,.05)],'red-fedora',24)
 return leaf_ref('upright blue loan shark in red fedora, wide orange-edged toothy grin and lateral/dorsal fins')
def leaf_wolf():
 O('grey',(0,.27,-.035),(.13,.12,.19),'wolf-torso')
 for d in [-1,1]:
  for z in [-.15,.09]:L('grey',[(d*.10,.27,z),(d*.10,.06,z+.015)],.023,'wolf-leg');O('grey',(d*.10,.035,z+.035),(.035,.035,.055),'wolf-paw')
 h=loft('grey',[(0,.31,.10,.075,.06),(0,.44,.12,.10,.075),(0,.55,.11,.10,.075),(0,.60,.10,.06,.045)],'wolf-head',22)
 O('grey',(0,.425,.20),(.07,.045,.08),'wolf-long-muzzle');O('ink',(0,.44,.272),(.03,.023,.02),'wolf-nose')
 for d in [-1,1]:
  loft('grey',[(d*.065,.54,.09,.04,.03),(d*.10,.73,.07,.003,.003)],'pointed-wolf-ear',12);eye(d*.05,.52,front_at(h,d*.05,.52)+.001,.024)
  L('paper',[(d*.075,.37,.14),(d*.12,.29,.14),(d*.055,.24,.13)],.028,'pale-chest-ruff',taper=[1,1,.1])
 L('grey',[(0,.31,-.20),(.12,.35,-.29),(.18,.48,-.27)],.033,'raised-wolf-tail',taper=[1,1.2,.1])
 return leaf_ref('grey four-legged wolf with pointed ears, pale chest ruff, black nose and curled raised tail')
def leaf_nepo():
 for x in [-.07,.07]:sole(x,color='pink',w=.04,length=.06)
 loft('paper',[(0,.05,0,.09,.075),(0,.17,0,.14,.10),(0,.24,0,.12,.09)],'leaf-baby-diaper',22)
 torso=loft('pink',[(0,.20,0,.11,.08),(0,.35,0,.12,.09),(0,.43,0,.075,.055)],'leaf-baby-torso',22)
 h=O('pink',(0,.52,0),(.15,.14,.10),'leaf-baby-head');eyes_on(h,.55,.055,.031)
 for d in [-1,1]:O('pink',(d*.145,.52,0),(.035,.04,.025),'baby-ear');L('pink',[(d*.10,.35,0),(d*.19,.29,.03)],.024,'baby-arm')
 O('cream',(0,.465,.105),(.06,.04,.012),'pacifier-shield');L('orange',[(math.cos(i*math.pi/12)*.027,.46+math.sin(i*math.pi/12)*.027,.13)for i in range(25)],.007,'pacifier-ring')
 cap=loft('pink',[(0,.61,0,.15,.105),(0,.65,0,.15,.105),(0,.71,0,.11,.08),(0,.75,0,.04,.03)],'pink-knit-cap',24)
 for x in [-.10,-.05,0,.05,.10]:L('violet',[(x,y,front_at(cap,x,y)+.006)for y in [.63,.66,.68]],.006,'knit-rib')
 L('yellow',[(x,y,front_at(torso,x,y)+.008)for x,y in [(-.09,.38),(-.06,.33),(0,.29),(.06,.33),(.09,.38)]],.009,'gold-necklace');O('yellow',(0,.29,.115),(.027,.027,.01),'gold-medallion')
 return leaf_ref('Leaf-specific pink baby, pink ribbed knit cap, orange pacifier, gold necklace and white diaper; not Second Wind Nepo Baby')
BUILDERS.update({'leaf-catfish':leaf_catfish,'leaf-crash-dummy':leaf_dummy,'leaf-dark-horse':leaf_horse,'leaf-filmmaker':leaf_filmmaker,'leaf-kangaroo':leaf_kangaroo,'leaf-loan-shark':leaf_shark,'leaf-lonely-wolf':leaf_wolf,'leaf-nepo-baby':leaf_nepo})
def leaf_philanthropist():
 for x in [-.065,.065]:sole(x,color='ink');loft('blue',[(x,.04,0,.04,.045),(x,.24,0,.045,.05)],'narrow-trouser',16)
 loft('blue',[(0,.20,0,.11,.075),(0,.39,0,.12,.08),(0,.48,0,.08,.055)],'powder-blue-waistcoat',22)
 fin('paper',[(-.05,.47,.06),(.05,.47,.06),(0,.33,.09)],'shirt-front',.012)
 h=loft('brown',[(0,.46,0,.05,.04),(0,.54,0,.075,.06),(0,.67,0,.075,.065),(0,.73,0,.05,.04)],'narrow-benefactor-head',22);eyes_on(h,.64,.031,.02)
 L('ink',[(-.035,.56,.063),(0,.545,.074),(.035,.56,.063)],.004,'kind-smile')
 loft('blue',[(0,.70,0,.13,.10),(0,.73,0,.13,.10),(0,.75,0,.08,.06),(0,.91,0,.085,.065)],'blue-top-hat',22)
 L('pink',[(-.085,.77,.02),(0,.77,.067),(.085,.77,.02)],.015,'pink-hat-band')
 for d in [-1,1]:L('brown',[(d*.10,.40,0),(d*.18,.32,.025),(d*.23,.40,.07)],.019,'giving-arm');O('brown',(d*.23,.40,.07),(.028,.02,.025),'open-hand')
 O('yellow',(.23,.45,.07),(.04,.045,.012),'held-gold-coin')
 extruded_outline('pink',[(-.23,.415),(-.28,.465),(-.28,.495),(-.25,.515),(-.23,.485),(-.21,.515),(-.18,.495),(-.18,.465)],.025,'held-heart',.07)
 return leaf_ref('narrow brown philanthropist, powder-blue waistcoat/top hat, pink band and held heart/coin')
def leaf_car():
 # Longitudinal axis points +Z in glTF, authored +z before conversion.
 B('red',(0,.15,0),(.27,.16,.43),'formula-chassis')
 loft('red',[(0,.13,.14,.12,.08),(0,.19,.12,.11,.08),(0,.23,.02,.10,.12),(0,.29,-.07,.075,.065)],'tapered-race-body',24)
 B('red',(0,.075,.25),(.43,.035,.085),'front-wing');B('red',(0,.31,-.22),(.42,.035,.08),'rear-spoiler')
 for x in [-.12,.12]:L('red',[(x,.14,-.20),(x,.31,-.20)],.014,'rear-wing-strut')
 for z in [-.15,.16]:L('grey',[(-.19,.095,z),(.19,.095,z)],.014,'car-axle')
 for d in [-1,1]:
  for z in [-.15,.16]:
   K('ink',(d*.19,.095,z),.095,.095,.075,'car-wheel-tire',rot=(0,0,math.pi/2));K('grey',(d*.23,.095,z),.045,.045,.008,'car-wheel-hub',rot=(0,0,math.pi/2))
 B('ink',(0,.26,-.03),(.18,.09,.06),'cockpit-windscreen')
 for x in [-.043,.043]:eye(x,.275,.007,.025)
 fin('yellow',[(-.025,.24,.14),(.025,.24,.14),(.015,.19,.24),(-.015,.19,.24)],'hood-yellow-stripe',.009)
 return leaf_ref('red Formula racing car with four black tyres, front wing, rear spoiler and windshield eyes; no driver or game base added')
def leaf_survivor():
 for x in [-.065,.065]:sole(x,color='orange');L('orange',[(x,.04,0),(x,.23,0)],.022,'survivor-leg')
 body=loft('orange',[(0,.20,0,.10,.075),(0,.37,0,.12,.085),(0,.47,0,.08,.055)],'survivor-torso',22)
 for i in range(12):a=i*math.pi/6;x=math.cos(a)*.12;z=math.sin(a)*.085;fin('green',[(x*.8,.27,z*.8),(x*1.4-.018,.12,z*1.4),(x*1.4+.018,.12,z*1.4)],'grass-skirt-blade',.012)
 h=loft('orange',[(0,.43,0,.06,.05),(0,.51,0,.10,.075),(0,.62,0,.105,.08),(0,.68,0,.06,.05)],'survivor-head',22);eyes_on(h,.59,.04,.023)
 O('brown',(0,.51,.10),(.11,.04,.025),'long-moustache')
 for x in [-.08,-.04,0,.04,.08]:L('yellow',[(x,.54,.122),(x*.85,.48,.125)],.0035,'moustache-stripe')
 loft('green',[(0,.64,0,.14,.10),(0,.68,0,.14,.10),(0,.74,0,.10,.08),(0,.78,0,.04,.035)],'olive-helmet',24)
 L('brown',[(0,.67,.105),(0,.77,.04)],.004,'helmet-seam')
 for d in [-1,1]:L('orange',[(d*.10,.41,0),(d*.18,.33,.025),(d*.20,.45,.07)],.022,'survivor-arm')
 L('brown',[(.23,.01,.07),(.23,.84,.07)],.009,'held-spear-shaft');fin('grey',[(.23,.94,.07),(.19,.81,.07),(.27,.81,.07)],'held-spearhead',.018)
 return leaf_ref('orange survivor, olive helmet, broad striped moustache, grass skirt and spear')
def leaf_sore():
 for d in [-1,1]:sole(d*.085,color='orange');loft('blue',[(d*.08,.04,0,.055,.055),(d*.08,.23,0,.065,.06)],'blue-athletic-short',16)
 body=loft('orange',[(0,.20,0,.13,.10),(0,.34,0,.17,.12),(0,.49,0,.15,.11),(0,.61,0,.12,.085),(0,.70,0,.06,.05)],'angry-athlete-body',26)
 for d in [-1,1]:eye(d*.055,.60,front_at(body,d*.055,.60)+.002,.025);brow_on(body,d*.05,.635,.025,'ink',-d*.010);L('orange',[(d*.14,.40,0),(d*.22,.48,.025),(d*.20,.61,.04)],.031,'raised-athlete-arm');O('orange',(d*.20,.62,.04),(.046,.047,.035),'clenched-fist')
 O('orange',(0,.47,.15),(.11,.10,.09),'enormous-drooping-nose');L('ink',[(-.065,.35,.116),(0,.37,.14),(.065,.35,.116)],.005,'angry-frown')
 return leaf_ref('orange angry athlete, enormous nose, blue shorts and raised clenched fists')
def leaf_spirit():
 body=loft('orange',[(0,.015,0,.10,.07),(0,.12,0,.17,.11),(0,.32,0,.18,.115),(0,.50,0,.13,.09),(0,.64,0,.055,.04)],'living-flame-body',26)
 for x,y in [(-.14,.56),(-.05,.84),(.08,.72),(.16,.60)]:L('orange',[(x*.6,.38,0),(x,.56,-.01),(x*.8,y,-.02)],.045,'curved-flame-tip',taper=[1.5,.8,.03])
 fin('yellow',[(x,y,front_at(body,x,y)+.002)for x,y in [(-.11,.18),(-.08,.37),(-.04,.31),(0,.62),(.07,.35),(.11,.43),(.10,.16)]],'inner-flame',.015)
 for d in [-1,1]:fin('paper',[(x,y,front_at(body,x,y)+.014)for x,y in [(d*.02,.36),(d*.10,.40),(d*.07,.32)]],'narrow-flame-eye',.01);O('ink',(d*.055,.36,front_at(body,d*.055,.36)+.024),(.009,.015,.004),'flame-pupil')
 fin('red',[(x,y,front_at(body,x,y)+.014)for x,y in [(-.09,.23),(-.035,.26),(0,.22),(.04,.27),(.09,.235),(.025,.17),(-.02,.20),(-.05,.17)]],'jagged-flame-mouth',.012)
 return leaf_ref('orange living flame with multiple curved tips, yellow interior, narrow eyes and jagged red mouth; continuous volumetric flame, no humanoid legs')
def leaf_thespian():
 for x in [-.075,.075]:sole(x,color='brown')
 loft('orange',[(0,.06,0,.11,.08),(0,.26,0,.13,.09),(0,.44,0,.10,.07),(0,.49,0,.07,.05)],'actor-tunic',22)
 loft('red',[(0,.06,-.05,.20,.13),(0,.20,-.065,.17,.105),(0,.39,-.045,.14,.09),(0,.48,-.015,.09,.065)],'stage-cape',24)
 ruff((0,.47,.015),.06,.12)
 h=loft('orange',[(0,.48,.02,.055,.045),(0,.55,.02,.10,.075),(0,.67,.01,.11,.08),(0,.73,0,.065,.05)],'actor-head',22);eyes_on(h,.64,.043,.023)
 for x in [-.07,-.025,.025,.07]:L('brown',[(x,.56,.095),(x*.8,.48,.105),(x*.25,.45,.08)],.025,'actor-beard-lock',taper=[1,.8,.03])
 K('yellow',(0,.73,0),.11,.11,.06,'actor-crown-band')
 for i in range(6):a=i*math.pi/3;loft('yellow',[(math.cos(a)*.09,.75,math.sin(a)*.07,.025,.02),(math.cos(a)*.13,.88,math.sin(a)*.10,.003,.003)],'crown-point',10)
 for d in [-1,1]:L('orange',[(d*.10,.41,0),(d*.18,.33,.025),(d*.20,.43,.07)],.025,'actor-arm')
 L('brown',[(.22,.03,.08),(.22,.57,.08)],.009,'held-mask-stick');O('blue',(.22,.58,.08),(.08,.105,.025),'held-tragedy-mask')
 for x in [.19,.25]:L('paper',[(x-.018,.60,.107),(x,.59,.108),(x+.018,.60,.107)],.004,'mask-sad-eye')
 L('paper',[(.18,.53,.107),(.22,.55,.11),(.26,.53,.107)],.005,'mask-frown')
 return leaf_ref('crowned orange stage actor with red cape, white ruff, brown beard and separate blue tragedy mask')
def leaf_toucan():
 loft('pink',[(0,.11,0,.09,.075),(0,.26,-.02,.14,.10),(0,.44,0,.12,.085),(0,.56,.01,.10,.075),(0,.64,0,.05,.04)],'pink-toucan-body',24)
 O('yellow',(0,.51,.07),(.095,.10,.025),'yellow-face-patch')
 for x in [-.04,.04]:eye(x,.56,.095,.022)
 # Oversized beak points forward with two tapered sections, not a flat triangle.
 O('blue',(.02,.49,.17),(.085,.065,.13),'large-blue-beak');O('orange',(.035,.48,.285),(.06,.048,.055),'orange-beak-tip')
 L('ink',[(-.05,.47,.19),(0,.46,.28),(.07,.47,.28)],.004,'beak-seam')
 for d in [-1,1]:
  O('pink',(d*.10,.29,-.005),(.035,.10,.07),'pink-folded-wing');L('ink',[(d*.05,.14,0),(d*.06,.025,.02)],.013,'toucan-leg')
  for dx in [-.025,0,.025]:L('ink',[(d*.06,.02,.025),(d*.06+dx,.01,.08)],.008,'toucan-toe')
 L('pink',[(0,.22,-.07),(0,.13,-.20)],.04,'toucan-tail',taper=[1,.1])
 return leaf_ref('pink toucan, yellow face patch, oversized blue beak with orange tip, dark feet and folded wings')
def leaf_triangle():
 extruded_outline('yellow',[(-.23,.14),(.23,.14),(0,.75)],.16,'triangular-prism-body')
 # Green reverse panel preserves full prism thickness.
 fin('green',[(-.22,.15,-.083),(.22,.15,-.083),(0,.73,-.083)],'green-prism-back',.012)
 for d in [-1,1]:eye(d*.067,.38,.087,.035);L('yellow',[(d*.17,.28,0),(d*.24,.23,.02)],.016,'triangle-arm');L('yellow',[(d*.08,.14,0),(d*.08,.04,.01)],.014,'triangle-leg');sole(d*.08,color='ink',w=.035,length=.06)
 L('ink',[(-.07,.27,.087),(0,.25,.09),(.07,.27,.087)],.004,'triangle-smile')
 for d in [-1,1]:fin('pink',[(0,.20,.092),(d*.06,.23,.092),(d*.06,.17,.092)],'pink-bowtie',.016)
 O('pink',(0,.20,.105),(.014,.014,.01),'bowtie-knot')
 return leaf_ref('solid yellow triangular prism, green reverse/sides, pink bow tie, short limbs and black shoes')
def leaf_zombie():
 for d in [-1,1]:sole(d*.075,color='brown');loft('brown',[(d*.075,.04,0,.045,.05),(d*.075,.25,0,.055,.06)],'zombie-trouser',16)
 loft('blue',[(0,.21,0,.14,.09),(0,.36,0,.13,.085),(0,.48,0,.09,.065)],'torn-blue-shirt',22)
 h=loft('green',[(0,.44,0,.06,.05),(0,.52,0,.105,.08),(0,.66,0,.12,.09),(0,.73,0,.07,.055)],'zombie-head',24)
 for d in [-1,1]:eye(d*.05,.62,front_at(h,d*.05,.62)+.002,.028);L('green',[(d*.10,.42,0),(d*.19,.42,.08),(d*.23,.45,.16)],.022,'outstretched-zombie-arm');O('green',(d*.23,.45,.17),(.03,.025,.025),'zombie-hand')
 O('ink',(0,.525,.09),(.07,.034,.011),'zombie-mouth')
 for x in [-.04,.025]:B('paper',(x,.535,.104),(.024,.02,.011),'uneven-zombie-tooth')
 O('pink',(.035,.735,.015),(.08,.055,.055),'exposed-brain')
 for x in [-.015,.02,.055,.085]:L('violet',[(x,.72,.06),(x-.01,.76,.05),(x,.78,.02)],.005,'brain-fold')
 for x in [-.1,0,.1]:fin('blue',[(x-.025,.25,.08),(x+.025,.25,.08),(x,.18,.07)],'torn-shirt-tab',.014)
 return leaf_ref('green zombie, exposed pink brain patch, torn blue shirt, brown trousers, uneven teeth and outstretched hands')
BUILDERS.update({'leaf-philanthropist':leaf_philanthropist,'leaf-race-car':leaf_car,'leaf-sole-survivor':leaf_survivor,'leaf-sore-loser':leaf_sore,'leaf-spiteful-spirit':leaf_spirit,'leaf-thespian':leaf_thespian,'leaf-toucan':leaf_toucan,'leaf-triangle-man':leaf_triangle,'leaf-zombie':leaf_zombie})
