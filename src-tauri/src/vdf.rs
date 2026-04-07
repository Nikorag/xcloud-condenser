/// Binary VDF reader/writer for Steam's shortcuts.vdf format.
/// Port of the TypeScript VDF implementation in lib/steam-tools.ts.
///
/// Binary VDF Format:
/// - 0x00 = Map (nested object)
/// - 0x01 = String (null-terminated)
/// - 0x02 = UInt32 (little-endian)
/// - 0x08 = End of map

use std::collections::BTreeMap;

const VDF_MAP: u8 = 0x00;
const VDF_STRING: u8 = 0x01;
const VDF_INT32: u8 = 0x02;
const VDF_END: u8 = 0x08;

#[derive(Debug, Clone)]
pub enum VdfValue {
    Map(BTreeMap<String, VdfValue>),
    String(String),
    Int32(u32),
}

impl VdfValue {
    pub fn as_map(&self) -> Option<&BTreeMap<String, VdfValue>> {
        if let VdfValue::Map(m) = self { Some(m) } else { None }
    }

    pub fn as_map_mut(&mut self) -> Option<&mut BTreeMap<String, VdfValue>> {
        if let VdfValue::Map(m) = self { Some(m) } else { None }
    }

    pub fn as_str(&self) -> Option<&str> {
        if let VdfValue::String(s) = self { Some(s) } else { None }
    }
}

// ============================================================================
// Reader
// ============================================================================

struct VdfReader<'a> {
    data: &'a [u8],
    offset: usize,
}

impl<'a> VdfReader<'a> {
    fn new(data: &'a [u8]) -> Self {
        Self { data, offset: 0 }
    }

    fn read_byte(&mut self) -> u8 {
        let b = self.data[self.offset];
        self.offset += 1;
        b
    }

    fn read_u32(&mut self) -> u32 {
        let val = u32::from_le_bytes([
            self.data[self.offset],
            self.data[self.offset + 1],
            self.data[self.offset + 2],
            self.data[self.offset + 3],
        ]);
        self.offset += 4;
        val
    }

    fn read_string(&mut self) -> String {
        let start = self.offset;
        while self.offset < self.data.len() && self.data[self.offset] != 0 {
            self.offset += 1;
        }
        let s = String::from_utf8_lossy(&self.data[start..self.offset]).to_string();
        self.offset += 1; // skip null terminator
        s
    }

    fn read_map(&mut self) -> BTreeMap<String, VdfValue> {
        let mut map = BTreeMap::new();

        while self.offset < self.data.len() {
            let vtype = self.read_byte();
            if vtype == VDF_END {
                break;
            }

            let key = self.read_string();
            let value = match vtype {
                VDF_MAP => VdfValue::Map(self.read_map()),
                VDF_STRING => VdfValue::String(self.read_string()),
                VDF_INT32 => VdfValue::Int32(self.read_u32()),
                _ => break,
            };
            map.insert(key, value);
        }

        map
    }
}

// ============================================================================
// Writer
// ============================================================================

struct VdfWriter {
    buf: Vec<u8>,
}

impl VdfWriter {
    fn new() -> Self {
        Self { buf: Vec::new() }
    }

    fn write_byte(&mut self, b: u8) {
        self.buf.push(b);
    }

    fn write_u32(&mut self, val: u32) {
        self.buf.extend_from_slice(&val.to_le_bytes());
    }

    fn write_string(&mut self, s: &str) {
        self.buf.extend_from_slice(s.as_bytes());
        self.buf.push(0);
    }

    fn write_map(&mut self, map: &BTreeMap<String, VdfValue>) {
        for (key, value) in map {
            match value {
                VdfValue::Map(m) => {
                    self.write_byte(VDF_MAP);
                    self.write_string(key);
                    self.write_map(m);
                }
                VdfValue::String(s) => {
                    self.write_byte(VDF_STRING);
                    self.write_string(key);
                    self.write_string(s);
                }
                VdfValue::Int32(n) => {
                    self.write_byte(VDF_INT32);
                    self.write_string(key);
                    self.write_u32(*n);
                }
            }
        }
        self.write_byte(VDF_END);
    }
}

// ============================================================================
// Public API
// ============================================================================

pub fn parse_shortcuts(data: &[u8]) -> BTreeMap<String, VdfValue> {
    let mut reader = VdfReader::new(data);
    reader.read_map()
}

pub fn write_shortcuts(map: &BTreeMap<String, VdfValue>) -> Vec<u8> {
    let mut writer = VdfWriter::new();
    writer.write_map(map);
    writer.buf
}
