import type { ConnectionType } from '@mini-zapier/shared';

import { ConnectionFormDialog } from '../connections/ConnectionFormDialog';

interface ConnectionCreateDialogProps {
  connectionType: ConnectionType;
  pending: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    name: string;
    credentials: Record<string, string>;
  }) => void;
}

export function ConnectionCreateDialog({
  connectionType,
  pending,
  onClose,
  onSubmit,
}: ConnectionCreateDialogProps) {
  return (
    <ConnectionFormDialog
      fixedType={connectionType}
      initialType={connectionType}
      mode="create"
      onClose={onClose}
      onSubmit={(payload) =>
        onSubmit({
          name: payload.name,
          credentials: payload.credentials ?? {},
        })
      }
      pending={pending}
      testIds={{
        cancelButton: 'cancel-create-connection-button',
        submitButton: 'submit-create-connection-button',
        nameInput: 'connection-name-input',
        addFieldButton: 'add-connection-field-button',
      }}
    />
  );
}
