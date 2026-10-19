import re, difflib, numpy as np
from align import *
def norm(t): return re.sub(r"[^a-z0-9]","",t.lower())
def dips(db, lo, hi):
    """energy minima (word boundaries) inside burst [lo,hi]"""
    i0=int(lo/HOP); i1=int(hi/HOP); seg=np.maximum(db[i0:i1],-70.0)
    sm=np.convolve(seg,np.ones(4)/4,'same'); out=[]
    for k in range(8,len(sm)-8):
        if sm[k]==sm[k-8:k+9].min() and (sm[k-8:k+9].max()-sm[k])>=5: out.append((i0+k)*HOP)
    return out
FORCE={3:[('in',27.1),('and',38.6)]}
def word_starts(n):
    db=load_db(n); W=words(n); B=bursts(db)
    fi=[min(range(len(W)),key=lambda x:abs(W[x][1]-t)+(0 if norm(W[x][0])==norm(tx) else 9)) for tx,t in FORCE.get(n,[])]
    # drop isolated stray blips (breaths/clicks): <0.20s and >=0.8s from neighbours
    keep=[]
    for j,(a,z) in enumerate(B):
        gb=a-B[j-1][1] if j>0 else 9; ga=B[j+1][0]-z if j+1<len(B) else 9
        if not ((z-a)<0.20 and gb>=0.8 and ga>=0.8): keep.append((a,z))
    B=keep
    asg,tau,cost=assign(W,B,fi)
    st=[None]*len(W); burst_of=[None]*len(W)
    for j,i,k in asg:
        a,z=B[j]; D=dips(db,a,z); prev=a
        for x in range(i,k):
            burst_of[x]=j
            if x==i: s=a
            else:
                raw=W[x][1]
                if raw<a-0.10 or raw>z+0.10:      # whisper time outside the burst -> unusable, go proportional
                    tot=sum(syl(W[y][0]) for y in range(i,k)); pre=sum(syl(W[y][0]) for y in range(i,x))
                    raw=a+(z-a)*pre/max(1,tot)
                s=min(max(raw,prev+0.05),z-0.04)
                near=[d for d in D if abs(d-s)<=0.10 and d>prev+0.04]
                if near: s=min(near,key=lambda d:abs(d-s))
            st[x]=s; prev=s
    return W,B,st,burst_of,cost
def match(cfg_tokens, W):
    wn=[norm(w[0]) for w in W]; out=[None]*len(cfg_tokens); p=0; skip=False
    for i,t in enumerate(cfg_tokens):
        if skip: skip=False; continue
        tn=norm(t); best=None
        for q in range(p,min(len(W),p+8)):
            r=difflib.SequenceMatcher(None,tn,wn[q]).ratio()
            if r>=0.75 and (best is None or r>best[0]+1e-9): best=(r,q)
            if r>=0.99: break
        if best:
            out[i]=best[1]; p=best[1]+1
            if tn=='going' and wn[best[1]]=='gonna' and i+1<len(cfg_tokens) and norm(cfg_tokens[i+1])=='to': out[i+1]=best[1]; skip=True
        elif tn=='going':
            for q in range(p,min(len(W),p+8)):
                if wn[q]=='gonna':
                    out[i]=q; p=q+1
                    if i+1<len(cfg_tokens) and norm(cfg_tokens[i+1])=='to': out[i+1]=q; skip=True
                    break
    return out
BIAS={1:0.10}
def retime(n, caps, lead=0.04, gapmin=0.20):
    W,B,st,bo,cost=word_starts(n)
    toks=[]; owner=[]
    for ci,(t,words_,e,h) in enumerate(caps):
        if isinstance(t,tuple): continue
        for w in words_: toks.append(w); owner.append(ci)
    mp=match(toks,W); new=[]; log=[]
    for ci,(t,words_,e,h) in enumerate(caps):
        if isinstance(t,tuple):          # absolute, hand-verified onset
            new.append((t[1]-lead,list(words_),e,h)); log.append((t[1],t[1]-lead,' '.join(words_),False)); continue
        idx=[k for k,o in enumerate(owner) if o==ci]
        # group tokens into sub-chunks split at real pauses
        groups=[[idx[0]]]
        for k in idx[1:]:
            pk=groups[-1][-1]
            if mp[k] is not None and mp[pk] is not None and bo[mp[k]]!=bo[mp[pk]]:
                gap=B[bo[mp[k]]][0]-B[bo[mp[pk]]][1]
                if gap>=gapmin: groups.append([k]); continue
            groups[-1].append(k)
        for g in groups:
            ws=[toks[k] for k in g]; first=next((mp[k] for k in g if mp[k] is not None),None)
            em=e if (e is not None and e in ws) else None
            ts=(st[first]-lead+(BIAS.get(n,0) if abs(st[first]-B[bo[first]][0])>1e-6 else 0)) if first is not None else t
            ts=max(ts,0.12)
            new.append((ts,ws,em,h)); log.append((t,ts,' '.join(ws),first is None))
    for k in range(1,len(new)):
        if new[k][0]<new[k-1][0]+0.06: new[k]=(new[k-1][0]+0.06,)+new[k][1:]
    return new,log,(W,B,st,bo)
