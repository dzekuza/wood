import {useState} from 'react';
import {ConfirmDialog} from '~/components/ConfirmDialog';
import {useEditToolbar} from '~/components/EditToolbarProvider';

/**
 * Floating admin bar: flip Edit on, change copy in place, Publish it live, or
 * Reset to throw the draft away. Renders nothing for everyone else — a shopper
 * never even receives the markup.
 */
export function EditToolbar() {
  const toolbar = useEditToolbar();
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  if (!toolbar?.isAdmin) return null;

  const {isEditing, isDirty, isSaving, label, toggleEdit, publish, reset} =
    toolbar;

  const status = !isEditing ? 'idle' : isSaving || isDirty ? 'saving' : 'saved';

  return (
    <div className="edit-toolbar">
      <span className="edit-toolbar-group">
        <span
          className={`edit-toolbar-status is-${status}`}
          aria-hidden
        />
        <button
          type="button"
          className="edit-toolbar-action"
          onClick={() => void toggleEdit()}
        >
          {isEditing ? 'Edit on' : 'Edit off'}
        </button>
      </span>

      <span className="edit-toolbar-group">
        <button
          type="button"
          className="edit-toolbar-action"
          onClick={() => void publish()}
          disabled={!isEditing}
        >
          {isSaving ? 'Saving…' : 'Publish'}
        </button>
      </span>

      <span className="edit-toolbar-group is-last">
        <button
          type="button"
          className="edit-toolbar-action is-danger"
          onClick={() => setConfirmResetOpen(true)}
          disabled={!isEditing}
        >
          Reset
        </button>
      </span>

      <span className="edit-toolbar-label">
        <i className="ti ti-pencil" aria-hidden />
        {label}
      </span>

      <ConfirmDialog
        open={confirmResetOpen}
        title="Reset draft?"
        description="This discards the in-progress draft for this page. Published copy is not affected."
        confirmLabel="Reset"
        destructive
        onConfirm={() => {
          setConfirmResetOpen(false);
          void reset();
        }}
        onCancel={() => setConfirmResetOpen(false)}
      />
    </div>
  );
}
