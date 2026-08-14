// Porte de server/src/networkmessage.cpp + client/src/framework/net/{outputmessage,inputmessage}.
//
// Tudo little-endian, como o protocolo do Tibia. Strings sao [u16 tamanho][bytes latin-1] --
// nao UTF-8: o protocolo 8.60 e byte a byte, entao um nome com acento ocupa 1 byte por caractere.

const HEADER_SIZE = 2;

export class OutputMessage {
  constructor(capacity = 65536) {
    this.buffer = new Uint8Array(capacity);
    this.view = new DataView(this.buffer.buffer);
    this.length = 0;
  }

  addByte(value) {
    this.view.setUint8(this.length, value & 0xff);
    this.length += 1;
    return this;
  }

  addU16(value) {
    this.view.setUint16(this.length, value & 0xffff, true);
    this.length += 2;
    return this;
  }

  addU32(value) {
    this.view.setUint32(this.length, value >>> 0, true);
    this.length += 4;
    return this;
  }

  addU64(value) {
    this.view.setBigUint64(this.length, BigInt(value), true);
    this.length += 8;
    return this;
  }

  addString(text) {
    const str = String(text);
    this.addU16(str.length);
    for (let i = 0; i < str.length; i++) {
      this.view.setUint8(this.length + i, str.charCodeAt(i) & 0xff);
    }
    this.length += str.length;
    return this;
  }

  /** Bytes da mensagem sem o header de tamanho. */
  getBody() {
    return this.buffer.slice(0, this.length);
  }

  /** Bytes como saem no fio: [u16 tamanho][corpo]. */
  toWire() {
    const out = new Uint8Array(HEADER_SIZE + this.length);
    new DataView(out.buffer).setUint16(0, this.length, true);
    out.set(this.buffer.slice(0, this.length), HEADER_SIZE);
    return out;
  }

  toHex() {
    return Array.from(this.getBody())
      .map((b) => b.toString(16).padStart(2, '0'))
      .join(' ');
  }
}

export class InputMessage {
  constructor(bytes) {
    this.buffer = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    this.view = new DataView(this.buffer.buffer, this.buffer.byteOffset, this.buffer.byteLength);
    this.position = 0;
  }

  /** Le a partir do fio: consome o header de tamanho e devolve a mensagem posicionada no corpo. */
  static fromWire(bytes) {
    const raw = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    const view = new DataView(raw.buffer, raw.byteOffset, raw.byteLength);
    const size = view.getUint16(0, true);
    return new InputMessage(raw.slice(HEADER_SIZE, HEADER_SIZE + size));
  }

  get remaining() {
    return this.buffer.length - this.position;
  }

  canRead(bytes) {
    return this.remaining >= bytes;
  }

  getByte() {
    const value = this.view.getUint8(this.position);
    this.position += 1;
    return value;
  }

  getU16() {
    const value = this.view.getUint16(this.position, true);
    this.position += 2;
    return value;
  }

  getU32() {
    const value = this.view.getUint32(this.position, true);
    this.position += 4;
    return value;
  }

  getU64() {
    const value = this.view.getBigUint64(this.position, true);
    this.position += 8;
    return Number(value);
  }

  getString() {
    const size = this.getU16();
    let text = '';
    for (let i = 0; i < size; i++) {
      text += String.fromCharCode(this.view.getUint8(this.position + i));
    }
    this.position += size;
    return text;
  }

  peekByte() {
    return this.view.getUint8(this.position);
  }
}
