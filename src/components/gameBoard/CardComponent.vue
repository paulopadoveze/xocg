<template>
  <tippy 
    :follow-cursor="true"
    :delay="[300, 0]"
    :interactive="false"
    :allow-html="true"
    :offset="[0, 50]"
    theme="custom"
  >
    <div
      :class="[
        'card',
        {
          'card--rotated': card.rotated,
          'card--highlighted': card.highlighted,
          'card--selected': card.selected,
          'card--draggable': draggable,
          'card--interactive': true,
        },
        getCardSubtypeClass(card.subtype)
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
      :aria-label="`${card.name} - ${card.subtype} card`"
      ref="cardContent"
    >
      
      <!-- Card Content -->
      <div class="card__content">
        <div class="card__artwork">
          <img :src="imageSrc" v-if="card.img"  >
        </div>
        <div class="card__header">
          <h3 class="card__name -resumed">{{ card.name }}</h3>
          <span v-if="card.power" class="card__power">
            {{ card.power }}
          </span>
        </div>
        <div class="card__body">
          <div class="card__type">{{ card.subtype }}</div>
          <div class="card__description">
            {{ card.ability }}
          </div>
          <div v-if="card.power || card.health" class="card__stats">
            
            <span v-if="card.health" class="card__stat card__stat--health">
              {{ card.health }}
            </span>
          </div>
        </div>
        
        <div class="card__footer">
          <div v-if="card.rarity" class="card__rarity" :class="`card__rarity--${card.rarity}`">
            {{ card.rarity.charAt(0).toUpperCase() }}
          </div>
        </div>
      </div>
      
      <div class="card__glow" :class="{ 'card__glow--active': card.highlighted }"></div>
      
    </div>

    <template #content>
      
      <div class="card -large" :class="getCardSubtypeClass(card.subtype)">
        <div class="card__content">
          <div class="card__artwork">
            <img :src="imageSrc" v-if="card.img"  >
          </div>
          <div class="card__header">
            <h3 class="card__name">{{ card.name }}</h3>
            <span v-if="card.power" class="card__power">
              {{ card.power }}
            </span>
          </div>
          <div class="card__body">
            <div class="card__type">{{ card.subtype }}</div>
            <div class="card__description">
              {{ card.ability }}
            </div>
          </div>
          
          <div class="card__footer">
           
            <div v-if="card.rarity" class="card__rarity" :class="`card__rarity--${card.rarity}`">
              {{ card.rarity.charAt(0).toUpperCase() }}
            </div>
          </div>
        </div>
      </div>
    </template>
  </tippy>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useTippy } from 'vue-tippy'
import { useGameStore } from '../../stores/gameStore'

const props = defineProps({
  cardId: {
    type: [Number, String],
    required: true
  },
  draggable: {
    type: Boolean,
    default: true
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

const gameStore = useGameStore()

const card = computed(() => {
  const id = typeof props.cardId === 'string' ? Number(props.cardId) : props.cardId
  return gameStore.mainDeck.find(c => c.id === id) || {}
})

const imageSrc = computed(() => 
  card.value?.img ? new URL(`../assets/cardImages/${card.value.img}`, import.meta.url).href : ''
)

const isDragging = ref(false)

const handleDragStart = (event) => {
  isDragging.value = true
  if (event.dataTransfer) {
    const dragImage = new Image()
    dragImage.src = `data:image/svg+xml;base64,${btoa(`
      <svg width="100" height="150" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="150" rx="8" fill="#1a1a24" stroke="#8b5cf6" stroke-width="2"/>
        <text x="50" y="30" text-anchor="middle" fill="#f8fafc" font-size="12">${card.value?.name}</text>
      </svg>
    `)}`
    event.dataTransfer.setDragImage(dragImage, 50, 75)
  }
  emit('drag-start', event)
}

const cardContent = ref()

function getCardSubtypeClass(type) {
  if(type=="Substituto"){
    return 'type-substitute'
  }
  if(type=="Ouvinte"){
    return 'type-listener'
  }
  if(type=="Personagem"){
    return 'type-character'
  }
  if(type=="Tradicional"){
    return 'type-host'
  }
  if(type=="Lenda"){
    return 'type-legend'
  }

  return 'type-none'
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
  emit('mouse-enter', card.value)
}

const handleMouseLeave = () => {
  emit('mouse-leave')
}

const handleFocus = () => {
  emit('focus')
}

const handleBlur = () => {
  emit('blur')
}
</script>

<style lang="scss" scoped>

:root {
 
}
// Card styles
.card {
  --bgCard: #595959;
  position: relative;
  width: 7rem;
  aspect-ratio: 6/8.5;
  background: linear-gradient(145deg, var(--bgCard) 0%, #202020 80%);
  border: 1px solid color-mix(in srgb, var(--bgCard), #121212);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
  overflow: hidden;
  outline: none;
  
  &.type-substitute {
    --bgCard: red
  }

  &.type-listener {
    --bgCard: black
  }

  &.type-host {
    --bgCard: purple
  }

  &.type-character {
    --bgCard: blue
  }

  &.type-legend {
    --bgCard: orange
  }

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

  &.-large {
    width:15rem;
  }
  
  &__content {
    height: 100%;
    display: flex;
    flex-direction: column;
    position: relative;
    z-index: 2;
  }
  
  &__header {
    background: linear-gradient(145deg, color-mix(in srgb, var(--bgCard),#121212),  #121212 );
    display: flex;
    justify-content: space-between;
    align-items: stretch;
    border-radius: 5px;
    margin: 0.5rem;
    z-index: 3;
    position: relative;
  }
  
  &__name {
    padding: 0.5rem;
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--color-text-primary);
    text-shadow: 1px 1px 0 color-mix(in srgb, var(--bgCard),#000);
    margin: 0;
    line-height: 1.2;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__power {
    background:radial-gradient(circle,rgba(247, 107, 32, 1) 0%, rgba(253, 29, 29, 1) 100%);
    color: white;
    font-size: 1.1rem;
    font-weight: 700;
    text-align: center;
    width: 2rem;
    border-radius: 4px;
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
    background: black;
    clip-path: polygon(0 0, 100% 0, 100% 80%, 0% 100%);
    clip-path: circle(100.0% at 50% 0);
    overflow: hidden;
    position: absolute;
    top: 0;
    left: 0;
    bottom: 35%;
    right: 0;
    z-index: 1;
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
    position: relative;
    z-index: 3;
    margin-top: 50%;
  }
  
  &__description {
    background: linear-gradient(145deg, color-mix(in srgb, var(--bgCard),#121212),  #121212 );
    mix-blend-mode: overlay;
    font-size: 0.625rem;
    color: var(--color-text-secondary);
    line-height: 1.3;
    margin-bottom: 0.5rem;
    overflow: hidden;
    text-overflow: ellipsis;
    padding: 1rem 1rem;
    margin: -.5rem .5rem 0.5rem;
    height: 100%;
    font-size: 0.8rem;
    line-height: 1.5;
    border: 1px solid color-mix(in srgb, var(--bgCard),#555);
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
    background: color-mix(in srgb, var(--bgCard),#404040);
    border-radius: 100px;
    font-size: 0.5625rem;
    padding: 0.2rem;
    margin: 0 1rem;
    text-align: center;
    text-transform: uppercase;
    font-weight: 700;
    letter-spacing: 0.5px;
    z-index: 2;
    border: 1px solid rgba(255,255,255,0.1);
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
  }
}

</style>