#include <XBee.h>
#include <ChainableLED.h>

const int NUM_LEDS = 4;

XBee xbee = XBee();
XBeeResponse response = XBeeResponse();
ZBRxResponse rx = ZBRxResponse();
ModemStatusResponse msr = ModemStatusResponse();

ChainableLED leds = ChainableLED(6, 7, NUM_LEDS);

void setup() {
  // put your setup code here, to run once:
  Serial.begin(9600);
  xbee.begin(Serial);
  leds.init();

}

void loop() {
  // put your main code here, to run repeatedly:
  xbee.readPacket();
  if(xbee.getResponse().isAvailable()) {
    if (xbee.getResponse().getApiId() == ZB_RX_RESPONSE) {
      
      leds.setColorRGB(0, 255, 0, 0);
      delay(400);
      leds.setColorRGB(0, 0, 0, 0);

      xbee.getResponse().getZBRxResponse(rx);
      uint8_t analogMSB = rx.getData(0);
      uint8_t analogLSB = rx.getData(1);
      int value = analogLSB + (analogMSB * 256);
      Serial.println(value);
      int ledValue = map(value, 0, 1024, 0, 255);
      leds.setColorRGB(1, ledValue, ledValue, ledValue);
    }
  }
}
