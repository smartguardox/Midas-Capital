import { JsonRpcProvider, Web3Provider } from '@ethersproject/providers';
import { Fuse } from '@midas-capital/sdk';

import { NETWORK_DATA } from '@ui/networkData/index';

export function providerURLForChain(chainId: number) {
  const network = Object.values(NETWORK_DATA).find((each) => each.chainId === chainId);
  if (!network) {
    throw new Error(`Unable to get providerUrlForChain() for chainId: ${chainId}`);
  }

  return network.rpcUrls.default;
}

export const initFuseWithProviders = (
  provider: JsonRpcProvider | Web3Provider,
  chainId: number
): Fuse => {
  const fuse = new Fuse(provider, chainId);
  fuse.contracts.FusePoolLens = fuse.contracts.FusePoolLens.connect(
    new JsonRpcProvider(providerURLForChain(chainId), 'any')
  );

  return fuse;
};
