<template>
  <div
    :class="[
      'card',
      {
        'card--rotated': card.rotated,
        'card--highlighted': card.highlighted,
        'card--selected': card.selected,
        'card--draggable': draggable,
        'card--interactive': true
      }
    ]"
    :draggable="draggable"
    @dragstart="handleDragStart"
    @dblclick="handleDoubleClick"
    @contextmenu="handleContextMenu"
    @mousedown="handleMouseDown"
    @mouseup="handleMouseUp"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    @focus="handleFocus"
    @blur="handleBlur"
    tabindex="0"
    :aria-label="`${card.name} - ${card.type} card`"
  >
    <!-- Card Content -->
    <div class="card__content">
      <div class="card__header">
        <h3 class="card__name">{{ card.name }}</h3>
        <div v-if="card.cost" class="card__cost">
          {{ card.cost }}⚡
        </div>
      </div>
      
      <div v-if="card.artwork" class="card__artwork">
        <!-- Card artwork placeholder -->
        <div class="card__artwork-placeholder"></div>
      </div>
      
      <div class="card__body">
        <div class="card__description">
          {{ card.description }}
        </div>
        
        <div v-if="card.power || card.health" class="card__stats">
          <span v-if="card.power" class="card__stat card__stat--power">
            ⚔️ {{ card.power }}
          </span>
          <span v-if="card.health" class="card__stat card__stat--health">
            ❤️ {{ card.health }}
          </span>
        </div>
      </div>
      
      <div class="card__footer">
        <div class="card__type">{{ card.type }}</div>
        <div v-if="card.rarity" class="card__rarity" :class="`card__rarity--${card.rarity}`">
          {{ card.rarity.charAt(0).toUpperCase() }}
        </div>
      </div>
    </div>
    
    <!-- Card Glow Effect -->
    <div class="card__glow" :class="{ 'card__glow--active': card.highlighted }"></div>
    
    <!-- Tooltip -->
    <div 
      v-if="showTooltip && !isDragging"
      class="card__tooltip"
      :class="{ 'card__tooltip--visible': showTooltip }"
    >
      <div class="card__tooltip-content">
        <h4 class="card__tooltip-title">{{ card.name }}</h4>
        <div class="card__tooltip-type">{{ card.type }}</div>
        <p class="card__tooltip-description">{{ card.description }}</p>
        
        <div v-if="card.effects" class="card__tooltip-effects">
          <div class="card__tooltip-effects-title">Effects:</div>
          <ul class="card__tooltip-effects-list">
            <li 
              v-for="(effect, index) in card.effects"
              :key="index"
              class="card__tooltip-effect"
            >
              • {{ effect }}
            </li>
          </ul>
        </div>
        
        <div class="card__tooltip-stats">
          <div v-if="card.cost" class="card__tooltip-stat">
            <span class="card__tooltip-stat-label">Cost:</span>
            <span class="card__tooltip-stat-value">{{ card.cost }}</span>
          </div>
          <div v-if="card.power" class="card__tooltip-stat">
            <span class="card__tooltip-stat-label">Power:</span>
            <span class="card__tooltip-stat-value">{{ card.power }}</span>
          </div>
          <div v-if="card.health" class="card__tooltip-stat">
            <span class="card__tooltip-stat-label">Health:</span>
            <span class="card__tooltip-stat-value">{{ card.health }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Drag Preview Overlay -->
    <div v-if="isDragging" class="card__drag-overlay">
      <div class="card__drag-icon">📤</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  card: {
    type: Object,
    required: true,
    default: () => ({
      name: 'Unknown Card',
      type: 'Normal',
      description: '',
      cost: 0,
      power: 0,
      health: 0,
      rarity: 'common',
      effects: [],
      rotated: false,
      highlighted: false,
      selected: false
    })
  },
  draggable: {
    type: Boolean,
    default: true
  },
  disableTooltip: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'drag-start',
  'double-click',
  'contextmenu',
  'mouse-down',
  'mouse-up',
  'mouse-enter',
  'mouse-leave',
  'focus',
  'blur'
])

const showTooltip = ref(false)
const isDragging = ref(false)
const tooltipTimeout = ref(null)

const cardRarityColor = computed(() => {
  const colors = {
    common: 'var(--color-text-muted)',
    uncommon: 'var(--color-success)',
    rare: 'var(--color-primary)',
    epic: 'var(--color-accent)',
    legendary: 'var(--color-warning)'
  }
  return colors[props.card.rarity] || colors.common
})

