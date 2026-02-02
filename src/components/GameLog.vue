<template>
  <div class="game-log">
    <div class="game-log__header">
      <h3 class="game-log__title">Game Log</h3>
      <button 
        v-if="logs.length > 0"
        @click="clearLog"
        class="game-log__clear-button"
      >
        Clear
      </button>
    </div>
    
    <div class="game-log__container" ref="logContainer">
      <div 
        v-for="log in logs"
        :key="log.id"
        class="game-log__entry"
        :class="getLogClasses(log)"
      >
        <span class="game-log__timestamp">{{ formatTime(log.timestamp) }}</span>
        <span class="game-log__player">{{ formatPlayerName(log) }}</span>
        <span class="game-log__message">{{ log.message }}</span>
      </div>
      
      <div 
        v-if="logs.length === 0"
        class="game-log__empty"
      >
        <div class="game-log__empty-icon">📝</div>
        <p class="game-log__empty-text">No actions logged yet</p>
        <p class="game-log__empty-subtext">Game actions will appear here</p>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.game-log {
  
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.25rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--color-border);
  }
  
  &__title {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--color-text-primary);
    margin: 0;
    background: linear-gradient(90deg, var(--color-primary), var(--color-accent));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  &__clear-button {
    background: rgba(var(--color-error-rgb, 255, 56, 96), 0.1);
    color: var(--color-error);
    font-size: 0.875rem;
    padding: 0.375rem 0.75rem;
    border: 1px solid rgba(var(--color-error-rgb, 255, 56, 96), 0.2);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
        
    &:active {
      transform: translateY(0);
    }
  }
  
  &__container {
    max-height: 20rem;
    overflow-y: auto;
    padding-right: 0.5rem;
    
    // Custom scrollbar
    &::-webkit-scrollbar {
      width: 6px;
    }
    
    &::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 3px;
    }
    
    &::-webkit-scrollbar-thumb {
      background: var(--color-primary);
      border-radius: 3px;
      transition: background 0.2s;
    }
    
    &::-webkit-scrollbar-thumb:hover {
      background: var(--color-primary-hover);
    }
  }
  
  &__entry {
    font-size: 11px;
    
    &--system {
      border-left-color: var(--color-accent);
      background: rgba(var(--color-accent-rgb, 0, 217, 255), 0.05);
      
      .game-log__player {
        color: var(--color-accent);
      }
    }
    
    &--player {
      border-left-color: var(--color-primary);
      background: rgba(var(--color-primary-rgb, 139, 92, 246), 0.05);
      padding: 0 4px;
      display: inline-block;
      
      .game-log__player {
        color: var(--color-primary);
      }
    }
    
    &--error {
      border-left-color: var(--color-error);
      background: rgba(var(--color-error-rgb, 255, 56, 96), 0.05);
      
      .game-log__player {
        color: var(--color-error);
      }
    }
    
    &--success {
      border-left-color: var(--color-success);
      background: rgba(var(--color-success-rgb, 0, 255, 136), 0.05);
      
      .game-log__player {
        color: var(--color-success);
      }
    }
    
    &--warning {
      border-left-color: var(--color-warning);
      background: rgba(var(--color-warning-rgb, 255, 170, 0), 0.05);
      
      .game-log__player {
        color: var(--color-warning);
      }
    }
    
    &--info {
      border-left-color: var(--color-info);
      background: rgba(var(--color-info-rgb, 0, 191, 255), 0.05);
      
      .game-log__player {
        color: var(--color-info);
      }
    }
  }
  
  &__entry-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }
  
  &__player {
    font-weight: 600;
    font-size: 11px;
    letter-spacing: 0.3px;
    padding: 0 8px;
  }
  
  &__timestamp {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    opacity: 0.8;
  }
  
  &__message {
    color: var(--color-text-secondary);
    line-height: 1.4;
    
    // Make game terms stand out
    strong {
      color: var(--color-text-primary);
      font-weight: 600;
      background: rgba(255, 255, 255, 0.05);
      padding: 0.125rem 0.375rem;
      border-radius: 4px;
      margin: 0 0.125rem;
    }
    
    em {
      font-style: italic;
      color: var(--color-accent);
    }
  }
  
  &__empty {
    text-align: center;
    padding: 3rem 1rem;
    color: var(--color-text-muted);
  }
  
  &__empty-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
    opacity: 0.5;
    animation: float 3s ease-in-out infinite;
  }
  
  &__empty-text {
    font-size: 1.125rem;
    margin-bottom: 0.5rem;
    color: var(--color-text-secondary);
  }
  
  &__empty-subtext {
    font-size: 0.875rem;
    opacity: 0.7;
  }
}

// Animations
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

// New entries highlight
@keyframes highlightPulse {
  0%, 100% {
    background: rgba(var(--color-accent-rgb, 0, 217, 255), 0.1);
  }
  50% {
    background: rgba(var(--color-accent-rgb, 0, 217, 255), 0.2);
  }
}

.game-log__entry.highlight-new {
  animation: highlightPulse 1s ease 2;
}

// Responsive
@media (max-width: 768px) {
  .game-log {
    padding: 1rem;
    
    &__title {
      font-size: 1.125rem;
    }
    
    &__entry-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.25rem;
    }
    
    &__timestamp {
      align-self: flex-end;
      font-size: 0.6875rem;
    }
  }
}
</style>

<script setup>
import { ref, watch, nextTick, computed } from 'vue'

const props = defineProps({
  logs: {
    type: Array,
    default: () => []
  },
  currentPlayerId: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['clear-logs'])

const logContainer = ref(null)


const formatPlayerName = (log) => {
  if (log.playerName) return log.playerName
  if (log.playerId === props.currentPlayerId) return 'You'
  return `Player ${log.playerId?.slice(-4) || 'Unknown'}`
}

const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const clearLog = () => {
  if (confirm('Are you sure you want to clear the game log?')) {
    emit('clear-logs')
  }
}

// Auto-scroll to bottom when new logs are added
watch(() => props.logs.length, async () => {
  await nextTick()
  if (logContainer.value) {
    logContainer.value.scrollTop = logContainer.value.scrollHeight
  }
}, { immediate: true })

function getLogClasses(log) {
  const baseClass = 'game-log__entry'
  const typeClass = `game-log__entry--${log.type || 'player'}`
  const highlightClass = this.isNewLog(log) ? 'highlight-new' : ''
  
  return `${baseClass} ${typeClass} ${highlightClass}`.trim()
}
    
function getLogColor(log) {
  // Keep this for backward compatibility if needed
  const colors = {
    system: 'text-blue-600 border-blue-400 bg-blue-50',
    player: 'text-green-600 border-green-400 bg-green-50',
    error: 'text-red-600 border-red-400 bg-red-50',
    success: 'text-green-600 border-green-400 bg-green-50',
    warning: 'text-yellow-600 border-yellow-400 bg-yellow-50',
    info: 'text-blue-600 border-blue-400 bg-blue-50'
  }
  return colors[log.type || 'player'] || colors.player
}
    
function isNewLog(log) {
  // Logic to determine if log is new (within last 5 seconds)
  const fiveSecondsAgo = Date.now() - 5000
  return log.timestamp > fiveSecondsAgo
}
</script>