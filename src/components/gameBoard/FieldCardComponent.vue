<template>
  <div
    :class="[
      'field-card',
      {
        'field-card--rotated': rotated,
        'field-card--highlighted': highlighted,
        'field-card--selected': selected,
        'field-card--tapped': fieldCard.isTapped,
        'field-card--stacked': isStacked,
        'field-card--base-card': isBaseCard,
        'field-card--can-be-targeted': canBeTargeted,
        'field-card--draggable': draggable,
        'field-card--interactive': interactive
      }
    ]"
    :style="cardStyles"
    :draggable="draggable && !fieldCard.isTapped"
    @dragstart="handleDragStart"
    @dblclick="handleDoubleClick"
    @contextmenu="handleContextMenu"
    @mousedown="handleMouseDown"
    @mouseup="handleMouseUp"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    @click="handleClick"
    tabindex="0"
    :aria-label="`${cardDetails.name} - ${fieldCard.isTapped ? 'Tapped' : 'Untapped'} ${cardDetails.type} card`"
  >
    <!-- Card Content -->
    <div class="field-card__content">
      <!-- Stack Indicator -->
      <div v-if="isStacked" class="field-card__stack-indicator">
        <div class="field-card__stack-icon">🔄</div>
        <div class="field-card__stack-count" v-if="stackedCards.length > 0">
          +{{ stackedCards.length }}
        </div>
      </div>
      
      <div class="field-card__header">
        <h3 class="field-card__name">{{ cardDetails.name }}</h3>
        <div class="field-card__position" v-if="showPosition">
          #{{ fieldCard.position + 1 }}
        </div>
      </div>
      
      <div class="field-card__artwork">
        <div class="field-card__artwork-placeholder"></div>
        <!-- Tap overlay -->
        <div v-if="fieldCard.isTapped" class="field-card__tapped-overlay">
          <div class="field-card__tapped-icon">⌛</div>
        </div>
      </div>
      
      <div class="field-card__body">
        <div class="field-card__description">
          {{ truncatedDescription }}
        </div>
        
        <div class="field-card__stats">
          <span v-if="cardDetails.power" class="field-card__stat field-card__stat--power">
            ⚔️ {{ cardDetails.power }}
          </span>
          <span v-if="cardDetails.health" class="field-card__stat field-card__stat--health">
            ❤️ {{ cardDetails.health }}
          </span>
        </div>
        
        <!-- Status Indicators -->
        <div class="field-card__status">
          <div v-if="fieldCard.isTapped" class="field-card__status-item field-card__status-item--tapped">
            TAPPED
          </div>
          <div v-if="isStacked" class="field-card__status-item field-card__status-item--stacked">
            STACKED
          </div>
          <div v-if="isBaseCard" class="field-card__status-item field-card__status-item--base">
            BASE
          </div>
        </div>
      </div>
      
      <div class="field-card__footer">
        <div class="field-card__type">{{ cardDetails.type }}</div>
        <div v-if="hasEffects" class="field-card__effects-indicator">
          {{ cardDetails.effects?.length || 0 }}⚡
        </div>
      </div>
    </div>
    
    <!-- Card Glow Effect -->
    <div class="field-card__glow" :class="{ 'field-card__glow--active': highlighted }"></div>
    
    <!-- Targeting Ring -->
    <div 
      v-if="showTargetingRing" 
      class="field-card__targeting-ring"
      :class="{
        'field-card__targeting-ring--friendly': targetingType === 'friendly',
        'field-card__targeting-ring--enemy': targetingType === 'enemy'
      }"
    ></div>
    
    <!-- Stack Connection Line (if stacked) -->
    <div 
      v-if="isStacked && baseCardPosition" 
      class="field-card__stack-connection"
      :style="connectionLineStyle"
    ></div>
    
    <!-- Tooltip -->
    <div 
      v-if="showTooltip && !isDragging"
      class="field-card__tooltip"
      :class="{ 'field-card__tooltip--visible': showTooltip }"
    >
      <div class="field-card__tooltip-content">
        <div class="field-card__tooltip-header">
          <h4 class="field-card__tooltip-title">{{ cardDetails.name }}</h4>
          <div class="field-card__tooltip-position" v-if="showPosition">
            Position: {{ fieldCard.position + 1 }}
          </div>
        </div>
        
        <div class="field-card__tooltip-status">
          <span v-if="fieldCard.isTapped" class="field-card__tooltip-status-tapped">⚡ TAPPED</span>
          <span v-else class="field-card__tooltip-status-untapped">✓ UNTAPPED</span>
          <span v-if="isStacked" class="field-card__tooltip-status-stacked">🔄 STACKED</span>
          <span v-if="isBaseCard" class="field-card__tooltip-status-base">🏁 BASE CARD</span>
        </div>
        
        <div class="field-card__tooltip-type">{{ cardDetails.type }}</div>
        <p class="field-card__tooltip-description">{{ cardDetails.description }}</p>
        
        <div v-if="hasEffects" class="field-card__tooltip-effects">
          <div class="field-card__tooltip-effects-title">Effects:</div>
          <ul class="field-card__tooltip-effects-list">
            <li 
              v-for="(effect, index) in cardDetails.effects"
              :key="index"
              class="field-card__tooltip-effect"
            >
              • {{ effect }}
            </li>
          </ul>
        </div>
        
        <div class="field-card__tooltip-stats">
          <div v-if="cardDetails.cost" class="field-card__tooltip-stat">
            <span class="field-card__tooltip-stat-label">Cost:</span>
            <span class="field-card__tooltip-stat-value">{{ cardDetails.cost }}</span>
          </div>
          <div v-if="cardDetails.power" class="field-card__tooltip-stat">
            <span class="field-card__tooltip-stat-label">Power:</span>
            <span class="field-card__tooltip-stat-value">{{ cardDetails.power }}</span>
          </div>
          <div v-if="cardDetails.health" class="field-card__tooltip-stat">
            <span class="field-card__tooltip-stat-label">Health:</span>
            <span class="field-card__tooltip-stat-value">{{ cardDetails.health }}</span>
          </div>
        </div>
        
        <!-- Stack Info -->
        <div v-if="isStacked" class="field-card__tooltip-stack-info">
          <div class="field-card__tooltip-stack-title">Stacked On:</div>
          <div class="field-card__tooltip-stack-card">
            {{ baseCardDetails?.name || 'Unknown' }}
          </div>
        </div>
        
        <div v-if="stackedCards.length > 0" class="field-card__tooltip-stack-info">
          <div class="field-card__tooltip-stack-title">Stacked Cards ({{ stackedCards.length }}):</div>
          <ul class="field-card__tooltip-stack-list">
            <li 
              v-for="(stackedCard, index) in stackedCards.slice(0, 3)"
              :key="index"
              class="field-card__tooltip-stack-item"
            >
              • {{ getCardDetails(stackedCard.cardId)?.name || `Card ${stackedCard.cardId}` }}
            </li>
            <li v-if="stackedCards.length > 3" class="field-card__tooltip-stack-more">
              ...and {{ stackedCards.length - 3 }} more
            </li>
          </ul>
        </div>
      </div>
    </div>
    
    <!-- Drag Preview Overlay -->
    <div v-if="isDragging" class="field-card__drag-overlay">
      <div class="field-card__drag-icon">📤</div>
      <div v-if="isStacked" class="field-card__drag-stack-warning">
        Moving stacked card
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  fieldCard: {
    type: Object,
    required: true,
    default: () => ({
      cardId: null,
      isTapped: false,
      position: 0,
      isStackedOn: null
    })
  },
  playerId: {
    type: String,
    required: true
  },
  allFieldCards: {
    type: Array,
    default: () => []
  },
  draggable: {
    type: Boolean,
    default: true
  },
  interactive: {
    type: Boolean,
    default: true
  },
  showPosition: {
    type: Boolean,
    default: true
  },
  rotated: {
    type: Boolean,
    default: false
  },
  highlighted: {
    type: Boolean,
    default: false
  },
  selected: {
    type: Boolean,
    default: false
  },
  canBeTargeted: {
    type: Boolean,
    default: false
  },
  targetingType: {
    type: String,
    default: '' // 'friendly', 'enemy', or ''
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
  'click',
  'focus',
  'blur',
  'tap',
  'untap',
  'stack',
  'unstack',
  'reposition'
])

