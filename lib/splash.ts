/*
  The iOS launch images.

  iOS only uses an apple-touch-startup-image whose media query matches
  the device exactly. When nothing matches it paints the manifest's
  background_color instead, and a single hardcoded colour there is how
  you end up with a light splash in front of a dark app no matter what
  the theme is set to.

  So: every current iPhone gets its own image, in both themes, and the
  manifest colour follows the theme too. One list, shared by the
  generator and the layout, because two lists would drift and the
  failure is invisible until someone with the wrong phone complains.

  Portrait only. The manifest locks orientation, so a landscape launch
  image would never be chosen.
*/

export type Device = {
  name: string;
  /* CSS pixels. */
  width: number;
  height: number;
  ratio: number;
};

export const DEVICES: Device[] = [
  { name: "se", width: 375, height: 667, ratio: 2 },
  { name: "8plus", width: 414, height: 736, ratio: 3 },
  { name: "x", width: 375, height: 812, ratio: 3 },
  { name: "xr", width: 414, height: 896, ratio: 2 },
  { name: "xsmax", width: 414, height: 896, ratio: 3 },
  { name: "12", width: 390, height: 844, ratio: 3 },
  { name: "12promax", width: 428, height: 926, ratio: 3 },
  { name: "14pro", width: 393, height: 852, ratio: 3 },
  { name: "14promax", width: 430, height: 932, ratio: 3 },
  { name: "16pro", width: 402, height: 874, ratio: 3 },
  { name: "16promax", width: 440, height: 956, ratio: 3 },
];

export function splashFile(device: Device, theme: "light" | "dark"): string {
  return `/splash-${device.name}-${theme}.png`;
}

/* Device pixels, which is what the image has to be. */
export function splashPixels(device: Device): { w: number; h: number } {
  return { w: device.width * device.ratio, h: device.height * device.ratio };
}

/*
  The media query iOS matches on. Both orientations of the same panel
  are not needed, but the ratio is: two devices share 414x896 and differ
  only in it.
*/
export function splashMedia(device: Device): string {
  return `(device-width: ${device.width}px) and (device-height: ${device.height}px) and (-webkit-device-pixel-ratio: ${device.ratio}) and (orientation: portrait)`;
}
