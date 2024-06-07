import type { Ref } from 'vue'
import {
  type ActionEvent,
  ALLSTATE,
  DEFAULTSTATE,
  type Dict,
  type ListenerProps,
  Point,
  type RectangleAttr,
  type StayChild,
  type StayChildProps
} from 'vue-stay-canvas'
import { type RectLike, SelectRectangle } from './utils'

type ListenerPropsFunc = (payload: Dict, currentSelectLabel: Ref<RectLike | null>) => ListenerProps
export const DragListener: ListenerProps = {
  name: 'dragListener',
  event: ['dragstart', 'drag', 'dragend'],
  state: ALLSTATE,
  callback: ({ e, composeStore, tools: { createChild, appendChild, updateChild, fix, log } }) => {
    const eventMap = {
      dragstart: () => ({
        childAppend: false,
        dragStartPosition: new Point(e.x, e.y),
        dragChild: createChild({
          shape: new SelectRectangle({
            x: e.x,
            y: e.y,
            width: 0,
            height: 0,
            props: { color: 'white' }
          }),
          className: 'annotation'
        })
      }),
      drag: () => {
        const { childAppend, dragStartPosition, dragChild } = composeStore
        if (e.state !== DEFAULTSTATE) {
          return
        }
        const x = Math.min(dragStartPosition.x, e.x)
        const y = Math.min(dragStartPosition.y, e.y)
        const width = Math.abs(dragStartPosition.x - e.x)
        const height = Math.abs(dragStartPosition.y - e.y)

        const returnCompose: Record<string, any> = {}
        if (!childAppend) {
          returnCompose.dragChild = appendChild({
            shape: dragChild.shape,
            className: dragChild.className
          })
          returnCompose.childAppend = true
        } else {
          updateChild({
            child: dragChild,
            shape: (dragChild.shape as SelectRectangle).update({
              x,
              y,
              width,
              height
            })
          })
        }
        return returnCompose
      },
      dragend: () => {
        if (e.state !== DEFAULTSTATE) {
          return
        }
        composeStore = {}
        fix()
        log()
      }
    }
    return eventMap
  }
}

export const SelectListener: ListenerPropsFunc = (payload, currentSelectLabel) => ({
  name: 'selectListener',
  event: 'click',
  state: `${DEFAULTSTATE}|annotationSelected`,
  callback: ({ stateStore, e, tools: { updateChild, getChildrenBySelector, switchState } }) => {
    const annotations = getChildrenBySelector('.annotation') as StayChild[]
    let selectedAnnotation: StayChild | undefined = undefined

    annotations.forEach((annotation) => {
      let className = 'annotation'
      let layer = 0
      let rectState = 'default'
      if (!selectedAnnotation && annotation.shape.contains(new Point(e.x, e.y))) {
        selectedAnnotation = annotation
        className = 'annotation:selected'
        layer = -1
        rectState = 'selected'
      }
      updateChild({
        child: annotation,
        shape: annotation.shape.update({ props: { state: rectState } }),
        className,
        layer
      })
    })

    if (selectedAnnotation) {
      const rect = (selectedAnnotation as StayChild).shape as SelectRectangle
      // setCurrentSelectLabel(
      //   rect.screenToWorld(payload.offsetX, payload.offsetY, payload.scaleRatio)
      // )
      currentSelectLabel.value = rect.screenToWorld(
        payload.offsetX,
        payload.offsetY,
        payload.scaleRatio
      )
      switchState('annotationSelected')
      stateStore.set('selectedAnnotation', selectedAnnotation)
    } else {
      // setCurrentSelectLabel(undefined)
      currentSelectLabel.value = null
      switchState(DEFAULTSTATE)
    }
  }
})