// Inject the getCardDetails function from parent
const getCardDetails = inject('getCardDetails', () => ({}))
const currentPlayerId = inject('currentPlayerId', '')

// Local state
const showTooltip = ref(false)
const isDragging = ref(false)
const tooltipTimeout = ref(null)

// Computed properties
const cardDetails = computed(() => {
  return getCardDetails(props.fieldCard.cardId) || {
    id: props.fieldCard.cardId,
    name: `Card #${props.fieldCard.cardId}`,
    type: 'Unknown',
    description: 'Card details not found',
    cost: 0,
    power: 0,
    health: 0,
    rarity: 'common',
    effects: []
  }
})

const isStacked = computed(() => {
  return props.fieldCard.isStackedOn !== null
})

const isBaseCard = computed(() => {
  // Check if this card has other cards stacked on it
  return props.allFieldCards.some(card => 
    card.isStackedOn === props.fieldCard.cardId
  )
})

const baseCardDetails = computed(() => {
  if (!isStacked.value) return null
  return getCardDetails(props.fieldCard.isStackedOn)
})

const stackedCards = computed(() => {
  if (!isBaseCard.value) return []
  return props.allFieldCards.filter(card => 
    card.isStackedOn === props.fieldCard.cardId
  )
})

const hasEffects = computed(() => {
  return cardDetails.value.effects && cardDetails.value.effects.length > 0
})

