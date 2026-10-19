import os, sys, subprocess, numpy as np, cv2, random
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from clipcfg import CFG
n=int(sys.argv[1]); cfg=CFG[n]
import os as _os
F=_os.environ.get("FONTS") or (_os.path.join(_os.path.dirname(_os.path.abspath(__file__)),"fonts")+"/")  # put Mont900.ttf (Montserrat Black) in ./fonts or set FONTS=dir
U="/mnt/user-data/uploads/Shorts-studio/raws/YesTheory/"
V=U+f"Clip{n}Visuals.mp4"; A=U+f"Clip{n}Audio.wav"
FPS=24000/1001; NTOT=int(round(cfg["dur"]*FPS)); N=int(os.environ.get("NF",NTOT)); N0=int(os.environ.get("N0",0))
OUT=os.environ.get("OUT",f"clip{n}_full.mp4")
Y=(255,201,5); WHITE=(255,255,255); DELAY=0.02
from captimes import retime
def font(nm,s): return ImageFont.truetype(F+nm,s)
def eob(x,c=1.70158):
    x=min(max(x,0),1); return 1+(c+1)*(x-1)**3+c*(x-1)**2
def chunk_layer(words,emph):
    fb=lambda w:font("Mont900.ttf",96 if w==emph else 68)
    d=ImageDraw.Draw(Image.new("RGB",(10,10))); gap=22
    ws=[d.textlength(w,font=fb(w)) for w in words]; W=int(sum(ws)+gap*(len(ws)-1)+160); H=220
    lay=Image.new("RGBA",(W,H),(0,0,0,0)); sh=Image.new("RGBA",(W,H),(0,0,0,0)); sd=ImageDraw.Draw(sh); ld=ImageDraw.Draw(lay); x=80
    for w,wd in zip(words,ws):
        sd.text((x+3,155),w,font=fb(w),fill=(0,0,0,235),anchor="ls")
        ld.text((x,150),w,font=fb(w),fill=(Y if w==emph else WHITE)+(255,),anchor="ls"); x+=wd+gap
    sh2=sh.filter(ImageFilter.GaussianBlur(16)); sh2.putalpha(sh2.getchannel("A").point(lambda v:min(255,int(v*1.6))))
    sh=sh.filter(ImageFilter.GaussianBlur(5)); sh2.alpha_composite(sh); sh=sh2; sh.alpha_composite(lay)
    if W>1040: sh=sh.resize((1040,int(H*1040/W)),Image.BICUBIC)
    return sh
def paper_tag(text,sub,seed=3):
    d=ImageDraw.Draw(Image.new("RGB",(10,10))); f1=font("Elite.ttf",58); f2=font("Caveat700.ttf",52)
    w=int(max(d.textlength(text,font=f1),d.textlength(sub,font=f2))+96); h=178; rng=random.Random(seed)
    m=Image.new("L",(w+40,h+40),0); md=ImageDraw.Draw(m); pts=[]
    for i in range(41): pts.append((20+w*i/40,20+rng.uniform(-6,6)))
    for i in range(21): pts.append((20+w+rng.uniform(-6,6),20+h*i/20))
    for i in range(41): pts.append((20+w-w*i/40,20+h+rng.uniform(-6,6)))
    for i in range(21): pts.append((20+rng.uniform(-6,6),20+h-h*i/20))
    md.polygon(pts,fill=255)
    nz=cv2.GaussianBlur(np.random.default_rng(seed).normal(0,1,(h+40,w+40)),(0,0),2.5)
    paper=np.clip(232+nz*14,190,250).astype(np.uint8)
    cr=np.zeros_like(paper,dtype=np.float32); cv2.line(cr,(0,int(h*0.62)),(w+40,int(h*0.4)),1,2); cr=cv2.GaussianBlur(cr,(0,0),3)
    paper=np.clip(paper-cr*40,0,255).astype(np.uint8)
    tag=Image.merge("RGBA",[Image.fromarray(paper)]*3+[m]); td=ImageDraw.Draw(tag)
    td.text((46,46),text,font=f1,fill=(25,25,25,255)); td.text((48,116),sub,font=f2,fill=(60,60,60,255)); return tag
def tag_frame(tag,rot):
    t=tag.rotate(rot,expand=True,resample=Image.BICUBIC); a=t.getchannel("A")
    sh=Image.new("RGBA",t.size,(0,0,0,0)); sh.putalpha(a.point(lambda v:int(v*0.5))); sh=sh.filter(ImageFilter.GaussianBlur(9))
    out=Image.new("RGBA",(t.width+40,t.height+40),(0,0,0,0)); out.alpha_composite(sh,(14,20)); out.alpha_composite(t,(0,0)); return out
def comp(base,lay,cx,cy,alpha=1.0):
    if alpha<1: lay=lay.copy(); lay.putalpha(lay.getchannel("A").point(lambda v:int(v*alpha)))
    base.alpha_composite(lay,(int(cx-lay.width/2),int(cy-lay.height/2)))
