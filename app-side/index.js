import { BaseSideService } from '@zeppos/zml/base-side'
import { settingsLib } from '@zeppos/zml/base-side'
import { API_URL } from './../utils/constants'

let cachedDevices = []

async function getDevicesList() {
  try {
    const apiToken = settingsLib.getItem('apiToken')
    if (!apiToken) {
      console.error('API Token not found')
      return []
    }
    const response = await fetch({
      url: API_URL + '/intercom',
      method: 'GET',
      headers: {
        'Authorization': apiToken
      }
    })
    const resBody = typeof response.body === 'string' ? JSON.parse(response.body) : response.body
    
    const filteredDevices = (resBody.data?.devices || []).map(device => ({
      id: device.id,
      description: device.description
    }));

    filteredDevices.sort((a, b) => a.id - b.id);
    return filteredDevices
  } catch (error) {
    console.error("Failed to load devices:", error);
    return []
  }
};

async function openDevice(id, res) {
  try {
    const apiToken = settingsLib.getItem('apiToken')
    if (!apiToken) {
      console.error('API Token not found')
      res(null, {
        result: "ERROR",
      });
    }
    const response = await fetch({
      url: API_URL + `/${id}/open`,
      method: 'POST',
      headers: {
        'Authorization': apiToken
      }
    })
    const result = response.status === 200 ? "OPENED" : "FAILED"

    res(null, {
      result: result,
    });
  } catch (error) {
    res(null, {
      result: "ERROR",
    });
  }
};

function getStoredDevices() {
  if (cachedDevices.length > 0) {
    return cachedDevices
  }
  
  try {
    const devicesJson = settingsLib.getItem('devices')
    if (devicesJson) {
      cachedDevices = JSON.parse(devicesJson) || []
      return cachedDevices
    }
  } catch (error) {
    console.error('Failed to parse devices:', error)
  }
  
  return []
};

AppSideService(
  BaseSideService({
    onInit() {},
    onRequest(req, res) {
      switch (req.method) {
        case "GET_DEVICES":
          res(null, { result: getStoredDevices() })
          break
          
        case "OPEN_DEVICE":
          if (req.params?.id) {
            openDevice(req.params.id, res)
          } else {
            res({ code: 400, message: "Missing device ID" })
          }
          break
          
        default:
          res({ code: 404, message: "Unknown method" })
      }
    },
    onSettingsChange({ key, newValue }) {
      if (key === "loadDevices" && newValue === "true") {
        getDevicesList()
          .then(devices => {
            cachedDevices = devices
            settingsLib.setItem("devices", JSON.stringify(devices))
            settingsLib.setItem("loadDevices", "false")
          })
          .catch(err => {
            console.error("Failed to load devices:", err)
            settingsLib.setItem("loadDevices", "false")
          })
      } else if (key === "updateDevices" && newValue === "true") {
        this.call({
          method: "UPDATE_DEVICE_LIST"
        }).then(() => {
          cachedDevices = []
          settingsLib.setItem("updateDevices", "false")
        }).catch(err => {
          console.error("Failed to update devices:", err)
          settingsLib.setItem("updateDevices", "false")
        })
      }
    },
    onRun() {},
    onDestroy() {}
  })
)
