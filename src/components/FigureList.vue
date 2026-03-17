<!-- FiguresList.vue -->
<template>
  <div class="figures-list-panel">
    <h3>Elements List ({{ totalElements }})</h3>
    
    <!-- Filter/Search -->
    <div class="figures-filter">
      <input 
        type="text" 
        v-model="figureFilter" 
        placeholder="Filter elements..."
        class="filter-input"
      >
      <select v-model="figureTypeFilter" class="filter-select">
        <option value="all">All Types</option>
        <option value="rect">Rectangles</option>
        <option value="ellipse">Ellipses</option>
        <option value="triangle">Triangles</option>
        <option value="text">Text</option>
      </select>
    </div>

    <!-- Figures List -->
    <div class="figures-list" ref="figuresListContainer">
      <div 
        v-for="figure in filteredFigures" 
        :key="figure.attrs.id"
        class="figure-item"
        :class="{
          'active': isSelected(figure),
          'type-rect': figure.className === 'Rect',
          'type-ellipse': figure.className === 'Ellipse',
          'type-triangle': figure.className === 'RegularPolygon',
          'type-text': figure.className === 'Text'
        }"
        @click="selectFigure(figure)"
        @dblclick="zoomToFigure(figure)"
      >
        <!-- Preview Icon -->
        <div class="figure-preview" :style="getPreviewStyle(figure)">
          <span v-if="figure.className === 'Rect'" class="preview-icon">□</span>
          <span v-else-if="figure.className === 'Ellipse'" class="preview-icon">○</span>
          <span v-else-if="figure.className === 'RegularPolygon'" class="preview-icon">△</span>
          <span v-else-if="figure.className === 'Text'" class="preview-icon">T</span>
        </div>

        <!-- Figure Info -->
        <div class="figure-info">
          <div class="figure-name">
            {{ getFigureName(figure) }}
            <span class="figure-id">({{ truncateId(figure.attrs.id) }})</span>
          </div>
          <div class="figure-details">
            <span class="figure-type">{{ getFigureType(figure) }}</span>
            <span class="figure-position">
              {{ Math.round(figure.attrs.x) }}, {{ Math.round(figure.attrs.y) }}
            </span>
          </div>
          <div class="figure-dimensions" v-if="figure.className !== 'Text'">
            <span v-if="figure.className === 'Rect'">
              {{ Math.round(figure.attrs.width) }} × {{ Math.round(figure.attrs.height) }}
            </span>
            <span v-else-if="figure.className === 'Ellipse'">
              r: {{ Math.round(figure.attrs.radiusX) }}, {{ Math.round(figure.attrs.radiusY) }}
            </span>
            <span v-else-if="figure.className === 'RegularPolygon'">
              r: {{ Math.round(figure.attrs.radius) }}
            </span>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="figure-actions">
          <button 
            class="action-btn visibility" 
            @click.stop="toggleVisibility(figure)"
            :title="figure.attrs.visible !== false ? 'Hide' : 'Show'"
          >
            {{ figure.attrs.visible !== false ? '👁️' : '👁️‍🗨️' }}
          </button>
          <button 
            class="action-btn lock" 
            @click.stop="toggleLock(figure)"
            :title="figure.attrs.draggable ? 'Lock' : 'Unlock'"
          >
            {{ figure.attrs.draggable ? '🔓' : '🔒' }}
          </button>
          <button 
            class="action-btn delete" 
            @click.stop="deleteFigure(figure)"
            title="Delete"
          >
            🗑️
          </button>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="filteredFigures.length === 0" class="figures-empty">
        <p>No elements found</p>
        <p class="empty-hint">Use drawing tools to add elements</p>
      </div>
    </div>

    <!-- Bulk Actions -->
    <div class="figures-bulk-actions" v-if="filteredFigures.length > 0">
      <button @click="selectAllFigures" class="btn small">Select All</button>
      <button @click="deselectAllFigures" class="btn small">Deselect All</button>
      <button @click="deleteAllFiltered" class="btn small delete">Clear Filtered</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  rectElements: {
    type: Array,
    required: true
  },
  ellipseElements: {
    type: Array,
    required: true
  },
  triangleElements: {
    type: Array,
    required: true
  },
  textElements: {
    type: Array,
    required: true
  },
  selectedId: {
    type: String,
    default: null
  },
  stage: {
    type: Object,
    default: null
  }
})

