# Setting up the system

**1. Install Raspberry Pi NOOBS**

**2. Update rpi** 

```
$ sudo apt-get update
$ sudo apt-get dist-upgrade
$ sudo raspi-update
```

**3. Configure rpi**
```
$ raspi-config
```
 5. Interfacing options
 Enable camera
 Enable SSH
 Enable VNC

Change password

**3. Change Serial port**  
```
$ sudo nano /boot/config.txt
```

Add the following lines to the bottom:

```
enable_uart=1
dtoverlay=pi3-miniuart-bt
```

Then:

```
$ sudo systemctl stop serial-getty@ttyS0.service
$ sudo systemctl disable serial-getty@ttyS0.service
```

And then in:

``` 	
$ sudo nano /boot/cmdline.txt
```

Remove the following: `console=serial0,115200`

**4. Update node.js**

```
$ sudo -i
$ apt-get remove node red -y
$ apt-get remove nodejs nodejs-legacy -y

$ curl -sL https://deb.nodesource.com/setup_9.x | sudo -E bash -
$ sudo apt install -y nodejs
```
Then verify the installation:

```
$ node --version
$ npm --version
```

**5. Install nodemon**

```
npm install nodemon -g
```

**6. Clone project files**

```
$ git clone https://github.com/thvanarkel/Thing-Ethnography-Kit.git
```

**7. Install dependencies**
```
$ cd ../Thing-Ethnography-Kit/Software/Bridge
$ npm install serialport
$ npm install digimesh
$ npm install moment
$ npm install node-json-db
$ npm install ws
$ npm install pi-camera
```

Replace digimesh.js with the same file from https://github.com/thvanarkel/node-digimesh
