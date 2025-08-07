import { gettext } from 'i18n'

AppSettingsPage({
  state: {
    devices: [],
    props: {},
  },

  onInit() {},

  setState(props) {
    this.state.props = props;
    const devicesJson = props.settingsStorage.getItem('devices');
    
    if (devicesJson) {
      try {
        const parsed = JSON.parse(devicesJson);
        if (Array.isArray(parsed)) {
          this.state.devices = parsed;
        }
      } catch (error) {
        console.error('JSON parse error:', error);
      }
    }
  },

  moveDevice(fromIndex, toIndex) {
    const devices = [...this.state.devices];
    const [moved] = devices.splice(fromIndex, 1);
    devices.splice(toIndex, 0, moved);
    this.state.devices = devices;
    this.state.initialSort = false;
    this.setItem();
  },

  editDevice(val, index) {
    device = this.state.devices[index]
    device.description = val
    this.state.devices[index] = device
    this.setItem()
  },

  deleteDevice(index) {
    this.state.devices = this.state.devices.filter((_, ind) => {
      return ind !== index
    })
    this.setItem()
  },

  setItem() {
    const newString = JSON.stringify(this.state.devices)
    this.state.props.settingsStorage.setItem('devices', newString)
    this.state.props.settingsStorage.setItem('updateDevices', 'true')
  },

  build(props) {
    this.setState(props);
    const contentItems = [];

    const toastVisible = props.settingsStorage.getItem('toastVisible') === 'true';
    const toastMessage = props.settingsStorage.getItem('toastMessage') || '';

    const tokenInput = TextInput({
      label: `🔑 ${gettext('fillToken')}`,
      labelStyle: { flex: 1 },
      subStyle: {
        height: 20,
        width: '102px',
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        fontSize: '12px',
        background: '#d4e2e2ff'
      },
      placeholder: gettext('pasteToken'),
      settingsKey: 'apiToken',
    });
    
    const loadBtn = Button({
      label: gettext('loadDevices'),
      style: { 
        marginLeft: '16px', 
        alignSelf: 'flex-end', 
        background: '#c5e9c1ff'
      },
      onClick: () => {
        const apiToken = props.settingsStorage.getItem('apiToken');
        if (!apiToken) {
          props.settingsStorage.setItem('toastMessage', `🔑 ${gettext('enterTokenFirst')}`);
          props.settingsStorage.setItem('toastVisible', 'true');

          setTimeout(() => {
            props.settingsStorage.setItem('toastVisible', 'false');
          }, 3000);
        } else {
          props.settingsStorage.setItem('loadDevices', 'true');
        }
      }
    });

    const controls = View(
      { 
        style: { 
          display: 'flex', 
          flexDirection: 'row', 
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '10px' 
        }
      },
      [
        tokenInput, 
        loadBtn
      ]
    );

    this.state.devices.forEach((item, index) => {
      contentItems.push(
        View(
          {
            style: {
              borderBottom: '1px solid #eaeaea',
              padding: '6px 0',
              marginBottom: '6px',
              display: 'flex',
              flexDirection: 'row'
            }
          },
          [
            View(
              { style: { marginRight: '10px', flexDirection: 'column' } },
              [
                Button({
                  label: '↑',
                  style: {
                    fontSize: '16px',
                    borderRadius: '30px',
                    background: '#93bbedff',
                    color: 'black'
                  },
                  onClick: () => index > 0 && this.moveDevice(index, index - 1)
                }),
                Button({
                  label: '↓',
                  style: {
                    fontSize: '16px',
                    borderRadius: '30px',
                    background: '#93bbedff',
                    color: 'black'
                  },
                  onClick: () => index < this.state.devices.length - 1 && this.moveDevice(index, index + 1)
                })
              ]
            ),
            View(
              { style: { flex: 1, padding: '8px 8px' } },
              [
                TextInput({
                  value: item.description,
                  onChange: (val) => {
                    if (val.length > 0 && val.length <= 200) {
                      this.editDevice(val, index);
                    }
                  }
                })
              ]
            ),
            Button({
              label: '❌',
              style: {
                borderRadius: '30px',
                background: '#D85E33'
              },
              onClick: () => this.deleteDevice(index)
            })
          ]
        )
      );
    });
    
    return View(
      { style: { padding: '12px 20px' } },
      [
        controls,
        contentItems.length > 0 && View(
          {
            style: {
              marginTop: '12px',
              padding: '10px',
              border: '1px solid #eaeaea',
              borderRadius: '6px',
              backgroundColor: 'white'
            }
          },
          contentItems
        ),
        Toast({
          message: toastMessage,
          vertical: 'top',
          visible: toastVisible,
          onClose: () => {
            props.settingsStorage.setItem('toastVisible', 'false');
          }
        })
      ]
    );
  }
})
