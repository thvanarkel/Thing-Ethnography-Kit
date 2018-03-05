import time
from digi.xbee.devices import XBeeDevice
from flask import Flask, render_template
from picamera import PiCamera

xbee = XBeeDevice('/dev/ttyAMA0', 9600)
xbee.open();

camera = PiCamera()
camera.resolution = (1920,1280)
camera.framerate = 15

sensorValue = 0
photoCount = 0

last_capture = time.time()
capture_interval = 1

session_running = False

def take_snapshot():
    if time.time() - last_capture > capture_interval:
        camera.capture('/home/pi/Projects/Thing-Ethnography-Kit/Software/MasterCamera/static/image%s.jpg'%photoCount)
        photoCount += 1
        print('capture')
        last_capture = time.time()

def data_received_callback(xbee_message):
    if not(session_running):
        return
    address = xbee_message.remote_device.get_64bit_addr()
    data = xbee_message.data
    global sensorValue
    global photoCount
    sensorValue = int.from_bytes(xbee_message.data, byteorder='big')
    print ("Received data from %s: %s" % (address, sensorValue))
    if sensorValue > 300:
        take_snapshot()

def device_discovered(remote):
    print('Discovered %s'%remote.get_64bit_addr())

xnet = xbee.get_network()
xnet.add_device_discovered_callback(device_discovered)
xnet.start_discovery_process()


app = Flask(__name__, static_url_path = "/static", static_folder="static")

@app.route("/")
def hello():
    #global sensorValue
    global photoCount
    photoURLs = []
    for i in range(0, photoCount):
        photoURLs.append('/static/image%s.jpg'%i) 
    
    templateData = {
        'sensorValue' : sensorValue,
        'photoCount' : photoCount,
        'photoURLs' : photoURLs
    }
    
    return render_template('main.html', **templateData)

#if __name__ == "__main__":
    #app.run(host='0.0.0.0', port=8080)
    
