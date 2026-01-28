declare module 'circomlibjs' {
  export function buildPoseidon(): Promise<any>;
  export function buildBabyjub(): Promise<any>;
  export function buildMimc7(): Promise<any>;
  export function buildMimcsponge(): Promise<any>;
  export function buildPedersenHash(): Promise<any>;
  export function buildBn128(): Promise<any>;
}

declare module 'snarkjs' {
  export namespace groth16 {
    export function fullProve(
      input: any,
      wasmFile: string,
      zkeyFileName: string
    ): Promise<{ proof: any; publicSignals: string[] }>;
    
    export function verify(
      vk: any,
      publicSignals: string[],
      proof: any
    ): Promise<boolean>;
  }
}
