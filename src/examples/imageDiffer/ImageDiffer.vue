<script setup lang="ts">
import { ref } from 'vue'
import {
  Rectangle,
  StayImage,
  type ListenerProps,
  type StayTools,
  StayCanvas
} from 'vue-stay-canvas'
import { DragListener } from './listeners'

const width = 600
const height = 600
const container = new Rectangle({
  x: 0,
  y: 0,
  width,
  height
})

const listeners = ref<ListenerProps[]>()

const imagewidth = 200
const imageheight = 300
const splitbarWidth = 10
const splitbarHeight = height
const leftImageSrc = `https://picsum.photos/${imagewidth}/${imageheight}?id=1`
const rightImageSrc = `https://picsum.photos/${imagewidth}/${imageheight}?id=2`

function init({ appendChild, forceUpdateCanvas }: StayTools) {
  const {
    rectangle: imageRectangle,
    scaleRatio,
    offsetX,
    offsetY
  } = container.computeFitInfo(imagewidth, imageheight)
  const { rectangle: splitBarRectangle } = container.computeFitInfo(splitbarWidth, splitbarHeight)
  const leftImage = appendChild({
    className: 'leftImage',
    shape: new StayImage({
      src: leftImageSrc,
      x: imageRectangle.x,
      y: imageRectangle.y,
      width: imageRectangle.width,
      height: imageRectangle.height,
      imageLoaded: () => {
        forceUpdateCanvas()
      }
    })
  })
  const rightImage = appendChild({
    className: 'rightImage',
    shape: new StayImage({
      src: rightImageSrc,
      x: imageRectangle.x + imageRectangle.width / 2,
      y: imageRectangle.y,
      width: imageRectangle.width / 2,
      height: imageRectangle.height,
      sx: imagewidth / 2,
      swidth: imagewidth / 2,
      imageLoaded: () => {
        forceUpdateCanvas()
      }
    })
  })
  appendChild({
    className: 'splitBar',
    shape: splitBarRectangle.update({
      props: { color: 'black', type: 'fill' }
    })
  })
  listeners.value = [DragListener(leftImage, rightImage, scaleRatio, offsetX, offsetY)]
}
</script>
<template>
  <StayCanvas
    :mounted="init"
    :width="width"
    :height="height"
    :listenerList="listeners"
    :layers="2"
  />
</template>
