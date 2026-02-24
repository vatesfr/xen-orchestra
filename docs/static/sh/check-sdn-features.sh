#!/bin/bash

# Check XCP-ng pools SDN Controller features usage

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

if [ $# -eq 0 ]; then
  echo "Usage: $0 <pool-master-ip1> [pool-master-ip2] [pool-master-ip3] ..."
  echo "Example: $0 10.1.1.200 10.1.1.201"
  exit 1
fi

echo "================================================"
echo "XCP-ng SDN Controller Feature Usage Check"
echo "================================================"
echo ""

declare -A results

# Iterate over provided pool masters IPs
for ip in "$@"; do
  echo -e "${YELLOW}Checking pool master: $ip${NC}"

  ssh_command='
    set +e
    has_tunnels=false
    has_openflow=false
    has_sdn_controller=false
    openssl_version=$(openssl version | cut -d" " -f 2)

    # Check if SDN controller is configured
    sdn_controller_output=$(xe sdn-controller-list 2>/dev/null || echo "")
    if [ -n "$sdn_controller_output" ]; then
        has_sdn_controller=true
    fi

    # Check for tunnels
    tunnel_count=$(xe pif-list | grep "device ( RO): tunnel" | sort -u | wc -l || true)
    if [ "$tunnel_count" -gt 0 ]; then
        has_tunnels=true
    fi

    # Check for OpenFlow rules
    openflow_count=0
    for vif in $(xe vif-list | grep "^uuid" | cut -d":" -f 2 | tr -d " "); do
        if xe vif-param-list uuid=$vif 2>/dev/null | grep -q "xo:sdn-controller:of-rules"; then
            openflow_count=$((openflow_count + 1))
        fi
    done

    if [ "$openflow_count" -gt 0 ]; then
        has_openflow=true
    fi

    # Output results in parseable format
    echo "$openssl_version|$has_sdn_controller|$has_tunnels|$has_openflow|$tunnel_count|$openflow_count"
    '

  if result=$(ssh -o ConnectTimeout=10 -o BatchMode=no root@"$ip" "$ssh_command" 2>/dev/null); then
    IFS='|' read -r openssl_version has_tunnels has_openflow tunnel_count openflow_count <<<"$result"

    results["$ip"]="$openssl_version|$has_tunnels|$has_openflow|$tunnel_count|$openflow_count"
    echo -e "  ${GREEN}✓${NC} Connection successful"
  else
    echo -e "  ${RED}✗${NC} Failed to connect or execute commands"
    results["$ip"]="error|error|error|0|0"
  fi
  echo ""
done

# Print summary
echo "================================================"
echo "SUMMARY"
echo "================================================"
echo ""
printf "%-20s %-20s %-20s %-20s %-20s\n" "Pool Master" "OpenSSL version" "SDN Controller" "Tunnel VIFs" "OpenFlow Rules"
printf "%-20s %-20s %-20s %-20s %-20s\n" "-------------------" "-------------------" "-------------------" "-------------------" "-------------------"

needs_update=false

for ip in "$@"; do
  if [ -z "${results[$ip]:-}" ]; then
    continue
  fi

  IFS='|' read -r openssl_version has_sdn_controller has_tunnels has_openflow tunnel_count openflow_count <<<"${results[$ip]}"

  if [ "$has_sdn_controller" = "error" ]; then
    printf "%-20s ${RED}%-20s %-20s %-20s %-20s${NC}\n" "$ip" "ERROR" "ERROR" "ERROR" "ERROR"
    continue
  fi

  # Format SDN controller status
  if [ "$has_sdn_controller" = "true" ]; then
    sdn_status="${RED}CONFIGURED${NC}"
    needs_update=true
  else
    sdn_status="${GREEN}NOT CONFIGURED${NC}"
  fi

  # Format tunnel status
  if [ "$has_tunnels" = "true" ]; then
    tunnel_status="${RED}YES ($tunnel_count VIFs)${NC}"
    needs_update=true
  else
    tunnel_status="${GREEN}NO${NC}"
  fi

  # Format OpenFlow status
  if [ "$has_openflow" = "true" ]; then
    openflow_status="${RED}YES ($openflow_count VIFs)${NC}"
    needs_update=true
  else
    openflow_status="${GREEN}NO${NC}"
  fi

  printf "%-20s %-20s %-31s %-31s %-30s\n" "$ip" "$openssl_version" "$(echo -e "$sdn_status")" "$(echo -e "$tunnel_status")" "$(echo -e "$openflow_status")"
done

echo ""
echo "================================================"

if [ "$needs_update" = "true" ]; then
  echo -e "${RED}ACTION REQUIRED${NC}"
  echo ""
  echo "One or more pools are using SDN Controller features."
  echo "These pools require updated certificates before upgrading to OpenSSL 3."
  echo ""
  echo "Please follow the certificate regeneration procedure for affected pools."
else
  echo -e "${GREEN}✓ All clear${NC}"
  echo ""
  echo "No pools are using SDN Controller features."
fi

echo "================================================"
