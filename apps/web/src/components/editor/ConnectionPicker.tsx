import type {
  ConnectionCatalogItemDto,
  ConnectionCatalogSort,
  ConnectionType,
} from '@mini-zapier/shared';
import { useDeferredValue, useEffect, useRef, useState } from 'react';

import { getApiErrorMessage } from '../../lib/api/client';
import { listConnectionsCatalog } from '../../lib/api/connections';
import { useLocale } from '../../locale/LocaleProvider';
import { Spinner } from '../ui/Spinner';

const PAGE_LIMIT = 20;
const DEFAULT_SORT = 'UPDATED_DESC' as ConnectionCatalogSort;

interface ConnectionPickerProps {
  connectionType: ConnectionType;
  selectedConnectionId: string | null;
  selectedConnectionName: string | null;
  refreshToken: number;
  onCreateConnection: () => void;
  onSelectConnection: (connection: ConnectionCatalogItemDto | null) => void;
}

function mergeCatalogItems(
  currentItems: ConnectionCatalogItemDto[],
  nextItems: ConnectionCatalogItemDto[],
): ConnectionCatalogItemDto[] {
  const byId = new Map<string, ConnectionCatalogItemDto>();

  for (const item of currentItems) {
    byId.set(item.id, item);
  }

  for (const item of nextItems) {
    byId.set(item.id, item);
  }

  return Array.from(byId.values());
}

