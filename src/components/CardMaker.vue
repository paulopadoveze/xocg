<template>
  <div class="card-template-editor">

    <div class="controls-panel">
  
      <!-- Card dimensions -->
      <div class="control-group">
        <h3>Card Dimensions</h3>
        <div class="dimension-inputs">
          <label>
            Width (px):
            <input type="number" v-model="stageWidth" min="100" max="2000" @change="updateDimensions">
          </label>
          <label>
            Height (px):
            <input type="number" v-model="stageHeight" min="100" max="2000" @change="updateDimensions">
          </label>
          <label>
            Padding (px):
            <input type="number" v-model="padding" min="0" max="100" @change="updatePadding">
          </label>
        </div>
      </div>

       <!-- Grid and Snapping controls -->
      <div class="control-group ">
        <div class="grid-controls">
          <h3>Grid & Snapping</h3>
          <label>
            <input type="checkbox" v-model="showGrid"> Show Grid
          </label>
          <label>
            <input type="checkbox" v-model="snapToGrid"> Snap to Grid
          </label>
          <label>
            <input type="checkbox" v-model="snapToElements"> Snap to Elements
          </label>
          <label>
            Grid Size (px):
            <input type="number" v-model="gridSize" min="5" max="50" step="5">
          </label>
          <label>
            Snap Threshold (px):
            <input type="number" v-model="snapThreshold" min="1" max="50" step="1">
          </label>
        </div>
      </div>

      <!-- Template management -->
      <div class="control-group">
        <h3>Template</h3>
        <div class="template-buttons">
          <button @click="createNewTemplate" class="btn">New Blank</button>
          <button @click="showTemplateSelector = true" class="btn">Load Existing</button>
          <button @click="saveTemplate" class="btn">Save Template</button>
        </div>
      </div>

      <!-- Drawing tools -->
      <div class="control-group">
        <h3>Drawing Tools</h3>
        <div class="tool-buttons">
          <button 
            v-for="tool in drawingTools" 
            :key="tool.value"
            @click="setDrawingTool(tool.value)"
            :class="['btn', { active: currentTool === tool.value }]"
          >
            {{ tool.label }}
          </button>
        </div>
        
        <!-- Transform controls -->
        <div class="transform-controls" v-if="selectedObject">
          <h4>Transform</h4>
          <label>
            Lock Aspect Ratio:
            <input type="checkbox" v-model="lockAspectRatio" @change="updateTransformControls">
          </label>
          <div class="transform-buttons">
            <button @click="rotateSelected(-15)" class="btn small">↺ -15°</button>
            <button @click="rotateSelected(15)" class="btn small">↻ +15°</button>
            <button @click="flipSelected('x')" class="btn small">Flip X</button>
            <button @click="flipSelected('y')" class="btn small">Flip Y</button>
          </div>
        </div>
        
        <!-- Shape properties -->
        <div class="shape-properties" v-if="selectedObject">
          <h4>Selected Element</h4>
          <label>
            Element ID:
            <input type="text" v-model="selectedObject.attrs.id" @change="updateElementId">
          </label>
          
          <!-- Position and Size -->
          <div class="position-size">
            <h5>Position & Size</h5>
            <label>
              X:
              <input type="number" v-model="selectedObject.attrs.x" @change="updatePosition">
            </label>
            <label>
              Y:
              <input type="number" v-model="selectedObject.attrs.y" @change="updatePosition">
            </label>
            <label v-if="selectedObject.className === 'Rect'">
              Width:
              <input type="number" v-model="selectedObject.attrs.width" @change="updateSize" min="10">
            </label>
            <label v-if="selectedObject.className === 'Rect'">
              Height:
              <input type="number" v-model="selectedObject.attrs.height" @change="updateSize" min="10">
            </label>
            <label v-if="selectedObject.className === 'Ellipse'">
              Radius X:
              <input type="number" v-model="selectedObject.attrs.radiusX" @change="updateSize" min="5">
            </label>
            <label v-if="selectedObject.className === 'Ellipse'">
              Radius Y:
              <input type="number" v-model="selectedObject.attrs.radiusY" @change="updateSize" min="5">
            </label>
            <label v-if="selectedObject.className === 'RegularPolygon'">
              Radius:
              <input type="number" v-model="selectedObject.attrs.radius" @change="updateSize" min="5">
            </label>
            <label>
              Rotation:
              <input type="number" v-model="selectedObject.attrs.rotation" @change="updateRotation" min="0" max="360">
            </label>
          </div>
          
          <!-- Appearance -->
          <div class="appearance">
            <h5>Appearance</h5>
            <label>
              Fill Color:
              <input type="color" v-model="selectedObject.attrs.fill" @change="updateFillColor">
            </label>
            <label>
              Stroke Color:
              <input type="color" v-model="selectedObject.attrs.stroke" @change="updateStroke">
            </label>
            <label>
              Stroke Width:
              <input type="number" v-model="selectedObject.attrs.strokeWidth" @change="updateStroke" min="0" max="10">
            </label>
            <label v-if="selectedObject.className === 'Text'">
              Font Size:
              <input type="number" v-model="selectedObject.attrs.fontSize" @change="updateFontSize" min="8" max="72">
            </label>
            <label v-if="selectedObject.className === 'Text'">
              Text Content:
              <input type="text" v-model="selectedObject.attrs.text" @change="updateText">
            </label>
          </div>
          
          <button @click="deleteSelected" class="btn delete">Delete</button>
        </div>

        
      </div>

      <!-- JSON output -->
      <div class="control-group">
        <h3>Output</h3>
        <button @click="exportToJson" class="btn">Export to JSON</button>
        <button @click="importFromJson" class="btn">Import JSON</button>
        <textarea 
          v-model="jsonOutput" 
          class="json-output" 
          rows="5"
          placeholder="JSON output will appear here..."
        ></textarea>
      </div>
    </div>

    <div class="canvasWrapper">
      <div class="canvas-container" @click.self="handleCanvasContainerClick">
        <v-stage
          ref="stage"
          :config="stageConfig"
          @mousedown="onStageMouseDown"
          @mouseup="onStageMouseUp"
          @mousemove="onStageMouseMove"
          @touchstart="onStageMouseDown"
          @touchend="onStageMouseUp"
          @touchmove="onStageMouseMove"
          @click="onStageClick"
        >
          <v-layer>
            <!-- Grid lines -->
            <v-line
              v-for="line in gridLines"
              :key="line.id"
              :config="line"
            />
            
            <!-- Snap guides -->
            <v-line
              v-for="guide in snapGuides"
              :key="guide.id"
              :config="guide"
            />
            
            <!-- Padding indicator -->
            <v-rect
              v-if="padding > 0"
              :config="paddingIndicatorConfig"
            />
            
            <!-- Preview shape while drawing -->
            <v-rect
              v-if="previewShape && previewShape.classname === 'Rect'"
              :config="previewShape.attrs"
            />
            <v-ellipse
              v-if="previewShape && previewShape.classname === 'Ellipse'"
              :config="previewShape.attrs"
            />
            <v-regular-polygon
              v-if="previewShape && previewShape.classname === 'RegularPolygon'"
              :config="previewShape.attrs"
            />
            
            <!-- Card elements with transformers -->
            <v-rect
              v-for="item in rectElements"
              :key="item.attrs.id"
              :config="getShapeConfig(item)"
              @dragstart="onDragStart"
              @dragmove="onDragMove"
              @dragend="onDragEnd"
              @transformstart="onTransformStart"
              @transform="onTransform"
              @transformend="onTransformEnd"
              @click="onShapeClick"
              @tap="onShapeClick"
            />
            
            <v-ellipse
              v-for="item in ellipseElements"
              :key="item.attrs.id"
              :config="getShapeConfig(item)"
              @dragstart="onDragStart"
              @dragmove="onDragMove"
              @dragend="onDragEnd"
              @transformstart="onTransformStart"
              @transform="onTransform"
              @transformend="onTransformEnd"
              @click="onShapeClick"
              @tap="onShapeClick"
            />
            
            <v-regular-polygon
              v-for="item in triangleElements"
              :key="item.attrs.id"
              :config="getShapeConfig(item)"
              @dragstart="onDragStart"
              @dragmove="onDragMove"
              @dragend="onDragEnd"
              @transformstart="onTransformStart"
              @transform="onTransform"
              @transformend="onTransformEnd"
              @click="onShapeClick"
              @tap="onShapeClick"
            />
            
            <v-text
              v-for="item in textElements"
              :key="item.attrs.id"
              :config="getShapeConfig(item)"
              @dragstart="onDragStart"
              @dragmove="onDragMove"
              @dragend="onDragEnd"
              @transformstart="onTransformStart"
              @transform="onTransform"
              @transformend="onTransformEnd"
              @click="onShapeClick"
              @tap="onShapeClick"
              @dblclick="onTextDoubleClick"
            />
            
            <!-- Transformer for selected object -->
            <v-transformer
              ref="transformer"
              :config="transformerConfig"
            />
          </v-layer>
        </v-stage>
      </div>

    </div>

    <!-- Template selector modal -->
    <div v-if="showTemplateSelector" class="modal">
      <div class="modal-content">
        <h3>Select Template</h3>
        <div class="template-list">
          <div 
            v-for="(template, index) in savedTemplates" 
            :key="index"
            class="template-item"
            @click="loadTemplate(template)"
          >
            {{ template.name || `Template ${index + 1}` }}
          </div>
        </div>
        <button @click="showTemplateSelector = false" class="btn">Close</button>
      </div>
    </div>

    <FiguresList
      :rect-elements="rectElements"
      :ellipse-elements="ellipseElements"
      :triangle-elements="triangleElements"
      :text-elements="textElements"
      :selected-id="selectedObject?.id()"
      :stage="stage"
      @select-figure="handleSelectFigure"
      @update-figure="handleUpdateFigure"
      @delete-figure="handleDeleteFigure"
      @zoom-to-figure="handleZoomToFigure"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import Konva from 'konva'

