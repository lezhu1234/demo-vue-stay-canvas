<script setup lang="ts">
import { ref } from 'vue'
import { ALLSTATE, Rectangle, type ListenerProps, StayCanvas } from 'vue-stay-canvas'
const stayCanvasRef = ref<InstanceType<typeof StayCanvas> | null>(null)

const DragListener: ListenerProps = {
  name: 'dragListener',
  event: ['dragstart', 'drag', 'dragend'],
  callback: ({ e, composeStore, tools: { appendChild, updateChild, log } }) => {
    return {
      dragstart: () => ({
        dragStartPosition: e.point,
        dragChild: appendChild({
          shape: new Rectangle({
            x: e.x,
            y: e.y,
            width: 0,
            height: 0,
            props: { color: 'red' }
          }),
          className: 'annotation'
        })
      }),
      drag: () => {
        const { dragStartPosition, dragChild } = composeStore
        const x = Math.min(dragStartPosition.x, e.x)
        const y = Math.min(dragStartPosition.y, e.y)
        const width = Math.abs(dragStartPosition.x - e.x)
        const height = Math.abs(dragStartPosition.y - e.y)
        updateChild({
          child: dragChild,
          shape: dragChild.shape.update({ x, y, width, height })
        })
      },
      dragend: () => {
        log()
      }
    }
  }
}

const UndoListener: ListenerProps = {
  name: 'UndoListener',
  event: 'undo',
  state: ALLSTATE,
  callback: ({ tools: { undo } }) => {
    undo()
  }
}

const RedoListener: ListenerProps = {
  name: 'RedoListener',
  event: 'redo',
  state: ALLSTATE,
  callback: ({ tools: { redo } }) => {
    redo()
  }
}

function trigger(name: string) {
  if (!stayCanvasRef.value) {
    return
  }
  stayCanvasRef.value.trigger(name)
}
</script>
<template>
  <button @click="() => trigger('redo')">redo</button>
  <button @click="() => trigger('undo')">undo</button>
  <StayCanvas
    ref="stayCanvasRef"
    :width="500"
    :height="500"
    :listenerList="[DragListener, UndoListener, RedoListener]"
  />
</template>
