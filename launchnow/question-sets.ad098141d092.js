import {risingQuestions, risingQuestionSetId} from './game.ad098141d092.js';

const labels=['Easy','Moderate','Tricky','Hard','Obscure'];
const rewards=[400,600,1000,1400,2000];
function makeSet(id,questions){
  return {id,name:`Set ${id}`,version:`friends-v1-${id}`,questions:questions.map((q,i)=>({...q,difficulty:i+1,difficultyLabel:labels[i],exactMetres:rewards[i]}))};
}
export const questionSets=[
  {...makeSet('1',risingQuestions),version:risingQuestionSetId},
  makeSet('2',[
    {id:'toy-story',question:'In what year was the original Toy Story released in cinemas?',unit:'year',max:2026,answer:1995,radii:[1,3,7],fact:'Toy Story opened in US cinemas on 22 November 1995. This question is about the first film.',source:'Pixar · Our Story',url:'https://www.pixar.com/our-story'},
    {id:'monopoly',question:'How many spaces are on a classic Monopoly board, including the corners?',unit:'spaces',max:10000,answer:40,radii:[2,6,15],fact:'Hasbro’s classic board has 40 spaces in total, including the four corners. Only 28 of them are properties.',source:'Hasbro · 80 Things You Didn’t Know About Monopoly',url:'https://mms.businesswire.com/media/20150121006051/en/448463/1/80_Things_You_Didn%27t_Know_About_Monopoly_FINAL.pdf?download=1'},
    {id:'breaking-bad',question:'How many episodes are in the original Breaking Bad TV series?',unit:'episodes',max:10000,answer:62,radii:[3,12,30],fact:'The original series has 62 episodes. Better Call Saul and the film El Camino are separate stories.',source:'Sony Pictures Entertainment · The Complete Series',url:'https://www.youtube.com/watch?v=hTyGjb_m9Bw'},
    {id:'golden-gate',question:'Including its approaches, how long is the Golden Gate Bridge in metres?',unit:'metres',max:1000000,answer:2737,radii:[50,250,750],fact:'The bridge operator lists its total length, including approaches, as 2,737 metres. The main suspension span alone is shorter.',source:'Golden Gate Bridge · Design & Construction Stats',url:'https://www.goldengate.org/bridge/history-research/statistics-data/design-construction-stats/'},
    {id:'burj-stairs',question:'How many stairs lead up to Level 160 of the Burj Khalifa?',unit:'stairs',max:1000000,answer:2909,radii:[50,300,1000],fact:'The official fact sheet lists 2,909 stairs to Level 160. Ladders are used to climb above that level.',source:'Burj Khalifa · Official Fact Sheet',url:'https://www.burjkhalifa.ae/en/assets/FACT-SHEET.pdf'}
  ]),
  makeSet('3',[
    {id:'playstation',question:'In what year did the original PlayStation first launch in Japan?',unit:'year',max:2026,answer:1994,radii:[1,3,7],fact:'The first PlayStation launched in Japan on 3 December 1994, before its 1995 launches in North America and Europe.',source:'PlayStation · 1994 History Timeline',url:'https://www.playstation.com/en-us/playstation-history/1994-ps-one/'},
    {id:'nutella',question:'What percentage of classic Nutella is hazelnuts?',unit:'percent',max:100,answer:13,radii:[2,6,15],fact:'The classic Nutella recipe lists hazelnuts at 13%. This is the classic spread, not another Nutella product.',source:'Nutella · Classic Ingredients',url:'https://www.nutella.com/uk/en/products/spread/nutella'},
    {id:'pokemon',question:'How many Pokémon species are in the original first generation, including Mew?',unit:'species',max:10000,answer:151,radii:[5,25,75],fact:'The original first generation contains 151 Pokémon, from Bulbasaur through Mew.',source:'The Pokémon Company · Scarlet & Violet—151',url:'https://www.pokemon.com/us/pokemon-tcg/scarlet-violet-151'},
    {id:'london-eye',question:'How many passenger capsules were built for the London Eye?',unit:'capsules',max:10000,answer:32,radii:[2,7,18],fact:'There are 32 capsules. Number 13 is skipped, so their numbering runs from 1 to 33.',source:'London Eye · 25th Anniversary Facts',url:'https://www.londoneye.com/25th-anniversary/'},
    {id:'white-house',question:'According to the archived White House facts, how many doors are in the White House?',unit:'doors',max:1000000,answer:412,radii:[15,75,200],fact:'The archived White House facts list 412 doors. This uses the published historical count rather than a new building survey.',source:'White House Archives · The Grounds',url:'https://trumpwhitehouse.archives.gov/about-the-white-house/the-grounds/'}
  ]),
  makeSet('4',[
    {id:'wikipedia',question:'In what year did Wikipedia launch?',unit:'year',max:2026,answer:2001,radii:[1,3,7],fact:'Wikipedia launched on 15 January 2001. The Wikimedia Foundation was established later.',source:'Wikimedia Foundation · Wikipedia at 25',url:'https://wikimediafoundation.org/wikipedia25/'},
    {id:'titanic',question:'How many Oscars did Titanic win at the 1998 Academy Awards?',unit:'Oscars',max:10000,answer:11,radii:[1,3,6],fact:'Titanic won 11 Oscars from 14 nominations at the 1998 ceremony.',source:'Academy of Motion Picture Arts and Sciences · 1998 Awards',url:'https://www.oscars.org/oscars/ceremonies/embed/1998'},
    {id:'scrabble',question:'How many tiles are in a standard English-language Scrabble set, including blanks?',unit:'tiles',max:10000,answer:100,radii:[5,20,50],fact:'The standard English-language set contains 100 tiles, including its two blank tiles.',source:'Hasbro · Scrabble Official Rules',url:'https://www.hasbro.com/common/instruct/Scrabble_%281999%29.pdf'},
    {id:'liberty',question:'To the nearest whole metre, how tall is the Statue of Liberty from ground to torch, including its pedestal?',unit:'metres',max:1000000,answer:93,radii:[5,20,50],fact:'The National Park Service gives the ground-to-torch height as 93 metres. The copper statue alone is shorter.',source:'US National Park Service · Statue of Liberty',url:'https://www.nps.gov/stli/index.htm'},
    {id:'eiffel-stairs',question:'How many stairs lead from the ground to the Eiffel Tower’s second floor?',unit:'stairs',max:1000000,answer:674,radii:[25,125,350],fact:'There are exactly 674 steps from the ground to the second floor. The route to the summit has a different count.',source:'Eiffel Tower · Walking Up the Tower',url:'https://www.toureiffel.paris/en/faq/spot/how-can-you-walk-eiffel-tower-foot'}
  ])
];
export function getQuestionSet(id){return questionSets.find(set=>set.id===id)||questionSets[0];}