import FiguresList from './FigureList.vue'

// State
const stage = ref(null)
const transformer = ref(null)
const stageWidth = ref(630)
const stageHeight = ref(880)
const padding = ref(36)
const showGrid = ref(true)
const snapToGrid = ref(true)
const snapToElements = ref(true)
const gridSize = ref(10)
const snapThreshold = ref(10)
const currentTool = ref('select')
const showTemplateSelector = ref(false)
const selectedObject = ref(null)
const lockAspectRatio = ref(false)
const isDrawing = ref(false)
const drawingStartPoint = ref(null)
const previewShape = ref(null)
const snapGuides = ref([])

// Element collections
const rectElements = ref([])
const ellipseElements = ref([])
const triangleElements = ref([])
const textElements = ref([])

// Default MTG card dimensions
const MTG_DIMENSIONS = {
  width: 630,
  height: 880,
  padding: 36
}

// Drawing tools
const drawingTools = [
  { label: 'Select', value: 'select' },
  { label: 'Rectangle', value: 'rect' },
  { label: 'Ellipse', value: 'ellipse' },
  { label: 'Triangle', value: 'triangle' },
  { label: 'Text', value: 'text' }
]

// Stage configuration
const stageConfig = computed(() => ({
  width: stageWidth.value,
  height: stageHeight.value,
  draggable: false
}))

// Get shape configuration with drag bound function
const getShapeConfig = (item) => {
  const config = { ...item.attrs }
  
  // Add drag bound function if snapping is enabled
  if (snapToGrid.value || snapToElements.value) {
    config.dragBoundFunc = (pos) => {
      return getSnappedPosition(pos, item)
    }
  }
  
  return config
}

// Transformer configuration
const transformerConfig = computed(() => ({
  enabled: selectedObject.value !== null,
  rotateEnabled: true,
  resizeEnabled: true,
  keepRatio: lockAspectRatio.value,
  boundBoxFunc: (oldBox, newBox) => {
    // Constrain minimum size
    if (newBox.width < 10 || newBox.height < 10) {
      return oldBox
    }
    return newBox
  }
}))

// Padding indicator configuration
const paddingIndicatorConfig = computed(() => ({
  x: padding.value,
  y: padding.value,
  width: stageWidth.value - 2 * padding.value,
  height: stageHeight.value - 2 * padding.value,
  stroke: '#000',
  strokeWidth: 1,
  dash: [5, 1],
  listening: false,
  id: 'padding-indicator'
}))

// Grid lines
const gridLines = computed(() => {
  const lines = []
  if (!showGrid.value) return lines
  
  // Vertical lines
  for (let x = 0; x <= stageWidth.value; x += gridSize.value) {
    lines.push({
      points: [x, 0, x, stageHeight.value],
      stroke: '#ddd',
      strokeWidth: 0.5,
      listening: false,
      id: `grid-v-${x}`
    })
  }
  
  // Horizontal lines
  for (let y = 0; y <= stageHeight.value; y += gridSize.value) {
    lines.push({
      points: [0, y, stageWidth.value, y],
      stroke: '#ddd',
      strokeWidth: 0.5,
      listening: false,
      id: `grid-h-${y}`
    })
  }
  
  return lines
})

