import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  EMPTY_PAGE_CONTENT,
  type PageContentMap,
  type PageContentState,
} from '~/lib/pageContent';

/** How long after the last keystroke a field is written back to Shopify. */
const AUTOSAVE_DELAY_MS = 800;

interface EditToolbarContextValue {
  slug: string;
  label: string;
  isAdmin: boolean;
  isEditing: boolean;
  isDirty: boolean;
  isSaving: boolean;
  hasDraft: boolean;
  getValue: (field: string, fallback: string) => string;
  setFieldValue: (field: string, value: string) => void;
  toggleEdit: () => Promise<void>;
  publish: () => Promise<void>;
  reset: () => Promise<void>;
}

const EditToolbarContext = createContext<EditToolbarContextValue | null>(null);

/**
 * Null outside a provider — `EditableText` is used inside components that also
 * render on pages with no toolbar, and there it must simply render its text.
 */
export function useEditToolbar(): EditToolbarContextValue | null {
  return useContext(EditToolbarContext);
}

interface ApiResult {
  success: boolean;
  error?: string;
}

async function callApi(body: Record<string, unknown>): Promise<ApiResult> {
  const response = await fetch('/api/page-content', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(body),
  });
  return (await response.json()) as ApiResult;
}

export interface EditToolbarProviderProps {
  slug: string;
  /** Server-rendered state from the page loader — see `loadPageContentState`.
   *  Passing it in is what keeps published copy flash-free for shoppers. */
  initialState?: PageContentState;
  /** Shown in the toolbar's trailing pill. */
  label?: string;
  children: ReactNode;
}

export function EditToolbarProvider({
  slug,
  initialState = EMPTY_PAGE_CONTENT,
  label,
  children,
}: EditToolbarProviderProps) {
  const [state, setState] = useState<PageContentState>(initialState);
  const [isEditing, setIsEditing] = useState(false);
  const [fieldValues, setFieldValues] = useState<PageContentMap>(
    initialState.draftData ?? initialState.publishedData,
  );
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const pendingPatch = useRef<PageContentMap>({});
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, []);

  const applyState = useCallback((next: PageContentState) => {
    setState(next);
    setFieldValues(next.draftData ?? next.publishedData);
  }, []);

  const refetch = useCallback(async () => {
    const response = await fetch(
      `/api/page-content?slug=${encodeURIComponent(slug)}`,
    );
    if (!response.ok) return;
    applyState((await response.json()) as PageContentState);
  }, [slug, applyState]);

  // The patch lives in a ref so a keystroke does not re-create `flushPatch`
  // and restart the debounce that is already counting down.
  const flushPatch = useCallback(async () => {
    const patch = pendingPatch.current;
    if (!Object.keys(patch).length) return;
    pendingPatch.current = {};
    setIsSaving(true);
    const result = await callApi({intent: 'save', slug, patch});
    setIsSaving(false);
    if (result.success) setIsDirty(false);
  }, [slug]);

  const getValue = useCallback(
    (field: string, fallback: string) => fieldValues[field] ?? fallback,
    [fieldValues],
  );

  const setFieldValue = useCallback(
    (field: string, value: string) => {
      setFieldValues((prev) =>
        prev[field] === value ? prev : {...prev, [field]: value},
      );
      pendingPatch.current = {...pendingPatch.current, [field]: value};
      setIsDirty(true);

      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
      autosaveTimer.current = setTimeout(() => void flushPatch(), AUTOSAVE_DELAY_MS);
    },
    [flushPatch],
  );

  const toggleEdit = useCallback(async () => {
    if (isEditing) {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
      await flushPatch();
      setIsEditing(false);
      return;
    }
    const result = await callApi({intent: 'ensure-draft', slug});
    if (!result.success) return;
    await refetch();
    setIsEditing(true);
  }, [isEditing, slug, refetch, flushPatch]);

  const publish = useCallback(async () => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    await flushPatch();
    const result = await callApi({intent: 'publish', slug});
    if (!result.success) return;
    await refetch();
    setIsEditing(false);
  }, [slug, refetch, flushPatch]);

  const reset = useCallback(async () => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    pendingPatch.current = {};
    setIsDirty(false);
    const result = await callApi({intent: 'reset', slug});
    if (!result.success) return;
    await refetch();
    setIsEditing(false);
  }, [slug, refetch]);

  const value = useMemo<EditToolbarContextValue>(
    () => ({
      slug,
      label: label ?? slug,
      isAdmin: state.isAdmin,
      isEditing,
      isDirty,
      isSaving,
      hasDraft: state.draftStatus !== 'none',
      getValue,
      setFieldValue,
      toggleEdit,
      publish,
      reset,
    }),
    [
      slug,
      label,
      state.isAdmin,
      state.draftStatus,
      isEditing,
      isDirty,
      isSaving,
      getValue,
      setFieldValue,
      toggleEdit,
      publish,
      reset,
    ],
  );

  return (
    <EditToolbarContext.Provider value={value}>
      {children}
    </EditToolbarContext.Provider>
  );
}
