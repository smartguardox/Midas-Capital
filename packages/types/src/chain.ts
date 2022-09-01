import { BigNumber } from "ethers";

import { DeployedPlugins } from "./config";
import { IrmTypes, OracleTypes, SupportedChains } from "./enums";
import { FundingStrategy, LiquidationDefaults, RedemptionStrategy } from "./liquidation";

export type SupportedAsset = {
  symbol: string;
  underlying: string;
  name: string;
  decimals: number;
  extraDocs?: string;
  disabled?: boolean;
  oracle?: OracleTypes;
  simplePriceOracleAssetPrice?: BigNumber;
};
export type BlockExplorer = {
  name: string;
  url: string;
};

export interface ChainMetadata {
  chainIdHex: string;
  shortName: string;
  name: string;
  img: string;
  rpcUrls: { [key: string]: string; default: string };
  blockExplorerUrls: {
    [key: string]: BlockExplorer;
    default: BlockExplorer;
  };
  nativeCurrency: {
    symbol: string;
    name: string;
  };
  wrappedNativeCurrency: {
    symbol: string;
    address: string;
    name: string;
    decimals: number;
    color: string;
    overlayTextColor: string;
    logoURL: string;
  };
  testnet?: boolean | undefined;
}

export type ChainParams = {
  blocksPerYear: BigNumber;
  cgId: string;
  metadata: ChainMetadata;
};

export type ChainAddresses = {
  W_TOKEN: string;
  STABLE_TOKEN: string;
  W_BTC_TOKEN: string;
  W_TOKEN_USD_CHAINLINK_PRICE_FEED: string;
  UNISWAP_V2_ROUTER: string;
  UNISWAP_V2_FACTORY: string;
  PAIR_INIT_HASH: string;
};

export type ChainSupportedAssets = {
  [chain in SupportedChains]: SupportedAsset[];
};

export type ChainConfig = {
  chainId: number;
  chainAddresses: ChainAddresses;
  assets: SupportedAsset[];
  irms: IrmTypes[];
  liquidationDefaults: LiquidationDefaults;
  oracles: OracleTypes[];
  specificParams: ChainParams;
  deployedPlugins: DeployedPlugins;
  redemptionStrategies: RedemptionStrategy;
  fundingStrategies: FundingStrategy;
  chainDeployments: ChainDeployment;
};

export type ChainDeployment = {
  [contractName: string]: {
    abi: any;
    address: string;
  };
};