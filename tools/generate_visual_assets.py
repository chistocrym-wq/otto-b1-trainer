from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
import hashlib, random, math

W,H=1280,720
PALETTE={
 "sky":(222,239,255),"sky2":(239,248,255),"navy":(29,74,119),"blue":(72,139,202),
 "mid":(139,188,232),"pale":(208,230,249),"cream":(250,248,241),"green":(126,178,159),
 "coral":(220,145,132),"gold":(224,185,103),"ink":(40,65,90),"white":(252,254,255)
}
TOPIC_KIND={"Nachbarschaft":"neighborhood","Sprachcafé":"cafe","Fahrrad":"bicycle","Kochen":"cooking","Bücher":"books","Sport":"sport","Repair-Café":"repair","Fotografie":"photo","Ehrenamt":"volunteer","Reisen":"travel"}

def _seed(value):
 return int(hashlib.sha256(str(value).encode("utf-8")).hexdigest()[:12],16)

def _gradient():
 im=Image.new("RGB",(W,H),PALETTE["sky"]);px=im.load()
 for y in range(H):
  t=y/(H-1);a=PALETTE["sky2"];b=PALETTE["pale"]
  col=tuple(int(a[i]*(1-t)+b[i]*t) for i in range(3))
  for x in range(W):px[x,y]=col
 return im

def _shadow(base,box,radius=28,blur=18,alpha=52):
 layer=Image.new("RGBA",base.size,(0,0,0,0));d=ImageDraw.Draw(layer)
 x0,y0,x1,y1=box;d.rounded_rectangle((x0+8,y0+12,x1+8,y1+12),radius,fill=(31,75,116,alpha))
 layer=layer.filter(ImageFilter.GaussianBlur(blur));base.alpha_composite(layer)

def _person(d,x,y,scale,shirt,hair=(63,70,79)):
 d.ellipse((x-25*scale,y-118*scale,x+25*scale,y-68*scale),fill=(238,196,168))
 d.pieslice((x-27*scale,y-123*scale,x+27*scale,y-72*scale),180,355,fill=hair)
 d.rounded_rectangle((x-48*scale,y-72*scale,x+48*scale,y+30*scale),int(18*scale),fill=shirt)
 d.line((x-22*scale,y+28*scale,x-34*scale,y+94*scale),fill=PALETTE["ink"],width=max(3,int(8*scale)))
 d.line((x+22*scale,y+28*scale,x+34*scale,y+94*scale),fill=PALETTE["ink"],width=max(3,int(8*scale)))

def _room(d,rng):
 d.rounded_rectangle((95,105,1185,610),42,fill=(249,252,255),outline=(182,210,235),width=3)
 d.rectangle((95,510,1185,610),fill=(225,235,243))
 for x in (180,940):
  d.rounded_rectangle((x,160,x+150,330),18,fill=(209,232,250),outline=(158,195,226),width=3)
  d.line((x+75,160,x+75,330),fill=(158,195,226),width=3)