const truncatedDescription = computed(() => {
  const desc = cardDetails.value.description || ''
  return desc.length > 40 ? desc.substring(0, 40) + '...' : desc
})

const showTargetingRing = computed(() => {
  return props.canBeTargeted && props.targetingType !== ''
})

const cardStyles = computed(() => {
  const styles = {}
  
  // Add rotation for tapped cards
  if (props.fieldCard.isTapped) {
    styles.transform = 'rotate(90deg)'
  }
  
  // Add stacking offset
  if (isStacked.value) {
    styles.zIndex = props.fieldCard.position + 100
  } else {
    styles.zIndex = props.fieldCard.position
  }
  
  return styles
})

const baseCardPosition = computed(() => {
  if (!isStacked.value) return null
  
  const baseCard = props.allFieldCards.find(card => 
    card.cardId === props.fieldCard.isStackedOn
  )
  
  return baseCard?.position || 0
})

const connectionLineStyle = computed(() => {
  if (!isStacked.value || !baseCardPosition.value) return {}
  
  const offset = (props.fieldCard.position - baseCardPosition.value) * 10
  return {
    height: `${Math.abs(offset)}px`,
    top: offset > 0 ? '100%' : '-100%',
    transform: offset > 0 ? 'none' : 'rotate(180deg)'
  }
})

// Event handlers
const handleDragStart = (event) => {
  if (props.fieldCard.isTapped) {
    event.preventDefault()
    return
  }
  
  isDragging.value = true
  
  // Set custom drag data
  if (event.dataTransfer) {
    event.dataTransfer.setData('application/json', JSON.stringify({
      type: 'field-card',
      playerId: props.playerId,
      fieldCard: props.fieldCard
    }))
    
    // Set custom drag image
    const dragImage = new Image()
    dragImage.src = `data:image/svg+xml;base64,${btoa(`
      <svg width="100" height="150" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="150" rx="8" fill="#1a1a24" stroke="#8b5cf6" stroke-width="2"/>
        <text x="50" y="30" text-anchor="middle" fill="#f8fafc" font-size="12">
          ${cardDetails.value.name}
        </text>
        <text x="50" y="50" text-anchor="middle" fill="#f8fafc" font-size="10">
          ${props.fieldCard.isTapped ? 'TAPPED' : ''}
        </text>
      </svg>
    `)}`
    event.dataTransfer.setDragImage(dragImage, 50, 75)
  }
  
  emit('drag-start', { event, fieldCard: props.fieldCard })
}

const handleDoubleClick = (event) => {
  event.preventDefault()
  
  // Double-click toggles tap state
  if (props.interactive) {
    if (props.fieldCard.isTapped) {
      emit('untap', props.fieldCard.cardId)
    } else {
      emit('tap', props.fieldCard.cardId)
    }
  }
  
  emit('double-click', { event, fieldCard: props.fieldCard })
}

