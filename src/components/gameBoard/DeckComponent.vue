<template>
  <div class="relative">
    <div 
      class=""
      :class="{ 'deck--drag-over': isDragOver }"
      @dblclick="$emit('draw')"
      @contextmenu.prevent="showContextMenu($event)"
      @dragover.prevent="onDragOver"
      @dragleave="onDragLeave"
      @drop.prevent="onDrop"
    >
      <div class="numberOfCards">
          {{ count }} cards
      </div>
      
      <div class="relative h-40 flex items-center justify-center">
        <!-- Deck visualization with stacked cards -->
        <div 
          v-for="i in Math.min(5, count)"
          :key="i"
          :style="{ 
            transform: `translateX(${(i-1)*2}px) translateY(${(i-1)*2}px) rotate(${(i-1)*0.5}deg)`,
            zIndex: 5 - i
          }"
          class="absolute w-24 h-32 border rounded bg-gradient-to-b from-gray-100 to-gray-200 shadow-sm"
        ></div>
        
        <!-- Empty deck indicator -->
        <div 
          v-if="count === 0"
          class="text-center text-gray-500"
        >
          <div class="text-4xl mb-2">🃏</div>
          <p class="text-sm">Empty deck</p>
        </div>
      </div>
      
      <div class="mt-4 flex justify-center">
        <button 
          @click.stop="$emit('draw')"
          class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          :disabled="count === 0"
          :class="{ 'opacity-50 cursor-not-allowed': count === 0 }"
        >
          Draw Card
        </button>
      </div>
    </div>
    
    <!-- Context Menu -->
    <div 
      v-if="contextMenu.visible"
      :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
      class="fixed z-50 bg-white rounded-md shadow-lg border border-gray-200 min-w-[180px]"
      @click.stop
    >
      <div class="py-1">
        <button 
          @click="handlePeek"
          class="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
          :disabled="count === 0"
        >
          🔍 Peek Top Cards
        </button>
        
        <div class="border-t my-1"></div>
        
        <button 
          @click="handleShuffle"
          class="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
          :disabled="count < 2"
        >
          🔀 Shuffle Deck
        </button>
        
        <div class="border-t my-1"></div>
        
        <button 
          @click="handleCount"
          class="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
        >
          📊 Show Deck Statistics
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  count: {
    type: Number,
    default: 0
  },
  deckType: {
    type: String,
    default: 'main'
  }
})

const emit = defineEmits(['draw', 'peek', 'shuffle', 'count', 'drop-card'])

const isDragOver = ref(false)

const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0
})

const showContextMenu = (event) => {
  event.preventDefault()
  contextMenu.value = {
    visible: true,
    x: event.clientX,
    y: event.clientY
  }
}

const handlePeek = () => {
  emit('peek')
  contextMenu.value.visible = false
}

const handleShuffle = () => {
  if (props.count < 2) {
    alert('Not enough cards to shuffle')
    contextMenu.value.visible = false
    return
  }
  
  if (confirm(`Are you sure you want to shuffle the ${props.title}? This action cannot be undone.`)) {
    emit('shuffle')
  }
  contextMenu.value.visible = false
}

function onDragOver(event) {
  isDragOver.value = true
  event.dataTransfer.dropEffect = 'move'
}

function onDragLeave(event) {
  if (!event.currentTarget.contains(event.relatedTarget)) {
    isDragOver.value = false
  }
}

const onDrop = (event) => {
  isDragOver.value = false
  const raw = event.dataTransfer.getData('application/xcg-card')
  if (!raw) return
  try {
    const payload = JSON.parse(raw)
    // Emit to parent (GameBoard) — parent handles all state logic
    emit('drop-card', { ...payload, target: 'deck', deckType: props.deckType })
  } catch (e) {
    console.warn('DeckComponent: invalid drag payload', e)
  }
}

// Close context menu when clicking elsewhere
onMounted(() => {
  document.addEventListener('click', () => {
    contextMenu.value.visible = false
  })
})

onUnmounted(() => {
  document.removeEventListener('click', () => {
    contextMenu.value.visible = false
  })
})
</script>

<style scoped>
  .numberOfCards {
    font-size: 12px;
  }

  .deck--drag-over {
    outline: 2px dashed rgba(100, 200, 100, 0.7);
    border-radius: 8px;
    background: rgba(100, 200, 100, 0.08);
  }
</style>
