package dns

import (
	"bytes"
	"fmt"
	"io"
	"log"
	"net/http"
)

func (f *DohForwarder) query(msg []byte) ([]byte, error) {
	if f.rec != nil {
		if qtype, ok := questionType(msg); ok {
			f.rec.Record(qtype)
		}
	}

	req := &http.Request{
		Method: http.MethodPost,
		URL:    f.endpoint,
		Header: http.Header{
			"Authorization": []string{fmt.Sprintf("Bearer %s", f.token)},
			"Accept":        []string{"application/dns-message"},
			"Content-Type":  []string{"application/dns-message"},
		},
		Body: io.NopCloser(bytes.NewReader(msg)),
	}

	res, err := f.client.Do(req)
	if err != nil {
		log.Print("http error", err)
		return nil, err
	}
	defer res.Body.Close()

	if res.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status %d", res.StatusCode)
	}

	return io.ReadAll(io.LimitReader(res.Body, maxBufSize))
}
