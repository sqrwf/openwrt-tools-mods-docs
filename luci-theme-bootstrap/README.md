# luci-theme-bootstrap CSS Modification

## Rationale

*luci-theme-bootstrap*, after inverting the images from *luci-app-statistic* in dark mode, inexplicably rotates their hue by only 150 degrees instead of 180, resulting in all colors being 30 degrees off.

## Modifications

- Replaces "150deg" with "180deg". Seriously, it changes one byte.

## Prerequisites

- `luci-theme-bootstrap`, natch.

## Usage

- Upload the file(s) from this repository. It's probably a good idea to backup any files that will be overwritten.

## Notes

- None.

## Why Isn’t Any of This Upstream?

[I raised the issue](https://github.com/openwrt/luci/issues/7240), but it was quickly brushed off with an off-handed comment. It seems that fixing cosmetic issues in a UX-related package isn't something the maintainers think is worth their attention.

This directory is part of the [*OpenWrt Tools, Modifications, and Documentation*](https://github.com/sqrwf/openwrt-tools-mods-docs) collection repository. For more context, check the repository’s README.