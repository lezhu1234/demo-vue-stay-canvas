<script setup lang="ts">
// import { Rectangle, StayCanvas, StayChild } from 'vue-stay-canvas/types'
import {
  Rectangle,
  StayCanvas,
  StayChild,
  type Dict,
  type ListenerProps,
  type StayTools
} from 'vue-stay-canvas'
import { gsap } from 'gsap'

import { ref } from 'vue'
import * as listeners from './listeners'

function h(a: number) {
  return a >= 0 ? 0 : 1
}

const width = 600
const height = 600
const backgroundColorList = [
  ['#a18cd1', '#fbc2eb'],
  ['#f6d365', '#fda085'],
  ['#a1c4fd', '#c2e9fb'],
  ['#d4fc79', '#96e6a1'],
  ['#84fab0', '#8fd3f4']
]
const virtualCtx = document.createElement('canvas').getContext('2d')
const childWidth = ref<number>(width)

const offset = { x: 0 }
const fullWidth = backgroundColorList.length * childWidth.value
const listenerList = ref<ListenerProps[]>([])

const wrapX = gsap.utils.wrap((1 - backgroundColorList.length) * childWidth.value, childWidth.value)

const proxy = ref({
  x: 0,
  modifiers: {
    x: wrapX
  }
})
const timer = ref<gsap.core.Tween>(gsap.delayedCall(1, moveSlide, [2, 1]))
const timeLines = ref<Dict<gsap.core.Timeline>>({})

function init({ appendChild, updateChild }: StayTools) {
  const children: StayChild<Rectangle>[] = []
  backgroundColorList.forEach((color, index) => {
    const gradient = virtualCtx?.createLinearGradient(0, 0, 0, height)
    gradient?.addColorStop(0, color[0])
    gradient?.addColorStop(1, color[1])
    children.push(
      appendChild({
        className: 'c' + index,
        shape: new Rectangle({
          x: (index - backgroundColorList.length + 1) * childWidth.value,
          y: 0,
          width: childWidth.value,
          height,
          props: {
            color: gradient!,
            type: 'fill'
          }
        })
      })
    )
  })

  const toValue: gsap.TweenVars = {
    x: fullWidth,
    duration: 1,
    ease: 'none',
    onUpdate: () => {
      const offsetX = wrapX(gsap.getProperty(offset, 'x') as number)
      children.forEach((child, i) => {
        updateChild({
          child,
          shape: child.shape.update({
            x: wrapX(offsetX + (i - children.length + 1) * childWidth.value)
          })
        })
      })
    }
  }

  timeLines.value.main = gsap.timeline().to(offset, toValue).pause()
  timer.value.restart(true)

  listenerList.value = [
    listeners.dragListener({
      timer,
      offset,
      fullWidth,
      wrapX,
      timeLines: timeLines.value,
      moveSlide,
      proxy: proxy.value
    })
  ]
}

function moveSlide(duration: number, offset: number) {
  if (typeof timeLines.value.slide !== 'undefined') {
    timeLines.value.slide.kill()
  }
  let currentX = gsap.getProperty(proxy.value, 'x') as number
  let currentIndex = Math.floor(currentX / childWidth.value)
  currentIndex = wrapX(currentIndex + h((2 * currentIndex + 1) * childWidth.value - 2 * currentX))

  let targetX = (currentIndex + offset) * childWidth.value
  timeLines.value.slide = gsap
    .timeline({
      onUpdate: () => {
        const x = gsap.getProperty(proxy.value, 'x') as number
        timeLines.value.main.progress(((x + 2 * fullWidth) % fullWidth) / fullWidth)
      }
    })
    .to(proxy.value, { x: targetX, duration })

  timer.value.delay(duration)
  timer.value.restart(true)
}
</script>
<template>
  <button @click="() => moveSlide(1, -1)">prev</button>
  <button @click="() => moveSlide(1, 1)">next</button>
  <StayCanvas :mounted="init"  :listenerList="listenerList" />
</template>
