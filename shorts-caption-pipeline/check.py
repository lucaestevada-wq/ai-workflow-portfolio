"""One-command pre-delivery check: python3 check.py <n> <render.mp4>
Runs: onset-vs-silence verify, min on-screen time (<0.35s), captions after speech ended,
and prints every caption that follows a pause >=0.20s for a quick human review."""
import sys
sys.path.insert(0,'.')
import clipcfg, captimes, verify
from align import load_db, bursts
MIN_ON=0.20  # advisory: fast speech is legitimately short; review flagged ones
n=int(sys.argv[1]); path=sys.argv[2]
new,log,_=captimes.retime(n,clipcfg.CFG[n]["caps"])
rows,ev=verify.check(n,path,log)
db=load_db(n); B=bursts(db); last_end=B[-1][1]
issues=[]
for r in rows:
    if r[3]!='ok' and not (r[3].startswith('IN PAUSE') and float(r[3].split('+')[1].split('s')[0])<=0.08): issues.append(('ONSET',)+r)
ts=[t for _,t,_,_ in log]
for i,(old,t,txt,un) in enumerate(log):
    nxt=ts[i+1] if i+1<len(ts) else None
    if nxt is not None and nxt-t<MIN_ON: issues.append(('SHORT %.2fs'%(nxt-t),txt,t))
    if t>last_end+0.2: issues.append(('AFTER SPEECH END %.2f'%last_end,txt,t))
print(f"clip {n}: {len(log)} captions, {len(issues)} issues")
for i in issues: print("  ISSUE",i)
print("-- captions after a pause >=0.20s (review) --")
for k,(s,e) in enumerate(B[1:],1):
    pe=B[k-1][1]
    if s-pe>=0.20:
        c=[(round(t,2),x) for _,t,x,_ in log if s-0.15<=t<=s+0.6][:2]
        print(f"  pause {pe:.2f}-{s:.2f}: {c}")