const handleContextMenu = (event) => {
  event.preventDefault()
  
  if (props.interactive) {
    // Right-click could show context menu for stacking/unstacking
    emit('contextmenu', { 
      event, 
      fieldCard: props.fieldCard,
      isStacked: isStacked.value,
      isBaseCard: isBaseCard.value
    })
  }
}

const handleMouseDown = (event) => {
  emit('mouse-down', { event, fieldCard: props.fieldCard })
}

const handleMouseUp = (event) => {
  emit('mouse-up', { event, fieldCard: props.fieldCard })
}

const handleMouseEnter = () => {
  if (props.interactive && !isDragging.value) {
    tooltipTimeout.value = setTimeout(() => {
      showTooltip.value = true
    }, 300)
  }
  emit('mouse-enter', props.fieldCard)
}

const handleMouseLeave = () => {
  if (tooltipTimeout.value) {
    clearTimeout(tooltipTimeout.value)
  }
  showTooltip.value = false
  emit('mouse-leave', props.fieldCard)
}

const handleClick = (event) => {
  // Single click for selection/targeting
  if (props.interactive) {
    emit('click', { 
      event, 
      fieldCard: props.fieldCard,
      isStacked: isStacked.value,
      isBaseCard: isBaseCard.value
    })
  }
}

const handleFocus = () => {
  if (props.interactive) {
    showTooltip.value = true
  }
  emit('focus', props.fieldCard)
}

const handleBlur = () => {
  showTooltip.value = false
  emit('blur', props.fieldCard)
}

// Cleanup
onUnmounted(() => {
  if (tooltipTimeout.value) {
    clearTimeout(tooltipTimeout.value)
  }
})
</script>