export const DetectListener: ListenerProps = {
  name: 'detectListener',
  event: 'mousemove',
  state: 'annotationSelected',
  callback: ({ e, stateStore, tools: { changeCursor } }) => {
    const selectedAnnotation: StayChildProps<SelectRectangle> = stateStore.get('selectedAnnotation')

    if (!selectedAnnotation) {
      return
    }
    const nearOffset = 5
    const rect = selectedAnnotation.shape
    interface updateSelectRectangleConditionProp {
      cursor: string
      name: string
      condition: () => boolean
      updateOffset: (props: {
        offset: Point
        rect: SelectRectangle
        e: ActionEvent
      }) => Partial<RectangleAttr>
    }
    const updateSelectRectangleInfos: updateSelectRectangleConditionProp[] = [
      {
        cursor: 'nwse-resize',
        name: 'leftTop',
        condition: () => e.point.near(rect.leftTop, nearOffset),
        updateOffset: ({ e, rect }) => ({
          x: Math.min(e.x, rect.rightTop.x),
          y: Math.min(e.y, rect.rightBottom.y),
          width: Math.max(rect.rightTop.x - e.x, 0),
          height: Math.max(rect.rightBottom.y - e.y, 0)
        })
      },
      {
        cursor: 'nwse-resize',
        name: 'rightTop',
        condition: () => e.point.near(rect.rightBottom, nearOffset),
        updateOffset: ({ e, rect }) => ({
          width: Math.max(e.x - rect.x, 0),
          height: Math.max(e.y - rect.y, 0)
        })
      },
      {
        cursor: 'nesw-resize',
        name: 'leftBottom',
        condition: () => e.point.near(rect.leftBottom, nearOffset),
        updateOffset: ({ e, rect }) => ({
          x: Math.min(e.x, rect.rightTop.x),
          width: Math.max(rect.rightBottom.x - e.x, 0),
          height: Math.max(e.y - rect.y, 0)
        })
      },
      {
        cursor: 'nesw-resize',
        name: 'rightBottom',
        condition: () => e.point.near(rect.rightTop, nearOffset),
        updateOffset: ({ e, rect }) => ({
          y: Math.min(e.y, rect.rightBottom.y),
          width: Math.max(e.x - rect.x, 0),
          height: Math.max(rect.rightBottom.y - e.y, 0)
        })
      },
      {
        cursor: 'ew-resize',
        name: 'leftBorder',
        condition: () => e.point.nearLine(rect.leftBorder, nearOffset),
        updateOffset: ({ e, rect }) => ({
          x: Math.min(e.x, rect.rightBorder.x1),
          width: Math.max(rect.rightBorder.x1 - e.x, 0)
        })
      },
      {
        cursor: 'ew-resize',
        name: 'rightBorder',
        condition: () => e.point.nearLine(rect.rightBorder, nearOffset),
        updateOffset: ({ e, rect }) => ({
          width: Math.max(e.x - rect.x, 0)
        })
      },
      {
        cursor: 'ns-resize',
        name: 'topBorder',
        condition: () => e.point.nearLine(rect.topBorder, nearOffset),
        updateOffset: ({ e, rect }) => ({
          y: Math.min(e.y, rect.bottomBorder.y1),
          height: Math.max(rect.bottomBorder.y1 - e.y, 0)
        })
      },
      {
        cursor: 'ns-resize',
        name: 'bottomBorder',
        condition: () => e.point.nearLine(rect.bottomBorder, nearOffset),
        updateOffset: ({ e, rect }) => ({
          height: Math.max(e.y - rect.y, 0)
        })
      },
      {
        cursor: 'move',
        name: 'move',
        condition: () => rect.contains(e.point),
        updateOffset: ({ offset, rect }) => ({
          x: rect.x + offset.x,
          y: rect.y + offset.y
        })
      },
      {
        cursor: 'default',
        name: 'default',
        condition: () => !rect.contains(e.point),
        updateOffset: () => ({})
      }
    ]

    stateStore.set('updateSelectRectangleInfos', updateSelectRectangleInfos)

    for (const cursor in updateSelectRectangleInfos) {
      const info = updateSelectRectangleInfos[cursor]
      const coditionSatisfied = info.condition()
      if (coditionSatisfied) {
        return changeCursor(info.cursor)
      }
    }
  }
}

export const ResizeListener: ListenerPropsFunc = (payload, currentSelectLabel) => ({
  name: 'resizeListener',
  event: ['dragstart', 'drag', 'dragend'],
  state: 'annotationSelected',
  callback: ({ e, stateStore, composeStore, tools: { updateChild, log, switchState } }) => {
    return {
      dragstart: () => {
        console.log('dragstart')
        const updateSelectRectangleInfos = stateStore.get('updateSelectRectangleInfos')
        let updateFunc = null
        let updateName = ''
        for (const cursor in updateSelectRectangleInfos) {
          const info = updateSelectRectangleInfos[cursor]
          const coditionSatisfied = info.condition()
          if (coditionSatisfied) {
            updateFunc = info.updateOffset
            updateName = info.name
            break
          }
        }
        if (updateName === '' || updateName === 'default') {
          return switchState(DEFAULTSTATE)
        }

        return {
          selectedAnnotationShape: stateStore.get('selectedAnnotation').shape.copy(),
          dragStartPosition: new Point(e.x, e.y),
          updateFunc
        }
      },
      drag: () => {
        const { selectedAnnotationShape, dragStartPosition, updateFunc } = composeStore
        if (!selectedAnnotationShape || !dragStartPosition || !updateFunc) return
        const offsetX = e.x - dragStartPosition.x
        const offsetY = e.y - dragStartPosition.y
        const annotation = stateStore.get('selectedAnnotation')
        const rect = annotation.shape as SelectRectangle

        const updatedRect = rect.update({
          ...updateFunc({
            e,
            offset: new Point(offsetX, offsetY),
            rect: selectedAnnotationShape
          })
        })
        const child = updateChild({
          child: annotation,
          shape: updatedRect
        })
        const _rect = child.shape as SelectRectangle
        // setCurrentSelectLabel(
        //   _rect.screenToWorld(payload.offsetX, payload.offsetY, payload.scaleRatio)
        // )
        currentSelectLabel.value = _rect.screenToWorld(
          payload.offsetX,
          payload.offsetY,
          payload.scaleRatio
        )
      },
      dragend: () => {
        composeStore = {}
        log()
      }
    }
  }
})

export const saveListener: ListenerProps = {
  name: 'save',
  event: 'save',
  state: ALLSTATE,
  callback: ({ tools: { getChildrenBySelector }, payload }) => {
    const annotations = getChildrenBySelector('.annotation')
    annotations.forEach((annotation) => {
      const { shape } = annotation
      const rect = shape as SelectRectangle

      rect.screenToWorld(payload.offsetX, payload.offsetY, payload.scaleRatio)
    })
  }
}