const handleDragStart = (event) => {
  isDragging.value = true
  // Set custom drag image
  if (event.dataTransfer) {
    const dragImage = new Image()
    dragImage.src = `data:image/svg+xml;base64,${btoa(`
      <svg width="100" height="150" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="150" rx="8" fill="#1a1a24" stroke="#8b5cf6" stroke-width="2"/>
        <text x="50" y="30" text-anchor="middle" fill="#f8fafc" font-size="12">${props.card.name}</text>
      </svg>
    `)}`
    event.dataTransfer.setDragImage(dragImage, 50, 75)
  }
  emit('drag-start', event)
}

const handleDoubleClick = (event) => {
  event.preventDefault()
  emit('double-click', event)
}

const handleContextMenu = (event) => {
  event.preventDefault()
  emit('contextmenu', event)
}

const handleMouseDown = (event) => {
  emit('mouse-down', event)
}

const handleMouseUp = (event) => {
  emit('mouse-up', event)
}

const handleMouseEnter = () => {
  if (!props.disableTooltip) {
    tooltipTimeout.value = setTimeout(() => {
      showTooltip.value = true
    }, 300)
  }
  emit('mouse-enter')
}

const handleMouseLeave = () => {
  if (tooltipTimeout.value) {
    clearTimeout(tooltipTimeout.value)
  }
  showTooltip.value = false
  emit('mouse-leave')
}

const handleFocus = () => {
  if (!props.disableTooltip) {
    showTooltip.value = true
  }
  emit('focus')
}

const handleBlur = () => {
  showTooltip.value = false
  emit('blur')
}
</script>

