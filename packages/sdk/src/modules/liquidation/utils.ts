import { TransactionRequest } from "@ethersproject/providers";
import { BigNumber, BigNumberish, utils } from "ethers";

import { FusePoolLens } from "../../../lib/contracts/typechain/FusePoolLens";
import { LiquidationKind } from "../../enums";
import { MidasBase } from "../../MidasSdk";
import { FuseAsset } from "../../types";

export const SCALE_FACTOR_ONE_18_WEI = BigNumber.from(10).pow(18);
export const SCALE_FACTOR_UNDERLYING_DECIMALS = (asset: FuseAsset) =>
  BigNumber.from(10).pow(18 - asset.underlyingDecimals.toNumber());

export type ExtendedFusePoolAssetStructOutput = FusePoolLens.FusePoolAssetStructOutput & {
  borrowBalanceWei?: BigNumber;
  supplyBalanceWei?: BigNumber;
};

export type EncodedLiquidationTx = {
  method: string;
  args: Array<any>;
  value: BigNumber;
};

export type FusePoolUserWithAssets = {
  assets: ExtendedFusePoolAssetStructOutput[];
  account: string;
  totalBorrow: BigNumberish;
  totalCollateral: BigNumberish;
  health: BigNumberish;
  debt: Array<any>;
  collateral: Array<any>;
};

export type LiquidatablePool = {
  comptroller: string;
  liquidations: EncodedLiquidationTx[];
};

export type FusePoolUserStruct = {
  account: string;
  totalBorrow: BigNumberish;
  totalCollateral: BigNumberish;
  health: BigNumberish;
};

export type PublicPoolUserWithData = {
  comptroller: string;
  users: FusePoolUserStruct[];
  closeFactor: BigNumber;
  liquidationIncentive: BigNumber;
};

export async function fetchGasLimitForTransaction(fuse: MidasBase, method: string, tx: TransactionRequest) {
  try {
    return await fuse.provider.estimateGas(tx);
  } catch (error) {
    throw `Failed to estimate gas before signing and sending ${method} transaction: ${error}`;
  }
}

export const logLiquidation = (
  borrower: FusePoolUserWithAssets,
  exchangeToTokenAddress: string,
  liquidationAmount: BigNumber,
  liquidationTokenSymbol: string,
  liquidationKind: LiquidationKind,
  debtFundingStrategies: any[],
) => {
  console.log(
    `Gathered transaction data for safeLiquidate a ${liquidationTokenSymbol} borrow of kind ${liquidationKind}:
         - Liquidation Amount: ${utils.formatEther(liquidationAmount)}
         - Underlying Collateral Token: ${borrower.collateral[0].underlyingSymbol}
         - Underlying Debt Token: ${borrower.debt[0].underlyingSymbol}
         - Funding the liquidation with: ${debtFundingStrategies}
         - Exchanging liquidated tokens to: ${exchangeToTokenAddress}
         `
  );
};
