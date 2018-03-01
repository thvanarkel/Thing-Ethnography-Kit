from picamera import PiCamera
from time import sleep

# SETUP

camera = PiCamera()
camera.resolution = (1920,1280)
camera.framerate = 15

# PROGRAM

for i in range(5):
    sleep(5)
    camera.capture('/home/pi/Desktop/image%s.jpg' % i)