// Saved templates
const savedTemplates = ref([
  {
    name: 'MTG Creature',
    dimensions: { ...MTG_DIMENSIONS },
    elements: [
      {
        type: 'rect',
        id: 'art_box',
        x: 50,
        y: 100,
        width: 530,
        height: 400,
        fill: '#cccccc',
        stroke: '#000000',
        strokeWidth: 1,
        rotation: 0
      },
      {
        type: 'text',
        id: 'name',
        x: 100,
        y: 50,
        fontSize: 24,
        text: 'Card Name',
        fill: '#000000',
        rotation: 0
      }
    ]
  }
])

// JSON output
const jsonOutput = ref('')

// Helper function to get element bounds
const getElementBounds = (element) => {
  const attrs = element.attrs || element
  
  switch (element.className) {
    case 'Rect':
      return {
        left: attrs.x,
        right: attrs.x + attrs.width,
        top: attrs.y,
        bottom: attrs.y + attrs.height,
        centerX: attrs.x + attrs.width / 2,
        centerY: attrs.y + attrs.height / 2
      }
    case 'Ellipse':
      return {
        left: attrs.x - attrs.radiusX,
        right: attrs.x + attrs.radiusX,
        top: attrs.y - attrs.radiusY,
        bottom: attrs.y + attrs.radiusY,
        centerX: attrs.x,
        centerY: attrs.y
      }
    case 'RegularPolygon':
      return {
        left: attrs.x - attrs.radius,
        right: attrs.x + attrs.radius,
        top: attrs.y - attrs.radius,
        bottom: attrs.y + attrs.radius,
        centerX: attrs.x,
        centerY: attrs.y
      }
    case 'Text':
      // Approximate text bounds (could be improved with actual text measurement)
      const textWidth = attrs.text.length * attrs.fontSize * 0.6
      return {
        left: attrs.x,
        right: attrs.x + textWidth,
        top: attrs.y,
        bottom: attrs.y + attrs.fontSize,
        centerX: attrs.x + textWidth / 2,
        centerY: attrs.y + attrs.fontSize / 2
      }
    default:
      return {
        left: attrs.x,
        right: attrs.x + 50,
        top: attrs.y,
        bottom: attrs.y + 50,
        centerX: attrs.x + 25,
        centerY: attrs.y + 25
      }
  }
}

// Get snapped position with guides
const getSnappedPosition = (pos, currentElement) => {
  let snappedX = pos.x
  let snappedY = pos.y
  const guides = []
  
  const currentBounds = getElementBounds(currentElement)
  
  // Snap to grid
  if (snapToGrid.value) {
    const gridX = Math.round(pos.x / gridSize.value) * gridSize.value
    const gridY = Math.round(pos.y / gridSize.value) * gridSize.value
    
    if (Math.abs(gridX - pos.x) < snapThreshold.value) {
      snappedX = gridX
      guides.push({
        points: [gridX, 0, gridX, stageHeight.value],
        stroke: '#00ff00',
        strokeWidth: 1,
        dash: [5, 5],
        listening: false,
        id: `guide-grid-v-${Date.now()}`
      })
    }
    
    if (Math.abs(gridY - pos.y) < snapThreshold.value) {
      snappedY = gridY
      guides.push({
        points: [0, gridY, stageWidth.value, gridY],
        stroke: '#00ff00',
        strokeWidth: 1,
        dash: [5, 5],
        listening: false,
        id: `guide-grid-h-${Date.now()}`
      })
    }
  }
  
  // Snap to other elements
  if (snapToElements.value) {
    const allElements = [
      ...rectElements.value,
      ...ellipseElements.value,
      ...triangleElements.value,
      ...textElements.value
    ].filter(el => el.attrs.id !== currentElement.attrs.id)
    
    allElements.forEach(element => {
      const bounds = getElementBounds(element)
      
      // Check horizontal alignment (top, center, bottom)
      const alignments = [
        { value: bounds.top, type: 'top' },
        { value: bounds.centerY, type: 'center' },
        { value: bounds.bottom, type: 'bottom' }
      ]
      
      alignments.forEach(align => {
        const dist = Math.abs(pos.y - align.value)
        if (dist < snapThreshold.value && dist < Math.abs(snappedY - pos.y)) {
          snappedY = align.value
          guides.push({
            points: [0, align.value, stageWidth.value, align.value],
            stroke: '#ff0000',
            strokeWidth: 1,
            dash: [5, 5],
            listening: false,
            id: `guide-h-${element.attrs.id}-${align.type}-${Date.now()}`
          })
        }
      })
      
      // Check vertical alignment (left, center, right)
      const vAlignments = [
        { value: bounds.left, type: 'left' },
        { value: bounds.centerX, type: 'center' },
        { value: bounds.right, type: 'right' }
      ]
      
      vAlignments.forEach(align => {
        const dist = Math.abs(pos.x - align.value)
        if (dist < snapThreshold.value && dist < Math.abs(snappedX - pos.x)) {
          snappedX = align.value
          guides.push({
            points: [align.value, 0, align.value, stageHeight.value],
            stroke: '#ff0000',
            strokeWidth: 1,
            dash: [5, 5],
            listening: false,
            id: `guide-v-${element.attrs.id}-${align.type}-${Date.now()}`
          })
        }
      })
    })
  }
  
  // Update guides
  snapGuides.value = guides
  
  // Clear guides after a short delay
  setTimeout(() => {
    snapGuides.value = []
  }, 500)
  
  return { x: snappedX, y: snappedY }
}

// Watch for selected object changes
watch(selectedObject, async (newVal) => {
  await nextTick()
  if (transformer.value && newVal) {
    const transformerNode = transformer.value.getNode()
    if (transformerNode) {
      transformerNode.nodes([newVal])
      transformerNode.getLayer().batchDraw()
    }
  } else if (transformer.value) {
    const transformerNode = transformer.value.getNode()
    if (transformerNode) {
      transformerNode.nodes([])
    }
  }
})

// Update dimensions
const updateDimensions = () => {
  constrainElementsToCanvas()
}

// Update padding
const updatePadding = () => {
  // Padding indicator will update via computed property
}

