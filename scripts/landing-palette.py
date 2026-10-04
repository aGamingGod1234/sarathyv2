# Generates the OKLCH colour scales used in components/landing/tokens.css.
# Run: python scripts/landing-palette.py  (prints each scale and the WCAG contrast checks).
import math, json
def oklch_to_srgb(L,C,h):
    a=C*math.cos(math.radians(h)); b=C*math.sin(math.radians(h))
    l_=L+0.3963377774*a+0.2158037573*b; m_=L-0.1055613458*a-0.0638541728*b; s_=L-0.0894841775*a-1.2914855480*b
    l,m,s=l_**3,m_**3,s_**3
    r=4.0767416621*l-3.3077115913*m+0.2309699292*s
    g=-1.2684380046*l+2.6097574011*m-0.3413193965*s
    bb=-0.0041960863*l-0.7034186147*m+1.7076147010*s
    return r,g,bb
def inside(rgb): return all(-1e-4<=c<=1+1e-4 for c in rgb)
def gamma(c):
    c=min(1,max(0,c)); return 12.92*c if c<=0.0031308 else 1.055*c**(1/2.4)-0.055
def to_hex(L,C,h):
    # reduce chroma until the colour fits sRGB (keeps lightness and hue fixed)
    while C>0 and not inside(oklch_to_srgb(L,C,h)): C-=0.002
    r,g,b=oklch_to_srgb(L,C,h)
    return '#%02x%02x%02x'%tuple(round(gamma(x)*255) for x in (r,g,b)), round(C,3)
def lum(hexc):
    v=[int(hexc[i:i+2],16)/255 for i in (1,3,5)]
    v=[x/12.92 if x<=0.04045 else ((x+0.055)/1.055)**2.4 for x in v]
    return 0.2126*v[0]+0.7152*v[1]+0.0722*v[2]
def cr(a,b):
    la,lb=sorted([lum(a),lum(b)],reverse=True); return (la+0.05)/(lb+0.05)

# One shared lightness ramp so every family's 600 carries the same visual weight.
steps=[50,100,200,300,400,500,600,700,800,900,950]
Ls  =[0.985,0.962,0.922,0.865,0.785,0.705,0.625,0.535,0.43,0.33,0.235]
# chroma envelope: peaks mid-scale, tapers at the light and dark ends
env =[0.10,0.20,0.38,0.62,0.86,1.00,0.98,0.90,0.78,0.64,0.52]
families={
 'orange':(47.6,0.19),   # brand saffron, 500 ~= #F97316
 'ink':   (284,0.115),   # deep indigo ink: split complement of orange (replaces plum 310)
 'teal':  (192,0.12),    # other split complement: positive / safe
 'amber': (82,0.165),    # caution, yellower than the brand orange so they never read alike
 'rose':  (12,0.2),      # negative, redder and deeper than the brand orange
 'slate': (284,0.012),   # neutrals tinted toward the ink hue
}
out={}
for name,(h,cmax) in families.items():
    out[name]={}
    for s,L,e in zip(steps,Ls,env):
        hexc,c=to_hex(L,cmax*e if name!='slate' else cmax*(0.6+0.4*e),h)
        out[name][s]=hexc
# deepest ink for dark sections
out['ink'][975]=to_hex(0.18,0.07,284)[0]
out['slate'][25]=to_hex(0.993,0.003,284)[0]
json.dump(out,open("landing-palette.json","w"),indent=1)
for n,sc in out.items(): print(n.ljust(6),' '.join(f'{k}:{v}' for k,v in sc.items()))
W='#ffffff'
print('\ncontrast checks')
checks=[('text ink-950 on slate-50',out['ink'][950],out['slate'][50]),
('muted slate-600 on slate-50',out['slate'][600],out['slate'][50]),
('muted slate-600 on white',out['slate'][600],W),
('accent-text orange-700 on slate-50',out['orange'][700],out['slate'][50]),
('ink-950 on orange-500 (button)',out['ink'][950],out['orange'][500]),
('white on orange-500',W,out['orange'][500]),
('slate-50 on ink-975',out['slate'][50],out['ink'][975]),
('ink-300 on ink-975 (muted dark)',out['ink'][300],out['ink'][975]),
('ink-400 on ink-950',out['ink'][400],out['ink'][950]),
('orange-400 on ink-975',out['orange'][400],out['ink'][975]),
('teal-700 on teal-100',out['teal'][700],out['teal'][100]),
('rose-700 on rose-100',out['rose'][700],out['rose'][100]),
('amber-800 on amber-100',out['amber'][800],out['amber'][100]),
('teal-300 on ink-950',out['teal'][300],out['ink'][950]),
('rose-300 on ink-950',out['rose'][300],out['ink'][950]),
]
for name,a,b in checks: print(f'{name:38s} {a} on {b}: {cr(a,b):.2f}')
