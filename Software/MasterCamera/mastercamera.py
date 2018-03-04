from time import sleep
from digi.xbee.devices import XBeeDevice
from flask import Flask, render_template

device = XBeeDevice('/dev/ttyAMA0', 9600)
device.open();

sensorValue = 0
photoCount = 1

def data_received_callback(xbee_message):
    address = xbee_message.remote_device.get_64bit_addr()
    data = xbee_message.data
    global sensorValue
    sensorValue = int.from_bytes(xbee_message.data, byteorder='big')
    print ("Received data from %s: %s" % (address, sensorValue))

device.add_data_received_callback(data_received_callback)


app = Flask(__name__)

@app.route("/")
def hello():
    global sensorValue
    templateData = {
        'sensorValue' : sensorValue
    }
    return render_template('main.html', **templateData)

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=8080)