// Constrain elements to canvas bounds
const constrainElementsToCanvas = () => {
  const allElements = [...rectElements.value, ...ellipseElements.value, ...triangleElements.value, ...textElements.value]
  
  allElements.forEach(element => {
    const attrs = element.attrs
    if (attrs.className === 'Ellipse') {
      if (attrs.x + attrs.radiusX > stageWidth.value) {
        attrs.x = stageWidth.value - attrs.radiusX
      }
      if (attrs.y + attrs.radiusY > stageHeight.value) {
        attrs.y = stageHeight.value - attrs.radiusY
      }
    } else {
      if (attrs.x + (attrs.width || attrs.radius * 2) > stageWidth.value) {
        attrs.x = stageWidth.value - (attrs.width || attrs.radius * 2)
      }
      if (attrs.y + (attrs.height || attrs.radius * 2) > stageHeight.value) {
        attrs.y = stageHeight.value - (attrs.height || attrs.radius * 2)
      }
    }
    if (attrs.x < 0) attrs.x = 0
    if (attrs.y < 0) attrs.y = 0
  })
}

const handleCanvasContainerClick = () => {
  selectedObject.value = null
}

// Handle click on empty stage area
const onStageClick = (e) => {
  if (e.target === e.target.getStage()) {
    selectedObject.value = null
  }
}

// Set drawing tool
const setDrawingTool = (tool) => {
  currentTool.value = tool
  selectedObject.value = null
}

// Create preview shape
const createPreviewShape = (type, x, y) => {
  const previewId = 'preview-shape'
  
  // Remove any existing preview
  previewShape.value = null
  
  switch (type) {
    case 'rect':
      previewShape.value = {
        attrs: {
          id: previewId,
          x,
          y,
          width: 0,
          height: 0,
          fill: 'rgba(0, 123, 255, 0.3)',
          stroke: '#007bff',
          strokeWidth: 2,
          dash: [5, 5],
          listening: false,
          name: 'preview'
        },
        classname: 'Rect'
      }
      break
      
    case 'ellipse':
      previewShape.value = {
        attrs: {
          id: previewId,
          x,
          y,
          radiusX: 0,
          radiusY: 0,
          fill: 'rgba(0, 123, 255, 0.3)',
          stroke: '#007bff',
          strokeWidth: 2,
          dash: [5, 5],
          listening: false,
          name: 'preview'
        },
        classname: 'Ellipse'
      }
      break
      
    case 'triangle':
      previewShape.value = {
        attrs: {
          id: previewId,
          x,
          y,
          sides: 3,
          radius: 0,
          fill: 'rgba(0, 123, 255, 0.3)',
          stroke: '#007bff',
          strokeWidth: 2,
          dash: [5, 5],
          listening: false,
          name: 'preview'
        },
        classname: 'RegularPolygon'
      }
      break
  }
}

// Add shape
const addShape = (type, x, y, size = null) => {
  const id = `${type}_${uuidv4()}`
  
  // Apply snapping if enabled
  let snappedX = x
  let snappedY = y
  
  if (snapToGrid.value) {
    snappedX = Math.round(x / gridSize.value) * gridSize.value
    snappedY = Math.round(y / gridSize.value) * gridSize.value
  }
  
  switch (type) {
    case 'rect':
      rectElements.value.push({
        attrs: {
          id,
          x: snappedX,
          y: snappedY,
          width: size?.width || snapValueToGrid(100),
          height: size?.height || snapValueToGrid(100),
          fill: '#ffffff',
          stroke: '#000000',
          strokeWidth: 1,
          draggable: true,
          rotation: 0,
          name: 'shape'
        },
        className: 'Rect'
      })
      break

    case 'ellipse':
      ellipseElements.value.push({
        attrs: {
          id,
          x: snappedX,
          y: snappedY,
          radiusX: size?.radiusX || 50,
          radiusY: size?.radiusY || 50,
          fill: '#ffffff',
          stroke: '#000000',
          strokeWidth: 1,
          draggable: true,
          rotation: 0,
          name: 'shape'
        },
        className: 'Ellipse'
      })
      break

    case 'triangle':
      triangleElements.value.push({
        attrs: {
          id,
          x: snappedX,
          y: snappedY,
          sides: 3,
          radius: size?.radius || 50,
          fill: '#ffffff',
          stroke: '#000000',
          strokeWidth: 1,
          draggable: true,
          rotation: 0,
          name: 'shape'
        },
        className: 'RegularPolygon'
      })
      break

    case 'text':
      textElements.value.push({
        attrs: {
          id,
          x: snappedX,
          y: snappedY,
          text: size?.text || 'Text',
          fontSize: size?.fontSize || 20,
          fill: '#000000',
          draggable: true,
          rotation: 0,
          name: 'shape'
        },
        className: 'Text'
      })
      break
  }
}

const addShapeWithSize = (type, x, y, width, height) => {
  switch (type) {
    case 'rect':
      addShape('rect', x, y, { width, height })
      break
    case 'ellipse':
      addShape('ellipse', x + width/2, y + height/2, { 
        radiusX: width / 2,
        radiusY: height / 2
      })
      break
    case 'triangle':
      addShape('triangle', x + width/2, y + height/2, { 
        radius: Math.min(width, height) / 2 
      })
      break
  }
}

// Stage event handlers
const onStageMouseDown = (e) => {
  if (e.target === e.target.getStage() && currentTool.value === 'select') {
    selectedObject.value = null
  }
  
  if (currentTool.value === 'select') return
  
  if (e.target === e.target.getStage()) {
    isDrawing.value = true
    const pos = e.target.getStage().getPointerPosition()
    drawingStartPoint.value = pos
    
    if (currentTool.value === 'text') {
      const text = prompt('Enter text:', 'Text')
      if (text) {
        addShape('text', pos.x, pos.y, { text, fontSize: 20 })
      }
      isDrawing.value = false
    } else {
      createPreviewShape(currentTool.value, pos.x, pos.y)
    }
  }
}

