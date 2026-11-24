package dns

import "encoding/binary"

const headerSize = 12

// questionType returns the QTYPE of the first question in a DNS message.
func questionType(msg []byte) (uint16, bool) {
	if len(msg) < headerSize || binary.BigEndian.Uint16(msg[4:6]) == 0 {
		return 0, false
	}

	i := headerSize
	for {
		if i >= len(msg) {
			return 0, false
		}
		l := int(msg[i])
		i++
		if l == 0 {
			break
		}
		// compression pointers are not expected in a query's question
		if l&0xC0 != 0 {
			return 0, false
		}
		i += l
	}

	if i+2 > len(msg) {
		return 0, false
	}
	return binary.BigEndian.Uint16(msg[i:]), true
}
