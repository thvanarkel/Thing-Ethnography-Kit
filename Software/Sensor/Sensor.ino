#include <XBee.h>

const bool ANALOG = true;
const bool PIN = A0; 

XBee xbee = XBee();

uint8_t payload[] = { 0, 0 };

XBeeAddress64 addr64 = XBeeAddress64(0x00000000, 0x00000000);
ZBTxRequest zbTx = ZBTxRequest(addr64, payload, sizeof(payload));
ZBTxStatusResponse txStatus = ZBTxStatusResponse();

int value = 0;

void setup() {
  // put your setup code here, to run once:
  Serial.begin(9600);
  xbee.setSerial(Serial);
}

void loop() {
  // put your main code here, to run repeatedly:
  if (ANALOG) {
    value = analogRead(PIN);
    payload[0] = value >> 8 & 0xff;
    payload[1] = value & 0xff;
  } else {
    value = digitalRead(PIN);
    payload[0] = value & 0xff;
    payload[1] = value & 0xff;
  }
  
  xbee.send(zbTx);

  delay(1000);
}
