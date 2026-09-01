package main

import (
	"crypto/rand"
	"crypto/rsa"
	"crypto/tls"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/json"
	"flag"
	"log"
	"math/big"
	"net"
	"net/http"
	"os"
	"time"

	"tailscale.com/derp/derpserver"
	"tailscale.com/net/stun"
	"tailscale.com/tailcfg"
	"tailscale.com/types/key"
)

func generateSelfSignedCert() (tls.Certificate, error) {
	priv, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		return tls.Certificate{}, err
	}

	template := x509.Certificate{
		SerialNumber: big.NewInt(1),
		Subject: pkix.Name{
			Organization: []string{"Tailcat Test DERP"},
			CommonName:   "derper",
		},
		DNSNames:              []string{"derper", "localhost"},
		IPAddresses:           []net.IP{net.ParseIP("127.0.0.1"), net.ParseIP("0.0.0.0")},
		NotBefore:             time.Now().Add(-time.Hour),
		NotAfter:              time.Now().Add(365 * 24 * time.Hour),
		KeyUsage:              x509.KeyUsageKeyEncipherment | x509.KeyUsageDigitalSignature,
		ExtKeyUsage:           []x509.ExtKeyUsage{x509.ExtKeyUsageServerAuth},
		BasicConstraintsValid: true,
	}

	derBytes, err := x509.CreateCertificate(rand.Reader, &template, &template, &priv.PublicKey, priv)
	if err != nil {
		return tls.Certificate{}, err
	}

	return tls.Certificate{
		Certificate: [][]byte{derBytes},
		PrivateKey:  priv,
	}, nil
}

func main() {
	httpPort := flag.String("http", ":3340", "Port for DERP and derpmap.json")
	stunPort := flag.Int("stun", 3478, "UDP port for STUN")
	flag.Parse()

	log.Println("Starting local test DERP relay server...")

	// 1. Initialize DERP server
	nodeKey := key.NewNode()
	derpServer := derpserver.New(nodeKey, log.Printf)
	derpHandler := derpserver.Handler(derpServer)

	// 2. Start UDP STUN responder
	stunAddr := &net.UDPAddr{Port: *stunPort}
	stunConn, err := net.ListenUDP("udp4", stunAddr)
	if err != nil {
		log.Fatalf("Failed to start STUN listener: %v", err)
	}
	defer stunConn.Close()
	log.Printf("STUN server listening on %v (UDP)", stunConn.LocalAddr())

	go func() {
		var buf [1500]byte
		for {
			n, src, err := stunConn.ReadFromUDPAddrPort(buf[:])
			if err != nil {
				return
			}
			txid, err := stun.ParseBindingRequest(buf[:n])
			if err != nil {
				continue
			}
			stunConn.WriteToUDPAddrPort(stun.Response(txid, src), src)
		}
	}()

	// 3. Setup HTTP Handler
	mux := http.NewServeMux()
	mux.Handle("/derp", derpHandler)
	mux.HandleFunc("/derpmap.json", func(w http.ResponseWriter, r *http.Request) {
		derpMap := &tailcfg.DERPMap{
			Regions: map[tailcfg.DERPRegionID]*tailcfg.DERPRegion{
				tailcfg.DERPRegionID(900): {
					RegionID:   900,
					RegionCode: "local",
					RegionName: "Docker Local DERP",
					Nodes: []*tailcfg.DERPNode{
						{
							Name:             "local-900",
							RegionID:         900,
							HostName:         "derper",
							IPv6:             "none",
							DERPPort:         3340,
							STUNPort:         *stunPort,
							InsecureForTests: true,
						},
					},
				},
				tailcfg.DERPRegionID(302): {
					RegionID:   302,
					RegionCode: "sfo",
					RegionName: "San Francisco",
					Nodes: []*tailcfg.DERPNode{
						{
							Name:             "sfo-302",
							RegionID:         302,
							HostName:         "derper",
							IPv6:             "none",
							DERPPort:         3340,
							STUNPort:         *stunPort,
							InsecureForTests: true,
						},
					},
				},
			},
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(derpMap)
	})

	mux.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok"))
	})

	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/" || r.URL.Path == "/derp" {
			derpHandler.ServeHTTP(w, r)
			return
		}
		http.NotFound(w, r)
	})

	// Also serve plain HTTP on :3341 for derpmap.json and healthz
	go func() {
		httpMux := http.NewServeMux()
		httpMux.HandleFunc("/derpmap.json", func(w http.ResponseWriter, r *http.Request) {
			mux.ServeHTTP(w, r)
		})
		httpMux.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write([]byte("ok"))
		})
		_ = http.ListenAndServe(":3341", httpMux)
	}()

	cert, err := generateSelfSignedCert()
	if err != nil {
		log.Fatalf("Failed to generate TLS cert: %v", err)
	}

	tlsConfig := &tls.Config{
		Certificates: []tls.Certificate{cert},
	}

	ln, err := net.Listen("tcp", *httpPort)
	if err != nil {
		log.Fatalf("Failed to listen on %s: %v", *httpPort, err)
	}
	tlsLn := tls.NewListener(ln, tlsConfig)

	log.Printf("DERP TLS server listening on %s (HTTPS/DERP), HTTP on :3341", *httpPort)
	if err := http.Serve(tlsLn, mux); err != nil && err != http.ErrServerClosed {
		log.Fatalf("Server error: %v", err)
		os.Exit(1)
	}
}