<style lang="scss" scoped>
.field-card {
  position: relative;
  width: 6rem;
  height: 9rem;
  background: linear-gradient(145deg, var(--color-card-bg) 0%, #222233 100%);
  border: 2px solid var(--color-card-border);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
  overflow: visible; // Allow stacking connections to show
  outline: none;
  
  &:hover {
    transform: translateY(-8px) scale(1.05);
    border-color: var(--color-primary);
    box-shadow: 
      0 10px 30px rgba(0, 0, 0, 0.5),
      0 0 0 2px var(--color-primary);
    
    .field-card__glow {
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
  
  &--tapped {
    transform: rotate(90deg);
    
    &:hover {
      transform: rotate(90deg) translateY(-8px) scale(1.05);
    }
  }
  
  &--highlighted {
    animation: field-card-pulse 2s ease-in-out infinite;
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
  
  &--stacked {
    margin-left: 1rem;
    margin-top: -0.5rem;
  }
  
  &--base-card {
    border-color: var(--color-accent);
    box-shadow: 
      0 0 15px rgba(0, 217, 255, 0.2),
      0 5px 20px rgba(0, 0, 0, 0.4);
  }
  
  &--can-be-targeted {
    cursor: crosshair;
    border-style: dashed;
  }
  
  &--draggable {
    cursor: grab;
    
    &:active {
      cursor: grabbing;
    }
  }
  
  &--interactive {
    &:hover .field-card__tooltip {
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
  
  &__stack-indicator {
    position: absolute;
    top: -0.5rem;
    left: -0.5rem;
    background: var(--color-warning);
    border-radius: 50%;
    width: 1.5rem;
    height: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }
  
  &__stack-icon {
    font-size: 0.75rem;
  }
  
  &__stack-count {
    position: absolute;
    bottom: -0.25rem;
    right: -0.25rem;
    background: var(--color-error);
    color: white;
    border-radius: 50%;
    width: 1rem;
    height: 1rem;
    font-size: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
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
  
  &__position {
    font-size: 0.6875rem;
    font-weight: 600;
    color: var(--color-accent);
    background: rgba(0, 217, 255, 0.1);
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
    position: relative;
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
  
  &__tapped-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
  }
  
  &__tapped-icon {
    font-size: 1.5rem;
    opacity: 0.8;
    transform: rotate(-90deg);
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
  
  &__status {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    margin-top: 0.5rem;
  }
  
  &__status-item {
    font-size: 0.5rem;
    font-weight: 700;
    padding: 0.125rem 0.25rem;
    border-radius: 3px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    
    &--tapped {
      background: rgba(255, 170, 0, 0.2);
      color: var(--color-warning);
    }
    
    &--stacked {
      background: rgba(139, 92, 246, 0.2);
      color: var(--color-primary);
    }
    
    &--base {
      background: rgba(0, 217, 255, 0.2);
      color: var(--color-accent);
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
  
  &__effects-indicator {
    font-size: 0.5625rem;
    font-weight: 700;
    color: var(--color-warning);
    background: rgba(255, 170, 0, 0.1);
    padding: 0.125rem 0.25rem;
    border-radius: 4px;
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
  
  &__targeting-ring {
    position: absolute;
    top: -4px;
    left: -4px;
    right: -4px;
    bottom: -4px;
    border: 2px solid;
    border-radius: 12px;
    pointer-events: none;
    z-index: 1;
    animation: targeting-pulse 1.5s ease-in-out infinite;
    
    &--friendly {
      border-color: var(--color-success);
      box-shadow: 0 0 15px rgba(0, 255, 136, 0.4);
    }
    
    &--enemy {
      border-color: var(--color-error);
      box-shadow: 0 0 15px rgba(255, 56, 96, 0.4);
    }
  }
  
  &__stack-connection {
    position: absolute;
    left: 50%;
    width: 2px;
    background: linear-gradient(to bottom, 
      var(--color-primary), 
      transparent);
    transform-origin: top center;
    z-index: -1;
    
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 6px;
      height: 6px;
      background: var(--color-primary);
      border-radius: 50%;
    }
  }
  
  &__tooltip {
    position: absolute;
    bottom: calc(100% + 10px);
    left: 50%;
    transform: translateX(-50%) translateY(-20px);
    width: 20rem;
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
  
  &__tooltip-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 0.5rem;
  }
  
  &__tooltip-title {
    font-size: 1.125rem;
    font-weight: 700;
    margin: 0;
    color: var(--color-primary);
    flex: 1;
  }
  
  &__tooltip-position {
    font-size: 0.75rem;
    color: var(--color-accent);
    background: rgba(0, 217, 255, 0.1);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    margin-left: 0.5rem;
  }
  
  &__tooltip-status {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
    flex-wrap: wrap;
  }
  
  &__tooltip-status-tapped {
    font-size: 0.75rem;
    color: var(--color-warning);
    background: rgba(255, 170, 0, 0.1);
    padding: 0.125rem 0.375rem;
    border-radius: 4px;
  }
  
  &__tooltip-status-untapped {
    font-size: 0.75rem;
    color: var(--color-success);
    background: rgba(0, 255, 136, 0.1);
    padding: 0.125rem 0.375rem;
    border-radius: 4px;
  }
  
  &__tooltip-status-stacked {
    font-size: 0.75rem;
    color: var(--color-primary);
    background: rgba(139, 92, 246, 0.1);
    padding: 0.125rem 0.375rem;
    border-radius: 4px;
  }
  
  &__tooltip-status-base {
    font-size: 0.75rem;
    color: var(--color-accent);
    background: rgba(0, 217, 255, 0.1);
    padding: 0.125rem 0.375rem;
    border-radius: 4px;
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
    margin-bottom: 0.75rem;
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
  
  &__tooltip-stack-info {
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    padding-top: 0.75rem;
    margin-bottom: 0.75rem;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  &__tooltip-stack-title {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-primary);
    margin-bottom: 0.5rem;
  }
  
  &__tooltip-stack-card {
    font-size: 0.875rem;
    color: var(--color-text-secondary);
    padding: 0.25rem 0.5rem;
    background: rgba(139, 92, 246, 0.1);
    border-radius: 4px;
  }
  
  &__tooltip-stack-list {
    list-style: none;
    padding: 0;
    margin: 0.5rem 0 0 0;
  }
  
  &__tooltip-stack-item {
    font-size: 0.75rem;
    color: var(--color-text-secondary);
    margin-bottom: 0.25rem;
    padding-left: 0.5rem;
  }
  
  &__tooltip-stack-more {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    font-style: italic;
    padding-left: 0.5rem;
  }
  
  &__drag-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(139, 92, 246, 0.8);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-radius: inherit;
    z-index: 100;
  }
  
  &__drag-icon {
    font-size: 2rem;
    opacity: 0.8;
  }
  
  &__drag-stack-warning {
    font-size: 0.75rem;