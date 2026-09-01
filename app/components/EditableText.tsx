import {useEffect, useRef, type FocusEvent, type MouseEvent} from 'react';
import {useEditToolbar} from '~/components/EditToolbarProvider';

type EditableTag = 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

export interface EditableTextProps {
  /** Dotted, stable id — the key this string is stored under. Renaming one
   *  orphans the copy an admin already wrote, so treat it as permanent. */
  field: string;
  /** What the page shows until an admin overrides it: the value resolved from
   *  the `home_page` metaobject, or the coded default. */
  children: string;
  as?: EditableTag;
  className?: string;
}

/**
 * Renders a string, and — for an allowlisted admin with Edit on — makes it
 * editable in place. Outside an `EditToolbarProvider` it is a plain tag, so
 * shared components stay usable on pages with no toolbar.
 */
export function EditableText({
  field,
  children,
  as: Tag = 'span',
  className,
}: EditableTextProps) {
  const toolbar = useEditToolbar();
  const ref = useRef<HTMLElement | null>(null);
  const value = toolbar?.getValue(field, children) ?? children;
  const isActive = Boolean(toolbar?.isAdmin && toolbar.isEditing);

  // React will not reconcile the children of a contentEditable node, so the
  // text is written imperatively — and only when it actually differs, to keep
  // the caret from jumping to the start on every keystroke.
  useEffect(() => {
    const node = ref.current;
    if (!isActive || !node) return;
    if (node.textContent !== value) node.textContent = value;
  }, [isActive, value]);

  if (!isActive) {
    return <Tag className={className}>{value}</Tag>;
  }

  const handleBlur = (event: FocusEvent<HTMLElement>) => {
    toolbar?.setFieldValue(field, event.currentTarget.textContent?.trim() ?? '');
  };

  // Editable copy often sits inside a <Link>; clicking to place the caret must
  // not navigate away from the page being edited.
  const handleClick = (event: MouseEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <Tag
      ref={(node: HTMLElement | null) => {
        ref.current = node;
      }}
      className={
        className ? `${className} is-editable-field` : 'is-editable-field'
      }
      contentEditable
      suppressContentEditableWarning
      spellCheck
      role="textbox"
      tabIndex={0}
      aria-label={`Edit ${field}`}
      onBlur={handleBlur}
      onClick={handleClick}
    >
      {value}
    </Tag>
  );
}
