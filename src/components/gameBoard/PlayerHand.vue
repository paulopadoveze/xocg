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
  <div v-else class="gameHand">
    <div class="game-hand__cards">
      <CardComponent
        v-for="cardId in cards"
        :key="cardId"
        :card-id="cardId"
        @double-click="$emit('play-card', cardId)"
      />
    </div>
  </div>
</template>

<script setup>
import CardComponent from './CardComponent.vue'
import IconXorume from '../../assets/icons/IconXorume.vue'

defineProps({
  /** Array of card IDs (own hand) or any truthy array (opponent hand, shown face-down) */
  cards: {
    type: Array,
    default: () => []
  },
  /** When true, renders face-down opponent cards instead of the player's own cards */
  opponent: {
    type: Boolean,
    default: false
  }
})

defineEmits(['play-card'])
</script>

<style scoped>
/* Player's own hand — fixed to the bottom-center of the screen */
.gameHand {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
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
