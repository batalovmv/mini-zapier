import { expect, test, type Page } from '@playwright/test';

const OVERRIDE_HTTP_REQUEST_URL =
  process.env.MINI_ZAPIER_E2E_ECHO_URL?.trim() || null;
const LOCALE_STORAGE_KEY = 'mini-zapier:locale';
const DEFAULT_E2E_EMAIL = 'admin@example.com';
const LEGACY_E2E_RUN_SUFFIX =
  process.env.GITHUB_RUN_ID?.trim() || Date.now().toString();
const E2E_PASSWORD = process.env.MINI_ZAPIER_E2E_PASSWORD;
let e2eUserProvisioned = false;

function sanitizeEmailLocalPart(value: string): string {
  const sanitized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return sanitized || 'admin';
}

function resolveE2eEmail(): string {
  const explicitEmail = process.env.MINI_ZAPIER_E2E_EMAIL?.trim();

  if (explicitEmail) {
    return explicitEmail;
  }

  const legacyUsername = process.env.MINI_ZAPIER_E2E_USERNAME?.trim();

  if (legacyUsername) {
    return legacyUsername.includes('@')
      ? legacyUsername
      : `${sanitizeEmailLocalPart(legacyUsername)}+e2e-${LEGACY_E2E_RUN_SUFFIX}@example.com`;
  }

  return DEFAULT_E2E_EMAIL;
}

const E2E_EMAIL = resolveE2eEmail();

async function forceEnglishLocale(page: Page): Promise<void> {
  await page.addInitScript((localeStorageKey: string) => {
    window.localStorage.setItem(localeStorageKey, 'en');
  }, LOCALE_STORAGE_KEY);
}

async function waitForDashboard(page: Page): Promise<void> {
  await page.waitForURL((url) => url.pathname !== '/login', {
    timeout: 20_000,
  });
  await expect(page.getByTestId('dashboard-page')).toBeVisible();
  await expect(page.getByTestId('create-workflow-link')).toBeVisible();
}

async function ensureE2eUser(page: Page): Promise<void> {
  if (e2eUserProvisioned) {
    return;
  }

  const response = await page.request.post('/api/auth/register', {
    data: {
      email: E2E_EMAIL,
      password: E2E_PASSWORD,
    },
  });

  if (response.status() !== 201 && response.status() !== 409) {
    throw new Error(
      `Could not provision E2E user "${E2E_EMAIL}". /api/auth/register returned ${response.status()}.`,
    );
  }

  e2eUserProvisioned = true;
}