const onStageMouseMove = (e) => {
  if (isDrawing.value && currentTool.value !== 'select' && currentTool.value !== 'text' && previewShape.value) {
    const pos = e.target.getStage().getPointerPosition()
    const start = drawingStartPoint.value
    
    if (start) {
      // Apply grid snapping to the current mouse position
      let snappedPos = { x: pos.x, y: pos.y }
      if (snapToGrid.value) {
        snappedPos.x = Math.round(pos.x / gridSize.value) * gridSize.value
        snappedPos.y = Math.round(pos.y / gridSize.value) * gridSize.value
      }
      
      const width = snappedPos.x - start.x
      const height = snappedPos.y - start.y
      
      switch (currentTool.value) {
        case 'rect':
          let rectX = width > 0 ? start.x : snappedPos.x
          let rectY = height > 0 ? start.y : snappedPos.y
          let rectWidth = Math.abs(width)
          let rectHeight = Math.abs(height)
          
          if (snapToGrid.value) {
            rectX = Math.round(rectX / gridSize.value) * gridSize.value
            rectY = Math.round(rectY / gridSize.value) * gridSize.value
            rectWidth = Math.round(rectWidth / gridSize.value) * gridSize.value
            rectHeight = Math.round(rectHeight / gridSize.value) * gridSize.value
            rectWidth = Math.max(rectWidth, gridSize.value)
            rectHeight = Math.max(rectHeight, gridSize.value)
          }
          
          // Snap to existing elements if enabled
          if (snapToElements.value) {
            const snapped = snapPreviewToElements('rect', {
              x: rectX,
              y: rectY,
              width: rectWidth,
              height: rectHeight
            })
            rectX = snapped.x
            rectY = snapped.y
            rectWidth = snapped.width
            rectHeight = snapped.height
          }
          
          previewShape.value.attrs.x = rectX
          previewShape.value.attrs.y = rectY
          previewShape.value.attrs.width = rectWidth
          previewShape.value.attrs.height = rectHeight
          break
          
        case 'ellipse':
          let centerX = start.x + width / 2
          let centerY = start.y + height / 2
          let radiusX = Math.abs(width) / 2
          let radiusY = Math.abs(height) / 2
          
          if (snapToGrid.value) {
            centerX = Math.round(centerX / gridSize.value) * gridSize.value
            centerY = Math.round(centerY / gridSize.value) * gridSize.value
            radiusX = Math.round(radiusX / gridSize.value) * gridSize.value
            radiusY = Math.round(radiusY / gridSize.value) * gridSize.value
            radiusX = Math.max(radiusX, gridSize.value / 2)
            radiusY = Math.max(radiusY, gridSize.value / 2)
          }
          
          if (snapToElements.value) {
            const snapped = snapPreviewToElements('ellipse', {
              x: centerX,
              y: centerY,
              radiusX,
              radiusY
            })
            centerX = snapped.x
            centerY = snapped.y
            radiusX = snapped.radiusX
            radiusY = snapped.radiusY
          }
          
          previewShape.value.attrs.x = centerX
          previewShape.value.attrs.y = centerY
          previewShape.value.attrs.radiusX = radiusX
          previewShape.value.attrs.radiusY = radiusY
          break
          
        case 'triangle':
          let triCenterX = start.x + width / 2
          let triCenterY = start.y + height / 2
          let radius = Math.sqrt(width * width + height * height) / 2
          
          if (snapToGrid.value) {
            triCenterX = Math.round(triCenterX / gridSize.value) * gridSize.value
            triCenterY = Math.round(triCenterY / gridSize.value) * gridSize.value
            radius = Math.round(radius / gridSize.value) * gridSize.value
            radius = Math.max(radius, gridSize.value / 2)
          }
          
          if (snapToElements.value) {
            const snapped = snapPreviewToElements('triangle', {
              x: triCenterX,
              y: triCenterY,
              radius
            })
            triCenterX = snapped.x
            triCenterY = snapped.y
            radius = snapped.radius
          }
          
          previewShape.value.attrs.x = triCenterX
          previewShape.value.attrs.y = triCenterY
          previewShape.value.attrs.radius = radius
          break
      }
    }
  }
}

// Helper function to snap preview to existing elements
const snapPreviewToElements = (type, preview) => {
  let snapped = { ...preview }
  const threshold = snapThreshold.value
  
  const allElements = [
    ...rectElements.value,
    ...ellipseElements.value,
    ...triangleElements.value,
    ...textElements.value
  ]
  
  allElements.forEach(element => {
    const bounds = getElementBounds(element)
    
    // Snap position to element edges
    if (type === 'rect') {
      // Snap left edge
      const distLeft = Math.abs(preview.x - bounds.left)
      if (distLeft < threshold) {
        snapped.x = bounds.left
      }
      
      // Snap right edge
      const distRight = Math.abs(preview.x + preview.width - bounds.right)
      if (distRight < threshold) {
        snapped.x = bounds.right - preview.width
      }
      
      // Snap top edge
      const distTop = Math.abs(preview.y - bounds.top)
      if (distTop < threshold) {
        snapped.y = bounds.top
      }
      
      // Snap bottom edge
      const distBottom = Math.abs(preview.y + preview.height - bounds.bottom)
      if (distBottom < threshold) {
        snapped.y = bounds.bottom - preview.height
      }
      
      // Snap to match dimensions
      const widthDist = Math.abs(preview.width - (bounds.right - bounds.left))
      if (widthDist < threshold) {
        snapped.width = bounds.right - bounds.left
      }
      
      const heightDist = Math.abs(preview.height - (bounds.bottom - bounds.top))
      if (heightDist < threshold) {
        snapped.height = bounds.bottom - bounds.top
      }
    } else if (type === 'ellipse' || type === 'triangle') {
      // For centered shapes, snap center to element centers/edges
      const distCenterX = Math.abs(preview.x - bounds.centerX)
      if (distCenterX < threshold) {
        snapped.x = bounds.centerX
      }
      
      const distCenterY = Math.abs(preview.y - bounds.centerY)
      if (distCenterY < threshold) {
        snapped.y = bounds.centerY
      }
    }
  })
  
  return snapped
}
const onStageMouseUp = (e) => {
  if (isDrawing.value && currentTool.value !== 'select' && currentTool.value !== 'text') {
    const pos = e.target.getStage().getPointerPosition()
    const start = drawingStartPoint.value
    
    if (start) {
      const width = Math.abs(pos.x - start.x)
      const height = Math.abs(pos.y - start.y)
      const minSize = 10
      
      if (width > minSize && height > minSize) {
        const x = Math.min(start.x, pos.x)
        const y = Math.min(start.y, pos.y)
        addShapeWithSize(currentTool.value, x, y, width, height)
      } else {
        addShape(currentTool.value, start.x, start.y)
      }
    }
  }
  
  isDrawing.value = false
  drawingStartPoint.value = null
  previewShape.value = null
  snapGuides.value = []
}

// Shape event handlers
const onDragStart = (e) => {
  // Store original position if needed
}

const onDragMove = (e) => {
  // Position is already snapped via dragBoundFunc
  // Update guides if needed
  const shape = e.target
  const pos = shape.position()
  
  if (selectedObject.value && selectedObject.value.id() === shape.id()) {
    // Get the element data
    const element = findElementById(shape.id())
    if (element) {
      const snapped = getSnappedPosition(pos, element)
      // Don't actually move here as dragBoundFunc handles it
    }
  }
}

