import time
from digi.xbee.models.status import NetworkDiscoveryStatus
from digi.xbee.models.options import DiscoveryOptions
from digi.xbee.devices import XBeeDevice
from digi.xbee.util import utils
from flask import Flask, render_template
from picamera import PiCamera

xbee = XBeeDevice('/dev/ttyAMA0', 9600)
xbee.open();


device_data = {}
devices = []

camera = PiCamera()
camera.resolution = (1920,1280)
camera.framerate = 15

sensorValue = 0
photoCount = 0

last_capture = time.time()
capture_interval = 1

session_running = False

def take_snapshot():
    global last_capture, capture_interval, photoCount
    if time.time() - last_capture > capture_interval:
        camera.capture('/home/pi/Projects/Thing-Ethnography-Kit/Software/MasterCamera/static/image%s.jpg'%photoCount)
        photoCount += 1
        print('capture')
        last_capture = time.time()

def data_received(xbee_message):
    global session_running
    if not(session_running):
        return
    address = xbee_message.remote_device.get_64bit_addr()
    data = xbee_message.data
    global device_data
    device_data[str(address)][1] = int.from_bytes(xbee_message.data, byteorder='big')
    print ("Received data from %s: %s" % (address, device_data[str(address)][1]))
    if device_data[str(address)][1] > 300:
        take_snapshot()

def device_discovered(remote):
    global device_data
    device_data[str(remote.get_64bit_addr())] = [remote.get_node_id(), 0];
    print('Discovered %s'%remote.get_64bit_addr())
    devices.append(remote)

def network_discovered(status):
    if status == NetworkDiscoveryStatus.ERROR_READ_TIMEOUT:
        print("error")
    elif status == NetworkDiscoveryStatus.SUCCESS:
        global session_running
        print("network discovered")
        session_running = True

def reload_network():
    print('reload')
    global device_data, devices, xnet
    devices = []
    device_data = {}
    xnet = xbee.get_network()
    xnet.start_discovery_process()

xbee.add_data_received_callback(data_received)

xnet = xbee.get_network()
xnet.set_discovery_options({DiscoveryOptions.APPEND_DD, DiscoveryOptions.DISCOVER_MYSELF})
xnet.add_device_discovered_callback(device_discovered)
xnet.add_discovery_process_finished_callback(network_discovered)
reload_network()
app = Flask(__name__, static_url_path = "/static", static_folder="static")

@app.route("/")
def home():
    #global sensorValue
    global photoCount, device_data
    photoURLs = []
    for i in range(0, photoCount):
        photoURLs.append('/static/image%s.jpg'%i)
    
    templateData = {
        'photoCount' : photoCount,
        'photoURLs' : photoURLs,
        'deviceData' : device_data
    }
    
    return render_template('main.html', **templateData)

@app.route('/reload-network')
def reload():
    reload_network()
    return(''), 204


if __name__ == "__main__":
    app.run(host='0.0.0.0', port=8010)
    
