import {questionSets,getQuestionSet} from './question-sets.ad098141d092.js';
import {questions as standardQuestions, questionSetId as standardQuestionSetId, tierDistance, maximumRunDistance, resultsFor, bands, validateAllocation, boostImpact, flightDistance, routeMilestones, routeTracker} from './game.ad098141d092.js';
import {cupPosition, launchPhysics, loadedAngle, releaseAngle, routeProgress, animationTiming, boostVisual} from './physics.ad098141d092.js';
const $=id=>document.getElementById(id), fmt=n=>n===null?'—':n.toLocaleString('en-US');
const publicGame=/^\/launchnow(?:\/|$)/.test(location.pathname);
const rising=publicGame||location.pathname.includes('/rising-difficulty');
let lastSet='1';try{lastSet=localStorage.getItem('launcher-set-choice')||'1';}catch{}
let activeSet=getQuestionSet(new URLSearchParams(location.search).get('set')||lastSet);
const variant=rising?'rising-difficulty':location.pathname.includes('/pre-boost')?'pre-boost':'single';
const mode=variant==='single'?'single':'pre-boost';
let questions=rising?activeSet.questions:standardQuestions;
let questionSetId=rising?activeSet.version:standardQuestionSetId;
let key=`launcher-${variant}-${questionSetId}`;
document.body.dataset.variant=variant;
if(rising)document.title='Launcher — rising difficulty';
const QUESTION_MS=20000;
let resumeRun=null, introHandle;
let answers=[], selected=false, phase='lobby', animation;
let started=false, allocation=[1,1,1,1,0], questionDeadline=0, deadlineIndex=-1, timerHandle;
let sceneBase=0, cameraX=0, cameraY=0;
let sceneWidth=480, sceneHeight=260, groundCamera=0;
const runResults=()=>answers.length?resultsFor(answers,{mode,allocation,questions}):[];
function loadSavedRun(){
  answers=[];started=false;resumeRun=null;allocation=[1,1,1,1,0];questionDeadline=0;deadlineIndex=-1;
  try {
    const saved=JSON.parse(localStorage.getItem(key));
    if(saved){
      if(mode==='pre-boost'&&!validateAllocation(saved.allocation))throw new Error('Invalid plan');
      answers=saved.answers;allocation=saved.allocation||allocation;runResults();
      if(saved.started===true)resumeRun=JSON.parse(JSON.stringify(saved));
      questionDeadline=Number(saved.questionDeadline)||0;deadlineIndex=saved.deadlineIndex;
    }
  }catch{answers=[];started=false;resumeRun=null;allocation=[1,1,1,1,0];}
}
loadSavedRun();
const save=()=>{try{localStorage.setItem(key,JSON.stringify({answers,started,allocation,questionDeadline,deadlineIndex}));}catch{}};
const total=()=>runResults().reduce((sum,r)=>sum+r.meters,0);
const boostUsed=()=>answers.some(a=>a.boost);
const show=(id,visible)=>{$(id).hidden=!visible;};
function vehicleIcon(multiplier){
  const paths=[
    '<path d="M10 37 L20 18 L31 37Z" fill="#d1ab7a"/><path d="M7 38H34 M20 20L39 13"/><path d="M33 11Q39 10 44 8Q44 19 36 18Z" fill="#ead2a6"/>',
    '<path d="M5 16H31Q43 16 40 8Q37 2 31 8 M3 26H39Q49 26 44 34Q40 40 34 34 M10 38H26" fill="none"/>',
    '<path d="M4 22L46 8L25 40L20 25Z" fill="#fffaf0"/><path d="M20 25L46 8L25 40" fill="#c0d8db"/>',
    '<path d="M5 24L1 10L8 11L17 24H25L21 6L27 7L36 24H44Q54 30 42 33H8Z" fill="#fffaf0"/><path d="M21 29L13 43L20 43L33 30" fill="#adced2"/>',
    '<path d="M13 18L2 25L13 32" fill="#f1bd52"/><path d="M13 17Q29 7 47 25Q29 43 13 33Z" fill="#fff7e3"/><path d="M38 16L47 25L38 34L32 25Z" fill="#df795d"/><path d="M18 15L12 6L10 21 M18 35L12 44L10 29" fill="#df795d"/><circle cx="26" cy="25" r="5" fill="#b8d6d8"/>'
  ];
  return `<svg class="vehicle-icon" viewBox="0 0 54 50" aria-hidden="true" fill="none" stroke="#526d5b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths[Math.min(5,Math.max(1,multiplier))-1]}</svg>`;
}
function launchIcon(multiplier){
  return `<span class="launch-combo" aria-hidden="true">${vehicleIcon(1)}${multiplier>1?`<i>+</i>${vehicleIcon(multiplier)}`:''}</span>`;
}
function refreshLaunch(seconds=Math.max(0,Math.ceil((questionDeadline-Date.now())/1000))){
  if(phase!=='guess'&&phase!=='entering')return;
  const multiplier=mode==='pre-boost'?allocation[answers.length]+1:selected?2:1;
  const effect=boostVisual(multiplier,2);
  if(!$('launch').querySelector('.button-timer'))$('launch').innerHTML='<span class="launch-label"></span><span class="button-timer"></span>';
  $('launch').querySelector('.launch-label').textContent=`Let it fly${multiplier>1?` · ${multiplier}×`:''} ↗`;
  $('launch').querySelector('.button-timer').textContent=`${seconds}s`;
  const juice=phase==='entering'?1:Math.max(0,Math.min(1,(questionDeadline-Date.now())/QUESTION_MS));
  $('launch').style.setProperty('--juice',juice);$('launch').dataset.juice=String(juice);
  $('launch').classList.toggle('urgent',seconds<=5);
  $('launch').setAttribute('aria-label',`Let it fly at ${multiplier} times. ${seconds} seconds remaining`);
  $('planned-boost').innerHTML=`${vehicleIcon(multiplier)}<strong>${multiplier}×</strong><span>${effect.name}</span>`;
  $('planned-boost').dataset.multiplier=multiplier;
}
function prepareBoost(result){
  const visual=boostVisual(result.multiplier,result.tier),dud=visual.power==='dud';
  const g=$('boost-effect');g.dataset.kind=visual.kind;g.dataset.power=visual.power;
  const outline='stroke="#496353" stroke-width="1.6" stroke-linejoin="round"';
  if(visual.kind==='none')g.innerHTML='';
  if(visual.kind==='wind')g.innerHTML=dud?'<g fill="#fffdf7" opacity=".85"><circle cx="-30" cy="12" r="8"/><circle cx="-43" cy="15" r="6"/></g>':`<g fill="none" stroke="#fffdf7" stroke-width="3" stroke-linecap="round"><path d="M-105 -8 H-42 Q-22 -8 -26 -20 Q-31 -31 -41 -23"/><path d="M-125 8 H-29 Q-15 8 -17 18 Q-19 28 -29 24"/><path d="M-90 28 H-47"/></g>`;
  if(visual.kind==='paper-plane')g.innerHTML=dud?`<path d="M-27 15 L-17 7 L-9 14 L2 6 L10 17 L23 11 L20 28 L3 24 L-11 29Z" fill="#f5f0df" ${outline}/>`:`<g ${outline}><path d="M-57 19 L56 0 L-5 37 L-14 22Z" fill="#fffdf7"/><path d="M-14 22 L56 0 L-5 37" fill="#d7e6e2"/><path d="M-14 22 L-16 34 L-5 27" fill="#afc9c5"/></g>`;
  if(visual.kind==='airliner')g.innerHTML=`<g ${outline}><path d="M-71 16 L-83 -15 L-65 -13 L-44 13 L-9 12 L-22 -15 L-8 -16 L23 12 L55 12 Q82 13 88 23 Q80 32 55 32 H-62 Q-75 30 -71 16Z" fill="${dud?'#e1e3d7':'#fffdf7'}"/><path d="M-28 22 L-53 51 L-34 51 L13 28" fill="#c0d8db"/><path d="M-60 26 H67" stroke="#7fadb5" stroke-width="3"/><path d="M47 14 L58 16 L64 21 H48Z" fill="#83a7ac"/><path d="M-22 18 h4 m9 0 h4 m9 0 h4 m9 0 h4" stroke="#7d9da0" stroke-width="3"/></g><g class="boost-exhaust" fill="#e6ddbe"><circle cx="-86" cy="22" r="7"/><circle cx="-100" cy="26" r="5"/></g>`;
  if(visual.kind==='rocket')g.innerHTML=`<g ${outline}><g class="boost-exhaust"><path d="M-47 4 L-99 19 L-47 32Z" fill="${dud?'#ded7b6':'#f2b541'}"/><path d="M-47 12 L-79 19 L-47 24Z" fill="#fff0a5"/></g><path d="M-43 -3 Q-6 -18 45 6 L60 19 L43 31 Q0 51 -43 36Z" fill="${dud?'#e2dac5':'#fff7e4'}"/><path d="M43 5 L60 19 L43 32 L31 19Z" fill="#df795d"/><path d="M-26 2 L-48 -16 L-48 12 M-25 34 L-48 53 L-48 28" fill="#df795d"/><circle cx="13" cy="18" r="9" fill="#aeced0"/><path d="M-44 3 V35" stroke="#b89a6a" stroke-width="4"/></g>`;
  return visual;
}
function stopTimer(){clearInterval(timerHandle);}
function startTimer(){
  stopTimer();
  if(deadlineIndex!==answers.length||!questionDeadline){questionDeadline=Date.now()+QUESTION_MS;deadlineIndex=answers.length;save();}
  function tick(){
    if(phase!=='guess')return;
    const seconds=Math.max(0,Math.ceil((questionDeadline-Date.now())/1000));
    $('timer').textContent=`${seconds}s`;$('timer').setAttribute('aria-label',`${seconds} seconds remaining`);$('timer').classList.toggle('urgent',seconds<=5);refreshLaunch(seconds);
    if(seconds===0){stopTimer();submitGuess(true);}
  }
  tick();if(phase==='guess')timerHandle=setInterval(tick,150);
}
function renderSetPicker(){
  show('set-picker',rising);
  $('set-options').innerHTML=questionSets.map(set=>{
    let complete=false;try{complete=JSON.parse(localStorage.getItem(`launcher-rising-difficulty-${set.version}`))?.answers?.length===5;}catch{}
    return `<button type="button" data-set="${set.id}" aria-pressed="${set.id===activeSet.id}" aria-label="${set.name}${complete?', completed':''}">${set.name}${complete?' ✓':''}</button>`;
  }).join('');
}
function selectSet(id){
  activeSet=getQuestionSet(id);questions=activeSet.questions;questionSetId=activeSet.version;key=`launcher-${variant}-${questionSetId}`;
  try{localStorage.setItem('launcher-set-choice',activeSet.id);}catch{}
  const url=new URL(location.href);url.searchParams.set('set',activeSet.id);history.replaceState(null,'',url);
  loadSavedRun();render();window.scrollTo({top:0,behavior:'instant'});
}
$('set-options').addEventListener('click',e=>{const button=e.target.closest('button[data-set]');if(button&&!started&&button.dataset.set!==activeSet.id)selectSet(button.dataset.set);});
$('next-set').addEventListener('click',()=>selectSet(questionSets[(questionSets.indexOf(activeSet)+1)%questionSets.length].id));
function renderAllocation(){
  $('vehicle-guide').innerHTML=[2,3,4,5].map(m=>`<span>${vehicleIcon(m)}<b>${m}×</b><small>${boostVisual(m,2).name}</small></span>`).join('');
  const remaining=4-allocation.reduce((s,n)=>s+n,0);
  $('allocations').innerHTML=allocation.map((n,i)=>`<div class="allocation-row"><span>Question ${i+1}${rising?`<small class="allocation-difficulty" data-level="${questions[i].difficulty}">${questions[i].difficultyLabel} · ${fmt(tierDistance(questions[i]))} m</small>`:''}</span><div class="allocation-vehicle">${launchIcon(n+1)}<span><b>${boostVisual(n+1,2).name}</b><small>Up to ${fmt(tierDistance(questions[i])*(n+1))} m</small></span></div><div><button type="button" data-question="${i}" data-change="-1" aria-label="Remove boost charge from question ${i+1}" ${n===0?'disabled':''}>−</button><strong>${n+1}×</strong><button type="button" data-question="${i}" data-change="1" aria-label="Add boost charge to question ${i+1}" ${remaining===0?'disabled':''}>+</button></div></div>`).join('');
  $('remaining').textContent=remaining?`${remaining} boost charge${remaining===1?'':'s'} left to assign`:'All 4 charges assigned. Your plan locks when you start.';
  $('start').disabled=mode==='pre-boost'&&remaining!==0;
}
function lobby(){
  stopTimer();setPhase('lobby');show('lobby',true);show('play',false);show('finish',false);resetScene();
  $('lobby').querySelector('h1').innerHTML=rising?'Raise the stakes.':mode==='pre-boost'?'Plan your launch.':'Little guesses.<br>Big adventures.';
  $('mode-label').textContent=publicGame?`LAUNCHER · ${activeSet.name.toUpperCase()}`:rising?'EXPERIMENT · RISING DIFFICULTY':mode==='pre-boost'?'EXPERIMENT · PRE-BOOST':'THE ORIGINAL · SINGLE BOOST';
  $('lobby-copy').textContent=rising?'Easy → obscure. Harder questions launch farther. Five hidden questions, 20 seconds each.':mode==='pre-boost'?'Five hidden questions. 20 seconds each. Place your boosts before the first question.':'Five questions. 20 seconds each. One 2× boost to use when you feel confident.';
  show('allocation-panel',mode==='pre-boost');
  $('experiment-link').href=mode==='pre-boost'?'/':'/launcher/pre-boost';$('experiment-link').textContent=mode==='pre-boost'?'Play the original single-boost version ↗':'Try the pre-boost experiment ↗';
  $('difficulty-link').href=rising?'/launcher/pre-boost':'/launcher/rising-difficulty';
  $('difficulty-link').textContent=rising?'Play mixed-difficulty pre-boost ↗':'Try rising difficulty ↗';
  show('experiment-link',!publicGame);show('difficulty-link',!publicGame);renderSetPicker();
  show('resume',Boolean(resumeRun));$('resume').textContent=resumeRun?.answers.length===questions.length?'View last run':'Resume saved game';
  renderAllocation();
}
$('allocations').addEventListener('click',e=>{const b=e.target.closest('button[data-question]');if(!b||started)return;const i=Number(b.dataset.question),change=Number(b.dataset.change),remaining=4-allocation.reduce((s,n)=>s+n,0);if(change<0&&allocation[i]>0)allocation[i]--;if(change>0&&remaining>0)allocation[i]++;renderAllocation();});
$('resume').addEventListener('click',()=>{if(!resumeRun)return;answers=resumeRun.answers.map(a=>({...a}));allocation=[...resumeRun.allocation];questionDeadline=resumeRun.questionDeadline;deadlineIndex=resumeRun.deadlineIndex;started=true;resumeRun=null;render();});
$('start').addEventListener('click',()=>{if(mode==='pre-boost'&&!validateAllocation(allocation))return;resumeRun=null;started=true;answers=[];questionDeadline=0;deadlineIndex=-1;save();render();});
if(mode==='pre-boost')$('boost-rules').textContent=(rising?'Questions get harder from 1 (easy) to 5 (obscure), with larger distance rewards. ':'')+'Before starting, assign four boost charges across five hidden questions. Every question starts at 1× and each charge adds +1×. Your plan locks when you start; you cannot change it during the round.';
if(rising){
  $('distance-rules').textContent='Harder questions launch you farther. Each boost multiplies the distance earned by your guess.';
  $('tier-rules').innerHTML='<strong>Exact answers, before boosts</strong><br>'+questions.map((q,i)=>`Question ${i+1} · ${q.difficultyLabel} · ${fmt(tierDistance(q))} m`).join('<br>');
  $('allocation-help').innerHTML='Assign <strong>4 boost charges</strong> before seeing the questions. Every question starts at 1×; each charge adds +1×. Distances beside difficulty are before boosts.';
}
function setPhase(value){phase=value;document.body.dataset.phase=value;document.querySelector('.shell').inert=value==='flying';}
function sizeScene(){
  const scale=innerWidth>=800?1.6:1.1;
  const previousGround=groundCamera;
  sceneWidth=innerWidth/scale;sceneHeight=innerHeight/scale;
  groundCamera=181-sceneHeight*(innerWidth>=800?.80:.88)+(innerWidth<800&&innerHeight<700?10/scale:0);
  $('stage').querySelector('svg').setAttribute('viewBox',`0 0 ${sceneWidth} ${sceneHeight}`);
  $('sky').setAttribute('width',sceneWidth);$('sky').setAttribute('height',sceneHeight);
  updateCamera(cameraX,cameraY+groundCamera-previousGround,total());
}
window.addEventListener('resize',sizeScene);