const onDragEnd = (e) => {
  updateElementFromKonva(e.target)
  snapGuides.value = []
}

const onTransformStart = (e) => {
  // Store original size if needed
}

const onTransform = (e) => {
  const shape = e.target
  
  if (snapToGrid.value || snapToElements.value) {
    const scaleX = shape.scaleX()
    const scaleY = shape.scaleY()
    
    // Get the element data
    const element = findElementById(shape.id())
    if (!element) return
    
    if (shape.className === 'Rect') {
      // Calculate new dimensions
      let newWidth = shape.width() * scaleX
      let newHeight = shape.height() * scaleY
      
      // Snap to grid if enabled
      if (snapToGrid.value) {
        newWidth = Math.round(newWidth / gridSize.value) * gridSize.value
        newHeight = Math.round(newHeight / gridSize.value) * gridSize.value
        
        // Ensure minimum size
        newWidth = Math.max(newWidth, gridSize.value)
        newHeight = Math.max(newHeight, gridSize.value)
      }
      
      // Snap to other elements if enabled
      if (snapToElements.value) {
        const snapped = snapDimensionsToElements(newWidth, newHeight, shape.position(), element)
        newWidth = snapped.width
        newHeight = snapped.height
      }
      
      shape.width(newWidth)
      shape.height(newHeight)
      shape.scaleX(1)
      shape.scaleY(1)
      
      // Snap position
      let pos = shape.position()
      if (snapToGrid.value) {
        pos = {
          x: Math.round(pos.x / gridSize.value) * gridSize.value,
          y: Math.round(pos.y / gridSize.value) * gridSize.value
        }
      }
      shape.position(pos)
      
    } else if (shape.className === 'Ellipse') {
      let newRadiusX = shape.radiusX() * scaleX
      let newRadiusY = shape.radiusY() * scaleY
      
      if (snapToGrid.value) {
        newRadiusX = Math.round(newRadiusX / gridSize.value) * gridSize.value
        newRadiusY = Math.round(newRadiusY / gridSize.value) * gridSize.value
        newRadiusX = Math.max(newRadiusX, gridSize.value / 2)
        newRadiusY = Math.max(newRadiusY, gridSize.value / 2)
      }
      
      shape.radiusX(newRadiusX)
      shape.radiusY(newRadiusY)
      shape.scaleX(1)
      shape.scaleY(1)
      
      let pos = shape.position()
      if (snapToGrid.value) {
        pos = {
          x: Math.round(pos.x / gridSize.value) * gridSize.value,
          y: Math.round(pos.y / gridSize.value) * gridSize.value
        }
      }
      shape.position(pos)
      
    } else if (shape.className === 'RegularPolygon') {
      let newRadius = shape.radius() * scaleX
      
      if (snapToGrid.value) {
        newRadius = Math.round(newRadius / gridSize.value) * gridSize.value
        newRadius = Math.max(newRadius, gridSize.value / 2)
      }
      
      shape.radius(newRadius)
      shape.scaleX(1)
      shape.scaleY(1)
      
      let pos = shape.position()
      if (snapToGrid.value) {
        pos = {
          x: Math.round(pos.x / gridSize.value) * gridSize.value,
          y: Math.round(pos.y / gridSize.value) * gridSize.value
        }
      }
      shape.position(pos)
    }
    
    // Update the element in the reactive array
    updateElementFromKonva(shape)
  }
}

// Helper function to snap dimensions to other elements
const snapDimensionsToElements = (width, height, pos, currentElement) => {
  let snappedWidth = width
  let snappedHeight = height
  const threshold = snapThreshold.value
  
  const allElements = [
    ...rectElements.value,
    ...ellipseElements.value,
    ...triangleElements.value,
    ...textElements.value
  ].filter(el => el.attrs.id !== currentElement.attrs.id)
  
  allElements.forEach(element => {
    const bounds = getElementBounds(element)
    
    // Check if width can snap to match other element's width
    const widthDist = Math.abs(width - (bounds.right - bounds.left))
    if (widthDist < threshold) {
      snappedWidth = bounds.right - bounds.left
    }
    
    // Check if height can snap to match other element's height
    const heightDist = Math.abs(height - (bounds.bottom - bounds.top))
    if (heightDist < threshold) {
      snappedHeight = bounds.bottom - bounds.top
    }
  })
  
  return { width: snappedWidth, height: snappedHeight }
}
const onTransformEnd = (e) => {
  updateElementFromKonva(e.target)
}

const onShapeClick = (e) => {
  selectedObject.value = e.target
}

const onTextDoubleClick = (e) => {
  const textNode = e.target
  const stage = textNode.getStage()
  
  const textarea = document.createElement('textarea')
  document.body.appendChild(textarea)
  
  textarea.value = textNode.text()
  textarea.style.position = 'absolute'
  textarea.style.top = stage.container().getBoundingClientRect().top + textNode.absolutePosition().y + 'px'
  textarea.style.left = stage.container().getBoundingClientRect().left + textNode.absolutePosition().x + 'px'
  textarea.style.width = textNode.width() - textNode.padding() * 2 + 'px'
  textarea.style.height = textNode.height() - textNode.padding() * 2 + 5 + 'px'
  textarea.style.fontSize = textNode.fontSize() + 'px'
  textarea.style.border = 'none'
  textarea.style.padding = '0px'
  textarea.style.margin = '0px'
  textarea.style.overflow = 'hidden'
  textarea.style.background = 'none'
  textarea.style.outline = 'none'
  textarea.style.resize = 'none'
  textarea.style.transform = 'translate(-50%, -50%)'
  textarea.style.textAlign = textNode.align()
  textarea.style.color = textNode.fill()
  
  textarea.focus()
  
  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      textNode.text(textarea.value)
      updateElementFromKonva(textNode)
      document.body.removeChild(textarea)
    }
  })
  
  textarea.addEventListener('blur', () => {
    textNode.text(textarea.value)
    updateElementFromKonva(textNode)
    document.body.removeChild(textarea)
  })
}

// Helper functions
const findElementById = (id) => {
  const allElements = [
    ...rectElements.value,
    ...ellipseElements.value,
    ...triangleElements.value,
    ...textElements.value
  ]
  return allElements.find(el => el.attrs.id === id)
}

const snapValueToGrid = (value) => {
  if (!snapToGrid.value) return value
  return Math.round(value / gridSize.value) * gridSize.value
}

