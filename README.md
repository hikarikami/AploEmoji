# Free Figma Plugin Template Documentation

A clean, production-ready template for building free Figma plugins with modern React UI and TypeScript. No payment systems, usage limits, or premium features - just pure plugin functionality.

## Quickstart

- Run `yarn` to install dependencies.
- Run `yarn build:watch` to start webpack in watch mode.
- Open `Figma` -> `Plugins` -> `Development` -> `Import plugin from manifest...` and choose `manifest.json` file from this repo.

⭐ To change the UI of your plugin (the react code), start editing [App.tsx](./src/app/components/App.tsx).  
⭐ To interact with the Figma API edit [controller.ts](./src/plugin/controller.ts).

## Understanding the Template Structure

The template is built with two main files that work together:

### App.tsx (User Interface)
This file contains all the React components and UI logic. It's divided into clearly marked sections:

**Plugin Configuration** - Where you customize your plugin's name, button labels, and basic settings.

**Preview Content Component** - Shows users a preview of what will be generated. Replace with your own preview logic.

**Main Content Component** - Contains your plugin's controls, settings, and options interface.

**Bottom Action Bar** - Fixed layout containing the generate button. Structure is fixed, but button text and icons can be customized.

### controller.ts (Figma API Logic)
This file handles all interactions with Figma's API and contains:

**Selection Handler** - Processes what the user has selected in Figma. Customize this for your plugin's needs.

**Plugin Action Handler** - Your main plugin functionality goes here. This is where you create, modify, or analyze Figma elements.

**Message Router** - Handles communication between the UI and controller. Add your custom message types here.

## Code Sections Explained

### 1. Plugin Configuration (CUSTOMIZE THIS)

Located at the top of `App.tsx`, this section defines your plugin's identity:

```typescript
const PLUGIN_CONFIG = {
  name: "Your Plugin Name",           // Displayed in UI header
  description: "Plugin description",   // Brief description of functionality
  primaryAction: {
    label: "Generate",                 // Main button text when ready
    loadingLabel: "Generating...",     // Button text during processing
    icon: <PlayCircleOutlined />,      // Icon shown on button
    disabledStates: {
      noSelection: "Select Something",      // Button text when nothing selected
      noValidContent: "Enable Options Above", // Button text when settings invalid
    }
  }
};
```

**What you can change:** All text, icon, and labels to match your plugin's purpose.
**What not to change:** The structure of this object - the template expects these exact property names.

### 2. Theme Configuration (CUSTOMIZE COLOR)

Change your plugin's color theme by updating one hex code:

```typescript
// CHANGE THIS HEX CODE TO UPDATE THE ENTIRE THEME!
const THEME_COLOR = '#ff6b35'; // Orange example - change to any color you want

const customTheme = {
  token: {
    colorPrimary: THEME_COLOR,
    borderRadius: 6, // Optional: customize border radius
  },
  components: {
    Button: { colorPrimary: THEME_COLOR },
    Switch: { colorPrimary: THEME_COLOR },
    Tag: { colorPrimary: THEME_COLOR },
  },
};
```

**What you can change:** The `THEME_COLOR` hex code to any color you prefer.
**Popular choices:** 
- `'#1890ff'` - Blue (Ant Design default)
- `'#52c41a'` - Green
- `'#722ed1'` - Purple  
- `'#ff4d4f'` - Red
- `'#eb2f96'` - Pink

### 3. Preview Content Component (REPLACE THIS)

This component shows users what will happen when they click the generate button:

```typescript
const PreviewContent = ({ selectedData }) => {
  // When nothing is selected, show instructions
  if (!selectedData) {
    return (
      <div style={{ padding: "20px" }}>
        <Text type="secondary" style={{ textAlign: "center" }}>
          Select something from the canvas to get started
        </Text>
      </div>
    );
  }

  // When something is selected, show preview
  return (
    <div style={{ padding: "20px" }}>
      <Text code>{selectedData.name}</Text>
      
      {/* Add status indicators in bottom corners */}
      <div style={{ position: "absolute", bottom: "12px", left: "12px" }}>
        <Tag color="blue">Ready to Process</Tag>
      </div>
    </div>
  );
};
```

