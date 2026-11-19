const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const coinCountEl = document.getElementById('coinCount');
const livesCountEl = document.getElementById('livesCount');
const startScreen = document.getElementById('startScreen');
const endScreen = document.getElementById('endScreen');

const W = 960, H = 540;
const keys = {};
let running = false;
let coins = [];
let monsters = [];
let lives = 3;
let collected = 0;
let invincible = 0;
let lastTime = 0;

const player = { x:72, y:H/2, r:20, speed:210, vx:0, vy:0 };
const castle = { x:860, y:238, w:70, h:145 };

const coinPositions = [[180,95],[310,75],[430,150],[590,82],[735,138],[210,430],[390,380],[610,438],[760,355],[490,290],[95,350],[820,72]];

function resetGame() {
  player.x = 72; player.y = H/2; player.vx = 0; player.vy = 0;
  lives = 3; collected = 0; invincible = 0;
  coins = coinPositions.map((p,i)=>({x:p[0],y:p[1],taken:false,phase:i*.7}));
  monsters = [
    {x:350,y:230,r:20,speed:58,dir:1,range:150,base:230},
    {x:540,y:420,r:21,speed:66,dir:-1,range:120,base:420},
    {x:700,y:220,r:19,speed:72,dir:1,range:95,base:220}
  ];
  coinCountEl.textContent = 0;
  livesCountEl.textContent = 3;
}

function roundedRect(x,y,w,h,r) { ctx.beginPath(); ctx.roundRect(x,y,w,h,r); ctx.fill(); }

function drawBackground() {
  ctx.fillStyle='#80b96f'; ctx.fillRect(0,0,W,H);
  ctx.globalAlpha=.12; ctx.fillStyle='#4d9258';
  for(let x=20;x<W;x+=55) for(let y=15;y<H;y+=48){ ctx.beginPath();ctx.arc(x+(y%3)*8,y,18,0,Math.PI*2);ctx.fill(); }
  ctx.globalAlpha=1;

  // winding forest path
  ctx.beginPath();ctx.moveTo(0,280);ctx.bezierCurveTo(180,210,250,360,420,300);ctx.bezierCurveTo(590,240,650,390,960,310);ctx.lineTo(960,390);ctx.bezierCurveTo(650,470,590,320,420,380);ctx.bezierCurveTo(250,440,180,290,0,360);ctx.closePath();ctx.fillStyle='#cfbb7c';ctx.fill();

  // trees frame
  const trees=[[18,42,48],[95,12,42],[155,70,38],[280,25,44],[470,22,42],[620,38,46],[820,22,43],[910,65,50],[32,470,50],[145,500,43],[280,478,40],[435,500,48],[690,490,46],[820,480,50],[920,430,48]];
  trees.forEach(([x,y,s],i)=>drawTree(x,y,s,i%2));

  // castle gate
  ctx.fillStyle='#d9dfd0';roundedRect(castle.x,castle.y,castle.w,castle.h,8);
  ctx.fillStyle='#9faea1';ctx.fillRect(castle.x+8,castle.y-14,18,25);ctx.fillRect(castle.x+44,castle.y-14,18,25);
  ctx.fillStyle='#8b9a91';ctx.beginPath();ctx.moveTo(castle.x+8,castle.y-14);ctx.lineTo(castle.x+17,castle.y-32);ctx.lineTo(castle.x+26,castle.y-14);ctx.fill();ctx.beginPath();ctx.moveTo(castle.x+44,castle.y-14);ctx.lineTo(castle.x+53,castle.y-32);ctx.lineTo(castle.x+62,castle.y-14);ctx.fill();
  ctx.fillStyle=collected===coins.length?'#f3c956':'#5e7067';ctx.fillRect(castle.x+24,castle.y+92,22,53);
  ctx.fillStyle='#f6b9b0';ctx.fillRect(castle.x+28,castle.y+96,14,49);
  ctx.fillStyle='#fff';ctx.font='16px Nunito';ctx.textAlign='center';ctx.fillText('CASTELO',castle.x+35,castle.y+75);
}