export function ConnectionPicker({
  connectionType,
  selectedConnectionId,
  selectedConnectionName,
  refreshToken,
  onCreateConnection,
  onSelectConnection,
}: ConnectionPickerProps) {
  const { messages, formatNumber } = useLocale();
  const connectionTypeLabel =
    messages.common.connectionTypeLabels[connectionType];

  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [catalog, setCatalog] = useState<{
    items: ConnectionCatalogItemDto[];
    total: number;
    page: number;
    limit: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);

  const deferredSearch = useDeferredValue(search);
  const normalizedQuery = deferredSearch.trim();
  const requestIdRef = useRef(0);

  function resetPicker(close = false): void {
    requestIdRef.current += 1;
    setCatalog(null);
    setError(null);
    setLoading(false);
    setLoadingMore(false);
    setSearch('');

    if (close) {
      setIsOpen(false);
    }
  }

  async function loadCatalogPage(
    page: number,
    options: {
      append: boolean;
    },
  ): Promise<void> {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setError(null);

    if (options.append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const nextCatalog = await listConnectionsCatalog({
        page,
        limit: PAGE_LIMIT,
        type: connectionType,
        sort: DEFAULT_SORT,
        ...(normalizedQuery.length > 0 ? { query: normalizedQuery } : {}),
      });

      if (requestId !== requestIdRef.current) {
        return;
      }

      setCatalog((currentCatalog) => {
        if (!options.append || currentCatalog === null) {
          return nextCatalog;
        }

        return {
          ...nextCatalog,
          items: mergeCatalogItems(currentCatalog.items, nextCatalog.items),
        };
      });
    } catch (loadError) {
      if (requestId !== requestIdRef.current) {
        return;
      }

      setError(getApiErrorMessage(loadError, messages.errors));
    } finally {
      if (requestId !== requestIdRef.current) {
        return;
      }

      if (options.append) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    void loadCatalogPage(1, {
      append: false,
    });
  }, [connectionType, isOpen, normalizedQuery, refreshNonce, refreshToken]);

  function handleToggle(): void {
    if (isOpen) {
      resetPicker(true);
      return;
    }

    setIsOpen(true);
  }

  function handleRefresh(): void {
    setIsOpen(true);
    setRefreshNonce((current) => current + 1);
  }

  function handleClear(): void {
    onSelectConnection(null);
    resetPicker(true);
  }

  function handleSelect(connection: ConnectionCatalogItemDto): void {
    onSelectConnection(connection);
    resetPicker(true);
  }

  const items = catalog?.items ?? [];
  const hasItems = items.length > 0;
  const hasMore = catalog !== null && items.length < catalog.total;
  const pickerBusy = loading || loadingMore;
  const triggerLabel =
    selectedConnectionName ??
    (selectedConnectionId
      ? messages.configPanel.selectedConnectionButtonFallback
      : messages.configPanel.selectConnection(connectionTypeLabel));
  const showLoadingState = loading && !hasItems;
  const showEmptyState =
    !loading &&
    !hasItems &&
    error === null &&
    normalizedQuery.length === 0;
  const showSearchEmptyState =
    !loading &&
    !hasItems &&
    error === null &&
    normalizedQuery.length > 0;

  return (
    <div className="space-y-3">
      <input
        data-testid="selected-connection-id"
        readOnly
        tabIndex={-1}
        type="hidden"
        value={selectedConnectionId ?? ''}
      />
      <button
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={messages.configPanel.selectConnection(connectionTypeLabel)}
        className="editor-connection-picker-trigger"
        data-selected-connection-id={selectedConnectionId ?? ''}
        data-selected-connection-name={selectedConnectionName ?? ''}
        data-testid="connection-picker-trigger"
        onClick={handleToggle}
        type="button"
      >
        <span className="editor-connection-picker-trigger__copy">
          <span
            className="editor-connection-picker-trigger__label"
            title={triggerLabel}
          >
            {triggerLabel}
          </span>
          <span className="editor-connection-picker-trigger__hint">
            {messages.configPanel.searchConnectionsPlaceholder}
          </span>
        </span>
        <span className="editor-connection-picker-trigger__state">
          {isOpen
            ? messages.configPanel.closeConnectionPicker
            : messages.configPanel.openConnectionPicker}
        </span>
      </button>

      <div className="flex flex-wrap items-center gap-2.5">
        <button
          className="editor-inspector-toggle"
          data-testid="create-connection-button"
          onClick={onCreateConnection}
          type="button"
        >
          {messages.configPanel.createConnection}
        </button>
        <button
          className="editor-inspector-link"
          data-testid="refresh-connection-picker-button"
          disabled={pickerBusy}
          onClick={handleRefresh}
          type="button"
        >
          {messages.configPanel.refreshConnections}
        </button>
        {selectedConnectionId ? (
          <button
            className="editor-inspector-link"
            data-testid="clear-connection-picker-button"
            disabled={pickerBusy}
            onClick={handleClear}
            type="button"
          >
            {messages.configPanel.clearConnection}
          </button>
        ) : null}
      </div>

      {isOpen ? (
        <div
          aria-busy={pickerBusy}
          className="editor-connection-picker-panel"
          data-testid="connection-picker-panel"
        >
          <input
            aria-label={messages.configPanel.searchConnectionsPlaceholder}
            className="dashboard-control-input"
            data-testid="connection-picker-search"
            onChange={(event) => setSearch(event.target.value)}
            placeholder={messages.configPanel.searchConnectionsPlaceholder}
            type="search"
            value={search}
          />

          {error ? (
            <div
              className="editor-connection-picker-alert"
              data-testid="connection-picker-error-state"
              data-tone="danger"
            >
              {error}
            </div>
          ) : null}

          {showLoadingState ? (
            <div
              className="editor-connection-picker-state"
              data-testid="connection-picker-loading-state"
              data-tone="loading"
              role="status"
            >
              <div className="flex items-start gap-3">
                <Spinner size="sm" />
                <p className="text-sm leading-5 text-slate-600">
                  {messages.configPanel.loadingConnectionsDescription}
                </p>
              </div>
            </div>
          ) : showEmptyState ? (
            <div
              className="editor-connection-picker-state"
              data-testid="connection-picker-empty-state"
              data-tone="neutral"
            >
              <p className="text-sm leading-5 text-slate-600">
                {messages.configPanel.noConnectionsDescription(connectionTypeLabel)}
              </p>
            </div>
          ) : showSearchEmptyState ? (
            <div
              className="editor-connection-picker-state"
              data-testid="connection-picker-search-empty-state"
              data-tone="neutral"
            >
              <p className="text-sm leading-5 text-slate-600">
                {messages.configPanel.searchEmptyConnections(normalizedQuery)}
              </p>
            </div>
          ) : hasItems ? (
            <div
              className="editor-connection-picker-results"
              data-testid="connection-picker-results"
            >
              <ul
                aria-label={messages.configPanel.selectConnection(connectionTypeLabel)}
                className="editor-connection-picker-list"
                role="listbox"
              >
                {items.map((connection) => {
                  const isSelected = connection.id === selectedConnectionId;

                  return (
                    <li key={connection.id} role="presentation">
                      <button
                        aria-selected={isSelected}
                        className="editor-connection-picker-item"
                        data-connection-id={connection.id}
                        data-selected={isSelected}
                        data-testid={`connection-picker-option-${connection.id}`}
                        onClick={() => handleSelect(connection)}
                        role="option"
                        type="button"
                      >
                        <span className="editor-connection-picker-item__copy">
                          <span
                            className="editor-connection-picker-item__name"
                            title={connection.name}
                          >
                            {connection.name}
                          </span>
                          <span className="editor-connection-picker-item__meta">
                            {messages.configPanel.connectionPickerItemMeta(
                              formatNumber(connection.usageCount),
                              formatNumber(connection.credentialFieldCount),
                            )}
                          </span>
                        </span>
                        {isSelected ? (
                          <span className="editor-connection-picker-item__status">
                            {messages.configPanel.connectionPickerSelected}
                          </span>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>

              {loading || loadingMore ? (
                <div className="editor-connection-picker-loading" role="status">
                  <Spinner size="sm" />
                  <span className="text-xs font-medium text-slate-500">
                    {loadingMore
                      ? messages.configPanel.loadingMoreConnections
                      : messages.configPanel.loadingConnectionsDescription}
                  </span>
                </div>
              ) : null}

              {hasMore ? (
                <div className="border-t border-slate-900/8 p-2.5">
                  <button
                    className="dashboard-filter-reset w-full"
                    data-testid="connection-picker-load-more"
                    disabled={loadingMore}
                    onClick={() =>
                      void loadCatalogPage((catalog?.page ?? 1) + 1, {
                        append: true,
                      })
                    }
                    type="button"
                  >
                    {messages.configPanel.loadMoreConnections}
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