_new,_log,_=retime(n,cfg["caps"]); caps=[(t,chunk_layer(w,e),h) for t,w,e,h in _new]
tags=[(a+DELAY,b,paper_tag(tx,sb,seed=3+i)) for i,(a,b,tx,sb) in enumerate(cfg["tags"])]
# per-frame crop params
cx=np.zeros(NTOT); CH=np.full(NTOT,1080.0); Y0=np.full(NTOT,-1.0); MODE=np.zeros(NTOT,np.int8)
for sg in cfg["segs"]:
    a=int(round(sg["t0"]*FPS)); b=min(NTOT,int(round(sg["t1"]*FPS)))
    ts=[k[0] for k in sg["kf"]]; xs=[k[1] for k in sg["kf"]]
    for i in range(a,b):
        t=i/FPS; u=(i-a)/max(1,b-a-1)
        cx[i]=np.interp(t,ts,xs); CH[i]=sg["ch"]/(1+sg["push"]*u); Y0[i]=sg["y0"] if sg["y0"] is not None else -1; MODE[i]=1 if sg["mode"]=="fit" else 0
# luma (black frames)
raw=subprocess.run(["ffmpeg","-v","error","-i",V,"-vf","scale=160:90,format=gray","-f","rawvideo","-"],capture_output=True).stdout
LUM=np.frombuffer(raw,np.uint8).reshape(-1,90,160).mean((1,2)); BLACK=LUM<20
# grade
yy,xx=np.mgrid[0:1920,0:1080]; r=np.sqrt(((xx-540)/540)**2+((yy-960)/960)**2); VIG=(1-0.28*np.clip(r-0.55,0,1)**1.5).astype(np.float32)[...,None]
NOI=[np.random.default_rng(s).normal(0,0.020,(1920,1080,1)).astype(np.float32) for s in range(5)]
def grade(a,i):
    a=a.astype(np.float32)/255; a=np.clip((a-0.5)*1.08+0.5,0,1); a[...,0]*=1.03; a[...,2]*=0.95
    l=a.mean(2,keepdims=True); a=l+(a-l)*0.92; a*=VIG; a+=NOI[i%5]
    return (np.clip(a,0,1)*255).astype(np.uint8)
def crop(fr,i):
    ch=CH[i]; cw=ch*1080/1920; x0=min(max(cx[i]-cw/2,0),1920-cw)
    y0=Y0[i] if Y0[i]>=0 else (1080-ch)/2; s=1920/ch
    return cv2.warpAffine(fr,np.float32([[s,0,-x0*s],[0,s,-y0*s]]),(1080,1920),flags=cv2.INTER_CUBIC)
def fit(fr):
    bg=cv2.warpAffine(fr,np.float32([[1920/1080,0,-(960-303.75)*1920/1080],[0,1920/1080,0]]),(1080,1920),flags=cv2.INTER_LINEAR)
    bg=(cv2.GaussianBlur(bg,(0,0),22).astype(np.float32)*0.5).astype(np.uint8)
    fg=cv2.resize(fr,(1080,608),interpolation=cv2.INTER_AREA); bg[656:656+608]=fg; return bg
cmd_in=["ffmpeg","-v","error"]+([ "-ss",f"{N0/FPS:.4f}"] if N0 else [])+["-i",V,"-f","rawvideo","-pix_fmt","rgb24","-"]
rd=subprocess.Popen(cmd_in,stdout=subprocess.PIPE)
wr=subprocess.Popen(["ffmpeg","-v","error","-y","-f","rawvideo","-pix_fmt","rgb24","-s","1080x1920","-r","24000/1001","-i","-"]+([ "-ss",f"{N0/FPS:.4f}"] if N0 else [])+["-i",A,
  "-c:v","libx264","-preset","medium","-crf","23","-pix_fmt","yuv420p","-r","24000/1001","-c:a","aac","-b:a","192k","-movflags","+faststart","-shortest",OUT],stdin=subprocess.PIPE)
for i in range(N0,N):
    t=i/FPS; b=rd.stdout.read(1920*1080*3)
    if len(b)<1920*1080*3: break
    fr=np.frombuffer(b,np.uint8).reshape(1080,1920,3).copy()
    out=fit(fr) if MODE[min(i,NTOT-1)] else crop(fr,min(i,NTOT-1))
    base=Image.fromarray(grade(out,i)).convert("RGBA")
    blk=bool(BLACK[min(i,len(BLACK)-1)])
    for (a,bb,tg) in tags:
        if a<=t<bb+0.2 and not blk:
            u=t-a; dy=-70*(1-eob(u/0.30)); rot=-3-7*(1-eob(u/0.35)); al=min(1,u/0.10)*(1-min(1,max(0,(t-(bb-0.15))/0.2)))
            comp(base,tag_frame(tg,rot),540,1262+dy,al)
    cur=None
    for k,(s0,lay,h) in enumerate(caps):
        nxt=caps[k+1][0] if k+1<len(caps) else 1e9
        if s0<=t<min(nxt,s0+h): cur=(s0,lay)
    if cur and not blk:
        u=t-cur[0]; sc=0.80+0.20*eob(u/0.20); lay=cur[1]; lay=lay.resize((int(lay.width*sc),int(lay.height*sc)),Image.BICUBIC)
        comp(base,lay,540,1440,min(1,u/0.06))
    wr.stdin.write(np.asarray(base.convert("RGB")).tobytes())
    if i%60==0: print(i,flush=True)
wr.stdin.close(); wr.wait(); rd.stdout.close(); print("done")
