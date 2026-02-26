<template>
  <div>
    <!-- recursive draggable list of field cards -->
    <Draggable
      class="dragArea"
      tag="ul"
      :list="cardsList"
      :group="{ name: 'field' }"
      item-key="cardId"
      @change="onDragChange"
    >
      <li class="field-item" v-for="card in cardsList">
        <CardComponent
          :card-id="card.cardId"
          draggable
          @dragstart="$emit('dragstart',card)"
        />
        <NestedDraggable
          v-if="card.cards && card.cards.length"
          :cards="card.cards"
          class="nested-area"
          @dragstart="$emit('dragstart', $event)"
        />
      </li>
    </Draggable>
  </div>
</template>

<script setup>
import { defineAsyncComponent, computed } from 'vue'
import { VueDraggableNext } from 'vue-draggable-next'
import CardComponent from './CardComponent.vue'

const props = defineProps({
  cards: {
    required: true,
    type: Array
  },
  fieldId: {
    type: [String, Number],
    default: null
  }
})

const emit = defineEmits(['dragstart', 'field-change', 'update:cards'])

// ensure every card entry has a nested `cards` array (recursive)
function normalizeCards(list) {
  return list.map(item => {
    return {
      ...item,
      cards: Array.isArray(item.cards) ? normalizeCards(item.cards) : []
    }
  })
}

const cardsList = computed({
  get: () => normalizeCards(props.cards || []),
  set(val) {
    // optionally emit updates if the parent should react
    // e.g. emit('update:cards', val)
  }
})

function onDragChange(evt) {
  const payload = { fieldId: props.fieldId, cards: cardsList.value }
  emit('field-change', payload)
  emit('update:cards', cardsList.value)
}

const Draggable = VueDraggableNext
const NestedDraggable = defineAsyncComponent(() => import('./PlayerField.vue'))
</script>

<style scoped>
.dragArea {
  min-height: 50px;
  outline: 1px dashed rgba(255, 255, 255, 0.2);
  list-style: none;
  padding: 0.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.field-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.nested-area {
  margin-top: 0.25rem;
  padding-left: 1.25rem;
}
</style>
