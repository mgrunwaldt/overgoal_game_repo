
import { Connector } from "@starknet-react/core";
import { ControllerConnector } from "@cartridge/connector";
import { ControllerOptions } from "@cartridge/controller";
import { constants } from "starknet";

const { VITE_PUBLIC_DEPLOY_TYPE } = import.meta.env;

const CONTRACT_ADDRESS_GAME = '0x31b119987eeb1a6c0d13b029ad9a3c64856369dcdfd6e69d9af4c9fba6f507f'

const policies = {
  contracts: {
    [CONTRACT_ADDRESS_GAME]: {
      methods: [
        { name: "spawn_player", entrypoint: "spawn_player" },
        { name: "train", entrypoint: "train" },
        { name: "mine", entrypoint: "mine" },
        { name: "rest", entrypoint: "rest" },
      ],
    },
  },
}

const options: ControllerOptions = {
  chains: [
    {
      rpcUrl: "https://api.cartridge.gg/x/starknet/sepolia",
    },
  ],
  defaultChainId: VITE_PUBLIC_DEPLOY_TYPE === 'mainnet' ?  constants.StarknetChainId.SN_MAIN : constants.StarknetChainId.SN_SEPOLIA,
  policies,
  namespace: "full_starter_react",
  slot: "full-starter-react",
};

const cartridgeConnector = new ControllerConnector(
  options,
) as never as Connector;

export default cartridgeConnector;
