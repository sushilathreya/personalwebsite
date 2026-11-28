export const questionSetId = "polar-to-tropical-v1";
export const routeMilestones=[
  {metres:0,name:'North Pole'},
  {metres:1500,name:'Lapland'},
  {metres:3000,name:'Tuscany'},
  {metres:4500,name:'Sahara'},
  {metres:6000,name:'Seychelles'}
];
export function routeTracker(metres,max=9000){
  const current=routeMilestones.filter(m=>m.metres<=metres).at(-1)||routeMilestones[0];
  const next=routeMilestones.find(m=>m.metres>metres)||null;
  return {current,next,remaining:next?next.metres-metres:0,percent:Math.max(0,Math.min(100,metres/max*100))};
}
export const questions = [
  {
    "id": "youtube",
    "category": "Before the endless scroll",
    "question": "In what year was YouTube founded?",
    "unit": "year",
    "max": 2026,
    "answer": 2005,
    "radii": [
      1,
      3,
      8
    ],
    "fact": "YouTube was founded in 2005. Its first uploaded video was Me at the zoo.",
    "source": "YouTube · Ten years of YouTube",
    "url": "https://blog.youtube/news-and-events/celebrating-10-years-of-youtube/"
  },
  {
    "id": "potter",
    "category": "A little book magic",
    "question": "How many books are in the original Harry Potter novel series?",
    "unit": "books",
    "max": 10000,
    "answer": 7,
    "radii": [
      1,
      2,
      4
    ],
    "fact": "The original story spans seven novels. Spin-offs and The Cursed Child are not included.",
    "source": "Scholastic · Harry Potter press kit",
    "url": "https://www.scholastic.com/newsroom/online-press-kits/harry-potter.html/"
  },
  {
    "id": "office",
    "category": "Back to Dunder Mifflin",
    "question": "How many seasons does the US version of The Office have?",
    "unit": "seasons",
    "max": 10000,
    "answer": 9,
    "radii": [
      1,
      2,
      4
    ],
    "fact": "The US series ran for nine seasons. This count excludes the original UK series and later spin-offs.",
    "source": "Peacock · The Office",
    "url": "https://www.peacocktv.com/stream-tv/the-office"
  },
  {
    "id": "whitehouse",
    "category": "Now, take a wild guess",
    "question": "According to the archived White House facts, how many doors are in the White House?",
    "unit": "doors",
    "max": 1000000,
    "answer": 412,
    "radii": [
      15,
      75,
      200
    ],
    "fact": "The archived White House facts list 412 doors. This is the published historical count, not a new building survey.",
    "source": "White House archives · The grounds",
    "url": "https://trumpwhitehouse.archives.gov/about-the-white-house/the-grounds/"
  },
  {
    "id": "eiffelstairs",
    "category": "One last climb",
    "question": "How many stairs lead from the ground to the Eiffel Tower’s second floor?",
    "unit": "steps",
    "max": 1000000,
    "answer": 674,
    "radii": [
      25,
      125,
      350
    ],
    "fact": "There are exactly 674 steps from the ground to the second floor. The route to the summit is a different count.",
    "source": "Eiffel Tower · Walking up the tower",
    "url": "https://www.toureiffel.paris/en/faq/spot/how-can-you-walk-eiffel-tower-foot"
  }
];
export const risingQuestionSetId = "rising-difficulty-v2";
// Editorial difficulty order, with a larger distance payoff for harder questions.
export const risingQuestions = [
  {
    "id": "iphone",
    "difficulty": 1,
    "difficultyLabel": "Easy",
    "exactMetres": 400,
    "question": "In what year did Steve Jobs unveil the first iPhone?",
    "unit": "year",
    "max": 2026,
    "answer": 2007,
    "radii": [
      1,
      3,
      6
    ],
    "fact": "Steve Jobs unveiled the original iPhone on 9 January 2007. It went on sale later that year.",
    "source": "Apple · Apple Reinvents the Phone with iPhone",
    "url": "https://www.apple.com/newsroom/2007/01/09Apple-Reinvents-the-Phone-with-iPhone/"
  },
  {
    "id": "piano",
    "difficulty": 2,
    "difficultyLabel": "Moderate",
    "exactMetres": 600,
    "question": "How many keys are on a standard full-size piano, including black and white keys?",
    "unit": "keys",
    "max": 10000,
    "answer": 88,
    "radii": [
      3,
      10,
      25
    ],
    "fact": "A standard full-size piano has 88 keys. Some specialist instruments have more.",
    "source": "Yamaha · Why Aren’t There More Than 88 Keys on a Piano?",
    "url": "https://hub.yamaha.com/pianos/p-acoustic/why-arent-there-more-than-88-keys-on-a-piano/"
  },
  {
    "id": "skeleton",
    "difficulty": 3,
    "difficultyLabel": "Tricky",
    "exactMetres": 1000,
    "question": "How many named bones are in the standard adult human skeleton?",
    "unit": "bones",
    "max": 10000,
    "answer": 206,
    "radii": [
      5,
      25,
      75
    ],
    "fact": "The standard adult skeleton has 206 named bones. Individual anatomy can vary, so this question uses the standard named-bone count.",
    "source": "National Cancer Institute · Divisions of the Skeleton",
    "url": "https://training.seer.cancer.gov/anatomy/skeletal/divisions/"
  },
  {
    "id": "burj",
    "difficulty": 4,
    "difficultyLabel": "Hard",
    "question": "How tall is the Burj Khalifa, in metres?",
    "unit": "metres",
    "max": 1000000,
    "answer": 828,
    "radii": [
      10,
      50,
      200
    ],
    "fact": "The Burj Khalifa’s published height is 828 metres, including its spire.",
    "source": "Emaar · Burj Khalifa",
    "url": "https://www.emaar.com/en/other-emaar-businesses/burj-khalifa",
    "exactMetres": 1400
  },
  {
    "id": "opera-tiles",
    "difficulty": 5,
    "difficultyLabel": "Obscure",
    "question": "How many tiles cover the Sydney Opera House’s roof?",
    "unit": "tiles",
    "max": 100000000,
    "answer": 1056006,
    "radii": [
      1000,
      50000,
      250000
    ],
    "fact": "The Opera House lists exactly 1,056,006 roof tiles. They were made in Sweden.",
    "source": "Sydney Opera House · The Spherical Solution",
    "url": "https://www.sydneyoperahouse.com/our-story/the-spherical-solution",
    "exactMetres": 2000
  }
];
export const tiers = [{name:'One in a Launch',metres:1000},{name:'Cloud Cruiser',metres:800},{name:'Field Flyer',metres:500},{name:'Grass Skimmer',metres:200},{name:'Total Plop',metres:50}];
export function tierDistance(q,tier=0){
  return Math.round(tiers[tier].metres*(q.exactMetres??1000)/1000);
}
export function maximumRunDistance(bank=questions,mode='single'){
  const distances=bank.map(q=>tierDistance(q));
  return distances.reduce((sum,n)=>sum+n,0)+Math.max(...distances)*(mode==='pre-boost'?4:1);
}
export function score(q, guess) {
  if (!Number.isSafeInteger(guess) || guess<0 || guess>q.max) throw new Error('Enter a valid whole number.');
  const error=Math.abs(guess-q.answer);
  const tier=error===0 ? 0 : error<=q.radii[0] ? 1 : error<=q.radii[1] ? 2 : error<=q.radii[2] ? 3 : 4;
  return {...tiers[tier],metres:tierDistance(q,tier),tier};
}
export function validateAllocation(allocation) {
  return Array.isArray(allocation) && allocation.length===5 && allocation.every(n=>Number.isInteger(n)&&n>=0&&n<=4) && allocation.reduce((s,n)=>s+n,0)===4;
}
export function boostImpact(results){
  const base=results.reduce((sum,r)=>sum+r.baseMetres,0);
  const total=results.reduce((sum,r)=>sum+r.meters,0);
  return {base,bonus:total-base,total};
}
export function flightDistance(result,progress){
  const p=Math.min(1,Math.max(0,progress));
  const base=Math.floor(result.baseMetres*p);
  const bonus=Math.floor(result.baseMetres*(result.multiplier-1)*p);
  return {base,bonus,total:base+bonus};
}
export function resultsFor(answers, options={}) {
  const bank=options.questions||questions;
  if (!Array.isArray(answers) || answers.length>bank.length) throw new Error('Invalid saved run');
  const pre=options.mode==='pre-boost';
  if(pre&&!validateAllocation(options.allocation)) throw new Error('Assign all four boost charges before starting');
  let boosts=0;
  return answers.map((a,i)=>{
    if(typeof a.boost!=='boolean' || (a.boost && ++boosts>1)) throw new Error('Only one boost per run');
    if(pre&&a.boost) throw new Error('Pre-boost allocation is locked');
    if(a.guess===null&&a.timedOut!==true) throw new Error('An empty answer must be a timeout');
    const result=a.timedOut===true ? {...tiers[4],name:'No answer',metres:0,tier:4} : score(bank[i],a.guess);
    const multiplier=pre?1+options.allocation[i]:(a.boost?2:1);
    const meters=result.metres*multiplier;
    return {...a,guess:a.timedOut===true?null:a.guess,...result,baseMetres:result.metres,multiplier,meters};
  });
}
export function bands(q) {
  return [
    {metres:1000,ranges:[[q.answer,q.answer]]},
    ...q.radii.map((r,i)=>{const prev=i===0?0:q.radii[i-1];return {metres:[800,500,200][i],ranges:[[Math.max(0,q.answer-r),q.answer-prev-1],[q.answer+prev+1,Math.min(q.max,q.answer+r)]].filter(([a,b])=>a<=b)};}),
    {metres:50,ranges:[[0,q.answer-q.radii[2]-1],[q.answer+q.radii[2]+1,q.max]].filter(([a,b])=>a<=b)}
  ].map((band,i)=>({...band,metres:tierDistance(q,i),name:tiers[i].name}));
}
