// Scene units, with a single gravity value shared by every launch.
export const pivot = {x:83,y:133};
export const loadedAngle = -160;
// The arm's radius is at -135° at release, so its tangent points 45° upward.
export const releaseAngle = -135-Math.atan2(-33,62)*180/Math.PI;
export function animationTiming(tier,multiplier=1,metres=1000){
  const vehicle=[0,0,.15,.35,.55,.8][Math.min(5,multiplier)];
  return Math.min(5.6,(tier===4?1.8:2.0)+vehicle+Math.sqrt(Math.max(0,metres)/1000)*.65);
}
export function boostVisual(multiplier,tier){
  const kind=multiplier<=1?'none':multiplier===2?'wind':multiplier===3?'paper-plane':multiplier===4?'airliner':'rocket';
  const power=['perfect','strong','steady','sputter','dud'][tier];
  const names={none:'Catapult',wind:'Tailwind','paper-plane':'Paper plane',airliner:'Airliner',rocket:'Rocket'};
  const dud={none:'A little plop.',wind:'A puff. That’s all.', 'paper-plane':'Paper plane. Paperweight.',airliner:'Flight delayed. Very delayed.',rocket:'Pffft. Dud rocket.'};
  return {kind,power,name:names[kind],caption:power==='dud'?dud[kind]:power==='sputter'?`${names[kind]} is sputtering…`:`${names[kind]} · ${multiplier}× boost!`};
}
export function cupPosition(angle) {
  const r=angle*Math.PI/180;
  return {x:pivot.x+62*Math.cos(r)+33*Math.sin(r), y:pivot.y+62*Math.sin(r)-33*Math.cos(r)};
}
export function launchPhysics(meters) {
  const origin=cupPosition(releaseAngle), gravity=360, ground=163;
  // Velocity is tangent to the rotating arm at the instant of release.
  const slope=-(origin.x-pivot.x)/(pivot.y-origin.y);
  const range=110+meters*1.0;
  const vx=Math.sqrt(gravity*range*range/(2*(ground-origin.y+range*slope)));
  const vy=-vx*slope, duration=range/vx;
  const angularVelocity=vx/(pivot.y-origin.y);
  // Constant angular acceleration from rest meets the projectile velocity.
  const swingDuration=2*((releaseAngle+165)*Math.PI/180)/angularVelocity;
  return {origin,gravity,ground,vx,vy,duration,range,swingDuration,
    at(t){return {x:origin.x+vx*t,y:origin.y+vy*t+gravity*t*t/2,angle:Math.atan2(vy+gravity*t,vx)*180/Math.PI};}
  };
}

// Reconstruct the exact landing checkpoint from the saved answers. Each new
// catapult is placed under the last landing; the camera never returns to start.
export function routeProgress(results, viewportWidth) {
  let base=0,landing=cupPosition(loadedAngle).x,camera=landing-viewportWidth*.58;
  for(const result of results){
    if(result.meters===0)continue;
    const model=launchPhysics(result.meters);
    landing=base+model.origin.x+model.range;
    camera=Math.max(camera+model.range*.55,landing-viewportWidth*.58);
    base=landing-cupPosition(loadedAngle).x;
  }
  return {base,camera,landing};
}
