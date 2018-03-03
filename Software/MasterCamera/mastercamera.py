#from picamera import PiCamera
#from time import sleep
#from digi.xbee.devices import XBeeDevice
import remi.gui as gui
from remi import start, App

# VARIABLES

#camera = PiCamera()
#camera.resolution = (1920,1280)
#camera.framerate = 15

# device = XBeeDevice('/dev/ttyAMA0', 9600)
# device.open();

# sensorValue = 0
# photoCount = 1

# PROGRAM

class MasterCamera(App):
    def __init__(self, *args):
        super(MasterCamera, self).__init__(*args)

    def main(self):
        wid = gui.Widget(width=375, margin='0px auto', style={'display': 'block', 'overflow': 'hidden'})

        table_title = gui.Label('Connected devices', margin='20px 0px', width='80%', height='50%', style={'font-weight': 'bold'})
        table = gui.Table.new_from_list([('ID', 'Type', 'Last Value'),
                                   ('101', 'Danny', 'Young'),
                                   ('102', 'Christine', 'Holand'),
                                   ('103', 'Lars', 'Gordon'),
                                   ('104', 'Roberto', 'Robitaille'),
                                   ('105', 'Maria', 'Papadopoulos')], width=365, height=200, margin='10px')

        bt = gui.Button('Start session', width=200, height=30)
        bt.style['margin'] = 'auto 10px'

        # appending a widget to another, the first argument is a string key
        wid.append(bt)
        wid.append(table_title)
        wid.append(table)

        # returning the root widget
        return wid

start(MasterCamera ,address='127.0.0.1', port=8082, multiple_instance=True,enable_file_cache=True, update_interval=0.1, start_browser=False)
# def data_received_callback(xbee_message):
#     address = xbee_message.remote_device.get_64bit_addr()
#     data = xbee_message.data
#     global sensorValue
#     sensorValue = int.from_bytes(xbee_message.data, byteorder='big')
#     print ("Received data from %s: %s" % (address, sensorValue))
#
# device.add_data_received_callback(data_received_callback)
#
# while 1:
#     if sensorValue > 300:
#         camera.capture('/home/pi/Desktop/images/image%s.jpg' % photoCount)
#         photoCount = photoCount + 1
#         sleep(2)
