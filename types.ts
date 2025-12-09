import { Point, CurveParams } from './utils/ecc';

export interface LogEntry {
  id: string;
  step: string;
  detail: string;
}

export interface AppState {
  curve: CurveParams;
  privateKey: bigint | null;
  publicKey: Point | null;
}
