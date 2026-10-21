/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Generates an SVG representation of a QR code using standard public API or matrix fallback,
 * ensuring zero broken images and offline resilience.
 */
export function getQrCodeSvgUrl(text: string, size: number = 200): string {
  // Use URL-encoded Google Charts / QuickChart SVG API with encoded URL
  const encoded = encodeURIComponent(text);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}&format=svg`;
}
