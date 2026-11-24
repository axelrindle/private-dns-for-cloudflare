package dns

import (
	"errors"
	"log"
	"net"
	"net/netip"
)

var listenAddrs = []netip.Addr{
	netip.MustParseAddr("127.0.0.1"),
	netip.IPv6Loopback(),
}

// Start binds all listeners and starts serving. A forwarder is meant to be
// started once; after Close, create a new one with New.
func (f *DohForwarder) Start() error {
	cap := len(listenAddrs)
	f.tcp = make([]*net.TCPListener, 0, cap)
	f.udp = make([]*net.UDPConn, 0, cap)

	for _, ip := range listenAddrs {
		addr := netip.AddrPortFrom(ip, f.port)

		tcp, err := net.ListenTCP("tcp", net.TCPAddrFromAddrPort(addr))
		if err != nil {
			f.Close()
			return err
		}
		f.tcp = append(f.tcp, tcp)

		udp, err := net.ListenUDP("udp", net.UDPAddrFromAddrPort(addr))
		if err != nil {
			f.Close()
			return err
		}
		f.udp = append(f.udp, udp)

		log.Printf("listening on %s", addr)
	}

	for _, l := range f.tcp {
		go f.serveTcp(l)
	}
	for _, c := range f.udp {
		go f.serveUdp(c)
	}

	return nil
}

func (f *DohForwarder) serveTcp(l *net.TCPListener) {
	for {
		c, err := l.Accept()
		if err != nil {
			if errors.Is(err, net.ErrClosed) {
				return
			}
			log.Printf("TCP accept: %v", err)
			continue
		}

		go f.handleTcp(c)
	}
}

func (f *DohForwarder) serveUdp(conn *net.UDPConn) {
	for {
		buf := make([]byte, maxBufSize)
		n, addr, err := conn.ReadFromUDP(buf)
		if err != nil {
			if errors.Is(err, net.ErrClosed) {
				return
			}
			continue
		}

		go f.handleUdp(conn, buf[:n], addr)
	}
}

func (f *DohForwarder) Close() error {
	var errs []error

	var i int
	for _, l := range f.tcp {
		errs = append(errs, l.Close())
		i++
	}
	for _, c := range f.udp {
		errs = append(errs, c.Close())
		i++
	}

	log.Printf("closed %d listeners", i)

	f.tcp = nil
	f.udp = nil

	return errors.Join(errs...)
}