// Update element in reactive array
const updateElementFromKonva = (konvaNode) => {
  const id = konvaNode.id()
  const attrs = konvaNode.attrs
  
  const rectIndex = rectElements.value.findIndex(el => el.attrs.id === id)
  if (rectIndex !== -1) {
    rectElements.value[rectIndex].attrs = { ...attrs }
    return
  }
  
  const ellipseIndex = ellipseElements.value.findIndex(el => el.attrs.id === id)
  if (ellipseIndex !== -1) {
    ellipseElements.value[ellipseIndex].attrs = { ...attrs }
    return
  }
  
  const triangleIndex = triangleElements.value.findIndex(el => el.attrs.id === id)
  if (triangleIndex !== -1) {
    triangleElements.value[triangleIndex].attrs = { ...attrs }
    return
  }
  
  const textIndex = textElements.value.findIndex(el => el.attrs.id === id)
  if (textIndex !== -1) {
    textElements.value[textIndex].attrs = { ...attrs }
    return
  }
}

// Transform controls
const updateTransformControls = () => {
  if (transformer.value && selectedObject.value) {
    transformer.value.keepRatio(lockAspectRatio.value)
  }
}

const rotateSelected = (degrees) => {
  if (selectedObject.value) {
    const currentRotation = selectedObject.value.rotation() || 0
    selectedObject.value.rotation(currentRotation + degrees)
    updateElementFromKonva(selectedObject.value)
  }
}

const flipSelected = (axis) => {
  if (selectedObject.value) {
    const scaleX = selectedObject.value.scaleX() || 1
    const scaleY = selectedObject.value.scaleY() || 1
    
    if (axis === 'x') {
      selectedObject.value.scaleX(-scaleX)
    } else {
      selectedObject.value.scaleY(-scaleY)
    }
    
    updateElementFromKonva(selectedObject.value)
  }
}

// Update element properties
const updateFillColor = () => {
  if (selectedObject.value) {
    selectedObject.value.fill(selectedObject.value.attrs.fill)
    updateElementFromKonva(selectedObject.value)
  }
}

const updateStroke = () => {
  if (selectedObject.value) {
    selectedObject.value.stroke(selectedObject.value.attrs.stroke)
    selectedObject.value.strokeWidth(selectedObject.value.attrs.strokeWidth)
    updateElementFromKonva(selectedObject.value)
  }
}

const updateFontSize = () => {
  if (selectedObject.value && selectedObject.value.className === 'Text') {
    selectedObject.value.fontSize(parseInt(selectedObject.value.attrs.fontSize))
    updateElementFromKonva(selectedObject.value)
  }
}

const updateText = () => {
  if (selectedObject.value && selectedObject.value.className === 'Text') {
    selectedObject.value.text(selectedObject.value.attrs.text)
    updateElementFromKonva(selectedObject.value)
  }
}

const updatePosition = () => {
  if (selectedObject.value) {
    selectedObject.value.x(selectedObject.value.attrs.x)
    selectedObject.value.y(selectedObject.value.attrs.y)
    updateElementFromKonva(selectedObject.value)
  }
}

const updateSize = () => {
  if (selectedObject.value) {
    const attrs = selectedObject.value.attrs
    
    if (selectedObject.value.className === 'Rect') {
      selectedObject.value.width(attrs.width)
      selectedObject.value.height(attrs.height)
    } else if (selectedObject.value.className === 'Ellipse') {
      selectedObject.value.radiusX(attrs.radiusX)
      selectedObject.value.radiusY(attrs.radiusY)
    } else if (selectedObject.value.className === 'RegularPolygon') {
      selectedObject.value.radius(attrs.radius)
    }
    
    updateElementFromKonva(selectedObject.value)
  }
}

const updateRotation = () => {
  if (selectedObject.value) {
    selectedObject.value.rotation(selectedObject.value.attrs.rotation)
    updateElementFromKonva(selectedObject.value)
  }
}

const updateElementId = () => {
  if (selectedObject.value) {
    selectedObject.value.id(selectedObject.value.attrs.id)
    updateElementFromKonva(selectedObject.value)
  }
}

// Delete selected object
const deleteSelected = () => {
  if (!selectedObject.value) return
  
  const id = selectedObject.value.id()
  
  rectElements.value = rectElements.value.filter(el => el.attrs.id !== id)
  ellipseElements.value = ellipseElements.value.filter(el => el.attrs.id !== id)
  triangleElements.value = triangleElements.value.filter(el => el.attrs.id !== id)
  textElements.value = textElements.value.filter(el => el.attrs.id !== id)
  
  selectedObject.value = null
}

// Template management
const createNewTemplate = () => {
  rectElements.value = []
  ellipseElements.value = []
  triangleElements.value = []
  textElements.value = []
  
  stageWidth.value = MTG_DIMENSIONS.width
  stageHeight.value = MTG_DIMENSIONS.height
  padding.value = MTG_DIMENSIONS.padding
  
  selectedObject.value = null
}

const loadTemplate = (template) => {
  rectElements.value = []
  ellipseElements.value = []
  triangleElements.value = []
  textElements.value = []
  
  stageWidth.value = template.dimensions.width
  stageHeight.value = template.dimensions.height
  padding.value = template.dimensions.padding
  
  template.elements.forEach(element => {
    switch (element.type) {
      case 'rect':
        rectElements.value.push({
          attrs: {
            ...element,
            draggable: true,
            name: 'shape'
          },
          className: 'Rect'
        })
        break
      case 'ellipse':
        ellipseElements.value.push({
          attrs: {
            ...element,
            draggable: true,
            name: 'shape'
          },
          className: 'Ellipse'
        })
        break
      case 'triangle':
        triangleElements.value.push({
          attrs: {
            ...element,
            sides: 3,
            draggable: true,
            name: 'shape'
          },
          className: 'RegularPolygon'
        })
        break
      case 'text':
        textElements.value.push({
          attrs: {
            ...element,
            draggable: true,
            name: 'shape'
          },
          className: 'Text'
        })
        break
    }
  })
  
  showTemplateSelector.value = false
  selectedObject.value = null
}

const saveTemplate = () => {
  const templateName = prompt('Enter template name:')
  if (templateName) {
    const elements = [
      ...rectElements.value.map(el => ({ ...el.attrs, type: 'rect' })),
      ...ellipseElements.value.map(el => ({ ...el.attrs, type: 'ellipse' })),
      ...triangleElements.value.map(el => ({ ...el.attrs, type: 'triangle' })),
      ...textElements.value.map(el => ({ ...el.attrs, type: 'text' }))
    ]
    
    savedTemplates.value.push({
      name: templateName,
      dimensions: {
        width: stageWidth.value,
        height: stageHeight.value,
        padding: padding.value
      },
      elements
    })
  }
}


