// ============================================
// EMOJI KIT BUILDER — CONTROLLER
// ============================================

figma.showUI(__html__, { width: 380, height: 960, title: 'Emoji Kit Builder' });

// ============================================
// INTERFACES
// ============================================

// Named ImageNodeData to avoid clash with Figma's built-in ImageData type
interface ImageNodeData {
  id: string;
  name: string;
}

interface GeneratePayload {
  personName: string;
  poses: { nodeId: string; poseName: string }[];
  mode: 'new' | 'append';
  lockedSetId: string | null;
}

// ============================================
// CONSTANTS
// ============================================

const FRAME_SIZE = 1024;

// ============================================
// SESSION STATE
// Locked set is ONLY changed by explicit lock/unlock messages — never by selectionchange
// ============================================

let lockedSetId: string | null = null;
let lockedSetName: string = '';

// ============================================
// HELPERS
// ============================================

function stripNumbers(name: string): string {
  return name.replace(/\d+/g, '').replace(/\s+/g, ' ').trim();
}

function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function getImageNodesFromSelection(selection: readonly SceneNode[]): ImageNodeData[] {
  const results: ImageNodeData[] = [];
  for (const node of selection) {
    if (
      node.type === 'RECTANGLE' ||
      node.type === 'FRAME' ||
      node.type === 'COMPONENT' ||
      node.type === 'INSTANCE' ||
      node.type === 'ELLIPSE' ||
      node.type === 'POLYGON' ||
      node.type === 'STAR' ||
      node.type === 'VECTOR'
    ) {
      const fills = (node as GeometryMixin).fills;
      if (Array.isArray(fills) && fills.some((f) => f.type === 'IMAGE')) {
        results.push({ id: node.id, name: node.name });
      }
    }
  }
  return results;
}

// ============================================
// COMPONENT CREATION
// ============================================

function createVariantComponent(sourceNode: SceneNode, personName: string, poseName: string): ComponentNode {
  const component = figma.createComponent();
  component.resize(FRAME_SIZE, FRAME_SIZE);
  component.clipsContent = true;
  component.name = `Name=${personName}, Pose=${poseName}`;

  const sourceFills = (sourceNode as GeometryMixin).fills;
  if (Array.isArray(sourceFills)) {
    const imageFill = sourceFills.find((f) => f.type === 'IMAGE');
    if (imageFill) {
      component.fills = [{ ...imageFill, scaleMode: 'FIT' } as ImagePaint];
    }
  } else {
    component.fills = [{ type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 } }];
  }
  return component;
}

// ============================================
// MAIN GENERATE
// ============================================

async function handleGenerate(payload: GeneratePayload): Promise<number> {
  const { personName, poses, mode } = payload;
  const targetSetId = lockedSetId; // always use controller's locked ID

  // Build new components from the node IDs captured right now
  const newComponents: ComponentNode[] = [];
  for (const { nodeId, poseName } of poses) {
    const node = figma.getNodeById(nodeId) as SceneNode | null;
    if (!node) {
      console.warn('Node not found:', nodeId);
      continue;
    }
    newComponents.push(createVariantComponent(node, personName, poseName));
  }

  if (newComponents.length === 0) {
    throw new Error('No components created — make sure the image nodes are still on the canvas.');
  }

  let componentSet: ComponentSetNode;

  if (mode === 'append' && targetSetId) {
    const existingSet = figma.getNodeById(targetSetId) as ComponentSetNode | null;
    if (!existingSet || existingSet.type !== 'COMPONENT_SET') {
      throw new Error('Locked component set not found — it may have been deleted.');
    }
    // Append directly into the existing ComponentSetNode — preserves Name/Pose properties.
    // DO NOT use combineAsVariants on existing children: it detaches them from the set,
    // loses their property context, and Figma regenerates "Property 1/2/3" duplicates.
    for (const component of newComponents) {
      existingSet.appendChild(component);
    }
    componentSet = existingSet;
    // Zoom to show the newly added components
    figma.viewport.scrollAndZoomIntoView(newComponents);
  } else {
    componentSet = figma.combineAsVariants(newComponents, figma.currentPage);
    componentSet.name = 'Aploji-Master';
    // Set auto layout
    componentSet.layoutMode = 'VERTICAL';
    componentSet.primaryAxisSizingMode = 'AUTO';
    componentSet.counterAxisSizingMode = 'AUTO';
    componentSet.itemSpacing = 0;
    const { x, y } = figma.viewport.center;
    componentSet.x = x - componentSet.width / 2;
    componentSet.y = y - componentSet.height / 2;
    // Zoom to show the new component set
    figma.viewport.scrollAndZoomIntoView([componentSet]);
  }
  figma.notify(
    `✓ "${componentSet.name}" — ${newComponents.length} variant${newComponents.length !== 1 ? 's' : ''} added!`
  );

  return newComponents.length;
}

// ============================================
// SELECTION CHANGE — only reports image nodes for preview
// NEVER touches lockedSetId
// ============================================

figma.on('selectionchange', () => {
  const images = getImageNodesFromSelection(figma.currentPage.selection);
  if (images.length > 0) {
    figma.ui.postMessage({ type: 'selection-update', data: { images } });
  } else {
    figma.ui.postMessage({ type: 'selection-cleared' });
  }
});

// ============================================
// MESSAGE HANDLER
// ============================================

figma.ui.onmessage = async (msg) => {
  // Manual refresh
  if (msg.type === 'get-selection') {
    const images = getImageNodesFromSelection(figma.currentPage.selection);
    figma.ui.postMessage(
      images.length > 0 ? { type: 'selection-update', data: { images } } : { type: 'selection-cleared' }
    );
    return;
  }

  // Lock the currently selected component set
  if (msg.type === 'lock-component-set') {
    const sel = figma.currentPage.selection;
    if (sel.length === 1 && sel[0].type === 'COMPONENT_SET') {
      lockedSetId = sel[0].id;
      lockedSetName = sel[0].name;
      figma.ui.postMessage({ type: 'lock-confirmed', data: { id: lockedSetId, name: lockedSetName } });
    } else {
      figma.notify('Select a Component Set on the canvas first.', { error: true });
      figma.ui.postMessage({ type: 'lock-failed' });
    }
    return;
  }

  // Unlock
  if (msg.type === 'unlock-component-set') {
    lockedSetId = null;
    lockedSetName = '';
    figma.ui.postMessage({ type: 'lock-cleared' });
    return;
  }

  // Generate
  if (msg.type === 'generate') {
    try {
      const variantCount = await handleGenerate(msg.data as GeneratePayload);
      figma.ui.postMessage({ type: 'generation-complete', data: { variantCount } });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      figma.notify(`Error: ${message}`, { error: true });
      figma.ui.postMessage({ type: 'generation-error', data: { message } });
    }
    return;
  }

  if (msg.type === 'cancel') figma.closePlugin();
};

// Init — report any images already selected
const images = getImageNodesFromSelection(figma.currentPage.selection);
if (images.length > 0) {
  figma.ui.postMessage({ type: 'selection-update', data: { images } });
}