const emit = defineEmits([
  'select-figure',
  'update-figure',
  'delete-figure',
  'zoom-to-figure'
])

// Local state
const figureFilter = ref('')
const figureTypeFilter = ref('all')
const figuresListContainer = ref(null)

// Total elements count
const totalElements = computed(() => {
  return props.rectElements.length + 
         props.ellipseElements.length + 
         props.triangleElements.length + 
         props.textElements.length
})

// All figures combined
const allFigures = computed(() => {
  return [
    ...props.rectElements.map(el => ({ ...el, type: 'rect' })),
    ...props.ellipseElements.map(el => ({ ...el, type: 'ellipse' })),
    ...props.triangleElements.map(el => ({ ...el, type: 'triangle' })),
    ...props.textElements.map(el => ({ ...el, type: 'text' }))
  ].sort((a, b) => {
    // Sort by y position then x position
    if (a.attrs.y === b.attrs.y) {
      return a.attrs.x - b.attrs.x
    }
    return a.attrs.y - b.attrs.y
  })
})

// Filtered figures based on search and type filter
const filteredFigures = computed(() => {
  return allFigures.value.filter(figure => {
    // Type filter
    if (figureTypeFilter.value !== 'all') {
      if (figureTypeFilter.value === 'rect' && figure.className !== 'Rect') return false
      if (figureTypeFilter.value === 'ellipse' && figure.className !== 'Ellipse') return false
      if (figureTypeFilter.value === 'triangle' && figure.className !== 'RegularPolygon') return false
      if (figureTypeFilter.value === 'text' && figure.className !== 'Text') return false
    }
    
    // Text filter (search in id and text content)
    if (figureFilter.value) {
      const searchTerm = figureFilter.value.toLowerCase()
      const idMatch = figure.attrs.id.toLowerCase().includes(searchTerm)
      const textMatch = figure.attrs.text ? figure.attrs.text.toLowerCase().includes(searchTerm) : false
      const typeMatch = figure.className.toLowerCase().includes(searchTerm)
      return idMatch || textMatch || typeMatch
    }
    
    return true
  })
})

// Check if figure is selected
const isSelected = (figure) => {
  return props.selectedId === figure.attrs.id
}

// Helper functions
const getFigureName = (figure) => {
  if (figure.className === 'Text' && figure.attrs.text) {
    return `"${figure.attrs.text.substring(0, 15)}${figure.attrs.text.length > 15 ? '...' : ''}"`
  }
  return `${figure.className} ${figure.attrs.id.split('_')[1]?.substring(0, 4) || ''}`
}

const getFigureType = (figure) => {
  switch (figure.className) {
    case 'Rect': return 'Rectangle'
    case 'Ellipse': return 'Ellipse'
    case 'RegularPolygon': return 'Triangle'
    case 'Text': return 'Text'
    default: return 'Shape'
  }
}

const truncateId = (id) => {
  if (!id) return ''
  return id.substring(0, 6) + '...'
}

const getPreviewStyle = (figure) => {
  const style = {
    backgroundColor: figure.attrs.fill || '#ffffff',
    borderColor: figure.attrs.stroke || '#000000'
  }
  
  if (figure.attrs.visible === false) {
    style.opacity = '0.3'
  }
  
  return style
}

// Figure selection from list
const selectFigure = (figure) => {
  emit('select-figure', figure.attrs.id)
  
  // Scroll to make the figure visible if needed
  setTimeout(() => {
    if (figuresListContainer.value) {
      const activeElement = figuresListContainer.value.querySelector('.figure-item.active')
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
    }
  }, 100)
}

// Zoom to figure (double click)
const zoomToFigure = (figure) => {
  emit('zoom-to-figure', figure.attrs.id)
}

// Toggle visibility
const toggleVisibility = (figure) => {
  const newVisibility = figure.attrs.visible !== false ? false : true
  emit('update-figure', {
    id: figure.attrs.id,
    attrs: { visible: newVisibility }
  })
}

// Toggle lock (draggable)
const toggleLock = (figure) => {
  const newDraggable = figure.attrs.draggable !== false ? false : true
  emit('update-figure', {
    id: figure.attrs.id,
    attrs: { draggable: newDraggable }
  })
}

// Delete figure from list
const deleteFigure = (figure) => {
  if (confirm(`Delete ${getFigureName(figure)}?`)) {
    emit('delete-figure', figure.attrs.id)
  }
}

