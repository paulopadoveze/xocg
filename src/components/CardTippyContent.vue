<template>
  <div ref="triggerRef" @mouseenter="show" @mouseleave="hide">
    <slot />
  </div>
  <Teleport to="body">
    <div 
      v-if="isVisible" 
      ref="tooltipRef"
      class="tippy-box"
      :class="[`tippy-box--${placement}`, themeClass]"
      :style="tooltipStyles"
    >
      <div class="tippy-content">
        card
      </div>
      <div class="tippy-arrow" :style="arrowStyles"></div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import CardTippyContent from './CardTippyContent.vue'

const props = defineProps({
  card: {
    type: Object,
    required: true
  },
  placement: {
    type: String,
    default: 'top'
  },
  delay: {
    type: Number,
    default: 300
  },
  offset: {
    type: Array,
    default: () => [0, 10]
  }
})

const isVisible = ref(false)
const triggerRef = ref(null)
const tooltipRef = ref(null)
let timeoutId = null

const show = () => {
  timeoutId = setTimeout(() => {
    isVisible.value = true
    updatePosition()
  }, props.delay)
}

const hide = () => {
  clearTimeout(timeoutId)
  isVisible.value = false
}

const tooltipStyles = ref({})
const arrowStyles = ref({})

const updatePosition = () => {
  if (!triggerRef.value || !tooltipRef.value) return
  
  const triggerRect = triggerRef.value.getBoundingClientRect()
  const tooltipRect = tooltipRef.value.getBoundingClientRect()
  
  let top = 0
  let left = 0
  
  switch (props.placement) {
    case 'top':
      top = triggerRect.top - tooltipRect.height - props.offset[1]
      left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2) + props.offset[0]
      break
    case 'bottom':
      top = triggerRect.bottom + props.offset[1]
      left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2) + props.offset[0]
      break
    // Add other placements as needed
  }
  
  tooltipStyles.value = {
    top: `${top}px`,
    left: `${left}px`
  }
}

onMounted(() => {
  window.addEventListener('scroll', updatePosition, true)
  window.addEventListener('resize', updatePosition)
})

onUnmounted(() => {
  window.removeEventListener('scroll', updatePosition, true)
  window.removeEventListener('resize', updatePosition)
})
</script>

<style scoped>
.tippy-box {
  position: fixed;
  z-index: 1000;
  background: linear-gradient(145deg, #1a1a24 0%, #222233 100%);
  border: 2px solid var(--color-primary);
  border-radius: 12px;
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.8),
    0 0 0 1px rgba(255, 255, 255, 0.05);
  color: var(--color-text-primary);
}

.tippy-content {
  padding: 1rem;
}

.tippy-arrow {
  position: absolute;
  width: 0;
  height: 0;
  border: 10px solid transparent;
}

.tippy-box--top .tippy-arrow {
  bottom: -20px;
  left: calc(50% - 10px);
  border-top-color: var(--color-primary);
}

/* Add other arrow positions as needed */
</style>