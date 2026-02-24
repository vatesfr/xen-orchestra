#!/bin/bash -e
# Navigate to the SDN Controller data directory
cd /var/lib/xo-server/data/sdn-controller/

# dumping Openssl version for debugging purposes
openssl version

# Backup existing certificates
today=$(date +%Y%m%d)
mkdir -p $today-backup
mv ca-cert.pem client-key.pem client-cert.pem $today-backup 2>/dev/null || true

# Generate CA private key
openssl genrsa -out ca-key.pem 4096

# Create a temporary config file for CA extensions
cat >ca-extensions.cnf <<'EOF'
[req]
distinguished_name = req_distinguished_name
x509_extensions = v3_ca

[req_distinguished_name]

[v3_ca]
basicConstraints = critical,CA:TRUE
keyUsage = critical,keyCertSign,cRLSign
subjectKeyIdentifier = hash
EOF

# Generate CA certificate with extensions
openssl req -new -x509 -days 10000 -key ca-key.pem -out ca-cert.pem \
  -subj "/C=XX/L=Default City/O=Default Company LTD" \
  -config ca-extensions.cnf

# Generate client private key
openssl genrsa -out client-key.pem 4096

# Generate client certificate signing request (CSR)
openssl req -new -key client-key.pem -out client.csr \
  -subj "/C=XX/L=Default City/O=Default Company LTD/CN=SDN Controller Client"

# Sign the client certificate with the CA
openssl x509 -req -in client.csr -CA ca-cert.pem -CAkey ca-key.pem \
  -CAcreateserial -out client-cert.pem -days 10000 -sha256

# Clean up temporary files
rm ca-extensions.cnf client.csr ca-cert.srl

# Verify the certificates
echo "=== Verifying CA Certificate ==="
openssl x509 -in ca-cert.pem -noout -text | grep -A 2 "Basic Constraints"

echo ""
echo "=== Verifying Client Certificate Chain ==="
openssl verify -CAfile ca-cert.pem client-cert.pem

echo ""
echo "=== Certificate Files Generated ==="
ls -lh ca-cert.pem client-key.pem client-cert.pem

# Set appropriate permissions
chmod 644 *.pem