// Handle figure selection from list
const handleSelectFigure = (figureId) => {
  if (!figureId) {
    selectedObject.value = null
    return
  }
  
  const stage = stage.value?.getNode()
  if (!stage) return
  
  const shape = stage.findOne(`#${figureId}`)
  if (shape) {
    selectedObject.value = shape
  }
}

// Handle figure updates (visibility, lock)
const handleUpdateFigure = ({ id, attrs }) => {
  const stage = stage.value?.getNode()
  if (!stage) return
  
  const shape = stage.findOne(`#${id}`)
  if (shape) {
    // Update the attributes
    Object.entries(attrs).forEach(([key, value]) => {
      if (key === 'visible') {
        shape.visible(value)
      } else if (key === 'draggable') {
        shape.draggable(value)
      }
    })
    
    // Update in the reactive arrays
    updateElementFromKonva(shape)
  }
}

// Handle figure deletion
const handleDeleteFigure = (figureId) => {
  rectElements.value = rectElements.value.filter(el => el.attrs.id !== figureId)
  ellipseElements.value = ellipseElements.value.filter(el => el.attrs.id !== figureId)
  triangleElements.value = triangleElements.value.filter(el => el.attrs.id !== figureId)
  textElements.value = textElements.value.filter(el => el.attrs.id !== figureId)
  
  if (selectedObject.value && selectedObject.value.id() === figureId) {
    selectedObject.value = null
  }
}

// Handle zoom to figure (optional)
const handleZoomToFigure = (figureId) => {
  const stage = stage.value?.getNode()
  if (!stage) return
  
  const shape = stage.findOne(`#${figureId}`)
  if (shape) {
    // Calculate position to center the view on the figure
    const pos = shape.position()
    // You could implement zoom/pan logic here
    console.log('Zoom to figure:', figureId, pos)
  }
}

// Export to JSON
const exportToJson = () => {
  const elements = [
    ...rectElements.value.map(el => ({ ...el.attrs, type: 'rect' })),
    ...ellipseElements.value.map(el => ({ ...el.attrs, type: 'ellipse' })),
    ...triangleElements.value.map(el => ({ ...el.attrs, type: 'triangle' })),
    ...textElements.value.map(el => ({ ...el.attrs, type: 'text' }))
  ]
  
  const output = {
    dimensions: {
      width: stageWidth.value,
      height: stageHeight.value,
      padding: padding.value
    },
    elements
  }
  
  jsonOutput.value = JSON.stringify(output, null, 2)
}

// Import from JSON
const importFromJson = () => {
  try {
    const data = JSON.parse(jsonOutput.value)
    
    stageWidth.value = data.dimensions.width
    stageHeight.value = data.dimensions.height
    padding.value = data.dimensions.padding
    
    rectElements.value = []
    ellipseElements.value = []
    triangleElements.value = []
    textElements.value = []
    
    data.elements.forEach(element => {
      switch (element.type) {
        case 'rect':
          rectElements.value.push({
            attrs: {
              ...element,
              draggable: true,
              name: 'shape'
            },
            className: 'Rect'
          })
          break
        case 'ellipse':
          ellipseElements.value.push({
            attrs: {
              ...element,
              draggable: true,
              name: 'shape'
            },
            className: 'Ellipse'
          })
          break
        case 'triangle':
          triangleElements.value.push({
            attrs: {
              ...element,
              sides: 3,
              draggable: true,
              name: 'shape'
            },
            className: 'RegularPolygon'
          })
          break
        case 'text':
          textElements.value.push({
            attrs: {
              ...element,
              draggable: true,
              name: 'shape'
            },
            className: 'Text'
          })
          break
      }
    })
    
    selectedObject.value = null
  } catch (e) {
    alert('Invalid JSON format')
  }
}

// Watch for grid changes
watch([showGrid, gridSize], () => {
  // Grid will update via computed property
})
</script>

<style scoped>
.card-template-editor {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.controls-panel {
  width: 340px;
  background: #101010;
  padding: 20px;
  overflow-y: auto;
  display: grid;
  gap: 10px;
  border-right: 1px solid #ccc;
}

.canvasWrapper {
  background: #aaa;
  padding: 2rem;
  overflow: auto;
  width: 100%;
}

.canvas-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;

}

.canvas-container > div {
  background: #f0f0f0;
}

.control-group {
  padding: 10px;
  background: #1e1e1e;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.control-group h3 {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: #333;
}

.dimension-inputs {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dimension-inputs label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
}

.dimension-inputs input {
  width: 100px;
  padding: 4px;
  border: 1px solid #ccc;
  border-radius: 3px;
}

.tool-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-bottom: 10px;
}

.btn {
  padding: 6px 12px;
  border: 1px solid #ccc;
  border-radius: 3px;
  background: black;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.btn:hover {
  background: #e0e0e0;
}

.btn.active {
  background: #007bff;
  color: white;
  border-color: #0056b3;
}

.btn.delete {
  background: #dc3545;
  color: white;
  border-color: #bd2130;
  margin-top: 10px;
}

.shape-properties {
  margin-top: 10px;
  padding: 10px;
  border-radius: 3px;
}

.shape-properties h4 {
  margin: 0 0 10px 0;
  font-size: 12px;
  color: #666;
}

.shape-properties label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 12px;
}

.shape-properties input[type="text"],
.shape-properties input[type="number"] {
  width: 120px;
  padding: 4px;
  border: 1px solid #ccc;
  border-radius: 3px;
}

.shape-properties input[type="color"] {
  width: 40px;
  height: 30px;
  padding: 2px;
  border: 1px solid #ccc;
  border-radius: 3px;
}

.grid-controls label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 12px;
}

.grid-controls input[type="checkbox"] {
  margin-right: 5px;
}

.grid-controls input[type="number"] {
  width: 80px;
  padding: 4px;
  border: 1px solid #ccc;
  border-radius: 3px;
}

.json-output {
  width: 100%;
  margin-top: 10px;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 3px;
  font-family: monospace;
  font-size: 11px;
  resize: vertical;
}

.template-buttons {
  display: flex;
  gap: 5px;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 20px;
  border-radius: 4px;
  min-width: 300px;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
}

.template-list {
  margin: 15px 0;
  max-height: 300px;
  overflow-y: auto;
}

.template-item {
  padding: 10px;
  border: 1px solid #ccc;
  margin-bottom: 5px;
  cursor: pointer;
  border-radius: 3px;
  transition: background 0.2s;
}

.template-item:hover {
  background: #f0f0f0;
}


</style>