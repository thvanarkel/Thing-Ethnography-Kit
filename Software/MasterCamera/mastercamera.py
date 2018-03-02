from picamera import PiCamera
from time import sleep
from digi.xbee.devices import XBeeDevice

# VARIABLES

camera = PiCamera()
camera.resolution = (1920,1280)
camera.framerate = 15

device = XBeeDevice('/dev/ttyAMA0', 9600)
device.open();

sensorValue = 0
photoCount = 1

# PROGRAM

def data_received_callback(xbee_message):
    address = xbee_message.remote_device.get_64bit_addr()
    data = xbee_message.data
    global sensorValue
    sensorValue = int.from_bytes(xbee_message.data, byteorder='big')
    print ("Received data from %s: %s" % (address, sensorValue))

device.add_data_received_callback(data_received_callback)

while 1:
    if sensorValue > 300:
        camera.capture('/home/pi/Desktop/images/image%s.jpg' % photoCount)
        photoCount = photoCount + 1
        sleep(2)
