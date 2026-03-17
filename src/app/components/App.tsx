import React, { useState, useEffect } from 'react';
import { Button, Input, cn } from '@aplo/ui';
import { RefreshCw, Lock, Unlock, LayoutGrid } from 'lucide-react';

// ============================================
// TYPES
// ============================================

interface ImageNodeData {
  id: string;
  name: string;
}

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
  // Lock state
  const [lockedSetId, setLockedSetId] = useState<string | null>(null);
  const [lockedSetName, setLockedSetName] = useState('');

  // Images currently selected in Figma
  const [images, setImages] = useState<ImageNodeData[]>([]);
  const poses = images.map((img) => toPoseName(img.name));

  // Person name input
  const [personName, setPersonName] = useState('');
  const [nameError, setNameError] = useState('');

  // UI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const mode = lockedSetId ? 'append' : 'new';

  // ── Messages ────────────────────────────────────────────────────────
  useEffect(() => {
    window.onmessage = (event) => {
      const { type, data } = event.data.pluginMessage || {};

      if (type === 'selection-update') {
        setImages(data.images ?? []);
      }
      if (type === 'selection-cleared') {
        setImages([]);
      }
      if (type === 'lock-confirmed') {
        setLockedSetId(data.id);
        setLockedSetName(data.name);
      }
      if (type === 'lock-failed') {
        // figma.notify already shown by controller
      }
      if (type === 'lock-cleared') {
        setLockedSetId(null);
        setLockedSetName('');
      }
      if (type === 'generation-complete') {
        setIsGenerating(false);
        setSuccessMsg(
          `✓ ${data.variantCount} variant${data.variantCount !== 1 ? 's' : ''} ${
            mode === 'append' ? 'added to set' : 'created'
          }!`
        );
        setPersonName('');
        setImages([]);
        setTimeout(() => setSuccessMsg(''), 4000);
      }
      if (type === 'generation-error') {
        setIsGenerating(false);
      }
    };
    return () => {
      window.onmessage = null;
    };
  }, [mode]);

  // ── Handlers ────────────────────────────────────────────────────────
  const handleLock = () => {
    parent.postMessage({ pluginMessage: { type: 'lock-component-set' } }, '*');
  };
  const handleUnlock = () => {
    parent.postMessage({ pluginMessage: { type: 'unlock-component-set' } }, '*');
  };
  const handleRefresh = () => {
    parent.postMessage({ pluginMessage: { type: 'get-selection' } }, '*');
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

    const posesPayload = images.map((img, i) => ({
      nodeId: img.id,
      poseName: poses[i],
    }));

    parent.postMessage(
      {
        pluginMessage: {
          type: 'generate',
          data: {
            personName: capitalize(personName.trim()),
            poses: posesPayload,
            mode,
            lockedSetId,
          },
        },
      },
      '*'
    );
  };

  // ── Button label ─────────────────────────────────────────────────
  const btnLabel = isGenerating ? 'Working...' : mode === 'append' ? 'Add to Component Set' : 'Create Component Set';

  const canCreate = !!personName.trim() && images.length > 0 && !isGenerating;

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-2.5 p-3.5 pb-20 font-['Lato','Inter',sans-serif]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-foreground">🎭 Emoji Kit Builder</span>
        <span
          className={cn(
            'inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold',
            mode === 'append' ? 'bg-green-500/15 text-green-600 dark:text-green-400' : 'bg-primary/15 text-primary'
          )}
        >
          {mode === 'append' ? 'Append mode' : 'New set'}
        </span>
      </div>

      <div className="border-t border-border" />

      {/* ── STEP 1: Lock target (optional) ── */}
      <div className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Step 1 — Target (optional)
        </span>

        {mode === 'new' ? (
          <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card p-2.5">
            <span className="text-xs text-muted-foreground">
              Select a component set on canvas, then lock it to append new variants.
            </span>
            <Button size="sm" variant="primary" onClick={handleLock} className="shrink-0">
              <Lock /> Lock set
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2 rounded-lg border border-green-500/30 bg-green-500/10 p-2.5">
            <div className="flex items-center gap-1.5">
              <Lock className="size-3.5 text-green-600 dark:text-green-400" />
              <span className="text-xs text-foreground">
                <span className="font-semibold">Locked:</span> "{lockedSetName}"
              </span>
            </div>
            <Button size="sm" variant="ghost" onClick={handleUnlock} className="shrink-0 text-destructive">
              <Unlock /> Unlock
            </Button>
          </div>
        )}
      </div>

      {/* ── STEP 2: Select images ── */}
      <div className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Step 2 — Select images
        </span>

        <Button variant="outline" size="sm" onClick={handleRefresh} className="w-full">
          <RefreshCw /> Refresh selection
        </Button>

        {images.length > 0 ? (
          <div className="space-y-1 rounded-lg border border-border bg-card p-2.5">
            {images.map((img, i) => (
              <div key={img.id} className="flex items-center gap-2">
                <span className="inline-block size-1.5 shrink-0 rounded-full bg-primary" />
                <span className="flex-1 truncate text-[11px] text-muted-foreground">{img.name}</span>
                <span className="text-[10px] text-muted-foreground">→</span>
                <span className="inline-flex items-center rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                  {poses[i]}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/40 py-4 text-center">
            <span className="text-xs text-muted-foreground">Select image nodes in Figma</span>
          </div>
        )}
      </div>

      {/* ── STEP 3: Name ── */}
      <div className="space-y-2">
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

        {/* Property preview */}
        {personName.trim() && images.length > 0 && (
          <div className="space-y-1 rounded-lg border border-dashed border-border bg-card p-2.5">
            <span className="text-[10px] text-muted-foreground">Will create:</span>
            {poses.map((pose, i) => (
              <div key={i} className="flex items-center gap-1">
                <code className="rounded-sm bg-muted px-1 py-0.5 text-[10px] text-foreground">
                  Name={capitalize(personName.trim())}
                </code>
                <span className="text-[10px] text-muted-foreground">/</span>
                <code className="rounded-sm bg-muted px-1 py-0.5 text-[10px] text-foreground">Pose={pose}</code>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Success */}
      {successMsg && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-xs font-semibold text-green-600 dark:text-green-400">
          {successMsg}
        </div>
      )}

      {/* Fixed bottom CTA */}
      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-background p-3">
        <Button
          variant="primary"
          loading={isGenerating}
          disabled={!canCreate}
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
