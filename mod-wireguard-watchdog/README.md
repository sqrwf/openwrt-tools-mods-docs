# wireguard-watchdog Modification

## Rationale

The timeout threshold for WireGuard in the original `wireguard_watchdog` script is [hardcoded at 150 seconds](https://github.com/openwrt/openwrt/blob/7aa3dfdbda829c04475cffbd6708f1ff96e4849b/package/network/utils/wireguard-tools/files/wireguard_watchdog#L56) which can be, and regularly is, exceeded by healthy connections. According to descriptions of the WireGuard protocol, a handshake can happen as late as (180+`persistent_keepalive`) seconds.

## Modifications

- Replaces hardcoded timeout value with one that is calculated from protocol and `persistent_keepalive` (with a tiny grace period)

## Prerequisites

- None, technically. While `wireguard_watchdog` comes with `wireguard-tools`, it is not necessesary to install the package, the script will work standalone. Of course, none of this makes sense without WireGuard on the system.

## Usage

- Upload the file(s) from this repository. It's probably a good idea to backup any files that will be overwritten.

## Notes

- None

## Why Isn’t Any of This Upstream?

This directory is part of the [*OpenWrt Tools, Modifications, and Documentation*](https://github.com/sqrwf/openwrt-tools-mods-docs) collection repository. For more context, check the repository’s README.