// Bulk actions
const selectAllFigures = () => {
  if (filteredFigures.value.length > 0) {
    emit('select-figure', filteredFigures.value[0].attrs.id)
  }
}

const deselectAllFigures = () => {
  emit('select-figure', null)
}

const deleteAllFiltered = () => {
  if (filteredFigures.value.length === 0) return
  
  const count = filteredFigures.value.length
  if (confirm(`Delete ${count} element${count > 1 ? 's' : ''}?`)) {
    const idsToDelete = filteredFigures.value.map(f => f.attrs.id)
    idsToDelete.forEach(id => {
      emit('delete-figure', id)
    })
  }
}

// Watch for selection changes to update the list highlight
watch(() => props.selectedId, () => {
  if (props.selectedId && figuresListContainer.value) {
    const activeElement = figuresListContainer.value.querySelector('.figure-item.active')
    if (activeElement) {
      activeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }
})
</script>

<style scoped>
.figures-list-panel {
  padding: 10px;
  background: #1e1e1e;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  max-height: 400px;
  min-height: 200px;
}

.figures-list-panel h3 {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: #fff;
}

.figures-filter {
  display: flex;
  gap: 5px;
  margin-bottom: 10px;
}

.filter-input {
  flex: 2;
  padding: 6px;
  border: 1px solid #444;
  border-radius: 3px;
  background: #2a2a2a;
  color: #fff;
  font-size: 12px;
}

.filter-select {
  flex: 1;
  padding: 6px;
  border: 1px solid #444;
  border-radius: 3px;
  background: #2a2a2a;
  color: #fff;
  font-size: 12px;
}

.figures-list {
  flex: 1;
  overflow-y: auto;
  max-height: 300px;
  border: 1px solid #333;
  border-radius: 3px;
  background: #1a1a1a;
}

.figure-item {
  display: flex;
  align-items: center;
  padding: 8px;
  border-bottom: 1px solid #333;
  cursor: pointer;
  transition: all 0.2s;
  background: #1e1e1e;
}

.figure-item:hover {
  background: #2a2a2a;
}

.figure-item.active {
  background: #2c3e50;
  border-left: 3px solid #3498db;
}

.figure-item.type-rect.active { border-left-color: #e74c3c; }
.figure-item.type-ellipse.active { border-left-color: #27ae60; }
.figure-item.type-triangle.active { border-left-color: #f39c12; }
.figure-item.type-text.active { border-left-color: #9b59b6; }

.figure-preview {
  width: 32px;
  height: 32px;
  border: 2px solid;
  border-radius: 3px;
  margin-right: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  background: white;
  flex-shrink: 0;
}

.preview-icon {
  font-size: 20px;
  line-height: 1;
}

.figure-info {
  flex: 1;
  min-width: 0;
  margin-right: 8px;
}

.figure-name {
  font-weight: bold;
  font-size: 12px;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.figure-id {
  font-size: 10px;
  color: #888;
  font-weight: normal;
}

.figure-details {
  display: flex;
  gap: 8px;
  font-size: 10px;
  color: #aaa;
  margin-top: 2px;
}

.figure-type {
  background: #333;
  padding: 1px 4px;
  border-radius: 2px;
}

.figure-dimensions {
  font-size: 10px;
  color: #888;
  margin-top: 2px;
}

.figure-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.action-btn {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 3px;
  background: transparent;
  color: #888;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  padding: 0;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #444;
  color: #fff;
}

.action-btn.delete:hover {
  background: #c0392b;
  color: white;
}

.figures-empty {
  padding: 20px;
  text-align: center;
  color: #666;
}

.figures-empty p {
  margin: 5px 0;
}

.empty-hint {
  font-size: 11px;
  color: #888;
}

.figures-bulk-actions {
  display: flex;
  gap: 5px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #333;
}

.btn {
  padding: 6px 12px;
  border: 1px solid #ccc;
  border-radius: 3px;
  background: black;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
  color: white;
}

.btn:hover {
  background: #e0e0e0;
  color: black;
}

.btn.small {
  padding: 4px 8px;
  font-size: 11px;
}

.btn.delete {
  background: #dc3545;
  color: white;
  border-color: #bd2130;
}

/* Scrollbar styling */
.figures-list::-webkit-scrollbar {
  width: 6px;
}

.figures-list::-webkit-scrollbar-track {
  background: #1a1a1a;
}

.figures-list::-webkit-scrollbar-thumb {
  background: #444;
  border-radius: 3px;
}

.figures-list::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>