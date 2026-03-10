import { expect, test, type Page } from '@playwright/test';

const DEFAULT_ECHO_URL =
  process.env.MINI_ZAPIER_E2E_ECHO_URL ?? 'https://postman-echo.com/post';
const E2E_USERNAME = process.env.MINI_ZAPIER_E2E_USERNAME ?? 'admin';
const E2E_PASSWORD = process.env.MINI_ZAPIER_E2E_PASSWORD;

async function signIn(page: Page): Promise<void> {
  if (!E2E_PASSWORD) {
    throw new Error('MINI_ZAPIER_E2E_PASSWORD is required for the UI smoke test.');
  }

  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Mini-Zapier' })).toBeVisible();

  await page.getByLabel('Username').fill(E2E_USERNAME);
  await page.getByLabel('Password').fill(E2E_PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page.getByText('Operate workflows, monitor execution health and launch manual runs.')).toBeVisible();
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

test('creates a webhook workflow via UI and verifies step logs', async ({
  page,
  baseURL,
}) => {
  if (!baseURL) {
    throw new Error('Playwright baseURL is required for the smoke test.');
  }

  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];

  page.on('console', (message) => {
    const messageText = message.text();

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
  let workflowId: string | null = null;
  let connectionId: string | null = null;

  try {
    await signIn(page);

    await page.goto('/workflows/new/edit');
    await expect(page.getByText('Visual React Flow editor for linear workflows.')).toBeVisible();

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

    await page.evaluate(
      ({ sourceNodeId, targetNodeId }) => {
        (
          window as typeof window & {
            __MINI_ZAPIER_TEST__?: {
              connectNodes: (sourceNodeId: string, targetNodeId: string) => void;
            };
          }
        ).__MINI_ZAPIER_TEST__?.connectNodes(sourceNodeId, targetNodeId);
      },
      {
        sourceNodeId: webhookNodeId,
        targetNodeId: httpNodeId,
      },
    );
    await page.evaluate(
      ({ sourceNodeId, targetNodeId }) => {
        (
          window as typeof window & {
            __MINI_ZAPIER_TEST__?: {
              connectNodes: (sourceNodeId: string, targetNodeId: string) => void;
            };
          }
        ).__MINI_ZAPIER_TEST__?.connectNodes(sourceNodeId, targetNodeId);
      },
      {
        sourceNodeId: httpNodeId,
        targetNodeId: transformNodeId,
      },
    );

    await expect(page.locator('.react-flow__edge')).toHaveCount(2);

    await webhookNode.click();
    await page.getByTestId('create-connection-button').click();
    await page.getByTestId('connection-name-input').fill(connectionName);
    await page.getByLabel('Connection field value 1').fill(secret);
    await page.getByTestId('submit-create-connection-button').click();
    await expect(page.getByText(`Connection "${connectionName}" created.`)).toBeVisible();
    connectionId = await page.getByTestId('connection-select').inputValue();

    await httpNode.click();
    await page.getByLabel('HTTP request URL').fill(DEFAULT_ECHO_URL);
    await page.getByLabel('Header key 1').fill('Content-Type');
    await page.getByLabel('Header value 1').fill('application/json');
    await page
      .getByLabel('HTTP request body')
      .fill(
        JSON.stringify({
          name: '{{input.name}}',
          eventId: '{{input.eventId}}',
        }),
      );

    await transformNode.click();
    await page
      .getByLabel('Data transform template')
      .fill('Processed {{input.data.json.name}} / {{input.data.json.eventId}}');

    await page.getByTestId('save-workflow-button').click();
    await expect
      .poll(() => page.url().match(/\/workflows\/([^/]+)\/edit$/)?.[1] ?? null)
      .not.toBe('new');

    workflowId = page.url().match(/\/workflows\/([^/]+)\/edit$/)?.[1] ?? null;

    if (!workflowId) {
      throw new Error('Workflow id was not present in the editor URL after save.');
    }

    await expect(page.getByText('v1')).toBeVisible();

    await page.getByTestId('toggle-workflow-status-button').click();
    await expect(
      page.locator('.status-pill').filter({ hasText: 'ACTIVE' }).first(),
    ).toBeVisible();
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

    await page.getByRole('link', { name: 'Back to dashboard' }).click();
    await expect(page.getByText('Operate workflows, monitor execution health and launch manual runs.')).toBeVisible();

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
      .toBe('SUCCESS');

    await expect(page.getByText('HTTP Request')).toBeVisible();
    await expect(page.getByText('Data Transform')).toBeVisible();

    const httpRequestCard = page.locator(
      '[data-testid="step-log-item"][data-step-label="HTTP Request"]',
    );
    await httpRequestCard.getByText('Output data').click();
    await expect(
      httpRequestCard.locator('pre').last(),
    ).toContainText(webhookPayload.name);

    const transformCard = page.locator(
      '[data-testid="step-log-item"][data-step-label="Data Transform"]',
    );
    await transformCard.getByText('Output data').click();
    await expect(
      transformCard.getByText(
        `Processed ${webhookPayload.name} / ${webhookPayload.eventId}`,
      ),
    ).toBeVisible();

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
      await page.request.delete(`${baseURL}/api/workflows/${workflowId}`);
    }

    if (connectionId) {
      await page.request.delete(`${baseURL}/api/connections/${connectionId}`);
    }
  }
});






