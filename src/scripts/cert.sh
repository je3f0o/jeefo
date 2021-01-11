#!/bin/bash

echo "Empty ENTER key will be default $default_host"
echo "Enter hostname:"
read host
[ -z $host ] && host=localhost

base_dir="certs/$host"
mkdir -p "$base_dir"

csr=certificate_signing_request
ssc=self_signed_certificate

# Private key
openssl genrsa \
        -out "$base_dir/rsa.key" 2048

# Certificate Signing Request
openssl req -new -sha256 \
        -key "$base_dir/rsa.key" \
        -out "$base_dir/$csr" \
        -subj "/C=MN/ST=Sukhbaatar Duureg/L=Ulaanbaatar/O=LBC/OU=Jeefo Framework/CN=$host"

# Self-signed certificate
openssl x509 -req \
        -in "$base_dir/$csr" \
        -signkey "$base_dir/rsa.key" \
        -out "$base_dir/$ssc" \
        -days 365
