import * as hmUI from '@zos/ui'
import { showToast } from '@zos/interaction'
import { getText } from '@zos/i18n'
import { getDeviceInfo, SCREEN_SHAPE_SQUARE } from '@zos/device'
import { log as Logger } from '@zos/utils'
import { BasePage } from '@zeppos/zml/base-page'
import {
  TITLE_TEXT_STYLE,
  TIPS_TEXT_STYLE,
  SCROLL_LIST,
} from 'zosLoader:./index.page.[pf].layout.js'
import { getScrollListDataConfig } from './../../utils/index'

const logger = Logger.getLogger('device-page')

Page(
  BasePage({
    state: {
      scrollList: null,
      tipText: null,
      dataList: [],
      devices: [],
    },

    onInit() {
      this.getDevicesFromService()
    },

    build() {
      if (getDeviceInfo().screenShape !== SCREEN_SHAPE_SQUARE) {
        hmUI.createWidget(hmUI.widget.TEXT, {
          ...TITLE_TEXT_STYLE,
          text: getText('devices'),
        })
      }

      this.createDeviceList(false)
    },

    getDevicesFromService() {
      showToast({content: getText('loading')})

      this.request({
        method: 'GET_DEVICES'
      })
        .then((response) => {
          const devices = response.result || []
          this.state.devices = devices
          this.state.dataList = this.mapDevicesToDataList(devices)

          this.createDeviceList()
        })
        .catch((error) => {
          logger.error('Failed to get devices:', error)
          showToast({content: getText('loadError')})

          this.createDeviceList()
        })
    },

    mapDevicesToDataList(devices) {
      return devices.map((device) => ({
        id: device.id,
        name: device.description,
        img_src: 'device.png',
      }))
    },

    changeUI(showEmpty) {
      const { dataList } = this.state

      if (showEmpty) {
        if (dataList.length === 0) {
          !this.state.tipText &&
            (this.state.tipText = hmUI.createWidget(hmUI.widget.TEXT, {
              ...TIPS_TEXT_STYLE
            }))
        }
        const isTip = dataList.length === 0

        this.state.refreshText && this.state.refreshText.setProperty(hmUI.prop.VISIBLE, false)
        this.state.tipText && this.state.tipText.setProperty(hmUI.prop.VISIBLE, isTip)
        this.state.scrollList && this.state.scrollList.setProperty(hmUI.prop.VISIBLE, !isTip)
      } else {
        !this.state.refreshText &&
          (this.state.refreshText = hmUI.createWidget(hmUI.widget.TEXT, {
            ...TIPS_TEXT_STYLE,
            text: ' '
          }))

        this.state.tipText && this.state.tipText.setProperty(hmUI.prop.VISIBLE, false)
        this.state.refreshText.setProperty(hmUI.prop.VISIBLE, true)
        this.state.scrollList && this.state.scrollList.setProperty(hmUI.prop.VISIBLE, false)
      }
    },

    createDeviceList(showEmpty = true) {
      const _scrollListItemClick = (list, index, key) => {
        this.openDevice(index)
      }

      const { scrollList, dataList } = this.state

      this.changeUI(showEmpty)

      const dataTypeConfig = getScrollListDataConfig(
        dataList.length === 0 ? -1 : 0,
        dataList.length
      )

      if (scrollList) {
        scrollList.setProperty(hmUI.prop.UPDATE_DATA, {
          data_array: dataList,
          data_count: dataList.length,
          data_type_config: [{ start: 0, end: dataList.length, type_id: 2 }],
          data_type_config_count: dataTypeConfig.length,
          on_page: 1
        })
      } else {
        this.state.scrollList = hmUI.createWidget(hmUI.widget.SCROLL_LIST, {
          ...(SCROLL_LIST || {}),
          data_array: dataList,
          data_count: dataList.length,
          data_type_config: dataTypeConfig,
          data_type_config_count: dataTypeConfig.length,
          item_enable_horizon_drag: true,
          item_drag_max_distance: -120,
          on_page: 1,
          item_click_func: _scrollListItemClick
        })
      }
    },

    openDevice(index) {
      const device = this.state.devices[index]
      if (!device) return

      logger.debug(`Opening device: ${device.id} - ${device.description}`)

      showToast({content: getText('opening')})

      this.request({
        method: 'OPEN_DEVICE',
        params: { id: device.id },
      })
        .then(({ result }) => {
          showToast({
            content: result === 'OPENED'
              ? getText('openedSuccess')
              : getText('openFailed')
          })
        })
        .catch((error) => {
          logger.error('Open device error:', error)
          showToast({content: getText('connectionError')})
        })
    },

    onCall(req) {
      if (req.method === "UPDATE_DEVICE_LIST") {
        this.getDevicesFromService()
        this.createDeviceList(false)
      }
    }
  })
)
