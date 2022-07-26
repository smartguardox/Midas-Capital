import { ethers } from 'ethers';
import FLYWHEEL_ABI from '../abi/flywheel.json';
import CTOKEN_ABI from '../abi/ctoken.json';
import { flywheels } from '../assets';
import { config, supabase, SupportedChains } from '../config';

const updateFlyWheelData = async (chainId: SupportedChains, rpcUrl: string) => {
  try {
    const provider = new ethers.providers.StaticJsonRpcProvider(rpcUrl);
    const supportedFlywheels = flywheels[chainId];

    for (const flywheel of supportedFlywheels) {
      const flywheelContract = new ethers.Contract(flywheel, FLYWHEEL_ABI, provider);
      const strategies = await flywheelContract.getAllStrategies();
      for (const strategy of strategies) {
        try {
          const pluginContract = new ethers.Contract(strategy, CTOKEN_ABI, provider);
          const state = await flywheelContract.strategyState(strategy);
          const flywheelAsset = await flywheelContract.rewardToken();
          const totalSupply = await pluginContract.totalSupply();
          const underlyingAsset = await pluginContract.underlying();
          const index = state['index'];
          const pricePerShare = !totalSupply.eq('0') ? index / totalSupply : 0;
          const { error } = await supabase.from(config.supabaseFlywheelTableName).insert([
            {
              totalAssets: index.toString(),
              totalSupply: totalSupply.toString(),
              pricePerShare: pricePerShare.toString(),
              rewardAddress: flywheelAsset.toLowerCase(),
              pluginAddress: strategy.toLowerCase(),
              underlyingAddress: underlyingAsset.toLowerCase(),
              chain: chainId,
            },
          ]);
          if (error) {
            console.log(
              `Error occurred during savin data for flywheel's plugin ${strategy}: ${error.message}`
            );
          } else {
            console.log(`Successfully saved data for flywheel's plugin ${strategy}`);
          }
        } catch (err) {
          console.log(err);
        }
      }
    }
  } catch (err) {
    console.log(err);
  }
};

export default updateFlyWheelData;