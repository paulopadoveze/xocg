<template>
  <div class="relative">
    <div 
      class="bg-white border-2 border-gray-300 rounded-lg shadow p-4 cursor-pointer hover:shadow-lg transition-shadow"
      @dblclick="$emit('draw')"
      @contextmenu.prevent="showContextMenu($event)"
      @dragover.prevent
      @drop="onDrop"
    >
      <div class="flex justify-between items-center mb-2">
        <h3 class="font-semibold text-lg">{{ title }}</h3>
        <span class="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
          {{ count }} cards
        </span>
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
    default: 'civis'
  }
})

const emit = defineEmits(['draw', 'peek', 'shuffle', 'count'])

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

const handleCount = () => {
  emit('count')
  contextMenu.value.visible = false
}

const onDrop = (event) => {
  event.preventDefault()
  const cardId = event.dataTransfer.getData('text/plain')
  if (cardId) {
    // Handle card being dropped on deck (returning to deck)
    // You might want to emit a different event here
    console.log('Card dropped on deck:', cardId)
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