function routeRegion(metres){return routeTracker(metres).current.name;}
let trackerMetres=-1;
function updateTracker(metres){
  const max=maximumRunDistance(questions,mode);
  const state=routeTracker(metres,max),ruler=$('route-ruler'),viewport=$('route-window');
  if(!$('ruler-ticks').children.length){
    $('ruler-ticks').innerHTML=Array.from({length:Math.ceil(max/250)+1},(_,i)=>`<span class="${i%4===0?'major':''}" style="left:${Math.min(max,i*250)/max*100}%"></span>`).join('');
    $('ruler-milestones').innerHTML=routeMilestones.map((m,i)=>`<span class="ruler-milestone ${i===0?'first':''} ${m.metres===max?'last':''}" data-metres="${m.metres}" style="left:${m.metres/max*100}%"><i></i><b>${m.name}</b><small>${m.metres===0?'Start':fmt(m.metres)+' m'}</small></span>`).join('')+(max>6000?`<small class="ruler-max">${fmt(max)} m</small>`:'');
  }
  $('tracker-distance').textContent=`${fmt(metres)} m`;$('tracker-location').textContent=state.current.name;
  $('tracker-next').textContent=state.next?`Next: ${state.next.name} · ${fmt(state.remaining)} m`:'All landscapes reached';
  ruler.style.setProperty('--progress',`${state.percent}%`);
  $('ruler-milestones').querySelectorAll('.ruler-milestone').forEach(el=>{const m=Number(el.dataset.metres);el.classList.toggle('passed',metres>=m);el.classList.toggle('current',state.current.metres===m);});
  $('distance-tracker').setAttribute('aria-label',`${fmt(metres)} metres travelled. ${state.current.name}. ${state.next?`${fmt(state.remaining)} metres to ${state.next.name}.`:'All landscapes reached.'}`);
  if(metres!==trackerMetres){
    const marker=state.percent/100*ruler.clientWidth;
    viewport.scrollLeft=Math.max(0,Math.min(ruler.clientWidth-viewport.clientWidth,marker-viewport.clientWidth*.38));
    trackerMetres=metres;
  }
}
function updateCamera(x,y,metres){
  cameraX=x;cameraY=y;
  $('world').setAttribute('transform',`translate(${-x} ${-y})`);
  updateTracker(metres);
  const region=routeRegion(metres);
  $('scene-distance').textContent=`${region.toUpperCase()} · ${fmt(metres)} m`;
  const wrap=(n,size)=>((n%size)+size)%size;
  const clouds=[];
  const cloudStart=Math.floor(x*.18/170)-1;
  for(let i=cloudStart;i<cloudStart+Math.ceil(sceneWidth/170)+3;i++){
    const cx=i*170-x*.18,cy=42+wrap(i,3)*20-y*.2;
    clouds.push(`<path d="M${cx} ${cy} q-8 -11 5 -16 q6 -17 20 -8 q14 -9 20 8 q17 1 12 16 Z" fill="#fffdf7" opacity=".85"/>`);
  }
  $('cloud-layer').innerHTML=clouds.join('');
  renderBiome(x,y,metres);
}
const climates=[
  {sky:'#e7f1f7',far:'#c7dae4',near:'#e0ebef',ground:'#f0f5f5',edge:'#bcd2dd'},
  {sky:'#e5eef1',far:'#9fb8bc',near:'#c5d4cc',ground:'#dfe8de',edge:'#a8bba8'},
  {sky:'#e9f3ec',far:'#aec5af',near:'#c2d5ad',ground:'#dbe5bc',edge:'#adbe91'},
  {sky:'#f9edd7',far:'#c5a184',near:'#e1bd87',ground:'#efdaad',edge:'#cdb07c'},
  {sky:'#e3f4f0',far:'#a2d2c8',near:'#c7e2cd',ground:'#f6e5b5',edge:'#e1ca94'}
];
function mixColour(a,b,t){const rgb=c=>[1,3,5].map(i=>parseInt(c.slice(i,i+2),16));const aa=rgb(a),bb=rgb(b);return '#'+aa.map((n,i)=>Math.round(n+(bb[i]-n)*t).toString(16).padStart(2,'0')).join('');}
function renderBiome(x,y,metres){
  const index=routeMilestones.findLastIndex(m=>metres>=m.metres),i=Math.max(0,index),next=Math.min(4,i+1);
  const blend=next===i?0:Math.max(0,Math.min(1,(metres-routeMilestones[next].metres+300)/300));
  const palette=Object.fromEntries(Object.keys(climates[i]).map(k=>[k,mixColour(climates[i][k],climates[next][k],blend)]));
  $('stage').dataset.region=routeMilestones[i].name;
  $('sky').setAttribute('fill',palette.sky);$('terrain-ground').setAttribute('fill',palette.ground);$('terrain-edge').setAttribute('stroke',palette.edge);$('terrain-texture').setAttribute('opacity',String(i===2?.35:.08));
  let distant='',near='',features='';
  for(const [region,opacity] of [[i,1-blend],[next,blend]]){
    if(!opacity)continue;
    let backdrop='',objects='';
    const first=Math.floor(x*.28/260)-1,hy=166-y*.55;
    for(let n=first;n<first+Math.ceil(sceneWidth/260)+3;n++){
      const hx=n*260-x*.28;
      if(region===0)backdrop+=`<path d="M${hx-20} ${hy+35} L${hx+30} ${hy-42} L${hx+85} ${hy-42} L${hx+118} ${hy+4} L${hx+170} ${hy-20} L${hx+275} ${hy+35} V30000 H${hx-20} Z" fill="#cbdfe9"/><path d="M${hx+30} ${hy-42} L${hx+85} ${hy-42} L${hx+67} ${hy+10} L${hx-10} ${hy+20}Z" fill="#e9f2f5"/>`;
      if(region===1)backdrop+=`<path d="M${hx-30} ${hy+35} Q${hx+65} ${hy-108} ${hx+125} ${hy-91} Q${hx+200} ${hy-88} ${hx+280} ${hy+35} V30000H${hx-30}Z" fill="#9fb9bb"/><path d="M${hx+44} ${hy-43} Q${hx+88} ${hy-111} ${hx+125} ${hy-91} Q${hx+151} ${hy-85} ${hx+178} ${hy-54} Q${hx+127} ${hy-74} ${hx+103} ${hy-57}Z" fill="#edf2ef"/>`;
      if(region===2)backdrop+=`<path d="M${hx-20} ${hy+35} Q${hx+80} ${hy-45} ${hx+170} ${hy+4} Q${hx+220} ${hy-12} ${hx+280} ${hy+35} V30000 H${hx-20}Z" fill="#b6cdb3"/>`;
      if(region===3)backdrop+=`<path class="biome-dune" d="M${hx-30} ${hy+35} Q${hx+10} ${hy-14} ${hx+110} ${hy-41} Q${hx+160} ${hy-4} ${hx+280} ${hy+35} V30000H${hx-30}Z" fill="#dbb77c"/><path d="M${hx+110} ${hy-41} Q${hx+135} ${hy+2} ${hx+218} ${hy+35} H${hx+280}Z" fill="#c9a371"/>`;
      if(region===4)backdrop+=`<path d="M${hx-30} ${hy+35} Q${hx+80} ${hy-8} ${hx+160} ${hy+20} L${hx+280} ${hy+35} V30000H${hx-30}Z" fill="#afd6c6"/>`;
    }
    const fg=171-y*.78,fx=-((x*.55%400)+400)%400;
    near+=`<g opacity="${opacity}"><path d="M${fx-400} ${fg+20} C${fx-280} ${fg-15} ${fx-100} ${fg+30} ${fx} ${fg+20} `+Array.from({length:Math.ceil(sceneWidth/400)+3},(_,n)=>`C${fx+n*400+100} ${fg-15} ${fx+n*400+300} ${fg+30} ${fx+(n+1)*400} ${fg+20}`).join(' ')+` V30000 H${fx-400}Z" fill="${climates[region].near}"/></g>`;
    if(region===3)backdrop+=`<circle cx="${sceneWidth-80-x*.015%100}" cy="${60-y*.1}" r="29" fill="#efc177" opacity=".7"/>`;
    const firstObject=Math.floor(x/270)-1;
    if(region===4){
      objects+=`<path d="M${x-500} 210 Q${x+sceneWidth*.5} 190 ${x+sceneWidth+500} 217 V30000 H${x-500}Z" fill="#87cbd0"/><path d="M${x-500} 212 Q${x+sceneWidth*.5} 193 ${x+sceneWidth+500} 219" fill="none" stroke="#eaf5e9" stroke-width="5"/>`;
      for(let w=firstObject;w<firstObject+Math.ceil(sceneWidth/270)+3;w++)objects+=`<path d="M${w*270} 244 h90 M${w*270+100} 274 h60" stroke="#dcf2eb" stroke-width="2"/>`;
    }
    for(let n=firstObject;n<firstObject+Math.ceil(sceneWidth/270)+3;n++){
      const wx=n*270+150;
      if(region===0)objects+=`<g class="biome-ice" transform="translate(${wx} 181)"><path d="M-43 0 L-30 -25 L-13 -33 L0 -61 L15 -27 L35 -20 L48 0Z" fill="#bdd9e6"/><path d="M0 -61 L15 -27 L35 -20 L48 0 L-3 -7Z" fill="#dcebf0"/><path d="M-80 25 l30 -5 l25 10 l27 -5 M40 48 l30 5 l18 -7" fill="none" stroke="#c5dbe5" stroke-width="2"/></g>`;
      if(region===1)objects+=`<g class="biome-conifer" transform="translate(${wx} 181)"><path d="M0 0 V-55" stroke="#829183" stroke-width="5"/><path d="M-26 -9 L0 -76 L26 -9Z" fill="#78978b"/><path d="M-19 -32 L0 -86 L19 -32Z" fill="#95aea1"/><path d="M-19 -32 L0 -86 L9 -62 L0 -66 L-5 -53Z" fill="#e7eee9"/><path d="M-26 -9 H26" stroke="#d2dfd1" stroke-width="4"/></g>`;
      if(region===2)objects+=`<g class="biome-cypress" transform="translate(${wx} 181)"><path d="M0 0 V-61" stroke="#9c9470" stroke-width="4"/><path d="M0 -91 Q-24 -41 -11 -13 Q0 -4 11 -13 Q24 -41 0 -91Z" fill="#7f9f73"/><path d="M-3 -77 Q-14 -41 -7 -19" stroke="#97ae7d" stroke-width="3" fill="none"/><path d="M28 31 q40 -13 83 -3 m-90 16 q55 -13 105 -4" stroke="#b5c18f" stroke-width="2" fill="none"/></g>`;
      if(region===3){if(n%3===0)objects+=`<path class="biome-rock" d="M${wx-22} 181 L${wx-10} 169 L${wx+9} 167 L${wx+24} 181Z" fill="#c4a17c"/>`;
        objects+=`<path d="M${wx-90} 225 q50 -16 100 0 m-30 31 q40 -12 80 0" stroke="#ddc18f" stroke-width="2" fill="none"/>`;
      }
      if(region===4)objects+=`<g class="biome-palm" transform="translate(${wx} 181)"><path d="M0 0 Q-13 -39 2 -78" stroke="#bc9769" stroke-width="7" fill="none"/><path d="M1 -77 Q-25 -106 -47 -80 Q-19 -89 1 -77 M1 -77 Q-7 -113 17 -112 Q4 -93 1 -77 M1 -77 Q25 -108 44 -89 Q23 -88 1 -77 M1 -77 Q43 -88 49 -60 Q26 -75 1 -77 M1 -77 Q-31 -81 -34 -51 Q-16 -69 1 -77" fill="#83b994" stroke="#7cac86" stroke-width="1"/><circle cx="-3" cy="-73" r="4" fill="#a3895c"/><circle cx="6" cy="-72" r="4" fill="#a3895c"/><path d="M-45 8 Q0 -2 39 8" fill="none" stroke="#ead39d" stroke-width="2"/></g>`;
    }
    distant+=`<g data-climate="${region}" opacity="${opacity}">${backdrop}</g>`;features+=`<g data-climate="${region}" opacity="${opacity}">${objects}</g>`;
  }
  $('hill-layer').innerHTML=distant;$('field-layer').innerHTML=near;$('landmark-layer').innerHTML=features;
}
function resetScene(){
  cancelAnimationFrame(animation);
  const checkpoint=routeProgress(runResults(),sceneWidth);
  sceneBase=checkpoint.base;
  $('launcher-rig').setAttribute('transform',`translate(${sceneBase} 0)`);
  $('boost-effect').setAttribute('opacity','0');$('speed-trail').setAttribute('opacity','0');$('perfect-halo').setAttribute('opacity','0');$('stage').removeAttribute('data-tier');$('result').removeAttribute('data-tier');show('achievement',false);
  updateCamera(checkpoint.camera,groundCamera,total());$('arm').setAttribute('transform',`rotate(${loadedAngle} 83 133)`);const loaded=cupPosition(loadedAngle);$('mascot').setAttribute('transform',`translate(${sceneBase+loaded.x} ${loaded.y})`);$('bean').style.transform='';$('trajectory').setAttribute('d','');$('dust').setAttribute('opacity','0');$('landing').textContent='';$('stage-caption').textContent=answers.length?`${routeRegion(total())} · ${fmt(total())} m along the route`:'North Pole · your adventure starts here';$('stage').setAttribute('aria-label','Your mascot waits in a catapult');
}
function render(){
  clearTimeout(introHandle);stopTimer();if(!started){lobby();return;}show('lobby',false);
  if(answers.length===questions.length){finish();return;}
  setPhase('entering');selected=false;const q=questions[answers.length];
  show('play',true);show('finish',false);show('entry',true);show('reveal',false);show('result',false);show('distance-details',false);show('launch',true);show('next',false);
  $('play').classList.remove('launching');$('round').textContent=`QUESTION ${answers.length+1} / 5${rising?` · SET ${activeSet.id}`:''}`;$('total').textContent=`${fmt(total())} m travelled`;
  $('progress').innerHTML=questions.map((_,i)=>`<span class="${i<answers.length?'done':i===answers.length?'current':''}"></span>`).join('');
  show('difficulty',rising);$('difficulty').textContent=rising?`${q.difficulty}/5 · ${q.difficultyLabel} · ${fmt(tierDistance(q))} m`:'';$('difficulty').dataset.level=q.difficulty||'';
  $('question').textContent=q.question;$('unit').textContent=q.unit;$('guess').value='';$('input-error').textContent='';
  show('boost',mode!=='pre-boost');show('boost-hint',mode!=='pre-boost');$('boost').disabled=boostUsed();$('boost').setAttribute('aria-pressed','false');$('boost').innerHTML=`<span>2×</span> ${boostUsed()?'Boost used':'Use my boost'}`;
  $('boost-hint').textContent=boostUsed()?'Your other launches still count.':'One shot. Pick your moment.';
  $('launch').disabled=false;$('launch').innerHTML='Let it fly <span>↗</span>';$('footnote').textContent=mode==='pre-boost'?'5 questions · your pre-game boost plan':'5 questions · one 2× boost · just for fun';$('distance-details').open=false;resetScene();
  $('launch').disabled=true;document.querySelector('.question-panel').inert=true;
  $('stage').dataset.building='true';refreshLaunch(20);$('stage-caption').textContent='A little assembly required…';
  introHandle=setTimeout(()=>{
    delete $('stage').dataset.building;
    document.querySelector('.question-panel').inert=false;$('launch').disabled=false;
    setPhase('guess');$('stage-caption').textContent=`${routeRegion(total())} · ${fmt(total())} m along the route`;startTimer();
    $('question').setAttribute('tabindex','-1');$('question').focus({preventScroll:true});
  },1250);
}
$('boost').addEventListener('click',()=>{if(phase!=='guess'||boostUsed()||mode!=='single')return;selected=!selected;$('boost').setAttribute('aria-pressed',String(selected));$('boost-hint').textContent=selected?'Double the distance on this launch.':'One shot. Pick your moment.';refreshLaunch();});
$('guess').addEventListener('input',()=>{$('input-error').textContent='';$('guess').removeAttribute('aria-invalid');});
$('guess-form').addEventListener('submit',e=>{e.preventDefault();submitGuess(false);});
async function submitGuess(timedOut){
  if(phase!=='guess')return;
  timedOut=timedOut||Date.now()>=questionDeadline;
  const q=questions[answers.length],raw=$('guess').value.trim();
  const valid=/^\d+$/.test(raw)&&Number.isSafeInteger(Number(raw))&&Number(raw)<=q.max;
  if(!valid&&!timedOut){$('input-error').textContent=`Enter a whole number from 0 to ${fmt(q.max)}.`;$('guess').setAttribute('aria-invalid','true');$('guess').focus();return;}
  const guess=timedOut?null:Number(raw), boost=!timedOut&&mode==='single'&&selected&&!boostUsed();
  stopTimer();questionDeadline=0;deadlineIndex=-1;
  answers.push({guess,boost,timedOut});save();$('guess').blur();
  const result=runResults().at(-1);
  show('entry',false);show('reveal',true);$('your-answer').textContent=timedOut?'No answer':fmt(guess);$('actual-answer').textContent=fmt(q.answer);$('your-answer').closest('span').classList.toggle('missed',guess!==q.answer);$('launch').disabled=true;if(!timedOut){
    setPhase('flying');$('launch').textContent='Pulling back…';$('play').classList.add('launching');
    await fly(result);
  }else{
    $('stage').setAttribute('aria-label','Time’s up. No answer. Your mascot stays in the catapult.');
  }
  $('play').classList.remove('launching');setPhase('result');show('launch',false);show('next',true);show('result',true);show('distance-details',true);
  $('verdict').textContent=result.name;$('result').dataset.tier=result.tier;show('achievement',result.tier===0);$('distance').textContent=fmt(result.meters);$('distance-note').textContent=timedOut?'Time’s up. No launch.':result.multiplier>1?`${fmt(result.baseMetres)} m · ${result.multiplier}× boost = ${fmt(result.meters)} m`:`${fmt(result.meters)} m · this launch`;
  $('distance-details').querySelector(':scope > .small').textContent=mode==='pre-boost'?`${fmt(tierDistance(q))} m for an exact answer before boosts. Your ${result.multiplier}× multiplier applies to these distances.`:'Whole numbers only. Your 2× boost doubles this distance.';$('fact').textContent=q.fact;$('source').href=q.url;$('source').textContent=`${q.source} ↗`;
  $('ranges').innerHTML=bands(q).map(b=>`<div class="range-row"><span><b>${b.name}</b><small>${b.ranges.map(([lo,hi])=>lo===hi?fmt(lo):`${fmt(lo)}–${fmt(hi)}`).join(' or ')}</small></span><strong>${fmt(b.metres)} m</strong></div>`).join('');
  $('total').textContent=`${fmt(total())} m travelled`;$('next').focus({preventScroll:true});$('next').innerHTML=answers.length===5?'See my run <span>→</span>':'Next question <span>→</span>';$('footnote').textContent=mode==='pre-boost'?'Your pre-game boost plan is locked.':boost?'Your 2× boost is now used.':'Every metre moves you along the route.';
}
function fly(result){
  const flop=result.tier===4, model=launchPhysics(result.meters);
  const gentle=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const draw=.4, hold=.15, swingStart=draw+hold, flightStart=swingStart+model.swingDuration;
  const contact=flightStart+model.duration, settle=.25;
  const targetDuration=animationTiming(result.tier,result.multiplier,result.meters),speed=(contact+settle)/targetDuration;
  const boost=prepareBoost(result);
  const priorDistance=runResults().slice(0,-1).reduce((sum,r)=>sum+r.meters,0);
  const countDistance=p=>{
    const distance=flightDistance(result,p);
    $('live-distance').textContent=fmt(distance.total);$('live-base').textContent=fmt(distance.base);$('live-bonus').textContent=fmt(distance.bonus);$('live-run').textContent=fmt(priorDistance+distance.total);
    $('flight-distance').dataset.multiplier=result.multiplier;
  };
  $('live-boost').textContent=`THIS LAUNCH · ${result.multiplier}× ${boost.name.toUpperCase()}`;
  countDistance(0);
  let lastWallTime=0;
  const setPose=(x,y,angle=0)=>$('mascot').setAttribute('transform',`translate(${sceneBase+x} ${y}) rotate(${angle})`);
  const runBefore=total()-result.meters;
  const cameraStart=cameraX;
  $('stage').dataset.tier=result.tier;
  $('stage').setAttribute('aria-label',`The mascot launches and lands after ${result.meters} metres.`);
  return new Promise(resolve=>{
    const start=performance.now();
    function frame(now){
      const wallTime=(now-start)/1000,time=wallTime*speed;
      const dt=Math.min(.05,Math.max(0,wallTime-lastWallTime));lastWallTime=wallTime;
      if(time<flightStart){
        let angle;
        if(time<draw){const t=time/draw;angle=loadedAngle+(-165-loadedAngle)*(t*t*(3-2*t));}
        else if(time<swingStart)angle=-165;
        else {const t=(time-swingStart)/model.swingDuration;angle=-165+(releaseAngle+165)*t*t;}
        const cup=cupPosition(angle);
        $('arm').setAttribute('transform',`rotate(${angle} 83 133)`);setPose(cup.x,cup.y);
        $('stage-caption').textContent=time<swingStart?'Pulling back…':'Here goes…';
      } else {
        const sinceRelease=time-flightStart, t=Math.min(sinceRelease,model.duration);
        const progress=t/model.duration;
        countDistance(progress);
        // The empty arm keeps moving forward and settles against its stop.
        const follow=Math.min(sinceRelease/.28,1);
        $('arm').setAttribute('transform',`rotate(${releaseAngle+42*Math.sin(follow*Math.PI/2)} 83 133)`);
        const pose=model.at(t);
        const targetX=Math.max(cameraStart+(pose.x-model.origin.x)*.55,sceneBase+pose.x-sceneWidth*.58);
        const targetY=groundCamera+Math.min(0,pose.y-(groundCamera+sceneHeight*.3));
        // Exponential camera easing softens the chase; projectile time stays linear.
        const followEase=gentle?1:1-Math.exp(-dt*18);
        const settling=time>=contact;
        const settleEase=settling?Math.min(1,(time-contact)/settle):0;
        updateCamera(cameraX+(targetX-cameraX)*Math.max(followEase,settleEase),cameraY+(targetY-cameraY)*Math.max(followEase,settleEase),runBefore+Math.round(result.meters*progress));
        const turn=gentle?0:pose.angle;
        if(time<contact){
          setPose(pose.x,pose.y,turn);
          const weak=boost.power==='sputter'||boost.power==='dud';
          const wobble=gentle?0:weak?Math.sin(t*22)*9:Math.sin(t*8)*1.5;
          $('boost-effect').setAttribute('transform',`translate(${sceneBase+pose.x} ${pose.y+3}) rotate(${turn+wobble})`);
          const effectOpacity=boost.kind==='none'?0:boost.power==='dud'?Math.max(.25,1-progress*.9):boost.power==='sputter'?(Math.sin(t*24)>0?.95:.45):1;
          $('boost-effect').setAttribute('opacity',String(effectOpacity));
          const exhaust=$('boost-effect').querySelector('.boost-exhaust');
          if(exhaust){exhaust.setAttribute('opacity',boost.power==='dud'?'0':boost.power==='sputter'?(Math.sin(t*28)>0?'1':'0'):boost.kind==='airliner'?'0':'1');exhaust.setAttribute('transform',`translate(-45 19) scale(${weak?.4:.9+Math.sin(t*25)*.15} 1) translate(45 -19)`);}

          $('speed-trail').setAttribute('transform',`translate(${sceneBase+pose.x} ${pose.y}) rotate(${turn})`);$('speed-trail').setAttribute('opacity',!gentle&&result.tier<=1?'1':'0');
          $('perfect-halo').setAttribute('transform',`translate(${sceneBase+pose.x} ${pose.y})`);$('perfect-halo').setAttribute('opacity',!gentle&&result.tier===0?String(.5+.3*Math.sin(t*8)):'0');
          $('launch').textContent='In the air…';$('stage-caption').textContent=boost.kind==='none'?(flop?'Uh oh…':'Away we go!'):boost.caption;
        }else{
          const u=Math.min((time-contact)/settle,1);
          $('boost-effect').setAttribute('opacity',String(Math.max(0,1-u)));
          $('boost-effect').setAttribute('transform',`translate(${sceneBase+pose.x} ${model.ground+3}) rotate(${gentle?0:turn*(1-u)})`);
          $('speed-trail').setAttribute('opacity','0');$('perfect-halo').setAttribute('opacity','0');
          // A small impact squash; no hovering, teleporting or upward snap.
          setPose(pose.x,model.ground,gentle?0:turn*(1-u));
          const compression=Math.sin(u*Math.PI)*(flop?.3:.16);
          $('bean').style.transform=`translateY(${18*compression}px) scale(${1+compression},${1-compression})`;
          $('dust').setAttribute('transform',`translate(${sceneBase+pose.x-145} 0)`);$('dust').setAttribute('opacity',String((1-u)*.8));
        }
        const steps=40;
        $('trajectory').setAttribute('d',Array.from({length:steps+1},(_,i)=>{const p=model.at(t*i/steps);return `${i?'L':'M'}${sceneBase+p.x} ${p.y}`;}).join(' '));
      }
      if(time<contact+settle){animation=requestAnimationFrame(frame);return;}
      $('bean').style.transform='';$('dust').setAttribute('opacity','0');$('boost-effect').setAttribute('opacity','0');
      countDistance(1);const end=model.at(model.duration);setPose(end.x,model.ground);
      updateCamera(Math.max(cameraStart+model.range*.55,sceneBase+end.x-sceneWidth*.58),groundCamera,total());
      $('landing').setAttribute('x',String(sceneBase+end.x));$('landing').textContent=`${fmt(result.meters)} m`;
      $('stage-caption').textContent=flop&&boost.kind!=='none'?boost.caption:flop?'He’s fine. His pride? Less so.':result.tier===0?'That’s one very happy little bean.':'A respectable little adventure.';
      resolve();
    }
    animation=requestAnimationFrame(frame);
  });
}
$('next').addEventListener('click',()=>{render();window.scrollTo({top:0,behavior:'instant'});});
function finish(){
  stopTimer();setPhase('finished');resetScene();show('lobby',false);show('play',false);show('finish',true);const results=runResults();
  $('final-distance').textContent=fmt(total());$('finish-title').textContent=total()>=4000?'What a little legend.':total()>=2000?'A lovely little run.':'Still an adventure.';
  $('breakdown').innerHTML=results.map((r,i)=>`<div class="break-row"><span class="idx">0${i+1}</span><span>${questions[i].question}${r.multiplier>1?` <em>${r.multiplier}×</em>`:''}<small>${r.name} · Your guess: ${fmt(r.guess)} <b>Correct: ${fmt(questions[i].answer)}</b></small></span><div class="row-total"><strong>${fmt(r.meters)} m</strong><small>${fmt(r.baseMetres)} m base</small><small class="boost-gain">+${fmt(r.meters-r.baseMetres)} m boost</small></div></div>`).join('');
  const impact=boostImpact(results);
  $('boost-summary').innerHTML=`<div class="impact-stat"><span>From your guesses at 1×</span><strong>${fmt(impact.base)} m</strong></div><div class="impact-stat bonus"><span>Added by your boosts</span><strong>+${fmt(impact.bonus)} m</strong></div><div class="impact-stat total"><span>Your final distance</span><strong>${fmt(impact.total)} m</strong></div><p id="boost-plan-note" class="small"></p>`;
  $('boost-plan-note').textContent=mode==='pre-boost'?`Your locked plan: ${allocation.map(n=>`${n+1}×`).join(' / ')}.`:boostUsed()?`Your 2× boost flew on question ${answers.findIndex(a=>a.boost)+1}.`:'You kept your 2× boost. Try spending it next time.';
  show('next-set',rising);$('next-set').textContent=`Play set ${questionSets[(questionSets.indexOf(activeSet)+1)%questionSets.length].id} →`;
  if(rising){$('finish').querySelector('.category').textContent=`${activeSet.name} · Five guesses. One little adventure.`;$('finish').querySelector('.footnote').textContent='Four question sets · five questions each.';}
  $('share').innerHTML='Copy my result <span>↗</span>';window.scrollTo({top:0,behavior:'instant'});$('finish-title').focus({preventScroll:true});
}
$('restart').addEventListener('click',()=>{answers=[];started=false;resumeRun=null;questionDeadline=0;deadlineIndex=-1;save();render();window.scrollTo({top:0,behavior:'instant'});});
$('share').addEventListener('click',async()=>{
  const symbols=['🎯','🟢','🟡','🟠','💨'];const text=`Launcher · ${rising?`rising difficulty · ${activeSet.name}`:mode==='pre-boost'?'pre-boost':'single boost'}\n${fmt(total())} m travelled · +${fmt(boostImpact(runResults()).bonus)} m from boosts\n${runResults().map((r,i)=>`${i+1}. ${symbols[r.tier]} ${fmt(r.meters)} m${r.multiplier>1?` · ${r.multiplier}×`:''}`).join('\n')}`;
  const sharedText=publicGame?`${text}\nhttps://www.sushilathreya.com/launchnow/?set=${activeSet.id}`:text;
  try{await navigator.clipboard.writeText(sharedText);$('share').textContent='Copied!';}catch{$('share-text')?.remove();const area=document.createElement('textarea');area.id='share-text';area.value=sharedText;area.readOnly=true;area.style.cssText='width:100%;margin-top:12px;height:160px';$('share').after(area);area.select();$('share').textContent='Select and copy your result below';}
});
$('rules-button').addEventListener('click',()=>$('rules').showModal());for(const id of ['close-rules','got-it'])$(id).addEventListener('click',()=>$('rules').close());
$('rules').addEventListener('click',e=>{if(e.target===$('rules')){const r=$('rules').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('rules').close();}});
if(publicGame)document.querySelector('.wordmark').href='/launchnow/';
sizeScene();
render();