**What you can change:** Everything inside this component. Replace with previews relevant to your plugin.
**What to keep:** The basic structure of handling `!selectedData` for empty states and using absolute positioning for corner elements.

### 4. Main Content Component (REPLACE THIS)

This is where your plugin's main controls and settings go:

```typescript
const MainContent = ({ selectedData, pluginState, onStateChange }) => {
  // Show message when nothing is selected
  if (!selectedData) {
    return (
      <Card style={{ marginTop: "16px" }}>
        <div style={{ textAlign: "center", padding: "12px" }}>
          <Text type="secondary">
            Main content will appear here once you select something
          </Text>
        </div>
      </Card>
    );
  }

  // Show your plugin's settings and controls
  return (
    <div>
      <Text style={{
        fontSize: "12px", color: "#888", marginTop: "12px",
        marginBottom: "8px", display: "block", fontWeight: "bold"
      }}>
        Plugin Options
      </Text>

      <Card style={{ marginTop: "16px" }} bodyStyle={{ padding: "4px 2px" }}>
        <Space direction="vertical" size={2} style={{ width: "100%" }}>
          
          {/* Individual setting rows */}
          <div style={{
            display: "flex", justifyContent: "space-between",
            alignItems: "center", padding: "8px 12px"
          }}>
            <Text code>Example Option</Text>
            <Switch
              checked={pluginState.exampleOption || false}
              onChange={(checked) =>
                onStateChange({ ...pluginState, exampleOption: checked })
              }
              size="small"
            />
          </div>
          
        </Space>
      </Card>
    </div>
  );
};
```

**What you can change:** Replace all content with your plugin's specific controls - switches, inputs, dropdowns, sliders, etc.
**What to keep:** The props structure (`selectedData`, `pluginState`, `onStateChange`) and the pattern of updating state via `onStateChange`.

### 5. Plugin State (CUSTOMIZE THIS)

Define what settings your plugin needs to remember:

```typescript
const [pluginState, setPluginState] = useState({
  // Add your plugin-specific settings here
  exampleOption: true,
  spacing: 20,
  outputFormat: "png",
  enableAdvancedMode: false,
});
```

**What you can change:** Replace with any settings your plugin needs. These will be passed to the controller when generating.
**What not to change:** The variable name `pluginState` and the `setPluginState` function name.

### 6. Selection Data Extraction (CUSTOMIZE THIS)

Located in `controller.ts`, this function processes what the user selected in Figma:

```typescript
const extractDataFromSelection = (selection: readonly SceneNode[]): PluginData | null => {
  // Example: Only process single selections
  if (selection.length === 1) {
    const selected = selection[0];

    // Example: Only process certain node types
    if (selected.type === "COMPONENT") {
      return {
        id: selected.id,
        name: selected.name,
        type: selected.type,
        // Extract whatever data your plugin needs
        width: selected.width,
        height: selected.height,
      };
    }
  }

  return null; // Return null if selection is invalid
};
```

**What you can change:** The selection criteria (how many items, what types), and what data to extract.
**What to keep:** The function signature and return type. Return `null` for invalid selections.

### 7. Main Plugin Action (REPLACE THIS)

This is your plugin's core functionality:

```typescript
const handlePluginAction = async (data: any): Promise<void> => {
  try {
    const { data: selectedData, settings } = data;
    
    // Your plugin logic here
    console.log("Processing:", selectedData.name);
    console.log("With settings:", settings);
    
    // Example: Create something in Figma
    const frame = figma.createFrame();
    frame.name = `Generated - ${selectedData.name}`;
    frame.resize(200, 100);
    frame.fills = [{ type: "SOLID", color: { r: 0.8, g: 0.9, b: 1 } }];

    // Position in viewport and select it
    const viewport = figma.viewport.center;
    frame.x = viewport.x;
    frame.y = viewport.y;

    figma.currentPage.appendChild(frame);
    figma.currentPage.selection = [frame];
    figma.viewport.scrollAndZoomIntoView([frame]);

    // Notify user of success
    figma.notify("Action completed successfully!");

  } catch (error) {
    console.error("Plugin action failed:", error);
    figma.notify("Action failed. Please try again.");
  }
};
```

