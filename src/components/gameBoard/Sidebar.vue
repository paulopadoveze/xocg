<!-- components/Sidebar.vue -->
<script setup>
import { defineProps, defineEmits } from 'vue'
import DeckComponent from './DeckComponent.vue'
import GameLog from './GameLog.vue'

const props = defineProps({
  gameState: {
    type: Object,
    required: true
  },
  currentPlayer: {
    type: Object,
    default: null
  },
  currentTurnPlayer: {
    type: Object,
    required: true
  },
  nextPlayer: {
    type: Object,
    default: null
  },
  playerId: {
    type: String,
    required: true
  },
  playerName: {
    type: String,
    required: true
  },
  isPlayerTurn: {
    type: Boolean,
    required: true
  },
  showDebug: {
    type: Boolean,
    default: false
  },
  cardDetailsMap: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits([
  'draw-card',
  'peek-deck',
  'shuffle-deck',
  'take-from-garbage',
  'add-coin',
  'end-turn',
  'force-turn-fix',
  'leave-game'
])

const playerColor = (playerId) => {
  if (!playerId) return 'bg-gray-500'
  
  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500',
    'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
  ]
  
  let hash = 0
  for (let i = 0; i < playerId.length; i++) {
    hash = playerId.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  const index = Math.abs(hash) % colors.length
  return colors[index]
}

const getCardDetails = (cardId) => {
  return props.cardDetailsMap[cardId] || {
    id: cardId,
    name: `Card #${cardId}`,
    type: 'main',
    description: 'Card details not found'
  }
}

const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  
  if (diffMins < 1) return 'just now'
  if (diffMins === 1) return '1 minute ago'
  if (diffMins < 60) return `${diffMins} minutes ago`
  
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours === 1) return '1 hour ago'
  if (diffHours < 24) return `${diffHours} hours ago`
  
  return date.toLocaleDateString()
}
</script>

<template>
   <aside class="sidebar">
      <div class="cardDetails"></div>  

      <div class="game-players">
        <h3 class="game-players__title">Players Status</h3>
        <div class="game-players__list">
          <div 
            v-for="player in gameState.players"
            :key="player.id"
            class="game-players__player"
            :class="{
              'game-players__player--turn': player.id === currentTurnPlayer.id,
              'game-players__player--self': player.id === playerId,
              'game-players__player--other': player.id !== currentTurnPlayer.id && player.id !== playerId
            }"
          >
            <div class="game-players__header">
              <div 
                class="game-players__avatar"
                :class="playerColor(player.id)"
              >
                {{ player.name.charAt(0).toUpperCase() }}
              </div>
              <div class="game-players__info">
                <div class="game-players__name">{{ player.name }}</div>
                <div class="game-players__role">
                  {{ player.id === playerId ? 'You' : 'Opponent' }}
                </div>
              </div>
              <span 
                v-if="player.id === currentTurnPlayer.id"
                class="game-players__badge game-players__badge--turn"
              >
                Current Turn
              </span>
              <span 
                v-else-if="player.id === nextPlayer.id"
                class="game-players__badge game-players__badge--next"
              >
                Next
              </span>
            </div>
          </div>
        </div>
      </div>
      <div class="game-garbage">
        <h3 class="game-garbage__title">Garbage</h3>
        <div class="game-garbage__cards">
          <div 
            v-for="cardId in gameState.garbage?.cardIds || []"
            :key="cardId"
            @dblclick="takeFromGarbage(cardId)"
            class="game-garbage__card"
          >
            {{ getCardDetails(cardId)?.name || `Card ${cardId}` }}
          </div>
        </div>
        <div class="game-garbage__count">
          {{ gameState.garbage?.count || 0 }} cards
        </div>
      </div>

      <!-- Game Log -->
      <div class="gamelog-container">
        <GameLog :logs="gameState.logs" :current-player-id="playerId" />
      </div>
      

      <!-- Debug Info (remove in production) -->
      <!--<div v-if="showDebug" class="game-debug">
        <div class="game-debug__title">Debug Info:</div>
        <div class="game-debug__info">Current Turn Player ID: {{ gameState.currentTurnPlayerId || 'None' }}</div>
        <div class="game-debug__info">Current Turn Index: {{ gameState.currentTurn }}</div>
        <div class="game-debug__info">Your Player ID: {{ playerId }}</div>
        <div class="game-debug__info">Is Your Turn: {{ isPlayerTurn }}</div>
        <button @click="forceTurnFix" class="game-debug__fix-button">
          Force Fix Turn
        </button>
      </div>-->
    </aside>
</template>

<style scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1rem;
  background-color: #f9fafb;
  border-left: 1px solid #e5e7eb;
  height: 100vh;
  overflow-y: auto;
}

/* Turn Indicator */
.turn-indicator {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1rem;
}

.turn-indicator__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.turn-indicator__title {
  font-weight: 600;
}

.turn-indicator__turn-number {
  font-size: 0.875rem;
  color: #4b5563;
}

