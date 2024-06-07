<script setup lang="ts">
import * as Listeners from './listeners'
import { ref } from 'vue'
import { Rectangle, StayCanvas, type Dict } from 'vue-stay-canvas'

const width = 500
const height = 500
const container = new Rectangle({ x: 0, y: 0, width, height })

const stayCanvasRef = ref<InstanceType<typeof StayCanvas> | null>(null)
const state = ref('default')

function fileUpload(e: Event) {
  const target = e.target as HTMLInputElement
  if (target.files && target.files[0] && stayCanvasRef.value) {
    trigger('changeFile', {
      src: URL.createObjectURL(target.files[0]),
      container
    })
  }
}

function switchState(stateString: string) {
  state.value = stateString
  trigger('changeState', { state: stateString })
}
function trigger(name: string, payload?: Dict) {
  if (!stayCanvasRef.value) {
    return
  }
  stayCanvasRef.value.trigger(name, payload)
}
</script>
<template>
  currentState: {{ state }}
  <br />
  press ArrowUp and ArrowDown to zoom brush size
  <StayCanvas
    ref="stayCanvasRef"
    :width="width"
    :height="height"
    :listenerList="[...Object.values(Listeners)]"
  />
  <div>
    <div>
      <label htmlFor="avatar">Choose a profile picture:</label>
      <input
        type="file"
        id="avatar"
        name="avatar"
        accept="image/png, image/jpeg"
        @change="fileUpload"
      />
    </div>
    <button className="w-14 border-solid border border-white" @click="switchState('draw')">
      draw
    </button>
    <button className="w-14 border-solid border border-white" @click="switchState('eraser')">
      eraser
    </button>
  </div>
</template>
