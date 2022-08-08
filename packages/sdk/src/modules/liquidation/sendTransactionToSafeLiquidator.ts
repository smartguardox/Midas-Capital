import { TransactionRequest } from "@ethersproject/providers";
import { BigNumber, Wallet } from "ethers";

import { MidasBase } from "../../MidasSdk";

import { fetchGasLimitForTransaction } from "./utils";

export default async function sendTransactionToSafeLiquidator(
  fuse: MidasBase,
  method: string | any,
  params: Array<any> | any,
  value: number | BigNumber
) {
  // Build data
  const data = fuse.contracts.FuseSafeLiquidator.interface.encodeFunctionData(method, params);
  const txCount = await fuse.provider.getTransactionCount(process.env.ETHEREUM_ADMIN_ACCOUNT!);
  const signer = new Wallet(process.env.ETHEREUM_ADMIN_PRIVATE_KEY!, fuse.provider);

  // Build transaction
  const tx = {
    from: process.env.ETHEREUM_ADMIN_ACCOUNT,
    to: fuse.contracts.FuseSafeLiquidator.address,  // "0x46113fa3A272b415eA71b415b810761eA2491Bc2",
    value: value,
    data: data,
    nonce: txCount,
  };

  // Estimate gas for transaction
  const gasLimit = await fetchGasLimitForTransaction(fuse, method, tx);
  const txRequest: TransactionRequest = {
    ...tx,
    gasLimit: gasLimit,
  };

  if (process.env.NODE_ENV !== "production") console.log("Signing and sending", method, "transaction:", tx);

  let sentTx;
  // Sign transaction
  // Send transaction
  try {
    sentTx = await signer.sendTransaction(txRequest);
  } catch (error) {
    throw `Error sending ${method}, transaction: ${error}`;
  }
  console.log("Successfully sent", method, "transaction hash:", sentTx.hash);
  return sentTx;
}
