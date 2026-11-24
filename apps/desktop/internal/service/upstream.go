package service

import (
	"context"
	"crypto/rand"
	"encoding/binary"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/axelrindle/private-dns-for-cloudflare/internal/config"
)

var ErrUpstreamUnreachable = errors.New("failed to connect to upstream")

const verifyTimeout = 10 * time.Second

// UpstreamService checks that an endpoint is a private DNS worker before it gets saved.
type UpstreamService struct{}

// Verify calls the worker's /info route with a fresh nonce and expects it echoed back.
// Returns the worker version on success. insecure skips TLS certificate validation.
func (u UpstreamService) Verify(ctx context.Context, endpoint string, token string, insecure bool) (string, error) {
	nonce, err := uuidv7()
	if err != nil {
		return "", err
	}

	ctx, cancel := context.WithTimeout(ctx, verifyTimeout)
	defer cancel()

	url := strings.TrimRight(endpoint, "/") + "/.well-known/info"
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		log.Print("invalid upstream request: ", err)
		return "", ErrUpstreamUnreachable
	}
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", token))
	req.Header.Set("Cfpd-Nonce", nonce)

	res, err := config.NewHTTPClient(insecure).Do(req)
	if err != nil {
		log.Print("upstream request failed: ", err)
		return "", ErrUpstreamUnreachable
	}
	defer res.Body.Close()

	if res.StatusCode != http.StatusOK {
		log.Print("invalid upstream response: ", res.StatusCode)
		return "", ErrUpstreamUnreachable
	}

	var data struct {
		Version string `json:"version"`
		Nonce   string `json:"nonce"`
	}
	if err := json.NewDecoder(io.LimitReader(res.Body, 64<<10)).Decode(&data); err != nil {
		log.Print("invalid upstream body: ", err)
		return "", ErrUpstreamUnreachable
	}

	if data.Nonce != nonce {
		log.Print("upstream nonce mismatch")
		return "", ErrUpstreamUnreachable
	}

	return data.Version, nil
}

// uuidv7 builds an RFC 9562 version 7 UUID, which the worker validates the nonce against.
func uuidv7() (string, error) {
	var b [16]byte
	if _, err := rand.Read(b[6:]); err != nil {
		return "", err
	}

	var ts [8]byte
	binary.BigEndian.PutUint64(ts[:], uint64(time.Now().UnixMilli()))
	copy(b[:6], ts[2:])

	b[6] = (b[6] & 0x0f) | 0x70 // version 7
	b[8] = (b[8] & 0x3f) | 0x80 // variant 10

	h := hex.EncodeToString(b[:])
	return h[0:8] + "-" + h[8:12] + "-" + h[12:16] + "-" + h[16:20] + "-" + h[20:32], nil
}
