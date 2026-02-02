<template>
  <svg 
    class="absolute top-0 left-0 w-full h-full pointer-events-none z-10"
    :style="{ overflow: 'visible' }"
  >
    <!-- Arrows -->
    <g 
      v-for="arrow in arrows" 
      :key="arrow.id"
      class="arrow-group"
    >
      <path
        :d="calculateArrowPath(arrow)"
        fill="none"
        stroke="#3b82f6"
        stroke-width="2"
        marker-end="url(#arrowhead)"
      />
      
      <!-- Arrow control point (for debugging/editing) -->
      <circle
        v-if="arrow.editable"
        :cx="arrow.controlX"
        :cy="arrow.controlY"
        r="4"
        fill="#ef4444"
        @mousedown="startDragging(arrow, $event)"
        class="cursor-move pointer-events-auto"
      />
    </g>
    
    <!-- Arrowhead marker definition -->
    <defs>
      <marker
        id="arrowhead"
        markerWidth="10"
        markerHeight="7"
        refX="9"
        refY="3.5"
        orient="auto"
      >
        <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" />
      </marker>
    </defs>
  </svg>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  arrows: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['arrow-updated', 'arrow-removed'])

const draggingArrow = ref(null)
const dragStart = ref({ x: 0, y: 0 })

const calculateArrowPath = (arrow) => {
  const startX = arrow.from.x + arrow.from.width / 2
  const startY = arrow.from.y + arrow.from.height / 2
  const endX = arrow.to.x + arrow.to.width / 2
  const endY = arrow.to.y + arrow.to.height / 2
  
  // Calculate control points for curved arrow
  const controlX = arrow.controlX || (startX + endX) / 2
  const controlY = arrow.controlY || (startY + endY) / 2 - 50
  
  return `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`
}

const startDragging = (arrow, event) => {
  draggingArrow.value = arrow
  dragStart.value = {
    x: event.clientX,
    y: event.clientY,
    controlX: arrow.controlX,
    controlY: arrow.controlY
  }
  
  document.addEventListener('mousemove', handleDrag)
  document.addEventListener('mouseup', stopDragging)
}

const handleDrag = (event) => {
  if (!draggingArrow.value) return
  
  const dx = event.clientX - dragStart.value.x
  const dy = event.clientY - dragStart.value.y
  
  const updatedArrow = {
    ...draggingArrow.value,
    controlX: dragStart.value.controlX + dx,
    controlY: dragStart.value.controlY + dy
  }
  
  emit('arrow-updated', updatedArrow)
}

const stopDragging = () => {
  draggingArrow.value = null
  document.removeEventListener('mousemove', handleDrag)
  document.removeEventListener('mouseup', stopDragging)
}
</script>