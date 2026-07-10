declare module 'wav-decoder' {
  export interface DecodedWav {
    sampleRate: number;
    channelData: Float32Array[];
  }
  export function decode(buffer: ArrayBuffer | Uint8Array): Promise<DecodedWav>;
}
