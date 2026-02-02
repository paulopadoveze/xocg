import { ref, onMounted, onUnmounted } from 'vue'

export function useDraggable(elementRef) {
  const isDragging = ref(false)
  const position = ref({ x: 0, y: 0 })
  const dragStart = ref({ x: 0, y: 0 })
  const elementPosition = ref({ x: 0, y: 0 })

  const startDrag = (event) => {
    isDragging.value = true
    dragStart.value = {
      x: event.clientX,
      y: event.clientY
    }
    
    if (elementRef.value) {
      const rect = elementRef.value.getBoundingClientRect()
      elementPosition.value = {
        x: rect.left,
        y: rect.top
      }
    }

    document.addEventListener('mousemove', onDrag)
    document.addEventListener('mouseup', stopDrag)
  }

  const onDrag = (event) => {
    if (!isDragging.value) return

    const dx = event.clientX - dragStart.value.x
    const dy = event.clientY - dragStart.value.y

    position.value = {
      x: elementPosition.value.x + dx,
      y: elementPosition.value.y + dy
    }

    // Update element position
    if (elementRef.value) {
      elementRef.value.style.transform = `translate(${dx}px, ${dy}px)`
    }
  }

  const stopDrag = () => {
    isDragging.value = false
    document.removeEventListener('mousemove', onDrag)
    document.removeEventListener('mouseup', stopDrag)
    
    // Reset transform after drop
    if (elementRef.value) {
      elementRef.value.style.transform = ''
    }
  }

  onMounted(() => {
    return () => {
      document.removeEventListener('mousemove', onDrag)
      document.removeEventListener('mouseup', stopDrag)
    }
  })

  return {
    isDragging,
    position,
    startDrag
  }
}