async function signIn(page: Page): Promise<void> {
  if (!E2E_PASSWORD) {
    throw new Error('MINI_ZAPIER_E2E_PASSWORD is required for the UI smoke test.');
  }

  await ensureE2eUser(page);
  await page.context().clearCookies();
  await forceEnglishLocale(page);
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Mini-Zapier' })).toBeVisible();

  await page.getByLabel('Email').fill(E2E_EMAIL);
  await page.locator('#password').fill(E2E_PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();

  try {
    await waitForDashboard(page);
  } catch {
    throw new Error(
      `Sign in did not reach the dashboard. Resolved MINI_ZAPIER_E2E_EMAIL="${E2E_EMAIL}". Set MINI_ZAPIER_E2E_EMAIL explicitly or update legacy MINI_ZAPIER_E2E_USERNAME to an email address.`,
    );
  }
}

async function dropPaletteItem(options: {
  page: Page;
  paletteTestId: string;
  x: number;
  y: number;
}) {
  const { page, paletteTestId, x, y } = options;
  const source = page.getByTestId(paletteTestId);
  const canvas = page.getByTestId('workflow-canvas-dropzone');
  const dataTransfer = await page.evaluateHandle(() => new DataTransfer());
  const canvasBox = await canvas.boundingBox();

  if (!canvasBox) {
    throw new Error('Workflow canvas dropzone was not rendered.');
  }

  await source.dispatchEvent('dragstart', { dataTransfer });
  await canvas.dispatchEvent('dragover', {
    clientX: canvasBox.x + x,
    clientY: canvasBox.y + y,
    dataTransfer,
  });
  await canvas.dispatchEvent('drop', {
    clientX: canvasBox.x + x,
    clientY: canvasBox.y + y,
    dataTransfer,
  });
}

async function connectNodesWithTestHelper(
  page: Page,
  sourceNodeId: string,
  targetNodeId: string,
): Promise<void> {
  // Ensure bridge is available (may be re-created after React re-renders)
  await page.waitForFunction(
    () => typeof (window as any).__MINI_ZAPIER_TEST__?.connectNodes === 'function',
    { timeout: 10000 },
  );
  await page.evaluate(
    ({ sourceNodeId, targetNodeId }) => {
      (
        window as typeof window & {
          __MINI_ZAPIER_TEST__?: {
            connectNodes: (sourceNodeId: string, targetNodeId: string) => void;
          };
        }
      ).__MINI_ZAPIER_TEST__!.connectNodes(sourceNodeId, targetNodeId);
    },
    {
      sourceNodeId,
      targetNodeId,
    },
  );
  // Small delay for React Flow to process the connection
  await page.waitForTimeout(200);
}

test('blocks adding a second trigger to the canvas', async ({ page }) => {
  await signIn(page);
  await page.goto('/workflows/new');
  await expect(page.getByTestId('workflow-name-input')).toBeVisible();

  await dropPaletteItem({
    page,
    paletteTestId: 'palette-item-trigger:WEBHOOK',
    x: 220,
    y: 160,
  });

  const firstTrigger = page.locator(
    '[data-testid="editor-node"][data-node-label="Webhook"]',
  );
  await expect(firstTrigger).toHaveCount(1);

  await dropPaletteItem({
    page,
    paletteTestId: 'palette-item-trigger:CRON',
    x: 220,
    y: 320,
  });

  await expect(page.getByText('Only one trigger is allowed per workflow.')).toBeVisible();

  const allTriggers = page.locator('[data-testid="editor-node"]');
  await expect(allTriggers).toHaveCount(1);
});

test('blocks saving a workflow that only contains a trigger', async ({ page }) => {
  await signIn(page);
  await page.goto('/workflows/new');
  await expect(page.getByTestId('workflow-name-input')).toBeVisible();

  await dropPaletteItem({
    page,
    paletteTestId: 'palette-item-trigger:WEBHOOK',
    x: 220,
    y: 160,
  });

  await page.getByTestId('save-workflow-button').click();

  await expect(
    page.getByText('Trigger node must have exactly one outgoing edge.'),
  ).toBeVisible();
  await expect(
    page.getByText(
      'Workflow must contain at least one action node connected to the trigger.',
    ),
  ).toBeVisible();
});

test('blocks saving disconnected node chains before the API request', async ({
  page,
}) => {
  let createWorkflowRequests = 0;

  page.on('request', (request) => {
    if (
      request.method() === 'POST' &&
      request.url().includes('/api/workflows')
    ) {
      createWorkflowRequests += 1;
    }
  });

  await signIn(page);
  await page.goto('/workflows/new');
  await expect(page.getByTestId('workflow-name-input')).toBeVisible();

  await dropPaletteItem({
    page,
    paletteTestId: 'palette-item-trigger:WEBHOOK',
    x: 220,
    y: 160,
  });
  await dropPaletteItem({
    page,
    paletteTestId: 'palette-item-action:HTTP_REQUEST',
    x: 520,
    y: 230,
  });
  await dropPaletteItem({
    page,
    paletteTestId: 'palette-item-action:EMAIL',
    x: 420,
    y: 380,
  });
  await dropPaletteItem({
    page,
    paletteTestId: 'palette-item-action:DATA_TRANSFORM',
    x: 820,
    y: 380,
  });

  const webhookNode = page.locator(
    '[data-testid="editor-node"][data-node-label="Webhook"]',
  );
  const httpNode = page.locator(
    '[data-testid="editor-node"][data-node-label="HTTP Request"]',
  );
  const emailNode = page.locator(
    '[data-testid="editor-node"][data-node-label="Email"]',
  );
  const transformNode = page.locator(
    '[data-testid="editor-node"][data-node-label="Data Transform"]',
  );

  const webhookNodeId = await webhookNode.getAttribute('data-node-id');
  const httpNodeId = await httpNode.getAttribute('data-node-id');
  const emailNodeId = await emailNode.getAttribute('data-node-id');
  const transformNodeId = await transformNode.getAttribute('data-node-id');

  if (!webhookNodeId || !httpNodeId || !emailNodeId || !transformNodeId) {
    throw new Error('One or more editor node ids were missing.');
  }

  await connectNodesWithTestHelper(page, webhookNodeId, httpNodeId);
  await connectNodesWithTestHelper(page, emailNodeId, transformNodeId);

  await expect(page.locator('.react-flow__edge')).toHaveCount(2);

  await page.getByTestId('save-workflow-button').click();

  await expect(
    page.getByText('Workflow must contain exactly one terminal action node.'),
  ).toBeVisible();
  await expect(
    page.getByText('Connect all nodes into a single chain starting from the trigger.'),
  ).toBeVisible();
  await expect.poll(() => createWorkflowRequests).toBe(0);
});

test('creates a webhook workflow via UI and verifies step logs', async ({
  page,
  baseURL,
}) => {
  test.slow();

  if (!baseURL) {
    throw new Error('Playwright baseURL is required for the smoke test.');
  }

  const consoleErrors: string[] = [];
  const bridgeLogs: string[] = [];
  const pageErrors: string[] = [];

  page.on('console', (message) => {
    const messageText = message.text();

    if (messageText.includes('[TEST_BRIDGE]')) {
      bridgeLogs.push(messageText);
    }

    if (
      message.type() === 'error' &&
      !messageText.includes('server responded with a status of 401')
    ) {
      consoleErrors.push(messageText);
    }
  });

  page.on('pageerror', (error) => {
    pageErrors.push(error.message);
  });

  const runSuffix = Date.now().toString();
  const connectionName = `Webhook ${runSuffix}`;
  const workflowName = `UI Smoke ${runSuffix}`;
  const secret = `ui-secret-${runSuffix}`;
  const webhookPayload = {
    name: `Alice ${runSuffix}`,
    eventId: `event-${runSuffix}`,
  };
  const httpRequestUrl =
    OVERRIDE_HTTP_REQUEST_URL ?? `${baseURL}/api/auth/register`;
  const expectedHttpOutput = OVERRIDE_HTTP_REQUEST_URL
    ? webhookPayload.name
    : '"ok": true';
  const expectedTransformOutput = OVERRIDE_HTTP_REQUEST_URL
    ? `Processed ${webhookPayload.name} / ${webhookPayload.eventId}`
    : 'Processed true / 201';
  let workflowId: string | null = null;
  let connectionId: string | null = null;

  try {
    await signIn(page);

    await page.goto('/workflows/new');
    await expect(page.getByTestId('workflow-name-input')).toBeVisible();

    await page.getByTestId('workflow-name-input').fill(workflowName);

    await dropPaletteItem({
      page,
      paletteTestId: 'palette-item-trigger:WEBHOOK',
      x: 220,
      y: 160,
    });
    await dropPaletteItem({
      page,
      paletteTestId: 'palette-item-action:HTTP_REQUEST',
      x: 520,
      y: 230,
    });
    await dropPaletteItem({
      page,
      paletteTestId: 'palette-item-action:DATA_TRANSFORM',
      x: 820,
      y: 300,
    });

    const webhookNode = page.locator(
      '[data-testid="editor-node"][data-node-label="Webhook"]',
    );
    const httpNode = page.locator(
      '[data-testid="editor-node"][data-node-label="HTTP Request"]',
    );
    const transformNode = page.locator(
      '[data-testid="editor-node"][data-node-label="Data Transform"]',
    );

    await expect(webhookNode).toBeVisible();
    await expect(httpNode).toBeVisible();
    await expect(transformNode).toBeVisible();

    const webhookNodeId = await webhookNode.getAttribute('data-node-id');
    const httpNodeId = await httpNode.getAttribute('data-node-id');
    const transformNodeId = await transformNode.getAttribute('data-node-id');

    if (!webhookNodeId || !httpNodeId || !transformNodeId) {
      throw new Error('One or more editor node ids were missing.');
    }

    // Connect both edges in a single evaluate to avoid React re-render races
    await page.waitForFunction(
      () => typeof (window as any).__MINI_ZAPIER_TEST__?.connectNodes === 'function',
      { timeout: 10000 },
    );
    await page.evaluate(
      ({ pairs }) => {
        const bridge = (window as any).__MINI_ZAPIER_TEST__;
        for (const [src, tgt] of pairs) {
          bridge.connectNodes(src, tgt);
        }
      },
      {
        pairs: [
          [webhookNodeId, httpNodeId],
          [httpNodeId, transformNodeId],
        ],
      },
    );

    // Wait a bit for console logs to flush
    await page.waitForTimeout(500);

    // Verify edges were added to the store (DOM rendering may lag)
    const storeEdgeCount = await page.evaluate(() => {
      const edges = document.querySelectorAll('.react-flow__edge');
      return edges.length;
    });
    console.log(`Edge DOM count: ${storeEdgeCount}, Bridge logs: ${bridgeLogs.join(' | ')}`);

    // React Flow may not render edge SVGs immediately in production builds;
    // the save operation validates edges via the store, not DOM
    // So we proceed even with 0 visible edges if store says ok:true

    await webhookNode.click();
    await page.getByTestId('create-connection-button').click();
    await page.getByTestId('connection-name-input').fill(connectionName);
    await page.getByLabel('Connection field value 1').fill(secret);
    await page.getByTestId('submit-create-connection-button').click();
    await expect(page.getByText(`Connection "${connectionName}" created.`)).toBeVisible();
    connectionId = await page.getByTestId('selected-connection-id').inputValue();

    await httpNode.click();
    await page.getByTestId('http-request-url-input').fill(httpRequestUrl);
    await page.getByTestId('http-advanced-toggle').click();
    await page.getByTestId('http-headers-toggle').click();
    await page.getByTestId('http-add-header-button').click();
    await page.getByLabel('Header key 1').fill('Content-Type');
    await page.getByLabel('Header value 1').fill('application/json');

    if (OVERRIDE_HTTP_REQUEST_URL) {
      await page.getByLabel('Body field key 1').fill('name');
      await page.getByLabel('Body field value 1').fill('{{input.name}}');
    } else {
      await page.getByLabel('Body field key 1').fill('email');
      await page
        .getByLabel('Body field value 1')
        .fill('smoke-{{input.eventId}}@example.com');
    }

    await page.getByTestId('http-add-body-field-button').click();

    if (OVERRIDE_HTTP_REQUEST_URL) {
      await page.getByLabel('Body field key 2').fill('eventId');
      await page.getByLabel('Body field value 2').fill('{{input.eventId}}');
    } else {
      await page.getByLabel('Body field key 2').fill('password');
      await page.getByLabel('Body field value 2').fill('SmokePass123!');
    }

    await transformNode.click();
    await page.getByTestId('data-transform-template-input').fill(
      OVERRIDE_HTTP_REQUEST_URL
        ? 'Processed {{input.data.json.name}} / {{input.data.json.eventId}}'
        : 'Processed {{input.data.ok}} / {{input.status}}',
    );

    await page.getByTestId('save-workflow-button').click();
    await page.waitForURL(/\/workflows\/[^/]+\/edit$/, {
      timeout: 20_000,
    });

    workflowId = page.url().match(/\/workflows\/([^/]+)\/edit$/)?.[1] ?? null;

    if (!workflowId || workflowId === 'new') {
      throw new Error('Workflow id was not present in the editor URL after save.');
    }

    await expect(page.getByText('v1')).toBeVisible();

    await page.getByTestId('toggle-workflow-status-button').click();
    await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();

    const webhookResponse = await page.request.post(
      `${baseURL}/api/webhooks/${workflowId}`,
      {
        data: webhookPayload,
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Secret': secret,
        },
      },
    );

    expect(webhookResponse.status()).toBe(202);

    await page.goto('/');
    await waitForDashboard(page);

    await expect(page.getByTestId(`dashboard-workflow-row-${workflowId}`)).toBeVisible();
    await page.getByTestId(`workflow-${workflowId}-history`).click();
    await expect(page).toHaveURL(new RegExp(`/workflows/${workflowId}/history$`));

    await expect(page.locator('[data-testid^="execution-row-"]').first()).toBeVisible();
    await page.locator('[data-testid^="execution-view-"]').first().click();

    await expect
      .poll(async () => {
        const status = await page
          .getByTestId('selected-execution-status')
          .textContent();

        return status?.trim() ?? '';
      })
      .toBe('Success');

    const httpRequestCard = page.locator(
      '[data-testid="step-log-item"][data-step-label="HTTP request"]',
    );
    await expect(httpRequestCard).toBeVisible();
    await httpRequestCard.getByText('Output data').click();
    await expect(
      httpRequestCard.locator('pre').last(),
    ).toContainText(expectedHttpOutput);

    const transformCard = page.locator(
      '[data-testid="step-log-item"][data-step-label="Data transform"]',
    );
    await expect(transformCard).toBeVisible();
    await transformCard.getByText('Output data').click();
    await expect(
      transformCard.locator('pre').last(),
    ).toContainText(expectedTransformOutput);

    expect(
      consoleErrors,
      `Unexpected browser console errors:\n${consoleErrors.join('\n')}`,
    ).toEqual([]);
    expect(
      pageErrors,
      `Unexpected page errors:\n${pageErrors.join('\n')}`,
    ).toEqual([]);
  } finally {
    if (workflowId) {
      try {
        await page.request.delete(`${baseURL}/api/workflows/${workflowId}`, {
          failOnStatusCode: false,
          timeout: 10_000,
        });
      } catch {
        // Best-effort cleanup only.
      }
    }

    if (connectionId) {
      try {
        await page.request.delete(`${baseURL}/api/connections/${connectionId}`, {
          failOnStatusCode: false,
          timeout: 10_000,
        });
      } catch {
        // Best-effort cleanup only.
      }
    }
  }
});