**What you can change:** Everything inside the try block. Replace with your plugin's functionality.
**What to keep:** The error handling structure and the function signature.

### 8. Validation Logic (CUSTOMIZE THIS)

These functions determine when the generate button is enabled:

```typescript
// Define what makes a selection valid
const hasValidSelection = !!selectedData;

// Define what makes the current configuration valid
const hasValidContent = hasValidSelection; // Customize this logic
```

**What you can change:** The logic for determining valid selections and configurations.
**What happens:** The generate button will be disabled unless both functions return `true`.

### 9. Generate Handler Message (CUSTOMIZE THIS)

This sends data from the UI to the controller:

```typescript
const handleGenerate = () => {
  setIsGenerating(true);

  parent.postMessage({
    pluginMessage: {
      type: "generate", // Must match the handler in controller.ts
      data: selectedData,
      settings: pluginState,
    },
  }, "*");
};
```

**What you can change:** The message type name and what data to send.
**What must match:** The `type` field must match a handler in your controller's message router.

## Available Ant Design Components

The template includes Ant Design for UI components. Here are the most useful ones for plugin development:

### Data Entry Components
```typescript
import { 
  Input,           // Text inputs
  InputNumber,     // Number inputs
  Select,          // Dropdowns
  Checkbox,        // Checkboxes
  Radio,           // Radio buttons
  Switch,          // Toggle switches
  Slider,          // Range sliders
  ColorPicker,     // Color selection
} from "antd";
```

### Layout Components
```typescript
import { 
  Card,            // Content containers
  Space,           // Spacing wrapper
  Row, Col,        // Grid system
  Divider,         // Visual separators
  Tabs,            // Tab navigation
  Collapse,        // Collapsible sections
} from "antd";
```

### Display Components
```typescript
import { 
  Typography,      // Text elements
  Tag,             // Labels/badges
  Badge,           // Status indicators
  Avatar,          // Profile pictures
  List,            // Data lists
  Progress,        // Progress bars
  Alert,           // Notifications
  Tooltip,         // Hover tips
} from "antd";
```

### Example Usage:
```typescript
// Color picker
<ColorPicker 
  value={pluginState.color} 
  onChange={(color) => onStateChange({...pluginState, color: color.toHexString()})} 
/>

// Dropdown selection
<Select 
  value={pluginState.style}
  onChange={(value) => onStateChange({...pluginState, style: value})}
  options={[
    { value: 'modern', label: 'Modern' },
    { value: 'classic', label: 'Classic' }
  ]}
/>

// Range slider
<Slider 
  min={0} 
  max={100} 
  value={pluginState.spacing}
  onChange={(value) => onStateChange({...pluginState, spacing: value})}
/>
```

## Common Customization Patterns

### Adding a New Setting

1. **Add to plugin state:**
```typescript
const [pluginState, setPluginState] = useState({
  myNewSetting: false, // Add your setting here
});
```

2. **Add UI control in MainContent:**
```typescript
<div style={{ display: "flex", justifyContent: "space-between" }}>
  <Text code>My New Setting</Text>
  <Switch
    checked={pluginState.myNewSetting}
    onChange={(checked) =>
      onStateChange({ ...pluginState, myNewSetting: checked })
    }
  />
</div>
```

3. **Use in controller:**
```typescript
const handlePluginAction = async (data: any) => {
  const { settings } = data;
  
  if (settings.myNewSetting) {
    // Do something when the setting is enabled
  }
};
```

### Changing Selection Requirements

Update the `extractDataFromSelection` function:

```typescript
// Example: Require exactly 2 items selected
if (selection.length === 2) {
  return {
    items: selection.map(item => ({
      id: item.id,
      name: item.name,
    }))
  };
}

// Example: Only accept text nodes
if (selection.length === 1 && selection[0].type === "TEXT") {
  return {
    id: selection[0].id,
    name: selection[0].name,
    characters: selection[0].characters,
  };
}
```

