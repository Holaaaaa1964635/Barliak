const navButtons = document.querySelectorAll('[data-nav]');
const views = document.querySelectorAll('.view');
const projectList = document.getElementById('projectList');
const state = JSON.parse(localStorage.getItem('barliakState') || '{"projects":[],"profile":""}');

function saveState() { localStorage.setItem('barliakState', JSON.stringify(state)); renderProjects(); }
function goTo(view) {
  views.forEach(v => v.classList.toggle('active', v.dataset.view === view));
  navButtons.forEach(b => b.classList.toggle('active', b.dataset.nav === view));
}
navButtons.forEach(btn => btn.addEventListener('click', () => goTo(btn.dataset.nav)));

// Drawing
const canvas = document.getElementById('drawCanvas');
const ctx = canvas.getContext('2d');
ctx.lineCap = 'round';
let drawing = false;
let eraser = false;
function pointerPos(e) {
  const r = canvas.getBoundingClientRect();
  const t = e.touches?.[0] || e;
  return { x: (t.clientX - r.left) * (canvas.width / r.width), y: (t.clientY - r.top) * (canvas.height / r.height) };
}
function startDraw(e){ drawing = true; const p = pointerPos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); }
function moveDraw(e){ if(!drawing) return; e.preventDefault(); const p = pointerPos(e); ctx.strokeStyle = eraser ? '#fffdf8' : brushColor.value; ctx.lineWidth = +brushSize.value; ctx.lineTo(p.x,p.y); ctx.stroke(); }
function endDraw(){ drawing = false; }
['mousedown','touchstart'].forEach(ev => canvas.addEventListener(ev,startDraw));
['mousemove','touchmove'].forEach(ev => canvas.addEventListener(ev,moveDraw,{passive:false}));
['mouseup','mouseleave','touchend'].forEach(ev => canvas.addEventListener(ev,endDraw));

const brushColor = document.getElementById('brushColor');
const brushSize = document.getElementById('brushSize');
document.getElementById('eraserBtn').onclick = () => eraser = !eraser;
document.getElementById('clearCanvasBtn').onclick = () => ctx.clearRect(0,0,canvas.width,canvas.height);
document.getElementById('saveDrawingBtn').onclick = () => {
  state.projects.push({type:'dibujo', name:`Dibujo ${new Date().toLocaleString()}`, data: canvas.toDataURL('image/png')});
  saveState();
};

// Music sequencer
const notes = [220,247,262,294];
const names = ['Bass','Lead','Bell','Pad'];
const steps = 8;
const grid = notes.map(() => Array(steps).fill(false));
const sequencer = document.getElementById('sequencer');
let beatTimer = null;

function renderSequencer(){
  sequencer.innerHTML='';
  grid.forEach((row, r) => {
    const line = document.createElement('div'); line.className='seq-row';
    const label = document.createElement('strong'); label.textContent = names[r];
    line.appendChild(label);
    row.forEach((active, c) => {
      const b = document.createElement('button');
      b.className='step' + (active ? ' active':'' );
      b.onclick = () => { grid[r][c] = !grid[r][c]; renderSequencer(); };
      line.appendChild(b);
    });
    sequencer.appendChild(line);
  });
}
function beep(freq, duration = 0.12){
  const ac = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = 'triangle'; osc.frequency.value = freq;
  gain.gain.value = 0.05;
  osc.connect(gain); gain.connect(ac.destination);
  osc.start(); osc.stop(ac.currentTime + duration);
}
function playSequence(){
  let col=0; const bpm = +document.getElementById('bpmInput').value;
  const interval = 60000 / bpm / 2;
  beatTimer = setInterval(() => {
    notes.forEach((n, r) => grid[r][col] && beep(n));
    col = (col + 1) % steps;
  }, interval);
}
document.getElementById('playBeatBtn').onclick = () => { if(!beatTimer) playSequence(); };
document.getElementById('stopBeatBtn').onclick = () => { clearInterval(beatTimer); beatTimer = null; };
document.getElementById('saveBeatBtn').onclick = () => { state.projects.push({type:'beat', name:`Beat ${new Date().toLocaleString()}`, data:grid}); saveState(); };

// Minigame Color Flash
const flashColors = ['#ff6fa9','#6fffaa','#6fd6ff','#ffd56f'];
const pads = document.getElementById('flashPads');
const status = document.getElementById('flashStatus');
let sequence = []; let input = [];
flashColors.forEach((c, i) => {
  const p = document.createElement('button');
  p.className='pad'; p.style.background = c;
  p.onclick = () => handlePad(i);
  pads.appendChild(p);
});
function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }
async function showSequence(){
  const allPads = [...pads.children];
  for(const i of sequence){ allPads[i].classList.add('flash'); await sleep(350); allPads[i].classList.remove('flash'); await sleep(160); }
}
async function nextRound(){ input=[]; sequence.push(Math.floor(Math.random()*4)); status.textContent = `Puntuación: ${sequence.length-1}`; await showSequence(); }
function handlePad(i){
  if(!sequence.length) return;
  input.push(i);
  if(input[input.length-1] !== sequence[input.length-1]){ status.textContent='¡Oops! Intenta de nuevo.'; sequence=[]; return; }
  if(input.length === sequence.length) nextRound();
}
document.getElementById('startFlashGame').onclick = () => { sequence=[]; nextRound(); };

// Idea generator + profile
const ideas = [
  'Dibuja un monstruo amistoso que haga música con frutas.',
  'Crea un beat para una carrera espacial de caracoles.',
  'Diseña un logo animado para una banda de robots chefs.',
  'Haz un mini cómic de 3 escenas con un héroe acuático.'
];
document.getElementById('ideaBtn').onclick = () => {
  document.getElementById('ideaText').textContent = ideas[Math.floor(Math.random()*ideas.length)];
};
const profileName = document.getElementById('profileName');
profileName.value = state.profile || '';
document.getElementById('saveProfileBtn').onclick = () => { state.profile = profileName.value.trim(); saveState(); };
document.getElementById('saveAllBtn').onclick = saveState;

function renderProjects(){
  projectList.innerHTML = '';
  state.projects.slice().reverse().forEach(p => {
    const li = document.createElement('li');
    li.textContent = `${p.type.toUpperCase()}: ${p.name}`;
    projectList.appendChild(li);
  });
}
renderProjects();
renderSequencer();
goTo('inicio');
