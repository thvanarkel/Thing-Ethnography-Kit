from picamera import PiCamera
from time import sleep

import time
import grovepi

numleds = 4
ledPin = 7


# SETUP
grovepi.pinMode(ledPin, "OUTPUT");
grovepi.chainableRgbLed_init(ledPin, numleds)

camera = PiCamera()
camera.resolution = (1920,1280)
camera.framerate = 15

# PROGRAM

for i in range(5):
    sleep(5)
    grovepi.chainableRgbLed_test(ledPin, numleds, 7)
    camera.capture('/home/pi/Desktop/image%s.jpg' % i)
    sleep(0.5)
    grovepi.chainableRgbLed_test(ledPin, numleds, 0)