def _topic_objects(d,kind,rng):
 if kind=="neighborhood":
  for i,x in enumerate((260,480,700,920)):
   h=rng.randint(140,220);d.rounded_rectangle((x,430-h,x+150,430),14,fill=(180+i*8,211,237),outline=(126,174,214),width=3)
   d.polygon((x-15,430-h,x+75,360-h,x+165,430-h),fill=(90,142,191))
   for wx in (x+32,x+92):d.rounded_rectangle((wx,455-h,wx+28,495-h),5,fill=(247,252,255))
  d.rectangle((80,430,1200,590),fill=(171,208,191))
 elif kind=="cafe":
  _room(d,rng);d.ellipse((430,385,850,505),fill=(187,147,107));d.rectangle((620,500,655,610),fill=(116,90,72))
  for x in (500,615,730):d.ellipse((x,420,x+45,447),fill=(247,252,255),outline=(119,156,188),width=3)
 elif kind=="bicycle":
  d.rectangle((0,505,W,H),fill=(174,211,190));d.rectangle((0,425,W,515),fill=(203,218,229))
  for cx in (500,735):d.ellipse((cx-110,360,cx+10,480),outline=PALETTE["navy"],width=10)
  d.line((500,420,610,335,735,420,555,420,625,420),fill=PALETTE["blue"],width=12);d.line((610,335,670,420),fill=PALETTE["blue"],width=12)
 elif kind=="cooking":
  _room(d,rng);d.rounded_rectangle((280,390,1000,560),24,fill=(215,229,239))
  for x,col in [(430,PALETTE["coral"]),(590,PALETTE["gold"]),(750,PALETTE["green"])]:d.ellipse((x,410,x+100,485),fill=col)
  d.rounded_rectangle((335,180,480,350),15,fill=(179,211,237));d.rounded_rectangle((805,180,950,350),15,fill=(179,211,237))
 elif kind=="books":
  _room(d,rng)
  for x in (220,830):
   d.rounded_rectangle((x,180,x+210,500),18,fill=(159,190,215))
   yy=220
   for _ in range(5):
    for j in range(4):d.rounded_rectangle((x+22+j*42,yy,x+52+j*42,yy+38),5,fill=rng.choice([PALETTE["blue"],PALETTE["green"],PALETTE["gold"],PALETTE["coral"]]))
    yy+=52
 elif kind=="sport":
  d.rectangle((0,470,W,H),fill=(176,211,190));d.rounded_rectangle((250,150,1030,535),36,fill=(221,238,251),outline=(145,188,223),width=4)
  d.line((640,160,640,530),fill=(255,255,255),width=8);d.ellipse((560,285,720,445),outline=(255,255,255),width=8);d.ellipse((730,210,805,285),fill=PALETTE["coral"])
 elif kind=="repair":
  _room(d,rng);d.rounded_rectangle((250,410,1030,545),20,fill=(188,164,137))
  for x in (390,570,750):d.line((x,360,x+60,450),fill=PALETTE["navy"],width=12);d.ellipse((x-16,345,x+22,383),fill=PALETTE["gold"])
  d.rounded_rectangle((870,320,965,420),12,fill=PALETTE["coral"])
 elif kind=="photo":
  d.rectangle((0,470,W,H),fill=(175,210,190));d.ellipse((1080,85,1190,195),fill=(255,224,150))
  d.rounded_rectangle((480,300,800,495),28,fill=(65,94,124));d.ellipse((570,325,720,475),fill=(178,216,243),outline=(240,250,255),width=16);d.rectangle((555,265,665,315),fill=(65,94,124))
 elif kind=="volunteer":
  _room(d,rng);d.rounded_rectangle((300,350,980,540),24,fill=(205,226,241))
  for x,col in [(360,PALETTE["coral"]),(525,PALETTE["gold"]),(690,PALETTE["green"]),(855,PALETTE["blue"])]:d.rounded_rectangle((x,385,x+90,480),12,fill=col)
  d.ellipse((565,175,715,325),fill=(225,149,142));d.polygon((640,210,605,255,640,300,675,255),fill=(250,245,239))
 else:
  d.rectangle((0,475,W,H),fill=(177,211,191));d.rounded_rectangle((205,300,1075,485),36,fill=(230,239,246))
  d.rounded_rectangle((300,210,660,420),24,fill=(137,183,218));d.ellipse((830,240,995,405),fill=(246,250,253),outline=(110,159,201),width=9)
  d.line((650,345,880,345),fill=PALETTE["navy"],width=9)

def generate_context_asset(path,scene,variant=0):
 path=Path(path);path.parent.mkdir(parents=True,exist_ok=True);rng=random.Random(_seed(f"{scene}:{variant}"))
 base=_gradient().convert("RGBA");d=ImageDraw.Draw(base)
 for _ in range(7):
  x=rng.randint(-80,W);y=rng.randint(30,390);r=rng.randint(45,120);d.ellipse((x-r,y-r,x+r,y+r),fill=(*rng.choice([PALETTE["mid"],PALETTE["pale"],(196,221,242)]),45))
 _topic_objects(d,TOPIC_KIND.get(scene,"travel"),rng)
 _person(d,190+rng.randint(-25,35),505,0.72,rng.choice([PALETTE["blue"],PALETTE["coral"],PALETTE["green"]]))
 _person(d,1090+rng.randint(-35,25),515,0.68,rng.choice([PALETTE["navy"],PALETTE["gold"],PALETTE["green"]]),hair=(106,77,58))
 overlay=Image.new("RGBA",(W,H),(255,255,255,0));od=ImageDraw.Draw(overlay);od.rounded_rectangle((38,38,W-38,H-38),46,outline=(255,255,255,175),width=3)
 base=Image.alpha_composite(base,overlay).convert("RGB");base.save(path,"WEBP",quality=86,method=6)

CAST={
 "lena":((238,196,168),(80,58,48),(72,143,204)),
 "paul":((224,181,148),(63,55,49),(38,78,117)),
 "moderatorin":((205,157,128),(45,42,40),(123,171,156)),
 "person-a":((241,201,174),(131,88,55),(218,145,132)),
 "person-b":((187,137,107),(39,37,35),(224,185,103)),
}
def generate_portrait(path,key):
 skin,hair,shirt=CAST[key];path=Path(path);path.parent.mkdir(parents=True,exist_ok=True)
 im=Image.new("RGB",(420,420),PALETTE["sky2"]).convert("RGBA");d=ImageDraw.Draw(im)
 d.ellipse((54,54,366,366),fill=(215,235,251));d.ellipse((135,82,285,232),fill=skin);d.pieslice((128,68,292,220),180,355,fill=hair)
 d.rounded_rectangle((95,225,325,390),52,fill=shirt);d.ellipse((170,145,182,157),fill=PALETTE["ink"]);d.ellipse((238,145,250,157),fill=PALETTE["ink"]);d.arc((181,155,241,205),10,170,fill=(150,88,80),width=4)
 im.convert("RGB").save(path,"WEBP",quality=88,method=6)
def generate_portrait_assets(root):
 root=Path(root)
 for key in CAST:generate_portrait(root/"assets"/"images"/"speakers"/f"{key}.webp",key)
