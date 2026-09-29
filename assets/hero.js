(function(){
'use strict';

var root=document.documentElement;
var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var build=document.getElementById('build');
var stage=document.getElementById('stage');
var panels=[].slice.call(document.querySelectorAll('.panel'));
var railBtns=[].slice.call(document.querySelectorAll('#rail button'));
var ticks=railBtns.map(function(b){return b.querySelector('.tick i');});
var hud=document.getElementById('hudPhase');
var PHASES=['Blueprint','Foundation','Structure','Masonry','Openings and services','Interiors','Handover'];
var layers=[].slice.call(document.querySelectorAll('[data-k]')).map(function(g){
  return {k:+g.getAttribute('data-k'),t:-1,els:[].slice.call(g.querySelectorAll('[data-m]')).map(function(e){return {e:e,m:e.getAttribute('data-m')};})};
});
var state={s:0};
var glOn=false;

function clamp(x,a,b){return Math.min(b,Math.max(a,x));}
function smooth(x){return x*x*(3-2*x);}

/* ---------------------------------------------------------------
   Scroll -> phase progress (0..6), DOM text, rail, 2D fallback
---------------------------------------------------------------- */
var ticking=false;
function update(){
  ticking=false;
  var r=build.getBoundingClientRect();
  var span=Math.max(1,build.offsetHeight-stage.offsetHeight);
  var s=clamp(-r.top/span,0,1)*6;
  state.s=s;

  if(!glOn){
    layers.forEach(function(L){
      var t=smooth(clamp((s-(L.k-0.95))/0.8,0,1));
      if(t===L.t){return;}
      L.t=t;
      L.els.forEach(function(o){
        var e=o.e;
        if(o.m==='draw'){e.style.strokeDashoffset=(1-t).toFixed(4);}
        else if(o.m==='fade'){e.style.opacity=t.toFixed(4);}
        else{
          e.style.strokeDashoffset=(1-Math.min(1,t*1.7)).toFixed(4);
          e.style.fillOpacity=clamp((t-0.35)/0.65,0,1).toFixed(4);
        }
      });
    });
  }

  panels.forEach(function(el,i){
    var d=s-i, a=Math.abs(d);
    var o=clamp(1-(a-0.12)/0.38,0,1);
    el.style.opacity=o.toFixed(3);
    el.style.visibility=o<0.02?'hidden':'visible';
    el.style.transform=reduce?'none':'translateY('+(-d*28).toFixed(1)+'px)';
  });

  var active=Math.round(s)-1;
  railBtns.forEach(function(b,i){
    if(i===active){b.setAttribute('aria-current','step');}else{b.removeAttribute('aria-current');}
    ticks[i].style.setProperty('--f',clamp(s-i,0,1).toFixed(3));
  });
  var ph=PHASES[Math.round(s)];
  if(hud&&hud.textContent!==ph){hud.textContent=ph;}
}
function req(){if(!ticking){ticking=true;requestAnimationFrame(update);}}
window.addEventListener('scroll',req,{passive:true});
window.addEventListener('resize',req);

railBtns.forEach(function(b){
  b.addEventListener('click',function(){
    var i=+b.getAttribute('data-go');
    var top=build.getBoundingClientRect().top+window.pageYOffset;
    var span=build.offsetHeight-stage.offsetHeight;
    window.scrollTo({top:top+span*(i/6)+2,behavior:reduce?'auto':'smooth'});
  });
});

/* ---------------------------------------------------------------
   3D scene (Three.js). Falls back to the 2D drawing on any failure.
---------------------------------------------------------------- */
function initGL(){
  var T=window.THREE;
  if(!T){return false;}
  var canvas=document.getElementById('gl');
  var renderer;
  try{
    renderer=new T.WebGLRenderer({canvas:canvas,antialias:true,alpha:true,powerPreference:'high-performance'});
  }catch(e){return false;}
  try{
    return buildGL(T,canvas,renderer);
  }catch(err){
    if(window.console){console.error('3D scene failed, using the drawing fallback.',err);}
    try{renderer.dispose();}catch(e2){}
    return false;
  }
}

function buildGL(T,canvas,renderer){
  var small=window.matchMedia('(max-width: 860px)').matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,small?1.5:2));
  renderer.outputEncoding=T.sRGBEncoding;
  renderer.toneMapping=T.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.05;
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=T.PCFSoftShadowMap;
  renderer.localClippingEnabled=true;
  renderer.setClearColor(0x000000,0);

  var scene=new T.Scene();
  var camera=new T.PerspectiveCamera(30,1,0.5,220);
  var aniso=Math.min(8,renderer.capabilities.getMaxAnisotropy());

  function rnd(a,b){return a+Math.random()*(b-a);}
  function gray(v){var n=v|0;return 'rgb('+n+','+n+','+n+')';}
  function ctex(size,draw,srgb){
    var c=document.createElement('canvas');c.width=c.height=size;
    draw(c.getContext('2d'),size);
    var t=new T.CanvasTexture(c);
    t.wrapS=t.wrapT=T.RepeatWrapping;
    t.anisotropy=aniso;
    if(srgb){t.encoding=T.sRGBEncoding;}
    return t;
  }

  /* ----- procedural textures (no image files needed) ----- */
  function laterite(bump){
    return ctex(256,function(g,S){
      var rows=5,rh=S/rows,bw=S/2;
      g.fillStyle=bump?'#3a3a3a':'#4e2415';g.fillRect(0,0,S,S);
      for(var r=0;r<rows;r++){
        var off=(r%2)*bw/2;
        for(var c=-1;c<3;c++){
          var v=Math.random();
          g.fillStyle=bump?gray(150+v*70):'hsl('+(11+v*7)+','+(48+v*12)+'%,'+(27+v*11)+'%)';
          g.fillRect(c*bw+off+3,r*rh+3,bw-6,rh-6);
        }
      }
      for(var i=0;i<1600;i++){
        g.fillStyle=bump?'rgba(0,0,0,.25)':(Math.random()<0.5?'rgba(255,190,140,.10)':'rgba(30,10,5,.22)');
        g.fillRect(Math.random()*S,Math.random()*S,1+Math.random()*2,1+Math.random()*2);
      }
    },!bump);
  }
  function plaster(bump){
    return ctex(256,function(g,S){
      g.fillStyle=bump?'#808080':'#d3cdc1';g.fillRect(0,0,S,S);
      for(var i=0;i<2600;i++){
        var v=Math.random();
        g.fillStyle=bump?gray(90+v*110):'rgba('+(v<0.5?'255,250,240':'90,80,68')+','+(0.05+v*0.09)+')';
        g.fillRect(Math.random()*S,Math.random()*S,1+Math.random()*2.2,1+Math.random()*2.2);
      }
    },!bump);
  }
  function concrete(bump){
    return ctex(256,function(g,S){
      g.fillStyle=bump?'#808080':'#b6b0a5';g.fillRect(0,0,S,S);
      for(var i=0;i<3200;i++){
        var v=Math.random();
        g.fillStyle=bump?gray(80+v*120):'rgba('+(v<0.5?'255,255,250':'60,55,48')+','+(0.04+v*0.10)+')';
        g.fillRect(Math.random()*S,Math.random()*S,1+Math.random()*3,1+Math.random()*3);
      }
    },!bump);
  }
  var tTimber=ctex(256,function(g,S){
    g.fillStyle='#7a5230';g.fillRect(0,0,S,S);
    for(var x=0;x<S;x+=2){
      g.fillStyle='rgba('+(Math.random()<0.5?'40,22,8':'190,130,80')+','+(0.05+Math.random()*0.16)+')';
      g.fillRect(x,0,1+Math.random()*2,S);
    }
    g.fillStyle='#2a190c';
    for(var i=1;i<6;i++){g.fillRect(i*S/6-1.5,0,3,S);}
  },true);
  var tWin=ctex(128,function(g,S){
    var gr=g.createLinearGradient(0,0,0,S);
    gr.addColorStop(0,'#ffeab4');gr.addColorStop(1,'#e0a44a');
    g.fillStyle=gr;g.fillRect(0,0,S,S);
    g.strokeStyle='#2a1c10';g.lineWidth=3;
    g.beginPath();g.moveTo(S*0.3,0);g.lineTo(S*0.3,S*0.3);g.stroke();
    g.fillStyle='#2a1c10';
    g.beginPath();g.arc(S*0.3,S*0.34,S*0.05,0,Math.PI*2);g.fill();
    g.fillStyle='rgba(40,28,16,.55)';
    g.beginPath();g.ellipse(S*0.78,S*0.92,S*0.16,S*0.24,0,0,Math.PI*2);g.fill();
    g.fillRect(S*0.1,S*0.86,S*0.5,S*0.14);
  },true);
  tWin.wrapS=tWin.wrapT=T.ClampToEdgeWrapping;
  var tAlpha=ctex(256,function(g,S){
    var gr=g.createRadialGradient(S/2,S/2,S*0.1,S/2,S/2,S/2);
    gr.addColorStop(0,'#fff');gr.addColorStop(0.7,'#bbb');gr.addColorStop(1,'#000');
    g.fillStyle=gr;g.fillRect(0,0,S,S);
  },false);
  tAlpha.wrapS=tAlpha.wrapT=T.ClampToEdgeWrapping;

  /* ----- environment reflections (a simple painted sky) ----- */
  try{
    var pm=new T.PMREMGenerator(renderer);
    var envScene=new T.Scene();
    var skyT=ctex(256,function(g,S){
      var gr=g.createLinearGradient(0,0,0,S);
      gr.addColorStop(0,'#2f3f5c');gr.addColorStop(0.44,'#c9a878');gr.addColorStop(0.5,'#e6d2a8');
      gr.addColorStop(0.56,'#3a2c22');gr.addColorStop(1,'#140f0c');
      g.fillStyle=gr;g.fillRect(0,0,S,S);
    },true);
    skyT.wrapS=skyT.wrapT=T.ClampToEdgeWrapping;
    envScene.add(new T.Mesh(new T.SphereGeometry(50,32,16),new T.MeshBasicMaterial({map:skyT,side:T.BackSide})));
    scene.environment=pm.fromScene(envScene,0.03).texture;
  }catch(e){}

  /* ----- materials ----- */
  var M={
    conc:new T.MeshStandardMaterial({color:0xffffff,map:concrete(false),bumpMap:concrete(true),bumpScale:0.6,roughness:0.93,envMapIntensity:0.5}),
    lat:new T.MeshStandardMaterial({color:0xffffff,map:laterite(false),bumpMap:laterite(true),bumpScale:1.4,roughness:0.95,envMapIntensity:0.4}),
    plas:new T.MeshStandardMaterial({color:0xffffff,map:plaster(false),bumpMap:plaster(true),bumpScale:0.5,roughness:0.95,envMapIntensity:0.45}),
    par:new T.MeshStandardMaterial({color:0x8f897f,roughness:0.95,envMapIntensity:0.4}),
    frame:new T.MeshStandardMaterial({color:0x241a12,roughness:0.4,metalness:0.6,envMapIntensity:0.9}),
    glass:new T.MeshStandardMaterial({color:0x1b2a30,roughness:0.1,metalness:0.75,emissive:0xffffff,emissiveMap:tWin,emissiveIntensity:0,envMapIntensity:1.3}),
    timber:new T.MeshStandardMaterial({color:0xffffff,map:tTimber,roughness:0.7,envMapIntensity:0.5}),
    brass:new T.MeshStandardMaterial({color:0xd2a85a,roughness:0.35,metalness:0.7,envMapIntensity:1}),
    leaf:new T.MeshStandardMaterial({color:0x5d7a4b,roughness:0.9,flatShading:true,envMapIntensity:0.3}),
    trunk:new T.MeshStandardMaterial({color:0x4a3626,roughness:0.95}),
    crane:new T.MeshStandardMaterial({color:0xd2a85a,roughness:0.5,metalness:0.25,envMapIntensity:0.6}),
    path:new T.MeshStandardMaterial({color:0x8d867a,roughness:0.95,envMapIntensity:0.3})
  };
  var clip=new T.Plane(new T.Vector3(0,-1,0),-1.6);
  var ghostMats=[];
  for(var gk=0;gk<=6;gk++){
    ghostMats.push(new T.LineBasicMaterial({color:0xe6e0d3,transparent:true,opacity:0,clippingPlanes:[clip]}));
  }

  /* ----- lights ----- */
  var hemi=new T.HemisphereLight(0x9db0cf,0x2a1d14,0.55);scene.add(hemi);
  var sun=new T.DirectionalLight(0xbfcde6,1.4);
  sun.castShadow=true;
  sun.shadow.mapSize.set(small?1024:2048,small?1024:2048);
  var sc=sun.shadow.camera;sc.left=-22;sc.right=22;sc.top=22;sc.bottom=-22;sc.near=1;sc.far=90;
  sun.shadow.bias=-0.0004;sun.shadow.normalBias=0.04;
  scene.add(sun);scene.add(sun.target);
  var lA=new T.PointLight(0xffc670,0,15,2);lA.position.set(-3.2,2.4,6.4);scene.add(lA);
  var lB=new T.PointLight(0xffc670,0,15,2);lB.position.set(3.2,2.4,6.4);scene.add(lB);
  var lC=new T.PointLight(0xffc670,0,15,2);lC.position.set(4,5.6,7);scene.add(lC);

  /* ----- ground, grid, plot boundary ----- */
  var ground=new T.Mesh(new T.CircleGeometry(30,64),new T.MeshStandardMaterial({
    color:0x33271d,roughness:1,transparent:true,opacity:0.8,alphaMap:tAlpha,depthWrite:false,envMapIntensity:0.3}));
  ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
  var grid=new T.GridHelper(36,36,0xd2a85a,0xd2a85a);
  grid.material.transparent=true;grid.material.opacity=0.15;grid.material.depthWrite=false;grid.position.y=0.02;
  scene.add(grid);
  var plot=new T.LineLoop(new T.BufferGeometry().setFromPoints([
    new T.Vector3(-11,0.03,-9),new T.Vector3(11,0.03,-9),new T.Vector3(11,0.03,9),new T.Vector3(-11,0.03,9)]),
    new T.LineBasicMaterial({color:0xd2a85a,transparent:true,opacity:0.55}));
  scene.add(plot);

  /* ----- the house ----- */
  var house=new T.Group();scene.add(house);
  var byK={};
  function ghost(mesh,k){
    var l=new T.LineSegments(new T.EdgesGeometry(mesh.geometry,25),ghostMats[k]);
    l.position.copy(mesh.position);l.rotation.copy(mesh.rotation);l.renderOrder=2;
    mesh.parent.add(l);
  }
  function add(k,kind,obj,parent,opt){
    opt=opt||{};
    (parent||house).add(obj);
    if(obj.isMesh){obj.castShadow=opt.shadow!==false;obj.receiveShadow=true;}
    if(opt.ghost&&obj.isMesh){ghost(obj,k);}
    var pt={k:k,kind:kind,obj:obj,y0:obj.position.y};
    (byK[k]=byK[k]||[]).push(pt);
    return pt;
  }
  function boxMesh(w,h,d,mat,x,y,z,base){
    var g=new T.BoxGeometry(w,h,d);
    if(base){g.translate(0,h/2,0);}
    var m=new T.Mesh(g,mat);m.position.set(x,y,z);return m;
  }

  var XS=[-6,-2,2,6],ZF=4,ZB=-4;
  var L0=0.45,H=3.0,TS=0.22;
  var yFS=L0+H,yFF=yFS+TS,yRS=yFF+H,yPar=yRS+TS;
  var WT=0.23;

  /* phase 1: foundation */
  XS.forEach(function(x){[ZF,ZB].forEach(function(z){
    add(1,'growy',boxMesh(1.7,0.5,1.7,M.conc,x,-1.0,z,true),null,{ghost:true});
  });});
  XS.forEach(function(x){[ZF,ZB].forEach(function(z){
    add(1,'growy',boxMesh(0.5,0.9,0.5,M.conc,x,-0.5,z,true),null,{ghost:true});
  });});
  add(1,'growy',boxMesh(12.6,0.3,8.6,M.conc,0,0.15,0,true),null,{ghost:true});

  /* phase 2: structure */
  XS.forEach(function(x){[ZF,ZB].forEach(function(z){
    add(2,'growy',boxMesh(0.4,yRS-L0,0.4,M.conc,x,L0,z,true),null,{ghost:true});
  });});
  add(2,'drop',boxMesh(12.8,TS,8.8,M.conc,0,yFS+TS/2,0),null,{ghost:true});
  add(2,'drop',boxMesh(12.8,TS,8.8,M.conc,0,yRS+TS/2,0),null,{ghost:true});
  add(2,'drop',boxMesh(3.6,TS,1.4,M.conc,4,yFS+TS/2,ZF+0.82),null,{ghost:true});

  /* phase 3: masonry (wall panels with real openings cut in) */
  function wallGeo(w,h,ops){
    var s=new T.Shape();
    var notch=null;
    ops.forEach(function(o){if(o.y<=0.001){notch=o;}});
    s.moveTo(0,0);
    if(notch){
      s.lineTo(notch.x,0);s.lineTo(notch.x,notch.h);
      s.lineTo(notch.x+notch.w,notch.h);s.lineTo(notch.x+notch.w,0);
    }
    s.lineTo(w,0);s.lineTo(w,h);s.lineTo(0,h);
    ops.forEach(function(o){
      if(o.y<=0.001){return;}
      var p=new T.Path();
      p.moveTo(o.x,o.y);p.lineTo(o.x,o.y+o.h);p.lineTo(o.x+o.w,o.y+o.h);p.lineTo(o.x+o.w,o.y);
      s.holes.push(p);
    });
    var g=new T.ExtrudeGeometry(s,{depth:WT,bevelEnabled:false,steps:1});
    g.translate(0,0,-WT/2);
    return g;
  }
  function frameGeo(w,h){
    var s=new T.Shape(),a=w/2+0.07,b=h/2+0.07;
    s.moveTo(-a,-b);s.lineTo(a,-b);s.lineTo(a,b);s.lineTo(-a,b);
    var p=new T.Path(),c=w/2,d=h/2;
    p.moveTo(-c,-d);p.lineTo(-c,d);p.lineTo(c,d);p.lineTo(c,-d);
    s.holes.push(p);
    var g=new T.ExtrudeGeometry(s,{depth:0.1,bevelEnabled:false,steps:1});
    g.translate(0,0,-0.05);
    return g;
  }
  function opening(grp,o){
    var g=new T.Group();
    g.position.set(o.x+o.w/2,o.y+o.h/2,0);
    var fr=new T.Mesh(frameGeo(o.w,o.h),M.frame);fr.position.z=0.13;g.add(fr);
    var gl=new T.Mesh(new T.PlaneGeometry(o.w,o.h),M.glass);gl.position.z=-0.02;g.add(gl);
    if(o.mull){var mb=new T.Mesh(new T.BoxGeometry(0.05,o.h,0.07),M.frame);mb.position.z=0.1;g.add(mb);}
    if(o.sill){var sl=new T.Mesh(new T.BoxGeometry(o.w+0.3,0.06,0.32),M.conc);sl.position.set(0,-o.h/2-0.09,0.16);sl.castShadow=true;g.add(sl);}
    add(4,'pop',g,grp);
    if(o.door){
      var leaf=boxMesh(o.w-0.2,o.h-0.1,0.07,M.timber,o.x+o.w/2,o.y+0.03,0.06,true);
      add(5,'growy',leaf,grp);
      var hd=new T.Mesh(new T.BoxGeometry(0.05,0.4,0.05),M.brass);
      hd.position.set(o.x+o.w/2+o.w*0.3,1.1,0.12);
      add(5,'pop',hd,grp,{shadow:false});
    }
  }
  function panel(k,mat,x,y,z,ry,w,h,ops){
    var grp=new T.Group();grp.position.set(x,y,z);grp.rotation.y=ry;house.add(grp);
    var mesh=new T.Mesh(wallGeo(w,h,ops),mat);
    add(k,'growy',mesh,grp,{ghost:true});
    ops.forEach(function(o){opening(grp,o);});
  }
  var bays=[[-5.8,-2.2],[-1.8,1.8],[2.2,5.8]];
  function level(y,fMats,fOps,bMat,bOps,sMat,sOps){
    bays.forEach(function(b,i){
      var w=b[1]-b[0];
      panel(3,fMats[i],b[0],y,ZF,0,w,H,fOps[i]);
      panel(3,bMat,b[1],y,ZB,Math.PI,w,H,bOps);
    });
    panel(3,sMat,-6,y,-3.8,-Math.PI/2,7.6,H,sOps);
    panel(3,sMat,6,y,3.8,Math.PI/2,7.6,H,sOps);
  }
  function W(x,y,w,h,extra){var o={x:x,y:y,w:w,h:h,mull:1,sill:1};if(extra){for(var k in extra){o[k]=extra[k];}}return o;}
  var doorO={x:1.2,y:0,w:1.2,h:2.4,door:1};
  var balcO={x:0.5,y:0,w:2.6,h:2.4,mull:1};
  level(L0,[M.lat,M.plas,M.lat],[[W(0.7,0.9,2.2,1.5)],[doorO],[W(0.5,0.9,2.6,1.5)]],
        M.lat,[W(1.0,1.1,1.6,1.2)],M.plas,[W(2.7,0.9,2.2,1.5)]);
  level(yFF,[M.plas,M.lat,M.plas],[[W(0.7,0.9,2.2,1.5)],[W(0.9,0.9,1.8,1.5)],[balcO]],
        M.plas,[W(1.0,1.1,1.6,1.2)],M.lat,[W(2.7,0.9,2.2,1.5)]);

  add(3,'growy',boxMesh(12.8,0.5,0.2,M.par,0,yPar,ZF,true),null,{ghost:true});
  add(3,'growy',boxMesh(12.8,0.5,0.2,M.par,0,yPar,ZB,true),null,{ghost:true});
  add(3,'growy',boxMesh(0.2,0.5,8.4,M.par,-6,yPar,0,true),null,{ghost:true});
  add(3,'growy',boxMesh(0.2,0.5,8.4,M.par,6,yPar,0,true),null,{ghost:true});
  add(3,'drop',boxMesh(2.6,0.12,1.2,M.conc,0,3.05,ZF+0.6),null,{ghost:true});

  /* phase 4: services and balcony rail */
  var pipeG=new T.CylinderGeometry(0.05,0.05,yRS-L0,10);pipeG.translate(0,(yRS-L0)/2,0);
  var pipe=new T.Mesh(pipeG,M.frame);pipe.position.set(-6.4,L0,4.08);
  add(4,'growy',pipe,null);
  var rail=new T.Group();rail.position.set(4,yFF,ZF+1.35);
  var top=new T.Mesh(new T.BoxGeometry(3.6,0.05,0.05),M.frame);top.position.set(0,1.0,0);rail.add(top);
  for(var pi=0;pi<13;pi++){
    var post=boxMesh(0.03,1.0,0.03,M.frame,-1.8+pi*0.3,0,0,true);rail.add(post);
  }
  var sr1=new T.Mesh(new T.BoxGeometry(0.05,0.05,1.2),M.frame);sr1.position.set(-1.8,1.0,-0.6);rail.add(sr1);
  var sr2=new T.Mesh(new T.BoxGeometry(0.05,0.05,1.2),M.frame);sr2.position.set(1.8,1.0,-0.6);rail.add(sr2);
  add(4,'growy',rail,null);

  /* phase 5: interiors, planters */
  function planter(x){
    var g=new T.Group();g.position.set(x,L0,ZF+0.5);
    g.add(boxMesh(0.55,0.5,0.55,M.timber,0,0,0,true));
    var leaf=new T.Mesh(new T.IcosahedronGeometry(0.42,1),M.leaf);leaf.position.y=0.85;leaf.castShadow=true;g.add(leaf);
    add(5,'growy',g,null);
  }
  planter(-1.15);planter(1.15);

  /* phase 6: handover */
  var plate=new T.Mesh(new T.BoxGeometry(0.5,0.28,0.03),M.brass);plate.position.set(1.25,L0+1.5,ZF+0.14);
  add(6,'pop',plate,null,{shadow:false});
  var pathG=new T.BoxGeometry(2.4,0.04,9);pathG.translate(0,0.02,4.5);
  var pth=new T.Mesh(pathG,M.path);pth.position.set(0,0,ZF+0.6);
  add(6,'growz',pth,null);
  [[-9,6],[9.5,5],[-8.5,-7],[9,-6.5],[-4.2,9],[5,9.4]].forEach(function(p,i){
    var t=new T.Group();t.position.set(p[0],0,p[1]);
    var trunk=new T.CylinderGeometry(0.12,0.16,1.7,8);trunk.translate(0,0.85,0);
    var tm=new T.Mesh(trunk,M.trunk);tm.castShadow=true;t.add(tm);
    var can=new T.Mesh(new T.IcosahedronGeometry(1.1+(i%3)*0.15,1),M.leaf);can.position.y=2.3;can.castShadow=true;t.add(can);
    add(6,'pop',t,null);
  });

  /* tower crane: visible during construction, leaves at handover */
  var crane=new T.Group();crane.position.set(-10.5,0,-1);scene.add(crane);
  function cbox(w,h,d,x,y,z,par){var m=new T.Mesh(new T.BoxGeometry(w,h,d),M.crane);m.position.set(x,y,z);m.castShadow=true;(par||crane).add(m);return m;}
  var MH=9.5;
  [[-0.22,-0.22],[0.22,-0.22],[-0.22,0.22],[0.22,0.22]].forEach(function(p){cbox(0.08,MH,0.08,p[0],MH/2,p[1]);});
  for(var ri=0;ri<10;ri++){cbox(0.5,0.05,0.5,0,0.5+ri*0.95,0);}
  var jib=new T.Group();jib.position.set(0,MH,0);crane.add(jib);
  cbox(18,0.32,0.32,5,0.16,0,jib);
  cbox(1.3,1,0.9,-3.6,-0.4,0,jib);
  cbox(0.8,0.85,0.8,0.9,0.75,0,jib);
  cbox(0.1,2.4,0.1,0.4,1.4,0,jib);
  var trolley=new T.Group();trolley.position.set(8,-0.1,0);jib.add(trolley);
  var cableG=new T.BoxGeometry(0.03,1,0.03);cableG.translate(0,-0.5,0);
  var cable=new T.Mesh(cableG,M.frame);trolley.add(cable);
  var hookG=new T.Group();trolley.add(hookG);
  var beam=new T.Mesh(new T.BoxGeometry(2.4,0.2,0.32),M.conc);beam.castShadow=true;hookG.add(beam);
  var hookB=new T.Mesh(new T.BoxGeometry(0.28,0.3,0.28),M.frame);hookB.position.y=0.35;hookG.add(hookB);

  /* drifting dust in the light */
  var DN=200,dp=new Float32Array(DN*3);
  for(var di=0;di<DN;di++){dp[di*3]=rnd(-15,15);dp[di*3+1]=rnd(0.2,11);dp[di*3+2]=rnd(-12,12);}
  var dg=new T.BufferGeometry();dg.setAttribute('position',new T.BufferAttribute(dp,3));
  var dust=new T.Points(dg,new T.PointsMaterial({color:0xf0d9a0,size:0.09,transparent:true,opacity:0,depthWrite:false,sizeAttenuation:true}));
  scene.add(dust);

  /* ----- camera path (Catmull-Rom through one keyframe per phase) ----- */
  var KF=[
    [0.80,0.28,31,2.8],
    [0.32,0.55,29,1.6],
    [-0.30,0.30,30,3.4],
    [-0.95,0.22,29,3.5],
    [-0.12,0.11,26,3.3],
    [0.48,0.08,23,3.0],
    [0.95,0.16,30,3.6]
  ];
  function crm(p0,p1,p2,p3,t){
    var t2=t*t,t3=t2*t;
    return 0.5*((2*p1)+(-p0+p2)*t+(2*p0-5*p1+4*p2-p3)*t2+(-p0+3*p1-3*p2+p3)*t3);
  }
  function camAt(s){
    s=clamp(s,0,6);
    var i=Math.min(5,Math.floor(s)),f=s-i;
    var a=KF[Math.max(0,i-1)],b=KF[i],c=KF[i+1],d=KF[Math.min(6,i+2)];
    return [crm(a[0],b[0],c[0],d[0],f),crm(a[1],b[1],c[1],d[1],f),crm(a[2],b[2],c[2],d[2],f),crm(a[3],b[3],c[3],d[3],f)];
  }

  /* ----- per-frame scene state ----- */
  function easeOut(x){return 1-Math.pow(1-x,3);}
  function easeBack(x){var c1=1.5,c3=c1+1;return 1+c3*Math.pow(x-1,3)+c1*Math.pow(x-1,2);}
  function setPart(pt,p){
    var o=pt.obj;
    if(p<=0.0005){if(o.visible){o.visible=false;}return;}
    if(!o.visible){o.visible=true;}
    var e=easeOut(p);
    if(pt.kind==='growy'){o.scale.y=Math.max(e,0.001);}
    else if(pt.kind==='growz'){o.scale.z=Math.max(e,0.001);}
    else if(pt.kind==='drop'){o.position.y=pt.y0+(1-e)*6;}
    else if(pt.kind==='pop'){o.scale.setScalar(Math.max(easeBack(p),0.001));}
  }
  var cCool=new T.Color(0xbfcde6),cWarm=new T.Color(0xffb56a);
  var hCool=new T.Color(0x9db0cf),hWarm=new T.Color(0xffd9a8);
  var Tk=[0,0,0,0,0,0,0];
  var sm=0,tm=0,px=0,py=0,tpx=0,tpy=0,first=true,lastGlow=-1;
  var active=false,running=false,last=0,inView=true,lowered=false,ema=16;

  function resize(){
    var w=stage.clientWidth,h=stage.clientHeight;
    if(!w||!h){return;}
    renderer.setSize(w,h,false);
    camera.aspect=w/h;
    if(w>860){camera.setViewOffset(w,h,-w*0.19,0,w,h);}
    else{camera.setViewOffset(w,h,0,h*0.17,w,h);}
    camera.updateProjectionMatrix();
  }

  function frame(now){
    if(!active){running=false;return;}
    requestAnimationFrame(frame);
    var dt=Math.min(0.05,Math.max(0.001,(now-last)/1000));last=now;tm+=dt;
    if(first){sm=state.s;first=false;}
    sm+=(state.s-sm)*(reduce?1:(1-Math.exp(-dt*5.5)));
    px+=(tpx-px)*(1-Math.exp(-dt*3));py+=(tpy-py)*(1-Math.exp(-dt*3));

    var k,i;
    for(k=1;k<=6;k++){Tk[k]=clamp((sm-(k-0.95))/0.8,0,1);}

    /* intro: the blueprint scans upward, the camera settles in */
    var intro=reduce?1:clamp((tm-0.15)/3,0,1);
    var introE=easeOut(intro);
    clip.constant=-1.6+introE*11.5;
    var lineIn=reduce?1:clamp(tm/0.6,0,1);
    for(k=1;k<=6;k++){ghostMats[k].opacity=(0.5-0.34*Tk[k])*lineIn;}
    grid.material.opacity=0.15*(1-Tk[6]*0.5)*lineIn;
    plot.material.opacity=0.55*lineIn;

    /* build parts */
    for(k=1;k<=6;k++){
      var arr=byK[k],n=arr.length;
      for(i=0;i<n;i++){setPart(arr[i],clamp(Tk[k]*1.6-(i/n)*0.6,0,1));}
    }

    /* crane */
    var cs=easeOut(clamp(Tk[1]*2,0,1))*(1-easeOut(Tk[6]));
    crane.visible=cs>0.002;
    crane.scale.y=Math.max(cs,0.001);
    var idle=reduce?0:1;
    jib.rotation.y=0.85+Math.sin(tm*0.18)*0.42*idle+sm*0.12;
    var cl=4.2+Math.sin(tm*0.55)*1.1*idle;
    cable.scale.y=cl;hookG.position.y=-cl-0.2;

    /* light: cool morning -> golden hour at handover */
    var warm=smooth(clamp((sm-4.6)/1.4,0,1));
    var wAll=clamp(sm/6,0,1);
    sun.color.copy(cCool).lerp(cWarm,warm);
    sun.intensity=1.4+warm*0.9;
    var sa=0.75+wAll*0.55,se=0.95-warm*0.5;
    sun.position.set(26*Math.cos(se)*Math.sin(sa),26*Math.sin(se),26*Math.cos(se)*Math.cos(sa));
    hemi.color.copy(hCool).lerp(hWarm,warm);
    hemi.intensity=0.55+warm*0.2;
    renderer.toneMappingExposure=1.05+warm*0.12;
    var lit=easeOut(Tk[5]);
    M.glass.emissiveIntensity=lit*(1.0+warm*0.25);
    lA.intensity=lB.intensity=lit*1.5;lC.intensity=lit*1.2;
    dust.material.opacity=(0.12+0.38*wAll)*lineIn;
    for(i=0;i<DN;i++){
      dp[i*3+1]+=dt*0.12*idle;
      if(dp[i*3+1]>11){dp[i*3+1]=0.2;}
      dp[i*3]+=Math.sin(tm*0.3+i)*dt*0.05*idle;
    }
    dg.attributes.position.needsUpdate=true;
    if(Math.abs(warm-lastGlow)>0.01){stage.style.setProperty('--glow',warm.toFixed(2));lastGlow=warm;}

    /* camera */
    var c=camAt(sm);
    var az=c[0]+(reduce?0:(1-introE)*0.55+Math.sin(tm*0.15)*0.03+px*0.06);
    var el=c[1]+(reduce?0:-py*0.03);
    var R=c[2]*(1+(reduce?0:(1-introE)*0.22));
    var need=15/(2*Math.tan(T.MathUtils.degToRad(camera.fov/2))*camera.aspect);
    if(R<need){R=need;}
    camera.position.set(R*Math.cos(el)*Math.sin(az),c[3]+R*Math.sin(el),R*Math.cos(el)*Math.cos(az));
    camera.lookAt(0,c[3],0);

    renderer.render(scene,camera);

    /* if the device struggles, drop resolution once */
    ema=ema*0.95+dt*1000*0.05;
    if(!lowered&&tm>4&&ema>30){lowered=true;renderer.setPixelRatio(1);resize();}
  }

  function setActive(){
    var on=inView&&!document.hidden&&glOn;
    active=on;
    if(on&&!running){running=true;last=performance.now();requestAnimationFrame(frame);}
  }
  if(window.IntersectionObserver){
    new IntersectionObserver(function(e){inView=e[0].isIntersecting;setActive();},{threshold:0}).observe(build);
  }
  document.addEventListener('visibilitychange',setActive);
  if(window.ResizeObserver){new ResizeObserver(resize).observe(stage);}else{window.addEventListener('resize',resize);}
  window.addEventListener('pointermove',function(e){
    if(e.pointerType==='touch'){return;}
    tpx=(e.clientX/window.innerWidth-0.5)*2;tpy=(e.clientY/window.innerHeight-0.5)*2;
  },{passive:true});
  canvas.addEventListener('webglcontextlost',function(e){
    e.preventDefault();
    glOn=false;active=false;
    root.classList.remove('gl');root.classList.add('nogl');
    update();
  });

  resize();
  glOn=true;
  root.classList.add('gl');
  setActive();
  return true;
}

var ok=initGL();
if(!ok){glOn=false;root.classList.add('nogl');}
update();
})();
