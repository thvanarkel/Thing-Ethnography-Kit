from time import sleep
from digi.xbee.devices import XBeeDevice
from flask import Flask, render_template
from picamera import PiCamera

device = XBeeDevice('/dev/ttyAMA0', 9600)
device.open();

camera = PiCamera()
camera.resolution = (1920,1280)
camera.framerate = 15

sensorValue = 0
photoCount = 0

def data_received_callback(xbee_message):
    address = xbee_message.remote_device.get_64bit_addr()
    data = xbee_message.data
    global sensorValue
    global photoCount
    sensorValue = int.from_bytes(xbee_message.data, byteorder='big')
    print ("Received data from %s: %s" % (address, sensorValue))
    if sensorValue > 300:
        camera.capture('/home/pi/Projects/Thing-Ethnography-Kit/Software/MasterCamera/static/image%s.jpg'%photoCount)
        photoCount += 1
        print('capture')

device.add_data_received_callback(data_received_callback)



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

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=8080)
    