### Adding Custom Message Types

1. **In App.tsx, send custom message:**
```typescript
parent.postMessage({
  pluginMessage: {
    type: "my-custom-action",
    customData: someValue,
  },
}, "*");
```

2. **In controller.ts, handle the message:**
```typescript
else if (msg.type === "my-custom-action") {
  // Handle your custom action
  console.log("Custom data:", msg.customData);
}
```

### Creating Multi-Step Workflows

```typescript
// In plugin state, track current step
const [pluginState, setPluginState] = useState({
  currentStep: 1,
  stepData: {},
});

// In MainContent, show different UI based on step
if (pluginState.currentStep === 1) {
  return <StepOneComponent />;
} else if (pluginState.currentStep === 2) {
  return <StepTwoComponent />;
}

// Progress through steps
const nextStep = () => {
  setPluginState(prev => ({ ...prev, currentStep: prev.currentStep + 1 }));
};
```

## Working with Figma API

### Common Figma Operations

```typescript
// Create elements
const frame = figma.createFrame();
const text = figma.createText();
const rectangle = figma.createRectangle();

// Modify properties
frame.resize(300, 200);
frame.fills = [{ type: "SOLID", color: { r: 1, g: 0, b: 0 } }];
frame.name = "My Frame";

// Position elements
frame.x = 100;
frame.y = 100;

// Add to page and select
figma.currentPage.appendChild(frame);
figma.currentPage.selection = [frame];

// Navigate viewport
figma.viewport.scrollAndZoomIntoView([frame]);
```

### Reading Selected Elements

```typescript
const selection = figma.currentPage.selection;

selection.forEach(node => {
  console.log("Node type:", node.type);
  console.log("Node name:", node.name);
  
  if (node.type === "TEXT") {
    console.log("Text content:", node.characters);
  }
  
  if (node.type === "FRAME" || node.type === "COMPONENT") {
    console.log("Size:", node.width, "x", node.height);
  }
});
```

### Working with Colors

```typescript
// Solid fill
const solidFill = { type: "SOLID", color: { r: 1, g: 0.5, b: 0 } };

// Gradient fill
const gradientFill = {
  type: "GRADIENT_LINEAR",
  gradientTransform: [[1, 0, 0], [0, 1, 0]],
  gradientStops: [
    { color: { r: 1, g: 0, b: 0 }, position: 0 },
    { color: { r: 0, g: 0, b: 1 }, position: 1 }
  ]
};

frame.fills = [solidFill];
```

## Troubleshooting

### Plugin Won't Load
- Check console for TypeScript errors
- Ensure all imports are correct
- Verify `manifest.json` is properly configured

### Button Not Working
- Check that message type in `handleGenerate` matches controller handler
- Verify `hasValidSelection` and `hasValidContent` logic
- Ensure `handlePluginAction` is implemented

### Selection Not Detected
- Check `extractDataFromSelection` returns data for your selection type
- Verify the selection change handler is working
- Test with different Figma element types

### UI Components Not Themed
- Ensure `ConfigProvider` wraps your entire app
- Check that `THEME_COLOR` is properly defined
- Verify component imports include `ConfigProvider`

### State Not Updating
- Make sure you're using `onStateChange` to update plugin state
- Check that state variable names match between components
- Verify useState is properly initialized

## File Structure Summary

```
your-plugin/
├── src/
│   ├── app/
│   │   ├── assets/
│   │   ├── components/
│   │   │   └── App.tsx                  # Main UI component (customize marked sections)
│   │   ├── styles/
│   │   ├── index.html                   # HTML template
│   │   └── index.tsx                    # React entry point
│   ├── plugin/
│   │   └── controller.ts                # Figma API logic (customize marked functions)
│   └── typings/
├── .gitignore
├── .prettierrc.yml
├── LICENSE
├── manifest.json                        # Plugin metadata (update name, description, etc.)
├── package.json                         # Dependencies
└── README.md
```

This template provides a solid foundation for any free Figma plugin while maintaining professional UI standards and clean code architecture. Happy building! 🎨