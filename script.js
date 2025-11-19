/* script.js — v0.1.5.5 (music file loaded from repo) */

/* === IMPORTANT ===
 Put your MP3 into the repo root and name it exactly "music.mp3".
 Put your character image into the repo root and name it "character.png"
*/

const MUSIC_FILE = "music.mp3"; // <--- music file name in your repo
const CHAR_FILE = "character.png"; // <--- character image name in repo

// basic state
const SAVE_KEY = "clicker_christmas_v0155";
const state = { score:0, per:1, multiplier:1, auto:0, opened:1, rebirths:0, critChance:5 };
const upgrades = [];
const names = ['Beat Boost','Mic Power','Rhythm Rage','Funk Mode','Pulse Drive','Bass Surge','Echo Lift','Neon Flow','Tempo Spike','Vibe Amp',
'Groove Core','Tempo Twist','Meter Master','Sync Surge','Loop Favor','Cipher Kick','Shadow Beat','Flash Drop','Stereo Push','Kickstart',
'Riff Prime','Chord Burst','Hook Charge','Rampage FX','Phase Shift','Wave Rider','Spin Slash','Drop Zone','Funk Fury','Harmony X',
'Rhythm Cannon','Bassquake','Meter Breaker','Loop Engine','Glow Burst','Ultra Clap','Mega Snare','Auto-Drum','Hyper Beat','Quantum Tap',
'Titan Strike','Pulse Reactor','Solar Groove','Lunar Rhythm','Galactic Snap','Omega Hit','Supreme X','Legendary Beat','Ascend','Rebirth'];

// build upgrades (50)
for(let i=0;i<50;i++){
  let cost = Math.round(Math.pow(1.85,i)*40);
  let name = names[i] || ("Upgrade " + (i+1));
  let desc = "";
  if(i===0){ name = "X2 Multiplier"; cost = 5000; desc = "Уникальный: удваивает множитель (перманентно)"; }
  else if(i<10){ desc = `+${Math.max(1,Math.round((i+1)/1))} к базовому клику`; }
  else if(i<18){ desc = `+${((i-8)*0.25).toFixed(2)} к множителю`; }
  else if(i<26){ desc = `+${Math.max(1,Math.round((i-17)/1))} автокликов/сек`; }
  else if(i<34){ desc = `+${1+(i-26)}% к шансу крита`; }
  else if(i<42){ desc = `Рандомный бонус при клике`; }
  else if(i<49){ const mult = (i-40)*4 + 4; const dur = 15000 + (i-41)*5000; desc = `Временный x${mult} на ${Math.round(dur/1000)}с`; }
  else { desc = 'Перерождение: даёт постоянный +0.5 к множителю'; }
  upgrades.push({ name, cost, desc, bought:false, idx:i });
}

// DOM
const scoreEl = document.getElementById("score");
const perEl = document.getElementById("per");
const multEl = document.getElementById("mult");
const balanceEl = document.getElementById("balance");
const openedEl = document.getElementById("opened");
const shopList = document.getElementById("shopList");
const clickCircle = document.getElementById("clickCircle");
const charImg = document.getElementById("charImg");
const bgm = document.getElementById("bgm");
const shopBtn = document.getElementById("shopBtn");
const luckBtn = document.getElementById("luckBtn");
const donateBtn = document.getElementById("donateBtn");
const resetBtn = document.getElementById("resetBtn");
const modal = document.getElementById("modal");
const modalContent = document.getElementById("modalContent");
const modalClose = document.getElementById("modalClose");

// set assets (character + music)
charImg.src = CHAR_FILE;
bgm.src = MUSIC_FILE;

// save/load
function save(){ try{ localStorage.setItem(SAVE_KEY, JSON.stringify({state, upgrades})); }catch(e){console.warn(e)} }
function load(){
  try{
    const raw = JSON.parse(localStorage.getItem(SAVE_KEY));
    if(raw){
      Object.assign(state, raw.state);
      raw.upgrades?.forEach((u,i)=>{ if(upgrades[i]){ upgrades[i].cost = u.cost; upgrades[i].bought = u.bought; } });
    }
  }catch(e){}
}
load();

// render
function render(){
  scoreEl.textContent = Math.floor(state.score);
  perEl.textContent = Math.floor(state.per);
  multEl.textContent = state.multiplier.toFixed(2);
  balanceEl.textContent = Math.floor(state.score);
  openedEl.textContent = state.opened;
  renderShop();
}
function renderShop(){
  shopList.innerHTML = "";
  upgrades.forEach((u,i)=>{
    const vis = i < state.opened;
    const el = document.createElement("div");
    el.className = "shop-item";
    el.style.opacity = vis ? "1" : "0.45";
    el.innerHTML = `<div style="max-width:70%"><strong>${u.name}</strong><div style="font-size:12px;color:#cfcfcf">${u.desc}</div></div>
      <div style="text-align:right"><div style="font-size:12px">${Math.max(1, Math.round(u.cost))}</div>
      <div style="margin-top:6px"><button class="btn" data-i="${i}" ${(!vis||u.bought) ? "disabled" : ""}>${u.bought ? "Куплено" : "Купить"}</button></div></div>`;
    shopList.appendChild(el);
  });
  shopList.querySelectorAll("button").forEach(b => b.onclick = ()=> buyUpgrade(Number(b.dataset.i)));
}

