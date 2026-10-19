import subprocess, numpy as np, sys, json
sys.path.insert(0,'.')
from align import load_db, HOP
fps=24000/1001
def events(path):
    raw=subprocess.run(["ffmpeg","-v","error","-i",path,"-vf","crop=1080:240:0:1320,scale=540:120","-f","rawvideo","-pix_fmt","rgb24","-"],capture_output=True).stdout
    fr=np.frombuffer(raw,np.uint8).reshape(-1,120,540,3).astype(int)
    r,g,b=fr[...,0],fr[...,1],fr[...,2]
    M=((r>225)&(g>225)&(b>225))|((r>225)&(g>170)&(b<110))
    cnt=M.sum((1,2)); ev=[]; prev=None
    for i in range(len(M)):
        on=cnt[i]>120
        if on and (prev is None or (M[i]&M[i-1]).sum()/max(1,(M[i]|M[i-1]).sum())<0.55): ev.append(i/fps)
        prev=on
    return ev
def check(n,path,log):
    db=load_db(n); ev=events(path)
    exp=[ts for (_,ts,_,_) in log]; bad=[]
    # match each expected onset to the first event at/after ts-0.05
    used=0; rows=[]
    for (old,ts,txt,un) in log:
        e=next((x for x in ev if x>=ts-0.05 and x<ts+0.30),None)
        if e is None: rows.append((txt,ts,None,'NO EVENT')); continue
        # audio state at the moment caption is first visible
        i0=int(e/HOP); win=db[i0:i0+int(0.06/HOP)]
        sil=(win.max()<-55)
        # distance to next speech onset if in silence
        nxt=None
        if sil:
            j=i0
            while j<len(db) and db[j]<-55: j+=1
            nxt=j*HOP-e
        rows.append((txt,ts,e,'IN PAUSE (+%.2fs to speech)'%nxt if sil else 'ok'))
    return rows,ev
if __name__=="__main__":
    n=int(sys.argv[1]); path=sys.argv[2]
    import clipcfg, captimes
    new,log,_=captimes.retime(n,clipcfg.CFG[n]["caps"])
    rows,ev=check(n,path,log)
    bad=[r for r in rows if r[3]!='ok' and not (r[3].startswith('IN PAUSE') and float(r[3].split('+')[1].split('s')[0])<=0.08)]
    print(f"clip {n}: {len(rows)} captions, {len(ev)} events, {len(bad)} problems")
    for r in bad: print("  PROBLEM",r)
