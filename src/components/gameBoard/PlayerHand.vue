<template>
  <!-- Opponent hand: face-down cards -->
  <div v-if="opponent" class="opponentHand">
    <div
      class="opponentCard"
      v-for="(_, idx) in cards"
      :key="idx"
    >
      <IconXorume />
    </div>
  </div>

  <!-- Player's own hand: face-up cards -->
  <div
    v-else
    class="gameHand"
    :class="{ 'gameHand--drag-over': isDragOver }"
    @dragover.prevent="onDragOver"
    @dragleave="onDragLeave"
    @drop.prevent="onDrop"
  >
    <div class="game-hand__cards">
      <CardComponent
        v-for="cardId in cards"
        :key="cardId"
        :card-id="cardId"
        :drag-meta="{ source: 'hand', sourcePlayerId: playerId }"
        @double-click="$emit('play-card', cardId)"
        @drag-start="(payload) => $emit('drag-start', payload)"
        @drag-end="$emit('drag-end')"
      />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import CardComponent from './CardComponent.vue'
import IconXorume from '../../assets/icons/IconXorume.vue'

const props = defineProps({
  /** Array of card IDs (own hand) or any truthy array (opponent hand, shown face-down) */
  cards: {
    type: Array,
    default: () => []
  },
  /** When true, renders face-down opponent cards instead of the player's own cards */
  opponent: {
    type: Boolean,
    default: false
  },
  /** Current player's ID — injected by GameBoard so drag metadata is complete */
  playerId: {
    type: [String, Number],
    default: null
  }
})

const emit = defineEmits(['play-card', 'drag-start', 'drag-end', 'drop-card'])

const isDragOver = ref(false)

function onDragOver(event) {
  isDragOver.value = true
  event.dataTransfer.dropEffect = 'move'
}

function onDragLeave() {
  isDragOver.value = false
}

function onDrop(event) {
  isDragOver.value = false
  const raw = event.dataTransfer.getData('application/xcg-card')
  if (!raw) return
  try {
    const payload = JSON.parse(raw)
    // Emit to parent (GameBoard) — parent handles all state logic
    emit('drop-card', { ...payload, target: 'hand' })
  } catch (e) {
    console.warn('PlayerHand: invalid drag payload', e)
  }
}
</script>

<style scoped>
/* Player's own hand — fixed to the bottom-center of the screen */
.gameHand {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  transition: background 0.2s ease;
}

.gameHand--drag-over {
  background: rgba(100, 200, 100, 0.15);
  outline: 2px dashed rgba(100, 200, 100, 0.6);
  border-radius: 8px;
}

.game-hand__cards {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  min-width: 300px;
  height: 100px;
  background-color: #0d0d13;
}

/* Opponent hand — face-down fanned cards */
.opponentHand {
  display: flex;
  gap: 0;
}

.opponentCard {
  box-shadow: 10px 10px 10px -5px rgba(0, 0, 0, 0.5);
  aspect-ratio: 5/7;
  background: radial-gradient(#2f2f37, transparent 50%),
    linear-gradient(135deg, #1f1f2d, #0d0d13);
  border: 1px solid #414162;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 6px;
  margin-right: -4rem;
  width: 100px;
  z-index: 1;
}

.opponentCard svg {
  width: 48px;
  height: 48px;
}
</style>