.turn-indicator__player {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.turn-indicator__player-avatar {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  flex-shrink: 0;
}

.turn-indicator__player-info {
  flex-grow: 1;
  min-width: 0;
}

.turn-indicator__player-name {
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.turn-indicator__player-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.turn-indicator__status-turn {
  font-size: 0.75rem;
  background-color: #dcfce7;
  color: #166534;
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
}

.turn-indicator__status-turn--active {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.turn-indicator__status-waiting {
  font-size: 0.75rem;
  color: #4b5563;
}

.turn-indicator__end-turn-button {
  width: 100%;
  background-color: #3b82f6;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-bottom: 0.75rem;
}

.turn-indicator__end-turn-button:hover:not(:disabled) {
  background-color: #2563eb;
}

.turn-indicator__end-turn-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Turn Order */
.turn-order {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid #e5e7eb;
}

.turn-order__title {
  font-size: 0.875rem;
  color: #4b5563;
  margin-bottom: 0.25rem;
}

.turn-order__list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-bottom: 0.5rem;
}

.turn-order__item {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.turn-order__item--current {
  background-color: #dbeafe;
  color: #1e40af;
  font-weight: 600;
}

.turn-order__item--other {
  background-color: #f3f4f6;
  color: #374151;
}

.turn-order__crown {
  font-size: 0.75rem;
}

.turn-order__player-name {
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.turn-order__indicator {
  margin-left: 0.25rem;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.turn-order__next {
  font-size: 0.75rem;
  color: #4b5563;
}

.turn-order__direction {
  margin-left: 0.5rem;
}

/* Game Stats */
.game-stats {
  background-color: white;
  padding: 1rem;
  border-radius: 0.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.game-stats__title {
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.game-stats__content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.game-stats__coins {
  font-weight: 500;
}

.game-stats__add-button {
  background-color: #f59e0b;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 0.125rem;
  border: none;
  cursor: pointer;
  font-size: 0.875rem;
}

.game-stats__add-button:hover:not(:disabled) {
  background-color: #d97706;
}

.game-stats__add-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.game-stats__details {
  font-size: 0.875rem;
  color: #4b5563;
}

/* Game Decks */
.game-decks {
  background-color: white;
  padding: 1rem;
  border-radius: 0.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Garbage */
.game-garbage {
  background-color: white;
  padding: 1rem;
  border-radius: 0.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.game-garbage__title {
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.game-garbage__cards {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  max-height: 150px;
  overflow-y: auto;
}

.game-garbage__card {
  width: 4rem;
  height: 6rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.25rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: box-shadow 0.2s;
  font-size: 0.75rem;
  text-align: center;
  word-break: break-word;
  padding: 0.25rem;
}

.game-garbage__card:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.game-garbage__count {
  font-size: 0.875rem;
  color: #4b5563;
}

/* Players Status */
.game-players {
  background-color: white;
  padding: 1rem;
  border-radius: 0.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.game-players__title {
  font-weight: 600;
  margin-bottom: 1rem;
}

.game-players__player {
  border-left: 3px solid;
  border-radius: 0.25rem;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  background-color: #f9fafb;
}

.game-players__player--turn {
  border-color: #3b82f6;
  background-color: #eff6ff;
}

.game-players__player--self {
  border-color: #10b981;
}

.game-players__player--other {
  border-color: #d1d5db;
}

.game-players__header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.game-players__avatar {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  flex-shrink: 0;
}

.game-players__info {
  flex-grow: 1;
  min-width: 0;
}

.game-players__name {
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.game-players__role {
  font-size: 0.75rem;
  color: #4b5563;
}

.game-players__badge {
  font-size: 0.75rem;
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  white-space: nowrap;
}

.game-players__badge--turn {
  background-color: #dbeafe;
  color: #1e40af;
}

.game-players__badge--next {
  background-color: #fef3c7;
  color: #92400e;
}

.game-players__stats {
  font-size: 0.875rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-left: 2.5rem;
}

.game-players__stat {
  line-height: 1.2;
}

.game-players__meta {
  font-size: 0.75rem;
  color: #4b5563;
  margin-top: 0.25rem;
  margin-left: 2.5rem;
}

/* Game Log Container */
.game-log-container {
  background-color: white;
  border-radius: 0.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

/* Debug */
.game-debug {
  background-color: #fef3c7;
  border: 1px solid #fde68a;
  border-radius: 0.25rem;
  padding: 0.75rem;
  font-size: 0.875rem;
}

.game-debug__title {
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.game-debug__info {
  margin-bottom: 0.25rem;
}

.game-debug__fix-button {
  margin-top: 0.5rem;
  background-color: #ef4444;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 0.125rem;
  border: none;
  cursor: pointer;
  font-size: 0.75rem;
}

.game-debug__fix-button:hover {
  background-color: #dc2626;
}

/* Game Footer */
.game-footer {
  margin-top: auto;
  padding-top: 1rem;
}

.game-footer__leave-button {
  width: 100%;
  background-color: #d1d5db;
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;
}

.game-footer__leave-button:hover {
  background-color: #9ca3af;
}

/* Animations */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>