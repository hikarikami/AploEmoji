// ============================================
// EMOJI KIT BUILDER — CONTROLLER
// ============================================

figma.showUI(__html__, { width: 380, height: 640, title: 'Emoji Kit Builder' });

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

    // Count distinct pose columns already in the set
    const existingPoses = new Set(
      existingSet.children
        .map((child) => {
          const m = child.name.match(/Pose=([^,]+)/);
          return m ? m[1].trim() : null;
        })
        .filter((p): p is string => p !== null)
    );
    const numCols = Math.max(existingPoses.size, newComponents.length);

    // Ensure horizontal-wrap grid layout
    existingSet.layoutMode = 'HORIZONTAL';
    (existingSet as unknown as { layoutWrap: string }).layoutWrap = 'WRAP';
    existingSet.primaryAxisSizingMode = 'FIXED';
    existingSet.counterAxisSizingMode = 'AUTO';
    existingSet.itemSpacing = 0;
    existingSet.resize(numCols * FRAME_SIZE, existingSet.height);

    // Increment ROWS layout grid count (add one if the set has none yet)
    const grids: LayoutGrid[] = [...existingSet.layoutGrids];
    const rowsIdx = grids.findIndex((g) => g.pattern === 'ROWS');
    if (rowsIdx >= 0) {
      const g = grids[rowsIdx] as RowsColsLayoutGrid;
      grids[rowsIdx] = { ...g, count: g.count + 1 };
    } else {
      const currentRows = Math.max(1, Math.ceil(existingSet.children.length / numCols));
      grids.push({
        pattern: 'ROWS',
        alignment: 'MIN',
        gutterSize: 0,
        offset: 0,
        count: currentRows + 1,
        sectionSize: FRAME_SIZE,
        visible: true,
        color: { r: 0.5, g: 0.5, b: 0.5, a: 0.1 },
      });
    }
    existingSet.layoutGrids = grids;

    // Append directly — DO NOT use combineAsVariants on existing children: it detaches them
    // from the set, loses their property context, and regenerates "Property 1/2/3" duplicates.
    for (const component of newComponents) {
      existingSet.appendChild(component);
    }
    componentSet = existingSet;
    figma.viewport.scrollAndZoomIntoView(newComponents);
  } else {
    componentSet = figma.combineAsVariants(newComponents, figma.currentPage);
    componentSet.name = 'Aploji-Master';

    // Horizontal-wrap grid layout: each person occupies one row, each pose one column
    const numCols = newComponents.length;
    componentSet.layoutMode = 'HORIZONTAL';
    (componentSet as unknown as { layoutWrap: string }).layoutWrap = 'WRAP';
    componentSet.primaryAxisSizingMode = 'FIXED';
    componentSet.counterAxisSizingMode = 'AUTO';
    componentSet.itemSpacing = 0;
    componentSet.resize(numCols * FRAME_SIZE, FRAME_SIZE);

    // ROWS grid: 1 row per person (starts at 1), COLUMNS grid: one column per pose
    componentSet.layoutGrids = [
      {
        pattern: 'ROWS',
        alignment: 'MIN',
        gutterSize: 0,
        offset: 0,
        count: 1,
        sectionSize: FRAME_SIZE,
        visible: true,
        color: { r: 0.5, g: 0.5, b: 0.5, a: 0.1 },
      },
      {
        pattern: 'COLUMNS',
        alignment: 'MIN',
        gutterSize: 0,
        offset: 0,
        count: numCols,
        sectionSize: FRAME_SIZE,
        visible: true,
        color: { r: 0.5, g: 0.5, b: 0.5, a: 0.1 },
      },
    ];

    const { x, y } = figma.viewport.center;
    componentSet.x = x - componentSet.width / 2;
    componentSet.y = y - componentSet.height / 2;
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
  // Find master component set by name on the current page
  if (msg.type === 'find-master-set') {
    const { name } = msg.data as { name: string };
    const found = figma.currentPage.findOne(
      (n) => n.type === 'COMPONENT_SET' && n.name === name
    ) as ComponentSetNode | null;
    if (found) {
      lockedSetId = found.id;
      figma.ui.postMessage({ type: 'master-found', data: { id: found.id, name: found.name } });
    } else {
      lockedSetId = null;
      figma.ui.postMessage({ type: 'master-not-found' });
    }
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