// buying
function buyUpgrade(i){
  const up = upgrades[i];
  const price = Math.max(1, Math.round(up.cost));
  if(state.score < price){ flash("Недостаточно кликов"); return; }
  state.score -= price;
  up.bought = true;
  // effects
  if(i === 0){ state.multiplier *= 2; flash("Куплено: X2 Множитель!"); }
  else if(i < 10){ state.per += Math.max(1, Math.round((i+1)/1)); }
  else if(i < 18){ state.multiplier += ((i-8) * 0.25); }
  else if(i < 26){ state.auto += Math.max(1, Math.round((i-17)/1)); }
  else if(i < 34){ state.critChance += 1 + (i-26); }

  if(state.opened < upgrades.length) state.opened = Math.min(upgrades.length, state.opened + 1);
  up.cost = Math.round(up.cost * 1.55);
  save(); render();
}

// click handling (only inside circle)
clickCircle.addEventListener("pointerdown", (ev)=>{
  const rect = clickCircle.getBoundingClientRect();
  const x = ev.clientX - rect.left, y = ev.clientY - rect.top;
  const cx = rect.width/2, cy = rect.height/2;
  if(Math.hypot(x-cx, y-cy) > rect.width/2) return; // outside circle
  // visual jump
  clickCircle.style.transform = "translateY(-10px) scale(1.02)";
  setTimeout(()=> clickCircle.style.transform = "", 140);
  // start music after gesture
  if(bgm && bgm.paused && bgm.src){ bgm.volume = 0.35; bgm.play().catch(()=>{}); }
  // compute gain
  const roll = Math.random() * 100;
  const isCrit = roll < state.critChance;
  let gained = state.per * state.multiplier;
  if(isCrit){ gained *= 10; flash("Крит! x10"); }
  upgrades.slice(33,41).forEach((u,iIdx)=>{ if(u.bought && Math.random() < 0.15){ const bonus = 10 + iIdx*5; state.score += bonus; flash("Рандом бонус +"+bonus); } });
  state.score += gained;
  if(state.opened===1 && state.score >= 10) state.opened = 2;
  save(); render();
});

// luck button
const luckCost = 600, probGod = 0.00001, probSecret = 0.01, probRare = 0.08999;
document.getElementById("luckBtn").addEventListener("click", ()=>{
  if(state.score < luckCost){ flash("Нужно 600 кликов"); return; }
  state.score -= luckCost;
  save();
  const r = Math.random();
  if(r < probGod){ applyTempMult(1000,300000); flash("БОГ! X1000 на 5 минут!"); return; }
  if(r < probGod + probSecret){ state.critChance += 5; flash("СЕКРЕТ! +5% к криту"); render(); save(); return; }
  if(r < probGod + probSecret + probRare){ applyTempMult(2,30000); flash("Редкость! x2 на 30с"); render(); save(); return; }
  state.score += 100; flash("Обычный: +100"); render(); save();
});

// temp mult
let activeTemp = null;
function applyTempMult(mult, duration){
  if(activeTemp && activeTemp.timeout) clearTimeout(activeTemp.timeout);
  const prev = state.multiplier;
  state.multiplier *= mult;
  render();
  activeTemp = { prev, timeout: setTimeout(()=>{ state.multiplier = prev; activeTemp = null; render(); flash("Временный эффект окончен"); }, duration) };
}

// donate
document.getElementById("donateBtn").addEventListener("click", ()=>{ if(confirm("Переход на donate.stream — продолжить?")) window.location.href = "https://donate.stream/igorlos081"; });

// reset
document.getElementById("resetBtn").addEventListener("click", ()=>{ if(confirm("Сбросить весь прогресс?")){ localStorage.removeItem(SAVE_KEY); Object.assign(state,{ score:0, per:1, multiplier:1, auto:0, opened:1, rebirths:0, critChance:5 }); upgrades.forEach(u=>u.bought=false); save(); render(); flash("Прогресс сброшен"); } });

// modal funcs
shopBtn.addEventListener("click", ()=>{ renderShop(); showModal("Магазин", "Купи улучшения справа."); });
modalClose.addEventListener("click", closeModal);
function showModal(title, html){ modal.style.display = "flex"; modalContent.innerHTML = `<h3>${title}</h3><div style="max-height:60vh;overflow:auto">${html}</div>`; }
function closeModal(){ modal.style.display = "none"; modalContent.innerHTML = ""; }

// flash
function flash(txt){ const el = document.createElement("div"); el.textContent = txt; el.style.position = "fixed"; el.style.left = "50%"; el.style.transform = "translateX(-50%)"; el.style.bottom = "18px"; el.style.background = "rgba(0,0,0,0.6)"; el.style.color = "#fff"; el.style.padding = "8px 12px"; el.style.borderRadius = "8px"; el.style.zIndex = 9999; document.body.appendChild(el); setTimeout(()=>el.remove(), 1400); }

render();
save();