function drawTree(x,y,s,alt) {
  ctx.fillStyle='#6e5138';ctx.fillRect(x+s*.42,y+s*.48,s*.16,s*.52);
  ctx.fillStyle=alt?'#477f50':'#3f7548';ctx.beginPath();ctx.arc(x+s*.5,y+s*.38,s*.42,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(x+s*.23,y+s*.48,s*.29,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(x+s*.76,y+s*.48,s*.32,0,Math.PI*2);ctx.fill();
}

function drawCoin(c) {
  if(c.taken) return;
  ctx.save();ctx.translate(c.x,c.y);ctx.rotate(Math.sin(performance.now()/300+c.phase)*.18);
  ctx.fillStyle='#d89b2d';ctx.beginPath();ctx.ellipse(0,0,13,16,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ffd54d';ctx.beginPath();ctx.ellipse(0,-2,10,13,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff2a6';ctx.fillRect(-2,-9,4,16);ctx.restore();
}

function drawPrincess() {
  ctx.save();ctx.translate(player.x,player.y); if(invincible>0&&Math.floor(invincible*12)%2)ctx.globalAlpha=.35;
  ctx.fillStyle='#b98b69';ctx.beginPath();ctx.arc(0,-8,12,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#df956c';ctx.beginPath();ctx.arc(0,-6,10,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#8c4d38';ctx.beginPath();ctx.arc(-6,-12,10,Math.PI,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(6,-12,10,Math.PI,Math.PI*2);ctx.fill();
  ctx.fillStyle='#ec7d9a';ctx.beginPath();ctx.moveTo(-14,5);ctx.lineTo(14,5);ctx.lineTo(20,25);ctx.lineTo(-20,25);ctx.closePath();ctx.fill();
  ctx.fillStyle='#ffd86a';ctx.beginPath();ctx.moveTo(-11,-18);ctx.lineTo(-7,-29);ctx.lineTo(-2,-19);ctx.lineTo(4,-30);ctx.lineTo(10,-18);ctx.closePath();ctx.fill();ctx.restore();
}

function drawMonster(m) {
  ctx.save();ctx.translate(m.x,m.y);
  ctx.fillStyle='#6b4d72';ctx.beginPath();ctx.ellipse(0,5,m.r,m.r*.9,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#9a6e93';ctx.beginPath();ctx.arc(-m.r*.45,-m.r*.7,7,0,Math.PI*2);ctx.arc(m.r*.45,-m.r*.7,7,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(-7,-2,5,0,Math.PI*2);ctx.arc(7,-2,5,0,Math.PI*2);ctx.fill();ctx.fillStyle='#3d3041';ctx.beginPath();ctx.arc(-6,-2,2,0,Math.PI*2);ctx.arc(8,-2,2,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(-9,10);ctx.lineTo(-4,16);ctx.lineTo(0,10);ctx.lineTo(5,16);ctx.lineTo(9,10);ctx.fill();ctx.restore();
}

function update(dt) {
  let dx=0,dy=0;
  if(keys.ArrowLeft||keys.a||keys.A||touchDir==='left')dx--; if(keys.ArrowRight||keys.d||keys.D||touchDir==='right')dx++; if(keys.ArrowUp||keys.w||keys.W||touchDir==='up')dy--; if(keys.ArrowDown||keys.s||keys.S||touchDir==='down')dy++;
  if(dx&&dy){dx*=.707;dy*=.707}
  player.x=Math.max(28,Math.min(W-28,player.x+dx*player.speed*dt)); player.y=Math.max(28,Math.min(H-28,player.y+dy*player.speed*dt));

  monsters.forEach(m=>{ m.x=m.base+Math.sin(performance.now()/1000*m.speed/35)*m.range*m.dir; if(m.dir===-1)m.x=m.base-Math.sin(performance.now()/1000*m.speed/35)*m.range; });

  coins.forEach(c=>{ if(!c.taken&&Math.hypot(player.x-c.x,player.y-c.y)<30){c.taken=true;collected++;coinCountEl.textContent=collected} });
  if(invincible>0)invincible-=dt;
  if(invincible<=0) monsters.forEach(m=>{if(Math.hypot(player.x-m.x,player.y-m.y)<m.r+20){lives--;livesCountEl.textContent=lives;invincible=2;player.x=72;player.y=H/2;if(lives<=0)endGame(false)}});
  if(collected===coins.length&&player.x>castle.x-20&&player.y>castle.y&&player.y<castle.y+castle.h) endGame(true);
}

function loop(time) {
  const dt=Math.min((time-lastTime)/1000,.033);lastTime=time;
  if(running)update(dt);
  drawBackground(); coins.forEach(drawCoin); monsters.forEach(drawMonster); drawPrincess();
  if(running)requestAnimationFrame(loop);
}

function endGame(won) {
  running=false;
  document.getElementById('endIcon').textContent=won?'🏰':'💔';
  document.getElementById('endEyebrow').textContent=won?'MISSÃO CUMPRIDA':'TENTE NOVAMENTE';
  document.getElementById('endTitle').textContent=won?'Você venceu!':'Os monstros te pegaram';
  document.getElementById('endText').textContent=won?'A princesa reuniu todas as moedas e voltou ao castelo em segurança.':'Reúna coragem, evite os monstros e tente ajudar a princesa novamente.';
  endScreen.classList.add('visible');
}

function startGame(){ resetGame();startScreen.classList.remove('visible');endScreen.classList.remove('visible');running=true;lastTime=performance.now();requestAnimationFrame(loop); }
window.addEventListener('keydown',e=>{keys[e.key]=true;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault()});
window.addEventListener('keyup',e=>keys[e.key]=false);
document.getElementById('startButton').addEventListener('click',startGame);
document.getElementById('restartButton').addEventListener('click',startGame);
let touchDir=null;
document.querySelectorAll('.control').forEach(btn=>{const dir=btn.id;const on=e=>{e.preventPreventDefault?.();touchDir=dir};btn.addEventListener('pointerdown',on);btn.addEventListener('pointerup',()=>touchDir=null);btn.addEventListener('pointerleave',()=>touchDir=null);btn.addEventListener('touchstart',on,{passive:false})});
resetGame();drawBackground();coins.forEach(drawCoin);monsters.forEach(drawMonster);drawPrincess();
