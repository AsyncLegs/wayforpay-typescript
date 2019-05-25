import { Actions } from "./actions";

export interface Fields {
  [key: string]: string | number;
  transactionType: Actions;
  merchantAccount: string;
  merchantSignature: string;
  apiVersion: number;
  orderReference: string;
}
