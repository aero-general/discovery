const { test, expect } = require('@playwright/test');

async function collectRuntimeErrors(page) {
  const errors=[];
  page.on('pageerror',error=>errors.push(`pageerror: ${error.message}`));
  page.on('console',message=>{if(message.type()==='error')errors.push(`console: ${message.text()}`)});
  return errors;
}

test.describe('Aero Discovery UX and functional regression',()=>{
  test.beforeEach(async({page})=>{
    await page.addInitScript(()=>{localStorage.clear();sessionStorage.clear()});
  });

  test('landing page renders core content and responsive controls',async({page})=>{
    const errors=await collectRuntimeErrors(page);
    await page.goto('/');
    await expect(page).toHaveTitle(/Aero Discovery/);
    await expect(page.getByRole('heading',{name:/Turn operational complexity/i})).toBeVisible();
    await expect(page.getByRole('button',{name:/Start the assessment/i})).toBeVisible();
    await expect(page.getByRole('button',{name:/Ask Aero/i})).toBeVisible();
    const avatarCount=await page.locator('[data-aero-agent], .aero-cgi, .aero-3d').count();
    expect(avatarCount).toBeGreaterThanOrEqual(3);
    await expect(page.locator('.aero-cgi canvas, .aero-3d canvas').first()).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('theme control changes presentation without breaking focus',async({page})=>{
    await page.goto('/');
    const toggle=page.getByRole('button',{name:/Change colour theme/i});
    await toggle.focus();
    await expect(toggle).toBeFocused();
    const before=await toggle.textContent();
    await toggle.click();
    await expect(toggle).not.toHaveText(before||'');
  });

  test('assessment can start and exposes progress, navigation and guidance',async({page})=>{
    const errors=await collectRuntimeErrors(page);
    await page.goto('/');
    await page.getByRole('button',{name:/Start the assessment/i}).first().click();
    await expect(page.locator('#assessmentApp')).toBeVisible();
    await expect(page.locator('[role="progressbar"]')).toBeVisible();
    await expect(page.locator('#title')).not.toBeEmpty();
    await expect(page.getByRole('button',{name:/Why we ask this/i})).toBeVisible();
    await page.getByRole('button',{name:/Why we ask this/i}).click();
    await expect(page.locator('#whyPanel')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('Aero chat opens by pointer and closes with Escape',async({page})=>{
    await page.goto('/');
    const launcher=page.getByRole('button',{name:'Chat with Aero'});
    await expect(launcher).toBeVisible();
    await launcher.click();
    const panel=page.locator('#aeroAgentChat');
    await expect(panel).toHaveClass(/open/);
    await expect(page.locator('#aeroMessage')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(panel).not.toHaveClass(/open/);
  });

  test('chat launcher remains a single valid interactive control',async({page})=>{
    await page.goto('/');
    const launcher=page.locator('.aero-launcher');
    await expect(launcher).toBeVisible();
    await expect(launcher.locator('button,a[href],[role="button"]')).toHaveCount(0);
    await expect(launcher.locator('.aero-cgi')).toHaveAttribute('aria-hidden','true');
    await launcher.locator('canvas').click({position:{x:10,y:10}});
    await expect(page.locator('#aeroAgentChat')).toHaveClass(/open/);
    await expect(launcher).toHaveAttribute('aria-expanded','true');
  });

  test('Aero chat closes when the user clicks outside it',async({page})=>{
    await page.goto('/');
    await page.locator('.aero-launcher').click();
    await expect(page.locator('#aeroAgentChat')).toHaveClass(/open/);
    await page.locator('#landingTitle').click();
    await expect(page.locator('#aeroAgentChat')).not.toHaveClass(/open/);
  });

  test('Aero answers governed data and workflow questions with correct intents',async({page})=>{
    await page.goto('/');
    await page.evaluate(()=>window.AeroAgent.open());
    const input=page.locator('#aeroMessage');
    await input.fill('Define the authoritative source of truth and data ownership rules');
    await input.press('Enter');
    await expect(page.locator('.aero-message.bot').last()).toContainText(/authoritative systems|business owner|data steward/i);
    await expect(page.locator('.aero-message.bot').last()).toContainText(/data-governance/i);

    await input.fill('How should we document current state and future state workflows with exception paths?');
    await input.press('Enter');
    await expect(page.locator('.aero-message.bot').last()).toContainText(/workflow|exception|hand-off|handoff/i);
  });

  test('Aero covers all five proposed delivery projects',async({page})=>{
    await page.goto('/');
    const results=await page.evaluate(async()=>{
      await window.AeroIntents.ready;
      return [1,2,3,4,5].map(number=>window.AeroIntents.respond(`Explain Project ${number}`));
    });
    expect(results.map(result=>result.intent)).toEqual([
      'project-data-baseline','project-dashboard','project-automation','project-operating-model','project-ai-poc'
    ]);
    for(const result of results)expect(result.text.length).toBeGreaterThan(120);
  });

  test('intent catalogue and knowledge store meet minimum coverage',async({page})=>{
    await page.goto('/');
    const coverage=await page.evaluate(async()=>{
      await window.AeroIntents.ready;
      return {version:window.AeroIntents.version,intents:window.AeroIntents.names,knowledgeCount:window.AeroIntents.knowledgeCount};
    });
    expect(coverage.version).toBe('3.0.0');
    expect(coverage.intents.length).toBeGreaterThanOrEqual(35);
    expect(coverage.knowledgeCount).toBeGreaterThanOrEqual(30);
  });

  test('keyboard users can activate the visible 3D assistant',async({page})=>{
    await page.goto('/');
    const avatar=page.locator('.landing-visual .aero-cgi, .landing-visual .aero-3d').first();
    await avatar.focus();
    await expect(avatar).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#aeroAgentChat')).toHaveClass(/open/);
  });

  test('mobile layout avoids horizontal overflow and keeps primary actions usable',async({page})=>{
    await page.goto('/');
    const dimensions=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth}));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth+1);
    const start=page.getByRole('button',{name:/Start the assessment/i}).first();
    const box=await start.boundingBox();
    expect(box).not.toBeNull();
    expect(box.height).toBeGreaterThanOrEqual(40);
  });

  test('mobile chat fits the viewport and exposes usable controls',async({page})=>{
    await page.goto('/');
    const launcher=page.locator('.aero-launcher');
    const launcherBox=await launcher.boundingBox();
    expect(launcherBox).not.toBeNull();
    expect(launcherBox.width).toBeGreaterThanOrEqual(56);
    expect(launcherBox.height).toBeGreaterThanOrEqual(56);
    await launcher.click();
    const panel=page.locator('#aeroAgentChat');
    await expect(panel).toHaveClass(/open/);
    const panelBox=await panel.boundingBox();
    const viewport=page.viewportSize();
    expect(panelBox).not.toBeNull();
    expect(viewport).not.toBeNull();
    expect(panelBox.x).toBeGreaterThanOrEqual(-1);
    expect(panelBox.width).toBeLessThanOrEqual(viewport.width+1);
    expect(panelBox.height).toBeLessThanOrEqual(viewport.height+1);
    await expect(page.locator('#aeroMessage')).toBeVisible();
    await expect(page.locator('.aero-chat-close')).toBeVisible();
  });
});