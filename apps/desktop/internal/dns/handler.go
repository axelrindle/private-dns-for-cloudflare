package dns

import (
	"encoding/binary"
	"io"
	"log"
	"net"
)

func (f *DohForwarder) handleTcp(c net.Conn) {
	defer c.Close()

	for {
		var prefixBuf [2]byte
		_, err := io.ReadFull(c, prefixBuf[:])
		if err != nil {
			if err != io.EOF {
				log.Printf("read length: %v", err)
			}
			return
		}

		msg := make([]byte, binary.BigEndian.Uint16(prefixBuf[:]))
		if _, err := io.ReadFull(c, msg); err != nil {
			log.Printf("read message: %v", err)
			return
		}

		answer, err := f.query(msg)
		if err != nil {
			log.Printf("DoH query: %v", err)
			return
		}

		l := len(answer)
		out := make([]byte, 2+l)
		binary.BigEndian.PutUint16(out, uint16(l))
		copy(out[2:], answer)
		if _, err := c.Write(out); err != nil {
			log.Printf("failed to respond: %v", err)
			return
		}
	}
}

func (f *DohForwarder) handleUdp(conn *net.UDPConn, msg []byte, addr *net.UDPAddr) {
	answer, err := f.query(msg)
	if err != nil {
		log.Printf("DoH query: %v", err)
		return
	}

	_, err = conn.WriteToUDP(answer, addr)
	if err != nil {
		log.Printf("UDP write: %v", err)
	}
}
