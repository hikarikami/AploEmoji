import React, { useState, useEffect } from 'react';
import { Button, Input, Switch, cn, useTheme } from '@aplo/ui';
import { Pencil, LayoutGrid, Sun, Moon } from 'lucide-react';

// ============================================
// TYPES
// ============================================

interface ImageNodeData {
  id: string;
  name: string;
}

type MasterStatus = 'idle' | 'searching' | 'found' | 'not-found';

// ============================================
// HELPERS
// ============================================

function stripNumbers(str: string): string {
  return str.replace(/\d+/g, '').replace(/\s+/g, ' ').trim();
}

function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function toPoseName(raw: string): string {
  return capitalize(stripNumbers(raw));
}

// ============================================
// APP
// ============================================

const App: React.FC = () => {
  // Step 1 — target
  const [useExisting, setUseExisting] = useState(false);
  const [masterName, setMasterName] = useState('Aploji-Master');
  const [editingMasterName, setEditingMasterName] = useState(false);
  const [masterStatus, setMasterStatus] = useState<MasterStatus>('idle');
  const [lockedSetId, setLockedSetId] = useState<string | null>(null);

  // Step 2 — images
  // Step 3 — will-create preview
  const [images, setImages] = useState<ImageNodeData[]>([]);
  const poses = images.map((img) => toPoseName(img.name));

  // Step 3 — person name
  const [personName, setPersonName] = useState('');
  const [nameError, setNameError] = useState('');

  // UI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const { theme, setTheme } = useTheme();

  const mode = useExisting && lockedSetId ? 'append' : 'new';

  // ── Messages ─────────────────────────────────────────────────────────
  useEffect(() => {
    window.onmessage = (event) => {
      const { type, data } = event.data.pluginMessage || {};
      if (type === 'selection-update') setImages(data.images ?? []);
      if (type === 'selection-cleared') setImages([]);
      if (type === 'master-found') {
        setLockedSetId(data.id);

        setMasterStatus('found');
      }
      if (type === 'master-not-found') {
        setLockedSetId(null);

        setMasterStatus('not-found');
      }
      if (type === 'generation-complete') {
        setIsGenerating(false);
        setSuccessMsg(
          `${data.variantCount} variant${data.variantCount !== 1 ? 's' : ''} ${
            mode === 'append' ? 'added to set' : 'created'
          }`
        );
        setPersonName('');
        setImages([]);
        setTimeout(() => setSuccessMsg(''), 4000);
      }
      if (type === 'generation-error') setIsGenerating(false);
    };
    return () => {
      window.onmessage = null;
    };
  }, [mode]);

  // ── Handlers ─────────────────────────────────────────────────────────
  const searchForMaster = (name: string) => {
    setMasterStatus('searching');
    parent.postMessage({ pluginMessage: { type: 'find-master-set', data: { name } } }, '*');
  };

  const handleUseExistingChange = (checked: boolean) => {
    setUseExisting(checked);
    if (checked) {
      searchForMaster(masterName);
    } else {
      setLockedSetId(null);
      setMasterStatus('idle');
    }
  };

  const handleMasterNameConfirm = () => {
    setEditingMasterName(false);
    if (useExisting) searchForMaster(masterName);
  };

  const handleCreate = () => {
    if (!personName.trim()) {
      setNameError('Please enter a name.');
      return;
    }
    if (images.length === 0) {
      setNameError('Select at least one image in Figma first.');
      return;
    }
    setNameError('');
    setIsGenerating(true);
    parent.postMessage(
      {
        pluginMessage: {
          type: 'generate',
          data: {
            personName: capitalize(personName.trim()),
            poses: images.map((img, i) => ({ nodeId: img.id, poseName: poses[i] })),
            mode,
            lockedSetId,
          },
        },
      },
      '*'
    );
  };

  const btnLabel = mode === 'append' ? 'Add to Component Set' : 'Create Component Set';
  const canGenerate = !!personName.trim() && images.length > 0;

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-10 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">Emoji Kit Builder</span>
        <div className="flex items-center gap-2">

          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Toggle theme"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Sun /> : <Moon />}
          </Button>
        </div>
      </div>

      <div className="border-t border-border" />

      {/* ── STEP 1: Target ── */}
      <div className="flex flex-col space-y-3">
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Step 1 — Target
        </span>

        <label className="flex cursor-pointer select-none items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="text-sm text-foreground">Append to existing</span>
            <p className="text-xs text-muted-foreground">Find and append to an existing Aploji set</p>
          </div>
          <Switch checked={useExisting} onCheckedChange={handleUseExistingChange} />
        </label>

        {useExisting && (
          editingMasterName ? (
            <Input
              label=""
              size="sm"
              value={masterName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMasterName(e.target.value)}
              onBlur={handleMasterNameConfirm}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === 'Enter') handleMasterNameConfirm();
                if (e.key === 'Escape') setEditingMasterName(false);
              }}
              autoFocus
            />
          ) : (
            <div
              className={cn(
                'rounded-lg border p-3',
                masterStatus === 'found' && 'border-primary/20 bg-primary/5',
                masterStatus === 'not-found' && 'border-destructive/20 bg-destructive/5',
                masterStatus !== 'found' && masterStatus !== 'not-found' && 'border-border bg-card'
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-foreground">{masterName}</span>
                  {masterStatus === 'searching' && (
                    <p className="text-xs text-muted-foreground">Searching…</p>
                  )}
                  {masterStatus === 'found' && (
                    <p className="text-xs text-primary">✓ Found</p>
                  )}
                  {masterStatus === 'not-found' && (
                    <p className="text-xs text-destructive">Not found on this page</p>
                  )}
                </div>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label="Edit component name"
                  onClick={() => setEditingMasterName(true)}
                >
                  <Pencil />
                </Button>
              </div>
            </div>
          )
        )}
      </div>

      {/* ── STEP 2: Images ── */}
       <div className="flex flex-col space-y-3">
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Step 2 — Images
        </span>
        <div
          className={cn(
            'rounded-lg border px-3 py-2.5',
            images.length === 0 ? 'border-border bg-muted/40' : 'border-primary/20 bg-primary/5'
          )}
        >
          <p className={cn('text-xs font-semibold', images.length === 0 ? 'text-muted-foreground' : 'text-primary')}>
            {images.length === 0 ? 'Select image nodes in Figma to continue' : `${images.length} image${images.length !== 1 ? 's' : ''} selected`}
          </p>
        </div>
      </div>

      {/* ── STEP 3: Person name ── */}
       <div className="flex flex-col space-y-3">
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Step 3 — Person name
        </span>

        <Input
          label=""
          placeholder="e.g. Tom"
          value={personName}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setPersonName(e.target.value);
            setNameError('');
          }}
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') handleCreate();
          }}
          error={nameError || undefined}
          size="sm"
        />

        <div
          className={cn(
            'rounded-lg border px-3 py-2.5',
            personName.trim() && images.length > 0 ? 'border-primary/20 bg-primary/5' : 'border-border bg-muted/40'
          )}
        >
          <p className={cn('text-xs font-semibold', personName.trim() && images.length > 0 ? 'text-primary' : 'text-muted-foreground')}>
            {personName.trim() && images.length > 0
              ? `${poses.length} Aploji variant${poses.length !== 1 ? 's' : ''} will be created`
              : 'Enter a name to preview variants'}
          </p>
        </div>

        {personName.trim() && images.length > 0 && (
          <div className="space-y-1.5 rounded-lg border border-dashed border-border bg-card p-3">
            {poses.map((pose, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-foreground">
                  Name=<span className="font-semibold">{capitalize(personName.trim())}</span>
                </span>
                <span className="text-[10px] text-muted-foreground">/</span>
                <span className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-foreground">
                  Pose=<span className="font-semibold">{pose}</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Success */}
      {successMsg && (
        <div className="rounded-lg border border-border bg-secondary px-3 py-2 text-xs font-semibold text-foreground">
          ✓ {successMsg}
        </div>
      )}

      {/* Spacer for fixed bottom bar */}
      <div className="h-14" />

      {/* Fixed bottom CTA */}
      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-background p-3">
        <Button
          variant="primary"
          loading={isGenerating}
          disabled={!canGenerate}
          onClick={handleCreate}
          className="w-full"
        >
          <LayoutGrid /> {btnLabel}
        </Button>
      </div>
    </div>
  );
};

export default App;
