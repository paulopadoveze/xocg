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
        'card -small',
        {
          'card--rotated': card.rotated,
          'card--highlighted': card.highlighted,
          'card--selected': card.selected,
          'card--interactive': true,
          'card--dragging': isDragging,
        },
        getCardSubtypeClass(card.type)
      ]"
      :draggable="draggable"
      @dragstart="handleDragStart"
      @dragend="handleDragEnd"
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
        
        <div class="card__header">
          <h3 class="card__name-wrapper -resumed">
            {{ card.name }}
          </h3>
          <span v-if="card.power" class="card__power">
            {{ card.power }}
          </span>
        </div>
        <div class="card__artwork">
          <img :src="imageSrc" v-if="card.img"  >
        </div>
        <div class="card__body">
          <div class="card__type">{{ card.subtype }}</div>
          <div class="card__description">
            <div class="card__powerTag -defender" v-if="card.isDefender">Defensor</div>  
            {{ card.ability }}
          </div>
        </div>
        
        <div class="card__footer" style="display: none;">
          <div v-if="card.rarity" class="card__rarity" :class="`card__rarity--${card.rarity}`">
            {{ card.rarity.charAt(0).toUpperCase() }}
          </div>
        </div>
      </div>
      <div class="card__glow" :class="{ 'card__glow--active': card.highlighted }"></div>
    </div>

    <template #content>
      <div class="card -large" :class="getCardSubtypeClass(card.type)">
        <div class="card__content">

          <div class="card__header">
            <h3 class="card__name-wrapper">{{ card.name }}</h3>
            <span v-if="card.power" class="card__power">
              {{ card.power }}
            </span>
          </div>
          <div class="card__artwork">
            <img :src="imageSrc" v-if="card.img"  >
          </div>
          <div class="card__body">
            <div class="card__type">{{ card.subtype }}</div>
            <div class="card__description">
            <div class="card__powerTag -defender" v-if="card.isDefender">Defensor</div>  
            <div class="card__powerTag -atacante" v-if="card.isAttacker">Atacante</div>  
            <div class="card__cost " v-if="card.cost">{{card.cost}}</div>  
              {{ card.ability }}
            </div>
          </div>
          
          <div class="card__footer" style="display: none;">
           
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
  },
  dragMeta: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits([
  'double-click',
  'contextmenu',
  'mouse-down',
  'mouse-up',
  'mouse-enter',
  'mouse-leave',
  'focus',
  'blur',
  'drag-start',
  'drag-end',
])

const gameStore = useGameStore()

const card = computed(() => {
  const id = typeof props.cardId === 'string' ? Number(props.cardId) : props.cardId
  return gameStore.mainDeck.find(c => c.id === id) || {}
})

const imageSrc = computed(() =>
  card.value?.img ? new URL(`../../assets/cardImages/${card.value.img}`, import.meta.url).href : ''
)

const cardContent = ref()
const isDragging = ref(false)

function getCardSubtypeClass(type) {


  if(type === "Convidado") {
    return 'type-guest'
  }
  if(type === "Substituto"){
    return 'type-substitute'
  }
  if(type === "Ouvinte"){
    return 'type-listener'
  }
  if(type === "Personagem"){
    return 'type-character'
  }
  if(type === "Tradicional"){
    return 'type-host'
  }
  if(type === "Lenda"){
    return 'type-legend'
  }

  return 'type-none'
}

const handleDragStart = (event) => {
  isDragging.value = true
  const payload = {
    cardId: props.cardId,
    ...props.dragMeta
  }
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('application/xcg-card', JSON.stringify(payload))
  // Also set plain text for legacy drop targets
  event.dataTransfer.setData('text/plain', String(props.cardId))
  emit('drag-start', payload, event)
}

const handleDragEnd = (event) => {
  isDragging.value = false
  emit('drag-end', event)
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
  --cardSize: 1;
  --cardTitleSize: 1;
  --bgCard: #595959;
  position: relative;
  width: 7rem;
  aspect-ratio: 6/8.5;
  background: var(--bgCard);
  border-radius: calc(var(--cardSize) * 16px);
  cursor: grab;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
  overflow: hidden;
  outline: none;

  &--dragging {
    opacity: 0.4;
    cursor: grabbing;
  }

  &.type-guest {
    --bgCard: tomato
  }
  
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

  &.-small {
    --cardSize: 0.5;
    --cardTitleSize: 0.75;
  }

  &.-large {
    --cardSize: 1;
    width:15rem;
  }
  
  &__content {
    border-radius: calc(var(--cardSize)*9px);
    background: black;
    height: calc(100% - calc(var(--cardSize) * 1rem));
    display: flex;
    flex-direction: column;
    position: relative;
    z-index: 2;
    margin: calc(var(--cardSize) * 0.5rem);
    gap: calc(var(--cardSize) * 4px);
    padding:  calc(var(--cardSize) * 4px);

  }
  
  &__header {
    border-radius: 0 calc(var(--cardSize) * 9px)  0 0;
    background: white;
    display: grid;
    grid-template-columns: auto calc(var(--cardSize)*2.5rem);
    justify-content: space-between;
    align-items: stretch;
    z-index: 3;
    align-content: center;
  }

  &__name-wrapper {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    padding: calc(var(--cardSize)*0.25rem);
    letter-spacing: -1px;
    font-size: calc(var(--cardTitleSize) * 1rem);
    font-weight: 700;
    color: black;
    margin: 0;
    line-height: 1.2;
    flex: 1;
  }

  &__power {
    border-radius: 0 calc(var(--cardSize) * 9px)  0 0;
    background: #dc3a15;
    color: white;
    font-size: calc(var(--cardTitleSize) * 1.2rem);
    font-weight: 700;
    height: 100%;
    text-align: center;
    border-left: calc(var(--cardSize) * 4px) solid black;
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
    height: calc(var(--cardSize) * 8.4rem);
    border-top: 0;
    overflow: hidden;
    pointer-events: none;

    > img {
      width: 100%;
      display: block;
    }
  }
  
  &__artwork-placeholder {
    width: 100%;
    height: 100%;
    background: #232323;
    border-radius: 6px;
  }
  
  &__body {
    flex: 1;
    display: flex;
    flex-direction: column;
    position: relative;
    z-index: 3;
    gap: calc(var(--cardSize) * 4px);
    overflow: hidden;
  }
  
  &__description {
    background:white;
    mix-blend-mode: overlay;
    font-size: 0.625rem;
    color: black;
    line-height: 1.3;
    overflow: hidden;
    text-overflow: ellipsis;
    padding: calc(var(--cardSize) * 0.75rem)  calc(var(--cardSize) * 0.6rem);
    height: 100%;
    flex-grow: 2;
    font-size: 0.8rem;
    line-height: 1.3;
    border-radius: 0 0 calc(var(--cardSize) * 9px) calc(var(--cardSize) * 9px);
  }

  &__powerTag {
    font-weight: 700;
    margin-bottom: 0.2rem;
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

    font-weight: 700;
    font-size: calc(var(--cardSize) * 0.75rem);
    text-align: center;
    text-transform: uppercase;
    font-weight: 700;
    letter-spacing: 1px;
    z-index: 2;
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

.card__cost {
  font-weight: 700;
  color: #303030;
  border-bottom: 2px dotted black;
  padding-bottom: 0.2rem;
  margin-bottom: 0.2rem;
}

</style>