<style lang="scss" scoped>
.card {
  position: relative;
  width: 6rem;
  height: 9rem;
  background: linear-gradient(145deg, var(--color-card-bg) 0%, #222233 100%);
  border: 2px solid var(--color-card-border);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
  overflow: hidden;
  outline: none;
  
  &:hover {
    transform: translateY(-8px) scale(1.05);
    border-color: var(--color-primary);
    box-shadow: 
      0 10px 30px rgba(0, 0, 0, 0.5),
      0 0 0 2px var(--color-primary);
    
    .card__glow {
      opacity: 0.6;
    }
  }
  
  &:focus {
    border-color: var(--color-accent);
    box-shadow: 
      0 0 0 3px rgba(0, 217, 255, 0.3),
      0 10px 30px rgba(0, 0, 0, 0.5);
  }
  
  &:active {
    transform: translateY(-4px) scale(1.02);
    transition: transform 0.1s ease;
  }
  
  &--rotated {
    transform: rotate(90deg);
    
    &:hover {
      transform: rotate(90deg) translateY(-8px) scale(1.05);
    }
  }
  
  &--highlighted {
    animation: card-pulse 2s ease-in-out infinite;
    border-color: var(--color-warning);
    box-shadow: 
      0 0 20px rgba(255, 170, 0, 0.3),
      0 10px 30px rgba(0, 0, 0, 0.5);
  }
  
  &--selected {
    border-color: var(--color-success);
    box-shadow: 
      0 0 25px rgba(0, 255, 136, 0.4),
      0 10px 30px rgba(0, 0, 0, 0.5);
  }
  
  &--draggable {
    cursor: grab;
    
    &:active {
      cursor: grabbing;
    }
  }
  
  &--interactive {
    &:hover .card__tooltip {
      opacity: 1;
      visibility: visible;
      transform: translate(-50%, -10px);
    }
  }
  
  &__content {
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 0.75rem;
    position: relative;
    z-index: 2;
  }
  
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 0.5rem;
  }
  
  &__name {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--color-text-primary);
    margin: 0;
    line-height: 1.2;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
  
  &__cost {
    font-size: 0.6875rem;
    font-weight: 700;
    color: var(--color-warning);
    background: rgba(255, 170, 0, 0.1);
    padding: 0.125rem 0.375rem;
    border-radius: 12px;
    margin-left: 0.25rem;
    flex-shrink: 0;
  }
  
  &__artwork {
    height: 4rem;
    margin-bottom: 0.5rem;
    border-radius: 6px;
    overflow: hidden;
    background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(0, 217, 255, 0.1));
  }
  
  &__artwork-placeholder {
    width: 100%;
    height: 100%;
    background: radial-gradient(circle at center, 
      rgba(139, 92, 246, 0.2) 0%,
      rgba(0, 217, 255, 0.1) 50%,
      transparent 100%);
    border-radius: 6px;
  }
  
  &__body {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  
  &__description {
    font-size: 0.625rem;
    color: var(--color-text-secondary);
    line-height: 1.3;
    margin-bottom: 0.5rem;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
  }
  
  &__stats {
    display: flex;
    gap: 0.5rem;
    margin-top: auto;
  }
  
  &__stat {
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.125rem 0.375rem;
    border-radius: 4px;
    
    &--power {
      background: rgba(255, 56, 96, 0.1);
      color: var(--color-error);
    }
    
    &--health {
      background: rgba(0, 255, 136, 0.1);
      color: var(--color-success);
    }
  }
  
  &__footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 0.5rem;
    padding-top: 0.5rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  &__type {
    font-size: 0.5625rem;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  &__rarity {
    font-size: 0.5625rem;
    font-weight: 700;
    width: 1rem;
    height: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    border: 1px solid;
    
    &--common {
      color: var(--color-text-muted);
      border-color: var(--color-text-muted);
    }
    
    &--uncommon {
      color: var(--color-success);
      border-color: var(--color-success);
    }
    
    &--rare {
      color: var(--color-primary);
      border-color: var(--color-primary);
    }
    
    &--epic {
      color: var(--color-accent);
      border-color: var(--color-accent);
    }
    
    &--legendary {
      color: var(--color-warning);
      border-color: var(--color-warning);
    }
  }
  
  &__glow {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(
      circle at center,
      rgba(139, 92, 246, 0.1) 0%,
      transparent 70%
    );
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
    z-index: 1;
    
    &--active {
      opacity: 1;
      background: radial-gradient(
        circle at center,
        rgba(255, 170, 0, 0.3) 0%,
        transparent 70%
      );
      animation: glow-pulse 2s ease-in-out infinite;
    }
  }
  
  &__tooltip {
    position: absolute;
    bottom: calc(100% + 10px);
    left: 50%;
    transform: translateX(-50%) translateY(-20px);
    width: 18rem;
    background: var(--color-bg-secondary);
    border: 2px solid var(--color-primary);
    border-radius: 12px;
    box-shadow: 
      0 20px 60px rgba(0, 0, 0, 0.8),
      0 0 0 1px rgba(255, 255, 255, 0.05);
    padding: 1rem;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 1000;
    pointer-events: none;
    
    &::after {
      content: '';
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      border: 10px solid transparent;
      border-top-color: var(--color-primary);
    }
    
    &--visible {
      opacity: 1;
      visibility: visible;
      transform: translateX(-50%) translateY(0);
    }
  }
  
  &__tooltip-content {
    color: var(--color-text-primary);
  }
  
  &__tooltip-title {
    font-size: 1.125rem;
    font-weight: 700;
    margin: 0 0 0.5rem 0;
    color: var(--color-primary);
  }
  
  &__tooltip-type {
    font-size: 0.75rem;
    color: var(--color-accent);
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 0.75rem;
    font-weight: 600;
  }
  
  &__tooltip-description {
    font-size: 0.875rem;
    color: var(--color-text-secondary);
    line-height: 1.5;
    margin-bottom: 1rem;
  }
  
  &__tooltip-effects {
    margin-bottom: 1rem;
  }
  
  &__tooltip-effects-title {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-warning);
    margin-bottom: 0.5rem;
    text-transform: uppercase;
  }
  
  &__tooltip-effects-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  &__tooltip-effect {
    font-size: 0.75rem;
    color: var(--color-text-secondary);
    margin-bottom: 0.25rem;
    padding-left: 0.5rem;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  &__tooltip-stats {
    display: flex;
    gap: 1rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    padding-top: 0.75rem;
  }
  
  &__tooltip-stat {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  &__tooltip-stat-label {
    font-size: 0.6875rem;
    color: var(--color-text-muted);
    margin-bottom: 0.125rem;
  }
  
  &__tooltip-stat-value {
    font-size: 1rem;
    font-weight: 700;
    color: var(--color-text-primary);
  }
  
  &__drag-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(139, 92, 246, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: inherit;
    z-index: 100;
    
    .card__drag-icon {
      font-size: 2rem;
      opacity: 0.8;
    }
  }
}

// Animations
@keyframes card-pulse {
  0%, 100% {
    box-shadow: 
      0 0 20px rgba(255, 170, 0, 0.3),
      0 10px 30px rgba(0, 0, 0, 0.5);
  }
  50% {
    box-shadow: 
      0 0 40px rgba(255, 170, 0, 0.6),
      0 15px 40px rgba(0, 0, 0, 0.6);
  }
}

@keyframes glow-pulse {
  0%, 100% {
    opacity: 0.3;
  }
  50% {
    opacity: 0.6;
  }
}

// Responsive
@media (max-width: 768px) {
  .card {
    width: 5rem;
    height: 7.5rem;
    
    &:hover {
      transform: translateY(-4px) scale(1.03);
    }
    
    &__tooltip {
      width: 14rem;
      bottom: calc(100% + 8px);
    }
  }
}
</style>