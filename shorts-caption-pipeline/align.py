import json, numpy as np, wave
U="/mnt/user-data/uploads/Shorts-studio/raws/YesTheory/"
HOP=0.005
def load_db(n):
    w=wave.open(U+f"Clip{n}Audio.wav"); sr=w.getframerate(); ch=w.getnchannels()
    x=np.frombuffer(w.readframes(w.getnframes()),np.int16).reshape(-1,ch).mean(1)/32768
    hop=int(sr*HOP); k=np.ones(hop)/hop
    return 20*np.log10(np.sqrt(np.convolve(x**2,k,'same'))[::hop]+1e-6)
def words(n): return [(d["text"],d["startMs"]/1000,d["endMs"]/1000) for d in json.load(open(U+f"Clip{n}Audio_words.json"))]
def gaps(db,thr=-55,min_len=0.10):
    sil=db<thr; out=[]; i=0; n=len(db)
    while i<n:
        if sil[i]:
            j=i
            while j<n and sil[j]: j+=1
            if (j-i)*HOP>=min_len: out.append((i*HOP,j*HOP))
            i=j
        else: i+=1
    return out

import re
def syl(w):
    w=re.sub(r"[^a-z]","",w.lower())
    if not w: return 1
    g=re.findall(r"[aeiouy]+",w); n=len(g)
    if w.endswith("e") and not w.endswith(("le","ee")) and n>1: n-=1
    if w.endswith(("es","ed")) and n>1 and not w.endswith(("ted","ded","ses","ces","ges","zes")): n-=1
    return max(1,n)
def bursts(db,gap_thr=-55,min_gap=0.10,min_burst=0.06):
    sil=db<gap_thr; n=len(db); out=[]; i=0
    while i<n:
        if not sil[i]:
            j=i
            while j<n:
                if sil[j]:
                    k=j
                    while k<n and sil[k]: k+=1
                    if (k-j)*HOP>=min_gap or k>=n: break
                    j=k
                else: j+=1
            if (j-i)*HOP>=min_burst: out.append((i*HOP,j*HOP))
            i=j
        else: i+=1
    return out
def assign(W,B,force=()):
    n=len(W); m=len(B)
    S=[syl(w[0]) for w in W]; cs=np.cumsum([0]+S)
    speech=sum(z-a for a,z in B); tau=speech/max(1,cs[-1])
    wc=[(w[1]+w[2])/2 for w in W]
    INF=1e18; MAXW=50
    FS=set(force)
    def cost(j,i,k):  # words i..k-1 in burst j
        if any(i<x<k for x in FS): return 1e6
        a,z=B[j]; D=z-a; Sy=cs[k]-cs[i]; exp=0.08+Sy*tau
        c=((D-exp)/(0.30*exp+0.08))**2
        d=W[k-1][2]-z                       # last word's whisper end vs burst end
        c+=2.0*((max(0,-d-0.15)/0.15)**2+(max(0,d-0.5)/0.3)**2)
        late=W[i][1]-a                      # first word's whisper start vs burst onset
        c+=1.0*(max(0,late-0.15)/0.15)**2
        for x in range(i,k-1):
            t=W[x][0]
            if t[-1:] in '.?!': c+=2.5
            elif t[-1:]==',': c+=0.8
        return c
    dp=np.full((m+1,n+1),INF); bk=np.zeros((m+1,n+1),int); dp[0][0]=0
    for j in range(m):
        for i in range(n+1):
            if dp[j][i]>=INF: continue
            # burst j may take 0 words (noise) if short
            if (B[j][1]-B[j][0])<0.12:
                c=dp[j][i]+2.0
                if c<dp[j+1][i]: dp[j+1][i]=c; bk[j+1][i]=i
            for k in range(i+1,min(n,i+MAXW)+1):
                c=dp[j][i]+cost(j,i,k)
                if c<dp[j+1][k]: dp[j+1][k]=c; bk[j+1][k]=i
    # backtrack
    out=[]; k=n
    for j in range(m,0,-1):
        i=bk[j][k]; out.append((j-1,i,k)); k=i
    out.reverse(); return out,tau,dp[m][n]
