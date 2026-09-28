(function(){"use strict";var BANK_KEY="dropBank";var START_CREDITS=1000;var STAKE_STEP=5;var STAKE_CAP=50000;var MAX_FLYING=12;var SEG_MS=235;var PEG_GLOW_MS=320;var POCKET_GLOW_MS=650;var TRAIL_MAX=12;var PAYOUTS={8:{low:[5.6,2.1,1.1,0.95,0.5,0.95,1.1,2.1,5.6],medium:[12,3.2,1.2,0.7,0.4,0.7,1.2,3.2,12],high:[27,4.2,1.4,0.3,0.2,0.3,1.4,4.2,27]},12:{low:[9,3,1.7,1.3,1.1,0.9,0.65,0.9,1.1,1.3,1.7,3,9],medium:[28,9,4,2,1.1,0.6,0.3,0.6,1.1,2,4,9,28],high:[120,18,7,2.4,0.7,0.3,0.2,0.3,0.7,2.4,7,18,120]},16:{low:[15,8,2,1.5,1.3,1.1,1,0.9,0.8,0.9,1,1.1,1.3,1.5,2,8,15],medium:[100,38,10,5,2.5,1.4,0.9,0.6,0.4,0.6,0.9,1.4,2.5,5,10,38,100],high:[600,110,25,9,3.6,1.6,0.5,0.25,0.15,0.25,0.5,1.6,3.6,9,25,110,600]}};var canvas=document.getElementById("drop-canvas");var creditsEl=document.getElementById("drop-credits");var refillBtn=document.getElementById("drop-refill");var stakeEl=document.getElementById("drop-stake");var lessBtn=document.getElementById("drop-less");var moreBtn=document.getElementById("drop-more");var rowsEl=document.getElementById("drop-rows");var riskEl=document.getElementById("drop-risk");var releaseBtn=document.getElementById("drop-release");var noteEl=document.getElementById("drop-note");var trailEl=document.getElementById("drop-trail");if(!canvas||!canvas.getContext||!creditsEl||!stakeEl||!rowsEl||!riskEl||!releaseBtn||!noteEl||!trailEl){return;}
var ctx=canvas.getContext("2d");var bank=readBank();var rows=12;var risk="medium";var balls=[];var pegGlows=[];var pocketGlows={};var rafId=0;var geo={w:0,h:0,cx:0,gap:0,topY:0,pocketY:0};function readBank(){var raw=null;try{raw=window.localStorage.getItem(BANK_KEY);}catch(err){raw=null;}
if(raw===null||raw===""){return START_CREDITS;}
var num=Number(raw);if(!isFinite(num)||num<0){return START_CREDITS;}
return cents(num);}
function keepBank(){try{window.localStorage.setItem(BANK_KEY,String(bank));}catch(err){return;}}
function cents(value){return Math.round(value*100)/100;}
function pretty(value){var v=cents(value);return v===Math.floor(v)?String(v):v.toFixed(2);}
function showBank(){creditsEl.textContent=pretty(bank);releaseBtn.disabled=bank<1;}
function fitBoard(){var shell=canvas.parentNode;var cssW=Math.min(shell.clientWidth||420,560);if(cssW<200){cssW=200;}
var pad=12;var gap=(cssW-pad*2)/(rows+2);var topY=gap*1.9;var pocketY=topY+rows*gap+gap*0.55;var cssH=Math.round(pocketY+pocketH()*gap+pad);var dpr=window.devicePixelRatio||1;geo={w:cssW,h:cssH,cx:cssW/2,gap:gap,topY:topY,pocketY:pocketY};canvas.style.width=cssW+"px";canvas.style.height=cssH+"px";canvas.width=Math.round(cssW*dpr);canvas.height=Math.round(cssH*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);}
function pocketH(){return 1.05;}
function pegAt(row,idx){return{x:geo.cx+(idx-(row+2)/2)*geo.gap,y:geo.topY+row*geo.gap};}
function table(){return PAYOUTS[rows][risk];}
function blend(t){var a=[58,66,82];var b=[45,212,191];var mix=[0,1,2].map(function(i){return Math.round(a[i]+(b[i]-a[i])*t);});return"rgb("+mix.join(",")+")";}
function paint(now){ctx.clearRect(0,0,geo.w,geo.h);paintPegs(now);paintPockets(now);for(var i=0;i<balls.length;i+=1){paintBall(balls[i],now);}}
function paintPegs(now){var r=Math.max(2.2,Math.min(geo.gap*0.14,4.6));var row;var idx;for(row=0;row<rows;row+=1){for(idx=0;idx<row+3;idx+=1){var p=pegAt(row,idx);var glow=0;for(var g=0;g<pegGlows.length;g+=1){var pg=pegGlows[g];if(pg.row===row&&pg.idx===idx){var age=now-pg.at;if(age<PEG_GLOW_MS){glow=Math.max(glow,1-age/PEG_GLOW_MS);}}}
ctx.beginPath();ctx.arc(p.x,p.y,r+glow*1.6,0,Math.PI*2);ctx.fillStyle=glow>0?"rgba(45, 212, 191, "+(0.45+glow*0.55)+")":"#3a4252";ctx.fill();}}}
function paintPockets(now){var pays=table();var count=rows+1;var w=geo.gap*0.9;var h=geo.gap*pocketH();var half=rows/2;ctx.textAlign="center";ctx.textBaseline="middle";var fontPx=Math.max(7,Math.min(Math.round(geo.gap*0.34),13));ctx.font="700 "+fontPx+"px Outfit, sans-serif";for(var k=0;k<count;k+=1){var x=geo.cx+(k-half)*geo.gap-w/2;var heat=Math.pow(Math.abs(k-half)/half,1.35);var glow=0;var hit=pocketGlows[k];if(hit){var age=now-hit;if(age<POCKET_GLOW_MS){glow=1-age/POCKET_GLOW_MS;}}
roundRect(x,geo.pocketY,w,h,Math.min(7,w*0.3));ctx.fillStyle=blend(heat*0.85+glow*0.15);ctx.fill();if(glow>0){ctx.save();ctx.globalAlpha=glow*0.9;ctx.lineWidth=2;ctx.strokeStyle="#8df5e7";ctx.stroke();ctx.restore();}
ctx.fillStyle=heat>0.55?"#10201d":"#c7cfdd";ctx.fillText(String(pays[k]),x+w/2,geo.pocketY+h/2);}}
function roundRect(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
function ballSpot(ball,now){var seg=ball.points.length-1;var t=Math.max(0,now-ball.born)/ball.segMs;var i=Math.floor(t);if(i>=seg){return null;}
var frac=t-i;var from=ball.points[i];var to=ball.points[i+1];var x=geo.cx+(from.o+(to.o-from.o)*frac)*geo.gap;var y=from.y+(to.y-from.y)*(frac*frac);if(i>0){y-=Math.sin(Math.PI*frac)*geo.gap*0.28;}
return{x:x,y:y,seg:i};}
function paintBall(ball,now){var spot=ballSpot(ball,now);if(!spot){return;}
var r=Math.max(4,Math.min(geo.gap*0.32,9));var grad=ctx.createRadialGradient(spot.x-r*0.35,spot.y-r*0.35,r*0.2,spot.x,spot.y,r);grad.addColorStop(0,"#9ff7ea");grad.addColorStop(1,"#1ba896");ctx.beginPath();ctx.arc(spot.x,spot.y,r,0,Math.PI*2);ctx.fillStyle=grad;ctx.fill();}
function buildBall(stake){var points=[{o:0,y:geo.topY-geo.gap*1.6}];var offset=0;var rights=0;for(var i=0;i<rows;i+=1){points.push({o:offset,y:geo.topY+i*geo.gap});if(Math.random()<0.5){offset-=0.5;}else{offset+=0.5;rights+=1;}}
var h=geo.gap*pocketH();points.push({o:rights-rows/2,y:geo.pocketY+h*0.45});return{points:points,born:performance.now(),segMs:SEG_MS*(0.92+Math.random()*0.16),stake:stake,pocket:rights,lastSeg:-1};}
function step(now){var alive=[];for(var i=0;i<balls.length;i+=1){var ball=balls[i];var spot=ballSpot(ball,now);if(!spot){settle(ball,now);continue;}
if(spot.seg!==ball.lastSeg){for(var s=Math.max(ball.lastSeg+1,1);s<=spot.seg;s+=1){var pt=ball.points[s];pegGlows.push({row:s-1,idx:Math.round(pt.o+(s-1+2)/2),at:now});}
ball.lastSeg=spot.seg;}
alive.push(ball);}
balls=alive;pegGlows=pegGlows.filter(function(g){return now-g.at<PEG_GLOW_MS;});var glowLeft=pegGlows.length>0;for(var key in pocketGlows){if(now-pocketGlows[key]<POCKET_GLOW_MS){glowLeft=true;}else{delete pocketGlows[key];}}
paint(now);if(balls.length>0||glowLeft){rafId=window.requestAnimationFrame(step);}else{rafId=0;lockPicks(false);}}
function wake(){if(!rafId){rafId=window.requestAnimationFrame(step);}}
function settle(ball,now){var mult=table()[ball.pocket];var prize=cents(ball.stake*mult);bank=cents(bank+prize);keepBank();showBank();pocketGlows[ball.pocket]=now;logDrop(mult);if(mult>=1){say("Landed on "+mult+"× — "+
pretty(prize)+" back in the bank.","up");}else{say("Centre pocket: "+mult+"× returns "+
pretty(prize)+".","down");}
if(bank<1&&balls.length===0){say("Bank is empty — tap Refill for fresh credits.","down");}}
function logDrop(mult){var chip=document.createElement("span");chip.className="drop-chip-5d4d75bd"+
(mult>=10?" drop-chip-big":mult>=1?" drop-chip-up":" drop-chip-down");chip.textContent=mult+"×";trailEl.insertBefore(chip,trailEl.firstChild);while(trailEl.children.length>TRAIL_MAX){trailEl.removeChild(trailEl.lastChild);}}
function say(text,mood){noteEl.textContent=text;noteEl.classList.remove("drop-note-up","drop-note-down");if(mood==="up"){noteEl.classList.add("drop-note-up-5d4d75bd");}else if(mood==="down"){noteEl.classList.add("drop-note-down-5d4d75bd");}}
function readStake(){var v=Math.floor(Number(stakeEl.value));return isFinite(v)?v:0;}
function clampStake(){var v=readStake();if(v<1){v=1;}
if(v>STAKE_CAP){v=STAKE_CAP;}
stakeEl.value=String(v);}
function nudge(delta){var v=readStake()+delta;if(v<1){v=1;}
if(v>STAKE_CAP){v=STAKE_CAP;}
stakeEl.value=String(v);}
function lockPicks(locked){rowsEl.disabled=locked;riskEl.disabled=locked;refillBtn.disabled=locked;}
function release(){clampStake();var stake=readStake();if(stake>bank){say("That stake is above your balance — lower it or refill.","down");return;}
if(balls.length>=MAX_FLYING){say("Let a few balls land before sending more.","down");return;}
bank=cents(bank-stake);keepBank();showBank();lockPicks(true);balls.push(buildBall(stake));say(balls.length>1?balls.length+" balls on the pins…":"Ball away…","");wake();}
function refill(){if(balls.length>0){return;}
bank=START_CREDITS;keepBank();showBank();say("Credits topped back up to "+START_CREDITS+".","");}
function rebuild(){rows=parseInt(rowsEl.value,10);if(rows!==8&&rows!==12&&rows!==16){rows=12;}
risk=riskEl.value;if(!PAYOUTS[rows][risk]){risk="medium";}
fitBoard();paint(performance.now());}
releaseBtn.addEventListener("click",release);refillBtn.addEventListener("click",refill);rowsEl.addEventListener("change",rebuild);riskEl.addEventListener("change",rebuild);stakeEl.addEventListener("change",clampStake);lessBtn.addEventListener("click",function(){nudge(-STAKE_STEP);});moreBtn.addEventListener("click",function(){nudge(STAKE_STEP);});var resizeWait=0;window.addEventListener("resize",function(){window.clearTimeout(resizeWait);resizeWait=window.setTimeout(function(){fitBoard();paint(performance.now());},120);});rebuild();showBank();if(bank<1){say("Bank is empty — tap Refill for fresh credits.","");}
if(document.fonts&&document.fonts.ready){document.fonts.ready.then(function(){paint(performance.now());});}})();