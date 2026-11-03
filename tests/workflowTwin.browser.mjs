import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

mkdirSync('artifacts/workflow-twin', {recursive:true});
const browser=await chromium.launch({headless:true});
const base='http://127.0.0.1:4173';
const problems=[];
async function openTwin(page){
  await page.goto(base,{waitUntil:'domcontentloaded',timeout:30000});
  const trigger=page.getByRole('button',{name:'Open HRGen Workflow Twin architecture builder'});
  await trigger.waitFor({state:'visible',timeout:30000});
  await trigger.click();
  await page.getByRole('dialog',{name:'HRGen Workflow Twin'}).waitFor({state:'visible'});
  const img=page.getByRole('img',{name:'HRGen'}).last();
  await img.waitFor({state:'visible'});
  const loaded=await img.evaluate(el=>el.complete&&el.naturalWidth>0);
  assert.ok(loaded,'Approved HRGen logo did not load');
}
try{
  const mobile=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  mobile.on('pageerror',error=>problems.push('mobile pageerror: '+error.message));
  await openTwin(mobile);
  await mobile.getByRole('tab',{name:'Build'}).waitFor({state:'visible'});
  assert.equal(await mobile.getByRole('tab',{name:'Build'}).getAttribute('aria-selected'),'true');
  await mobile.screenshot({path:'artifacts/workflow-twin/01-mobile-build.png'});
  await mobile.getByRole('tab',{name:'Flow'}).click();
  await mobile.locator('.hwt-mobile-pipeline').waitFor({state:'visible'});
  await mobile.locator('.hwt-mobile-node').first().click();
  await mobile.screenshot({path:'artifacts/workflow-twin/02-mobile-flow.png'});
  await mobile.getByRole('tab',{name:'Review'}).click();
  await mobile.locator('.hwt-mobile-view-toggle').getByRole('button',{name:'Super Admin'}).click();
  await mobile.locator('.hwt-pitch-kit summary').click();
  await mobile.getByRole('textbox',{name:'Business / lead name'}).fill('Sample Diagnostic Center');
  const draft=await mobile.locator('.hwt-pitch-message textarea').inputValue();
  assert.match(draft,/Sample Diagnostic Center/);
  assert.match(draft,/Proposed setup:/);
  assert.ok(!/Testimonial: https?:/.test(draft));
  await mobile.screenshot({path:'artifacts/workflow-twin/03-mobile-review-pitch.png'});
  await mobile.keyboard.press('Escape');
  assert.equal(await mobile.getByRole('dialog',{name:'HRGen Workflow Twin'}).count(),0,'Escape should close the overlay');
  await mobile.close();

  const desktop=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
  desktop.on('pageerror',error=>problems.push('desktop pageerror: '+error.message));
  await openTwin(desktop);
  await desktop.locator('.hwt-scroller').waitFor({state:'visible'});
  const desktopLayout=await desktop.evaluate(()=>{
    const el=document.querySelector('.hwt-scroller');
    const root=document.querySelector('.hwt-root');
    const rect=el?.getBoundingClientRect();
    return {width:window.innerWidth,mobileQuery:window.matchMedia('(max-width:640px)').matches,
      rootClass:root?.className,graphDisplay:el?getComputedStyle(el).display:'missing',
      graphHeight:rect?.height||0};
  });
  console.log('DESKTOP_LAYOUT_METRICS:',JSON.stringify(desktopLayout));
  const panels=await desktop.evaluate(()=>[...document.querySelectorAll('.hwt-main > *')].map(el=>{
    const rect=el.getBoundingClientRect();
    const style=getComputedStyle(el);
    return {cls:el.className,top:Math.round(rect.top),height:Math.round(rect.height),display:style.display,position:style.position};
  }));
  console.log('DESKTOP_PANEL_ORDER:',JSON.stringify(panels));

  assert.equal(desktopLayout.mobileQuery,false);
  assert.ok(desktopLayout.graphHeight>150,'Desktop graph must remain visible and have meaningful height');
  const graphPanel=await desktop.locator('.hwt-main > .hwt-card.hwt-flow-block').first().boundingBox();
  assert.ok(graphPanel&&graphPanel.height>350,'Outer desktop graph panel collapsed, despite inner graph being present');
  await desktop.locator('.hwt-scroller').scrollIntoViewIfNeeded();
  await desktop.locator('.hwt-scroller').screenshot({path:'artifacts/workflow-twin/05-desktop-graph-detail.png'});
  await desktop.screenshot({path:'artifacts/workflow-twin/04-desktop-wide-board.png'});
  assert.equal(await desktop.getByRole('tab',{name:'Build'}).isVisible(),false,'Mobile-only tabs should be hidden on desktop');
  await desktop.close();
  assert.deepEqual(problems,[],'Unhandled browser page errors found');
  console.log('BROWSER_QA_PASS: mobile Build/Flow/Review, tap interaction, verified logo display, sales pitch, Escape, desktop board');
}catch(error){
  console.error('BROWSER_QA_FAIL:',error);
  if(problems.length)console.error('PAGE_ERRORS:',problems.join(' | '));
  process.exitCode=1;
}finally{
  await browser.close();
}
